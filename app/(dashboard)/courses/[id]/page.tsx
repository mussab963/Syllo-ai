"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  BookOpen,
  Bot,
  Clock3,
  FileText,
  FolderOpen,
  Gauge,
  Layers3,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/study/metric-card";
import { SectionHeading } from "@/components/study/section-heading";
import { deleteCourse, enrichCoursePageCounts, formatBytes, getCourse, type StoredCourse, type StoredCourseFile } from "@/lib/local-courses";
import { DEFAULT_SETTINGS, formatMinutes, loadStudyProgress, loadStudySettings, pagesPerHour, type StudyProgress, type StudySettings } from "@/lib/study";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<StoredCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<StudySettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<StudyProgress>({});

  useEffect(() => {
    setSettings(loadStudySettings());
    setProgress(loadStudyProgress());
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return;
    void (async () => {
      try {
        const found = await getCourse(id);
        if (!found) {
          setCourse(null);
          return;
        }
        const enriched = await enrichCoursePageCounts(found);
        setCourse(enriched);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const pdfFiles = useMemo(() => course?.files.filter((file) => file.pageCount) ?? [], [course]);
  const totalPages = pdfFiles.reduce((sum, file) => sum + (file.pageCount ?? 0), 0);
  const donePages = pdfFiles.reduce((sum, file) => sum + Math.min(progress[file.id] ?? 0, file.pageCount ?? 0), 0);
  const remainingPages = Math.max(0, totalPages - donePages);
  const estimatedMinutes = Math.ceil((remainingPages / pagesPerHour(settings.pace)) * 60);
  const completion = totalPages ? Math.round((donePages / totalPages) * 100) : 0;

  function openFile(file: StoredCourseFile) {
    const url = URL.createObjectURL(file.blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function removeCourse() {
    if (!course) return;
    await deleteCourse(course.id);
    router.push("/dashboard");
  }

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/20 border-t-accent" /></div>;
  }

  if (!course) {
    return (
      <div className="rounded-[2rem] border border-border bg-white/80 px-6 py-16 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-accent" />
        <h1 className="mt-4 font-serif text-3xl text-ink">Course not found.</h1>
        <p className="mt-2 text-ink-muted">It may have been removed from this browser.</p>
        <Link href="/dashboard"><Button className="mt-6 rounded-2xl">Back to dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="relative space-y-16 pb-24 sm:space-y-20">
      <div className="dashboard-light dashboard-light-a" aria-hidden="true" />
      <div className="dashboard-light dashboard-light-b" aria-hidden="true" />

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.2rem] border border-white/80 bg-white/[0.78] px-5 py-8 shadow-[0_35px_110px_-72px_rgba(28,36,80,0.62)] backdrop-blur-2xl sm:px-9 sm:py-10"
      >
        <div className="hero-grid" aria-hidden="true" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-accent/10"
        />
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-2, 3, -2] }}
          transition={{ duration: 6.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[8%] top-[24%] hidden rounded-[1.5rem] border border-white/80 bg-white/85 px-4 py-3 shadow-xl backdrop-blur-xl lg:block"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">Course progress</p>
          <p className="mt-1 font-serif text-xl text-ink">{completion}% complete</p>
        </motion.div>

        <div className="relative z-10 max-w-3xl">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent/[0.08] px-3.5 py-2 text-sm font-semibold text-accent"><Sparkles className="h-4 w-4" /> Course workspace</div>
          <h1 className="mt-4 font-serif text-[clamp(3rem,7vw,5.5rem)] font-medium leading-[0.94] tracking-[-0.05em] text-ink">{course.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">Every uploaded file, its page count, and your study progress for this course in one place.</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/ai?course=${course.id}`}><Button className="h-12 rounded-2xl px-5"><Bot className="mr-2 h-4 w-4" /> Ask Syllo AI</Button></Link>
            <Link href="/planner"><Button variant="outline" className="h-12 rounded-2xl bg-white/70 px-5">Build study plan <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => void removeCourse()}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-danger/15 bg-danger/[0.05] px-5 text-sm font-semibold text-danger"
            >
              <Trash2 className="h-4 w-4" /> Delete course
            </motion.button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FolderOpen} label="Files" value={String(course.files.length)} hint="Stored in this browser" delay={0.05} />
        <MetricCard icon={Layers3} label="PDF pages" value={String(totalPages)} hint="Detected locally" delay={0.1} />
        <MetricCard icon={Clock3} label="Study left" value={formatMinutes(estimatedMinutes)} hint={`${remainingPages} pages remaining`} delay={0.15} />
        <MetricCard icon={Gauge} label="Progress" value={`${completion}%`} hint={`${donePages} pages completed`} delay={0.2} />
      </section>

      <section className="space-y-7">
        <SectionHeading eyebrow="AI study tools" title="Turn your course files into active study." body="Use Claude inside Syllo to summarize, explain, quiz, build flashcards, or prepare for an exam using this course as context." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Summarize", mode: "summary", icon: Layers3 },
            { label: "Explain simply", mode: "explain", icon: Sparkles },
            { label: "Quiz me", mode: "quiz", icon: BrainCircuit },
            { label: "Exam prep", mode: "exam", icon: Target },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.mode} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} whileHover={{ y: -5 }}>
                <Link href={`/ai?course=${course.id}&mode=${item.mode}`} className="group flex h-full items-center justify-between rounded-[1.45rem] border border-white/85 bg-white/[0.82] p-4 shadow-[0_20px_60px_-50px_rgba(31,39,82,0.6)] backdrop-blur-xl">
                  <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Icon className="h-4.5 w-4.5" /></span><span className="text-sm font-semibold text-ink">{item.label}</span></div>
                  <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="space-y-7">
        <SectionHeading eyebrow="Course files" title="Know the workload before you start." body="PDFs show their page count and current reading progress. Other files stay available here and can be opened anytime." />

        <div className="grid gap-4 lg:grid-cols-2">
          {course.files.map((file, index) => {
            const pages = file.pageCount ?? 0;
            const done = pages ? Math.min(progress[file.id] ?? 0, pages) : 0;
            const fileProgress = pages ? Math.round((done / pages) * 100) : 0;
            const remaining = Math.max(0, pages - done);
            const minutes = pages ? Math.ceil((remaining / pagesPerHour(settings.pace)) * 60) : 0;
            return (
              <motion.article
                key={file.id}
                initial={{ opacity: 0, y: 26, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: Math.min(index * 0.06, 0.24), type: "spring", stiffness: 145, damping: 19 }}
                whileHover={{ y: -6 }}
              >
                <Card className="h-full overflow-hidden rounded-[1.9rem] border-white/80 bg-white/[0.84] shadow-[0_24px_70px_-54px_rgba(31,39,82,0.58)] backdrop-blur-xl">
                  <CardContent className="p-0">
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <motion.div whileHover={{ rotate: -7, scale: 1.08 }} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent"><FileText className="h-5 w-5" /></motion.div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-ink">{file.name}</p>
                          <p className="mt-1 text-sm text-ink-muted">{formatBytes(file.size)}{pages ? ` · ${pages} pages` : " · page count unavailable"}</p>
                        </div>
                      </div>

                      {pages ? (
                        <div className="mt-6">
                          <div className="flex items-center justify-between text-xs font-medium text-ink-muted"><span>{done} of {pages} pages studied</span><span>{fileProgress}%</span></div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent/10">
                            <motion.div initial={{ width: 0 }} whileInView={{ width: `${fileProgress}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full bg-accent" />
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-paper p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Remaining</p><p className="mt-1 font-semibold text-ink">{remaining} pages</p></div>
                            <div className="rounded-xl bg-paper p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Estimate</p><p className="mt-1 font-semibold text-ink">{formatMinutes(minutes)}</p></div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-5 rounded-2xl bg-paper px-4 py-3 text-sm leading-6 text-ink-muted">Syllo currently calculates page-aware plans for PDFs. You can still keep and open this file here.</p>
                      )}
                    </div>
                    <button onClick={() => openFile(file)} className="flex w-full items-center justify-between border-t border-border/70 bg-paper/55 px-5 py-4 text-sm font-semibold text-ink transition-colors hover:bg-accent/[0.06] sm:px-6">Open file <ArrowRight className="h-4 w-4 text-accent" /></button>
                  </CardContent>
                </Card>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.2rem] bg-ink px-6 py-10 text-white shadow-[0_30px_90px_-55px_rgba(15,20,45,0.78)] sm:px-10 sm:py-12"
        >
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 34, repeat: Infinity, ease: "linear" }} className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/8" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Next step</p>
              <h2 className="mt-3 max-w-2xl font-serif text-3xl font-medium sm:text-4xl">Stop looking at the whole course. Study the next page range.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/60 sm:text-base">Syllo can spread this course across your available daily time and keep updating the plan as you finish sessions.</p>
            </div>
            <Link href="/planner"><Button variant="secondary" size="lg" className="rounded-2xl bg-white text-ink hover:bg-white/90">Open planner <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
