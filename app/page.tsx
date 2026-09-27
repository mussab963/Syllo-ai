"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SemesterOrbit } from "@/components/visuals/semester-orbit";

const STUDENT_NAME_KEY = "syllo_student_name";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.12 } },
};

const rise = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 95, damping: 17 },
  },
};

export default function WelcomePage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const isArabicName = /[\u0600-\u06FF]/.test(name);

  useEffect(() => {
    const savedName = window.localStorage.getItem(STUDENT_NAME_KEY)?.trim();
    if (savedName) setName(savedName);
    setReady(true);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    window.localStorage.setItem(STUDENT_NAME_KEY, cleanName);
    router.push("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper">
      <div className="landing-aurora landing-aurora-a" aria-hidden="true" />
      <div className="landing-aurora landing-aurora-b" aria-hidden="true" />
      <div className="noise-layer" aria-hidden="true" />

      <div className="relative mx-auto min-h-screen max-w-7xl px-6 py-7 sm:px-8 lg:px-10">
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between"
        >
          <div className="group flex items-center gap-2.5">
            <span className="font-serif text-2xl font-semibold tracking-tight text-ink">Syllo</span>
            <motion.span
              animate={reduceMotion ? undefined : { rotate: [0, 10, -7, 0], scale: [1, 1.2, 1.05, 1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-4 w-4 text-accent" />
            </motion.span>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-white/65 px-3.5 py-2 text-xs font-medium text-ink-muted shadow-sm backdrop-blur-xl sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-30" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Your semester, organized.
          </div>
        </motion.header>

        <section className="grid min-h-[calc(100vh-5rem)] items-center gap-10 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:py-4">
          <motion.div variants={stagger} initial="hidden" animate="show" className="relative z-10 max-w-2xl">
            <motion.div variants={rise} className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/[0.07] px-3.5 py-2 text-sm font-medium text-accent shadow-sm backdrop-blur-xl">
              <WandSparkles className="h-4 w-4" />
              Upload your semester. Syllo organizes the rest.
            </motion.div>

            <motion.h1 variants={rise} className="max-w-3xl text-balance font-serif text-[clamp(3.4rem,7vw,6.8rem)] font-medium leading-[0.91] tracking-[-0.055em] text-ink">
              Your semester.
              <br />
              <span className="relative inline-block text-accent">
                Finally organized.
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-accent/25"
                />
              </span>
            </motion.h1>

            <motion.p variants={rise} className="mt-7 max-w-xl text-lg leading-8 text-ink-muted sm:text-xl">
              Add your courses and files. Syllo keeps syllabi, notes, assignments, exams, and study planning in one focused place.
            </motion.p>

            <motion.div variants={rise} className="mt-7 flex flex-wrap gap-2.5">
              {["Courses", "Assignments", "Exams", "Study plan"].map((item, index) => (
                <motion.span
                  key={item}
                  whileHover={{ y: -4, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 360, damping: 18 }}
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/70 px-3.5 py-2 text-sm text-ink-muted shadow-sm backdrop-blur-xl"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  {item}
                  {index === 3 ? <Sparkles className="h-3 w-3 text-highlight" /> : null}
                </motion.span>
              ))}
            </motion.div>

            <motion.form
              variants={rise}
              onSubmit={handleSubmit}
              className="mt-10 max-w-xl rounded-[2rem] border border-white/80 bg-white/[0.72] p-3 shadow-[0_28px_90px_-44px_rgba(35,44,99,0.38)] backdrop-blur-2xl"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 px-2 py-1">
                  <label htmlFor="student-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    What should we call you?
                  </label>
                  <Input
                    id="student-name"
                    autoFocus
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={`h-11 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 ${isArabicName ? "font-arabic text-right" : ""}`}
                    disabled={!ready}
                  />
                </div>
                <motion.div whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.965 }}>
                  <Button
                    type="submit"
                    size="lg"
                    className="group h-14 w-full overflow-hidden rounded-2xl px-6 shadow-[0_15px_35px_-18px_rgba(25,32,69,0.7)] sm:w-auto"
                    disabled={!ready || !name.trim()}
                  >
                    <span>Start Syllo</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              </div>
            </motion.form>

            <motion.p variants={rise} className="mt-3 pl-3 text-xs text-ink-muted">
              No login. No database. Your name and files stay in this browser.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.05, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden min-h-[680px] lg:block"
          >
            <div className="absolute inset-[6%] rounded-full bg-accent/[0.07] blur-3xl" />
            <div className="absolute inset-0">
              <SemesterOrbit />
            </div>

            <FloatingCard className="left-[2%] top-[22%]" delay={0.1} duration={5.6} rotate={-5}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Biology 201</p>
                  <p className="mt-0.5 font-medium text-ink">Syllabus uploaded</p>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard className="right-[1%] top-[17%]" delay={0.8} duration={6.3} rotate={4}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Upcoming</p>
              <div className="mt-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-accent" />
                <p className="font-medium text-ink">Midterm · Oct 22</p>
              </div>
            </FloatingCard>

            <FloatingCard className="bottom-[16%] left-[9%]" delay={0.35} duration={6.7} rotate={3}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Today</p>
              <p className="mt-1 font-serif text-xl font-medium text-ink">45 min study plan</p>
              <div className="mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-accent/10">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "72%" }}
                  transition={{ delay: 1.4, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-accent"
                />
              </div>
            </FloatingCard>

            <FloatingCard className="bottom-[12%] right-[5%]" delay={1.1} duration={5.9} rotate={-4}>
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <Sparkles className="h-4 w-4 text-highlight" />
                Everything in one place
              </div>
            </FloatingCard>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

function FloatingCard({
  children,
  className,
  delay,
  duration,
  rotate,
}: {
  children: ReactNode;
  className: string;
  delay: number;
  duration: number;
  rotate: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 32, rotate: rotate * 1.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: reduceMotion ? 0 : [0, -12, 0, 8, 0],
        rotate: reduceMotion ? rotate : [rotate, rotate + 1.8, rotate - 1.2, rotate],
      }}
      transition={{
        opacity: { delay, duration: 0.6 },
        scale: { delay, type: "spring", stiffness: 120, damping: 15 },
        y: { delay: delay + 0.7, duration, repeat: Infinity, ease: "easeInOut" },
        rotate: { delay: delay + 0.7, duration: duration + 1, repeat: Infinity, ease: "easeInOut" },
      }}
      whileHover={{ scale: 1.06, y: -8, rotate: 0, zIndex: 20 }}
      className={`absolute z-10 min-w-52 rounded-2xl border border-white/80 bg-white/[0.78] p-4 shadow-[0_24px_70px_-35px_rgba(38,45,91,0.48)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}
