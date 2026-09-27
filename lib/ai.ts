import type { StoredCourseFile } from "@/lib/local-courses";

export type AiMode = "ask" | "summary" | "explain" | "quiz" | "flashcards" | "exam" | "plan" | "motivate";

export type AiHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export type AiAttachment =
  | { kind: "pdf"; name: string; mediaType: "application/pdf"; data: string; size: number }
  | { kind: "image"; name: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string; size: number }
  | { kind: "text"; name: string; mediaType: string; text: string; size: number };

export const MAX_AI_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_AI_TOTAL_BYTES = 15 * 1024 * 1024;
export const MAX_AI_FILES = 3;

export function isAiSupportedFile(file: StoredCourseFile) {
  const name = file.name.toLowerCase();
  return (
    file.type === "application/pdf" ||
    name.endsWith(".pdf") ||
    ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type) ||
    file.type.startsWith("text/") ||
    /\.(txt|md|csv|json)$/i.test(name)
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

export async function fileToAiAttachment(file: StoredCourseFile): Promise<AiAttachment | null> {
  if (!isAiSupportedFile(file) || file.size > MAX_AI_FILE_BYTES) return null;

  const lowerName = file.name.toLowerCase();
  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    return {
      kind: "pdf",
      name: file.name,
      mediaType: "application/pdf",
      data: arrayBufferToBase64(await file.blob.arrayBuffer()),
      size: file.size,
    };
  }

  if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
    return {
      kind: "image",
      name: file.name,
      mediaType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
      data: arrayBufferToBase64(await file.blob.arrayBuffer()),
      size: file.size,
    };
  }

  if (file.type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(lowerName)) {
    return {
      kind: "text",
      name: file.name,
      mediaType: file.type || "text/plain",
      text: await file.blob.text(),
      size: file.size,
    };
  }

  return null;
}

export async function buildAiAttachments(files: StoredCourseFile[]) {
  const selected: StoredCourseFile[] = [];
  let total = 0;

  for (const file of files) {
    if (!isAiSupportedFile(file) || file.size > MAX_AI_FILE_BYTES) continue;
    if (selected.length >= MAX_AI_FILES || total + file.size > MAX_AI_TOTAL_BYTES) break;
    selected.push(file);
    total += file.size;
  }

  const attachments = await Promise.all(selected.map(fileToAiAttachment));
  return attachments.filter((value): value is AiAttachment => Boolean(value));
}

export const AI_MODE_PROMPTS: Record<Exclude<AiMode, "ask">, string> = {
  summary: "Summarize the selected course material. Give me the key ideas, definitions, formulas or concepts, and a short 'what to remember' section. Keep it study-friendly and structured.",
  explain: "Teach me the selected course material as if I am seeing it for the first time. Explain difficult ideas simply, use examples, and point out common misunderstandings.",
  quiz: "Quiz me on the selected course material. Create 8 questions of mixed difficulty. Do not reveal the answers immediately; ask the questions first and tell me to answer them, then grade me when I reply.",
  flashcards: "Create concise flashcards from the selected course material. Format each as **Q:** and **A:**. Prioritize concepts that are likely to matter for understanding and exams.",
  exam: "Act as my exam-prep coach. From the selected material, identify the highest-priority topics, common traps, what I should be able to explain without notes, and give me a focused revision plan.",
  plan: "Help me build a realistic study strategy for this course. Use the course material and workload context if available. Give me priorities, session structure, active-recall tasks, and a short next-action list.",
  motivate: "I need help getting started. Give me a calm, specific, non-cheesy push based on my current study context, then give me one tiny task I can start in the next 5 minutes.",
};
