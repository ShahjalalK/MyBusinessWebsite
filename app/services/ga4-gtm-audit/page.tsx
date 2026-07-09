import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Code2,
  Database,
  FileSearch,
  Gauge,
  Layers,
  LineChart,
  LockKeyhole,
  MousePointerClick,
  Route,
  SearchCheck,
  Settings2,
  ShieldCheck,
  Tags,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

export const metadata: Metadata = {
  title: "GA4 & Google Tag Manager Audit Consultant | TrackFlow Pro",
  description:
    "Hire a Google Tag Manager consultant to audit GA4 events, GTM tags, triggers, data layer, conversion tracking, consent behavior, and reporting gaps.",
  alternates: {
    canonical: "https://trackflowpro.com/services/ga4-gtm-audit",
  },
  openGraph: {
    title: "GA4 & Google Tag Manager Audit Consultant | TrackFlow Pro",
    description:
      "Evidence-based GA4 and GTM audit for event tracking, data layer, conversion validation, Google Ads tags, and tracking accuracy.",
    url: "https://trackflowpro.com/services/ga4-gtm-audit",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro - GA4 and Google Tag Manager Audit Consultant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GA4 & Google Tag Manager Audit Consultant | TrackFlow Pro",
    description:
      "Audit GA4 events, GTM tags, triggers, data layer, and conversion tracking gaps before scaling paid traffic.",
    images: ["https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
};

const auditScope = [
  {
    title: "GA4 event tracking audit",
    description:
      "Review GA4 events, key events, parameters, DebugView behavior, attribution gaps, and reporting mismatches.",
    icon: <LineChart className="h-6 w-6" />,
  },
  {
    title: "Google Tag Manager audit",
    description:
      "Inspect GTM tags, triggers, variables, tag firing conditions, duplicate tags, and workspace organization.",
    icon: <Tags className="h-6 w-6" />,
  },
  {
    title: "Data layer review",
    description:
      "Check whether important lead, form, checkout, ecommerce, and user-action data is available in the data layer.",
    icon: <Database className="h-6 w-6" />,
  },
  {
    title: "Conversion validation",
    description:
      "Validate whether Google Ads, GA4, Meta, and other conversion destinations are receiving clean event signals.",
    icon: <Target className="h-6 w-6" />,
  },
];

const commonProblems = [
  {
    title: "GA4 events are firing, but reports still look wrong",
    description:
      "Events may exist in GA4, but missing parameters, wrong event names, poor key-event setup, or attribution settings can make reporting unreliable.",
  },
  {
    title: "GTM tags are duplicated or firing on the wrong pages",
    description:
      "Duplicate tags, broad triggers, old containers, or unmanaged workspaces can cause over-reporting and misleading conversion numbers.",
  },
  {
    title: "Google Ads conversions do not match GA4",
    description:
      "GA4 key events, Google Ads conversion actions, consent mode, attribution windows, and enhanced conversions can all create mismatches.",
  },
  {
    title: "The data layer does not support accurate tracking",
    description:
      "Without a clean data layer, ecommerce values, form types, lead quality, product data, or user actions may not pass correctly to GA4 or ad platforms.",
  },
];

const checklist = [
  "GA4 configuration and stream setup",
  "GA4 event names, key events, and parameters",
  "Google Tag Manager tags, triggers, and variables",
  "Data layer structure and event payloads",
  "Google Ads conversion tags and linked conversion paths",
  "Enhanced conversions readiness",
  "Consent mode and privacy-related behavior",
  "Form, click, call, lead, and ecommerce tracking",
  "Duplicate event and duplicate tag detection",
  "DebugView, Tag Assistant, and browser-visible network evidence",
];

const deliverables = [
  {
    title: "Tracking issue summary",
    description:
      "A clear summary of what appears broken, duplicated, missing, or risky across GA4, GTM, and conversion tracking.",
  },
  {
    title: "Priority fix list",
    description:
      "A practical order of fixes, so your team knows what to address first instead of guessing inside GA4 or GTM.",
  },
  {
    title: "Validation plan",
    description:
      "A step-by-step plan to confirm events inside GTM Preview, GA4 DebugView, Google Ads, and other destinations.",
  },
  {
    title: "Implementation support path",
    description:
      "When access is approved, tracking fixes can be implemented and validated across GTM, GA4, Google Ads, and server-side paths.",
  },
];

const process = [
  {
    number: "01",
    title: "Public evidence review",
    description:
      "I start with browser-visible evidence: tags, network calls, events, data layer activity, consent behavior, and page flows.",
  },
  {
    number: "02",
    title: "GA4 & GTM diagnosis",
    description:
      "I map issues across GA4 events, GTM tags, triggers, variables, data layer events, and destination conversion paths.",
  },
  {
    number: "03",
    title: "Fix priority plan",
    description:
      "You receive a clear list of what to fix, why it matters, what evidence supports it, and which access is needed for final confirmation.",
  },
  {
    number: "04",
    title: "Validation after access",
    description:
      "After account access is approved, fixes are validated in GA4, GTM Preview, Google Ads, Meta, CRM, or server-side logs.",
  },
];

const faqs = [
  {
    question: "What does a GA4 and Google Tag Manager audit include?",
    answer:
      "It reviews GA4 events, key events, parameters, GTM tags, triggers, variables, data layer activity, consent behavior, Google Ads conversion paths, and duplicate or missing tracking issues.",
  },
  {
    question: "Do you need GA4 or GTM access for the first audit?",
    answer:
      "No. The first review can start with public browser-visible evidence. Final confirmation usually requires GA4, GTM, Google Ads, Meta, CRM, or server-log access.",
  },
  {
    question: "Can you work as a Google Tag Manager consultant for implementation too?",
    answer:
      "Yes. The audit can identify the tracking gaps first, and implementation support can follow for GTM tags, GA4 events, data layer updates, enhanced conversions, and conversion validation.",
  },
  {
    question: "Why do GA4 and Google Ads conversions not match?",
    answer:
      "Common reasons include different attribution models, conversion windows, consent behavior, duplicated events, missing parameters, incorrect key-event setup, or separate Google Ads conversion tags firing differently from GA4.",
  },
  {
    question: "Is this only a technical GTM audit?",
    answer:
      "No. The audit is technical, but it is focused on business measurement: whether your conversion data is reliable enough for paid traffic decisions, reporting, and optimization.",
  },
];

const signalRows = [
  { label: "GA4 events", value: "Event quality review", tone: "blue" },
  { label: "GTM tags", value: "Trigger validation", tone: "amber" },
  { label: "Data layer", value: "Payload inspection", tone: "purple" },
  { label: "Conversions", value: "Accuracy check", tone: "emerald" },
];

export default function Ga4GtmAuditPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://trackflowpro.com/#organization",
        name: "TrackFlow Pro",
        alternateName: ["TrackFlowPro", "Track Flow Pro"],
        url: "https://trackflowpro.com",
        sameAs: ["https://www.linkedin.com/in/shahjalal-khan/"],
        founder: {
          "@type": "Person",
          "@id": "https://trackflowpro.com/#shahjalal-khan",
          name: "Shahjalal Khan",
          jobTitle: "Founder & Tracking Specialist",
          sameAs: "https://www.linkedin.com/in/shahjalal-khan/",
        },
        knowsAbout: [
          "Google Ads conversion tracking",
          "GA4 audit",
          "Google Tag Manager audit",
          "GTM server-side tracking",
          "Server-side tracking",
          "Meta Conversions API",
          "Facebook Conversions API",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://trackflowpro.com/#website",
        name: "TrackFlow Pro",
        alternateName: ["TrackFlowPro", "Track Flow Pro"],
        url: "https://trackflowpro.com",
        publisher: { "@id": "https://trackflowpro.com/#organization" },
      },
      {
        "@type": "WebPage",
        "@id": "https://trackflowpro.com/services/ga4-gtm-audit#webpage",
        name: "GA4 & Google Tag Manager Audit Consultant | TrackFlow Pro",
        url: "https://trackflowpro.com/services/ga4-gtm-audit",
        description:
          "GA4 and Google Tag Manager audit consultant for event tracking, GTM tags, data layer, consent behavior, and conversion validation.",
        isPartOf: { "@id": "https://trackflowpro.com/#website" },
        about: { "@id": "https://trackflowpro.com/services/ga4-gtm-audit#service" },
      },
      {
        "@type": "Service",
        "@id": "https://trackflowpro.com/services/ga4-gtm-audit#service",
        name: "GA4 & Google Tag Manager Audit Consultant",
        alternateName: [
          "GA4 audit specialist",
          "Google Tag Manager audit specialist",
          "GTM audit consultant",
        ],
        provider: { "@id": "https://trackflowpro.com/#organization" },
        areaServed: "Worldwide",
        serviceType: "GA4 audit, Google Tag Manager audit, GTM consulting, conversion tracking validation",
        url: "https://trackflowpro.com/services/ga4-gtm-audit",
        description:
          "Evidence-based GA4 and GTM audit for tags, triggers, variables, data layer, GA4 conversion tracking, Google Ads conversion paths, and measurement accuracy.",
        offers: {
          "@type": "Offer",
          url: "https://trackflowpro.com/free-tracking-audit",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://trackflowpro.com/services/ga4-gtm-audit#breadcrumb",
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
            name: "Services",
            item: "https://trackflowpro.com/services",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "GA4 & GTM Audit",
            item: "https://trackflowpro.com/services/ga4-gtm-audit",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://trackflowpro.com/services/ga4-gtm-audit#faq",
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

  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden bg-white pb-20 text-slate-950 dark:bg-slate-950 dark:text-white lg:pb-0">
        <HeroSection />
        <TrustBar />
        <RelatedServiceRail active="GA4 & GTM Audit" />
        <ProblemSection />
        <AuditScopeSection />
        <ChecklistSection />
        <DataLayerSection />
        <ProcessSection />
        <DeliverablesSection />
        <FaqSection />
        <FinalCtaSection />
        <MobileStickyCta primaryLabel="Request audit" />
      </main>
      <Footer />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_35%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 pb-14 pt-24 sm:py-20 dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_35%),linear-gradient(to_bottom,#020617,#0f172a)] sm:px-6 lg:px-8 lg:py-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <SearchCheck className="h-4 w-4" /> GA4 & GTM tracking audit
          </div>

          <h1 className="max-w-4xl text-[2.05rem] font-black leading-[1.04] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl sm:leading-[1.02] sm:tracking-[-0.05em] md:text-6xl lg:text-7xl lg:leading-[0.98] lg:tracking-[-0.055em]">
            GA4 & Google Tag Manager <span className="text-blue-600 dark:text-blue-400">Audit Consultant</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
            Hire a Google Tag Manager consultant to audit GA4 events, GTM tags, triggers, data layer, conversion tracking, consent behavior, and reporting gaps before scaling ad spend.
          </p>

          <div className="mt-7 flex sm:mt-9 flex-col gap-3 sm:flex-row">
            <Link
              href="/free-tracking-audit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 sm:w-auto px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              Audit My GA4 & GTM Setup
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border sm:w-auto border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
            >
              Contact Specialist
            </Link>
          </div>

          <div className="mt-6 grid max-w-2xl sm:mt-8 gap-3 sm:grid-cols-3">
            {[
              "No login required for first review",
              "GA4, GTM, tags & data layer",
              "Evidence-based validation plan",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <HeroAuditCard />
      </div>
    </section>
  );
}

function HeroAuditCard() {
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,36rem)] min-w-0">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-600/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Audit preview</p>
              <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">GA4 & GTM Signal Review</h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              Evidence-first
            </span>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {signalRows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col items-start gap-3 rounded-2xl sm:flex-row sm:items-center sm:justify-between sm:gap-4 border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900">
                  <FileSearch className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-base font-black text-slate-950 dark:text-white">{row.label}</span>
                  <span className="mt-1 block text-sm font-bold text-slate-500 dark:text-slate-400">
                    Browser-visible evidence
                  </span>
                </span>
              </div>
              <span className={badgeClass(row.tone)}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/25">
            <p className="text-sm font-black text-slate-950 dark:text-white">First review starts without login access.</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              Final confirmation may require GA4, GTM, Google Ads, Meta, CRM, or server-log access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-slate-200 bg-white px-4 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Primary focus", value: "GA4 + GTM", note: "Events, tags, triggers, variables, and conversion validation." },
          { label: "First review", value: "0 login", note: "Public browser-visible evidence first." },
          { label: "Audit type", value: "Technical", note: "But focused on business measurement decisions." },
          { label: "Outcome", value: "Fix plan", note: "Clear priority list, evidence, and validation steps." },
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

function ProblemSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader
          eyebrow="GA4 & GTM problems"
          title="A messy tracking setup can make good campaigns look bad."
          description="A GA4 audit or GTM audit helps identify whether your measurement setup is missing events, duplicating conversions, firing tags incorrectly, or sending incomplete data to ad platforms."
        />

        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 md:grid-cols-2">
          {commonProblems.map((problem) => (
            <div
              key={problem.title}
              className="group min-w-0 max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/70"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                <MousePointerClick className="h-5 w-5" />
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

function AuditScopeSection() {
  return (
    <section className="bg-slate-50 px-4 py-14 sm:py-16 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader
          eyebrow="Audit scope"
          title="Google Tag Manager consulting for cleaner GA4 conversion tracking."
          description="The audit looks beyond whether a tag fires. It reviews whether your events, parameters, triggers, and conversion destinations are reliable enough for paid traffic decisions."
        />

        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 lg:grid-cols-4">
          {auditScope.map((item) => (
            <div
              key={item.title}
              className="max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-blue-900/70"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                {item.icon}
              </div>
              <h3 className="text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-white">{item.title}</h3>
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
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> GA4 audit checklist
          </div>
          <h2 className="text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
            What I check inside a GA4 and GTM audit.
          </h2>
          <p className="mt-6 text-[15px] font-medium leading-7 text-slate-600 sm:text-base sm:leading-8 dark:text-slate-400">
            This is not a surface-level tag check. The goal is to understand how your Google Tag Manager setup, GA4 event tracking, data layer, and conversion destinations work together.
          </p>
          <div className="mt-8">
            <Link
              href="/free-tracking-audit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 sm:w-auto px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              Audit My GA4 & GTM Setup
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="max-w-full rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="grid gap-4 sm:grid-cols-2">
            {checklist.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-100 bg-white p-4 text-sm font-black text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DataLayerSection() {
  return (
    <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-blue-300">
            Data layer & conversion paths
          </p>
          <h2 className="text-[2rem] font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl sm:leading-[1] sm:tracking-[-0.05em]">
            GA4 conversion tracking depends on more than one tag.
          </h2>
          <p className="mt-6 text-[15px] font-medium leading-7 text-slate-400 sm:text-base sm:leading-8">
            A clean measurement setup needs reliable event names, useful parameters, proper triggers, a structured data layer, and validated destinations. GTM should not only fire tags—it should support accurate reporting and decision-making.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Lead and form events",
              "Ecommerce values and items",
              "Consent-aware behavior",
              "Google Ads conversion paths",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm font-black text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-full rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="rounded-[1.5rem] bg-slate-900 p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Tracking architecture</p>
            <div className="mt-6 space-y-4">
              {[
                { icon: <Code2 className="h-5 w-5" />, title: "Website interaction", text: "Form submit, click, lead, checkout, purchase, or custom business event." },
                { icon: <Layers className="h-5 w-5" />, title: "Data layer event", text: "Clean event payload with useful parameters and values." },
                { icon: <Workflow className="h-5 w-5" />, title: "GTM trigger logic", text: "Controlled tag firing with clear conditions and no duplication." },
                { icon: <BarChart3 className="h-5 w-5" />, title: "GA4 and ad platforms", text: "Validated destinations for reporting and optimization." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                    {item.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-black text-white">{item.title}</span>
                    <span className="mt-1 block text-sm font-medium leading-6 text-slate-400">{item.text}</span>
                  </span>
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
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader
          eyebrow="Audit process"
          title="A practical audit workflow for GA4, GTM, and conversion validation."
          description="Every recommendation is based on evidence, not assumptions. The process separates what can be detected publicly from what requires account-level confirmation."
          centered
        />

        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 lg:grid-cols-4">
          {process.map((step) => (
            <div key={step.number} className="max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-5 text-4xl sm:mb-8 sm:text-5xl font-black tracking-[-0.06em] text-blue-600 dark:text-blue-300">{step.number}</div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">{step.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeliverablesSection() {
  return (
    <section className="bg-slate-50 px-4 py-14 sm:py-16 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader
          eyebrow="What you receive"
          title="Clear findings, not confusing analytics screenshots."
          description="You receive a practical explanation of what is wrong, what evidence supports the finding, and how to validate the fix."
        />

        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 md:grid-cols-2">
          {deliverables.map((item) => (
            <div key={item.title} className="max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                <Route className="h-5 w-5" />
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

function FaqSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-4xl">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions about GA4, GTM, and tracking audits."
          description="Clear answers before you request a review."
          centered
        />

        <div className="mt-8 space-y sm:mt-10 lg:mt-12-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="max-w-full rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/50">
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
    <section className="px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8 lg:pb-28">
      <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/15 dark:border dark:border-slate-800 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.45fr] lg:items-center">
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">GA4 & GTM audit</p>
            <h2 className="max-w-3xl text-[2rem] font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl sm:leading-[1] sm:tracking-[-0.05em]">
              Find out whether your GA4 and GTM setup can be trusted.
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] font-medium leading-7 text-slate-400 sm:text-base sm:leading-8">
              Request an evidence-based review of GA4 events, Google Tag Manager tags, data layer activity, Google Ads conversion paths, and tracking accuracy.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/free-tracking-audit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 sm:w-auto px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Audit My GA4 & GTM Setup
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border sm:w-auto border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.08]"
            >
              Contact Specialist
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


function RelatedServiceRail({ active }: { active: string }) {
  const links = [
    {
      title: "Google Ads Conversion Tracking",
      label: "Google Ads",
      href: "/services/google-ads-conversion-tracking",
      description: "Tags, enhanced conversions, leads, calls, and ecommerce tracking.",
    },
    {
      title: "GA4 & GTM Audit",
      label: "GA4 + GTM",
      href: "/services/ga4-gtm-audit",
      description: "Events, tags, triggers, data layer, and conversion validation.",
    },
    {
      title: "Server-Side Tracking",
      label: "Server-side",
      href: "/services/server-side-tracking",
      description: "First-party measurement, server events, and signal validation.",
    },
    {
      title: "Meta CAPI Setup",
      label: "Meta CAPI",
      href: "/services/meta-capi",
      description: "Pixel, Conversions API, event quality, and deduplication.",
    },
    {
      title: "Looker Studio Dashboard",
      label: "Looker Studio",
      href: "/services/looker-studio-dashboard",
      description: "PPC dashboards for Google Ads, GA4, Meta, leads, and revenue.",
    },
  ];

  return (
    <section className="relative z-10 border-y border-slate-800 bg-slate-950 px-4 py-5 text-white sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">Service paths</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-white sm:text-2xl">
              Tracking, reporting, and measurement support in one focused stack.
            </h2>
          </div>
          <Link
            href="/services"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-200 transition hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white"
          >
            View all services <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden">
          {links.map((item) => {
            const isCurrent = active === item.title;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "group min-w-[78vw] rounded-[1.35rem] border p-4 transition sm:min-w-0 sm:rounded-[1.5rem] sm:p-5",
                  isCurrent
                    ? "border-blue-400/50 bg-blue-500/15 shadow-xl shadow-blue-950/30"
                    : "border-white/10 bg-white/[0.035] hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/[0.06]"
                )}
              >
                <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
                  {isCurrent ? "Current" : item.label}
                </span>
                <span className="mt-4 block text-base font-black tracking-[-0.03em] text-white">
                  {item.title}
                </span>
                <span className="mt-2 block text-sm font-medium leading-6 text-slate-400">
                  {item.description}
                </span>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-blue-300">
                  Open service <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MobileStickyCta({ primaryLabel }: { primaryLabel: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-18px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
      <div className="mx-auto flex max-w-lg gap-2">
        <Link
          href="/free-tracking-audit"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
        >
          {primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/contact"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}


function SectionHeader({
  eyebrow,
  title,
  description,
  centered,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
        {eyebrow}
      </p>
      <h2 className="text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-[15px] font-medium leading-7 text-slate-600 sm:text-base sm:leading-8 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function badgeClass(tone: string) {
  const base = "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest";
  if (tone === "amber") return `${base} bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300`;
  if (tone === "purple") return `${base} bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300`;
  if (tone === "emerald") return `${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300`;
  return `${base} bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300`;
}
