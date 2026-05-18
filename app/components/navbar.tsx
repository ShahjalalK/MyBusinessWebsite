"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  FileSearch,
  LineChart,
  Menu,
  Moon,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  X,
  Zap,
} from "lucide-react";

type DropdownKey = "services" | "resources" | null;

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
    description: "Fix broken conversions, GTM tags, enhanced conversions, form and call tracking.",
    href: "/services/google-ads-conversion-tracking",
    icon: <Target className="h-5 w-5" />,
    badge: "Core Service",
  },
  {
    title: "Server-Side Tracking",
    description: "Build first-party server-side tracking with GTM server-side and cleaner signals.",
    href: "/services/server-side-tracking",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "GA4 & GTM Audit",
    description: "Audit GA4 events, GTM tags, triggers, data layer, and tracking accuracy.",
    href: "/services/ga4-gtm-audit",
    icon: <FileSearch className="h-5 w-5" />,
  },
  {
    title: "Meta CAPI Setup",
    description: "Improve Meta Pixel and Conversions API event quality with server-side events.",
    href: "/services/meta-capi",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    title: "Free Google Ads Audit",
    description: "Start with a tracking-first audit before changing your measurement setup.",
    href: "/free-tracking-audit",
    icon: <BarChart3 className="h-5 w-5" />,
    badge: "Free Review",
  },
];

const resources: MenuItem[] = [
  {
    title: "Blog",
    description: "Guides on conversion tracking, GA4, GTM, Meta CAPI, and server-side measurement.",
    href: "/blog",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Google Ads Tracking Guide",
    description: "Learn how conversion tracking works and where issues usually happen.",
    href: "/blog/how-to-set-up-google-ads-conversion-tracking",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "Google Ads Not Tracking",
    description: "Find common reasons why Google Ads conversions are not tracking correctly.",
    href: "/blog/google-ads-conversions-not-tracking",
    icon: <FileSearch className="h-5 w-5" />,
  },
  {
    title: "Client-Side vs Server-Side Tracking",
    description: "Understand browser-side signal loss and when server-side tagging helps.",
    href: "/blog/client-side-vs-server-side-tracking",
    icon: <LineChart className="h-5 w-5" />,
  },
  {
    title: "Meta Pixel vs Conversions API",
    description: "Compare browser pixel events with server-side Meta CAPI event tracking.",
    href: "/blog/meta-pixel-vs-conversions-api",
    icon: <MousePointerClick className="h-5 w-5" />,
  },
  {
    title: "GTM Audit Checklist",
    description: "A practical checklist for GA4, GTM tags, triggers, and data layer issues.",
    href: "/blog/google-tag-manager-audit-checklist",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
];

const directLinks = [
  { label: "Free Audit", href: "/free-tracking-audit" },
  { label: "About", href: "/about" },
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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label="TrackFlow Pro home">
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <span className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-slate-950" />
              <span className="relative text-xl font-black tracking-tight">T</span>
            </span>

            <span className="leading-none">
              <span className="block whitespace-nowrap text-[21px] font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                TrackFlow<span className="text-blue-600 dark:text-blue-400">Pro</span>
              </span>
              <span className="mt-1 hidden whitespace-nowrap text-[9px] font-black uppercase tracking-[0.22em] text-slate-400 xl:block">
                Tracking & Attribution
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
              footerText="Start with a free tracking audit before changing your setup."
            />

            {directLinks.map((link) => (
              <DesktopLink key={link.href} href={link.href} active={isActive(pathname, link.href)}>
                {link.label}
              </DesktopLink>
            ))}

            <DesktopDropdown
              label="Resources"
              dropdownKey="resources"
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              items={resources}
              footerHref="/blog/google-ads-conversions-not-tracking"
              footerTitle="Popular guide"
              footerText="Why Google Ads conversions are not tracking correctly."
              align="right"
            />
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
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
            <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6">
              <MobileSection title="Services" items={services} />

              <div className="grid grid-cols-2 gap-3">
                {directLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-2xl border p-4 text-sm font-black transition",
                      isActive(pathname, link.href)
                        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <MobileSection title="Resources" items={resources} />

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">Appearance</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Switch between light and dark mode
                  </p>
                </div>
                <ThemeToggleButton />
              </div>

              <div className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-blue-900/60 dark:from-blue-950/30 dark:to-slate-950">
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
    <div className="fixed bottom-5 right-5 z-[90] hidden lg:block">
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
          "absolute top-full w-[680px] max-w-[calc(100vw-2rem)] pt-3 transition",
          align === "right" ? "right-0" : "left-1/2 -translate-x-1/2",
          isOpen ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"
        )}
      >
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-950">
          <div className="grid grid-cols-2 gap-2 p-3">
            {items.map((item) => (
              <DropdownItem key={item.href} item={item} />
            ))}
          </div>

          <Link
            href={footerHref}
            className="flex items-center justify-between gap-6 border-t border-slate-100 bg-slate-50/80 px-6 py-4 transition hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-blue-950/30"
          >
            <span>
              <span className="block text-sm font-black text-slate-950 dark:text-white">
                {footerTitle}
              </span>
              <span className="mt-1 block text-sm font-medium text-slate-500 dark:text-slate-400">
                {footerText}
              </span>
            </span>

            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-950">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DropdownItem({ item }: { item: MenuItem }) {
  return (
    <Link
      href={item.href}
      className="group rounded-[1.35rem] p-4 transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-900 dark:focus:bg-slate-900"
    >
      <span className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/50 dark:text-blue-300 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
          {item.icon}
        </span>

        {item.badge && (
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            {item.badge}
          </span>
        )}
      </span>

      <span className="block text-sm font-black text-slate-950 dark:text-white">
        {item.title}
      </span>
      <span className="mt-1.5 block text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
        {item.description}
      </span>
    </Link>
  );
}

function MobileSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <section className="space-y-3">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
        {title}
      </p>

      <div className="grid gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
          >
            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
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
