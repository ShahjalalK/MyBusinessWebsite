"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  FileSearch,
  Home,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import Navbar from "./components/navbar";
import Footer from "./components/footer";

const quickLinks = [
  {
    title: "Back to homepage",
    description: "Return to the main TrackFlow Pro website.",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Request a tracking review",
    description: "Start with a browser-visible tracking audit.",
    href: "/free-tracking-audit",
    icon: <FileSearch className="h-5 w-5" />,
  },
  {
    title: "Contact TrackFlow Pro",
    description: "Ask for help finding the right page.",
    href: "/contact",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
];

const reasons = [
  "The link may be expired or typed incorrectly.",
  "The private review page may have been moved or disabled.",
  "The page path may not match an active service or report URL.",
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function NotFound() {
  return (
    <>
      <Navbar />

      <main className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_34%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 pb-20 pt-28 dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_34%),linear-gradient(to_bottom,#020617,#0f172a)] sm:px-6 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36">
          <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <div className="pointer-events-none absolute -right-28 top-20 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-0 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="mx-auto grid min-h-[calc(100vh-12rem)] max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.08 }}
            >
              <motion.div
                variants={fadeUp}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
              >
                <SearchCheck className="h-4 w-4" /> Page not found
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="text-[clamp(4.5rem,16vw,10rem)] font-black leading-none tracking-[-0.08em] text-slate-950 dark:text-white"
              >
                404
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 dark:text-white sm:text-5xl lg:text-6xl"
              >
                This tracking path was not found.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-2xl text-base font-medium leading-8 text-slate-600 dark:text-slate-300 sm:text-lg"
              >
                The page you tried to open is not available, but the main TrackFlow Pro website is still here. You can return home, request a tracking review, or contact me directly.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  href="/"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
                >
                  Back to Home
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/free-tracking-audit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
                >
                  Request Free Tracking Review
                </Link>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3"
              >
                {[
                  "Fixed navbar-safe spacing",
                  "Tracking-first navigation",
                  "Help available if a link expired",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <SearchCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="relative mx-auto w-full max-w-xl"
            >
              <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-600/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                        Recovery options
                      </p>
                      <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                        Choose where to go next
                      </h2>
                    </div>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <Compass className="h-6 w-6" />
                    </span>
                  </div>
                </div>

                <div className="space-y-3 p-5 sm:p-6">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-blue-900/70 dark:hover:bg-blue-950/25"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm transition group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-900 dark:text-blue-300">
                        {item.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-black text-slate-950 dark:text-white">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50 sm:p-6">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
                    Possible reason
                  </p>
                  <ul className="mt-4 space-y-3">
                    {reasons.map((item) => (
                      <li key={item} className="flex gap-3 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
