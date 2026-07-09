import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileSearch,
  Fingerprint,
  Layers,
  LineChart,
  Link2,
  LockKeyhole,
  MousePointerClick,
  RefreshCw,
  Route,
  SearchCheck,
  Server,
  ShieldCheck,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

export const metadata: Metadata = {
  title: "Meta Conversions API Setup | Facebook CAPI & Server-Side Event Tracking",
  description:
    "Improve Meta Pixel and Meta Conversions API tracking with cleaner server-side events, deduplication, event match quality review, and browser-to-server validation.",
  alternates: {
    canonical: "https://trackflowpro.com/services/meta-capi",
  },
  openGraph: {
    title: "Meta Conversions API Setup | Facebook CAPI & Server-Side Event Tracking",
    description:
      "Evidence-based Meta CAPI setup and audit for Meta Pixel, server events, event match quality, deduplication, and conversion signal reliability.",
    url: "https://trackflowpro.com/services/meta-capi",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro - Meta Conversions API Setup and Facebook CAPI Tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meta Conversions API Setup | Facebook CAPI & Server-Side Tracking",
    description:
      "Improve Meta CAPI tracking with server events, event match quality review, and browser/server deduplication checks.",
    images: ["https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
};

const capiSignals = [
  {
    label: "Meta Pixel",
    value: "Browser event review",
    tone: "blue",
  },
  {
    label: "Meta CAPI",
    value: "Server event validation",
    tone: "emerald",
  },
  {
    label: "Deduplication",
    value: "Event ID check",
    tone: "amber",
  },
  {
    label: "Match Quality",
    value: "Needs review",
    tone: "slate",
  },
];

const problems = [
  {
    title: "Meta Pixel events are losing signal quality",
    description:
      "Browser-side events can be affected by ad blockers, browser restrictions, consent behavior, page speed, and weak event parameters.",
    icon: <MousePointerClick className="h-6 w-6" />,
  },
  {
    title: "Meta CAPI is installed but not properly validated",
    description:
      "A Conversions API connection alone is not enough. Server events, parameters, event IDs, and deduplication need to be checked.",
    icon: <Server className="h-6 w-6" />,
  },
  {
    title: "Pixel and server events are duplicated",
    description:
      "If browser and server events do not share the right event ID, Meta may count duplicates or fail to match events correctly.",
    icon: <RefreshCw className="h-6 w-6" />,
  },
  {
    title: "Lead or purchase events do not pass enough data",
    description:
      "Event match quality can suffer when email, phone, external ID, content data, value, currency, or custom parameters are missing or inconsistent.",
    icon: <Fingerprint className="h-6 w-6" />,
  },
];

const serviceScope = [
  {
    title: "Meta Pixel and CAPI audit",
    description:
      "Review Meta Pixel events, Meta Conversions API events, browser/server paths, event names, and event quality signals.",
    icon: <FileSearch className="h-6 w-6" />,
  },
  {
    title: "Server-side event setup",
    description:
      "Set up or improve server-side tracking paths for lead, contact, purchase, schedule, signup, and other conversion events.",
    icon: <Database className="h-6 w-6" />,
  },
  {
    title: "Event match quality review",
    description:
      "Check whether Meta receives useful customer information parameters and clean event data for better matching and reporting.",
    icon: <Target className="h-6 w-6" />,
  },
  {
    title: "Deduplication validation",
    description:
      "Validate that browser Pixel and server CAPI events use consistent event IDs so Meta can deduplicate them correctly.",
    icon: <Link2 className="h-6 w-6" />,
  },
];

const auditChecklist = [
  "Meta Pixel base code and event firing behavior",
  "Meta Conversions API server event path",
  "Lead, Contact, Purchase, Schedule, and custom event naming",
  "Browser event and server event deduplication",
  "Event ID consistency between Pixel and CAPI",
  "Event match quality parameters",
  "Value, currency, content, and conversion parameters",
  "Meta Events Manager diagnostics review",
  "Consent behavior and privacy-related tracking gaps",
  "GTM, server-side tracking, or platform integration checks",
];

const comparisonRows = [
  {
    item: "Event source",
    pixel: "Browser-side Meta Pixel fires from the visitor's browser.",
    capi: "Meta CAPI sends server-side events from a server, platform, CRM, or tracking endpoint.",
  },
  {
    item: "Signal reliability",
    pixel: "Can lose signal because of browser limits, ad blockers, consent behavior, or script issues.",
    capi: "Can improve reliability when server events are clean, consent-aware, and properly matched.",
  },
  {
    item: "Deduplication",
    pixel: "Needs a matching event ID when the same conversion is also sent server-side.",
    capi: "Needs the same event ID to help Meta avoid duplicate counting.",
  },
  {
    item: "Validation",
    pixel: "Checked through browser-visible evidence, Pixel Helper, and network requests.",
    capi: "Checked through Events Manager, test events, server logs, and event payload review.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Pixel and browser evidence review",
    description:
      "I inspect browser-visible tracking evidence first: Pixel requests, event names, conversion flow, parameters, and page behavior.",
  },
  {
    number: "02",
    title: "Server event path audit",
    description:
      "I review whether Meta Conversions API is present, how server events are triggered, and whether event payloads are complete enough.",
  },
  {
    number: "03",
    title: "Deduplication and match quality checks",
    description:
      "I validate event ID logic, customer information parameters, event match quality risks, and Meta Events Manager diagnostics.",
  },
  {
    number: "04",
    title: "Fix plan and validation",
    description:
      "You get a prioritized fix plan. After access is approved, changes are validated in Meta, GTM, server-side tools, CRM, or logs.",
  },
];

const deliverables = [
  "Meta Pixel vs Conversions API tracking review",
  "Event match quality improvement recommendations",
  "Pixel and server event deduplication checks",
  "Lead, form, checkout, and purchase event review",
  "Meta Events Manager diagnostics summary",
  "GTM, server-side tagging, or platform setup guidance",
  "Clear next-step implementation plan",
  "Validation notes after fixes are completed",
];

const faqs = [
  {
    question: "What is Meta Conversions API?",
    answer:
      "Meta Conversions API is a server-side tracking method that sends conversion events to Meta from a server, platform, CRM, or server-side tracking endpoint instead of relying only on browser-side Pixel events.",
  },
  {
    question: "Do I still need Meta Pixel if I use Meta CAPI?",
    answer:
      "In most cases, yes. Meta Pixel and Meta CAPI work best together when browser and server events are correctly deduplicated with matching event IDs.",
  },
  {
    question: "Can you fix duplicate Meta Pixel and CAPI events?",
    answer:
      "Yes. I review event names, event IDs, browser and server payloads, GTM/server-side logic, and Meta Events Manager diagnostics to identify deduplication problems.",
  },
  {
    question: "What affects Meta event match quality?",
    answer:
      "Event match quality can be affected by missing or weak customer information parameters, incomplete event payloads, inconsistent external IDs, consent behavior, or poor server-side event configuration.",
  },
  {
    question: "Do you need access to Meta Business Manager for the first review?",
    answer:
      "No. The first review can start with public browser-visible evidence. Final confirmation may require Meta Events Manager, GTM, CRM, platform, server-side tracking, or server-log access.",
  },
];

export default function MetaCapiPage() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <JsonLd />
        <HeroSection />
        <TrustBar />
        <ProblemSection />
        <ServiceScopeSection />
        <ComparisonSection />
        <ChecklistSection />
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
    <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_34%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 pb-14 pt-24 sm:py-20 dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_34%),linear-gradient(to_bottom,#020617,#0f172a)] sm:px-6 lg:px-8 lg:py-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:gap-14 lg:grid-cols-[1.04fr_0.96fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <Zap className="h-4 w-4" /> Meta Pixel + server event tracking
          </div>

          <h1 className="max-w-4xl text-[2.05rem] font-black leading-[1.04] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl sm:leading-[1.02] sm:tracking-[-0.05em] md:text-6xl lg:text-7xl lg:leading-[0.98] lg:tracking-[-0.055em]">
            Meta Conversions API <span className="text-blue-600 dark:text-blue-400">& Facebook CAPI</span> Setup
          </h1>

          <p className="mt-7 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
            Improve Meta Pixel and Meta CAPI tracking with cleaner server-side events, better event match quality, deduplication validation, and evidence-based conversion signal review.
          </p>

          <div className="mt-7 flex sm:mt-9 flex-col gap-3 sm:flex-row">
            <Link
              href="/free-tracking-audit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 sm:w-auto px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              Improve My Meta CAPI Tracking
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border sm:w-auto border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
            >
              Talk to a Specialist
            </Link>
          </div>

          <div className="mt-6 grid max-w-2xl sm:mt-8 gap-3 sm:grid-cols-3">
            {[
              "Meta Pixel vs CAPI review",
              "Event match quality checks",
              "Browser/server deduplication",
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
    <div className="relative mx-auto w-full max-w-[min(100%,36rem)] min-w-0">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-600/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Meta CAPI audit preview</p>
              <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Server Event Quality Review</h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              CAPI-focused
            </span>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {capiSignals.map((row) => (
            <div key={row.label} className="flex flex-col items-start gap-3 rounded-2xl sm:flex-row sm:items-center sm:justify-between sm:gap-4 border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900">
                  <SearchCheck className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-base font-black text-slate-950 dark:text-white">{row.label}</span>
                  <span className="mt-1 block text-sm font-bold text-slate-500 dark:text-slate-400">Browser + server evidence</span>
                </span>
              </div>
              <span className={badgeClass(row.tone)}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
            <p className="text-sm font-black text-slate-950 dark:text-white">Trust-first note</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              The first review starts with public browser-visible evidence. Final confirmation may require Meta Events Manager, GTM, CRM, or server-side logs.
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
          { value: "Pixel + CAPI", label: "Tracking path", note: "Browser-side and server-side event review." },
          { value: "Event ID", label: "Deduplication", note: "Check Pixel and server event alignment." },
          { value: "Match quality", label: "Signal improvement", note: "Review event parameters and customer data readiness." },
          { value: "Audit → Fix", label: "Process", note: "Evidence, diagnosis, implementation, validation." },
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
          eyebrow="Meta tracking problems"
          title="Meta Pixel alone is often not enough for reliable conversion data."
          description="When browser-side signals weaken, Meta CAPI can help — but only when server events, deduplication, and event match quality are implemented correctly."
        />

        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 md:grid-cols-2">
          {problems.map((problem) => (
            <div key={problem.title} className="group min-w-0 max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/70">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                {problem.icon}
              </div>
              <h3 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">{problem.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceScopeSection() {
  return (
    <section className="bg-slate-50 px-4 py-14 sm:py-16 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader
          eyebrow="Meta CAPI service scope"
          title="Meta Conversions API setup, audit, and validation."
          description="A focused service for businesses that need cleaner Meta event tracking, stronger server-side signals, and more trustworthy conversion reporting."
        />

        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 lg:grid-cols-4">
          {serviceScope.map((item) => (
            <div key={item.title} className="max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-blue-900/70">
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

function ComparisonSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <Layers className="h-4 w-4" /> Meta Pixel vs Conversion API
          </div>
          <h2 className="text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
            Pixel and CAPI should work together, not compete with each other.
          </h2>
          <p className="mt-6 text-[15px] font-medium leading-7 text-slate-600 sm:text-base sm:leading-8 dark:text-slate-400">
            The goal is not to replace the Meta Pixel blindly. The goal is to send cleaner conversion signals through both browser and server paths, then deduplicate them properly.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/25">
            <p className="text-sm font-black text-slate-950 dark:text-white">Clean CAPI setup depends on validation.</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              Server events, browser events, event IDs, and match parameters must be reviewed together before you can trust the result.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/60">
          {comparisonRows.map((row, index) => (
            <div key={row.item} className={cn("grid gap-4 p-5 sm:p-6 md:grid-cols-[0.45fr_1fr_1fr]", index !== 0 && "border-t border-slate-100 dark:border-slate-800")}>
              <div>
                <p className="text-sm font-black text-blue-600 dark:text-blue-300">{row.item}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Meta Pixel</p>
                <p className="text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">{row.pixel}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/25">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Meta CAPI</p>
                <p className="text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{row.capi}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChecklistSection() {
  return (
    <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader
          eyebrow="Meta CAPI audit checklist"
          title="What I review before changing your Meta tracking setup."
          description="A clean Meta CAPI audit checks both browser-visible evidence and account/server-level confirmation when access is approved."
          dark
        />

        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auditChecklist.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm font-black text-slate-200">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              {item}
            </div>
          ))}
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
          eyebrow="Audit → Fix → Validate"
          title="A clean process for Meta CAPI tracking improvements."
          description="Every recommendation starts with evidence, then moves into implementation and validation only after the tracking issue is clear."
          centered
        />

        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 lg:grid-cols-4">
          {processSteps.map((step) => (
            <div key={step.number} className="max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-5 text-4xl sm:mb-8 sm:text-5xl font-black tracking-[-0.06em] text-blue-600 dark:text-blue-400">{step.number}</div>
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
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">What you receive</p>
          <h2 className="text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
            Clear Meta CAPI findings, not vague tracking advice.
          </h2>
          <p className="mt-6 text-[15px] font-medium leading-7 text-slate-600 sm:text-base sm:leading-8 dark:text-slate-400">
            You get a practical review of what is working, what is risky, what needs to be fixed first, and what access is needed for final confirmation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/free-tracking-audit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 sm:w-auto px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500">
              Request Free Tracking Review
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border sm:w-auto border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/40">
              Contact Specialist
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {deliverables.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-black text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
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
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-4xl">
        <SectionHeader
          eyebrow="FAQ"
          title="Meta CAPI questions before requesting a tracking review."
          description="Clear answers for businesses that want better Meta event tracking and conversion signal quality."
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
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">Meta CAPI tracking review</p>
            <h2 className="max-w-3xl text-[2rem] font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl sm:leading-[1] sm:tracking-[-0.05em]">
              Find out whether Meta is receiving clean browser and server conversion signals.
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] font-medium leading-7 text-slate-400 sm:text-base sm:leading-8">
              Start with an evidence-based review of Meta Pixel, Meta Conversions API, event match quality, deduplication, and server-side event tracking.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/free-tracking-audit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 sm:w-auto px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500">
              Improve My Meta CAPI Tracking
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border sm:w-auto border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.08]">
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
      <h2 className={cn("text-[2rem] font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl sm:leading-[1] sm:tracking-[-0.05em]", dark ? "text-white" : "text-slate-950 dark:text-white")}>{title}</h2>
      <p className={cn("mt-5 text-base font-medium leading-8", dark ? "text-slate-400" : "text-slate-600 dark:text-slate-400")}>{description}</p>
    </div>
  );
}

function JsonLd() {
  const schema = {
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
        "@id": "https://trackflowpro.com/services/meta-capi#webpage",
        url: "https://trackflowpro.com/services/meta-capi",
        name: "Meta Conversions API Setup | Facebook CAPI & Server-Side Event Tracking",
        description:
          "Meta Conversions API setup and audit for Meta Pixel, Facebook CAPI, event match quality, deduplication, and server-side conversion tracking.",
        isPartOf: { "@id": "https://trackflowpro.com/#website" },
        about: { "@id": "https://trackflowpro.com/services/meta-capi#service" },
      },
      {
        "@type": "Service",
        "@id": "https://trackflowpro.com/services/meta-capi#service",
        name: "Meta Conversions API Setup",
        alternateName: [
          "Meta CAPI setup specialist",
          "Facebook Conversions API setup",
          "Meta Pixel and CAPI tracking specialist",
        ],
        serviceType: "Meta CAPI and server-side event tracking",
        provider: { "@id": "https://trackflowpro.com/#organization" },
        areaServed: "Worldwide",
        url: "https://trackflowpro.com/services/meta-capi",
        description:
          "Meta Pixel and Meta Conversions API setup, audit, deduplication validation, event match quality review, and server-side event tracking support.",
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          url: "https://trackflowpro.com/free-tracking-audit",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://trackflowpro.com/services/meta-capi#breadcrumb",
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
            name: "Meta CAPI",
            item: "https://trackflowpro.com/services/meta-capi",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://trackflowpro.com/services/meta-capi#faq",
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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function badgeClass(tone: string) {
  const base = "shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest";
  if (tone === "amber") return `${base} bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300`;
  if (tone === "emerald") return `${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300`;
  if (tone === "blue") return `${base} bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300`;
  return `${base} bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
