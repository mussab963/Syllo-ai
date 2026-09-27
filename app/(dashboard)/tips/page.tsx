"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Bot,
  Coffee,
  Flame,
  HeartPulse,
  MoonStar,
  NotebookPen,
  Repeat2,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/study/section-heading";

const tips = [
  {
    icon: TimerReset,
    title: "Study in blocks, not marathons",
    body: "A focused 25–45 minute block is easier to start and repeat than promising yourself a three-hour session.",
  },
  {
    icon: Brain,
    title: "Recall before you reread",
    body: "Close the notes and explain the idea from memory. Then reopen the material and fill the gaps you missed.",
  },
  {
    icon: Repeat2,
    title: "Space your reviews",
    body: "Return to important material after a day, a few days, and again the following week instead of cramming once.",
  },
  {
    icon: NotebookPen,
    title: "Turn notes into questions",
    body: "Questions force your brain to retrieve information. That makes review sessions more active and measurable.",
  },
  {
    icon: MoonStar,
    title: "Protect sleep before exams",
    body: "A tired brain studies slowly and recalls poorly. Your last late-night hour is often worth less than good sleep.",
  },
  {
    icon: Coffee,
    title: "Take real breaks",
    body: "Move, drink water, and rest your eyes. Scrolling during every break keeps your attention system busy.",
  },
];

const resetSteps = [
  "Open only the course you need.",
  "Choose one clear target, such as pages 12–28.",
  "Set a timer and start before you feel ready.",
  "When it ends, mark the pages complete and stop.",
];

export default function TipsPage() {
  return (
    <div className="relative space-y-16 pb-24 sm:space-y-24">
      <div className="dashboard-light dashboard-light-a" aria-hidden="true" />
      <div className="dashboard-light dashboard-light-b" aria-hidden="true" />

      <motion.section
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.3rem] border border-white/80 bg-white/[0.78] px-5 py-10 shadow-[0_35px_110px_-70px_rgba(28,36,80,0.6)] backdrop-blur-2xl sm:px-10 sm:py-14"
      >
        <div className="hero-grid" aria-hidden="true" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-accent/10"
        />
        <motion.div
          animate={{ y: [0, -16, 0], rotate: [-2, 3, -2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[8%] top-[22%] hidden rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-xl backdrop-blur-xl lg:block"
        >
          <Flame className="h-5 w-5 text-amber-600" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Today</p>
          <p className="mt-1 font-serif text-lg text-ink">One good block is enough to begin.</p>
        </motion.div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/[0.08] px-3.5 py-2 text-sm font-semibold text-accent">
            <Sparkles className="h-4 w-4" /> Study better, not just longer
          </div>
          <h1 className="mt-5 font-serif text-[clamp(3rem,7vw,6rem)] font-medium leading-[0.93] tracking-[-0.055em] text-ink">
            Advice that makes
            <span className="block text-accent">studying feel lighter.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
            Practical habits you can use today. No productivity theater, no impossible routines — just ways to make learning clearer and more repeatable.
          </p>
          <Link href="/ai?mode=motivate"><Button className="mt-6 h-12 rounded-2xl px-5"><Bot className="mr-2 h-4 w-4" /> Get personal AI coaching</Button></Link>
        </div>
      </motion.section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Study principles"
          title="Six habits worth keeping."
          body="You do not need to use all of them at once. Pick one that solves your biggest problem this week."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 26, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: Math.min(index * 0.07, 0.25), type: "spring", stiffness: 140, damping: 19 }}
                whileHover={{ y: -7, rotateX: 1.2, rotateY: -1.2 }}
                style={{ transformPerspective: 900 }}
              >
                <Card className="h-full rounded-[1.9rem] border-white/80 bg-white/[0.84] shadow-[0_24px_70px_-55px_rgba(31,39,82,0.58)] backdrop-blur-xl">
                  <CardContent className="p-6">
                    <motion.div
                      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.12 }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent"
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <h2 className="mt-5 font-serif text-2xl font-medium text-ink">{tip.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-ink-muted">{tip.body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.1rem] bg-ink p-7 text-white shadow-[0_30px_90px_-55px_rgba(15,20,45,0.8)] sm:p-9"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full border border-white/10"
          />
          <Target className="relative z-10 h-6 w-6 text-highlight" />
          <h2 className="relative z-10 mt-5 max-w-md font-serif text-3xl font-medium leading-tight sm:text-4xl">When you feel stuck, make the goal smaller.</h2>
          <p className="relative z-10 mt-4 max-w-md text-sm leading-6 text-white/60 sm:text-base">
            “Study chemistry” is too vague. “Read pages 18–29 and answer three questions” gives your brain a finish line.
          </p>
          <div className="relative z-10 mt-8 space-y-3">
            {["Too big: Study all weekend", "Better: One 45-minute block", "Best: Pages 18–29 + 3 recall questions"].map((line, index) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className={`rounded-2xl px-4 py-3 text-sm ${index === 2 ? "bg-white text-ink" : "bg-white/7 text-white/65"}`}
              >
                {line}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-[2.1rem] border border-white/80 bg-white/[0.84] p-7 shadow-[0_26px_80px_-58px_rgba(31,39,82,0.58)] backdrop-blur-xl sm:p-9"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-highlight/15 text-amber-700"><HeartPulse className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">Reset routine</p>
              <h2 className="mt-1 font-serif text-2xl text-ink">For the days you really do not want to study.</h2>
            </div>
          </div>

          <div className="mt-7 space-y-3">
            {resetSteps.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07 }}
                whileHover={{ x: 5 }}
                className="flex items-center gap-4 rounded-2xl border border-border/70 bg-paper/60 p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-white">{index + 1}</span>
                <p className="text-sm font-medium leading-6 text-ink">{step}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.2rem] border border-accent/15 bg-gradient-to-r from-accent/[0.08] via-white to-highlight/[0.09] px-6 py-12 text-center sm:px-10 sm:py-16"
        >
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg"
          >
            <Flame className="h-6 w-6 text-amber-600" />
          </motion.div>
          <p className="mx-auto mt-6 max-w-3xl font-serif text-3xl leading-tight text-ink sm:text-4xl">
            You are not behind. You are looking at the next page, the next block, and the next small win.
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Syllo reminder</p>
        </motion.div>
      </section>
    </div>
  );
}
