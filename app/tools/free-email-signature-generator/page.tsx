import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ImageUp,
  MailCheck,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Footer from "../../components/footer";
import Navbar from "../../components/navbar";
import EmailSignatureGenerator from "../../components/EmailSignatureGenerator";

const siteUrl = "https://trackflowpro.com";
const pageUrl = `${siteUrl}/tools/free-email-signature-generator`;
const title = "Free Email Signature Generator for Gmail & Outlook | TrackFlow Pro";
const description =
  "Create a professional clickable email signature for Gmail, Outlook, and other email platforms. Add your name, company, links, social profiles, image URL, and copy ready-to-use HTML.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: pageUrl,
  },
  keywords: [
    "free email signature generator",
    "clickable email signature generator",
    "Gmail email signature generator",
    "Outlook email signature generator",
    "HTML email signature generator",
    "professional email signature generator",
    "email signature with photo",
    "email signature with social icons",
  ],
  openGraph: {
    title,
    description,
    url: pageUrl,
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Free clickable email signature generator by TrackFlow Pro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/og-image.png`],
  },
};

const features = [
  {
    icon: <MousePointerClick className="h-5 w-5" />,
    title: "Clickable contact links",
    text: "Add email, phone, website, social profiles, and a call-to-action button that your contacts can click.",
  },
  {
    icon: <ImageUp className="h-5 w-5" />,
    title: "Image crop and optimization",
    text: "Upload a photo or logo, resize it for email, download the optimized image, and keep the signature lightweight.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "No server storage or login",
    text: "The generator runs in your browser. Draft details can auto-save on the user’s own device, but they are not sent to our server.",
  },
  {
    icon: <ClipboardCheck className="h-5 w-5" />,
    title: "Copy-ready HTML",
    text: "Copy a Gmail-ready signature and open the install guide when you need help placing it inside your email platform.",
  },
];

const steps = [
  "Enter your name, job title, company, email, phone, and website.",
  "Choose initials, paste a public image URL, or upload an image to crop and download.",
  "Pick a brand color and add social profile links or a call-to-action button.",
  "Copy the signature and paste it into Gmail, Outlook, Apple Mail, or your email platform.",
];

const faqs = [
  {
    question: "Is this email signature generator really free?",
    answer:
      "Yes. You can build, preview, and copy a professional email signature without creating an account or paying for a dashboard subscription.",
  },
  {
    question: "Do you host my image?",
    answer:
      "No. To keep the tool free and safe, TrackFlow Pro does not host uploaded images. The image optimizer runs in your browser, then you can download the optimized image and upload it to your own public image host.",
  },
  {
    question: "Why do I need a public image URL?",
    answer:
      "Email platforms such as Gmail and Outlook need an image URL that can be reached publicly. A private local file path or a locked cloud file will usually not display correctly for email recipients.",
  },
  {
    question: "Can I use this signature in Gmail?",
    answer:
      "Yes. Copy the signature, open Gmail settings, go to the signature section, paste it into the editor, save changes, and send yourself a test email.",
  },
  {
    question: "Will this work in Outlook?",
    answer:
      "The HTML is table-based and inline-styled for better email compatibility. Outlook can still render some spacing differently, so always send one test email before using it with clients.",
  },
  {
    question: "Do you store my personal information?",
    answer:
      "No. The information you type is used inside your browser to create the preview and copyable signature. The tool can save a private draft in your browser’s local storage so refresh does not erase your work, but it is not saved to our server.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Email Signature Generator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    url: pageUrl,
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    provider: {
      "@type": "Organization",
      name: "TrackFlow Pro",
      url: siteUrl,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Free Tools",
        item: `${siteUrl}/tools`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Free Email Signature Generator",
        item: pageUrl,
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

export default function FreeEmailSignatureGeneratorPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14 sm:pb-16 lg:px-8 lg:pt-16 lg:pb-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300 sm:mb-5 sm:text-xs">
              <Sparkles className="h-4 w-4" />
              Free business tool
            </div>

            <h1 className="text-[2.45rem] font-black leading-[0.98] tracking-[-0.06em] text-slate-950 dark:text-white sm:text-5xl sm:leading-tight lg:text-7xl">
              Free Clickable Email Signature Generator
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-sm font-semibold leading-7 text-slate-600 dark:text-slate-400 sm:mt-6 sm:text-lg sm:leading-8">
              Create a clean, professional email signature for Gmail, Outlook, Apple Mail, and other email platforms. Add your details, image URL, social links, and a call-to-action — then copy the ready-to-use HTML signature.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row">
              <a
                href="#signature-generator"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
              >
                Create your signature
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-900 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:bg-blue-500/10"
              >
                Need custom design?
              </Link>
            </div>

            <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              <HeroPoint text="No login required" />
              <HeroPoint text="Draft saved on device" />
              <HeroPoint text="Gmail & Outlook friendly" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                {feature.icon}
              </div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">{feature.title}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <EmailSignatureGenerator />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">
              Build once, paste anywhere
            </h2>
            <p className="mt-4 text-base font-medium leading-8 text-slate-600 dark:text-slate-400">
              The tool creates a table-based HTML signature with inline styling. That makes it more suitable for email clients than a normal website section copied from a browser.
            </p>

            <div className="mt-7 space-y-4">
              {steps.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/70">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm font-bold leading-6 text-slate-700 dark:text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <GuideCard
              icon={<MailCheck className="h-5 w-5" />}
              title="How to add it in Gmail"
              points={[
                "Copy the signature from the generator.",
                "Open Gmail settings and go to the signature section.",
                "Create a new signature, paste it into the editor, and save changes.",
                "Send yourself one test email to check image, spacing, and links.",
              ]}
            />

            <GuideCard
              icon={<ClipboardCheck className="h-5 w-5" />}
              title="How to use an image safely"
              points={[
                "Use the crop and optimization tool before hosting your image.",
                "Upload the downloaded image to your own website, CDN, or trusted public image host.",
                "Paste the final public image URL into the generator.",
                "Avoid private file links because recipients may not be able to see the image.",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">
              Common questions before using a clickable email signature
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/70">
                <h3 className="text-base font-black text-slate-950 dark:text-white">{faq.question}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-blue-950/20 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">Need a custom signature?</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Want a branded clickable signature designed for your team?
              </h2>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-400 sm:text-base">
                Use the free generator for quick signatures. For a fully branded layout, team-wide setup, Gmail/Outlook support, and conversion-friendly links, contact TrackFlow Pro.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Contact TrackFlow Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}

function HeroPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-700 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:shadow-none">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      {text}
    </div>
  );
}

function GuideCard({ icon, title, points }: { icon: ReactNode; title: string; points: string[] }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none sm:p-8">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
        {icon}
      </div>
      <h3 className="text-2xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">{title}</h3>
      <ul className="mt-5 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
