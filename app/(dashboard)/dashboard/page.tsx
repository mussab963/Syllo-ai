"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Bot,
  Brain,
  CalendarRange,
  Clock3,
  FileText,
  Flame,
  FolderOpen,
  Layers3,
  Plus,
  Sparkles,
  Target,
  TimerReset,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SemesterOrbit } from "@/components/visuals/semester-orbit";
import { CourseUploadModal } from "@/components/course-upload-modal";
import { MetricCard } from "@/components/study/metric-card";
import { SectionHeading } from "@/components/study/section-heading";
import { deleteCourse, formatBytes, type StoredCourse } from "@/lib/local-courses";
import { useCourses } from "@/lib/use-courses";
import {
  DEFAULT_SETTINGS,
  buildStudyPlan,
  estimateTotalMinutes,
  formatMinutes,
  getTotalPages,
  getTotalRemainingPages,
  loadStudyProgress,
  loadStudySettings,
  type StudyProgress,
  type StudySettings,
} from "@/lib/study";

const STUDENT_NAME_KEY = "syllo_student_name";

const tips = [
  "Start with the smallest clear task, not the hardest-looking course.",
  "If you cannot explain a topic without notes, schedule a recall block for it.",
  "A 45-minute focused session is more useful than two distracted hours.",
];

export default function DashboardPage() {
  const router = useRouter();
  const { courses, setCourses, isLoading } = useCourses();
  const [name, setName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settings, setSettings] = useState<StudySettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<StudyProgress>({});

  useEffect(() => {
    const savedName = window.localStorage.getItem(STUDENT_NAME_KEY)?.trim();
    if (!savedName) {
      router.replace("/");
      return;
    }
    setName(savedName);
    setSettings(loadStudySettings());
    setProgress(loadStudyProgress());
  }, [router]);

  const totalFiles = courses.reduce((total, course) => total + course.files.length, 0);
  const totalPages = getTotalPages(courses);
  const remainingPages = getTotalRemainingPages(courses, progress);
  const studyMinutes = estimateTotalMinutes(courses, settings, progress);
  const plan = useMemo(() => buildStudyPlan(courses, settings, progress, 3), [courses, settings, progress]);
  const today = plan[0];
  const tip = tips[(new Date().getDate() - 1) % tips.length];
  const isArabicName = /[\u0600-\u06FF]/.test(name);

  async function handleDeleteCourse(id: string) {
    await deleteCourse(id);
    setCourses((current) => current.filter((course) => course.id !== id));
  }

  return (
    <div className="relative space-y-14 pb-24 sm:space-y-20">
      <div className="dashboard-light dashboard-light-a" aria-hidden="true" />
      <div className="dashboard-light dashboard-light-b" aria-hidden="true" />

      <motion.section
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="semester-hero relative isolate min-h-[420px] overflow-hidden rounded-[2.15rem] border border-white/80 bg-white/[0.76] p-6 shadow-[0_34px_110px_-70px_rgba(28,36,80,0.62)] backdrop-blur-2xl sm:p-9 lg:min-h-[480px]"
      >
        <div className="hero-grid" aria-hidden="true" />
        <div className="absolute -right-16 -top-20 hidden h-[520px] w-[600px] opacity-95 md:block" aria-hidden="true">
          <SemesterOrbit compact />
        </div>

        <motion.div
          animate={{ x: [0, 8, 0], y: [0, -8, 0], rotate: [-2, 1, -2] }}
          transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[20%] top-[18%] hidden rounded-2xl border border-white/80 bg-white/[0.8] px-4 py-3 shadow-xl backdrop-blur-xl xl:block"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted">Study left</p>
          <p className="mt-1 text-sm font-semibold text-ink">{formatMinutes(studyMinutes)}</p>
        </motion.div>

        <motion.div
          animate={{ x: [0, -7, 0], y: [0, 8, 0], rotate: [2, -1, 2] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-[16%] right-[6%] hidden rounded-2xl border border-white/80 bg-white/[0.8] px-4 py-3 shadow-xl backdrop-blur-xl lg:block"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-ink"><Layers3 className="h-4 w-4 text-accent" /> {remainingPages} pages remaining</div>
        </motion.div>

        <div className="relative z-10 flex min-h-[350px] max-w-2xl flex-col justify-end sm:min-h-[380px] md:max-w-[58%] lg:max-w-[54%]">
          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 170, damping: 16 }}
            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent/15 bg-accent/[0.08] px-3.5 py-2 text-sm font-semibold text-accent"
          >
            <motion.span animate={{ rotate: [0, 16, -10, 0], scale: [1, 1.22, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}><Sparkles className="h-4 w-4" /></motion.span>
            Welcome{name ? ", " : ""}<span className={isArabicName ? "font-arabic" : ""}>{name}</span>
          </motion.div>

          <h1 className="font-serif text-[clamp(3.1rem,7vw,5.7rem)] font-medium leading-[0.92] tracking-[-0.055em] text-ink">
            Know exactly
            <span className="block text-accent">what to study next.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-ink-muted sm:text-base sm:leading-7">
            Upload course files, see the real page workload, choose how much time you have, and let Syllo turn the semester into small daily sessions.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <motion.div whileHover={{ scale: 1.035, y: -2 }} whileTap={{ scale: 0.965 }}>
              <Button className="group h-12 w-full rounded-2xl px-5 shadow-[0_16px_35px_-20px_rgba(24,31,68,0.85)] sm:w-auto" size="lg" onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-90" /> Add course
              </Button>
            </motion.div>
            <Link href="/planner"><Button variant="outline" size="lg" className="h-12 w-full rounded-2xl bg-white/70 sm:w-auto">Build my study plan <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BookOpen} label="Courses" value={isLoading ? "…" : String(courses.length)} hint={`${totalFiles} uploaded files`} delay={0.05} />
        <MetricCard icon={Layers3} label="PDF pages" value={isLoading ? "…" : String(totalPages)} hint="Detected from your PDFs" delay={0.1} />
        <MetricCard icon={Clock3} label="Study left" value={isLoading ? "…" : formatMinutes(studyMinutes)} hint={`${settings.dailyMinutes} min daily target`} delay={0.15} />
        <MetricCard icon={CalendarRange} label="Remaining" value={isLoading ? "…" : `${remainingPages} pages`} hint="Updates as you finish" delay={0.2} />
      </section>

      <section className="space-y-7">
        <SectionHeading
          eyebrow="Today"
          title="One clear plan for today."
          body="Syllo turns the full semester into small page ranges so you do not have to decide what to study every time you sit down."
          action={<Link href="/planner" className="inline-flex items-center gap-2 text-sm font-semibold text-accent">Full planner <ArrowRight className="h-4 w-4" /></Link>}
        />

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, x: -22 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/[0.84] shadow-[0_28px_85px_-60px_rgba(31,39,82,0.6)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Study today</p>
                <h3 className="mt-1 font-serif text-2xl font-medium text-ink">{today ? `${today.pages} pages · ${formatMinutes(today.minutes)}` : "Nothing scheduled yet"}</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Target className="h-5 w-5" /></div>
            </div>

            {today ? (
              <div className="divide-y divide-border/60">
                {today.sessions.slice(0, 4).map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    className="flex items-start gap-3 px-5 py-4 sm:px-7"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper text-accent"><BookOpenCheck className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{session.courseName}</p>
                      <p className="mt-1 truncate font-medium text-ink">{session.fileName}</p>
                      <p className="mt-1 text-sm text-ink-muted">Pages {session.startPage}–{session.endPage} · {session.minutes} min</p>
                    </div>
                  </motion.div>
                ))}
                <div className="px-5 py-5 sm:px-7"><Link href="/focus"><Button variant="accent" className="h-11 w-full rounded-2xl sm:w-auto"><TimerReset className="mr-2 h-4 w-4" /> Start focus mode</Button></Link></div>
              </div>
            ) : (
              <div className="px-5 py-10 text-center sm:px-7">
                <FileText className="mx-auto h-7 w-7 text-accent" />
                <p className="mt-4 font-serif text-xl text-ink">Upload a PDF to create your first plan.</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">Once Syllo knows the page count, it can divide the reading around your available time.</p>
                <Button variant="accent" className="mt-5 rounded-2xl" onClick={() => setIsModalOpen(true)}>Add course files</Button>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 22 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="relative overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-[0_28px_85px_-52px_rgba(15,20,45,0.75)] sm:p-7"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute -right-28 -top-28 h-72 w-72 rounded-full border border-white/8" />
            <Flame className="relative z-10 h-6 w-6 text-highlight" />
            <p className="relative z-10 mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Today&apos;s reminder</p>
            <p className="relative z-10 mt-3 font-serif text-3xl leading-tight">“{tip}”</p>
            <Link href="/tips" className="relative z-10 mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">More study tips <ArrowRight className="h-4 w-4" /></Link>
          </motion.div>
        </div>
      </section>

      <section className="space-y-7">
        <SectionHeading
          eyebrow="Courses"
          title="Your semester, course by course."
          body="Open a course to see each file, page count, estimated study time, and your reading progress."
          action={<Button variant="outline" className="rounded-2xl" onClick={() => setIsModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add course</Button>}
        />

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-48 animate-pulse rounded-[1.9rem] bg-white/75" />)}</div>
        ) : courses.length === 0 ? (
          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-[2.2rem] border border-dashed border-border bg-white/72 px-6 py-16 text-center shadow-[0_28px_80px_-60px_rgba(28,36,80,0.5)] backdrop-blur-xl">
            <motion.div animate={{ y: [0, -9, 0], rotate: [0, 4, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10"><FolderOpen className="h-7 w-7 text-accent" /></motion.div>
            <p className="mt-6 font-serif text-2xl font-medium text-ink">Start with your first course.</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink-muted sm:text-base">Upload a syllabus, lecture PDF, notes, or slides. PDF files unlock page-aware planning immediately.</p>
            <Button variant="accent" className="mt-7 h-12 rounded-2xl px-6" onClick={() => setIsModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add my first course</Button>
          </motion.div>
        ) : (
          <motion.div layout className="grid gap-4 lg:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {courses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} onDelete={() => void handleDeleteCourse(course.id)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <section>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="ai-dashboard-card relative overflow-hidden rounded-[2.25rem] border border-accent/15 bg-gradient-to-br from-ink via-[#1d2552] to-accent px-6 py-10 text-white shadow-[0_34px_100px_-58px_rgba(28,36,80,0.9)] sm:px-10 sm:py-12">
          <div className="ai-aurora ai-aurora-dark" aria-hidden="true" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }} className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10" />
          <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white/75"><Bot className="h-4 w-4" /> Syllo AI</div>
              <h2 className="mt-4 max-w-3xl font-serif text-3xl font-medium sm:text-4xl">Ask your course files questions instead of staring at them.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">Get explanations, summaries, quizzes, flashcards, exam prep, and study coaching from one place.</p>
            </div>
            <Link href="/ai"><Button variant="secondary" size="lg" className="rounded-2xl bg-white text-ink hover:bg-white/90">Open Syllo AI <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </motion.div>
      </section>

      <section className="space-y-7">
        <SectionHeading eyebrow="How Syllo helps" title="From a pile of files to a repeatable system." body="The workflow is deliberately simple: upload, understand the workload, use AI when you need help, plan your time, then focus on one block." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: FileText, n: "01", title: "Upload", body: "Keep course files together. PDFs get a page count automatically in your browser." },
            { icon: Bot, n: "02", title: "Ask AI", body: "Summarize, explain, quiz yourself, build flashcards, and prepare for exams from your own material." },
            { icon: Brain, n: "03", title: "Plan", body: "Choose 30 minutes, one hour, or more. Syllo converts pages into daily reading targets." },
            { icon: Target, n: "04", title: "Focus", body: "Open one clear page range, start the timer, and mark the block complete when you finish." },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} whileHover={{ y: -7 }} className="rounded-[1.9rem] border border-white/80 bg-white/[0.82] p-6 shadow-[0_22px_65px_-52px_rgba(31,39,82,0.55)] backdrop-blur-xl">
                <div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Icon className="h-5 w-5" /></div><span className="font-serif text-3xl text-accent/25">{step.n}</span></div>
                <h3 className="mt-5 font-serif text-2xl text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{step.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative overflow-hidden rounded-[2.25rem] border border-accent/15 bg-gradient-to-br from-accent/[0.09] via-white to-highlight/[0.08] px-6 py-11 sm:px-10 sm:py-14">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-accent/10" />
          <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Your next move</p><h2 className="mt-3 max-w-2xl font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Give Syllo your available time. Get back a study plan you can actually follow.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted sm:text-base">Your files are already here. The planner is where they become actionable.</p></div>
            <Link href="/planner"><Button size="lg" className="h-13 rounded-2xl px-6">Open my planner <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </motion.div>
      </section>

      <AnimatePresence>
        {isModalOpen ? (
          <CourseUploadModal
            onClose={() => setIsModalOpen(false)}
            onSaved={(course) => {
              setCourses((current) => [course, ...current]);
              setIsModalOpen(false);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CourseCard({ course, index, onDelete }: { course: StoredCourse; index: number; onDelete: () => void }) {
  const pageCount = course.files.reduce((sum, file) => sum + (file.pageCount ?? 0), 0);
  const pdfCount = course.files.filter((file) => file.pageCount).length;

  return (
    <motion.article layout initial={{ opacity: 0, y: 34, scale: 0.95, rotateX: 8 }} animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} exit={{ opacity: 0, scale: 0.87, y: -18, filter: "blur(8px)" }} transition={{ delay: Math.min(index * 0.06, 0.3), type: "spring", stiffness: 130, damping: 18 }} whileHover={{ y: -7, rotateX: 1.2, rotateY: -1.1 }} style={{ transformPerspective: 1000 }}>
      <Card className="group h-full overflow-hidden rounded-[1.9rem] border-white/80 bg-white/[0.84] shadow-[0_24px_70px_-52px_rgba(31,39,82,0.58)] backdrop-blur-xl">
        <CardContent className="flex h-full flex-col p-0">
          <div className="flex-1 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <motion.div whileHover={{ rotate: 8, scale: 1.08 }} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10"><BookOpen className="h-5 w-5 text-accent" /></motion.div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0"><h3 className="truncate font-serif text-2xl font-medium text-ink">{course.name}</h3><p className="mt-1 text-sm text-ink-muted">{course.files.length} file{course.files.length !== 1 ? "s" : ""} · {pdfCount} PDF{pdfCount !== 1 ? "s" : ""}</p></div>
                  <motion.button whileHover={{ scale: 1.12, rotate: 7 }} whileTap={{ scale: 0.88 }} type="button" className="rounded-full p-2 text-ink-muted opacity-60 hover:bg-danger/10 hover:text-danger group-hover:opacity-100" onClick={onDelete} aria-label={`Delete ${course.name}`}><Trash2 className="h-4 w-4" /></motion.button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl bg-paper p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Pages</p><p className="mt-1 text-lg font-semibold text-ink">{pageCount || "—"}</p></div>
                  <div className="rounded-2xl bg-paper p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Storage</p><p className="mt-1 text-lg font-semibold text-ink">{formatBytes(course.files.reduce((sum, file) => sum + file.size, 0))}</p></div>
                </div>
              </div>
            </div>
          </div>
          <Link href={`/courses/${course.id}`} className="flex items-center justify-between border-t border-border/70 bg-paper/55 px-5 py-4 text-sm font-semibold text-ink transition-colors hover:bg-accent/[0.06] sm:px-6">Open course workspace <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" /></Link>
        </CardContent>
      </Card>
    </motion.article>
  );
}
