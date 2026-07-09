"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";

const TurnstileWidget = dynamic(
  () => import("@marsidev/react-turnstile").then((module) => module.Turnstile),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[65px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-center text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Loading security check...
      </div>
    ),
  },
);

type FormState = {
  name: string;
  email: string;
  website: string;
  company: string;
  phone: string;
  issue: string;
  platforms: string;
  adSpend: string;
  documentLink: string;
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
  issue: "",
  platforms: "Google Ads + GA4 + GTM",
  adSpend: "",
  documentLink: "",
  message: "",
  consent: false,
  honeypot: "",
};

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const allowedFileTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

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

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowedFile(file: File) {
  const fileName = file.name.toLowerCase();
  const hasAllowedType = allowedFileTypes.includes(file.type);
  const hasAllowedExtension = allowedExtensions.some((extension) => fileName.endsWith(extension));
  return hasAllowedType || hasAllowedExtension;
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block min-w-0 space-y-2">
      <span className="block text-[11px] font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400 sm:text-xs sm:tracking-[0.16em]">
        {label} {required && <span className="text-blue-600 dark:text-blue-300">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function FreeAuditRequestForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const needsTurnstile = Boolean(turnstileSiteKey);
  const [securityCheckRequested, setSecurityCheckRequested] = useState(false);
  const shouldRenderTurnstile = needsTurnstile && securityCheckRequested;
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
      form.website.trim().length > 4 &&
      form.issue.trim().length > 0 &&
      form.message.trim().length > 9 &&
      form.consent &&
      !attachmentError;

    const securityReady = !needsTurnstile || turnstileToken.length > 0;

    return formReady && securityReady;
  }, [attachmentError, form, needsTurnstile, turnstileToken]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    if (needsTurnstile) setSecurityCheckRequested(true);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileRenderKey((value) => value + 1);
  };

  function resetAttachment() {
    setAttachment(null);
    setAttachmentError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    if (needsTurnstile) setSecurityCheckRequested(true);
    const file = event.target.files?.[0] || null;
    setAttachmentError("");
    setAttachment(null);

    if (!file) return;

    if (!isAllowedFile(file)) {
      setAttachmentError("Only JPG, PNG, WEBP, or PDF files are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setAttachmentError("The file is too large. Please upload one file under 2 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setAttachment(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      if (needsTurnstile) setSecurityCheckRequested(true);
      setStatus("error");

      if (attachmentError) {
        setMessage(attachmentError);
      } else if (needsTurnstile && !turnstileToken) {
        setMessage("Please complete the security check before sending your audit request.");
      } else {
        setMessage("Please complete the required fields and consent checkbox.");
      }

      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      formData.set("consent", form.consent ? "true" : "false");
      formData.append("turnstileToken", turnstileToken);
      formData.append("trackingContext", JSON.stringify(getTrackingContext()));

      if (attachment) {
        formData.append("attachment", attachment, attachment.name);
      }

      const response = await fetch("/api/free-audit-request", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Free audit request could not be sent.");
      }

      setStatus("success");
      setMessage(
        result.message ||
          "Thanks. Your free tracking audit request has been received. I will review the details and contact you with the next step.",
      );
      setForm(initialState);
      setSecurityCheckRequested(false);
      resetAttachment();
      resetTurnstile();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      resetTurnstile();
    }
  }

  return (
    <div id="audit-request" className="relative mx-auto w-full max-w-xl min-w-0 scroll-mt-24 sm:scroll-mt-28">
      <div className="pointer-events-none absolute -inset-2 rounded-[2rem] bg-blue-600/10 blur-2xl sm:-inset-4 sm:rounded-[2.5rem]" />
      <form
        onSubmit={handleSubmit}
        onFocusCapture={() => {
          if (needsTurnstile) setSecurityCheckRequested(true);
        }}
        onPointerDownCapture={() => {
          if (needsTurnstile) setSecurityCheckRequested(true);
        }}
        className="relative w-full max-w-full overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 sm:rounded-[1.75rem]"
      >
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-4 text-white dark:border-slate-800 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200 sm:tracking-[0.22em]">Secure audit request</p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-white sm:text-2xl">
                Request your free tracking review
              </h2>
              <p className="mt-2 text-[13px] font-semibold leading-6 text-blue-100/90 sm:text-sm">
                Fill in the essentials first. Optional screenshot/PDF can be attached under 2 MB for tracking or dashboard evidence.
              </p>
            </div>
            <span className="hidden rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-100 sm:inline-flex">
              Free
            </span>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Field label="Your name" htmlFor="name" required>
              <input
                id="name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                type="text"
                placeholder="Your name"
                autoComplete="name"
                required
                className="min-h-12 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
              />
            </Field>

            <Field label="Email" htmlFor="email" required>
              <input
                id="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="min-h-12 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
              />
            </Field>
          </div>

          <Field label="Website URL" htmlFor="website" required>
            <input
              id="website"
              value={form.website}
              onChange={(event) => updateField("website", event.target.value)}
              type="url"
              placeholder="https://example.com"
              autoComplete="url"
              required
              className="min-h-12 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
            />
          </Field>

          <Field label="Main tracking concern" htmlFor="issue" required>
            <select
              id="issue"
              value={form.issue}
              onChange={(event) => updateField("issue", event.target.value)}
              required
              className="min-h-12 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
            >
              <option value="" disabled>
                Select an issue
              </option>
              <option value="Google Ads conversion tracking not working">Google Ads conversion tracking not working</option>
              <option value="GA4 and Google Ads mismatch">GA4 and Google Ads mismatch</option>
              <option value="GTM tags or triggers issue">GTM tags or triggers issue</option>
              <option value="Enhanced conversions review">Enhanced conversions review</option>
              <option value="Meta CAPI or Pixel issue">Meta CAPI or Pixel issue</option>
              <option value="Server-side tracking validation">Server-side tracking validation</option>
              <option value="Looker Studio dashboard or reporting issue">Looker Studio dashboard or reporting issue</option>
              <option value="Not sure yet">Not sure yet</option>
            </select>
          </Field>

          <Field label="Short note" htmlFor="message" required>
            <textarea
              id="message"
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              rows={4}
              placeholder="Example: Google Ads shows fewer conversions than GA4, form submissions are not counted, or the Looker Studio dashboard does not match source data."
              required
              className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />
          </Field>

          <details className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <summary className="cursor-pointer text-sm font-black leading-6 text-slate-900 dark:text-white">
              <span className="block sm:inline">Optional details, screenshot or PDF</span>
              <span className="mt-1 block text-xs font-bold leading-5 text-slate-500 dark:text-slate-400 sm:ml-2 sm:mt-0 sm:inline">Company, phone, ad spend, document link, attachment</span>
            </summary>

            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <Field label="Company" htmlFor="company">
                  <input
                    id="company"
                    value={form.company}
                    onChange={(event) => updateField("company", event.target.value)}
                    type="text"
                    placeholder="Company name"
                    autoComplete="organization"
                    className="min-h-12 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
                  />
                </Field>

                <Field label="Phone / WhatsApp" htmlFor="phone">
                  <input
                    id="phone"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    type="text"
                    placeholder="Optional"
                    autoComplete="tel"
                    className="min-h-12 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <Field label="Platforms used" htmlFor="platforms">
                  <select
                    id="platforms"
                    value={form.platforms}
                    onChange={(event) => updateField("platforms", event.target.value)}
                    className="min-h-12 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  >
                    <option>Google Ads + GA4 + GTM</option>
                    <option>Google Ads only</option>
                    <option>GA4 + GTM</option>
                    <option>Meta Pixel / CAPI</option>
                    <option>Looker Studio dashboard</option>
                    <option>Shopify / ecommerce tracking</option>
                    <option>WordPress / form tracking</option>
                    <option>Not sure</option>
                  </select>
                </Field>

                <Field label="Monthly ad spend" htmlFor="adSpend">
                  <select
                    id="adSpend"
                    value={form.adSpend}
                    onChange={(event) => updateField("adSpend", event.target.value)}
                    className="min-h-12 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  >
                    <option value="">Select range</option>
                    <option value="Under $1,000/month">Under $1,000/month</option>
                    <option value="$1,000–$5,000/month">$1,000–$5,000/month</option>
                    <option value="$5,000–$15,000/month">$5,000–$15,000/month</option>
                    <option value="$15,000+/month">$15,000+/month</option>
                    <option value="Not running ads yet">Not running ads yet</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </Field>
              </div>

              <Field label="Optional document link" htmlFor="documentLink">
                <input
                  id="documentLink"
                  value={form.documentLink}
                  onChange={(event) => updateField("documentLink", event.target.value)}
                  type="url"
                  placeholder="Google Drive, Dropbox, Loom, or screenshot link"
                  className="min-h-12 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
                />
              </Field>

              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-blue-300">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label htmlFor="attachment" className="block text-sm font-black text-slate-950 dark:text-white">
                      Optional screenshot / PDF attachment
                    </label>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                      Upload one JPG, PNG, WEBP, or PDF under 2 MB. Do not upload passwords, private keys, or sensitive customer data.
                    </p>
                    <input
                      ref={fileInputRef}
                      id="attachment"
                      name="attachment"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleAttachmentChange}
                      className="mt-3 block w-full max-w-full cursor-pointer rounded-xl border border-blue-100 bg-white text-xs font-bold text-slate-600 file:mr-3 file:border-0 file:bg-slate-950 file:px-3 file:py-3 file:text-xs file:font-black file:text-white hover:file:bg-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 sm:file:px-4"
                    />

                    {attachment && (
                      <div className="mt-3 flex min-w-0 items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-300">
                        <span className="flex min-w-0 items-center gap-2">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{attachment.name}</span>
                          <span className="flex-shrink-0 text-slate-400">({formatBytes(attachment.size)})</span>
                        </span>
                        <button
                          type="button"
                          onClick={resetAttachment}
                          className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-900"
                          aria-label="Remove attachment"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {attachmentError && (
                      <p className="mt-3 flex items-center gap-2 text-xs font-black text-red-600 dark:text-red-300">
                        <XCircle className="h-4 w-4" /> {attachmentError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </details>

          <input
            type="text"
            value={form.honeypot}
            onChange={(event) => updateField("honeypot", event.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <label className="flex min-w-0 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(event) => updateField("consent", event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
              required
            />
            <span className="text-[13px] font-medium leading-6 text-slate-600 dark:text-slate-400 sm:text-sm">
              I agree to be contacted about this free audit request and understand the first review uses public browser-visible evidence. I agree to the{" "}
              <Link href="/privacy-policy" className="font-black text-blue-600 dark:text-blue-300">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {shouldRenderTurnstile && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                Security check
              </div>

              <div className="max-w-full overflow-hidden rounded-xl">
                <TurnstileWidget
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
                This check helps protect the free audit form from spam and automated abuse.
              </p>
            </div>
          )}

          {message && (
            <div
              className={`rounded-2xl border p-4 text-sm font-bold ${
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
            className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending audit request...
              </>
            ) : (
              <>
                Request My Free Tracking Audit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          <div className="flex min-w-0 items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
            <Paperclip className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
            <span>
             Files are sent by email only and are not stored on our website.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
