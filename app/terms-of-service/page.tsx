import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Scale,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";

export const metadata: Metadata = {
  title: "Terms of Service | TrackFlow Pro",
  description:
    "Read the TrackFlow Pro terms of service for Google Ads conversion tracking, GA4/GTM audits, Meta CAPI, enhanced conversions, and server-side tracking services.",
  alternates: {
    canonical: "https://trackflowpro.com/terms-of-service",
  },
  openGraph: {
    title: "Terms of Service | TrackFlow Pro",
    description:
      "Service terms for TrackFlow Pro tracking audits, conversion tracking implementation, GA4/GTM, Meta CAPI, and server-side measurement services.",
    url: "https://trackflowpro.com/terms-of-service",
    siteName: "TrackFlow Pro",
    type: "website",
    images: [
      {
        url: "/meta/trackflowpro-advanced-tracking-solutions.webp",
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro Terms of Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | TrackFlow Pro",
    description:
      "Read the terms for TrackFlow Pro tracking audit and conversion tracking services.",
    images: ["/meta/trackflowpro-advanced-tracking-solutions.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const lastUpdated = "April 27, 2026";

const termsSections = [
  {
    title: "1. Acceptance of Terms",
    icon: <CheckCircle2 className="h-5 w-5" />,
    content:
      "By accessing this website, requesting a tracking review, submitting a form, booking a call, or using TrackFlow Pro services, you agree to these Terms of Service. If you do not agree with these terms, please do not use the website or request services.",
  },
  {
    title: "2. Service Scope",
    icon: <FileText className="h-5 w-5" />,
    content:
      "TrackFlow Pro provides specialist tracking and measurement services, including Google Ads conversion tracking, GA4 and Google Tag Manager audits, Meta Conversions API review, enhanced conversions, server-side tracking, tracking audits, and conversion validation support. Exact deliverables may vary based on the agreed proposal, access level, platform limitations, and the condition of the existing setup.",
  },
  {
    title: "3. First Review and Access",
    icon: <LockKeyhole className="h-5 w-5" />,
    content:
      "The initial review may begin with public browser-visible evidence such as tags, events, network requests, pixels, forms, and page behavior. Final confirmation or implementation may require approved access to GA4, GTM, Google Ads, Meta, CRM, ecommerce platforms, server logs, or other relevant systems.",
  },
  {
    title: "4. Client Responsibilities",
    icon: <ShieldCheck className="h-5 w-5" />,
    content:
      "Clients are responsible for providing accurate information, approved access, timely feedback, and permission to review or modify relevant tracking systems. TrackFlow Pro is not responsible for delays, incomplete findings, or implementation limitations caused by missing access, platform restrictions, incorrect account permissions, or third-party system issues.",
  },
  {
    title: "5. Results and Disclaimer",
    icon: <AlertCircle className="h-5 w-5" />,
    content:
      "TrackFlow Pro aims to improve tracking accuracy, conversion signal quality, and measurement reliability. However, advertising performance, revenue, ROAS, lead quality, or sales outcomes depend on many external factors including offer quality, market conditions, ad strategy, website performance, budget, competition, and platform algorithms. No specific business result is guaranteed.",
  },
  {
    title: "6. Confidentiality and Data Handling",
    icon: <ShieldCheck className="h-5 w-5" />,
    content:
      "Any account access, business information, tracking data, reports, or technical details shared with TrackFlow Pro are treated as confidential. Access should be granted using secure, role-based permissions where possible. Clients should avoid sharing passwords directly when platform-level user access is available.",
  },
  {
    title: "7. Third-Party Platforms",
    icon: <Scale className="h-5 w-5" />,
    content:
      "TrackFlow Pro services may involve third-party platforms such as Google Ads, Google Analytics, Google Tag Manager, Meta, ecommerce platforms, CRMs, hosting providers, and server-side tools. TrackFlow Pro is not responsible for outages, policy changes, tracking limitations, account restrictions, interface changes, or data differences caused by third-party platforms.",
  },
  {
    title: "8. Payments, Cancellations, and Refunds",
    icon: <FileText className="h-5 w-5" />,
    content:
      "Payment terms, project scope, cancellation rules, and refund eligibility should be defined in the agreed proposal, invoice, or written communication before work begins. Completed audits, technical reviews, delivered reports, and implemented tracking work may not be refundable unless otherwise agreed in writing.",
  },
  {
    title: "9. Limitation of Liability",
    icon: <AlertCircle className="h-5 w-5" />,
    content:
      "To the maximum extent permitted by law, TrackFlow Pro is not liable for indirect, incidental, consequential, or business losses, including lost revenue, lost profits, advertising spend, missed conversions, or platform reporting differences. The service is provided as technical support and professional guidance, not as a guarantee of business performance.",
  },
  {
    title: "10. Updates to These Terms",
    icon: <CheckCircle2 className="h-5 w-5" />,
    content:
      "TrackFlow Pro may update these Terms of Service from time to time. The latest version will be published on this page with the updated date. Continued use of the website or services after updates means you accept the revised terms.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Terms of Service",
  url: "https://trackflowpro.com/terms-of-service",
  description:
    "Terms of Service for TrackFlow Pro tracking audit and conversion tracking services.",
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

export default function TermsOfServicePage() {
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
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
              <Scale className="h-4 w-4" />
              Legal agreement
            </div>

            <h1 className="text-4xl font-black tracking-[-0.055em] text-slate-950 dark:text-white sm:text-5xl lg:text-7xl">
              Terms of <span className="text-blue-600 dark:text-blue-400">Service</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              These terms explain how TrackFlow Pro provides tracking audits, Google Ads conversion tracking support, GA4/GTM review, Meta CAPI, enhanced conversions, and server-side measurement services.
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
                <ShieldCheck className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                Clear service terms for tracking work.
              </h2>

              <p className="mt-4 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                This page is written to keep expectations clear before any audit, implementation, or account-level tracking work begins.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Evidence-first tracking review",
                  "No login required for first review",
                  "Final validation may require approved access",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/contact"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Ask a question
                <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>

            <div className="space-y-5">
              {termsSections.map((section) => (
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
                  Questions about these terms?
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                  Contact TrackFlow Pro before starting a project.
                </h2>

                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-400">
                  If anything is unclear, send a message before requesting a tracking review or booking implementation work.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-500"
                  >
                    Contact TrackFlow Pro
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/free-tracking-audit"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.08]"
                  >
                    Request Free Tracking Review
                  </Link>
                </div>
              </div>

              <p className="px-2 text-xs font-medium leading-6 text-slate-500 dark:text-slate-500">
                This page is provided for general service transparency and does not replace independent legal advice.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}