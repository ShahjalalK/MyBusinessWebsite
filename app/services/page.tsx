import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileSearch,
  Gauge,
  Layers,
  LineChart,
  MousePointerClick,
  SearchCheck,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

export const metadata: Metadata = {
  title: "Tracking Services Overview | Google Ads, GA4, GTM, Meta CAPI, Looker Studio & Server-Side Tracking",
  description:
    "Explore TrackFlow Pro tracking services for Google Ads conversion tracking, GA4 and GTM audits, Meta Conversions API, Looker Studio dashboards, enhanced conversions, and server-side tracking.",
  alternates: {
    canonical: "https://trackflowpro.com/services",
  },
  openGraph: {
    title: "Tracking Services Overview | TrackFlow Pro",
    description:
      "Specialist tracking services for Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, Looker Studio dashboards, enhanced conversions, and server-side measurement.",
    url: "https://trackflowpro.com/services",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro tracking services overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tracking Services Overview | TrackFlow Pro",
    description:
      "Google Ads conversion tracking, GA4/GTM audit, Meta CAPI, Looker Studio dashboards, and server-side tracking services.",
    images: ["https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
};

const coreServices = [
  {
    title: "Google Ads Conversion Tracking",
    href: "/services/google-ads-conversion-tracking",
    icon: <Target className="h-6 w-6" />,
    eyebrow: "Core service",
    description:
      "Fix and validate Google Ads conversion tracking, GTM tags, GA4 key events, enhanced conversions, form tracking, call tracking, and ecommerce events.",
    bestFor: [
      "Google Ads conversions not tracking",
      "GA4 and Google Ads mismatch",
      "Enhanced conversions setup",
      "Lead, call, and ecommerce tracking",
    ],
    cta: "Fix conversion tracking",
  },
  {
    title: "Server-Side Tracking",
    href: "/services/server-side-tracking",
    icon: <ShieldCheck className="h-6 w-6" />,
    eyebrow: "Signal quality",
    description:
      "Build or audit a stronger first-party measurement foundation with server-side tracking, server-side tagging, and GTM server-side validation.",
    bestFor: [
      "Browser-side signal loss",
      "GTM server-side tracking review",
      "First-party tracking endpoint",
      "Event routing and validation",
    ],
    cta: "Verify server-side tracking",
  },
  {
    title: "GA4 & GTM Audit",
    href: "/services/ga4-gtm-audit",
    icon: <FileSearch className="h-6 w-6" />,
    eyebrow: "Audit & validation",
    description:
      "Audit GA4 events, Google Tag Manager tags, triggers, variables, consent behavior, data layer quality, and conversion paths.",
    bestFor: [
      "Google Tag Manager audit",
      "GA4 conversion tracking issues",
      "Data layer review",
      "Tag and trigger cleanup",
    ],
    cta: "Audit GA4 & GTM",
  },
  {
    title: "Meta Conversions API",
    href: "/services/meta-capi",
    icon: <Zap className="h-6 w-6" />,
    eyebrow: "Meta CAPI",
    description:
      "Improve Meta Pixel and Meta Conversions API event reliability with cleaner server events, deduplication checks, and event match quality review.",
    bestFor: [
      "Meta Pixel vs CAPI review",
      "Facebook CAPI setup",
      "Event match quality issues",
      "Deduplication validation",
    ],
    cta: "Improve Meta CAPI",
  },
  {
    title: "Looker Studio Dashboard",
    href: "/services/looker-studio-dashboard",
    icon: <BarChart3 className="h-6 w-6" />,
    eyebrow: "PPC reporting",
    description:
      "Build clean Looker Studio dashboards for Google Ads, GA4, Meta Ads, leads, revenue, conversion tracking, and tracking health reporting.",
    bestFor: [
      "Google Ads and GA4 dashboard",
      "Meta Ads reporting dashboard",
      "Lead and revenue reporting",
      "Tracking health overview",
    ],
    cta: "Build reporting dashboard",
  },
];

const signals = [
  {
    label: "Google Ads",
    value: "Conversion actions",
    icon: <Target className="h-5 w-5" />,
  },
  {
    label: "GA4 + GTM",
    value: "Events, tags, triggers",
    icon: <FileSearch className="h-5 w-5" />,
  },
  {
    label: "Meta CAPI",
    value: "Pixel + server events",
    icon: <MousePointerClick className="h-5 w-5" />,
  },
  {
    label: "Server-side",
    value: "First-party measurement",
    icon: <Database className="h-5 w-5" />,
  },
  {
    label: "Looker Studio",
    value: "PPC reporting dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

const problems = [
  {
    title: "You cannot trust which campaigns are producing leads or sales",
    description:
      "Missing, duplicated, or misconfigured conversion events can make Google Ads bidding and reporting unreliable.",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "GA4, GTM, Google Ads, and Meta do not tell the same story",
    description:
      "Different event names, tag triggers, attribution settings, consent behavior, and server-side paths can create confusing data gaps.",
    icon: <LineChart className="h-5 w-5" />,
  },
  {
    title: "Tracking was installed, but nobody has validated the full path",
    description:
      "A tag firing in GTM is not always enough. Conversion action status, event parameters, deduplication, and destination reporting need review.",
    icon: <SearchCheck className="h-5 w-5" />,
  },
];

const process = [
  {
    number: "01",
    title: "Review public evidence first",
    description:
      "The first review checks browser-visible tags, network requests, events, pixels, forms, and conversion flows without asking for login access upfront.",
  },
  {
    number: "02",
    title: "Map the tracking gaps",
    description:
      "I identify where Google Ads, GA4, GTM, Meta CAPI, enhanced conversions, or server-side measurement may be losing or duplicating signals.",
  },
  {
    number: "03",
    title: "Prioritize what to fix",
    description:
      "You get a clear tracking-first priority list: what matters now, what can wait, and which account access is needed for final confirmation.",
  },
  {
    number: "04",
    title: "Validate after implementation",
    description:
      "Fixes are checked across GTM Preview, GA4 DebugView, Google Ads conversion actions, Meta Events Manager, CRM, or server logs where available.",
  },
];

const faqs = [
  {
    question: "Which tracking service should I start with?",
    answer:
      "If you are not sure what is broken, start with the free tracking review. It checks public browser-visible evidence first and helps decide whether you need Google Ads conversion tracking, GA4/GTM audit, Meta CAPI, Looker Studio dashboard, or server-side tracking support.",
  },
  {
    question: "Do you need access to my accounts before the first review?",
    answer:
      "No. The first review can start with public browser-visible evidence. Final confirmation may require GA4, GTM, Google Ads, Meta, CRM, or server-side log access.",
  },
  {
    question: "Can you fix Google Ads and Meta tracking together?",
    answer:
      "Yes. TrackFlow Pro focuses on conversion measurement across Google Ads, GA4, GTM, Meta Pixel, Meta Conversions API, enhanced conversions, and server-side tracking paths.",
  },
  {
    question: "Is this a general PPC agency service?",
    answer:
      "No. This is tracking-first specialist support. The focus is conversion tracking, attribution, GA4/GTM validation, Meta CAPI, server-side measurement, and data quality before scaling ad spend.",
  },
];

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
        "Looker Studio dashboards",
        "PPC reporting dashboards",
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
      "@id": "https://trackflowpro.com/services#webpage",
      url: "https://trackflowpro.com/services",
      name: "Tracking Services Overview | TrackFlow Pro",
      description:
        "Tracking services for Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, and server-side tracking.",
      isPartOf: { "@id": "https://trackflowpro.com/#website" },
      about: { "@id": "https://trackflowpro.com/services#service" },
      mainEntity: { "@id": "https://trackflowpro.com/services#service-list" },
    },
    {
      "@type": "ItemList",
      "@id": "https://trackflowpro.com/services#service-list",
      name: "TrackFlow Pro tracking services",
      itemListElement: coreServices.map((service, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: service.title,
        url: `https://trackflowpro.com${service.href}`,
      })),
    },
    {
      "@type": "Service",
      "@id": "https://trackflowpro.com/services#service",
      name: "TrackFlow Pro tracking services",
      alternateName: [
        "Google Ads conversion tracking specialist",
        "GA4 and Google Tag Manager audit specialist",
        "Server-side tracking specialist",
        "Meta CAPI setup specialist",
        "Looker Studio dashboard specialist",
      ],
      serviceType:
        "Google Ads conversion tracking, GA4 and GTM audit, Meta Conversions API, Looker Studio dashboards, and server-side tracking services",
      provider: { "@id": "https://trackflowpro.com/#organization" },
      areaServed: "Worldwide",
      url: "https://trackflowpro.com/services",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "TrackFlow Pro service pages",
        itemListElement: coreServices.map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: service.title,
            url: `https://trackflowpro.com${service.href}`,
          },
        })),
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://trackflowpro.com/services#breadcrumb",
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
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://trackflowpro.com/services#faq",
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

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <HeroSection />
        <SignalStrip />
        <ProblemsSection />
        <ServicesGridSection />
        <ProcessSection />
        <AuditRouteSection />
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
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <Layers className="h-4 w-4" /> Tracking services overview
          </div>

          <h1 className="max-w-5xl text-[2.05rem] font-black leading-[1.04] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl sm:leading-[1.02] sm:tracking-[-0.05em] md:text-6xl lg:text-7xl lg:leading-[0.98] lg:tracking-[-0.055em]">
            Tracking services for cleaner <span className="text-blue-600 dark:text-blue-400">conversion data</span> and better ad decisions.
          </h1>

          <p className="mt-7 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
            TrackFlow Pro helps businesses diagnose and improve Google Ads conversion tracking, GA4/GTM events, Meta CAPI, Looker Studio dashboards, enhanced conversions, and server-side tracking so paid traffic decisions are based on cleaner measurement.
          </p>

          <div className="mt-7 flex sm:mt-9 flex-col gap-3 sm:flex-row">
            <Link
              href="/free-tracking-audit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 sm:w-auto px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              Request Free Tracking Review
              <ArrowRight className="h-4 w-4" />
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
              "Public browser-visible evidence first",
              "GA4, GTM, Google Ads, Meta, Looker Studio & server-side",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <ServiceOverviewCard />
      </div>
    </section>
  );
}

function ServiceOverviewCard() {
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,36rem)] min-w-0">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-600/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Measurement stack</p>
          <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Tracking Service Map</h2>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          {coreServices.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-blue-900/70 dark:hover:bg-blue-950/25"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                  {service.icon}
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-950 dark:text-white">{service.title}</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-400">{service.eyebrow}</span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignalStrip() {
  return (
    <section className="border-y border-slate-200 bg-white px-4 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {signals.map((signal) => (
          <div key={signal.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-blue-300">
              {signal.icon}
            </div>
            <div className="text-sm font-black text-slate-950 dark:text-white">{signal.label}</div>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">{signal.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProblemsSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader
          eyebrow="Why tracking services matter"
          title="When tracking is unclear, paid traffic decisions become risky."
          description="Most campaign problems are harder to diagnose when conversion data is incomplete, duplicated, delayed, or split across too many tools."
        />
        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 lg:grid-cols-3">
          {problems.map((problem) => (
            <div key={problem.title} className="max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/70">
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

function ServicesGridSection() {
  return (
    <section className="bg-slate-50 px-4 py-14 sm:py-16 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader
          eyebrow="Core tracking services"
          title="Choose the measurement problem you need to solve first."
          description="Each service is designed to connect evidence, diagnosis, implementation, and validation so your tracking setup becomes easier to trust."
        />
        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 lg:grid-cols-2">
          {coreServices.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group min-w-0 max-w-full rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-blue-900/70"
            >
              <div className="flex flex-col gap-5 sm:flex-row">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/40 dark:text-blue-300">
                  {service.icon}
                </span>
                <span>
                  <span className="mb-2 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                    {service.eyebrow}
                  </span>
                  <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{service.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">{service.description}</p>
                  <span className="mt-5 grid gap-3 sm:grid-cols-2">
                    {service.bestFor.map((item) => (
                      <span key={item} className="flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {item}
                      </span>
                    ))}
                  </span>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-300">
                    {service.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader
          eyebrow="Evidence → diagnosis → validation"
          title="A tracking-first process across every service."
          description="The service changes depending on the problem, but the method stays the same: review evidence, identify risk, prioritize fixes, and validate the result."
          dark
        />
        <div className="mt-8 grid sm:mt-10 lg:mt-12 gap-6 lg:grid-cols-4">
          {process.map((step) => (
            <div key={step.number} className="max-w-full rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-5 text-4xl font-black tracking-[-0.05em] text-blue-400 sm:text-5xl sm:tracking-[-0.06em]">{step.number}</div>
              <h3 className="text-lg font-black text-white">{step.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuditRouteSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-12 rounded-[2.5rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-950 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
        <div className="max-w-full rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Gauge className="h-7 w-7" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Not sure where to start?</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">Start with a free tracking review.</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
            If you do not know whether the problem is Google Ads, GA4, GTM, Meta CAPI, or server-side tracking, the free review helps identify the most important next step.
          </p>
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <p className="text-sm font-black text-slate-950 dark:text-white">No login required for the first review.</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              I review public browser-visible tracking evidence first. Final confirmation may require account or server access.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-2 lg:p-6">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">Recommended route</p>
          <h3 className="text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
            Audit first, then fix the highest-impact tracking gap.
          </h3>
          <p className="mt-6 text-[15px] font-medium leading-7 text-slate-600 sm:text-base sm:leading-8 dark:text-slate-400">
            The best service depends on the evidence. A Google Ads conversion tracking issue may come from GTM triggers, GA4 key events, consent behavior, Meta CAPI duplication, or missing server-side validation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/free-tracking-audit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 sm:w-auto px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500">
              Request Free Tracking Review
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border sm:w-auto border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/40">
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
    <section className="bg-slate-50 px-4 py-14 sm:py-16 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-4xl">
        <SectionHeader
          eyebrow="Services FAQ"
          title="Questions before choosing a tracking service."
          description="Start with the tracking problem you can see. The audit process helps uncover where the real issue sits."
          centered
        />
        <div className="mt-8 space-y sm:mt-10 lg:mt-12-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="max-w-full rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-950/70">
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
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">Tracking-first measurement support</p>
            <h2 className="max-w-3xl text-[2rem] font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl sm:leading-[1] sm:tracking-[-0.05em]">Find the service that matches your tracking problem.</h2>
            <p className="mt-5 max-w-2xl text-[15px] font-medium leading-7 text-slate-400 sm:text-base sm:leading-8">
              Start with a free review if you are not sure whether the issue is Google Ads, GA4, GTM, Meta CAPI, enhanced conversions, or server-side tracking.
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

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
