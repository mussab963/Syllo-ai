import type { StoredCourse, StoredCourseFile } from "@/lib/local-courses";

export type StudyPace = "relaxed" | "balanced" | "focused";

export type StudySettings = {
  dailyMinutes: number;
  pace: StudyPace;
  blockMinutes: number;
};

export type StudyProgress = Record<string, number>;

export type StudySession = {
  id: string;
  courseId: string;
  courseName: string;
  fileId: string;
  fileName: string;
  startPage: number;
  endPage: number;
  pages: number;
  minutes: number;
};

export type StudyDay = {
  date: Date;
  label: string;
  minutes: number;
  pages: number;
  sessions: StudySession[];
};

const SETTINGS_KEY = "syllo_study_settings";
const PROGRESS_KEY = "syllo_study_progress";

export const DEFAULT_SETTINGS: StudySettings = {
  dailyMinutes: 60,
  pace: "balanced",
  blockMinutes: 25,
};

export function pagesPerHour(pace: StudyPace) {
  if (pace === "relaxed") return 12;
  if (pace === "focused") return 24;
  return 18;
}

export function loadStudySettings(): StudySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const value = window.localStorage.getItem(SETTINGS_KEY);
    if (!value) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(value) } as StudySettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStudySettings(settings: StudySettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadStudyProgress(): StudyProgress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "{}") as StudyProgress;
  } catch {
    return {};
  }
}

export function saveStudyProgress(progress: StudyProgress) {
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getTotalPages(courses: StoredCourse[]) {
  return courses.reduce(
    (total, course) => total + course.files.reduce((fileTotal, file) => fileTotal + (file.pageCount ?? 0), 0),
    0,
  );
}

export function getTotalRemainingPages(courses: StoredCourse[], progress: StudyProgress) {
  return courses.reduce((total, course) => {
    return total + course.files.reduce((fileTotal, file) => {
      if (!file.pageCount) return fileTotal;
      const done = Math.min(progress[file.id] ?? 0, file.pageCount);
      return fileTotal + Math.max(0, file.pageCount - done);
    }, 0);
  }, 0);
}

export function estimateTotalMinutes(courses: StoredCourse[], settings: StudySettings, progress: StudyProgress = {}) {
  const remaining = getTotalRemainingPages(courses, progress);
  return Math.ceil((remaining / pagesPerHour(settings.pace)) * 60);
}

export function buildStudyPlan(
  courses: StoredCourse[],
  settings: StudySettings,
  progress: StudyProgress,
  maxDays = 14,
): StudyDay[] {
  const queue = courses.flatMap((course) =>
    course.files
      .filter((file): file is StoredCourseFile & { pageCount: number } => Boolean(file.pageCount && file.pageCount > 0))
      .map((file) => ({
        courseId: course.id,
        courseName: course.name,
        file,
        cursor: Math.min((progress[file.id] ?? 0) + 1, file.pageCount + 1),
      })),
  );

  const hourlyPages = pagesPerHour(settings.pace);
  const days: StudyDay[] = [];
  let queueIndex = 0;

  for (let dayIndex = 0; dayIndex < maxDays; dayIndex += 1) {
    const targetPages = Math.max(1, Math.floor((settings.dailyMinutes / 60) * hourlyPages));
    let remainingCapacity = targetPages;
    const sessions: StudySession[] = [];

    while (remainingCapacity > 0 && queue.length > 0) {
      const active = queue[queueIndex % queue.length];
      if (!active) break;
      const remainingInFile = active.file.pageCount - active.cursor + 1;

      if (remainingInFile <= 0) {
        queue.splice(queueIndex % queue.length, 1);
        if (queue.length === 0) break;
        queueIndex %= queue.length;
        continue;
      }

      const maxBlockPages = Math.max(1, Math.floor((settings.blockMinutes / 60) * hourlyPages));
      const pages = Math.min(remainingCapacity, remainingInFile, maxBlockPages);
      const startPage = active.cursor;
      const endPage = startPage + pages - 1;
      const minutes = Math.max(5, Math.round((pages / hourlyPages) * 60));

      sessions.push({
        id: `${active.file.id}-${startPage}-${endPage}`,
        courseId: active.courseId,
        courseName: active.courseName,
        fileId: active.file.id,
        fileName: active.file.name,
        startPage,
        endPage,
        pages,
        minutes,
      });

      active.cursor = endPage + 1;
      remainingCapacity -= pages;
      queueIndex = queue.length ? (queueIndex + 1) % queue.length : 0;
    }

    if (sessions.length === 0) break;
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + dayIndex);
    days.push({
      date,
      label: dayIndex === 0 ? "Today" : dayIndex === 1 ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      minutes: sessions.reduce((sum, session) => sum + session.minutes, 0),
      pages: sessions.reduce((sum, session) => sum + session.pages, 0),
      sessions,
    });
  }

  return days;
}

export function completeSession(progress: StudyProgress, session: StudySession): StudyProgress {
  return {
    ...progress,
    [session.fileId]: Math.max(progress[session.fileId] ?? 0, session.endPage),
  };
}

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}
