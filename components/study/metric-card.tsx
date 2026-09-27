"use client";

import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  delay = 0,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 150, damping: 20 }}
      whileHover={{ y: -6, scale: 1.015 }}
    >
      <Card className="h-full rounded-[1.6rem] border-white/80 bg-white/[0.82] shadow-[0_22px_60px_-48px_rgba(31,39,82,0.55)] backdrop-blur-xl">
        <CardContent className="flex h-full items-center gap-4 p-5">
          <motion.div
            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10"
          >
            <Icon className="h-5 w-5 text-accent" />
          </motion.div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
            <p className="mt-1 truncate text-2xl font-semibold text-ink">{value}</p>
            {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
