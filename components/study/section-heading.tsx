import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, body, action }: { eyebrow: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-3xl font-medium tracking-[-0.025em] text-ink sm:text-4xl">{title}</h2>
        {body ? <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted sm:text-base">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}
