"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  DatabaseZap,
  Gauge,
  LayoutDashboard,
  MousePointerClick,
  Radar,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

const rotatingServices = [
  {
    label: "Google Ads conversion tracking",
    note: "Fix purchase, lead, call, form, and enhanced conversion gaps.",
    icon: Target,
  },
  {
    label: "GA4 & Google Tag Manager audit",
    note: "Validate events, triggers, tags, data layer, and DebugView behavior.",
    icon: SearchCheck,
  },
  {
    label: "Server-side tracking setup",
    note: "Strengthen first-party signals through GTM server-side routing.",
    icon: DatabaseZap,
  },
  {
    label: "Meta CAPI event validation",
    note: "Improve server events, deduplication, and event match quality.",
    icon: Zap,
  },
  {
    label: "Looker Studio PPC dashboard",
    note: "Turn Google Ads, GA4, Meta, and lead data into clean client-ready reports.",
    icon: LayoutDashboard,
  },
];

const dashboardRows = [
  {
    label: "Google Ads purchase event",
    value: "Needs validation",
    tone: "amber",
    width: "74%",
  },
  {
    label: "GA4 key event match",
    value: "Mismatch risk",
    tone: "red",
    width: "42%",
  },
  {
    label: "Meta CAPI server signal",
    value: "Review ready",
    tone: "blue",
    width: "82%",
  },
  {
    label: "Looker Studio report layer",
    value: "Dashboard ready",
    tone: "emerald",
    width: "76%",
  },
];

const systemCards = [
  { label: "Google Ads", status: "conversion action check", icon: Target },
  { label: "GA4 + GTM", status: "event path validation", icon: BarChart3 },
  { label: "Server GTM", status: "first-party signal review", icon: ShieldCheck },
  { label: "Meta CAPI", status: "dedupe + match quality", icon: MousePointerClick },
  { label: "Looker Studio", status: "PPC dashboard reporting", icon: LayoutDashboard },
];

const proofItems = [
  "No login required for first review",
  "Evidence-first audit workflow",
  "GA4, GTM, Meta CAPI & Looker Studio",
];

export default function PremiumHomeHero() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % rotatingServices.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, []);

  const ActiveIcon = rotatingServices[active].icon;

  const particleDots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        id: index,
        left: `${8 + ((index * 17) % 82)}%`,
        top: `${12 + ((index * 23) % 72)}%`,
        delay: index * 0.18,
      })),
    []
  );

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 px-4 pt-24 pb-14 text-white sm:px-6 sm:pt-28 sm:pb-20 lg:px-8 lg:pt-32 lg:pb-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.34),transparent_32%),radial-gradient(circle_at_86%_16%,rgba(14,165,233,0.22),transparent_30%),radial-gradient(circle_at_70%_86%,rgba(59,130,246,0.18),transparent_36%),linear-gradient(135deg,#020617_0%,#06122b_45%,#020617_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.23] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-8 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl sm:h-96 sm:w-96" />

      {!reduceMotion &&
        particleDots.map((dot) => (
          <motion.span
            key={dot.id}
            aria-hidden="true"
            className="pointer-events-none absolute hidden h-1.5 w-1.5 rounded-full bg-cyan-300/40 shadow-[0_0_22px_rgba(34,211,238,0.65)] lg:block"
            style={{ left: dot.left, top: dot.top }}
            animate={{ y: [0, -18, 0], opacity: [0.18, 0.72, 0.18], scale: [1, 1.35, 1] }}
            transition={{ duration: 5.5, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.03fr_0.97fr] lg:gap-14">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100 shadow-2xl shadow-blue-950/30 backdrop-blur sm:mb-6 sm:px-4 sm:text-[11px] sm:tracking-[0.22em]">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Tracking-first audit before login access
          </div>

          <h1 className="max-w-5xl text-[2.55rem] font-black leading-[0.92] tracking-[-0.065em] text-white sm:text-6xl sm:leading-[0.92] md:text-7xl lg:text-[5.4rem]">
            Fix broken tracking before it wastes your ad budget.
          </h1>

          <div className="mt-5 min-h-[96px] max-w-3xl rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-3 shadow-2xl shadow-blue-950/20 backdrop-blur sm:mt-7 sm:min-h-[104px] sm:rounded-[1.75rem] sm:p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 sm:text-[11px]">
              TrackFlow Pro helps you repair
            </p>
            <div className="mt-2 flex items-start gap-3 sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.22)]">
                <ActiveIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={rotatingServices[active].label}
                    initial={reduceMotion ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -16, filter: "blur(8px)" }}
                    transition={{ duration: 0.36, ease: "easeOut" }}
                    className="text-xl font-black leading-tight tracking-[-0.04em] text-white sm:text-2xl md:text-3xl"
                  >
                    {rotatingServices[active].label}
                  </motion.p>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={rotatingServices[active].note}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="mt-1 text-sm font-semibold leading-6 text-slate-300"
                  >
                    {rotatingServices[active].note}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:mt-7 sm:text-lg sm:leading-8">
            TrackFlow Pro fixes Google Ads conversion tracking, validates GA4 and Google Tag Manager events, improves Meta CAPI signals, builds cleaner server-side tracking, and creates Looker Studio reporting dashboards before you scale paid traffic.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row">
            <Link
              href="/free-tracking-audit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_22px_60px_rgba(34,211,238,0.28)] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-300/25 sm:w-auto sm:px-7"
            >
              Request Free Tracking Audit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/services"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.055] px-6 py-4 text-sm font-black text-white shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/[0.35] hover:bg-white/[0.09] sm:w-auto sm:px-7"
            >
              View Tracking Services
            </Link>
          </div>

          <div className="mt-7 grid max-w-3xl gap-3 sm:mt-8 sm:grid-cols-3">
            {proofItems.map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-bold text-slate-200 backdrop-blur">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <HeroSignalDashboard reduceMotion={Boolean(reduceMotion)} />
      </div>
    </section>
  );
}

function HeroSignalDashboard({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 36, scale: 0.96 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-xl lg:max-w-none"
    >
      <div className="absolute -inset-4 rounded-[2.5rem] bg-cyan-300/10 blur-3xl sm:-inset-8" />
      <motion.div
        aria-hidden="true"
        className="absolute -right-2 top-7 z-20 hidden w-56 rounded-3xl border border-white/[0.12] bg-white/95 p-4 text-slate-950 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl dark:bg-white/95 sm:block lg:-right-7"
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Detected</p>
            <p className="text-sm font-black leading-5">Missing lead event</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="absolute -bottom-4 left-4 z-20 hidden w-64 rounded-3xl border border-emerald-200/70 bg-white/95 p-4 text-slate-950 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl dark:bg-white/95 sm:block lg:-left-8"
        animate={reduceMotion ? undefined : { y: [0, 12, 0] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Validated</p>
            <p className="text-sm font-black leading-5">Dashboard report ready</p>
          </div>
        </div>
      </motion.div>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-white/[0.075] p-3 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:rounded-[2.5rem] sm:p-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4 sm:rounded-[2rem] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70 sm:text-[11px]">
                Live audit command center
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-white sm:text-3xl">
                Measurement Signal Map
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
              Evidence-first
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
            <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.045] p-4">
              <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full sm:h-48 sm:w-48" style={{ background: "conic-gradient(from 180deg, #22d3ee 0deg, #2563eb 252deg, rgba(255,255,255,0.08) 252deg 360deg)" }}>
                <div className="absolute inset-3 rounded-full bg-slate-950" />
                <div className="relative text-center">
                  <Gauge className="mx-auto mb-2 h-6 w-6 text-cyan-200" />
                  <div className="text-5xl font-black tracking-[-0.08em] text-white">82</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Signal score</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <MetricCard label="Events" value="24" />
                <MetricCard label="Issues" value="3" warning />
              </div>
            </div>

            <div className="space-y-3">
              {dashboardRows.map((row, index) => (
                <motion.div
                  key={row.label}
                  initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                  animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.18 + index * 0.08, ease: "easeOut" }}
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">{row.label}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">Browser-visible evidence + account validation path</p>
                    </div>
                    <span className={statusBadge(row.tone)}>{row.value}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className={progressClass(row.tone)}
                      initial={reduceMotion ? false : { width: 0 }}
                      animate={reduceMotion ? undefined : { width: row.width }}
                      transition={{ duration: 0.85, delay: 0.32 + index * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {systemCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="group rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.055]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">{card.label}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-400">{card.status}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-[1.35rem] border border-cyan-300/[0.16] bg-cyan-300/[0.075] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                  <Radar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Next action</p>
                  <p className="mt-1 text-xs font-semibold text-slate-300">Audit report and dashboard separate evidence from assumptions.</p>
                </div>
              </div>
              <Link href="/free-tracking-audit" className="inline-flex items-center justify-center gap-1 rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100">
                Start review <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:hidden">
        <MobileMiniStat label="Score" value="82" />
        <MobileMiniStat label="Issues" value="3" />
        <MobileMiniStat label="Systems" value="5" />
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
      <div className={warning ? "text-2xl font-black text-amber-200" : "text-2xl font-black text-cyan-200"}>{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  );
}

function MobileMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-center backdrop-blur">
      <div className="text-xl font-black text-white">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}

function statusBadge(tone: string) {
  const base = "shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] sm:px-3 sm:text-[10px] sm:tracking-widest";
  if (tone === "amber") return `${base} bg-amber-300/[0.12] text-amber-200`;
  if (tone === "red") return `${base} bg-red-400/[0.12] text-red-200`;
  if (tone === "blue") return `${base} bg-cyan-300/[0.12] text-cyan-200`;
  return `${base} bg-emerald-300/[0.12] text-emerald-200`;
}

function progressClass(tone: string) {
  const base = "h-full rounded-full";
  if (tone === "amber") return `${base} bg-amber-300`;
  if (tone === "red") return `${base} bg-red-300`;
  if (tone === "blue") return `${base} bg-cyan-300`;
  return `${base} bg-emerald-300`;
}
