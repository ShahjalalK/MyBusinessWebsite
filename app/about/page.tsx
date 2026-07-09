import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Database,
  ExternalLink,
  Eye,
  FileSearch,
  LockKeyhole,
  MousePointerClick,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About TrackFlow Pro | Google Ads Conversion Tracking Specialist",
  description:
    "Learn about TrackFlow Pro, a tracking-first specialist focused on Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, and server-side measurement.",
  alternates: {
    canonical: "https://trackflowpro.com/about",
  },
  openGraph: {
    title: "About TrackFlow Pro | Tracking & Attribution Specialist",
    description:
      "TrackFlow Pro helps businesses validate Google Ads conversion tracking, GA4/GTM events, Meta CAPI, enhanced conversions, and server-side tracking with evidence-first audits.",
    url: "https://trackflowpro.com/about",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "https://trackflowpro.com/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "About TrackFlow Pro - Google Ads conversion tracking and server-side measurement specialist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About TrackFlow Pro | Google Ads Conversion Tracking Specialist",
    description:
      "Tracking-first support for Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, and server-side measurement.",
    images: ["/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
};

const coreSystems = [
  {
    title: "Google Ads Conversion Tracking",
    description:
      "Review conversion actions, form leads, call tracking, ecommerce events, enhanced conversions, and attribution gaps before you scale spend.",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "GA4 & Google Tag Manager",
    description:
      "Audit GA4 key events, GTM tags, triggers, data layer behavior, consent behavior, and event quality across important pages.",
    icon: <FileSearch className="h-5 w-5" />,
  },
  {
    title: "Server-Side Tracking",
    description:
      "Evaluate first-party measurement, GTM server-side signals, event routing, deduplication risks, and validation requirements.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Meta CAPI & Pixel Signals",
    description:
      "Review Meta Pixel, Conversions API, event match quality, browser-side signal loss, and server event consistency.",
    icon: <Zap className="h-5 w-5" />,
  },
];

const trustPrinciples = [
  {
    title: "Evidence before assumptions",
    description:
      "The first review starts with browser-visible tracking evidence, not guesswork or generic marketing advice.",
    icon: <SearchCheck className="h-5 w-5" />,
  },
  {
    title: "No login required first",
    description:
      "You do not need to share GA4, GTM, Google Ads, Meta, CRM, or server access before the initial review.",
    icon: <LockKeyhole className="h-5 w-5" />,
  },
  {
    title: "Clear validation boundary",
    description:
      "Public evidence can show likely tracking issues. Final confirmation happens only after approved account or server-level access.",
    icon: <Eye className="h-5 w-5" />,
  },
  {
    title: "Tracking-first recommendations",
    description:
      "The focus stays on conversion tracking, analytics accuracy, event quality, attribution, and measurement reliability.",
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

const workflow = [
  {
    step: "01",
    title: "Review public tracking evidence",
    description:
      "I check tags, pixels, network requests, conversion events, page flows, forms, and visible tracking behavior.",
  },
  {
    step: "02",
    title: "Identify measurement gaps",
    description:
      "The review maps likely issues across Google Ads, GA4, GTM, Meta CAPI, enhanced conversions, and server-side tracking.",
  },
  {
    step: "03",
    title: "Prioritize the fix plan",
    description:
      "You get a practical priority list: what looks broken, why it matters, and what should be checked or fixed first.",
  },
  {
    step: "04",
    title: "Validate after access is approved",
    description:
      "When needed, final validation happens inside GA4, GTM, Google Ads, Meta, CRM, or server-side logs.",
  },
];

const proofCards = [
  "Tracking-first Google Ads audit workflow",
  "GA4 and GTM event validation",
  "Enhanced conversions review",
  "Server-side tracking signal review",
  "Meta CAPI and Pixel signal checks",
  "Clear reporting for technical and non-technical teams",
];

const importantPages = [
  {
    title: "Google Ads Conversion Tracking",
    href: "/services/google-ads-conversion-tracking",
    description:
      "Fix Google Ads conversion actions, GTM tags, enhanced conversions, form tracking, call tracking, and ecommerce events.",
  },
  {
    title: "Server-Side Tracking",
    href: "/services/server-side-tracking",
    description:
      "Build stronger first-party measurement with GTM server-side tagging, event routing, and validation.",
  },
  {
    title: "GA4 & GTM Audit",
    href: "/services/ga4-gtm-audit",
    description:
      "Audit GA4 events, GTM tags, triggers, data layer behavior, consent behavior, and conversion gaps.",
  },
  {
    title: "Meta CAPI Setup",
    href: "/services/meta-capi",
    description:
      "Improve Meta Pixel and Conversions API event quality, deduplication, and server-side signals.",
  },
  {
    title: "Free Tracking Audit",
    href: "/free-tracking-audit",
    description:
      "Request a free tracking review before scaling Google Ads, Meta Ads, or other paid traffic.",
  },
  {
    title: "Contact TrackFlow Pro",
    href: "/contact",
    description:
      "Contact TrackFlow Pro directly for tracking, attribution, GA4, GTM, and conversion measurement help.",
  },
];

const faqs = [
  {
    question: "Is TrackFlow Pro a general Google Ads agency?",
    answer:
      "No. TrackFlow Pro is positioned as a tracking and attribution specialist. The focus is Google Ads conversion tracking, GA4/GTM audits, enhanced conversions, Meta CAPI, and server-side measurement quality.",
  },
  {
    question: "Do you need login access for the first review?",
    answer:
      "No. The first tracking review can start with public browser-visible evidence. Final confirmation may require approved access to GA4, GTM, Google Ads, Meta, CRM, or server-side logs.",
  },
  {
    question: "What kind of businesses is this for?",
    answer:
      "This is useful for lead generation, ecommerce, SaaS, local services, professional services, and any business that runs paid traffic but cannot fully trust its conversion data.",
  },
  {
    question: "Can you help if Google Ads conversions are not tracking?",
    answer:
      "Yes. The review can cover Google Ads conversion actions, GTM tags, GA4 key events, enhanced conversions, form and call tracking, ecommerce events, and server-side conversion paths.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About TrackFlow Pro",
    url: "https://trackflowpro.com/about",
    description:
      "About TrackFlow Pro, a tracking-first specialist focused on Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, and server-side measurement.",
  
   isPartOf: {
  "@type": "WebSite",
  name: "TrackFlow Pro",
  alternateName: ["TrackFlowPro", "Track Flow Pro"],
  url: "https://trackflowpro.com",
},
    about: {
  "@type": "ProfessionalService",
  name: "TrackFlow Pro",
  alternateName: ["TrackFlowPro", "Track Flow Pro"],
  url: "https://trackflowpro.com",
  }  
  },
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Shahjalal Khan",
    jobTitle: "Founder & Tracking Specialist",
    url: "https://trackflowpro.com/about",
    sameAs: ["https://www.linkedin.com/in/shahjalal-khan/"],
    worksFor: {
      "@type": "Organization",
      name: "TrackFlow Pro",
      url: "https://trackflowpro.com",
    },
    knowsAbout: [
      "Google Ads conversion tracking",
      "Google Analytics 4",
      "Google Tag Manager",
      "Meta Conversions API",
      "Server-side tracking",
      "Enhanced conversions",
    ],
  },
  {
    "@context": "https://schema.org",
  "@type": "Organization",
  name: "TrackFlow Pro",
  alternateName: ["TrackFlowPro", "Track Flow Pro"],
  url: "https://trackflowpro.com",
    logo: "https://trackflowpro.com/android-chrome-512x512.png",
    sameAs: ["https://www.linkedin.com/in/shahjalal-khan/"],
    description:
      "TrackFlow Pro helps businesses review and improve Google Ads conversion tracking, GA4/GTM events, Meta CAPI, enhanced conversions, and server-side measurement.",
  },
  {
    "@context": "https://schema.org",
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
        name: "About",
        item: "https://trackflowpro.com/about",
      },
    ],
  },
  {
    "@context": "https://schema.org",
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
];

export default function AboutPage() {
  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}

      <Navbar />
      <main className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <HeroSection />
        <PositioningSection />
        <FounderSection />
        <TrustPrinciplesSection />
        <SystemsSection />
        <WorkflowSection />
        <ProofSection />
        <ExploreTrackFlowSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.13),transparent_36%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 py-20 dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent_36%),linear-gradient(to_bottom,#020617,#0f172a)] sm:px-6 lg:px-8 lg:py-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <BadgeCheck className="h-4 w-4" />
            About TrackFlow Pro
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl">
            About TrackFlow Pro: built for businesses that need to trust their{" "}
            <span className="text-blue-600 dark:text-blue-400">conversion tracking</span> before scaling ads.
          </h1>

          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-slate-300">
            TrackFlow Pro is a tracking-first specialist brand focused on Google Ads conversion tracking, GA4/GTM audits,
            Meta CAPI, enhanced conversions, and server-side measurement quality.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/free-tracking-audit"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              Request Free Tracking Review
              <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
            >
              Contact Specialist
            </Link>
          </div>

          <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {["Tracking-first focus", "No login required first", "Evidence-based review"].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <AboutSignalCard />
      </div>
    </section>
  );
}

function AboutSignalCard() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-600/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/50">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            Tracking specialist profile
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
            TrackFlow Pro Focus
          </h2>
        </div>

        <div className="space-y-4 p-6">
          {[
            { label: "Google Ads", value: "Conversion tracking", icon: <Target className="h-5 w-5" /> },
            { label: "GA4 & GTM", value: "Event validation", icon: <FileSearch className="h-5 w-5" /> },
            { label: "Meta CAPI", value: "Server event quality", icon: <MousePointerClick className="h-5 w-5" /> },
            { label: "Server-Side", value: "First-party measurement", icon: <Database className="h-5 w-5" /> },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                  {item.icon}
                </span>
                <div>
                  <p className="text-base font-black text-slate-950 dark:text-white">{item.label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">{item.value}</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                Focused
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PositioningSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeader
          eyebrow="Not a generic ads agency"
          title="TrackFlow Pro is built around tracking accuracy, attribution clarity, and measurement confidence."
          description="When conversion data is unreliable, campaign decisions become harder. TrackFlow Pro focuses on the measurement layer that supports Google Ads, GA4, GTM, Meta CAPI, enhanced conversions, and server-side tracking."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            "Conversion tracking before campaign scaling",
            "Evidence-based Google Ads audit approach",
            "GA4 and Google Tag Manager validation",
            "Server-side and first-party measurement review",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm font-black leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
            >
              <CheckCircle2 className="mb-4 h-5 w-5 text-emerald-500" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderSection() {
  return (
   <section className="bg-slate-50 px-4 py-20 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
  <div className="mx-auto grid max-w-7xl gap-10 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-950 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 dark:border-slate-800 dark:from-blue-950/25 dark:via-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative">
        <div className="mx-auto max-w-sm">
          <div className="relative mx-auto h-52 w-52 overflow-hidden rounded-[2.25rem] border border-white bg-white shadow-2xl shadow-blue-950/10 ring-8 ring-white/70 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-900/70 sm:h-60 sm:w-60">
            <Image
              src="/team/shahjalal-khan-founder-trackflow-pro.webp"
              alt="Shahjalal Khan, Founder and Tracking Specialist at TrackFlow Pro"
              fill
              sizes="(max-width: 640px) 208px, 240px"
              className="object-contain object-bottom"
              priority
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
              Founder & Tracking Specialist
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">
              Shahjalal Khan
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
              Focused on Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, and server-side measurement.
            </p>

            <a
              href="https://www.linkedin.com/in/shahjalal-khan/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
            >
              View LinkedIn Profile
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            "Tracking-first audits",
            "Public evidence first",
            "GA4 & GTM validation",
            "Server-side measurement",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm font-black text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="flex flex-col justify-center p-2 lg:p-6">
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
        Why this approach exists
      </p>

      <h3 className="max-w-3xl text-4xl font-black tracking-[-0.055em] text-slate-950 dark:text-white sm:text-5xl">
        Better ad decisions start with cleaner conversion data.
      </h3>

      <div className="mt-6 space-y-4 text-base font-medium leading-8 text-slate-600 dark:text-slate-400">
        <p>
          Many paid traffic problems are not only campaign problems. Sometimes the real issue is missing conversions,
          duplicate events, weak event quality, GA4 and Google Ads mismatch, Meta Pixel signal loss, or server-side
          tracking that has not been properly validated.
        </p>

        <p>
          TrackFlow Pro exists to help businesses understand what is actually happening with their tracking setup before
          they make bigger budget, bidding, reporting, or attribution decisions.
        </p>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/60 dark:bg-blue-950/25">
        <p className="text-sm font-black text-slate-950 dark:text-white">
          No login required for the first review.
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
          The first review starts with public browser-visible evidence. Final confirmation may require GA4, GTM,
          Google Ads, Meta, CRM, or server-side log access.
        </p>
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

function TrustPrinciplesSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Trust-first principles"
          title="The first review is designed to build confidence before asking for account access."
          description="This is especially important for visitors coming from cold email, audit notes, or a tracking report link."
          centered
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {trustPrinciples.map((item) => (
            <div
              key={item.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-900/70"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
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

function SystemsSection() {
  return (
    <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Systems reviewed"
          title="Focused support for the tracking systems that affect paid performance."
          description="The goal is not to make a generic marketing checklist. The goal is to identify the tracking issues that can change reporting, bidding, optimization, and lead quality decisions."
          dark
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {coreSystems.map((item) => (
            <div key={item.title} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                {item.icon}
              </div>
              <h3 className="text-xl font-black tracking-[-0.03em] text-white">{item.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="How the review works"
          title="A clear process for moving from tracking uncertainty to a validated fix plan."
          description="The workflow is simple enough for business owners, but detailed enough for teams that need to validate GA4, GTM, Google Ads, Meta, CRM, or server-side logs."
          centered
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {workflow.map((item) => (
            <div
              key={item.step}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="mb-8 text-5xl font-black tracking-[-0.06em] text-blue-600 dark:text-blue-400">
                {item.step}
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">{item.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section className="bg-slate-50 px-4 py-20 dark:bg-slate-900/25 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <SectionHeader
            eyebrow="What builds trust"
            title="Clear communication for both technical teams and business owners."
            description="Tracking issues can become confusing quickly. TrackFlow Pro keeps the language practical: what was found, what it means, why it matters, and what should happen next."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/free-tracking-audit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Request Free Tracking Review
              <ArrowRight className="h-4 w-4 text-white" />
            </Link>
            <Link
              href="/services/google-ads-conversion-tracking"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
            >
              View Conversion Tracking Service
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {proofCards.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-black leading-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <Sparkles className="mb-4 h-5 w-5 text-blue-600 dark:text-blue-300" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExploreTrackFlowSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Explore TrackFlow Pro"
          title="Important pages for tracking, attribution, GA4, GTM, Meta CAPI, and server-side measurement."
          description="These pages help visitors and search engines understand the core TrackFlow Pro services and contact paths."
          centered
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {importantPages.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-900/70 dark:hover:bg-blue-950/25 sm:rounded-[2rem] sm:p-6"
            >
              <h3 className="text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                {item.title}
              </h3>

              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                {item.description}
              </p>

              <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-300">
                Open page
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
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
          title="Questions about TrackFlow Pro."
          description="A clear overview for businesses that want tracking confidence before scaling paid traffic."
          centered
        />

        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
            >
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
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
              Ready to check your tracking?
            </p>
            <h2 className="max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">
              Get a focused review before you make bigger ad decisions.
            </h2>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-400">
              Start with public browser-visible evidence. Final validation only happens after access is approved.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/free-tracking-audit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Request Free Tracking Review
              <ArrowRight className="h-4 w-4 text-white" />
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
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
        {eyebrow}
      </p>
      <h2 className={cn("text-4xl font-black tracking-[-0.05em] sm:text-5xl", dark ? "text-white" : "text-slate-950 dark:text-white")}>
        {title}
      </h2>
      <p className={cn("mt-5 text-base font-medium leading-8", dark ? "text-slate-400" : "text-slate-600 dark:text-slate-400")}>
        {description}
      </p>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
