"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  CalendarRange,
  Check,
  Clock3,
  Gauge,
  Layers3,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SemesterOrbit } from "@/components/visuals/semester-orbit";
import { MetricCard } from "@/components/study/metric-card";
import { SectionHeading } from "@/components/study/section-heading";
import { useCourses } from "@/lib/use-courses";
import {
  DEFAULT_SETTINGS,
  buildStudyPlan,
  completeSession,
  estimateTotalMinutes,
  formatMinutes,
  getTotalPages,
  getTotalRemainingPages,
  loadStudyProgress,
  loadStudySettings,
  pagesPerHour,
  saveStudyProgress,
  saveStudySettings,
  type StudyPace,
  type StudyProgress,
  type StudySettings,
} from "@/lib/study";

const timeOptions = [30, 60, 90, 120, 180];
const blockOptions = [20, 25, 45, 60];
const paceOptions: Array<{ value: StudyPace; label: string; body: string }> = [
  { value: "relaxed", label: "Deep", body: "Slower reading with more note-taking." },
  { value: "balanced", label: "Balanced", body: "A comfortable everyday study pace." },
  { value: "focused", label: "Fast", body: "For review days and familiar material." },
];

export default function PlannerPage() {
  const { courses, isLoading } = useCourses();
  const [settings, setSettings] = useState<StudySettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<StudyProgress>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadStudySettings());
    setProgress(loadStudyProgress());
    setReady(true);
  }, []);

  const plan = useMemo(() => buildStudyPlan(courses, settings, progress, 14), [courses, settings, progress]);
  const totalPages = getTotalPages(courses);
  const remainingPages = getTotalRemainingPages(courses, progress);
  const remainingMinutes = estimateTotalMinutes(courses, settings, progress);
  const completion = totalPages > 0 ? Math.min(100, Math.round(((totalPages - remainingPages) / totalPages) * 100)) : 0;

  function updateSettings(next: StudySettings) {
    setSettings(next);
    if (ready) saveStudySettings(next);
  }

  function markDone(dayIndex: number, sessionIndex: number) {
    const session = plan[dayIndex]?.sessions[sessionIndex];
    if (!session) return;
    const next = completeSession(progress, session);
    setProgress(next);
    saveStudyProgress(next);
  }

  return (
    <div className="relative space-y-14 pb-24 sm:space-y-20">
      <div className="dashboard-light dashboard-light-a" aria-hidden="true" />
      <div className="dashboard-light dashboard-light-b" aria-hidden="true" />

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative isolate overflow-hidden rounded-[2rem] border border-white/80 bg-white/[0.76] px-5 py-8 shadow-[0_35px_110px_-72px_rgba(28,36,80,0.62)] backdrop-blur-2xl sm:rounded-[2.5rem] sm:px-9 sm:py-10 lg:min-h-[430px]"
      >
        <div className="hero-grid" aria-hidden="true" />
        <div className="absolute -right-24 -top-24 hidden h-[520px] w-[560px] opacity-90 lg:block" aria-hidden="true">
          <SemesterOrbit compact />
        </div>

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 160, damping: 18 }}
            className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/[0.08] px-3.5 py-2 text-sm font-semibold text-accent"
          >
            <BrainCircuit className="h-4 w-4" />
            Smart study planner
          </motion.div>

          <h1 className="mt-5 max-w-2xl font-serif text-[clamp(2.8rem,6vw,5.2rem)] font-medium leading-[0.94] tracking-[-0.05em] text-ink">
            Turn pages into a
            <span className="block text-accent">real study routine.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">
            Choose how much time you can study. Syllo divides your uploaded PDF pages into realistic daily sessions so you always know exactly what to read next.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {["Page-aware", "Time-based", "Progress tracking"].map((item, index) => (
              <motion.span
                key={item}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.08 }}
                whileHover={{ y: -3 }}
                className="rounded-full border border-border/80 bg-white/75 px-3.5 py-2 text-sm text-ink-muted shadow-sm backdrop-blur-xl"
              >
                {item}
              </motion.span>
            ))}
          </div>
          <Link href="/ai?mode=plan" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
            <Bot className="h-4 w-4" /> Ask AI to personalize this plan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Layers3} label="PDF pages" value={isLoading ? "…" : String(totalPages)} hint="Detected from your files" delay={0.05} />
        <MetricCard icon={BookOpenCheck} label="Remaining" value={isLoading ? "…" : String(remainingPages)} hint={`${completion}% completed`} delay={0.1} />
        <MetricCard icon={Clock3} label="Study left" value={isLoading ? "…" : formatMinutes(remainingMinutes)} hint="At your selected pace" delay={0.15} />
        <MetricCard icon={CalendarRange} label="Plan length" value={plan.length ? `${plan.length}${plan.length === 14 ? "+" : ""} days` : "0 days"} hint={`${settings.dailyMinutes} min per day`} delay={0.2} />
      </section>

      <section className="space-y-7">
        <SectionHeading
          eyebrow="Your rhythm"
          title="Tell Syllo how you actually study."
          body="There is no perfect schedule. Pick the time and pace that feel realistic for you, then let the plan adapt instantly."
        />

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -22 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="rounded-[2rem] border border-white/80 bg-white/[0.82] p-5 shadow-[0_26px_80px_-58px_rgba(31,39,82,0.55)] backdrop-blur-xl sm:p-7"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink">How long can you study each day?</p>
                <p className="mt-0.5 text-sm text-ink-muted">Choose a daily target you can repeat.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {timeOptions.map((minutes) => {
                const selected = settings.dailyMinutes === minutes;
                return (
                  <motion.button
                    key={minutes}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => updateSettings({ ...settings, dailyMinutes: minutes })}
                    className={`relative rounded-2xl border px-3 py-4 text-center transition-colors ${
                      selected ? "border-accent bg-accent text-white shadow-lg shadow-accent/20" : "border-border bg-paper/60 text-ink hover:border-accent/30"
                    }`}
                  >
                    <span className="block text-lg font-semibold">{minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}</span>
                    <span className={`mt-1 block text-[11px] ${selected ? "text-white/75" : "text-ink-muted"}`}>{minutes <= 60 ? "Light" : minutes <= 120 ? "Steady" : "Intense"}</span>
                    {selected ? (
                      <motion.span layoutId="time-check" className="absolute right-2 top-2"><Check className="h-3.5 w-3.5" /></motion.span>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 22 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="rounded-[2rem] border border-white/80 bg-white/[0.82] p-5 shadow-[0_26px_80px_-58px_rgba(31,39,82,0.55)] backdrop-blur-xl sm:p-7"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-highlight/15 text-amber-700">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink">What kind of studying is this?</p>
                <p className="mt-0.5 text-sm text-ink-muted">This controls pages per hour.</p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {paceOptions.map((option) => {
                const selected = settings.pace === option.value;
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => updateSettings({ ...settings, pace: option.value })}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-colors ${selected ? "border-accent/35 bg-accent/[0.07]" : "border-border bg-paper/50 hover:border-accent/20"}`}
                  >
                    <div>
                      <p className="font-semibold text-ink">{option.label}</p>
                      <p className="mt-1 text-sm text-ink-muted">{option.body}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-accent">~{pagesPerHour(option.value)} pages/h</p>
                      {selected ? <Check className="ml-auto mt-1 h-4 w-4 text-accent" /> : null}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[2rem] border border-border/70 bg-ink p-5 text-white shadow-[0_28px_80px_-50px_rgba(15,20,45,0.72)] sm:p-7"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Focus block</p>
              <h3 className="mt-2 font-serif text-2xl font-medium">How long should one study block be?</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">Syllo uses this to avoid giving you one giant reading session.</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {blockOptions.map((minutes) => (
                <motion.button
                  key={minutes}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateSettings({ ...settings, blockMinutes: minutes })}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold ${settings.blockMinutes === minutes ? "bg-white text-ink" : "bg-white/8 text-white/70 hover:bg-white/12"}`}
                >
                  {minutes}m
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="space-y-7">
        <SectionHeading
          eyebrow="Your plan"
          title="A clear page-by-page roadmap."
          body="Each session tells you exactly which file and pages to study. Complete a session and Syllo rebuilds the remaining plan around your progress."
          action={
            <Link href="/focus">
              <Button className="rounded-2xl">Open focus mode <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          }
        />

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-52 animate-pulse rounded-[1.8rem] bg-white/75" />)}
          </div>
        ) : totalPages === 0 ? (
          <Card className="rounded-[2rem] border-dashed border-border bg-white/75">
            <CardContent className="px-6 py-14 text-center sm:py-16">
              <Sparkles className="mx-auto h-7 w-7 text-accent" />
              <h3 className="mt-4 font-serif text-2xl text-ink">Upload a PDF to unlock your study plan.</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink-muted">Syllo reads the PDF page count locally in your browser, then divides the pages around your daily study time.</p>
              <Link href="/dashboard"><Button variant="accent" className="mt-6 rounded-2xl">Go to my courses</Button></Link>
            </CardContent>
          </Card>
        ) : remainingPages === 0 ? (
          <div className="rounded-[2rem] border border-success/20 bg-success/[0.06] px-6 py-14 text-center">
            <BookOpenCheck className="mx-auto h-9 w-9 text-success" />
            <h3 className="mt-4 font-serif text-3xl text-ink">You finished everything.</h3>
            <p className="mt-2 text-ink-muted">That is the entire uploaded PDF workload complete.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {plan.slice(0, 7).map((day, dayIndex) => (
                <motion.article
                  key={`${day.date.toISOString()}-${day.pages}`}
                  layout
                  initial={{ opacity: 0, y: 26, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: Math.min(dayIndex * 0.05, 0.25), type: "spring", stiffness: 140, damping: 19 }}
                  className="overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/[0.82] shadow-[0_24px_70px_-54px_rgba(31,39,82,0.58)] backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${dayIndex === 0 ? "bg-accent text-white" : "bg-accent/10 text-accent"}`}>
                        <CalendarRange className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-medium text-ink">{day.label}</h3>
                        <p className="mt-0.5 text-xs text-ink-muted">{day.pages} pages · {formatMinutes(day.minutes)}</p>
                      </div>
                    </div>
                    {dayIndex === 0 ? <span className="w-fit rounded-full bg-highlight/15 px-3 py-1.5 text-xs font-semibold text-amber-700">Start here</span> : null}
                  </div>

                  <div className="divide-y divide-border/60">
                    {day.sessions.map((session, sessionIndex) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: sessionIndex * 0.04 }}
                        className="group flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper text-accent">
                            <BookOpenCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{session.courseName}</p>
                            <p className="mt-1 truncate font-medium text-ink">{session.fileName}</p>
                            <p className="mt-1 text-sm text-ink-muted">Pages {session.startPage}–{session.endPage} · about {session.minutes} min</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => markDone(dayIndex, sessionIndex)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:border-success/25 hover:bg-success/[0.06] hover:text-success"
                        >
                          <Check className="h-4 w-4" /> Done
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.2rem] border border-accent/15 bg-gradient-to-br from-accent/[0.09] via-white to-highlight/[0.08] px-6 py-10 sm:px-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-accent/10"
          />
          <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-accent"><TimerReset className="h-4 w-4" /> Ready to study?</div>
              <h2 className="mt-3 max-w-2xl font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Take the next block, not the whole semester.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted sm:text-base">Focus mode gives you one timer, one file, and one target. Nothing else competes for your attention.</p>
            </div>
            <Link href="/focus"><Button size="lg" className="h-13 rounded-2xl px-6">Start focus mode <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
