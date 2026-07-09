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
  "TrackFlow Pro helps businesses fix Google Ads conversion tracking, GA4/GTM events, Meta CAPI, enhanced conversions, and server-side tracking with an evidence-based tracking audit.",
  alternates: {
    canonical: "https://trackflowpro.com",
  },
  openGraph: {
    title: "TrackFlow Pro | Google Ads Conversion Tracking Specialist",
    description:
      "Evidence-based tracking audits for Google Ads, GA4, GTM, Meta CAPI, enhanced conversions, and server-side measurement.",
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
      "Fix conversion tracking issues across Google Ads, GA4, GTM, Meta CAPI, and server-side measurement.",
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
    value: "GA4 + GTM",
    note: "Google Ads, Meta CAPI, and server-side validation.",
  },
  {
    label: "Process",
    value: "Audit → Fix",
    note: "Evidence, implementation, validation, reporting.",
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
    title: "GA4 and Google Ads numbers do not match",
    description:
      "GA4 key events, Google Ads conversion actions, GTM tags, consent mode, and attribution windows can all create reporting gaps.",
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
          "Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, and server-side measurement support.",
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
    <section className="border-y border-slate-200 bg-white px-4 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {proofStats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
              {item.value}
            </div>
            <div className="mt-1 text-sm font-black text-slate-700 dark:text-slate-200">
              {item.label}
            </div>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
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
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Tracking problems"
          title="Broken tracking makes profitable campaigns look unreliable."
          description="If Google Ads, GA4, GTM, Meta Pixel, or server-side events are not validated, you may scale decisions using incomplete data."
        />

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/70 sm:rounded-[2rem] sm:p-7"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                {problem.icon}
              </div>
              <h3 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                {problem.title}
              </h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
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
    <section className="bg-slate-50 px-4 py-14 dark:bg-slate-900/25 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Specialist services"
          title="Tracking, attribution, and conversion measurement services."
          description="A focused service stack for businesses that rely on paid traffic and need cleaner conversion data."
        />

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group flex flex-col rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-blue-900/70 sm:rounded-[2rem] sm:p-6"
            >
              <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/40 dark:text-blue-300">
                {service.icon}
              </span>
              <h3 className="text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                {service.title}
              </h3>
              <p className="mt-3 flex-1 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                {service.description}
              </p>
              <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {service.highlight}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-300">
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
              "Final validation only after approved access to GA4, GTM, Google Ads, Meta, CRM, or server logs",
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
    <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Audit → Fix → Validate"
          title="A clear process for tracking problems."
          description="Every fix starts with evidence, not assumptions. The goal is to identify what matters, fix the highest-impact gaps, and validate the result."
          dark
        />

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {auditSteps.map((step) => (
            <div key={step.number} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 sm:rounded-[2rem] sm:p-6">
              <div className="mb-5 text-4xl font-black tracking-[-0.06em] text-blue-400 sm:mb-8 sm:text-5xl">
                {step.number}
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
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-8 sm:gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/60 sm:rounded-[2rem] sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                Report preview
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                Tracking Audit Summary
              </h2>
            </div>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              Sample
            </span>
          </div>
          <div className="space-y-4">
            {[
              {
                title: "Main issue",
                text: "Google Ads conversion tracking needs validation against GA4/GTM event behavior.",
              },
              {
                title: "Evidence",
                text: "Observed tracking requests, tag behavior, and form conversion flow from public browser-visible review.",
              },
              {
                title: "Recommended next step",
                text: "Confirm inside GTM Preview, GA4 DebugView, Google Ads conversion actions, and server-side logs if available.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
              >
                <h3 className="text-sm font-black text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader
            eyebrow="Why it builds trust"
            title="The audit report separates evidence from assumptions."
            description="Instead of making unsupported claims, the report explains what was detected, what it likely means, and what needs account-level validation before a final conclusion."
          />
          <div className="mt-8">
            <Link
              href="/free-tracking-audit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 sm:w-auto"
            >
              Get a tracking audit
              <ArrowRight className="h-4 w-4" />
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
            Focused on Google Ads measurement, GA4/GTM validation, Meta CAPI, enhanced conversions, and server-side tracking quality.
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
        TrackFlow Pro is focused on Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, server-side measurement, and conversion signal quality.
      </p>

      <p className="mt-4 text-base font-medium leading-8 text-slate-600 dark:text-slate-400">
        The goal is simple: help you understand whether your conversion data is reliable before you make bigger decisions about budget, bidding, reporting, or attribution.
      </p>

      <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
        {[
          "Google Ads conversion tracking audit",
          "GA4 and GTM event validation",
          "Meta CAPI and server-side event review",
          "Enhanced conversions and lead tracking",
          "Tracking-first PPC audit workflow",
          "Evidence-based reporting before implementation",
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
      description: "Fix Google Ads conversion actions, enhanced conversions, GTM tags, forms, calls, and ecommerce tracking.",
    },
    {
      title: "Server-Side Tracking",
      href: "/services/server-side-tracking",
      description: "Build stronger first-party tracking with GTM server-side tagging, event routing, and validation.",
    },
    {
      title: "GA4 & GTM Audit",
      href: "/services/ga4-gtm-audit",
      description: "Audit GA4 events, GTM tags, triggers, data layer, consent behavior, and conversion gaps.",
    },
    {
      title: "Meta CAPI Setup",
      href: "/services/meta-capi",
      description: "Improve Meta Pixel and Conversions API event quality, deduplication, and server-side signals.",
    },
    {
      title: "About TrackFlow Pro",
      href: "/about",
      description: "Learn about TrackFlow Pro, the tracking-first audit process, and specialist measurement support.",
    },
    {
      title: "Contact",
      href: "/contact",
      description: "Contact TrackFlow Pro directly for tracking, attribution, GA4, GTM, and conversion measurement help.",
    },
    {
      title: "Free Tracking Audit",
      href: "/free-tracking-audit",
      description: "Request a free tracking review before scaling Google Ads, Meta Ads, or other paid traffic.",
    },
  ];

  return (
    <section className="bg-white px-4 py-14 dark:bg-slate-950 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Explore TrackFlow Pro"
          title="Important tracking pages for Google Ads, GA4, GTM, Meta CAPI, and server-side measurement."
          description="These pages help visitors and search engines understand the core TrackFlow Pro services and contact paths."
        />

        <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 lg:grid-cols-3">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/70 dark:hover:bg-blue-950/25 sm:rounded-[2rem] sm:p-6"
            >
              <h3 className="text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-300">
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
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/15 dark:border dark:border-slate-800 sm:rounded-[2rem] sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.45fr] lg:items-center">
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
              Free tracking review
            </p>
            <h2 className="max-w-3xl text-[2rem] font-black leading-[1.03] tracking-[-0.05em] sm:text-5xl sm:leading-[1.02]">
              Find out what is really happening with your conversion tracking.
            </h2>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-400">
              Get an evidence-based review of Google Ads conversion tracking, GA4, GTM, Meta CAPI, enhanced conversions, and server-side measurement issues.
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
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.08]"
            >
              Contact Specialist
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

