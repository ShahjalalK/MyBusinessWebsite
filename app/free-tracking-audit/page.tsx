import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileSearch,
  LineChart,
  LockKeyhole,
  MousePointerClick,
  SearchCheck,
  ShieldCheck,
  Target,
} from "lucide-react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import FreeAuditRequestForm from "./FreeAuditRequestForm";

export const metadata: Metadata = {
  title: "Free Google Ads Tracking Audit | GA4, GTM & Conversion Tracking Review",
  description:
    "Request a free Google Ads tracking audit for GA4, GTM, enhanced conversions, Meta CAPI, and server-side tracking issues. No login required for the first review.",
  alternates: {
    canonical: "/free-tracking-audit",
  },
  openGraph: {
    title: "Free Google Ads Tracking Audit | TrackFlow Pro",
    description:
      "Get an evidence-based review of Google Ads conversion tracking, GA4, GTM, Meta CAPI, enhanced conversions, and server-side measurement issues.",
    url: "https://trackflowpro.com/free-tracking-audit",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro - Free Google Ads Tracking Audit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Google Ads Tracking Audit | TrackFlow Pro",
    description:
      "Request a free Google Ads audit for conversion tracking, GA4, GTM, Meta CAPI, enhanced conversions, and server-side tracking.",
    images: ["/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
};

const auditScope = [
  {
    title: "Google Ads conversion tracking",
    description: "Conversion actions, tags, leads, calls, forms, ecommerce events, and duplicated or missing conversions.",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "GA4 & GTM event validation",
    description: "GA4 key events, GTM triggers, data layer behavior, consent behavior, and event naming issues.",
    icon: <FileSearch className="h-5 w-5" />,
  },
  {
    title: "Enhanced conversions review",
    description: "Enhanced conversions setup, lead data quality, matching signals, and privacy-aware tracking paths.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Meta Pixel & CAPI signals",
    description: "Meta Pixel behavior, Conversions API readiness, event quality, deduplication, and server event checks.",
    icon: <MousePointerClick className="h-5 w-5" />,
  },
  {
    title: "Server-side tracking evidence",
    description: "GTM server-side, first-party tracking routes, event forwarding signals, and validation gaps.",
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: "Audit report summary",
    description: "A clear summary of what was detected, what it likely means, and what needs account-level confirmation.",
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

const checklistItems = [
  "Google Ads conversion actions and tag behavior",
  "GA4 key events and DebugView validation path",
  "GTM tags, triggers, variables, and data layer risks",
  "Meta Pixel and Meta Conversions API signal quality",
  "Enhanced conversions and lead matching readiness",
  "Form, call, ecommerce, and thank-you page tracking",
  "Server-side tracking and first-party measurement signals",
  "Consent behavior and browser-visible tracking evidence",
];

const processSteps = [
  {
    number: "01",
    title: "Submit your website",
    description: "Share your website URL and the main tracking issue you want reviewed.",
  },
  {
    number: "02",
    title: "Browser-visible evidence review",
    description: "I review public tracking evidence such as tags, pixels, events, forms, and network requests.",
  },
  {
    number: "03",
    title: "Tracking diagnosis",
    description: "You receive a practical summary of likely issues across Google Ads, GA4, GTM, Meta CAPI, and server-side tracking.",
  },
  {
    number: "04",
    title: "Next-step recommendation",
    description: "If deeper validation is needed, I explain which access is required and what should be fixed first.",
  },
];

const faqs = [
  {
    question: "Is this really a free Google Ads audit?",
    answer:
      "Yes. The first review is free and starts with public browser-visible evidence. Final confirmation may require GA4, GTM, Google Ads, Meta, CRM, or server-log access.",
  },
  {
    question: "Do you need login access for the first review?",
    answer:
      "No. The first review does not require account login. I first inspect browser-visible evidence such as tags, network requests, events, pixels, forms, and page flows.",
  },
  {
    question: "What is included in the Google Ads audit checklist?",
    answer:
      "The checklist can include Google Ads conversion actions, GA4 key events, GTM tags and triggers, enhanced conversions, Meta CAPI, server-side tracking, forms, calls, ecommerce events, and consent behavior.",
  },
  {
    question: "Can you fix Google Ads conversion tracking not working?",
    answer:
      "Yes. After the audit, I can help fix issues with GTM tags, GA4 key events, Google Ads conversion actions, enhanced conversions, form tracking, call tracking, ecommerce events, and server-side tracking paths.",
  },
  {
    question: "What does a Google Ads audit cost after the free review?",
    answer:
      "The initial review is free. If implementation or deeper validation is needed, the scope depends on your tracking setup, platforms, and the number of events or conversion paths that need to be fixed.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trackflowpro.com/free-tracking-audit#webpage",
      url: "https://trackflowpro.com/free-tracking-audit",
      name: "Free Google Ads Tracking Audit",
      description:
        "Request a free Google Ads tracking audit for GA4, GTM, enhanced conversions, Meta CAPI, and server-side tracking issues.",
      isPartOf: {
        "@id": "https://trackflowpro.com/#website",
      },
    },
    {
      "@type": "Service",
      "@id": "https://trackflowpro.com/free-tracking-audit#service",
      name: "Free Google Ads Tracking Audit",
      serviceType: "Google Ads audit, PPC audit, GA4 and GTM tracking review",
      provider: {
        "@type": "Organization",
        name: "TrackFlow Pro",
        url: "https://trackflowpro.com",
      },
      areaServed: "Worldwide",
      description:
        "Evidence-based review of Google Ads conversion tracking, GA4, GTM, Meta CAPI, enhanced conversions, and server-side measurement issues.",
    },
    {
      "@type": "FAQPage",
      "@id": "https://trackflowpro.com/free-tracking-audit#faq",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://trackflowpro.com/free-tracking-audit#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://trackflowpro.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Free Tracking Audit",
          item: "https://trackflowpro.com/free-tracking-audit",
        },
      ],
    },
  ],
};

export default function FreeTrackingAuditPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <HeroSection />
        <TrustStrip />
        <AuditScopeSection />
        <ChecklistSection />
        <ReportPreviewSection />
        <ProcessSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}

function HeroSection() {
  const trustPoints = [
    "No login required for the first review",
    "Optional screenshot or PDF under 2 MB",
    "Browser-visible evidence before assumptions",
  ];

  const heroStats = [
    { label: "Request time", value: "2 min" },
    { label: "First review", value: "Free" },
    { label: "File handling", value: "Email only" },
  ];

  return (
    <section className="relative isolate overflow-hidden px-4 pb-10 pt-24 sm:px-6 sm:pb-16 sm:pt-24 lg:px-8 lg:pb-20 lg:pt-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(to_bottom,#ffffff,#f8fafc)] dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(to_bottom,#020617,#0f172a)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      <div className="absolute -left-28 top-24 -z-10 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-900/20" />
      <div className="absolute -right-24 bottom-12 -z-10 h-80 w-80 rounded-full bg-cyan-100/60 blur-3xl dark:bg-cyan-900/10" />

      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(410px,0.72fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,0.98fr)_minmax(430px,0.72fr)]">
        <div className="mx-auto w-full max-w-3xl text-center lg:mx-0 lg:pt-6 lg:text-left">
          <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm shadow-blue-950/5 backdrop-blur dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 sm:mb-5 sm:px-4 sm:text-[11px] sm:tracking-[0.22em]">
            <SearchCheck className="h-4 w-4 shrink-0" />
            <span className="truncate">Free Google Ads Audit</span>
          </div>

          <h1 className="text-balance text-[2.05rem] font-black leading-[1.05] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl sm:leading-[1.02] md:text-6xl xl:text-[4.55rem]">
            <span className="sm:hidden">Free Google Ads Tracking Audit</span>
            <span className="hidden sm:inline">Free Google Ads tracking audit for clearer conversion data.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-[15px] font-semibold leading-7 text-slate-600 dark:text-slate-300 sm:mt-6 sm:text-lg sm:leading-8 lg:mx-0">
            Send your website and main tracking concern. I will review public browser-visible evidence before asking for account access.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="#audit-request"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              Request Free Audit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#audit-scope"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-7 py-4 text-sm font-black text-slate-950 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
            >
              See What Is Checked
            </a>
          </div>

          <div className="mt-7 hidden gap-3 sm:grid sm:grid-cols-3 lg:mt-8">
            {heroStats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                <div className="text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{item.value}</div>
                <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 hidden gap-3 text-left sm:grid sm:grid-cols-3 lg:mt-7">
            {trustPoints.map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-2xl bg-white/65 p-3 text-sm font-bold leading-6 text-slate-600 shadow-sm shadow-slate-950/5 ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-900/45 dark:text-slate-300 dark:ring-slate-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl lg:mx-0 lg:justify-self-end">
          <AuditRequestCard />
        </div>
      </div>
    </section>
  );
}

function AuditRequestCard() {
  return <FreeAuditRequestForm />;
}

function TrustStrip() {
  return (
    <section className="border-y border-slate-200 bg-white px-4 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
        {[
          { label: "Initial review", value: "0 login", note: "Public browser-visible evidence first." },
          { label: "Audit focus", value: "Google Ads", note: "Conversion tracking, GA4, GTM, and PPC tracking issues." },
          { label: "Signal review", value: "GA4 + GTM", note: "Events, triggers, tags, and validation paths." },
          { label: "Server signals", value: "Meta CAPI", note: "Server-side tracking and event quality review." },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{item.value}</div>
            <div className="mt-1 text-sm font-black text-slate-700 dark:text-slate-200">{item.label}</div>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">{item.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditScopeSection() {
  return (
    <section id="audit-scope" className="scroll-mt-28 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Google Ads audit service"
          title="What the free Google Ads audit checks."
          description="The review is designed for businesses running paid traffic that need cleaner conversion data before increasing budget."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {auditScope.map((item) => (
            <div key={item.title} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/70">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                {item.icon}
              </div>
              <h3 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">{item.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChecklistSection() {
  return (
    <section className="bg-slate-50 px-4 py-20 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <LockKeyhole className="h-4 w-4" /> Trust-first review
          </div>
          <h2 className="text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
            A practical Google Ads audit checklist, not a generic PPC report.
          </h2>
          <p className="mt-6 text-base font-medium leading-8 text-slate-600 dark:text-slate-400">
            The audit focuses on tracking evidence, conversion signal quality, and validation gaps that can affect campaign decisions, bidding, and reporting accuracy.
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="grid gap-4 sm:grid-cols-2">
            {checklistItems.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                <span className="text-sm font-black leading-6 text-slate-700 dark:text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReportPreviewSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="relative rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Google Ads audit report sample</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Tracking Audit Summary</h2>
            </div>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Sample</span>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "Main issue",
                text: "Google Ads conversion tracking needs validation against GA4 and GTM event behavior.",
                icon: <Target className="h-5 w-5" />,
              },
              {
                title: "Evidence",
                text: "Observed tracking requests, tag behavior, consent behavior, and form conversion flow from a public browser-visible review.",
                icon: <SearchCheck className="h-5 w-5" />,
              },
              {
                title: "Recommended next step",
                text: "Confirm inside GTM Preview, GA4 DebugView, Google Ads conversion actions, Meta Events Manager, and server-side logs if available.",
                icon: <LineChart className="h-5 w-5" />,
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                  {item.icon}
                </span>
                <span>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">{item.text}</p>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader
            eyebrow="Evidence before assumptions"
            title="The audit separates detected evidence from final confirmation."
            description="Instead of making unsupported claims, the report explains what was detected, what it likely means, and what needs account-level validation before a final conclusion."
          />
          <div className="mt-8">
            <a href="#audit-request" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500">
              Request Free Tracking Review
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Audit process"
          title="How the free tracking review works."
          description="The process is designed to build trust before access is requested. First evidence, then diagnosis, then a clear fix path."
          dark
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {processSteps.map((step) => (
            <div key={step.number} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-8 text-5xl font-black tracking-[-0.06em] text-blue-400">{step.number}</div>
              <h3 className="text-lg font-black text-white">{step.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions about the free Google Ads tracking audit."
          description="Clear answers before requesting a tracking review."
          centered
        />

        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
              <h3 className="text-lg font-black text-slate-950 dark:text-white">{faq.question}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/15 dark:border dark:border-slate-800 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.45fr] lg:items-center">
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">Free Google Ads audit</p>
            <h2 className="max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">
              Find out what is really happening with your conversion tracking.
            </h2>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-400">
              Request a free tracking-first audit for Google Ads, GA4, GTM, Meta CAPI, enhanced conversions, and server-side measurement issues.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <a href="#audit-request" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500">
              Get My Free Tracking Audit
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.08]">
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
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">{eyebrow}</p>
      <h2 className={cn("text-4xl font-black tracking-[-0.05em] sm:text-5xl", dark ? "text-white" : "text-slate-950 dark:text-white")}>{title}</h2>
      <p className={cn("mt-5 text-base font-medium leading-8", dark ? "text-slate-400" : "text-slate-600 dark:text-slate-400")}>{description}</p>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
