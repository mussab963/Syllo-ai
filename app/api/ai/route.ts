import { NextResponse } from "next/server";
import type { AiAttachment, AiHistoryItem, AiMode } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_HISTORY = 10;
const MAX_PROMPT_CHARS = 12_000;
const MAX_TEXT_ATTACHMENT_CHARS = 80_000;

const SYSTEM_PROMPT = `You are Syllo AI, an expert university study coach embedded inside a student SaaS product.

Your job is to help the student understand, plan, practice, remember, and stay consistent.

Behavior:
- Be warm, direct, intelligent, and practical.
- Prefer clear short sections, bullets, checklists, examples, and step-by-step explanations when useful.
- When course files are attached, ground your answer in those materials and say when the material does not contain enough information.
- Do not invent citations, page numbers, deadlines, formulas, or facts that are not supported by the supplied material.
- Distinguish clearly between what comes from the student's files and general knowledge.
- For quizzes, do not reveal answers before the student attempts them unless they ask for the answers.
- For study plans, make the plan realistic and action-oriented.
- If the student seems overwhelmed, reduce the task to a small next step instead of giving generic motivation.
- Match the student's language. If they write Arabic, answer Arabic. If they write English, answer English.
- You are a study coach, not a replacement for the student's own learning. Help them reason and learn rather than merely dumping answers.

You may receive PDFs, images, or plain-text course files. Analyze them carefully before answering.`;

type AiRequest = {
  prompt?: string;
  mode?: AiMode;
  courseName?: string;
  studentName?: string;
  context?: string;
  history?: AiHistoryItem[];
  attachments?: AiAttachment[];
};

type ClaudeResponse = {
  content?: Array<{ type?: string; text?: string }>;
  model?: string;
  usage?: unknown;
  error?: { message?: string };
};

function safeHistory(history: AiHistoryItem[] | undefined) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY)
    .filter((item) => (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
    .map((item) => ({ role: item.role, content: item.content.slice(0, 20_000) }));
}

function buildAttachmentBlocks(attachments: AiAttachment[] | undefined): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = [];
  if (!Array.isArray(attachments)) return blocks;

  for (const attachment of attachments.slice(0, 3)) {
    if (!attachment || typeof attachment.name !== "string") continue;

    if (attachment.kind === "pdf" && typeof attachment.data === "string") {
      blocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: attachment.data },
        title: attachment.name.slice(0, 200),
        cache_control: { type: "ephemeral" },
      });
      continue;
    }

    if (attachment.kind === "image" && typeof attachment.data === "string") {
      blocks.push({
        type: "image",
        source: { type: "base64", media_type: attachment.mediaType, data: attachment.data },
      });
      continue;
    }

    if (attachment.kind === "text" && typeof attachment.text === "string") {
      blocks.push({
        type: "text",
        text: `\n--- File: ${attachment.name.slice(0, 200)} ---\n${attachment.text.slice(0, MAX_TEXT_ATTACHMENT_CHARS)}\n--- End file ---`,
      });
    }
  }

  return blocks;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI_NOT_CONFIGURED", message: "Add ANTHROPIC_API_KEY to .env.local, then restart Syllo." },
      { status: 503 },
    );
  }

  let body: AiRequest;
  try {
    body = (await request.json()) as AiRequest;
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST", message: "The AI request could not be read." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, MAX_PROMPT_CHARS) : "";
  if (!prompt) {
    return NextResponse.json({ error: "EMPTY_PROMPT", message: "Write a question or choose an AI action first." }, { status: 400 });
  }

  const contextLines = [
    body.studentName ? `Student: ${String(body.studentName).slice(0, 100)}` : "",
    body.courseName ? `Selected course: ${String(body.courseName).slice(0, 200)}` : "",
    body.mode ? `Study mode: ${body.mode}` : "",
    body.context ? `Study context: ${String(body.context).slice(0, 4_000)}` : "",
  ].filter(Boolean);

  const userContent = [
    ...buildAttachmentBlocks(body.attachments),
    {
      type: "text",
      text: `${contextLines.length ? `${contextLines.join("\n")}\n\n` : ""}${prompt}`,
    },
  ];

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 2200,
        system: SYSTEM_PROMPT,
        messages: [
          ...safeHistory(body.history),
          { role: "user", content: userContent },
        ],
      }),
    });

    const data = (await anthropicResponse.json()) as ClaudeResponse;
    if (!anthropicResponse.ok) {
      return NextResponse.json(
        { error: "AI_REQUEST_FAILED", message: data.error?.message || "Claude could not complete this request." },
        { status: anthropicResponse.status },
      );
    }

    const answer = (data.content ?? [])
      .filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("\n\n")
      .trim();

    return NextResponse.json({
      answer: answer || "I could not generate a useful response from that material. Try asking a more specific question.",
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The AI request failed.";
    console.error("Syllo AI error:", error);
    return NextResponse.json({ error: "AI_REQUEST_FAILED", message }, { status: 500 });
  }
}
