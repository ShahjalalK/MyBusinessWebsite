"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  FileSearch,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  X,
  Zap,
} from "lucide-react";

type DropdownKey = "services" | null;

type MenuItem = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  badge?: string;
};

const services: MenuItem[] = [
  {
    title: "Google Ads Conversion Tracking",
    description:
      "Fix broken conversions, GTM tags, enhanced conversions, form tracking, call tracking, and ecommerce events.",
    href: "/services/google-ads-conversion-tracking",
    icon: <Target className="h-5 w-5" />,
    badge: "Core Service",
  },
  {
    title: "Server-Side Tracking",
    description:
      "Build first-party server-side tracking with GTM server-side and cleaner conversion signals.",
    href: "/services/server-side-tracking",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "GA4 & GTM Audit",
    description:
      "Audit GA4 events, GTM tags, triggers, data layer behavior, and tracking accuracy.",
    href: "/services/ga4-gtm-audit",
    icon: <FileSearch className="h-5 w-5" />,
  },
  {
    title: "Meta CAPI Setup",
    description:
      "Improve Meta Pixel and Conversions API event quality with server-side tracking.",
    href: "/services/meta-capi",
    icon: <Zap className="h-5 w-5" />,
    badge: "Signal Quality",
  },
  {
    title: "Looker Studio Dashboard",
    description:
      "Build PPC and analytics dashboards for Google Ads, GA4, Meta Ads, leads, revenue, and tracking health.",
    href: "/services/looker-studio-dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
    badge: "Reporting",
  },
];

const directLinks = [
  { label: "About", href: "/about" },
  { label: "Free Audit", href: "/free-tracking-audit" },
  { label: "Contact", href: "/contact" },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setOpenDropdown(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 top-0 z-[100] w-full border-b transition-colors duration-300",
          scrolled
            ? "border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/95"
            : "border-slate-200/60 bg-white/90 backdrop-blur-xl dark:border-slate-900/70 dark:bg-slate-950/90"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
            aria-label="TrackFlow Pro home"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-950/5 ring-1 ring-slate-200/70 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:shadow-blue-600/15 dark:bg-white dark:ring-blue-400/30 dark:shadow-blue-950/30 sm:h-11 sm:w-11">
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-white to-blue-50/90 opacity-95 dark:from-white dark:via-blue-50 dark:to-blue-100" />
              <Image
                src="/logo-mark.png"
                alt=""
                width={40}
                height={40}
                priority
                className="relative h-8 w-8 object-contain drop-shadow-sm sm:h-9 sm:w-9"
              />
            </span>

            <span className="flex min-w-0 flex-col leading-none">
              <span className="whitespace-nowrap text-[19px] font-black tracking-[-0.045em] text-slate-950 transition-colors dark:text-white sm:text-[22px]">
                TrackFlow
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-cyan-200">
                  Pro
                </span>
              </span>
              <span className="mt-1 hidden whitespace-nowrap text-[8px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 xl:block">
                Conversion Tracking Specialist
              </span>
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            <DesktopDropdown
              label="Services"
              dropdownKey="services"
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              items={services}
              footerHref="/free-tracking-audit"
              footerTitle="Not sure what is broken?"
              footerText="Start with a free tracking review before changing your setup."
            />

            {directLinks.map((link) => (
              <DesktopLink
                key={link.href}
                href={link.href}
                active={isActive(pathname, link.href)}
              >
                {link.label}
              </DesktopLink>
            ))}
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Link
              href="/free-tracking-audit"
              data-track-event="free_audit_click"
              data-track-location="navbar"
              className="group inline-flex items-center gap-2 whitespace-nowrap rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-600/20 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:bg-blue-600 dark:hover:bg-blue-500"
              aria-label="Request free tracking review"
            >
              Request Free Tracking Review
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
            <div className="mx-auto max-w-7xl space-y-5 px-4 py-4 sm:px-6 sm:py-6">
              <MobileSection title="Services" items={services} />

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {directLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-2xl border p-3 text-center text-xs font-black transition sm:p-4 sm:text-sm",
                      isActive(pathname, link.href)
                        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60 sm:p-4">
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    Appearance
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Switch between light and dark mode
                  </p>
                </div>
                <ThemeToggleButton />
              </div>

              <div className="rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 dark:border-blue-900/60 dark:from-blue-950/30 dark:to-slate-950 sm:rounded-[1.75rem] sm:p-5">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                  <Sparkles className="h-3.5 w-3.5" /> Tracking Review
                </div>

                <p className="text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                  No login required for the first review. I check public browser-visible tracking evidence first.
                </p>

                <Link
                  href="/free-tracking-audit"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                >
                  Request Free Tracking Review
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <FloatingThemeToggle />
    </>
  );
}

function ThemeToggleButton({ floating = false }: { floating?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300",
        floating && "shadow-xl shadow-slate-950/10 dark:shadow-black/30"
      )}
    >
      {!mounted ? (
        <Moon className="h-5 w-5" />
      ) : isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}

function FloatingThemeToggle() {
  return (
    <div className="fixed bottom-5 left-5 z-[80] hidden lg:block">
      <ThemeToggleButton floating />
    </div>
  );
}

function DesktopLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "whitespace-nowrap rounded-xl px-3 py-2 text-[14px] font-black transition focus:outline-none focus:ring-4 focus:ring-blue-500/10",
        active
          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}

function DesktopDropdown({
  label,
  dropdownKey,
  openDropdown,
  setOpenDropdown,
  items,
  footerHref,
  footerTitle,
  footerText,
  align = "center",
}: {
  label: string;
  dropdownKey: Exclude<DropdownKey, null>;
  openDropdown: DropdownKey;
  setOpenDropdown: Dispatch<SetStateAction<DropdownKey>>;
  items: MenuItem[];
  footerHref: string;
  footerTitle: string;
  footerText: string;
  align?: "center" | "right";
}) {
  const isOpen = openDropdown === dropdownKey;
  const [featuredItem, ...secondaryItems] = items;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpenDropdown(dropdownKey)}
      onMouseLeave={() => setOpenDropdown(null)}
    >
      <button
        type="button"
        onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
        onFocus={() => setOpenDropdown(dropdownKey)}
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[14px] font-black transition focus:outline-none focus:ring-4 focus:ring-blue-500/10",
          isOpen
            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      <div
        className={cn(
          "absolute top-full w-[760px] max-w-[calc(100vw-2rem)] pt-3 transition duration-200",
          align === "right" ? "right-0" : "left-1/2 -translate-x-1/2",
          isOpen ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"
        )}
      >
        <div
          role="menu"
          className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.18)] ring-1 ring-white/70 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/95 dark:ring-white/5"
        >
          <div className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_36%),linear-gradient(135deg,#f8fafc,#ffffff)] px-5 py-5 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.28),transparent_34%),linear-gradient(135deg,#020617,#0f172a)]">
            <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative flex items-start justify-between gap-5">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                  <Sparkles className="h-3.5 w-3.5" /> Services command center
                </div>
                <h3 className="text-lg font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                  Tracking & reporting services
                </h3>
                <p className="mt-1.5 max-w-xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">
                  Fix conversion tracking, validate event signals, and turn paid traffic data into clear reporting.
                </p>
              </div>

              <Link
                href={footerHref}
                className="group hidden shrink-0 items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 xl:inline-flex"
              >
                Free review
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-[1.05fr_1.35fr] gap-3 p-3">
            {featuredItem && <DropdownItem item={featuredItem} featured />}

            <div className="grid grid-cols-2 gap-2.5">
              {secondaryItems.map((item) => (
                <DropdownItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          <Link
            href={footerHref}
            className="group flex items-center justify-between gap-6 border-t border-slate-100 bg-slate-950 px-6 py-4 text-white transition hover:bg-blue-600 dark:border-slate-800"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-200 ring-1 ring-white/10">
                <Sparkles className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-black text-white">
                  {footerTitle}
                </span>
                <span className="mt-1 block text-sm font-medium text-slate-300 group-hover:text-blue-50">
                  {footerText}
                </span>
              </span>
            </span>

            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm transition group-hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DropdownItem({ item, featured = false }: { item: MenuItem; featured?: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative overflow-hidden rounded-[1.5rem] border transition focus:outline-none focus:ring-4 focus:ring-blue-500/10",
        featured
          ? "min-h-full border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10 dark:border-blue-900/50 dark:from-blue-950/35 dark:via-slate-950 dark:to-slate-900"
          : "border-slate-100 bg-white p-4 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/55 dark:hover:border-blue-900/60 dark:hover:bg-slate-900"
      )}
    >
      {featured && (
        <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/15 blur-3xl" />
      )}

      <span className="relative mb-3 flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-2xl transition group-hover:bg-blue-600 group-hover:text-white",
            featured
              ? "h-12 w-12 bg-white text-blue-600 shadow-sm ring-1 ring-blue-100 dark:bg-slate-950 dark:text-blue-300 dark:ring-blue-900/50"
              : "h-10 w-10 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
          )}
        >
          {item.icon}
        </span>

        {item.badge && (
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            {item.badge}
          </span>
        )}
      </span>

      <span
        className={cn(
          "relative block font-black tracking-[-0.03em] text-slate-950 dark:text-white",
          featured ? "text-base" : "text-sm"
        )}
      >
        {item.title}
      </span>
      <span
        className={cn(
          "relative mt-2 block font-medium text-slate-500 dark:text-slate-400",
          featured ? "text-sm leading-7" : "text-xs leading-5"
        )}
      >
        {item.description}
      </span>

      {featured && (
        <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700 dark:text-blue-300">
          Open core service
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </Link>
  );
}

function MobileSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <section className="space-y-2.5">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
        {title}
      </p>

      <div className="grid gap-2.5 sm:gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-800 dark:hover:bg-blue-950/20 sm:gap-4 sm:p-4"
          >
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 sm:h-10 sm:w-10">
              {item.icon}
            </span>

            <span>
              <span className="flex flex-wrap items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
                {item.title}

                {item.badge && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    {item.badge}
                  </span>
                )}
              </span>

              <span className="mt-1 block text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                {item.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}