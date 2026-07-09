import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Database,
  FileSearch,
  Gauge,
  Layers3,
  LockKeyhole,
  MousePointerClick,
  SearchCheck,
  ServerCog,
  ShieldCheck,
  ShoppingCart,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";

export const metadata: Metadata = {
  title: "Google Ads Conversion Tracking Service | GA4, GTM & Enhanced Conversions",
  description:
    "Fix Google Ads conversion tracking, GA4/GTM events, enhanced conversions, ecommerce tracking, form tracking, call tracking, and server-side conversion validation with an evidence-based setup review.",
  alternates: {
    canonical: "https://trackflowpro.com/services/google-ads-conversion-tracking",
  },
  openGraph: {
    title: "Google Ads Conversion Tracking Service | TrackFlow Pro",
    description:
      "Google Ads conversion tracking setup and fixing service for GA4, GTM, enhanced conversions, ecommerce events, form tracking, call tracking, and server-side measurement.",
    url: "https://trackflowpro.com/services/google-ads-conversion-tracking",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro - Google Ads Conversion Tracking Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Ads Conversion Tracking Service | TrackFlow Pro",
    description:
      "Fix broken Google Ads conversion tracking with GA4, GTM, enhanced conversions, and server-side validation.",
    images: ["https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
};

type IconCard = {
  title: string;
  description: string;
  icon: ReactNode;
};

type Step = {
  number: string;
  title: string;
  description: string;
};

type Faq = {
  question: string;
  answer: string;
};

const auditSignals = [
  { label: "Google Ads tag", status: "Conversion action review", tone: "blue" },
  { label: "GA4 key events", status: "Mapping validation", tone: "purple" },
  { label: "GTM triggers", status: "Setup diagnosis", tone: "amber" },
  { label: "Enhanced conversions", status: "Data quality check", tone: "green" },
];

const problemCards: IconCard[] = [
  {
    title: "Google Ads conversion tracking is not working",
    description:
      "I check whether your conversion action, GTM tag, GA4 key event, trigger, thank-you page, form event, or ecommerce purchase event is missing, duplicated, or firing in the wrong place.",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "Google Ads and GA4 numbers do not match",
    description:
      "Attribution windows, GA4 event naming, imported key events, consent mode behavior, and tag firing rules can create reporting gaps between Google Ads and GA4.",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Enhanced conversions are not properly configured",
    description:
      "Enhanced conversions Google Ads setup needs clean user-provided data handling, correct hashing path, matching form fields, and verified diagnostics inside Google Ads.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Ecommerce conversion value is missing or wrong",
    description:
      "For Shopify, WooCommerce, and custom ecommerce sites, purchase value, currency, transaction ID, item data, and duplicate purchase events must be verified carefully.",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
];

const setupAreas: IconCard[] = [
  {
    title: "Google Ads conversion action setup",
    description:
      "Primary and secondary conversion actions, category, counting method, attribution settings, value rules, and account-level conversion goals are reviewed before implementation.",
    icon: <CircleDollarSign className="h-5 w-5" />,
  },
  {
    title: "Google Ads conversion tracking with GTM",
    description:
      "Google Tag Manager tags, triggers, variables, data layer values, form events, button clicks, thank-you pages, and ecommerce events are mapped to the right conversions.",
    icon: <Workflow className="h-5 w-5" />,
  },
  {
    title: "GA4 event and key event validation",
    description:
      "GA4 events are checked for naming consistency, parameters, DebugView behavior, key event marking, and Google Ads import readiness.",
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    title: "Server-side conversion tracking review",
    description:
      "Google Ads server side conversion tracking paths, first-party measurement signals, event routing, and deduplication logic are reviewed when server-side tracking is part of the setup.",
    icon: <ServerCog className="h-5 w-5" />,
  },
  {
    title: "Enhanced conversions Google Ads",
    description:
      "I review whether enhanced conversions are technically possible, where user-provided data is available, and what must be validated inside Google Ads and GTM.",
    icon: <LockKeyhole className="h-5 w-5" />,
  },
  {
    title: "Forms, calls, bookings, and lead events",
    description:
      "Lead generation tracking can include forms, phone calls, Calendly or booking actions, quote requests, file downloads, and CRM-ready lead events.",
    icon: <MousePointerClick className="h-5 w-5" />,
  },
];

const ecommerceItems = [
  "Shopify Google Ads conversion tracking",
  "WooCommerce Google Ads conversion tracking",
  "Purchase value and currency validation",
  "Transaction ID and duplicate purchase checks",
  "Add to cart, begin checkout, and purchase event review",
  "GA4 ecommerce and Google Ads conversion import checks",
];

const processSteps: Step[] = [
  {
    number: "01",
    title: "Evidence review",
    description:
      "I start with public browser-visible evidence: tags, network requests, conversion events, pixels, form behavior, checkout flow, and thank-you page signals.",
  },
  {
    number: "02",
    title: "Tracking diagnosis",
    description:
      "I identify likely tracking gaps across Google Ads, GA4, GTM, enhanced conversions, ecommerce tracking, consent behavior, and server-side conversion paths.",
  },
  {
    number: "03",
    title: "Fix plan",
    description:
      "You get a priority-based plan showing what is broken, why it matters, what should be fixed first, and what access is required for final validation.",
  },
  {
    number: "04",
    title: "Implementation & validation",
    description:
      "After approved access, conversion tracking is implemented or fixed and validated inside GTM Preview, GA4 DebugView, Google Ads diagnostics, CRM, or server logs.",
  },
];

const deliverables = [
  "Google Ads conversion tracking audit summary",
  "GA4 and GTM event validation notes",
  "Conversion action and tag firing diagnosis",
  "Enhanced conversions feasibility and validation notes",
  "Ecommerce, form, call, or booking tracking recommendations",
  "Priority fix plan with access requirements",
];

const faqs: Faq[] = [
  {
    question: "Why is my Google Ads conversion tracking not working?",
    answer:
      "Google Ads conversion tracking may not work because the conversion tag is missing, the GTM trigger is wrong, the GA4 key event is not imported correctly, the thank-you page does not load, ecommerce values are not passed, consent settings block the event, or the same conversion is duplicated by multiple tags.",
  },
  {
    question: "Can you fix Google Ads conversions not tracking correctly?",
    answer:
      "Yes. I review Google Ads conversion actions, Google Tag Manager tags, GA4 events, enhanced conversions, form and call tracking, ecommerce purchase events, and server-side conversion tracking paths to identify and fix tracking gaps.",
  },
  {
    question: "Do you set up Google Ads conversion tracking with Google Tag Manager?",
    answer:
      "Yes. Google Ads conversion tracking GTM setup can include tags, triggers, variables, data layer events, form submissions, button clicks, thank-you page events, ecommerce purchase events, and enhanced conversions where appropriate.",
  },
  {
    question: "Do you work with enhanced conversions Google Ads setup?",
    answer:
      "Yes. I review whether enhanced conversions are appropriate for your website, where user-provided data is available, how the data should be handled, and how the setup should be validated inside Google Ads and GTM.",
  },
  {
    question: "Can you help with Shopify or WooCommerce Google Ads conversion tracking?",
    answer:
      "Yes. I can review Shopify Google Ads conversion tracking and WooCommerce Google Ads conversion tracking for purchase events, conversion value, currency, transaction IDs, duplicate purchases, GA4 ecommerce events, and Google Ads import issues.",
  },
  {
    question: "Do you need login access for the first review?",
    answer:
      "No. The first review can start with public browser-visible evidence. Final confirmation or implementation may require approved access to Google Ads, GA4, GTM, your ecommerce platform, CRM, or server-side logs.",
  },
];

const structuredData = {
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
      "@id": "https://trackflowpro.com/services/google-ads-conversion-tracking#webpage",
      url: "https://trackflowpro.com/services/google-ads-conversion-tracking",
      name: "Google Ads Conversion Tracking Service | TrackFlow Pro",
      description:
        "Google Ads conversion tracking setup and fixing service for GA4, GTM, enhanced conversions, ecommerce tracking, form tracking, call tracking, and server-side conversion validation.",
      isPartOf: { "@id": "https://trackflowpro.com/#website" },
      about: { "@id": "https://trackflowpro.com/services/google-ads-conversion-tracking#service" },
    },
    {
      "@type": "Service",
      "@id": "https://trackflowpro.com/services/google-ads-conversion-tracking#service",
      name: "Google Ads Conversion Tracking Service",
      alternateName: [
        "Google Ads conversion tracking specialist",
        "Google Ads enhanced conversions setup",
        "Google Ads conversion tracking GTM setup",
      ],
      serviceType: "Google Ads conversion tracking setup and fixing service",
      provider: { "@id": "https://trackflowpro.com/#organization" },
      areaServed: "Worldwide",
      url: "https://trackflowpro.com/services/google-ads-conversion-tracking",
      description:
        "Google Ads conversion tracking setup and fixing service for GA4, GTM, enhanced conversions, ecommerce tracking, form tracking, call tracking, and server-side conversion validation.",
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        url: "https://trackflowpro.com/free-tracking-audit",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://trackflowpro.com/services/google-ads-conversion-tracking#faq",
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
      "@id": "https://trackflowpro.com/services/google-ads-conversion-tracking#breadcrumb",
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
          name: "Google Ads Conversion Tracking",
          item: "https://trackflowpro.com/services/google-ads-conversion-tracking",
        },
      ],
    },
  ],
};

export default function GoogleAdsConversionTrackingPage() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <ScriptJsonLd data={structuredData} />
        <HeroSection />
        <TrustStrip />
        <ProblemSection />
        <SetupScopeSection />
        <EnhancedServerSideSection />
        <EcommerceSection />
        <ProcessSection />
        <ReportPreviewSection />
        <DeliverablesSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}

function ScriptJsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.14),transparent_34%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 pb-14 pt-24 sm:py-20 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.22),transparent_34%),linear-gradient(to_bottom,#020617,#0f172a)] sm:px-6 lg:px-8 lg:py-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:gap-14 lg:grid-cols-[1.02fr_0.98fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <SearchCheck className="h-4 w-4" /> Google Ads tracking specialist
          </div>

          <h1 className="max-w-4xl text-[2.05rem] font-black leading-[1.04] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl sm:leading-[1.02] sm:tracking-[-0.05em] md:text-6xl lg:text-7xl lg:leading-[0.98] lg:tracking-[-0.055em]">
            Google Ads Conversion Tracking <span className="text-blue-600 dark:text-blue-400">Setup & Fix</span> Service
          </h1>

          <p className="mt-7 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
            Fix broken Google Ads conversion tracking, validate GA4 and GTM events, set up enhanced conversions, and make your lead or ecommerce conversion data more reliable before scaling ad spend.
          </p>

          <div className="mt-7 flex sm:mt-9 flex-col gap-3 sm:flex-row">
            <Link
              href="/free-tracking-audit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 sm:w-auto px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              Fix My Conversion Tracking
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#audit-scope"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border sm:w-auto border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
            >
              View Audit Scope
            </Link>
          </div>

          <div className="mt-6 grid max-w-2xl sm:mt-8 gap-3 sm:grid-cols-3">
            {[
              "No login required for first review",
              "GA4, GTM, Google Ads validation",
              "Enhanced conversions and ecommerce checks",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <TrackingDiagnosticCard />
      </div>
    </section>
  );
}

function TrackingDiagnosticCard() {
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,36rem)] min-w-0">
      <div className="absolute -inset-5 rounded-[2.75rem] bg-blue-600/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                Conversion diagnostics
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                Google Ads Signal Review
              </h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              Evidence-first
            </span>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {auditSignals.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900">
                    <SearchCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950 dark:text-white">{item.label}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                      Browser-visible evidence
                    </p>
                  </div>
                </div>
                <span className={badgeClass(item.tone)}>{item.status}</span>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-300" />
              <p className="text-sm font-bold leading-6 text-blue-900 dark:text-blue-100">
                First review starts without account access. Final validation may require approved access to Google Ads, GA4, GTM, CRM, ecommerce platform, or server logs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustStrip() {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { value: "Google Ads", label: "Conversion actions, goals, values, imports" },
          { value: "GA4 + GTM", label: "Events, triggers, data layer, DebugView" },
          { value: "Enhanced", label: "Enhanced conversions and signal quality" },
          { value: "Server-side", label: "First-party measurement and validation paths" },
        ].map((item) => (
          <div key={item.value} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{item.value}</div>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500 dark:text-slate-400">{item.label}</p>
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
          eyebrow="Tracking problems"
          title="When conversion tracking is wrong, Google Ads optimization becomes unreliable."
          description="Conversion tracking Google Ads setups often break because tags, triggers, GA4 events, attribution settings, ecommerce values, or consent behavior are not validated together."
        />

        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 md:grid-cols-2">
          {problemCards.map((card) => (
            <IconPanel key={card.title} card={card} tone="red" />
          ))}
        </div>
      </div>
    </section>
  );
}

function SetupScopeSection() {
  return (
    <section id="audit-scope" className="bg-slate-50 px-4 py-14 sm:py-16 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader
          eyebrow="Setup & validation scope"
          title="Google Ads conversion tracking setup built around evidence, not guesses."
          description="The setup covers Google Ads conversion tracking tags, Google Tag Manager, GA4 key events, enhanced conversions, ecommerce events, form leads, calls, and server-side tracking paths where needed."
        />

        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 lg:grid-cols-3">
          {setupAreas.map((card) => (
            <IconPanel key={card.title} card={card} tone="blue" />
          ))}
        </div>
      </div>
    </section>
  );
}

function EnhancedServerSideSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Database className="h-4 w-4" /> Enhanced + server-side review
          </div>

          <h2 className="text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
            Better conversion signals for privacy-aware measurement.
          </h2>

          <p className="mt-6 text-[15px] font-medium leading-7 text-slate-600 sm:text-base sm:leading-8 dark:text-slate-400">
            Google Ads conversion tracking without cookies is not a single switch. It usually requires better first-party event quality, enhanced conversions, consent-aware behavior, and, when appropriate, server-side conversion tracking.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/free-tracking-audit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500">
              Request Free Tracking Review
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/services/server-side-tracking" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border sm:w-auto border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30">
              Server-Side Tracking
            </Link>
          </div>
        </div>

        <div className="max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Enhanced conversions readiness",
              "User-provided data source review",
              "Consent behavior and signal loss checks",
              "GTM server-side routing review",
              "Event ID and deduplication notes",
              "Google Ads diagnostics validation path",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-black leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EcommerceSection() {
  return (
    <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:gap-12 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div>
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-blue-300">
            Ecommerce tracking
          </p>
          <h2 className="max-w-4xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
            Shopify, WooCommerce, and ecommerce conversion value checks.
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] font-medium leading-7 text-slate-400 sm:text-base sm:leading-8">
            Ecommerce Google Ads conversion tracking needs clean purchase events, conversion value, currency, transaction IDs, and duplicate purchase protection. Without validation, revenue-based bidding can optimize from unreliable data.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {ecommerceItems.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-black leading-6 text-slate-200">
              <ShoppingCart className="mb-3 h-5 w-5 text-blue-300" />
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
          eyebrow="Audit → setup → validation"
          title="A clean process for fixing Google Ads conversion tracking."
          description="Every conversion tracking fix should be validated with clear evidence, so you know what was detected, what was changed, and what still requires account-level confirmation."
          centered
        />

        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 lg:grid-cols-4">
          {processSteps.map((step) => (
            <div key={step.number} className="max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
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

function ReportPreviewSection() {
  return (
    <section className="bg-slate-50 px-4 py-14 sm:py-16 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/50">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Sample diagnosis</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
              Google Ads Tracking Summary
            </h2>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            {[
              { title: "Main issue", text: "Google Ads conversion tracking setup needs validation against GA4/GTM event behavior and conversion action settings." },
              { title: "Likely impact", text: "Campaign bidding may be optimizing from incomplete, duplicated, or incorrectly attributed conversion signals." },
              { title: "Recommended next step", text: "Validate tags in GTM Preview, events in GA4 DebugView, conversion action diagnostics in Google Ads, and server-side logs if available." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <h3 className="text-sm font-black text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader
            eyebrow="Evidence-based reporting"
            title="Know what is broken before changing your setup."
            description="The report separates browser-visible evidence from assumptions and clearly explains what needs final confirmation inside Google Ads, GA4, GTM, CRM, ecommerce platform, or server logs."
          />
          <div className="mt-8">
            <Link href="/free-tracking-audit" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500">
              Get My Free Tracking Audit
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeliverablesSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <SectionHeader
            eyebrow="What you get"
            title="A practical fix plan, not a generic checklist."
            description="The goal is to help you understand exactly what needs to be corrected so your Google Ads conversion tracking setup can support better campaign decisions."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {deliverables.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-black leading-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
              <BadgeCheck className="mb-3 h-5 w-5 text-emerald-500" />
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
    <section className="bg-slate-50 px-4 py-14 sm:py-16 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-4xl">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions about Google Ads conversion tracking."
          description="Clear answers for businesses that need conversion tracking Google Ads campaigns can rely on."
          centered
        />
        <div className="mt-8 space-y sm:mt-10 lg:mt-12-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="max-w-full rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/60">
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
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/15 dark:border dark:border-slate-800 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.45fr] lg:items-center">
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
              Fix tracking before scaling
            </p>
            <h2 className="max-w-3xl text-[2rem] font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl sm:leading-[1] sm:tracking-[-0.05em]">
              Make your Google Ads conversion data easier to trust.
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] font-medium leading-7 text-slate-400 sm:text-base sm:leading-8">
              Start with a no-login tracking review. I will check public browser-visible evidence first and explain what needs deeper validation before implementation.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/free-tracking-audit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 sm:w-auto px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500">
              Request Free Tracking Review
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

function IconPanel({ card, tone }: { card: IconCard; tone: "blue" | "red" }) {
  return (
    <div className="group min-w-0 max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-900/70">
      <div
        className={cn(
          "mb-5 flex h-12 w-12 items-center justify-center rounded-2xl",
          tone === "red"
            ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300"
            : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
        )}
      >
        {card.icon}
      </div>
      <h3 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">{card.title}</h3>
      <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">{card.description}</p>
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
  const base = "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest whitespace-nowrap";
  if (tone === "amber") return `${base} bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300`;
  if (tone === "green") return `${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300`;
  if (tone === "purple") return `${base} bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300`;
  return `${base} bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300`;
}
