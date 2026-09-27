"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Brain, Bot, LayoutDashboard, Sparkles, Timer, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const STUDENT_NAME_KEY = "syllo_student_name";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: BookOpen },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/tips", label: "Tips", icon: Brain },
];

export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState("");

  useEffect(() => {
    setName(window.localStorage.getItem(STUDENT_NAME_KEY)?.trim() ?? "");
  }, []);

  const isArabicName = /[\u0600-\u06FF]/.test(name);

  function changeStudent() {
    window.localStorage.removeItem(STUDENT_NAME_KEY);
    router.push("/");
  }

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b border-border/60 bg-white/[0.76] backdrop-blur-2xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="group flex items-center gap-2 font-serif text-xl font-semibold text-ink">
            <span>Syllo</span>
            <motion.span animate={{ rotate: [0, 12, -6, 0], scale: [1, 1.18, 1] }} transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}><Sparkles className="h-3.5 w-3.5 text-accent" /></motion.span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border/70 bg-paper/70 p-1 lg:flex">
            {links.map((link) => {
              const active = pathname === link.href || (link.href === "/dashboard" && pathname.startsWith("/courses/"));
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? "text-ink" : "text-ink-muted hover:text-ink"}`}>
                  {active ? <motion.span layoutId="desktop-nav-pill" className="absolute inset-0 rounded-full bg-white shadow-sm" transition={{ type: "spring", stiffness: 280, damping: 24 }} /> : null}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {name ? (
              <motion.div initial={{ opacity: 0, scale: 0.85, x: 12 }} animate={{ opacity: 1, scale: 1, x: 0 }} whileHover={{ y: -2, scale: 1.02 }} className="hidden items-center gap-2 rounded-full border border-border/70 bg-paper/80 px-3 py-2 text-sm text-ink-muted shadow-sm sm:flex">
                <UserRound className="h-4 w-4" /><span className={isArabicName ? "font-arabic" : ""}>{name}</span>
              </motion.div>
            ) : null}
            <motion.div whileHover={{ scale: 1.035 }} whileTap={{ scale: 0.96 }}>
              <Button type="button" variant="ghost" size="sm" className="rounded-full px-3" onClick={changeStudent}>Change</Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[1.45rem] border border-white/80 bg-white/[0.88] p-1.5 shadow-[0_20px_70px_-30px_rgba(15,20,45,0.55)] backdrop-blur-2xl lg:hidden">
        {links.map((link) => {
          const active = pathname === link.href || (link.href === "/dashboard" && pathname.startsWith("/courses/"));
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className={`relative flex min-w-0 flex-col items-center gap-1 rounded-[1rem] px-2 py-2.5 text-[11px] font-semibold transition-colors ${active ? "text-accent" : "text-ink-muted"}`}>
              {active ? <motion.span layoutId="mobile-nav-pill" className="absolute inset-0 rounded-[1rem] bg-accent/[0.08]" transition={{ type: "spring", stiffness: 300, damping: 24 }} /> : null}
              <Icon className="relative z-10 h-4.5 w-4.5" />
              <span className="relative z-10 truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
