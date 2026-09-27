export type StoredCourseFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  pageCount?: number;
};

export type StoredCourse = {
  id: string;
  name: string;
  createdAt: number;
  files: StoredCourseFile[];
};

const DB_NAME = "syllo-local";
const DB_VERSION = 1;
const STORE_NAME = "courses";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local storage."));
  });
}

export async function getCourses(): Promise<StoredCourse[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const courses = (request.result as StoredCourse[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(courses);
    };
    request.onerror = () => reject(request.error ?? new Error("Could not load your courses."));
    transaction.oncomplete = () => db.close();
  });
}

export async function getCourse(id: string): Promise<StoredCourse | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as StoredCourse | undefined);
    request.onerror = () => reject(request.error ?? new Error("Could not load this course."));
    transaction.oncomplete = () => db.close();
  });
}

export async function saveCourse(course: StoredCourse): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(course);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save your course."));
  });
}

export async function deleteCourse(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not delete your course."));
  });
}

export async function estimatePdfPages(blob: Blob): Promise<number | undefined> {
  const looksLikePdf = blob.type === "application/pdf" || (typeof File !== "undefined" && blob instanceof File && /\.pdf$/i.test(blob.name));
  if (!looksLikePdf) return undefined;
  try {
    const buffer = await blob.arrayBuffer();
    const text = new TextDecoder("latin1").decode(buffer);
    const counts = [...text.matchAll(/\/Count\s+(\d+)/g)]
      .map((match) => Number(match[1]))
      .filter((value) => Number.isFinite(value) && value > 0 && value < 10000);
    if (counts.length) return Math.max(...counts);

    const pageMatches = text.match(/\/Type\s*\/Page(?!s)\b/g);
    if (pageMatches?.length) return pageMatches.length;
  } catch {
    // Page count is enhancement-only; file storage still works without it.
  }
  return undefined;
}

export async function enrichCoursePageCounts(course: StoredCourse): Promise<StoredCourse> {
  let changed = false;
  const files = await Promise.all(
    course.files.map(async (file) => {
      if (file.pageCount || (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name))) return file;
      const pageCount = await estimatePdfPages(file.blob);
      if (!pageCount) return file;
      changed = true;
      return { ...file, pageCount };
    }),
  );

  const updated = changed ? { ...course, files } : course;
  if (changed) await saveCourse(updated);
  return updated;
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}
