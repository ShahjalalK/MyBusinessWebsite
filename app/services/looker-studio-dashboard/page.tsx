import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Gauge,
  LineChart,
  SearchCheck,
  Target,
} from "lucide-react";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

const pageUrl = "https://trackflowpro.com/services/looker-studio-dashboard";

export const metadata: Metadata = {
  title: "Looker Studio Dashboard for Google Ads, GA4 & Meta Reporting | TrackFlow Pro",
  description:
    "TrackFlow Pro builds Looker Studio dashboards for Google Ads, GA4, Meta Ads, leads, revenue, and conversion tracking reports so businesses can monitor performance and tracking quality in one place.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Looker Studio Dashboard for Google Ads, GA4 & Meta Reporting | TrackFlow Pro",
    description:
      "Clean PPC and analytics dashboards for Google Ads, GA4, Meta Ads, leads, revenue, conversion tracking, and tracking health reporting.",
    url: pageUrl,
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro - Looker Studio Dashboard and PPC Reporting Specialist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Looker Studio Dashboard for Google Ads, GA4 & Meta Reporting | TrackFlow Pro",
    description:
      "Build cleaner Google Ads, GA4, Meta Ads, lead, revenue, and conversion tracking dashboards in Looker Studio.",
    images: ["https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
};

const dashboardTypes = [
  {
    title: "Google Ads performance dashboard",
    description:
      "Monitor spend, clicks, conversions, cost per conversion, conversion value, ROAS, campaigns, ad groups, keywords, and landing page performance.",
    icon: <Target className="h-6 w-6" />,
  },
  {
    title: "GA4 analytics dashboard",
    description:
      "Turn GA4 events, key events, traffic sources, landing pages, audiences, and ecommerce data into a cleaner executive reporting view.",
    icon: <LineChart className="h-6 w-6" />,
  },
  {
    title: "Meta Ads reporting dashboard",
    description:
      "Create a practical Meta Ads reporting view for spend, leads, purchases, CPA, ROAS, event quality notes, and campaign comparison.",
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    title: "Tracking health dashboard",
    description:
      "Summarize conversion tracking status, key event coverage, lead flow, source quality, and measurement issues that need attention.",
    icon: <Gauge className="h-6 w-6" />,
  },
];

const problems = [
  {
    title: "Your data is spread across too many platforms",
    description:
      "Google Ads, GA4, Meta Ads, CRM exports, forms, ecommerce data, and spreadsheets can make simple reporting slow and confusing.",
  },
  {
    title: "The client cannot quickly see what is working",
    description:
      "A clean Looker Studio dashboard helps show performance, leads, revenue, campaign quality, and tracking confidence without opening every ad platform.",
  },
  {
    title: "Reporting looks nice but tracking is not validated",
    description:
      "A dashboard is only useful when the underlying conversion events, source data, filters, and calculated metrics are checked before reporting.",
  },
];

const dashboardFeatures = [
  "Google Ads spend, clicks, conversions, CPA, conversion value, and ROAS",
  "GA4 traffic sources, events, key events, landing pages, and ecommerce metrics",
  "Meta Ads campaign, ad set, lead, purchase, CPA, and ROAS reporting views",
  "Lead generation dashboard for forms, calls, booked appointments, and source quality",
  "Executive summary cards for quick weekly or monthly performance review",
  "Campaign and channel comparison tables with filters and date controls",
  "Tracking health notes for missing events, mismatch risk, and validation gaps",
  "Clean design layout for clients, founders, agencies, and internal teams",
];

const dataSources = [
  "Google Ads",
  "Google Analytics 4",
  "Meta Ads",
  "Google Sheets",
  "CRM exports",
  "Ecommerce data",
  "Lead forms",
  "BigQuery if available",
];

const process = [
  {
    number: "01",
    title: "KPI and data source review",
    description:
      "I identify what the dashboard should answer: ad spend, leads, revenue, CPA, ROAS, tracking quality, channel performance, or client reporting.",
  },
  {
    number: "02",
    title: "Tracking and source validation",
    description:
      "Before building the dashboard, I review whether the core conversion data from Google Ads, GA4, Meta, forms, or sheets looks usable.",
  },
  {
    number: "03",
    title: "Dashboard design and build",
    description:
      "The Looker Studio dashboard is built with clean sections, filters, scorecards, tables, charts, and practical reporting views.",
  },
  {
    number: "04",
    title: "Review, refine, and handover",
    description:
      "The final dashboard is reviewed for accuracy, readability, client usability, and clear next-step notes for future tracking improvements.",
  },
];

const faqs = [
  {
    question: "Can you build a Looker Studio dashboard for Google Ads and GA4?",
    answer:
      "Yes. TrackFlow Pro can build Looker Studio dashboards for Google Ads, GA4, Meta Ads, leads, revenue, campaign performance, and tracking health reporting.",
  },
  {
    question: "Do you check the tracking before building the dashboard?",
    answer:
      "Yes. A dashboard can look good but still report bad data. The dashboard process can include a tracking-first review of Google Ads conversions, GA4 events, GTM behavior, Meta signals, and source data quality.",
  },
  {
    question: "Can this dashboard be used for client reporting?",
    answer:
      "Yes. The dashboard can be designed for agencies, founders, marketing teams, or clients who need a cleaner view of paid traffic performance, leads, revenue, CPA, ROAS, and conversion quality.",
  },
  {
    question: "Which data sources can be used?",
    answer:
      "Common sources include Google Ads, GA4, Meta Ads, Google Sheets, CRM exports, ecommerce data, lead forms, and BigQuery when available.",
  },
];

const signalRows = [
  { label: "Google Ads", value: "Spend, conversions, CPA, ROAS", tone: "blue" },
  { label: "GA4", value: "Events, sources, landing pages", tone: "emerald" },
  { label: "Meta Ads", value: "Leads, purchases, campaign view", tone: "purple" },
  { label: "Tracking health", value: "Event and mismatch notes", tone: "amber" },
];

export default function LookerStudioDashboardPage() {
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
          "Looker Studio dashboards",
          "PPC reporting dashboards",
          "Google Ads reporting",
          "GA4 dashboards",
          "Meta Ads reporting",
          "Google Ads conversion tracking",
          "Google Tag Manager audit",
          "Server-side tracking",
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
        "@id": `${pageUrl}#webpage`,
        name: "Looker Studio Dashboard for Google Ads, GA4 & Meta Reporting | TrackFlow Pro",
        url: pageUrl,
        description:
          "Looker Studio dashboard service for Google Ads, GA4, Meta Ads, leads, revenue, conversion tracking, and tracking health reporting.",
        isPartOf: { "@id": "https://trackflowpro.com/#website" },
        about: { "@id": `${pageUrl}#service` },
      },
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: "Looker Studio Dashboard for Google Ads, GA4 & Meta Reporting",
        alternateName: [
          "Looker Studio dashboard specialist",
          "Google Ads dashboard service",
          "GA4 dashboard service",
          "PPC reporting dashboard",
          "Marketing analytics dashboard",
        ],
        provider: { "@id": "https://trackflowpro.com/#organization" },
        areaServed: "Worldwide",
        serviceType:
          "Looker Studio dashboards, Google Ads reporting, GA4 dashboards, Meta Ads reporting, PPC reporting dashboards, marketing analytics dashboard build",
        url: pageUrl,
        description:
          "Clean Looker Studio dashboard build for Google Ads, GA4, Meta Ads, leads, revenue, conversion tracking, and tracking health reporting.",
        offers: {
          "@type": "Offer",
          url: "https://trackflowpro.com/free-tracking-audit",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
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
            name: "Looker Studio Dashboard",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <HeroSection />
        <DataSourceStrip />
        <RelatedServiceRail active="Looker Studio Dashboard" />
        <ProblemsSection />
        <DashboardTypesSection />
        <FeaturesSection />
        <ProcessSection />
        <FaqSection />
        <FinalCtaSection />
        <MobileStickyCta primaryLabel="Plan dashboard" />
      </main>
      <Footer />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.14),transparent_34%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 pb-14 pt-24 dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent_34%),linear-gradient(to_bottom,#020617,#0f172a)] sm:px-6 sm:py-20 lg:px-8 lg:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <BarChart3 className="h-4 w-4" /> Looker Studio dashboard service
          </div>

          <h1 className="max-w-5xl text-[2.15rem] font-black leading-[1.02] tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl sm:leading-[1.01] md:text-6xl lg:text-7xl lg:leading-[0.98]">
            Looker Studio dashboards for <span className="text-blue-600 dark:text-blue-400">Google Ads, GA4 & Meta reporting.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-600 dark:text-slate-300 sm:mt-7 sm:text-lg sm:leading-8">
            TrackFlow Pro builds clean PPC and analytics dashboards that connect Google Ads, GA4, Meta Ads, leads, revenue, and conversion tracking health into one practical reporting view.
          </p>

          <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-slate-500 dark:text-slate-400 sm:leading-7">
            Best for businesses and agencies that need client-ready reporting without hiding tracking problems behind pretty charts.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/free-tracking-audit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/25 sm:w-auto"
            >
              Request Free Tracking Review
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30 sm:w-auto"
            >
              Discuss Dashboard Build
            </Link>
          </div>

          <div className="mt-7 grid max-w-2xl gap-3 sm:mt-8 sm:grid-cols-3">
            {[
              "Google Ads + GA4 dashboard",
              "Meta Ads reporting view",
              "Tracking health notes included",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <DashboardPreviewCard />
      </div>
    </section>
  );
}

function DashboardPreviewCard() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-600/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem]">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/50 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Dashboard preview</p>
              <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">PPC Reporting Command Center</h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              Client-ready
            </span>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Spend", "$12.4k"],
              ["Leads", "318"],
              ["CPA", "$39.12"],
              ["ROAS", "4.7x"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-black text-slate-950 dark:text-white">Channel performance</p>
              <p className="text-xs font-black text-blue-600 dark:text-blue-300">Last 30 days</p>
            </div>
            <div className="space-y-3">
              {[
                ["Google Ads", "76%", "bg-blue-500"],
                ["Meta Ads", "58%", "bg-indigo-500"],
                ["Organic", "42%", "bg-emerald-500"],
              ].map(([label, width, color]) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>{label}</span>
                    <span>{width}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${color}`} style={{ width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {signalRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/40">
                <span>
                  <span className="block text-sm font-black text-slate-950 dark:text-white">{row.label}</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-400">{row.value}</span>
                </span>
                <span className={badgeClass(row.tone)}>Mapped</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSourceStrip() {
  return (
    <section className="border-y border-slate-200 bg-white px-4 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Common dashboard data sources</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dataSources.map((source) => (
            <div key={source} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200">
              {source}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemsSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Why dashboard reporting matters"
          title="A dashboard should make performance clearer, not just prettier."
          description="Looker Studio is most useful when the dashboard design, data source logic, conversion tracking, and client reporting goals are aligned."
        />
        <div className="mt-8 grid gap-5 sm:mt-10 lg:grid-cols-3">
          {problems.map((problem) => (
            <div key={problem.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/50 sm:rounded-[2rem] sm:p-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                <SearchCheck className="h-5 w-5" />
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

function DashboardTypesSection() {
  return (
    <section className="bg-slate-50 px-4 py-14 dark:bg-slate-900/25 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Dashboard build options"
          title="Looker Studio dashboards built around paid traffic and tracking quality."
          description="The dashboard can be designed for internal review, client reporting, agency reporting, lead generation, ecommerce, or tracking-health visibility."
        />
        <div className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-2 lg:grid-cols-4">
          {dashboardTypes.map((item) => (
            <div key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-950/70 sm:rounded-[2rem] sm:p-6">
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

function FeaturesSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <SectionHeader
            eyebrow="What can be included"
            title="A dashboard that connects reporting with measurement reality."
            description="The goal is to help clients see performance and understand whether conversion data is reliable enough for decision-making."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/free-tracking-audit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              Start with tracking review
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {dashboardFeatures.map((feature) => (
            <div key={feature} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-blue-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              {feature}
            </div>
          ))}
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
          eyebrow="Dashboard process"
          title="From raw data to a clear reporting dashboard."
          description="The process is designed to avoid beautiful but misleading reports by reviewing the data source and tracking context first."
          dark
        />
        <div className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-2 lg:grid-cols-4">
          {process.map((step) => (
            <div key={step.number} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 sm:rounded-[2rem] sm:p-6">
              <div className="mb-5 text-4xl font-black tracking-[-0.06em] text-blue-400 sm:text-5xl">{step.number}</div>
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
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          eyebrow="Looker Studio FAQ"
          title="Questions before building a dashboard."
          description="A few clear answers about Google Ads, GA4, Meta Ads, data sources, and tracking-first dashboard reporting."
          centered
        />
        <div className="mt-8 space-y-4 sm:mt-12">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-[1.25rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50 sm:rounded-[1.5rem] sm:p-6">
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
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/15 dark:border dark:border-slate-800 sm:rounded-[2rem] sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.45fr] lg:items-center">
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">Looker Studio dashboard</p>
            <h2 className="max-w-3xl text-[2rem] font-black leading-[1.03] tracking-[-0.05em] sm:text-5xl sm:leading-[1.02]">
              Build a dashboard that clients can actually understand and trust.
            </h2>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-400">
              Get a clearer reporting view for Google Ads, GA4, Meta Ads, leads, revenue, conversion tracking, and tracking health.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/free-tracking-audit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500">
              Request Free Tracking Review
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

function badgeClass(tone: string) {
  const base = "shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] sm:px-3 sm:text-[10px] sm:tracking-widest";
  if (tone === "amber") return `${base} bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300`;
  if (tone === "purple") return `${base} bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300`;
  if (tone === "emerald") return `${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300`;
  return `${base} bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300`;
}
