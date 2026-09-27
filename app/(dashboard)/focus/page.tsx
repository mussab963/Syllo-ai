"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpenCheck,
  Bot,
  Check,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/study/section-heading";
import { useCourses } from "@/lib/use-courses";
import {
  DEFAULT_SETTINGS,
  buildStudyPlan,
  completeSession,
  loadStudyProgress,
  loadStudySettings,
  saveStudyProgress,
  type StudyProgress,
  type StudySession,
  type StudySettings,
} from "@/lib/study";

const focusDurations = [20, 25, 45, 60];

const quotes = [
  "You do not need to finish everything. You only need to finish the next block.",
  "Small sessions repeated consistently beat one perfect study day.",
  "Clarity first. One file, one page range, one timer.",
  "Progress feels slow until you look back at the pages you already finished.",
];

export default function FocusPage() {
  const { courses } = useCourses();
  const [settings, setSettings] = useState<StudySettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<StudyProgress>({});
  const [duration, setDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = loadStudySettings();
    const initialDuration = focusDurations.includes(saved.blockMinutes) ? saved.blockMinutes : 25;
    setSettings(saved);
    setDuration(initialDuration);
    setSecondsLeft(initialDuration * 60);
    setProgress(loadStudyProgress());
  }, []);

  const plan = useMemo(() => buildStudyPlan(courses, settings, progress, 2), [courses, settings, progress]);
  const nextSession: StudySession | undefined = plan[0]?.sessions[0];
  const quote = quotes[(new Date().getDate() - 1) % quotes.length];

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setRunning(false);
          setCompleted(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function chooseDuration(minutes: number) {
    setDuration(minutes);
    setSecondsLeft(minutes * 60);
    setRunning(false);
    setCompleted(false);
  }

  function reset() {
    setRunning(false);
    setCompleted(false);
    setSecondsLeft(duration * 60);
  }

  function markSessionDone() {
    if (!nextSession) return;
    const next = completeSession(progress, nextSession);
    setProgress(next);
    saveStudyProgress(next);
    setCompleted(true);
  }

  const minutesDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secondsDisplay = String(secondsLeft % 60).padStart(2, "0");
  const percent = duration > 0 ? 1 - secondsLeft / (duration * 60) : 0;
  const circumference = 2 * Math.PI * 118;

  return (
    <div className="relative space-y-16 pb-24 sm:space-y-20">
      <div className="dashboard-light dashboard-light-a" aria-hidden="true" />
      <div className="dashboard-light dashboard-light-b" aria-hidden="true" />

      <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2.2rem] border border-white/80 bg-ink px-5 py-8 text-white shadow-[0_36px_110px_-58px_rgba(15,20,45,0.8)] sm:px-9 sm:py-10"
        >
          <div className="focus-noise" aria-hidden="true" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
            className="absolute -right-32 -top-32 h-[460px] w-[460px] rounded-full border border-white/8"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute -right-16 -top-16 h-[330px] w-[330px] rounded-full border border-accent/25"
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-2 text-sm font-semibold text-white/75">
                <Sparkles className="h-4 w-4 text-highlight" /> Focus mode
              </div>
              <Link href="/planner" className="inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Planner
              </Link>
            </div>

            <div className="mt-8 flex flex-col items-center text-center">
              <div className="relative flex h-[270px] w-[270px] items-center justify-center sm:h-[310px] sm:w-[310px]">
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 260 260" aria-hidden="true">
                  <circle cx="130" cy="130" r="118" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                  <motion.circle
                    cx="130"
                    cy="130"
                    r="118"
                    fill="none"
                    stroke="rgba(132,145,255,0.95)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: circumference * (1 - percent) }}
                    transition={{ duration: 0.35, ease: "linear" }}
                  />
                </svg>
                <motion.div
                  animate={running ? { scale: [1, 1.025, 1] } : undefined}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-center"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Focus</p>
                  <p className="mt-3 font-serif text-6xl tracking-[-0.05em] sm:text-7xl">{minutesDisplay}:{secondsDisplay}</p>
                  <p className="mt-2 text-sm text-white/45">One block at a time.</p>
                </motion.div>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {focusDurations.map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => chooseDuration(minutes)}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${duration === minutes ? "bg-white text-ink" : "bg-white/8 text-white/60 hover:bg-white/12 hover:text-white"}`}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>

              {completed ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-success/15 px-3.5 py-2 text-sm font-semibold text-emerald-200"
                >
                  <Check className="h-4 w-4" /> Focus block complete
                </motion.div>
              ) : null}

              <Link href={nextSession ? `/ai?course=${nextSession.courseId}&mode=explain` : "/ai"} className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-2 text-xs font-semibold text-white/65 transition hover:bg-white/12 hover:text-white"><Bot className="h-3.5 w-3.5" /> Stuck? Ask Syllo AI</Link>

              <div className="mt-7 flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    if (secondsLeft === 0) {
                      setSecondsLeft(duration * 60);
                      setCompleted(false);
                      setRunning(true);
                      return;
                    }
                    setRunning((value) => !value);
                  }}
                  className="flex h-14 min-w-36 items-center justify-center gap-2 rounded-2xl bg-white px-6 font-semibold text-ink shadow-xl"
                >
                  {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {running ? "Pause" : secondsLeft === 0 ? "Start again" : "Start"}
                </motion.button>
                <motion.button
                  whileHover={{ rotate: -12, scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={reset}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8 text-white/65 hover:bg-white/12 hover:text-white"
                  aria-label="Reset timer"
                >
                  <RotateCcw className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-5"
        >
          <Card className="flex-1 rounded-[2rem] border-white/80 bg-white/[0.84] shadow-[0_28px_80px_-58px_rgba(31,39,82,0.58)] backdrop-blur-xl">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><BookOpenCheck className="h-5 w-5" /></div>
                <span className="rounded-full bg-paper px-3 py-1.5 text-xs font-semibold text-ink-muted">Next task</span>
              </div>

              {nextSession ? (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">{nextSession.courseName}</p>
                  <h2 className="mt-2 font-serif text-2xl font-medium leading-tight text-ink">{nextSession.fileName}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">Read pages <strong className="text-ink">{nextSession.startPage}–{nextSession.endPage}</strong>. Syllo estimates about {nextSession.minutes} minutes for this block.</p>
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-paper p-4">
                    <Timer className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-xs text-ink-muted">Target</p>
                      <p className="font-semibold text-ink">{nextSession.pages} pages · {nextSession.minutes} min</p>
                    </div>
                  </div>
                  <Button onClick={markSessionDone} variant="accent" className="mt-5 h-12 w-full rounded-2xl"><Check className="mr-2 h-4 w-4" /> Mark reading complete</Button>
                </div>
              ) : (
                <div className="mt-7 text-center">
                  <Check className="mx-auto h-8 w-8 text-success" />
                  <h2 className="mt-4 font-serif text-2xl text-ink">Nothing waiting.</h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">Upload a PDF or reset your progress from the planner to create a new reading task.</p>
                  <Link href="/dashboard"><Button variant="accent" className="mt-5 rounded-2xl">Open courses</Button></Link>
                </div>
              )}
            </CardContent>
          </Card>

          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-[1.8rem] border border-highlight/20 bg-highlight/[0.08] p-5"
          >
            <div className="flex items-start gap-3">
              <Coffee className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold text-ink">Your break counts too.</p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">After a focus block, stand up, drink water, and give your eyes a few minutes away from the screen.</p>
              </div>
            </div>
          </motion.div>
        </motion.aside>
      </section>

      <section className="space-y-7">
        <SectionHeading eyebrow="Focus ritual" title="Make starting easier than procrastinating." body="A tiny repeatable routine reduces the mental effort of beginning. Use the same sequence every time you study." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "01", title: "Clear the space", body: "Close unrelated tabs, put your phone away, and keep only the file you need." },
            { n: "02", title: "Define the finish line", body: "Your page range is the goal. You are not trying to finish the whole course today." },
            { n: "03", title: "Stop on time", body: "When the block ends, pause. Sustainable sessions are easier to repeat tomorrow." },
          ].map((item, index) => (
            <motion.div
              key={item.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="rounded-[1.8rem] border border-white/80 bg-white/[0.82] p-6 shadow-[0_22px_65px_-52px_rgba(31,39,82,0.54)] backdrop-blur-xl"
            >
              <p className="font-serif text-3xl text-accent/35">{item.n}</p>
              <h3 className="mt-4 font-serif text-xl font-medium text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.2rem] border border-accent/15 bg-gradient-to-br from-accent/[0.1] via-white to-white px-6 py-10 text-center sm:px-10 sm:py-14"
        >
          <Volume2 className="mx-auto h-6 w-6 text-accent" />
          <p className="mx-auto mt-5 max-w-3xl font-serif text-2xl leading-relaxed text-ink sm:text-3xl">“{quote}”</p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted">Today&apos;s reminder</p>
        </motion.div>
      </section>
    </div>
  );
}
