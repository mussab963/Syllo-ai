"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  estimatePdfPages,
  formatBytes,
  saveCourse,
  type StoredCourse,
  type StoredCourseFile,
} from "@/lib/local-courses";

const ACCEPTED_FILES = ".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg";

export function CourseUploadModal({ onClose, onSaved }: { onClose: () => void; onSaved: (course: StoredCourse) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [courseName, setCourseName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const totalSize = useMemo(() => files.reduce((total, file) => total + file.size, 0), [files]);

  function addFiles(incoming: FileList | File[]) {
    const next = Array.from(incoming);
    setFiles((current) => {
      const existing = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      return [...current, ...next.filter((file) => !existing.has(`${file.name}-${file.size}-${file.lastModified}`))];
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  }

  async function handleSave() {
    const cleanName = courseName.trim();
    if (!cleanName || files.length === 0 || saving) return;

    setSaving(true);
    setError("");

    try {
      const storedFiles: StoredCourseFile[] = await Promise.all(
        files.map(async (file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          blob: file,
          pageCount: await estimatePdfPages(file),
        })),
      );

      const course: StoredCourse = {
        id: crypto.randomUUID(),
        name: cleanName,
        createdAt: Date.now(),
        files: storedFiles,
      };

      await saveCourse(course);
      setSaved(true);
      window.setTimeout(() => onSaved(course), 650);
    } catch {
      setError("We could not save these files in your browser. Try smaller files or free some browser storage.");
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/30 p-0 backdrop-blur-md sm:items-center sm:p-6"
      onMouseDown={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 90, scale: 0.93, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 50, scale: 0.97, filter: "blur(8px)" }}
        transition={{ type: "spring", stiffness: 155, damping: 20 }}
        className="relative max-h-[94vh] w-full overflow-hidden rounded-t-[2rem] border border-white/80 bg-white/92 shadow-[0_45px_130px_-35px_rgba(18,24,55,0.62)] backdrop-blur-2xl sm:max-w-2xl sm:rounded-[2rem]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-course-title"
      >
        <AnimatePresence>
          {saving ? (
            <motion.div
              initial={{ x: "-120%", opacity: 0 }}
              animate={{ x: "120%", opacity: [0, 1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.05, repeat: Infinity, ease: "linear" }}
              className="pointer-events-none absolute inset-y-0 z-20 w-40 bg-gradient-to-r from-transparent via-accent/12 to-transparent blur-xl"
            />
          ) : null}
        </AnimatePresence>

        <div className="max-h-[94vh] overflow-y-auto p-5 sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-accent"
              >
                <Sparkles className="h-3.5 w-3.5" /> New course
              </motion.div>
              <h2 id="add-course-title" className="font-serif text-3xl font-medium tracking-tight text-ink">Add your study files</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-ink-muted">PDF page counts are detected locally so Syllo can build a page-by-page study plan after you save.</p>
            </div>
            <motion.button whileHover={{ rotate: 90, scale: 1.08 }} whileTap={{ scale: 0.9 }} type="button" onClick={onClose} className="rounded-full p-2 text-ink-muted hover:bg-paper hover:text-ink" aria-label="Close">
              <X className="h-5 w-5" />
            </motion.button>
          </div>

          <div className="mt-7">
            <label htmlFor="course-name" className="mb-2 block text-sm font-semibold text-ink">Course name</label>
            <Input id="course-name" value={courseName} onChange={(event) => setCourseName(event.target.value)} placeholder="e.g. Biology 201" className="h-12 rounded-2xl bg-paper/60 px-4 text-base transition-all duration-300 focus:bg-card" autoFocus />
          </div>

          <motion.div
            animate={dragging ? { scale: 1.022, borderColor: "rgba(101,116,231,0.85)", boxShadow: "0 28px 75px -38px rgba(101,116,231,0.9)" } : { scale: 1 }}
            whileHover={{ y: -3, scale: 1.006 }}
            transition={{ type: "spring", stiffness: 210, damping: 18 }}
            className="drop-zone mt-5 cursor-pointer rounded-[1.7rem] border-2 border-dashed p-7 text-center sm:p-9"
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
            onDrop={handleDrop}
          >
            <input ref={inputRef} type="file" multiple accept={ACCEPTED_FILES} className="sr-only" onChange={handleFileChange} />
            <motion.div animate={dragging ? { y: -5, rotate: -5, scale: 1.1 } : { y: [0, -6, 0] }} transition={dragging ? { type: "spring", stiffness: 220, damping: 16 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-[0_16px_40px_-24px_rgba(101,116,231,0.85)]">
              <Upload className="h-6 w-6" />
            </motion.div>
            <p className="mt-4 font-semibold text-ink">Drop your files here</p>
            <p className="mt-1 text-sm text-ink-muted">or click to browse · PDFs unlock page-aware planning</p>
          </motion.div>

          <AnimatePresence>
            {files.length > 0 ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5 overflow-hidden">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-muted"><span>{files.length} file{files.length > 1 ? "s" : ""}</span><span>{formatBytes(totalSize)}</span></div>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <motion.div key={`${file.name}-${file.size}-${file.lastModified}`} initial={{ opacity: 0, x: -16, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: Math.min(index * 0.045, 0.25), type: "spring", stiffness: 220, damping: 21 }} className="flex items-center gap-3 rounded-2xl border border-border bg-paper/60 p-3">
                      <motion.div whileHover={{ rotate: -6, scale: 1.08 }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm"><FileText className="h-5 w-5 text-accent" /></motion.div>
                      <div className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-medium text-ink">{file.name}</p><p className="mt-0.5 text-xs text-ink-muted">{formatBytes(file.size)}{file.type === "application/pdf" ? " · pages will be detected" : ""}</p></div>
                      <motion.button whileHover={{ scale: 1.1, rotate: 8 }} whileTap={{ scale: 0.88 }} type="button" className="rounded-full p-2 text-ink-muted hover:bg-card hover:text-danger" onClick={(event) => { event.stopPropagation(); setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index)); }} aria-label={`Remove ${file.name}`}><X className="h-4 w-4" /></motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {error ? <p className="mt-4 rounded-xl bg-danger/[0.08] px-4 py-3 text-sm text-danger">{error}</p> : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" className="h-11 rounded-xl px-5" onClick={onClose}>Cancel</Button>
            <motion.div whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.96 }}>
              <Button variant="accent" className={`h-11 min-w-40 rounded-xl px-5 ${saved ? "bg-success hover:bg-success" : ""}`} disabled={!courseName.trim() || files.length === 0 || saving} onClick={() => void handleSave()}>
                {saved ? <><motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}><Check className="mr-2 h-4 w-4" /></motion.span>Saved</> : saving ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }} className="mr-2 h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />Analyzing...</> : <><Upload className="mr-2 h-4 w-4" /> Save course</>}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
