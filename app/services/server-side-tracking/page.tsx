import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileSearch,
  Globe,
  LockKeyhole,
  MousePointerClick,
  SearchCheck,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";

export const metadata: Metadata = {
  title: "Server-Side Tracking Service | GTM Server-Side & First-Party Measurement",
  description:
    "Server-side tracking service for GTM server-side, first-party measurement, Google Ads server-side conversion tracking, Meta CAPI, event validation, and signal resilience.",
  alternates: {
    canonical: "/services/server-side-tracking",
  },
  openGraph: {
    title: "Server-Side Tracking Service | TrackFlow Pro",
    description:
      "Build stronger first-party measurement with GTM server-side, server-side tagging, Google Ads conversion tracking, Meta CAPI, and event validation.",
    url: "https://trackflowpro.com/services/server-side-tracking",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro server-side tracking and GTM server-side measurement service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Server-Side Tracking Service | TrackFlow Pro",
    description:
      "GTM server-side, first-party measurement, Google Ads, Meta CAPI, and server-side event validation.",
    images: ["/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
};

const signalIssues = [
  {
    title: "Browser-side signal loss",
    description:
      "Pixels and tags can lose data because of browser restrictions, ad blockers, consent behavior, cookie limits, and network interruptions.",
    icon: <MousePointerClick className="h-5 w-5" />,
  },
  {
    title: "Weak first-party measurement",
    description:
      "If every tracking request depends only on third-party browser endpoints, attribution and optimization signals can become less reliable.",
    icon: <Globe className="h-5 w-5" />,
  },
  {
    title: "Events are routed but not verified",
    description:
      "A server container alone is not the goal. Events, parameters, consent signals, destinations, and deduplication need validation.",
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: "Duplicate or incomplete events",
    description:
      "Server-side tagging must avoid duplicate conversions while preserving useful event data for Google Ads, GA4, Meta CAPI, and CRM reporting.",
    icon: <Target className="h-5 w-5" />,
  },
];

const serviceScope = [
  "GTM server-side container review or setup",
  "First-party tracking endpoint planning",
  "GA4 event forwarding and validation",
  "Google Ads server-side conversion tracking review",
  "Meta Conversions API event quality checks",
  "Event ID and deduplication validation",
  "Enhanced conversions and consent behavior review",
  "Destination testing across Google Ads, GA4, Meta, and CRM flows",
];

const implementationCards = [
  {
    title: "GTM server-side foundation",
    description:
      "Review or structure GTM server-side tracking so events can be received, transformed, and routed from a more controlled first-party measurement layer.",
    icon: <Database className="h-6 w-6" />,
  },
  {
    title: "First-party event routing",
    description:
      "Plan a cleaner event path for browser events, server events, Google Ads conversions, GA4 events, Meta CAPI events, and CRM conversion signals.",
    icon: <ShieldCheck className="h-6 w-6" />,
  },
  {
    title: "Signal quality validation",
    description:
      "Validate whether events contain the right parameters, conversion values, identifiers, consent signals, event IDs, and destination behavior.",
    icon: <SearchCheck className="h-6 w-6" />,
  },
];

const comparisonRows = [
  {
    client: "Browser tags send events directly to third-party platforms.",
    server: "Events can route through a first-party server-side layer before reaching destinations.",
  },
  {
    client: "More exposed to browser restrictions, ad blockers, and cookie limitations.",
    server: "Can improve measurement resilience when implemented and validated correctly.",
  },
  {
    client: "Fast to install but easier to misfire, duplicate, or lose signal quality.",
    server: "Requires careful setup, consent handling, event mapping, and deduplication checks.",
  },
  {
    client: "Useful for visible browser behavior and page/event capture.",
    server: "Useful for first-party measurement, Meta CAPI, Google Ads conversion paths, and cleaner routing.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Evidence review",
    description:
      "I review browser-visible tags, network requests, endpoints, cookies, consent behavior, and event activity to understand the current tracking path.",
  },
  {
    number: "02",
    title: "Server-side diagnosis",
    description:
      "I identify whether server-side tracking exists, whether it is only possible, and which signals need account-level or server-log validation.",
  },
  {
    number: "03",
    title: "Implementation plan",
    description:
      "You get a clear plan for GTM server-side, first-party routing, Meta CAPI, Google Ads conversions, GA4 events, and deduplication logic.",
  },
  {
    number: "04",
    title: "Validation & reporting",
    description:
      "After access is approved, events are validated inside GTM, GA4, Google Ads, Meta, CRM, or server logs before final recommendations are made.",
  },
];

const deliverables = [
  "Server-side tracking audit summary",
  "GTM server-side setup or fix plan",
  "First-party measurement recommendations",
  "Meta CAPI and event match quality review",
  "Google Ads conversion signal validation notes",
  "Event deduplication and parameter checklist",
  "Consent and privacy-aware routing review",
  "Priority fix list with next steps",
];

const faqs = [
  {
    question: "What is server-side tracking?",
    answer:
      "Server-side tracking is a measurement approach where events can be routed through a server-side layer, such as GTM server-side, before being sent to platforms like GA4, Google Ads, Meta CAPI, or other destinations. It can improve control, first-party measurement, and signal resilience when configured correctly.",
  },
  {
    question: "Is server-side tracking better than client-side tracking?",
    answer:
      "It is not a replacement for every client-side tag. Client-side tracking is still useful for browser behavior, but server-side tracking can improve event control, routing, resilience, and destination validation. The right setup usually combines both.",
  },
  {
    question: "Do I need GTM server-side for Google Ads conversion tracking?",
    answer:
      "Not every account needs GTM server-side immediately. If you are scaling paid traffic, losing conversion signal, using Meta CAPI, or dealing with attribution gaps, a server-side tracking review can show whether it is worth implementing.",
  },
  {
    question: "Can you verify existing server-side tracking?",
    answer:
      "Yes. I can review browser-visible evidence first, then validate the final setup after approved access to GTM, GA4, Google Ads, Meta, CRM, or server logs. A server container alone does not prove everything is working correctly.",
  },
  {
    question: "What platforms can be included in a server-side tagging review?",
    answer:
      "The review can include GTM server-side, GA4, Google Ads, Meta Conversions API, enhanced conversions, form tracking, lead events, ecommerce events, and CRM or server-side conversion flows.",
  },
  {
    question: "What are the benefits of server-side tagging?",
    answer:
      "Server-side tagging can improve control over event routing, reduce dependency on browser-only tracking, support first-party measurement, help with Meta CAPI and Google Ads conversion paths, and make event validation easier when implemented properly.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trackflowpro.com/services/server-side-tracking#webpage",
      url: "https://trackflowpro.com/services/server-side-tracking",
      name: "Server-Side Tracking Service | GTM Server-Side & First-Party Measurement",
      description:
        "Server-side tracking service for GTM server-side, server-side tagging, first-party measurement, Google Ads conversion tracking, Meta CAPI, and event validation.",
      isPartOf: {
        "@id": "https://trackflowpro.com/#website",
      },
    },
    {
      "@type": "Service",
      "@id": "https://trackflowpro.com/services/server-side-tracking#service",
      name: "Server-Side Tracking Service",
      serviceType: "Server-side tracking, GTM server-side, and first-party measurement consulting",
      provider: {
        "@type": "Organization",
        name: "TrackFlow Pro",
        url: "https://trackflowpro.com",
      },
      areaServed: "Worldwide",
      description:
        "Server-side tracking, server-side tagging, GTM server-side setup review, first-party measurement, Google Ads conversion tracking, Meta CAPI, and event validation service.",
    },
    {
      "@type": "BreadcrumbList",
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
          name: "Server-Side Tracking",
          item: "https://trackflowpro.com/services/server-side-tracking",
        },
      ],
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

export default function ServerSideTrackingPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <HeroSection />
        <SignalProblemSection />
        <ServiceScopeSection />
        <ArchitectureSection />
        <ComparisonSection />
        <ProcessSection />
        <DeliverablesSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_35%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 py-20 dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent_35%),linear-gradient(to_bottom,#020617,#0f172a)] sm:px-6 lg:px-8 lg:py-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <ShieldCheck className="h-4 w-4" /> GTM server-side & first-party measurement
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Server-Side Tracking <span className="text-blue-600 dark:text-blue-400">& Server-Side</span> Tagging Service
          </h1>

          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-slate-300">
            Build a stronger first-party measurement layer with server-side tracking, GTM server-side, Google Ads conversion tracking, Meta CAPI, and validated event routing.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/free-tracking-audit"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              Verify My Server-Side Tracking
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/services/google-ads-conversion-tracking"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
            >
              Google Ads Tracking Service
            </Link>
          </div>

          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              "GTM server-side review",
              "Meta CAPI event validation",
              "First-party signal routing",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <HeroSignalCard />
      </div>
    </section>
  );
}

function HeroSignalCard() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-600/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Measurement layer review</p>
              <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Server-Side Signal Check</h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              First-party
            </span>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {[
            { label: "GTM server-side", value: "Container review", tone: "blue" },
            { label: "Event routing", value: "Needs validation", tone: "amber" },
            { label: "Meta CAPI", value: "Deduplication check", tone: "blue" },
            { label: "Google Ads conversions", value: "Signal path review", tone: "slate" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900">
                  <SearchCheck className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-base font-black text-slate-950 dark:text-white">{row.label}</span>
                  <span className="mt-1 block text-sm font-bold text-slate-500 dark:text-slate-400">Tracking evidence</span>
                </span>
              </div>
              <span className={badgeClass(row.tone)}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignalProblemSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Why server-side measurement matters"
          title="Browser-only tracking can lose important conversion signals."
          description="Server-side tracking helps create a more reliable measurement path, but it must be implemented, routed, and validated carefully before you trust it for paid traffic decisions."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {signalIssues.map((issue) => (
            <div key={issue.title} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/70">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                {issue.icon}
              </div>
              <h3 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">{issue.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">{issue.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceScopeSection() {
  return (
    <section className="bg-slate-50 px-4 py-20 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Server-side tracking service scope"
          title="What I review, fix, or help implement."
          description="The goal is not only to install server-side tagging. The goal is to verify whether event routing, parameters, deduplication, and destinations are working correctly."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {serviceScope.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-black leading-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200">
              <CheckCircle2 className="mb-4 h-5 w-5 text-emerald-500" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <LockKeyhole className="h-4 w-4" /> Privacy-aware signal routing
          </div>
          <h2 className="text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
            GTM server-side should be a controlled measurement layer, not just another tag.
          </h2>
          <p className="mt-6 text-base font-medium leading-8 text-slate-600 dark:text-slate-400">
            A proper server side tracking GTM setup can support first-party measurement, cleaner destination routing, Meta CAPI, Google Ads conversion paths, and event validation. But the setup needs the right event design, consent behavior, identifiers, and destination checks.
          </p>
        </div>

        <div className="grid gap-6">
          {implementationCards.map((card) => (
            <div key={card.title} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                {card.icon}
              </div>
              <h3 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">{card.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Server side tracking vs client side tracking"
          title="Both layers matter. The difference is control and resilience."
          description="Client-side tracking captures browser behavior. Server-side tagging helps route and validate events through a more controlled measurement path."
          dark
        />

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]">
          <div className="grid border-b border-white/10 bg-white/[0.04] text-sm font-black uppercase tracking-[0.18em] text-blue-300 md:grid-cols-2">
            <div className="border-b border-white/10 p-5 md:border-b-0 md:border-r">Client-side tracking</div>
            <div className="p-5">Server-side tracking</div>
          </div>
          {comparisonRows.map((row, index) => (
            <div key={`${row.client}-${index}`} className="grid border-b border-white/10 last:border-b-0 md:grid-cols-2">
              <div className="border-b border-white/10 p-5 text-sm font-medium leading-7 text-slate-300 md:border-b-0 md:border-r md:border-white/10">
                {row.client}
              </div>
              <div className="p-5 text-sm font-medium leading-7 text-slate-300">{row.server}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Audit → Map → Implement → Validate"
          title="A careful server-side tracking process."
          description="The setup should be based on evidence, not assumptions. I separate visible browser evidence from account-level or server-log confirmation."
          centered
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {processSteps.map((step) => (
            <div key={step.number} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-8 text-5xl font-black tracking-[-0.06em] text-blue-600 dark:text-blue-400">{step.number}</div>
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
    <section className="bg-slate-50 px-4 py-20 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
            What you receive
          </p>
          <h2 className="text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
            A practical plan for stronger server-side measurement.
          </h2>
          <p className="mt-6 text-base font-medium leading-8 text-slate-600 dark:text-slate-400">
            You receive a clear server-side tracking review that explains what was found, what it likely means, what needs validation, and which fixes should happen first.
          </p>
          <div className="mt-8">
            <Link href="/free-tracking-audit" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500">
              Request Free Tracking Review
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {deliverables.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-black leading-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              <FileSearch className="mb-4 h-5 w-5 text-blue-600 dark:text-blue-300" />
              {item}
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
          eyebrow="Server-side tracking FAQ"
          title="Questions before verifying server-side tracking."
          description="Clear answers for businesses considering GTM server-side, server-side tagging, Meta CAPI, and first-party measurement improvements."
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
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">Server-side tracking review</p>
            <h2 className="max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">
              Verify whether your server-side tracking is really working.
            </h2>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-400">
              Get an evidence-based review of GTM server-side, server-side tagging, Google Ads conversions, GA4 events, Meta CAPI, and first-party measurement paths.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/free-tracking-audit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500">
              Verify My Server-Side Tracking
              <ArrowRight className="h-4 w-4" />
            </Link>
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

function badgeClass(tone: string) {
  const base = "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest whitespace-nowrap";
  if (tone === "amber") return `${base} bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300`;
  if (tone === "red") return `${base} bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300`;
  if (tone === "blue") return `${base} bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300`;
  return `${base} bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`;
}
