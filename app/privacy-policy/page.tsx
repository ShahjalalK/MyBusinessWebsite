import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cookie,
  Database,
  Eye,
  FileText,
  Globe2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | TrackFlow Pro",
  description:
    "Read how TrackFlow Pro handles contact form submissions, UTM tracking, analytics, Turnstile security checks, tracking audit requests, GA4/GTM review data, Meta CAPI, and server-side tracking information.",
  alternates: {
    canonical: "https://trackflowpro.com/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | TrackFlow Pro",
    description:
      "Learn how TrackFlow Pro protects personal and business information submitted through contact forms, tracking audit requests, analytics, and server-side measurement workflows.",
    url: "https://trackflowpro.com/privacy-policy",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro Privacy Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | TrackFlow Pro",
    description:
      "Privacy policy for TrackFlow Pro contact forms, tracking audit requests, analytics, and conversion tracking services.",
    images: ["/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const lastUpdated = "April 27, 2026";

const dataTypes = [
  "Name, email address, phone number, and company details",
  "Website URL, service interest, and tracking issue details",
  "UTM parameters, referrer, landing page, GCLID, FBCLID, and MSCLKID",
  "Approximate IP-based country, region, city, timezone, and technical request data",
  "Browser, device, screen, viewport, language, cookie, and interaction context",
  "GA client ID, Meta browser identifiers such as _fbp/_fbc when available",
  "Approved account-level access only when needed for final validation",
];

const policySections = [
  {
    title: "1. Introduction",
    icon: <Eye className="h-5 w-5" />,
    content:
      "TrackFlow Pro respects your privacy. This Privacy Policy explains how information may be collected, used, stored, and protected when you visit this website, submit a contact form, request a free tracking review, book a call, or communicate with TrackFlow Pro.",
  },
  {
    title: "2. Information You Provide",
    icon: <FileText className="h-5 w-5" />,
    content:
      "When you submit a form, you may provide your name, email address, phone number, website URL, company name, service interest, and details about your tracking issue. This information is used to respond to your request and review the tracking or measurement problem you described.",
  },
  {
    title: "3. Technical and Attribution Data",
    icon: <Globe2 className="h-5 w-5" />,
    content:
      "When you submit a contact or tracking review request, TrackFlow Pro may collect technical and attribution context such as current page URL, landing page, referrer, UTM source, UTM medium, UTM campaign, UTM term, UTM content, GCLID, FBCLID, MSCLKID, browser language, device details, screen size, viewport size, timezone, cookie availability, and similar diagnostic information.",
  },
  {
    title: "4. Approximate Location Data",
    icon: <Database className="h-5 w-5" />,
    content:
      "For security, lead quality, and attribution review, we may collect approximate location information from server request headers, such as IP address, country, region, city, timezone, and postal-code level information when available. This is not GPS-level location and may be inaccurate if a visitor uses VPN, proxy, iCloud Private Relay, corporate network, or other privacy tools.",
  },
  {
    title: "5. Contact Form Security",
    icon: <ShieldCheck className="h-5 w-5" />,
    content:
      "This website may use Cloudflare Turnstile or similar anti-spam tools to protect forms from automated abuse. These tools help verify that a request is legitimate and may process limited technical information required for security verification.",
  },
  {
    title: "6. Email Delivery and Communication",
    icon: <Mail className="h-5 w-5" />,
    content:
      "When you submit a form, your message may be delivered through email service providers or SMTP services used by TrackFlow Pro. A confirmation email may also be sent to the email address you provide. If you reply to a confirmation email or if TrackFlow Pro replies to your request, the communication may be handled through email inbox and delivery systems.",
  },
  {
    title: "7. Analytics and Measurement",
    icon: <Cookie className="h-5 w-5" />,
    content:
      "This website may use analytics and measurement tools such as Google Analytics, Google Tag Manager, Microsoft Clarity, Meta Pixel, Meta Conversions API, or similar services. These tools may help understand website performance, page behavior, referral sources, campaign attribution, form submissions, and conversion events. Where possible, server-side events may be used to improve measurement reliability.",
  },
  {
    title: "8. Tracking Audit Data",
    icon: <LockKeyhole className="h-5 w-5" />,
    content:
      "For the first tracking review, TrackFlow Pro may inspect public browser-visible evidence without requiring login access. This can include tags, pixels, events, network requests, forms, consent behavior, and page flow. Final confirmation may require approved access to GA4, Google Tag Manager, Google Ads, Meta, CRM, ecommerce platforms, server logs, or other relevant systems.",
  },
  {
    title: "9. How We Use Information",
    icon: <CheckCircle2 className="h-5 w-5" />,
    content:
      "Information may be used to respond to inquiries, review tracking issues, prepare audit notes, improve service quality, prevent spam or abuse, understand campaign attribution, send confirmation messages, and provide requested services. TrackFlow Pro does not sell your personal information to third parties.",
  },
  {
    title: "10. Third-Party Tools",
    icon: <Database className="h-5 w-5" />,
    content:
      "TrackFlow Pro may use trusted third-party providers for hosting, forms, email delivery, analytics, calendar booking, spam prevention, reporting, and measurement. These providers may process limited information only as needed to provide their services.",
  },
  {
    title: "11. Data Security",
    icon: <ShieldCheck className="h-5 w-5" />,
    content:
      "We take reasonable technical and organizational measures to protect submitted information from unauthorized access, misuse, loss, or disclosure. However, no internet-based system can be guaranteed to be 100% secure. Please avoid sending passwords directly when secure platform-level user access is available.",
  },
  {
    title: "12. Data Retention",
    icon: <FileText className="h-5 w-5" />,
    content:
      "We keep information only as long as reasonably necessary to respond to inquiries, provide requested services, maintain business records, improve service quality, prevent abuse, and meet operational or legal requirements. You may request deletion of personal information you submitted unless retention is required for legitimate business or legal reasons.",
  },
  {
    title: "13. Your Choices",
    icon: <CheckCircle2 className="h-5 w-5" />,
    content:
      "You may contact TrackFlow Pro to request access, correction, or deletion of personal information you submitted. You may also choose not to submit forms, block cookies, disable browser tracking, or use privacy tools, though some website features or attribution details may not work as intended.",
  },
  {
    title: "14. Updates to This Policy",
    icon: <FileText className="h-5 w-5" />,
    content:
      "TrackFlow Pro may update this Privacy Policy from time to time. The latest version will be published on this page with the updated date. Continued use of the website after updates means you acknowledge the revised policy.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Privacy Policy",
  url: "https://trackflowpro.com/privacy-policy",
  description:
    "Privacy Policy for TrackFlow Pro contact forms, tracking audit requests, analytics, and conversion tracking services.",
  isPartOf: {
    "@type": "WebSite",
    name: "TrackFlow Pro",
    url: "https://trackflowpro.com",
  },
  publisher: {
    "@type": "Organization",
    name: "TrackFlow Pro",
    url: "https://trackflowpro.com",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />

      <main className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_35%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 py-20 dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_35%),linear-gradient(to_bottom,#020617,#0f172a)] sm:px-6 lg:px-8 lg:py-28">
          <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Privacy & transparency
            </div>

            <h1 className="text-4xl font-black tracking-[-0.055em] text-slate-950 dark:text-white sm:text-5xl lg:text-7xl">
              Privacy <span className="text-blue-600 dark:text-blue-400">Policy</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              This policy explains how TrackFlow Pro handles information submitted through contact forms, free tracking audit requests, analytics, UTM campaign links, booking tools, and tracking review services.
            </p>

            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              Last updated: {lastUpdated}
            </p>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.34fr_0.66fr]">
            <aside className="h-fit rounded-[2rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50 lg:sticky lg:top-24">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                What information may be handled?
              </h2>

              <p className="mt-4 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                TrackFlow Pro only asks for information needed to review tracking issues, respond to inquiries, protect the form from abuse, and understand where qualified requests came from.
              </p>

              <div className="mt-6 space-y-3">
                {dataTypes.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/contact"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Ask about privacy
                <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>

            <div className="space-y-5">
              {policySections.map((section) => (
                <article
                  key={section.title}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/70 sm:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      {section.icon}
                    </div>

                    <div>
                      <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                        {section.title}
                      </h2>
                      <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400 sm:text-base sm:leading-8">
                        {section.content}
                      </p>
                    </div>
                  </div>
                </article>
              ))}

              <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/15 dark:border dark:border-slate-800">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
                  Privacy questions?
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                  Contact TrackFlow Pro about your data.
                </h2>

                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-400">
                  If you have questions about how your information is handled during a tracking audit, contact request, UTM campaign visit, or implementation project, send a message before submitting sensitive details.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500"
                  >
                    Contact TrackFlow Pro
                    <Mail className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/terms-of-service"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.08]"
                  >
                    View Terms of Service
                  </Link>
                </div>
              </div>

              <p className="px-2 text-xs font-medium leading-6 text-slate-500 dark:text-slate-500">
                This Privacy Policy is provided for transparency and does not replace independent legal advice. Please consult a qualified legal professional for jurisdiction-specific privacy requirements.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}