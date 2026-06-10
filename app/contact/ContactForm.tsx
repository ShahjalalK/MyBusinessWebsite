"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

type FormState = {
  name: string;
  email: string;
  website: string;
  company: string;
  phone: string;
  serviceInterest: string;
  message: string;
  consent: boolean;
  honeypot: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  website: "",
  company: "",
  phone: "",
  serviceInterest: "Free Tracking Review",
  message: "",
  consent: false,
  honeypot: "",
};

function getCookie(name: string) {
  if (typeof document === "undefined") return "";

  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : "";
}

function getGaClientId() {
  const ga = getCookie("_ga");
  if (!ga) return "";

  const parts = ga.split(".");
  if (parts.length >= 4) return `${parts[2]}.${parts[3]}`;

  return ga;
}

function getTrackingContext() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const landingKey = "tfp_landing_page";
  const firstReferrerKey = "tfp_first_referrer";

  if (!sessionStorage.getItem(landingKey)) {
    sessionStorage.setItem(landingKey, window.location.href);
  }

  if (!sessionStorage.getItem(firstReferrerKey)) {
    sessionStorage.setItem(firstReferrerKey, document.referrer || "");
  }

  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
    deviceMemory?: number;
  };

  return {
    currentUrl: window.location.href,
    landingPage: sessionStorage.getItem(landingKey) || window.location.href,
    referrer: document.referrer || sessionStorage.getItem(firstReferrerKey) || "",
    title: document.title,

    utm_source: params.get("utm_source") || sessionStorage.getItem("tfp_utm_source") || "",
    utm_medium: params.get("utm_medium") || sessionStorage.getItem("tfp_utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || sessionStorage.getItem("tfp_utm_campaign") || "",
    utm_term: params.get("utm_term") || sessionStorage.getItem("tfp_utm_term") || "",
    utm_content: params.get("utm_content") || sessionStorage.getItem("tfp_utm_content") || "",

    gclid: params.get("gclid") || sessionStorage.getItem("tfp_gclid") || "",
    fbclid: params.get("fbclid") || sessionStorage.getItem("tfp_fbclid") || "",
    msclkid: params.get("msclkid") || sessionStorage.getItem("tfp_msclkid") || "",

    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    localTime: new Date().toString(),
    language: navigator.language || "",
    languages: navigator.languages?.join(", ") || "",
    platform: navigator.platform || "",
    userAgentClientHint: "userAgentData" in navigator ? "available" : "not_available",

    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${window.screen.width}x${window.screen.height}`,
    devicePixelRatio: window.devicePixelRatio,
    colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || "",
    maxTouchPoints: navigator.maxTouchPoints,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: nav.deviceMemory || "",

    connection: nav.connection
      ? {
          effectiveType: nav.connection.effectiveType || "",
          downlink: nav.connection.downlink || "",
          rtt: nav.connection.rtt || "",
          saveData: nav.connection.saveData || false,
        }
      : "",

    gaClientId: getGaClientId(),
    fbp: getCookie("_fbp"),
    fbc: getCookie("_fbc"),
  };
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const needsTurnstile = Boolean(turnstileSiteKey);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileRenderKey, setTurnstileRenderKey] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const landingKey = "tfp_landing_page";
    const firstReferrerKey = "tfp_first_referrer";

    if (!sessionStorage.getItem(landingKey)) {
      sessionStorage.setItem(landingKey, window.location.href);
    }

    if (!sessionStorage.getItem(firstReferrerKey)) {
      sessionStorage.setItem(firstReferrerKey, document.referrer || "");
    }

    const params = new URLSearchParams(window.location.search);

    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
      "msclkid",
    ].forEach((key) => {
      const value = params.get(key);
      if (value) sessionStorage.setItem(`tfp_${key}`, value);
    });
  }, []);

  const canSubmit = useMemo(() => {
    const formReady =
      form.name.trim().length > 1 &&
      form.email.includes("@") &&
      form.message.trim().length > 9 &&
      form.consent;

    const securityReady = !needsTurnstile || turnstileToken.length > 0;

    return formReady && securityReady;
  }, [form, needsTurnstile, turnstileToken]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileRenderKey((value) => value + 1);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setStatus("error");

      if (needsTurnstile && !turnstileToken) {
        setMessage("Please complete the security check before sending your request.");
      } else {
        setMessage("Please complete the required fields and consent checkbox.");
      }

      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          turnstileToken,
          trackingContext: getTrackingContext(),
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Message could not be sent.");
      }

      setStatus("success");
      setMessage(result.message || "Thanks. Your message has been received.");
      setForm(initialState);
      resetTurnstile();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      resetTurnstile();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-full min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-950 sm:rounded-[2rem] sm:p-8"
    >
      <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 sm:mb-6 sm:tracking-[0.2em]">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secure request
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4">
        <label className="space-y-2">
          <span className="text-sm font-black text-slate-950 dark:text-white">Name *</span>
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white min-h-12 px-4 py-3 text-base font-semibold sm:text-sm text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="Your name"
            autoComplete="name"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-slate-950 dark:text-white">Email *</span>
          <input
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white min-h-12 px-4 py-3 text-base font-semibold sm:text-sm text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="you@example.com"
            autoComplete="email"
            type="email"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-slate-950 dark:text-white">Website URL</span>
          <input
            value={form.website}
            onChange={(event) => updateField("website", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white min-h-12 px-4 py-3 text-base font-semibold sm:text-sm text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="https://example.com"
            autoComplete="url"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-slate-950 dark:text-white">Service needed</span>
          <select
            value={form.serviceInterest}
            onChange={(event) => updateField("serviceInterest", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white min-h-12 px-4 py-3 text-base font-semibold sm:text-sm text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            <option>Free Tracking Review</option>
            <option>Google Ads Conversion Tracking</option>
            <option>GA4 & GTM Audit</option>
            <option>Server-Side Tracking</option>
            <option>Meta CAPI Setup</option>
            <option>Not sure yet</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-slate-950 dark:text-white">Company</span>
          <input
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white min-h-12 px-4 py-3 text-base font-semibold sm:text-sm text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="Company name"
            autoComplete="organization"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-slate-950 dark:text-white">Phone / WhatsApp</span>
          <input
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white min-h-12 px-4 py-3 text-base font-semibold sm:text-sm text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="Optional"
            autoComplete="tel"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-black text-slate-950 dark:text-white">
          What tracking issue should I review? *
        </span>
        <textarea
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          className="min-h-32 w-full max-w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:min-h-36 sm:text-sm"
          placeholder="Example: Google Ads leads are not matching GA4, enhanced conversions may be missing, or Meta CAPI is not verified..."
          required
        />
      </label>

      <input
        type="text"
        value={form.honeypot}
        onChange={(event) => updateField("honeypot", event.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <label className="mt-5 flex max-w-full gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(event) => updateField("consent", event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
          required
        />
        <span className="min-w-0 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
          I agree to be contacted about my request and understand that submitted details may be processed according to the{" "}
          <Link href="/privacy-policy" className="font-black text-blue-600 dark:text-blue-300">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {turnstileSiteKey && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            Security check
          </div>

          <div className="max-w-full overflow-hidden rounded-xl">
            <Turnstile
              key={turnstileRenderKey}
              siteKey={turnstileSiteKey}
              options={{
                theme: "auto",
                size: "normal",
              }}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken("")}
              onExpire={() => setTurnstileToken("")}
            />
          </div>

          <p className="mt-3 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
            This check helps protect the contact form from spam and automated abuse.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`mt-5 rounded-2xl border p-4 text-sm font-bold ${
            status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {status === "success" && <CheckCircle2 className="mr-2 inline h-4 w-4" />}
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || status === "submitting"}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending request...
          </>
        ) : (
          <>
            Send Tracking Request
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}