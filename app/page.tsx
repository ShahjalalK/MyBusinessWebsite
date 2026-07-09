// ============================================================
// FILE: app/page.tsx
// Purpose: SEO-first premium homepage for TrackFlow Pro.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileSearch,
  LineChart,
  LockKeyhole,
  MousePointerClick,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import PremiumHomeHero from "./components/premium-home-hero";
import Image from "next/image";

export const metadata: Metadata = {
  title: "TrackFlow Pro | Google Ads Conversion Tracking Specialist",
  description:
  "TrackFlow Pro helps businesses fix Google Ads conversion tracking, GA4/GTM events, Meta CAPI, enhanced conversions, server-side tracking, and Looker Studio dashboards with an evidence-based tracking audit.",
  alternates: {
    canonical: "https://trackflowpro.com",
  },
  openGraph: {
    title: "TrackFlow Pro | Google Ads Conversion Tracking Specialist",
    description:
      "Evidence-based tracking audits for Google Ads, GA4, GTM, Meta CAPI, enhanced conversions, server-side measurement, and Looker Studio PPC dashboards.",
    url: "https://trackflowpro.com",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro - Google Ads Conversion Tracking and Server-Side Tracking Specialist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackFlow Pro | Google Ads Conversion Tracking Specialist",
    description:
      "Fix conversion tracking issues across Google Ads, GA4, GTM, Meta CAPI, server-side measurement, and Looker Studio reporting dashboards.",
    images: ["/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
};

const services = [
  {
    title: "Google Ads Conversion Tracking",
    href: "/services/google-ads-conversion-tracking",
    icon: <Target className="h-6 w-6" />,
    description:
      "Fix broken conversion actions, GTM tags, enhanced conversions, form tracking, call tracking, and ecommerce attribution.",
    highlight: "Google Ads tags, enhanced conversions, GTM, forms, calls, and ecommerce events.",
  },
  {
    title: "Server-Side Tracking",
    href: "/services/server-side-tracking",
    icon: <ShieldCheck className="h-6 w-6" />,
    description:
      "Build a more reliable first-party measurement foundation with GTM server-side and server-side tagging.",
    highlight: "GTM server-side, first-party tracking, event routing, and signal validation.",
  },
  {
    title: "GA4 & GTM Audit",
    href: "/services/ga4-gtm-audit",
    icon: <FileSearch className="h-6 w-6" />,
    description:
      "Audit GA4 events, GTM triggers, tags, data layer, consent behavior, and conversion validation gaps.",
    highlight: "GA4 events, GTM tags, triggers, data layer, and conversion validation.",
  },
  {
    title: "Meta CAPI Setup",
    href: "/services/meta-capi",
    icon: <Zap className="h-6 w-6" />,
    description:
      "Improve Meta Pixel and Conversions API event quality with cleaner server events and deduplication checks.",
    highlight: "Meta Pixel, Conversions API, event match quality, and deduplication checks.",
  },
  {
    title: "Looker Studio Dashboard",
    href: "/services/looker-studio-dashboard",
    icon: <LineChart className="h-6 w-6" />,
    description:
      "Build clean PPC and analytics dashboards for Google Ads, GA4, Meta Ads, leads, revenue, and tracking health.",
    highlight: "Google Ads, GA4, Meta Ads, lead data, revenue views, and PPC reporting dashboards.",
  },
];

const proofStats = [
  {
    label: "Specialist focus",
    value: "Focused",
    note: "Tracking, attribution, and measurement — not generic marketing.",
  },
  {
    label: "Initial review",
    value: "0 login",
    note: "Public browser-visible evidence first.",
  },
  {
    label: "Core systems",
    value: "5 systems",
    note: "Google Ads, GA4, GTM, Meta CAPI, server-side, and Looker Studio reporting.",
  },
  {
    label: "Process",
    value: "Audit → Fix → Report",
    note: "Evidence, implementation, validation, and dashboard-ready reporting.",
  },
];

const problems = [
  {
    title: "Google Ads conversions are not tracking correctly",
    description:
      "Missing or duplicated conversions can make bidding decisions unreliable and hide which campaigns are actually producing leads or sales.",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "GA4, Google Ads, and reports do not match",
    description:
      "GA4 key events, Google Ads conversion actions, GTM tags, consent mode, attribution windows, and Looker Studio sources can all create reporting gaps.",
    icon: <LineChart className="h-5 w-5" />,
  },
  {
    title: "Meta Pixel needs stronger server-side signals",
    description:
      "Meta CAPI can improve event reliability when browser-side pixels lose signal quality or event match quality is weak.",
    icon: <MousePointerClick className="h-5 w-5" />,
  },
  {
    title: "Server-side tracking exists but is not verified",
    description:
      "A GTM server container alone is not enough. Events, parameters, deduplication, and destinations need validation.",
    icon: <Database className="h-5 w-5" />,
  },
];

const auditSteps = [
  {
    number: "01",
    title: "Public evidence review",
    description:
      "I first review browser-visible evidence: tags, network calls, events, pixels, forms, consent behavior, and page flows.",
  },
  {
    number: "02",
    title: "Tracking diagnosis",
    description:
      "I map the likely gaps across Google Ads, GA4, GTM, Meta CAPI, enhanced conversions, and server-side tracking.",
  },
  {
    number: "03",
    title: "Fix plan",
    description:
      "You get a clear priority list: what is broken, why it matters, what to fix first, and which access is needed for final validation.",
  },
  {
    number: "04",
    title: "Implementation & validation",
    description:
      "After access is approved, tracking is fixed and validated inside GA4, GTM, Google Ads, Meta, CRM, or server logs.",
  },
];

const faqs = [
  {
    question: "Do you need access to my ad account for the first review?",
    answer:
      "No. The first tracking review can start with public browser-visible evidence. Final confirmation may require GA4, GTM, Google Ads, Meta, CRM, or server-log access.",
  },
  {
    question: "Can you fix Google Ads conversion tracking not working?",
    answer:
      "Yes. I review conversion actions, GTM tags, GA4 key events, enhanced conversions, call/form tracking, ecommerce events, and server-side tracking paths.",
  },
  {
    question: "Do you work with server-side tracking and Meta CAPI?",
    answer:
      "Yes. TrackFlow Pro focuses on server-side tracking, GTM server-side, Meta Conversions API, event quality, and deduplication validation.",
  },
  {
    question: "Is this only for ecommerce brands?",
    answer:
      "No. The audit works for lead generation, ecommerce, local services, SaaS, professional services, and businesses running paid campaigns.",
  },
  {
    question: "Can you build a Looker Studio dashboard after tracking is fixed?",
    answer:
      "Yes. After the tracking setup is validated, I can build a Looker Studio dashboard for Google Ads, GA4, Meta Ads, leads, revenue, campaign performance, and tracking health.",
  },
];

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "TrackFlow Pro",
      url: "https://trackflowpro.com",
      logo: "https://trackflowpro.com/android-chrome-512x512.png",
      founder: {
        "@type": "Person",
        name: "Shahjalal Khan",
        jobTitle: "Founder & Tracking Architect",
        sameAs: "https://www.linkedin.com/in/shahjalal-khan/",
      },
      sameAs: ["https://www.linkedin.com/in/shahjalal-khan/"],
    },
    {
        "@type": "WebSite",
        name: "TrackFlow Pro",
        alternateName: ["TrackFlowPro", "Track Flow Pro"],
        url: "https://trackflowpro.com",
        description:
          "Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, server-side measurement, and Looker Studio dashboard support.",
      },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <Navbar />
      <main className="overflow-x-hidden bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <HomeHero />
        <TrustBar />
        <ProblemSection />
        <ServicesSection />
        <ExploreTrackFlowSection />
        <AuditProofSection />
        <ProcessSection />
        <ReportPreviewSection />
        <FounderTrustSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}

function HomeHero() {
  return <PremiumHomeHero />;
}

function TrustBar() {
  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-slate-950 px-4 py-8 text-white dark:border-slate-800 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.22),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.14),transparent_26%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {proofStats.map((item) => (
          <div
            key={item.label}
            className="group rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-slate-950/20 backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/[0.07] sm:rounded-[1.75rem]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl font-black tracking-[-0.04em] text-white">
                {item.value}
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
            </div>
            <div className="mt-2 text-sm font-black text-blue-100">
              {item.label}
            </div>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-400">
              {item.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="pointer-events-none absolute left-1/2 top-12 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-950/20" />
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Tracking problems"
          title="Broken tracking makes profitable campaigns look unreliable."
          description="If Google Ads, GA4, GTM, Meta Pixel, server-side events, or Looker Studio reports are not validated, you may scale decisions using incomplete data."
        />

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2">
          {problems.map((problem, index) => (
            <div
              key={problem.title}
              className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/10 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/70 sm:rounded-[2rem] sm:p-7"
            >
              <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 translate-x-10 -translate-y-10 rounded-full bg-red-100 blur-2xl transition group-hover:bg-blue-100 dark:bg-red-950/20 dark:group-hover:bg-blue-950/30" />
              <div className="relative mb-5 flex items-center justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-sm dark:bg-red-950/30 dark:text-red-300">
                  {problem.icon}
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                  Signal gap 0{index + 1}
                </span>
              </div>
              <h3 className="relative text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                {problem.title}
              </h3>
              <p className="relative mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section className="relative overflow-hidden bg-slate-50 px-4 py-14 dark:bg-slate-900/25 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <SectionHeader
            eyebrow="Specialist services"
            title="Tracking, reporting, and conversion measurement services."
            description="A focused service stack for businesses that rely on paid traffic and need cleaner conversion data, stronger attribution, and dashboard-ready reporting."
          />
          <div className="rounded-[1.5rem] border border-blue-100 bg-white p-5 shadow-xl shadow-blue-950/5 dark:border-blue-900/40 dark:bg-slate-950/70 sm:rounded-[2rem] sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
              Measurement stack
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-black text-slate-700 dark:text-slate-200 sm:grid-cols-5">
              {["Google Ads", "GA4", "GTM", "Meta CAPI", "Looker Studio"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-center dark:border-slate-800 dark:bg-slate-900"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2 xl:grid-cols-5">
          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group relative flex min-h-[280px] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/10 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-blue-900/70 sm:rounded-[2rem] sm:p-6"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100 blur-2xl opacity-0 transition group-hover:opacity-100 dark:bg-blue-950/40" />
              <span className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/40 dark:text-blue-300">
                {service.icon}
              </span>
              <h3 className="relative text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                {service.title}
              </h3>
              <p className="relative mt-3 flex-1 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                {service.description}
              </p>
              <p className="relative mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {service.highlight}
              </p>
              <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-300">
                Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuditProofSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-8 sm:gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-12">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <LockKeyhole className="h-4 w-4" /> Trust-first audit process
          </div>
          <h2 className="text-[2rem] font-black leading-[1.03] tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl sm:leading-[1.02]">
            No login required for the first tracking review.
          </h2>
          <p className="mt-4 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400 sm:mt-6 sm:text-base sm:leading-8">
            The first review is based on public browser-visible evidence. That means I can inspect tags, network requests, conversion events, pixels, and form behavior without asking for account access upfront.
          </p>
          <div className="mt-8 space-y-4">
            {[
              "Public browser-visible evidence first",
              "Clear distinction between detected evidence and final confirmation",
              "Final validation only after approved access to GA4, GTM, Google Ads, Meta, CRM, server logs, or reporting sources",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:rounded-[2rem] sm:p-6">
          <div className="rounded-[1.25rem] bg-white p-4 shadow-sm dark:bg-slate-950 sm:rounded-[1.5rem] sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
              Sample audit scope
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Google Ads conversion actions",
                "GA4 key events",
                "GTM tags and triggers",
                "Meta Pixel and CAPI events",
                "Enhanced conversions",
                "Server-side tracking signals",
                "Form and call tracking",
                "Ecommerce event validation",
                "Looker Studio dashboard readiness",
                "PPC reporting data source checks",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-black text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.24),transparent_32%),radial-gradient(circle_at_85%_30%,rgba(14,165,233,0.12),transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Audit → Fix → Validate → Report"
          title="A clear process for tracking and reporting problems."
          description="Every fix starts with evidence, not assumptions. The goal is to identify what matters, fix the highest-impact gaps, validate the result, and make the data ready for decision-making dashboards."
          dark
        />

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {auditSteps.map((step) => (
            <div key={step.number} className="group rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-slate-950/20 transition hover:-translate-y-1 hover:border-blue-400/40 hover:bg-white/[0.07] sm:rounded-[2rem] sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4 sm:mb-8">
                <div className="text-4xl font-black tracking-[-0.06em] text-blue-400 sm:text-5xl">
                  {step.number}
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
              </div>
              <h3 className="text-lg font-black text-white">{step.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReportPreviewSection() {
  const reportRows = [
    {
      title: "Tracking diagnosis",
      text: "Google Ads conversion actions are checked against GA4, GTM, browser events, and server-side signals.",
    },
    {
      title: "Dashboard readiness",
      text: "Confirmed events and clean source data can be prepared for Looker Studio reporting.",
    },
    {
      title: "Decision view",
      text: "Campaign spend, leads, revenue, CPA, ROAS, and tracking health can be monitored in one view.",
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="pointer-events-none absolute right-0 top-20 -z-10 h-80 w-80 rounded-full bg-blue-100/80 blur-3xl dark:bg-blue-950/20" />
      <div className="mx-auto grid max-w-7xl gap-8 sm:gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 sm:rounded-[2rem] sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
                Audit + dashboard preview
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
                From tracking evidence to Looker Studio reporting
              </h2>
            </div>
            <span className="w-fit rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              Sample flow
            </span>
          </div>

          <div className="relative grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              {reportRows.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
                >
                  <h3 className="text-sm font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-400">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 sm:rounded-[1.5rem]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Looker Studio
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    PPC Dashboard
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  Ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Spend", "$12.4K"],
                  ["Leads", "248"],
                  ["CPA", "$50"],
                  ["ROAS", "4.2x"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                {["Google Ads campaigns", "GA4 conversions", "Meta Ads leads"].map((item, index) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between text-sm font-black text-white">
                      <span>{item}</span>
                      <span className="text-blue-300">{index === 0 ? "72%" : index === 1 ? "61%" : "48%"}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: index === 0 ? "72%" : index === 1 ? "61%" : "48%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <SectionHeader
            eyebrow="Why it builds trust"
            title="The audit report can become a clean Looker Studio dashboard."
            description="After the tracking setup is validated, TrackFlow Pro can turn Google Ads, GA4, Meta Ads, leads, revenue, and campaign data into a clean dashboard clients can actually use."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/services/looker-studio-dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 sm:w-auto"
            >
              View Looker Studio Service
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/free-tracking-audit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-900 sm:w-auto"
            >
              Get a tracking audit
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FounderTrustSection() {
  return (
 <section className="bg-slate-50 px-4 py-14 dark:bg-slate-900/25 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
  <div className="mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-950 sm:rounded-[2.5rem] sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:p-10">
    <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 dark:border-slate-800 dark:from-blue-950/25 dark:via-slate-950 dark:to-slate-900 sm:rounded-[2rem] sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative text-center">
        <div className="mx-auto h-44 w-44 overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-2xl shadow-blue-950/10 ring-8 ring-white/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-900/70 sm:h-60 sm:w-60 sm:rounded-[2.25rem]">
          <Image
            src="/team/shahjalal-khan-founder-trackflow-pro.webp"
            alt="Shahjalal Khan, Founder and Tracking Specialist at TrackFlow Pro"
            width={320}
            height={320}
            sizes="(max-width: 640px) 176px, 240px"
            loading="lazy"
            className="h-full w-full object-contain object-bottom"
          />
        </div>

        <div className="mt-6">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
            Founder & Tracking Architect
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">
            Shahjalal Khan
          </h2>

          <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
            Focused on Google Ads measurement, GA4/GTM validation, Meta CAPI, enhanced conversions, server-side tracking quality, and Looker Studio reporting.
          </p>

          <a
            href="https://www.linkedin.com/in/shahjalal-khan/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
          >
            View LinkedIn Profile
          </a>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5 text-left dark:border-blue-900/60 dark:bg-blue-950/25">
          <p className="text-sm font-black text-slate-950 dark:text-white">
            Tracking-first specialist support
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            Built for businesses that run paid traffic but cannot fully trust their conversion data.
          </p>
        </div>
      </div>
    </div>

    <div className="flex flex-col justify-center p-2 lg:p-6">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300 sm:mb-4 sm:text-[11px] sm:tracking-[0.24em]">
        Specialist, not a general agency
      </p>

      <h3 className="max-w-3xl text-[2rem] font-black leading-[1.03] tracking-[-0.055em] text-slate-950 dark:text-white sm:text-5xl sm:leading-[1.02]">
        Built by a tracking specialist, not a general marketing agency.
      </h3>

      <p className="mt-4 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400 sm:mt-6 sm:text-base sm:leading-8">
        TrackFlow Pro is focused on Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, server-side measurement, Looker Studio dashboards, and conversion signal quality.
      </p>

      <p className="mt-4 text-base font-medium leading-8 text-slate-600 dark:text-slate-400">
        The goal is simple: help you understand whether your conversion data is reliable before you make bigger decisions about budget, bidding, reporting, attribution, or dashboard performance.
      </p>

      <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
        {[
          "Google Ads conversion tracking audit",
          "GA4 and GTM event validation",
          "Meta CAPI and server-side event review",
          "Enhanced conversions and lead tracking",
          "Tracking-first PPC audit workflow",
          "Looker Studio PPC dashboard reporting",
        ].map((item) => (
          <div
            key={item}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-900/70 dark:hover:bg-blue-950/25"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-blue-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            {item}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/free-tracking-audit"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
        >
          Request Free Tracking Review
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href="/contact"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/40"
        >
          Contact Directly
        </Link>
      </div>
    </div>
  </div>
</section>
  );
}

function FaqSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions before booking a tracking review."
          description="Clear answers for businesses that want to fix conversion tracking before scaling ad spend."
          centered
        />
        <div className="mt-8 space-y-4 sm:mt-12">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-[1.25rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50 sm:rounded-[1.5rem] sm:p-6"
            >
              <h3 className="text-lg font-black text-slate-950 dark:text-white">{faq.question}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExploreTrackFlowSection() {
  const links = [
    {
      title: "Google Ads Conversion Tracking",
      href: "/services/google-ads-conversion-tracking",
      category: "Tracking",
      description: "Fix Google Ads conversion actions, enhanced conversions, GTM tags, forms, calls, and ecommerce tracking.",
    },
    {
      title: "Server-Side Tracking",
      href: "/services/server-side-tracking",
      category: "Signal quality",
      description: "Build stronger first-party tracking with GTM server-side tagging, event routing, and validation.",
    },
    {
      title: "GA4 & GTM Audit",
      href: "/services/ga4-gtm-audit",
      category: "Analytics",
      description: "Audit GA4 events, GTM tags, triggers, data layer, consent behavior, and conversion gaps.",
    },
    {
      title: "Meta CAPI Setup",
      href: "/services/meta-capi",
      category: "Meta Ads",
      description: "Improve Meta Pixel and Conversions API event quality, deduplication, and server-side signals.",
    },
    {
      title: "Looker Studio Dashboard",
      href: "/services/looker-studio-dashboard",
      category: "Reporting",
      description: "Build clean PPC dashboards for Google Ads, GA4, Meta Ads, leads, revenue, and tracking health.",
    },
    {
      title: "About TrackFlow Pro",
      href: "/about",
      category: "Company",
      description: "Learn about TrackFlow Pro, the tracking-first audit process, and specialist measurement support.",
    },
    {
      title: "Contact",
      href: "/contact",
      category: "Contact",
      description: "Contact TrackFlow Pro directly for tracking, attribution, GA4, GTM, and conversion measurement help.",
    },
    {
      title: "Free Tracking Audit",
      href: "/free-tracking-audit",
      category: "CTA",
      description: "Request a free tracking review before scaling Google Ads, Meta Ads, or other paid traffic.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white px-4 py-14 dark:bg-slate-950 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute left-0 top-0 -z-10 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-950/20" />
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Explore TrackFlow Pro"
          title="Important tracking and reporting pages for Google Ads, GA4, GTM, Meta CAPI, Looker Studio, and server-side measurement."
          description="These pages help visitors and search engines understand the core TrackFlow Pro services, reporting support, and contact paths."
        />

        <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 lg:grid-cols-4">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-2xl hover:shadow-blue-950/10 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/70 dark:hover:bg-slate-950 sm:rounded-[2rem] sm:p-6"
            >
              <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full bg-blue-100 opacity-0 blur-2xl transition group-hover:opacity-100 dark:bg-blue-950/40" />
              <span className="relative inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                {item.category}
              </span>
              <h3 className="relative mt-4 text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                {item.title}
              </h3>
              <p className="relative mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
              <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-300">
                Open page <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8 lg:pb-28">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 dark:border dark:border-slate-800 sm:rounded-[2rem] sm:p-8 lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_0.45fr] lg:items-center">
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
              Free tracking review
            </p>
            <h2 className="max-w-3xl text-[2rem] font-black leading-[1.03] tracking-[-0.05em] sm:text-5xl sm:leading-[1.02]">
              Find out what is really happening with your tracking and reporting.
            </h2>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-400">
              Get an evidence-based review of Google Ads conversion tracking, GA4, GTM, Meta CAPI, enhanced conversions, server-side measurement, and Looker Studio reporting readiness.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/free-tracking-audit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Book Free Tracking Review
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/services/looker-studio-dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.08]"
            >
              View Dashboard Service
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  centered,
  dark,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
  dark?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300 sm:mb-4 sm:text-[11px] sm:tracking-[0.24em]">
        {eyebrow}
      </p>
      <h2
        className={cn(
          "text-[2rem] font-black leading-[1.03] tracking-[-0.05em] sm:text-5xl sm:leading-[1.02]",
          dark ? "text-white" : "text-slate-950 dark:text-white"
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mt-4 text-sm font-medium leading-7 sm:mt-5 sm:text-base sm:leading-8",
          dark ? "text-slate-400" : "text-slate-600 dark:text-slate-400"
        )}
      >
        {description}
      </p>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

