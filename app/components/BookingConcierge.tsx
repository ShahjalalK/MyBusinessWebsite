"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=%2B8801329532551&text=Hi%20Shahjalal%2C%20I%20want%20to%20book%20a%2015-minute%20tracking%20review.&type=phone_number&app_absent=0";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function withCalendlyParams(url: string) {
  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set("hide_gdpr_banner", "1");
    return nextUrl.toString();
  } catch {
    return url;
  }
}

export default function BookingConcierge() {
  const pathname = usePathname();
  const shouldHideFloatingWidget = pathname === "/tools/free-email-signature-generator";
  const [isOpen, setIsOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [hasPassedHero, setHasPassedHero] = useState(false);

  const calendlyUrl =
    process.env.NEXT_PUBLIC_TRACKFLOW_CALENDLY_URL ||
    "https://calendly.com/trackflowpro/tracking-verification-call";

  const schedulerUrl = useMemo(() => withCalendlyParams(calendlyUrl), [calendlyUrl]);
  const isServicePage = pathname.startsWith("/services/");

  const pageContext = useMemo(() => {
    if (pathname === "/free-tracking-audit") {
      return {
        eyebrow: "Need a quick call?",
        title: "Book a 15-minute tracking review.",
        description:
          "Already on the audit page? You can also book a short verification call if you prefer to discuss the tracking issue live.",
        primary: "Book 15-min Call",
        secondary: "Continue Audit Form",
        secondaryHref: "#audit-request",
      };
    }

    if (pathname === "/contact") {
      return {
        eyebrow: "Review call option",
        title: "Talk through the tracking issue live.",
        description:
          "Book a focused 15-minute call for Google Ads, GA4, GTM, Meta CAPI, server-side tracking, or Looker Studio reporting questions.",
        primary: "Book 15-min Call",
        secondary: "Send Contact Message",
        secondaryHref: "#contact-form",
      };
    }

    return {
      eyebrow: "Tracking Review Desk",
      title: "Need help with tracking?",
      description:
        "Book a quick 15-minute tracking review before changing your Google Ads, GA4, GTM, Meta CAPI, server-side, or Looker Studio setup.",
      primary: "Book 15-min Call",
      secondary: "Request Free Audit",
      secondaryHref: "/free-tracking-audit",
    };
  }, [pathname]);

  useEffect(() => {
    setIsOpen(false);
    setIsSchedulerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (shouldHideFloatingWidget) {
      setHasPassedHero(false);
      setIsOpen(false);
      setIsSchedulerOpen(false);
      return;
    }

    const getHeroEnd = () => {
      const heroSection = document.querySelector("main > section") as HTMLElement | null;
      if (!heroSection) return Math.max(520, window.innerHeight * 0.82);

      const rect = heroSection.getBoundingClientRect();
      return window.scrollY + rect.top + heroSection.offsetHeight;
    };

    const updateVisibility = () => {
      const triggerPoint = Math.max(360, getHeroEnd() - 72);
      const nextHasPassedHero = window.scrollY >= triggerPoint;

      setHasPassedHero(nextHasPassedHero);

      if (!nextHasPassedHero) {
        setIsOpen(false);
      }
    };

    updateVisibility();
    const timer = window.setTimeout(updateVisibility, 450);

    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [pathname, shouldHideFloatingWidget]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsSchedulerOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isSchedulerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSchedulerOpen]);

  function openScheduler() {
    setIsOpen(false);
    setIsSchedulerOpen(true);
  }

  if (shouldHideFloatingWidget) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed right-3 z-[95] transition-all duration-300 sm:right-5 lg:right-5",
          isServicePage
            ? "bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] sm:bottom-5"
            : "bottom-[calc(env(safe-area-inset-bottom)+1rem)] sm:bottom-5",
          hasPassedHero
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-5 opacity-0"
        )}
      >
        <div
          className={cn(
            "mb-3 flex w-[calc(100vw-1.5rem)] max-w-sm max-h-[min(520px,calc(100dvh-12rem))] origin-bottom-right flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 text-white shadow-2xl shadow-slate-950/25 ring-1 ring-blue-400/10 transition-all duration-200 dark:border-slate-800 sm:w-[380px] lg:max-h-[min(520px,calc(100dvh-11rem))]",
            isOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-3 scale-[0.98] opacity-0"
          )}
        >
          <div className="relative shrink-0 overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.45),transparent_38%),linear-gradient(135deg,#020617,#0f172a)] p-5">
            <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">
                  <Sparkles className="h-3.5 w-3.5" /> {pageContext.eyebrow}
                </div>
                <h2 className="text-xl font-black leading-tight tracking-[-0.04em] text-white">
                  {pageContext.title}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                  {pageContext.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Close booking panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4 [scrollbar-width:thin] [scrollbar-color:rgba(96,165,250,0.6)_rgba(15,23,42,0.7)]">
            <div className="grid gap-2">
              {[
                "15-minute focused verification call",
                "Google Ads, GA4, GTM, Meta CAPI, server-side, or Looker Studio",
                "No login access needed before the first conversation",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-300">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={openScheduler}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              {pageContext.primary}
              <CalendarClock className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href={pageContext.secondaryHref}
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-white transition hover:bg-white/[0.08]"
              >
                {pageContext.secondary}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-white transition hover:bg-white/[0.08]"
              >
                WhatsApp
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="pointer-events-auto group relative ml-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-full border border-blue-200/70 bg-white px-3 py-2.5 text-slate-950 shadow-2xl shadow-slate-950/15 ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-blue-600/15 dark:border-blue-900/60 dark:bg-slate-950 dark:text-white dark:ring-white/10 sm:px-4"
          aria-expanded={isOpen}
          aria-label="Open booking review panel"
        >
          <span className="pointer-events-none absolute -inset-1 rounded-full bg-blue-500/20 opacity-0 blur-xl transition group-hover:opacity-100" />
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500/25" />
            <CalendarClock className="relative h-5 w-5" />
          </span>
          <span className="relative hidden text-left sm:block">
            <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
              15-min review
            </span>
            <span className="block text-sm font-black tracking-[-0.02em]">
              Book tracking call
            </span>
          </span>
        </button>
      </div>

      {isSchedulerOpen && (
        <div className="fixed inset-0 z-[300] flex items-stretch justify-center bg-slate-950/80 p-0 backdrop-blur-md sm:items-center sm:p-4 lg:p-6">
          <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border-0 bg-white shadow-2xl shadow-black/40 dark:bg-slate-950 sm:h-[calc(100dvh-2rem)] sm:max-h-[840px] sm:max-w-6xl sm:rounded-[2rem] sm:border sm:border-slate-200 dark:sm:border-slate-800">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.85rem)] dark:border-slate-800 dark:bg-slate-950 sm:px-5 sm:pt-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300 sm:text-[10px] sm:tracking-[0.18em]">
                  TrackFlow Pro Calendar
                </p>
                <h2 className="truncate text-sm font-black text-slate-950 dark:text-white sm:text-lg">
                  Book a 15-minute tracking verification call
                </h2>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-950 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 sm:inline-flex"
                >
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setIsSchedulerOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label="Close Calendly scheduler"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 bg-slate-50 dark:bg-slate-900">
              <iframe
                src={schedulerUrl}
                title="TrackFlow Pro 15-minute tracking verification call Calendly booking"
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>

            <div className="hidden border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:flex sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>Secure booking through Calendly. No ad account login required to book.</span>
              </div>
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                Open in new tab
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
