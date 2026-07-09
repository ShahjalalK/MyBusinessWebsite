import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MailCheck, ShieldCheck, Sparkles } from "lucide-react";
import Footer from "../components/footer";
import Navbar from "../components/navbar";

const siteUrl = "https://trackflowpro.com";

export const metadata: Metadata = {
  title: "Free Business Tools | TrackFlow Pro",
  description:
    "Free browser-based tools from TrackFlow Pro for small businesses, freelancers, and service providers.",
  alternates: {
    canonical: `${siteUrl}/tools`,
  },
  openGraph: {
    title: "Free Business Tools | TrackFlow Pro",
    description:
      "Free browser-based tools from TrackFlow Pro for small businesses, freelancers, and service providers.",
    url: `${siteUrl}/tools`,
    siteName: "TrackFlow Pro",
    type: "website",
  },
};

export default function ToolsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Sparkles className="h-4 w-4" />
              Free tools
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-[-0.055em] text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              Free tools for better business communication
            </h1>
            <p className="mt-6 text-base font-medium leading-8 text-slate-600 dark:text-slate-400 sm:text-lg">
              Simple, useful, browser-based tools from TrackFlow Pro. No login, no complicated setup, and no unnecessary storage.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <Link
            href="/tools/free-email-signature-generator"
            className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-blue-100 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-blue-400/30 sm:p-8"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <MailCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">
              Free Email Signature Generator
            </h2>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
              Create a clickable Gmail or Outlook email signature with contact links, social links, a CTA button, and browser-based image optimization.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-300">
              Open generator
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-6 dark:border-white/10 dark:bg-white/[0.02] sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">
              More tools are coming
            </h2>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
              We keep free tools separate from our tracking services so the main site stays focused, fast, and easy to understand.
            </p>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}
