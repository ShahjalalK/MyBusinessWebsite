import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import { BsLinkedin } from "react-icons/bs";

const currentYear = new Date().getFullYear();

const businessEmail = "shahjalal@trackflowpro.com";

const businessAddress =
  process.env.NEXT_PUBLIC_TRACKFLOW_MAILING_ADDRESS ||
  "Business mailing address available on request";

const whatsappUrl =
  "https://api.whatsapp.com/send/?phone=%2B8801329532551&text=Hi%20Shahjalal%2C%20I%20need%20help%20with%20conversion%20tracking.&type=phone_number&app_absent=0";

const services = [
  {
    label: "Google Ads Conversion Tracking",
    href: "/services/google-ads-conversion-tracking",
  },
  {
    label: "Server-Side Tracking",
    href: "/services/server-side-tracking",
  },
  {
    label: "GA4 & GTM Audit",
    href: "/services/ga4-gtm-audit",
  },
  {
    label: "Meta CAPI Setup",
    href: "/services/meta-capi",
  },
  {
    label: "Free Google Ads Audit",
    href: "/free-tracking-audit",
  },
];

const resources = [
  {
    label: "Blog",
    href: "/blog",
  },
  {
    label: "Google Ads Tracking Guide",
    href: "/blog/how-to-set-up-google-ads-conversion-tracking",
  },
  {
    label: "Google Ads Not Tracking",
    href: "/blog/google-ads-conversions-not-tracking",
  },
  {
    label: "Client-Side vs Server-Side Tracking",
    href: "/blog/client-side-vs-server-side-tracking",
  },
  {
    label: "Meta Pixel vs Conversions API",
    href: "/blog/meta-pixel-vs-conversions-api",
  },
  {
    label: "GTM Audit Checklist",
    href: "/blog/google-tag-manager-audit-checklist",
  },
];

const company = [
  {
    label: "About",
    href: "/about",
  },
  {
    label: "Contact",
    href: "/contact",
  },
  {
    label: "Privacy Policy",
    href: "/privacy-policy",
  },
  {
    label: "Terms of Service",
    href: "/terms-of-service",
  },
];

const trustPoints = [
  "Public browser-visible evidence first",
  "GA4, GTM, Google Ads & Meta CAPI focused",
  "No login required for the initial review",
  "Not affiliated with Google, Meta, or ad platforms",
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-slate-950 text-slate-300 dark:border-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-14 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-2xl shadow-blue-950/20 backdrop-blur">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:p-10">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Tracking Review
              </div>

              <h2 className="max-w-3xl text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                Not sure if your Google Ads conversion tracking is accurate?
              </h2>

              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-400 sm:text-lg">
                Start with a tracking-first audit for Google Ads, GA4, GTM, Meta CAPI,
                enhanced conversions, and server-side measurement issues.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <Link
                href="/free-tracking-audit"
                data-track-event="free_audit_click"
                data-track-location="footer_cta"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
              >
                Request Free Tracking Review
                <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/contact"
                data-track-event="contact_click"
                data-track-location="footer_cta"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-black text-white transition hover:border-blue-400/40 hover:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                Contact Specialist
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_1.9fr]">
          <div className="space-y-8">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="TrackFlow Pro home">
              <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                <span className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-slate-950" />
                <span className="relative text-2xl font-black tracking-tight">T</span>
              </span>

              <span>
                <span className="block text-2xl font-black tracking-[-0.04em] text-white">
                  TrackFlow<span className="text-blue-400">Pro</span>
                </span>
                <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Tracking & Attribution
                </span>
              </span>
            </Link>

            <p className="max-w-md text-sm font-medium leading-7 text-slate-400">
              Specialist support for Google Ads conversion tracking, GA4/GTM audits,
              Meta Conversions API, enhanced conversions, and server-side measurement.
            </p>

            <div className="space-y-3">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm font-semibold text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
                Direct contact
              </p>

              <p className="mt-3 text-sm font-medium leading-6 text-slate-400">
                Prefer not to use the form? Email or WhatsApp directly about your tracking issue.
              </p>

              <div className="mt-5 space-y-3">
                <a
                  href={`mailto:${businessEmail}?subject=Tracking%20Review%20Request`}
                  data-track-event="direct_email_click"
                  data-track-location="footer_direct_contact"
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-blue-500/10"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-blue-300" />
                    <span className="truncate">{businessEmail}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-blue-300 transition-transform group-hover:translate-x-0.5" />
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track-event="whatsapp_click"
                  data-track-location="footer_direct_contact"
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-emerald-500/10"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <MessageCircle className="h-4 w-4 shrink-0 text-emerald-300" />
                    <span className="truncate">WhatsApp: +880 1329-532551</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-emerald-300 transition-transform group-hover:translate-x-0.5" />
                </a>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold leading-6 text-slate-400">
                  <div className="mb-1 flex items-center gap-2 text-white">
                    <MapPin className="h-4 w-4 text-blue-300" />
                    Business contact
                  </div>
                  <p>{businessAddress}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.linkedin.com/in/shahjalal-khan/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-blue-300"
                aria-label="LinkedIn profile"
              >
                <BsLinkedin className="h-5 w-5" />
              </a>

              <Link
                href="/contact"
                data-track-event="contact_click"
                data-track-location="footer_social_row"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-black text-slate-200 transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white"
              >
                <Mail className="h-4 w-4" />
                Contact
              </Link>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <FooterColumn title="Services" links={services} featuredIcon={<Target className="h-4 w-4" />} />
            <FooterColumn title="Resources" links={resources} featuredIcon={<BookIcon />} />
            <FooterColumn title="Company" links={company} featuredIcon={<FileSearch className="h-4 w-4" />} />

            <div>
              <div className="mb-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                <BarChart3 className="h-4 w-4" />
                Focus
              </div>

              <div className="space-y-3">
                <FocusPill icon={<Target className="h-4 w-4" />} label="Google Ads Tracking" />
                <FocusPill icon={<ShieldCheck className="h-4 w-4" />} label="Server-Side Tracking" />
                <FocusPill icon={<FileSearch className="h-4 w-4" />} label="GA4 & GTM Audit" />
                <FocusPill icon={<Zap className="h-4 w-4" />} label="Meta CAPI" />
              </div>

              <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-black text-white">
                  <MapPin className="h-4 w-4 text-blue-300" />
                  Remote Tracking Specialist
                </div>

                <p className="text-sm font-medium leading-6 text-slate-400">
                  Serving businesses remotely with tracking audits, implementation reviews,
                  and measurement strategy.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <div className="flex flex-col gap-5 text-sm font-medium text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>© {currentYear} TrackFlow Pro. All rights reserved.</p>
            <div className="max-w-3xl space-y-2 leading-6 md:text-right">
              <p>
                Audit notes are based on public browser-visible evidence first. Final confirmation may require access to GA4, GTM, Google Ads, Meta, CRM, or server-side logs.
              </p>
              <p>TrackFlow Pro is an independent service provider and is not affiliated with Google or Meta.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  featuredIcon,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
  featuredIcon: ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
        {featuredIcon}
        {title}
      </div>

      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-2 text-sm font-bold leading-6 text-slate-400 transition hover:text-white"
            >
              <span>{link.label}</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FocusPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-black text-slate-300">
      <span className="text-blue-300">{icon}</span>
      {label}
    </div>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5v-16Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 8H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}