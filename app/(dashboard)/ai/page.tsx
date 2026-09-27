"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  FileQuestion,
  FileText,
  GraduationCap,
  Layers3,
  Lightbulb,
  LoaderCircle,
  MessageCircleMore,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/study/section-heading";
import { useCourses } from "@/lib/use-courses";
import { formatBytes, type StoredCourse } from "@/lib/local-courses";
import {
  AI_MODE_PROMPTS,
  MAX_AI_FILE_BYTES,
  buildAiAttachments,
  isAiSupportedFile,
  type AiHistoryItem,
  type AiMode,
} from "@/lib/ai";
import {
  DEFAULT_SETTINGS,
  getTotalRemainingPages,
  loadStudyProgress,
  loadStudySettings,
  type StudyProgress,
  type StudySettings,
} from "@/lib/study";

const STUDENT_NAME_KEY = "syllo_student_name";

type ChatMessage = AiHistoryItem & { id: string };

const actions: Array<{
  mode: Exclude<AiMode, "ask">;
  title: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  { mode: "summary", title: "Smart summary", description: "Turn long material into the ideas worth remembering.", icon: Layers3 },
  { mode: "explain", title: "Explain it simply", description: "Break down difficult concepts with examples and intuition.", icon: Lightbulb },
  { mode: "quiz", title: "Quiz me", description: "Practice from your own material, then let Syllo grade you.", icon: FileQuestion },
  { mode: "flashcards", title: "Flashcards", description: "Generate quick recall cards from your uploaded course files.", icon: BrainCircuit },
  { mode: "exam", title: "Exam prep", description: "Find priorities, weak spots, traps, and a revision strategy.", icon: GraduationCap },
  { mode: "plan", title: "Study strategy", description: "Turn workload into an actionable study approach.", icon: Target },
  { mode: "motivate", title: "Get me started", description: "A calm push and one tiny task when motivation is low.", icon: Zap },
];

const capabilityCards = [
  { icon: FileText, title: "Understands your PDFs", text: "Ask about concepts, diagrams, tables, definitions, examples, or confusing pages from your course PDFs." },
  { icon: BrainCircuit, title: "Learns with you", text: "Use active recall, practice questions, flashcards, explanations, and follow-up questions instead of passive summaries." },
  { icon: Target, title: "Connects to your workload", text: "Syllo can combine your course context with your daily study target so advice is realistic, not generic." },
  { icon: MessageCircleMore, title: "Keeps the conversation", text: "Your current AI conversation is saved in this browser so you can continue where you stopped." },
];

function historyKey(courseId: string) {
  return `syllo_ai_history_${courseId || "general"}`;
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export default function AiPage() {
  const { courses, isLoading } = useCourses();
  const [studentName, setStudentName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadedHistoryKey, setLoadedHistoryKey] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [includeFiles, setIncludeFiles] = useState(true);
  const [setupError, setSetupError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [attachmentNote, setAttachmentNote] = useState("");
  const [settings, setSettings] = useState<StudySettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<StudyProgress>({});
  const endRef = useRef<HTMLDivElement>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );

  useEffect(() => {
    setStudentName(window.localStorage.getItem(STUDENT_NAME_KEY)?.trim() ?? "");
    setSettings(loadStudySettings());
    setProgress(loadStudyProgress());

    const params = new URLSearchParams(window.location.search);
    const requestedCourse = params.get("course") ?? "";
    const requestedMode = params.get("mode") as Exclude<AiMode, "ask"> | null;
    if (requestedCourse) setSelectedCourseId(requestedCourse);
    if (requestedMode && requestedMode in AI_MODE_PROMPTS) setInput(AI_MODE_PROMPTS[requestedMode]);
  }, []);

  useEffect(() => {
    if (!selectedCourseId || courses.some((course) => course.id === selectedCourseId)) return;
    if (!isLoading) setSelectedCourseId("");
  }, [courses, isLoading, selectedCourseId]);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(historyKey(selectedCourseId)) ?? "[]") as ChatMessage[];
      setMessages(Array.isArray(stored) ? stored.slice(-30) : []);
    } catch {
      setMessages([]);
    }
    setLoadedHistoryKey(historyKey(selectedCourseId));
  }, [selectedCourseId]);

  useEffect(() => {
    if (loadedHistoryKey !== historyKey(selectedCourseId)) return;
    window.localStorage.setItem(historyKey(selectedCourseId), JSON.stringify(messages.slice(-30)));
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, selectedCourseId, loadedHistoryKey]);

  const supportedFiles = selectedCourse?.files.filter(isAiSupportedFile) ?? [];
  const oversizedFiles = supportedFiles.filter((file) => file.size > MAX_AI_FILE_BYTES);
  const remainingPages = selectedCourse ? getTotalRemainingPages([selectedCourse], progress) : 0;

  function buildContext(course: StoredCourse | undefined) {
    if (!course) return `Daily study target: ${settings.dailyMinutes} minutes. Preferred pace: ${settings.pace}.`;
    const pdfPages = course.files.reduce((sum, file) => sum + (file.pageCount ?? 0), 0);
    return [
      `Daily study target: ${settings.dailyMinutes} minutes.`,
      `Preferred study pace: ${settings.pace}.`,
      `Course files: ${course.files.length}.`,
      `Detected PDF pages: ${pdfPages}.`,
      `Remaining PDF pages: ${remainingPages}.`,
    ].join(" ");
  }

  async function sendMessage(promptOverride?: string, mode: AiMode = "ask") {
    const prompt = (promptOverride ?? input).trim();
    if (!prompt || sending) return;

    const userMessage: ChatMessage = { id: createId(), role: "user", content: prompt };
    const priorHistory = messages.map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);
    setSetupError("");
    setRequestError("");
    setAttachmentNote("");

    try {
      const attachments = selectedCourse && includeFiles ? await buildAiAttachments(selectedCourse.files) : [];
      if (selectedCourse && includeFiles) {
        if (attachments.length) {
          setAttachmentNote(`Using ${attachments.length} course file${attachments.length === 1 ? "" : "s"} as AI context.`);
        } else {
          setAttachmentNote("No supported course file could be attached. Syllo will use your study context only.");
        }
      }

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mode,
          courseName: selectedCourse?.name,
          studentName,
          context: buildContext(selectedCourse),
          history: priorHistory,
          attachments,
        }),
      });

      const data = (await response.json()) as { answer?: string; error?: string; message?: string };
      if (!response.ok) {
        if (data.error === "AI_NOT_CONFIGURED") setSetupError(data.message ?? "AI is not configured yet.");
        else setRequestError(data.message ?? "Syllo AI could not answer right now.");
        return;
      }

      if (data.answer) {
        setMessages((current) => [...current, { id: createId(), role: "assistant", content: data.answer! }]);
      }
    } catch {
      setRequestError("Could not reach Syllo AI. Check your internet connection and try again.");
    } finally {
      setSending(false);
    }
  }

  function clearConversation() {
    setMessages([]);
    window.localStorage.removeItem(historyKey(selectedCourseId));
  }

  return (
    <div className="relative space-y-16 pb-28 sm:space-y-20">
      <div className="dashboard-light dashboard-light-a" aria-hidden="true" />
      <div className="dashboard-light dashboard-light-b" aria-hidden="true" />

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="ai-hero relative isolate overflow-hidden rounded-[2.3rem] border border-white/80 bg-white/[0.78] px-5 py-10 shadow-[0_38px_120px_-72px_rgba(28,36,80,0.68)] backdrop-blur-2xl sm:px-9 sm:py-14 lg:px-12"
      >
        <div className="hero-grid" aria-hidden="true" />
        <div className="ai-aurora" aria-hidden="true" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-accent/15"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 31, repeat: Infinity, ease: "linear" }}
          className="absolute -right-4 top-2 h-48 w-48 rounded-full border border-highlight/20"
        />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.05fr_0.7fr] lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 170, damping: 17 }}
              className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/[0.08] px-3.5 py-2 text-sm font-semibold text-accent"
            >
              <Sparkles className="h-4 w-4" /> Syllo AI
            </motion.div>
            <h1 className="mt-5 max-w-4xl font-serif text-[clamp(3.25rem,8vw,6.7rem)] font-medium leading-[0.88] tracking-[-0.06em] text-ink">
              Your study partner,
              <span className="block text-accent">inside every course.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
              Ask questions, understand difficult concepts, generate quizzes, build flashcards, prepare for exams, or get unstuck using your own course material.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30, rotate: 3 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ delay: 0.18, type: "spring", stiffness: 120, damping: 18 }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="rounded-[2rem] border border-white/90 bg-white/80 p-5 shadow-[0_30px_90px_-52px_rgba(41,49,100,0.75)] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ y: [0, -5, 0], rotate: [0, -4, 4, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white"
                >
                  <Bot className="h-5 w-5" />
                </motion.div>
                <div><p className="font-semibold text-ink">Ask Syllo anything</p><p className="text-sm text-ink-muted">Grounded in your study context</p></div>
              </div>
              <div className="mt-5 space-y-2.5">
                {["Explain this chapter simply", "Quiz me before tomorrow's exam", "What should I study first?"].map((text, index) => (
                  <motion.div
                    key={text}
                    animate={{ x: [0, index % 2 ? -3 : 3, 0], y: [0, -3, 0] }}
                    transition={{ duration: 4.8 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.35 }}
                    className="rounded-2xl border border-border/70 bg-paper/75 px-4 py-3 text-sm text-ink"
                  >
                    {text}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <section className="space-y-7">
        <SectionHeading eyebrow="AI toolkit" title="Choose what you need right now." body="Syllo changes its behavior depending on your goal, from understanding a topic to preparing for an exam." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.mode}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.05, 0.25) }}
                whileHover={{ y: -7, scale: 1.015 }}
                whileTap={{ scale: 0.975 }}
                onClick={() => void sendMessage(AI_MODE_PROMPTS[action.mode], action.mode)}
                className="group rounded-[1.6rem] border border-white/90 bg-white/[0.82] p-5 text-left shadow-[0_22px_65px_-52px_rgba(28,36,80,0.62)] backdrop-blur-xl"
              >
                <motion.div whileHover={{ rotate: -8 }} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Icon className="h-5 w-5" /></motion.div>
                <h3 className="mt-5 font-semibold text-ink">{action.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{action.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-accent opacity-70 transition-opacity group-hover:opacity-100">Run with AI <ArrowRight className="h-3.5 w-3.5" /></div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="h-fit rounded-[2rem] border border-white/80 bg-white/[0.84] p-5 shadow-[0_28px_80px_-58px_rgba(31,39,82,0.6)] backdrop-blur-xl xl:sticky xl:top-28"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><BookOpenCheck className="h-5 w-5" /></div>
            <div><p className="font-semibold text-ink">AI context</p><p className="text-xs text-ink-muted">Choose what Syllo should know</p></div>
          </div>

          <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">Course</label>
          <div className="relative mt-2">
            <select
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="h-12 w-full appearance-none rounded-2xl border border-border bg-paper/70 px-4 pr-10 text-sm font-semibold text-ink outline-none transition focus:border-accent/45 focus:ring-4 focus:ring-accent/10"
            >
              <option value="">General study coach</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          </div>

          <button
            type="button"
            onClick={() => setIncludeFiles((value) => !value)}
            disabled={!selectedCourse}
            className={`mt-4 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${selectedCourse && includeFiles ? "border-accent/20 bg-accent/[0.06]" : "border-border bg-paper/60"} disabled:opacity-45`}
          >
            <div><p className="text-sm font-semibold text-ink">Use course files</p><p className="mt-1 text-xs leading-5 text-ink-muted">Send supported files only when you ask AI.</p></div>
            <div className={`relative h-6 w-11 rounded-full transition ${selectedCourse && includeFiles ? "bg-accent" : "bg-border"}`}><motion.span animate={{ x: selectedCourse && includeFiles ? 20 : 2 }} className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm" /></div>
          </button>

          {selectedCourse ? (
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-ink-muted"><span>AI-ready files</span><span>{supportedFiles.length}</span></div>
              {supportedFiles.slice(0, 4).map((file) => (
                <div key={file.id} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{file.name}</span>
                  <span className="text-[10px] text-ink-muted">{formatBytes(file.size)}</span>
                </div>
              ))}
              {oversizedFiles.length ? <p className="text-[11px] leading-5 text-ink-muted">Files over 8 MB stay in Syllo but are skipped by this local AI connector.</p> : null}
              <p className="pt-1 text-[11px] leading-5 text-ink-muted">Up to 3 supported files (PDF, image, or text) are included per request to keep responses fast and costs controlled.</p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-paper p-4 text-xs leading-5 text-ink-muted">Choose a course when you want answers grounded in your uploaded material. Leave it on General for planning, motivation, and study advice.</div>
          )}
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/[0.88] shadow-[0_30px_90px_-58px_rgba(31,39,82,0.65)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 5, repeat: Infinity }} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-white"><WandSparkles className="h-4.5 w-4.5" /></motion.div>
              <div><p className="font-semibold text-ink">{selectedCourse ? `${selectedCourse.name} AI` : "Syllo Study Coach"}</p><p className="text-xs text-ink-muted">{selectedCourse && includeFiles ? "Course-aware answers enabled" : "General study guidance"}</p></div>
            </div>
            {messages.length ? <button onClick={clearConversation} className="text-xs font-semibold text-ink-muted transition hover:text-danger">Clear</button> : null}
          </div>

          <div className="min-h-[540px] max-h-[720px] overflow-y-auto px-4 py-6 sm:px-6">
            {messages.length === 0 ? (
              <div className="grid min-h-[440px] place-items-center text-center">
                <div className="max-w-md">
                  <motion.div animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-accent/10 text-accent"><Bot className="h-7 w-7" /></motion.div>
                  <h2 className="mt-5 font-serif text-3xl font-medium text-ink">What are you studying?</h2>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">Try a quick action above or ask a specific question. The more specific you are, the more useful Syllo can be.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {["Explain the hardest idea", "Make me a 20-minute review", "Quiz me with 5 questions"].map((suggestion) => (
                      <button key={suggestion} onClick={() => setInput(suggestion)} className="rounded-full border border-border bg-paper px-3 py-2 text-xs font-medium text-ink transition hover:-translate-y-0.5 hover:border-accent/25 hover:bg-accent/[0.05]">{suggestion}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 14, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={message.role === "user" ? "max-w-[88%] whitespace-pre-wrap rounded-[1.4rem] rounded-br-md bg-ink px-4 py-3.5 text-sm leading-6 text-white sm:max-w-[78%]" : "ai-answer max-w-[96%] whitespace-pre-wrap rounded-[1.5rem] rounded-bl-md border border-border/70 bg-paper/75 px-4 py-4 text-sm leading-6 text-ink sm:max-w-[88%] sm:px-5"}>
                        {message.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {sending ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="flex items-center gap-3 rounded-[1.4rem] rounded-bl-md border border-border bg-paper px-4 py-3 text-sm text-ink-muted"><LoaderCircle className="h-4 w-4 animate-spin text-accent" /> Syllo is thinking through your material…</div>
                  </motion.div>
                ) : null}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {setupError ? (
            <div className="mx-4 mb-3 rounded-2xl border border-highlight/25 bg-highlight/[0.08] p-4 text-sm text-ink sm:mx-6">
              <p className="font-semibold">Connect Claude to turn AI on.</p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">Create `.env.local`, add `ANTHROPIC_API_KEY=...`, then restart `npm run dev`. Your key stays on the server.</p>
            </div>
          ) : null}
          {requestError ? <div className="mx-4 mb-3 rounded-2xl bg-danger/[0.07] px-4 py-3 text-sm text-danger sm:mx-6">{requestError}</div> : null}
          {attachmentNote ? <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-ink-muted sm:mx-6"><Check className="h-3.5 w-3.5 text-success" /> {attachmentNote}</div> : null}

          <div className="border-t border-border/70 bg-white/80 p-3 sm:p-4">
            <div className="flex items-end gap-2 rounded-[1.5rem] border border-border bg-paper/65 p-2 transition focus-within:border-accent/30 focus-within:ring-4 focus-within:ring-accent/[0.06]">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={selectedCourse ? `Ask about ${selectedCourse.name}…` : "Ask Syllo anything about studying…"}
                className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-ink outline-none placeholder:text-ink-muted/70"
              />
              <motion.button
                whileHover={{ scale: 1.06, rotate: -4 }}
                whileTap={{ scale: 0.92 }}
                disabled={!input.trim() || sending}
                onClick={() => void sendMessage()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-white shadow-lg transition disabled:opacity-35"
                aria-label="Send to Syllo AI"
              >
                {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </motion.button>
            </div>
            <p className="mt-2 px-2 text-[10px] leading-4 text-ink-muted">Enter to send · Shift+Enter for a new line · AI can make mistakes, so verify important academic details.</p>
          </div>
        </motion.div>
      </section>

      <section className="space-y-7">
        <SectionHeading eyebrow="Built into your workflow" title="More than a chatbot." body="Syllo AI is designed around the actual things students do: understand, practice, plan, remember, and keep going." />
        <div className="grid gap-4 md:grid-cols-2">
          {capabilityCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} whileHover={{ y: -5 }}>
                <Card className="h-full rounded-[1.8rem] border-white/85 bg-white/[0.78] backdrop-blur-xl"><CardContent className="flex gap-4 p-5 sm:p-6"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Icon className="h-5 w-5" /></div><div><h3 className="font-semibold text-ink">{item.title}</h3><p className="mt-2 text-sm leading-6 text-ink-muted">{item.text}</p></div></CardContent></Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[2.3rem] bg-ink px-6 py-10 text-white sm:px-10 sm:py-12"
      >
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }} className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55"><ShieldCheck className="h-4 w-4" /> Privacy by design</div>
            <h2 className="mt-3 max-w-3xl font-serif text-3xl font-medium sm:text-4xl">Your files stay local until you intentionally ask AI to use them.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">Course storage still lives in your browser. When “Use course files” is enabled and you ask Syllo AI a question, supported selected files are sent to the configured Anthropic API for that request.</p>
          </div>
          <Link href="/planner"><Button variant="secondary" size="lg" className="rounded-2xl bg-white text-ink hover:bg-white/90">Open study planner <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </motion.section>
    </div>
  );
}
