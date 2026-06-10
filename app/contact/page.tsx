import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileSearch,
  Mail,
  MessageSquare,
  MousePointerClick,
  PhoneCall,
  SearchCheck,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import ContactForm from "./ContactForm";


const BUSINESS_EMAIL = "shahjalal@trackflowpro.com";
const BUSINESS_WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=%2B8801329532551&text=Hi%20Shahjalal%2C%20I%20need%20help%20with%20conversion%20tracking.&type=phone_number&app_absent=0";
const BUSINESS_WHATSAPP_DISPLAY = "+880 1329-532551";


export const metadata: Metadata = {
  title: "Contact TrackFlow Pro | Google Ads Tracking Specialist",
  description:
    "Contact TrackFlow Pro for Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, server-side tracking support, direct email, or WhatsApp.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact TrackFlow Pro | Google Ads Tracking Specialist",
    description:
      "Talk to a tracking specialist about Google Ads conversion tracking, GA4, GTM, Meta CAPI, enhanced conversions, and server-side measurement.",
    url: "https://trackflowpro.com/contact",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro contact page - Google Ads tracking specialist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact TrackFlow Pro | Google Ads Tracking Specialist",
    description:
      "Need help with Google Ads conversion tracking, GA4/GTM, Meta CAPI, or server-side tracking? Contact TrackFlow Pro.",
    images: ["/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
};

const contactReasons = [
  {
    title: "Google Ads tracking is not reliable",
    description:
      "Get help checking conversion actions, GTM tags, GA4 key events, enhanced conversions, forms, calls, and ecommerce events.",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "GA4, GTM, and Google Ads do not match",
    description:
      "Review event names, triggers, attribution gaps, data layer issues, consent behavior, and reporting mismatches.",
    icon: <FileSearch className="h-5 w-5" />,
  },
  {
    title: "Meta CAPI or server-side tracking needs review",
    description:
      "Validate Meta Pixel, Conversions API, deduplication, event quality, and server-side tracking signals.",
    icon: <Zap className="h-5 w-5" />,
  },
];

const trustPoints = [
  "No login required for the first review",
  "Public browser-visible evidence first",
  "Clear next steps before any implementation",
  "Final confirmation only after approved access",
];

const nextSteps = [
  {
    step: "01",
    title: "Send your tracking issue",
    description:
      "Share your website URL, business type, and the tracking problem you are seeing in Google Ads, GA4, GTM, Meta, or server-side reports.",
  },
  {
    step: "02",
    title: "I review the visible evidence",
    description:
      "The first review checks browser-visible tags, network requests, events, pixels, consent behavior, and conversion paths without requiring account login.",
  },
  {
    step: "03",
    title: "You get a practical direction",
    description:
      "You receive a clear explanation of what looks broken, what needs validation, and what access is required if you want the setup fixed.",
  },
];

const faqs = [
  {
    question: "Do you need my Google Ads, GA4, or GTM login before I contact you?",
    answer:
      "No. The first message only needs your website URL and a short explanation of the issue. Account access is only needed later for final validation or implementation.",
  },
  {
    question: "What kind of businesses should contact TrackFlow Pro?",
    answer:
      "Businesses running paid traffic, lead generation, ecommerce, local service campaigns, SaaS campaigns, or Meta campaigns where conversion data cannot be fully trusted.",
  },
  {
    question: "Can you review an audit report or PDF I received by email?",
    answer:
      "Yes. You can use the contact form to share the website and mention the report. The first step is to separate visible evidence from assumptions.",
  },
  {
    question: "Can I contact directly by email or WhatsApp instead of the form?",
    answer:
      "Yes. You can email or WhatsApp directly if the form feels inconvenient. The form is still recommended when you want to include website URL, service interest, and tracking issue context in one place.",
  },
  {
    question: "Can I book a call directly?",
    answer:
      "Yes. If a booking link is available, you can book a tracking review call. For the best review, send the website URL and issue first so the call is more useful.",
  },
];

const serviceCards = [
  {
    title: "Google Ads Conversion Tracking",
    href: "/services/google-ads-conversion-tracking",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "GA4 & GTM Audit",
    href: "/services/ga4-gtm-audit",
    icon: <FileSearch className="h-5 w-5" />,
  },
  {
    title: "Server-Side Tracking",
    href: "/services/server-side-tracking",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Meta CAPI Setup",
    href: "/services/meta-capi",
    icon: <MousePointerClick className="h-5 w-5" />,
  },
];

export default function ContactPage() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": "https://trackflowpro.com/contact#contactpage",
        url: "https://trackflowpro.com/contact",
        name: "Contact TrackFlow Pro",
        description:
          "Contact TrackFlow Pro for Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, server-side tracking support, direct email, or WhatsApp.",
        isPartOf: {
          "@id": "https://trackflowpro.com/#website",
        },
        about: [
          "Google Ads conversion tracking",
          "GA4 and GTM audit",
          "Meta Conversions API",
          "Server-side tracking",
          "Enhanced conversions",
        ],
      },
      {
        "@type": "Organization",
        "@id": "https://trackflowpro.com/#organization",
        name: "TrackFlow Pro",
        url: "https://trackflowpro.com",
        sameAs: ["https://www.linkedin.com/in/shahjalal-khan/"],
        email: BUSINESS_EMAIL,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: BUSINESS_EMAIL,
          telephone: "+8801329532551",
          areaServed: "Worldwide",
          availableLanguage: ["English", "Bengali"],
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://trackflowpro.com/contact#breadcrumb",
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
            name: "Contact",
            item: "https://trackflowpro.com/contact",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://trackflowpro.com/contact#faq",
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
      <main className="overflow-x-hidden bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <ContactHero calendlyUrl={calendlyUrl} />
        <TrustStrip />
        <ContactMain calendlyUrl={calendlyUrl} />
        <WhyContactSection />
        <NextStepsSection />
        <ServiceIntentSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}

function ContactHero({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_34%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 pb-14 pt-24 dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent_34%),linear-gradient(to_bottom,#020617,#0f172a)] sm:px-6 sm:py-20 lg:px-8 lg:py-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      <div className="mx-auto grid w-full max-w-7xl min-w-0 items-center gap-9 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
        <div className="min-w-0">
          <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 sm:mb-6 sm:px-4 sm:text-[11px] sm:tracking-[0.22em]">
            <MessageSquare className="h-4 w-4" /> Contact a tracking specialist
          </div>

          <h1 className="max-w-4xl text-balance text-[2.15rem] font-black leading-[1.04] tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl sm:leading-[1.02] md:text-6xl lg:text-7xl lg:leading-[0.98]">
            Talk to a Google Ads tracking specialist before you scale spend.
          </h1>

          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-600 dark:text-slate-300 sm:mt-7 sm:text-lg sm:leading-8">
            Use this page to contact TrackFlow Pro about Google Ads conversion tracking,
            GA4/GTM audits, Meta CAPI, enhanced conversions, or server-side tracking issues.
            The first review starts with public browser-visible evidence.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row">
            <a
              href="#contact-form"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white sm:w-auto shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              Send Tracking Issue
              <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-0.5" />
            </a>

            {calendlyUrl ? (
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-950 sm:w-auto shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
              >
                Book a Review Call
              </a>
            ) : (
              <Link
                href="/free-tracking-audit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-950 sm:w-auto shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
              >
                Request Free Tracking Review
              </Link>
            )}
          </div>

          <div className="mt-6 grid max-w-2xl gap-3 sm:mt-8 sm:grid-cols-2">
            {trustPoints.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                <span className="min-w-0">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <ContactProofCard />
      </div>
    </section>
  );
}

function ContactProofCard() {
  return (
    <div className="relative mx-auto w-full max-w-full min-w-0 sm:max-w-xl">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-600/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/50 sm:px-6">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            What to include
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
            Faster Review Checklist
          </h2>
        </div>

        <div className="space-y-3 p-5 sm:space-y-4 sm:p-6">
          {[
            {
              label: "Website URL",
              text: "The page where leads, purchases, calls, or form submissions happen.",
              icon: <SearchCheck className="h-5 w-5" />,
            },
            {
              label: "Tracking issue",
              text: "Example: Google Ads conversions not tracking, duplicate leads, GA4 mismatch.",
              icon: <BarChart3 className="h-5 w-5" />,
            },
            {
              label: "Current tools",
              text: "Mention GA4, GTM, Google Ads, Meta Pixel, Shopify, WooCommerce, or CRM if known.",
              icon: <ShieldCheck className="h-5 w-5" />,
            },
            {
              label: "Goal",
              text: "Tell me if you want an audit, a fix plan, implementation, or validation.",
              icon: <Target className="h-5 w-5" />,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
            >
              <div className="flex gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-slate-950 dark:text-white">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                    {item.text}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {[
          { value: "0 login", label: "First review", note: "Public browser-visible evidence first." },
          { value: "GA4 + GTM", label: "Core systems", note: "Google Ads, Meta CAPI, and server-side paths." },
          { value: "Audit → Fix", label: "Process", note: "Diagnosis, priority plan, implementation, validation." },
          { value: "Specialist", label: "Focus", note: "Tracking and measurement, not generic marketing." },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:p-5"
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

function ContactMain({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <section id="contact-form" className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-10">
        <div className="min-w-0 lg:sticky lg:top-24">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300 sm:mb-4 sm:text-[11px] sm:tracking-[0.24em]">
            Send your tracking issue
          </p>
          <h2 className="text-[2rem] font-black leading-[1.06] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl sm:leading-[1.02]">
            Contact should feel useful before the call starts.
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600 dark:text-slate-400 sm:mt-5 sm:leading-8">
            Share the website, the issue, and the system involved. I use that context to avoid generic advice and focus on what needs to be checked first.
          </p>

          <div className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
            <ContactMiniCard
              icon={<Mail className="h-5 w-5" />}
              title="Best for detailed requests"
              text="Use the form when you want to explain a tracking issue, audit finding, or implementation problem."
            />
            <ContactMiniCard
              icon={<Clock3 className="h-5 w-5" />}
              title="Prefer to talk first?"
              text={
                calendlyUrl
                  ? "Use the booking option after sharing context so the call is focused and practical."
                  : "Submit the form first. A booking option can be added after the initial context is reviewed."
              }
            />
          </div>

          <DirectContactCard />

          {calendlyUrl && (
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500"
            >
              Book a Review Call
              <ArrowRight className="h-4 w-4 text-white" />
            </a>
          )}
        </div>

        <ContactForm />
      </div>
    </section>
  );
}


function DirectContactCard() {
  return (
    <div className="mt-6 max-w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:mt-7 sm:rounded-[2rem]">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
          Prefer direct contact?
        </p>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
          If the form feels inconvenient, email or WhatsApp directly. For the fastest review, include your website URL and the tracking issue.
        </p>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <a
          href={`mailto:${BUSINESS_EMAIL}?subject=Tracking%20Review%20Request`}
          className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-900/70 dark:hover:bg-blue-950/25"
          data-track-event="direct_email_click"
          data-track-location="contact_sidebar"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
              <Mail className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">
                Email
              </span>
              <span className="block truncate">{BUSINESS_EMAIL}</span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-blue-600 transition-transform group-hover:translate-x-0.5 dark:text-blue-300" />
        </a>

        <a
          href={BUSINESS_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-emerald-900/70 dark:hover:bg-emerald-950/20"
          data-track-event="whatsapp_click"
          data-track-location="contact_sidebar"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
              <PhoneCall className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">
                WhatsApp
              </span>
              <span className="block truncate">{BUSINESS_WHATSAPP_DISPLAY}</span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-emerald-600 transition-transform group-hover:translate-x-0.5 dark:text-emerald-300" />
        </a>
      </div>
    </div>
  );
}

function ContactMiniCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:p-5">
      <div className="flex gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          {icon}
        </span>
        <span>
          <span className="block text-sm font-black text-slate-950 dark:text-white">{title}</span>
          <span className="mt-1 block text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
            {text}
          </span>
        </span>
      </div>
    </div>
  );
}

function WhyContactSection() {
  return (
    <section className="bg-slate-50 px-4 py-14 dark:bg-slate-900/25 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="When to contact"
          title="If the numbers do not feel trustworthy, do not guess."
          description="A tracking problem can make campaigns look worse or better than they really are. These are the most common reasons to contact TrackFlow Pro."
        />

        <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-3">
          {contactReasons.map((reason) => (
            <div
              key={reason.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 sm:rounded-[2rem] sm:p-7 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-blue-900/70"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                {reason.icon}
              </div>
              <h3 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                {reason.title}
              </h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NextStepsSection() {
  return (
    <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="What happens next"
          title="A clear response path, not a generic sales call."
          description="The goal is to understand whether the issue is visible from public evidence, what needs account-level validation, and which fix matters first."
          dark
        />

        <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-3">
          {nextSteps.map((step) => (
            <div key={step.step} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 sm:rounded-[2rem] sm:p-6">
              <div className="mb-5 text-4xl font-black tracking-[-0.06em] text-blue-400 sm:mb-8 sm:text-5xl">
                {step.step}
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

function ServiceIntentSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Service focus"
          title="Choose the closest tracking problem."
          description="If you are not sure which service fits, select General tracking issue in the contact form. The first review will help identify the correct path."
        />

        <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {serviceCards.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 sm:rounded-[2rem] sm:p-6 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/70"
            >
              <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/40 dark:text-blue-300">
                {service.icon}
              </span>
              <h3 className="text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                {service.title}
              </h3>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-300">
                View service <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
    <section className="bg-slate-50 px-4 py-14 dark:bg-slate-900/25 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          eyebrow="Contact FAQ"
          title="Questions before sending a message."
          description="Clear answers so you know what to share and what to expect after contacting TrackFlow Pro."
          centered
        />

        <div className="mt-8 space-y-3 sm:mt-12 sm:space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-[1.35rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:rounded-[1.5rem] sm:p-6"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-black text-slate-950 marker:hidden dark:text-white sm:text-lg">
                <span>{faq.question}</span>
                <span className="mt-1 text-blue-600 transition group-open:rotate-90 dark:text-blue-300">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </summary>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15 dark:border dark:border-slate-800 sm:rounded-[2rem] sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.45fr] lg:items-center">
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
              Free tracking review
            </p>
            <h2 className="max-w-3xl text-[2rem] font-black leading-[1.06] tracking-[-0.045em] sm:text-5xl sm:leading-[1.02]">
              Not ready to explain everything? Start with the audit request.
            </h2>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-400">
              If you want a structured first step, request a free tracking review and share the website URL with the main conversion issue.
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
            <a
              href="#contact-form"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.08]"
            >
              Send Contact Message
            </a>
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
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300 sm:mb-4 sm:text-[11px] sm:tracking-[0.24em]">
        {eyebrow}
      </p>
      <h2 className={cn("text-[2rem] font-black leading-[1.06] tracking-[-0.045em] sm:text-5xl sm:leading-[1.02] sm:tracking-[-0.05em]", dark ? "text-white" : "text-slate-950 dark:text-white")}>
        {title}
      </h2>
      <p className={cn("mt-4 text-base font-medium leading-7 sm:mt-5 sm:leading-8", dark ? "text-slate-400" : "text-slate-600 dark:text-slate-400")}>
        {description}
      </p>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
