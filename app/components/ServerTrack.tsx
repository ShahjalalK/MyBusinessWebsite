"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type TrackingPayload = Record<string, unknown>;

type StoredSession = {
  id?: string;
  updatedAt?: number;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const ANONYMOUS_ID_KEY = "tfp_anon_id";
const SHARED_ANONYMOUS_ID_KEY = "tfp_first_party_analytics_id";
const ANONYMOUS_ID_COOKIE = "tfp_aid";
const GA_SESSION_KEY = "tfp_ga_session";
const GA_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const SCROLL_DEPTH_MARKS = [25, 50, 75, 90] as const;
const ENGAGEMENT_MARKS_SECONDS = [15, 30, 60] as const;

function isBrowserAvailable() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function safeGetStorage(key: string) {
  if (!isBrowserAvailable()) return "";

  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeSetStorage(key: string, value: string) {
  if (!isBrowserAvailable() || !value) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Some browser/privacy modes block localStorage.
  }
}

function safeGetSessionStorage(key: string) {
  if (!isBrowserAvailable()) return "";

  try {
    return window.sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeSetSessionStorage(key: string, value: string) {
  if (!isBrowserAvailable() || !value) return;

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Some browser/privacy modes block sessionStorage.
  }
}

function readCookie(name: string) {
  if (!isBrowserAvailable()) return "";

  const prefix = `${encodeURIComponent(name)}=`;
  const parts = String(document.cookie || "").split(";");

  for (const part of parts) {
    const item = part.trim();
    if (item.startsWith(prefix))
      return decodeURIComponent(item.slice(prefix.length));
  }

  return "";
}

function writeCookie(name: string, value: string) {
  if (!isBrowserAvailable() || !value) return;

  const maxAgeSeconds = 60 * 60 * 24 * 365;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value,
  )}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

function cleanClientId(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[\u0000-\u001F\u007F\s]+/g, "")
    .slice(0, 200);
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
}

function getCookie(name: string) {
  return readCookie(name);
}

function getGaClientId() {
  const ga = getCookie("_ga");

  if (!ga) return "";

  const match = ga.match(/GA\d+\.\d+\.(.+)$/);
  if (match?.[1]) return cleanClientId(match[1]);

  const parts = ga.split(".");
  if (parts.length >= 4) return cleanClientId(`${parts[2]}.${parts[3]}`);

  return cleanClientId(ga);
}

function createStableId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();

  return `anon_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function persistAnonymousId(value: string) {
  const id = cleanClientId(value);
  if (!id) return "";

  safeSetStorage(ANONYMOUS_ID_KEY, id);
  safeSetStorage(SHARED_ANONYMOUS_ID_KEY, id);
  writeCookie(ANONYMOUS_ID_COOKIE, id);

  return id;
}

function getOrCreateAnonymousId() {
  if (!isBrowserAvailable()) return "";

  const existing = cleanClientId(
    safeGetStorage(ANONYMOUS_ID_KEY) ||
      safeGetStorage(SHARED_ANONYMOUS_ID_KEY) ||
      readCookie(ANONYMOUS_ID_COOKIE),
  );

  if (existing) return persistAnonymousId(existing);

  return persistAnonymousId(createStableId());
}

function parseStoredSession(value: string): StoredSession | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as StoredSession;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function getOrCreateGaSessionId() {
  if (!isBrowserAvailable()) return "";

  const now = Date.now();
  const stored = parseStoredSession(safeGetSessionStorage(GA_SESSION_KEY));
  const existingId = cleanClientId(stored?.id || "");
  const updatedAt = Number(stored?.updatedAt || 0);

  if (existingId && now - updatedAt < GA_SESSION_TIMEOUT_MS) {
    safeSetSessionStorage(
      GA_SESSION_KEY,
      JSON.stringify({ id: existingId, updatedAt: now }),
    );
    return existingId;
  }

  const nextId = String(Math.floor(now / 1000));
  safeSetSessionStorage(
    GA_SESSION_KEY,
    JSON.stringify({ id: nextId, updatedAt: now }),
  );
  return nextId;
}

function saveAttributionFromUrl() {
  if (!isBrowserAvailable()) return;

  const params = new URLSearchParams(window.location.search);

  if (!safeGetSessionStorage("tfp_landing_page")) {
    safeSetSessionStorage("tfp_landing_page", window.location.href);
  }

  if (!safeGetSessionStorage("tfp_first_referrer")) {
    safeSetSessionStorage("tfp_first_referrer", document.referrer || "");
  }

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

    if (value) {
      safeSetSessionStorage(`tfp_${key}`, value);
    }
  });
}

function parsePathFromUrl(value: string) {
  if (!value) return "";

  try {
    return new URL(value).pathname || "/";
  } catch {
    return value.startsWith("/") ? value : "";
  }
}

function getPageLabel(pathname: string) {
  if (!pathname || pathname === "/") return "Home";

  const parts = pathname
    .split("/")
    .filter(Boolean)
    .slice(-2)
    .map((part) =>
      part
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    );

  return parts.join(" / ") || pathname;
}

function getDeviceCategory() {
  if (!isBrowserAvailable()) return "unknown";

  const width = window.innerWidth || 0;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getHostname(value: string) {
  if (!value) return "";

  try {
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function inferTrafficSource() {
  if (!isBrowserAvailable()) return "unknown";

  const params = new URLSearchParams(window.location.search);
  const utmSource = cleanText(
    params.get("utm_source") || safeGetSessionStorage("tfp_utm_source"),
  ).toLowerCase();

  if (utmSource) return utmSource;
  if (params.get("gclid") || safeGetSessionStorage("tfp_gclid")) return "google";
  if (params.get("fbclid") || safeGetSessionStorage("tfp_fbclid")) return "facebook";
  if (params.get("msclkid") || safeGetSessionStorage("tfp_msclkid")) return "bing";

  const referrer = document.referrer || safeGetSessionStorage("tfp_first_referrer") || "";
  const host = getHostname(referrer);

  if (!host) return "direct";
  if (host.includes("google.")) return "google";
  if (host.includes("bing.")) return "bing";
  if (host.includes("yahoo.")) return "yahoo";
  if (host.includes("duckduckgo.")) return "duckduckgo";
  if (host.includes("facebook.") || host === "fb.com") return "facebook";
  if (host.includes("instagram.")) return "instagram";
  if (host.includes("linkedin.")) return "linkedin";
  if (host.includes("youtube.")) return "youtube";
  if (host.includes("t.co") || host.includes("twitter.") || host.includes("x.com")) return "x_twitter";

  return "referral";
}

function inferTrafficMedium() {
  if (!isBrowserAvailable()) return "unknown";

  const params = new URLSearchParams(window.location.search);
  const utmMedium = cleanText(
    params.get("utm_medium") || safeGetSessionStorage("tfp_utm_medium"),
  ).toLowerCase();

  if (utmMedium) return utmMedium;
  if (params.get("gclid") || params.get("fbclid") || params.get("msclkid")) return "paid";

  const source = inferTrafficSource();
  if (source === "direct") return "direct";
  if (["google", "bing", "yahoo", "duckduckgo"].includes(source)) return "organic";
  if (["facebook", "instagram", "linkedin", "youtube", "x_twitter"].includes(source)) return "social";
  return "referral";
}

function getScrollPercent() {
  if (!isBrowserAvailable()) return 0;

  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
  );
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
  const maxScroll = Math.max(1, documentHeight - viewportHeight);
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;

  return Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));
}

function isSecureReportPage() {
  if (!isBrowserAvailable()) return false;
  return Boolean(document.querySelector("main[data-trackflow-secure-report]"));
}

function buildTrackingContext(eventName: string, extra: TrackingPayload = {}) {
  const params = new URLSearchParams(window.location.search);
  const landingPage = safeGetSessionStorage("tfp_landing_page") || window.location.href;
  const deviceCategory = getDeviceCategory();
  const trafficSource = inferTrafficSource();
  const trafficMedium = inferTrafficMedium();

  return {
    eventName,
    eventId: `${eventName}_${Date.now()}_${Math.random().toString(16).slice(2)}`,

    pageTitle: document.title,
    pageLocation: window.location.href,
    pagePath: window.location.pathname,
    pageSearch: window.location.search,
    pageLabel: getPageLabel(window.location.pathname),
    referrer:
      document.referrer || safeGetSessionStorage("tfp_first_referrer") || "",
    landingPage,
    landingPagePath: parsePathFromUrl(landingPage),

    trafficSource,
    trafficMedium,
    utm_source:
      params.get("utm_source") || safeGetSessionStorage("tfp_utm_source") || "",
    utm_medium:
      params.get("utm_medium") || safeGetSessionStorage("tfp_utm_medium") || "",
    utm_campaign:
      params.get("utm_campaign") ||
      safeGetSessionStorage("tfp_utm_campaign") ||
      "",
    utm_term:
      params.get("utm_term") || safeGetSessionStorage("tfp_utm_term") || "",
    utm_content:
      params.get("utm_content") ||
      safeGetSessionStorage("tfp_utm_content") ||
      "",

    gclid: params.get("gclid") || safeGetSessionStorage("tfp_gclid") || "",
    fbclid: params.get("fbclid") || safeGetSessionStorage("tfp_fbclid") || "",
    msclkid:
      params.get("msclkid") || safeGetSessionStorage("tfp_msclkid") || "",

    gaClientId: getGaClientId(),
    anonymousId: getOrCreateAnonymousId(),
    gaSessionId: getOrCreateGaSessionId(),
    fbp: getCookie("_fbp"),
    fbc: getCookie("_fbc"),

    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    language: navigator.language || "",
    languages: navigator.languages?.join(", ") || "",
    platform: navigator.platform || "",
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${window.screen.width}x${window.screen.height}`,
    devicePixelRatio: window.devicePixelRatio,
    colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || "",
    deviceCategory,
    deviceType: deviceCategory,
    transport: "client_server_track",

    ...extra,
  };
}

function pushDataLayer(payload: TrackingPayload) {
  if (!isBrowserAvailable()) return;

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "trackflow_server_track",
      trackflow_event_name: payload.eventName,
      trackflow_event_id: payload.eventId,
      trackflow_page_path: payload.pagePath,
      trackflow_page_label: payload.pageLabel,
      trackflow_traffic_source: payload.trafficSource,
      trackflow_traffic_medium: payload.trafficMedium,
      trackflow_device_category: payload.deviceCategory,
      trackflow_final_action: payload.finalAction,
      trackflow_scroll_percent: payload.scrollPercent,
      trackflow_time_on_page_seconds: payload.timeOnPageSeconds,
    });
  } catch {
    // Data layer support is optional and should never affect visitors.
  }
}

function sendServerTrack(payload: TrackingPayload) {
  if (!isBrowserAvailable()) return;

  pushDataLayer(payload);

  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    const sent = navigator.sendBeacon("/api/server-track", blob);

    if (sent) return;
  }

  fetch("/api/server-track", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Tracking should never break the user experience.
  });
}

function getElementText(element: HTMLElement) {
  return cleanText(
    element.dataset.trackLabel ||
      element.getAttribute("aria-label") ||
      element.getAttribute("title") ||
      element.textContent ||
      element.getAttribute("value") ||
      "Click",
    "Click",
  ).slice(0, 300);
}

function getElementHref(element: HTMLElement) {
  if (element instanceof HTMLAnchorElement) return element.href;
  const closestAnchor = element.closest("a[href]");
  if (closestAnchor instanceof HTMLAnchorElement) return closestAnchor.href;
  return element.getAttribute("href") || "";
}

function getSectionLabel(element: HTMLElement) {
  const explicit = element.dataset.trackLocation || element.dataset.trackSection || "";
  if (explicit) return explicit;

  const section = element.closest("section[id], footer, header, nav, main");
  if (!section) return "page";

  if (section instanceof HTMLElement && section.id) return section.id;
  return section.tagName.toLowerCase();
}

function inferClickEventName(element: HTMLElement, href: string) {
  const explicit = element.dataset.trackEvent || "";
  if (explicit) return explicit;

  const loweredHref = href.toLowerCase();
  const text = getElementText(element).toLowerCase();

  if (loweredHref.startsWith("tel:")) return "phone_click";
  if (loweredHref.startsWith("mailto:")) return "direct_email_click";
  if (loweredHref.includes("wa.me") || loweredHref.includes("whatsapp")) return "whatsapp_click";
  if (loweredHref.includes("calendly") || text.includes("book")) return "booking_click";
  if (loweredHref.includes("/free-tracking-audit")) return "free_audit_click";
  if (loweredHref.includes("/contact")) return "contact_click";
  if (loweredHref.includes("/tools/free-email-signature-generator")) return "signature_tool_click";

  if (href) {
    try {
      const url = new URL(href);
      if (url.hostname && url.hostname !== window.location.hostname) return "outbound_click";
      return "navigation_click";
    } catch {
      return "navigation_click";
    }
  }

  if (element instanceof HTMLButtonElement && element.type === "submit") return "form_submit_click";
  if (element instanceof HTMLInputElement && element.type === "submit") return "form_submit_click";

  return "button_click";
}

function getFinalAction(eventName: string) {
  if (["phone_click", "direct_email_click", "whatsapp_click", "booking_click"].includes(eventName)) return eventName;
  if (["free_audit_click", "contact_click", "form_submit_attempt", "form_submit_click"].includes(eventName)) return "lead_intent";
  if (eventName.includes("signature") || eventName.includes("copy")) return "tool_engagement";
  if (eventName === "outbound_click") return "outbound_click";
  return "engaged_visit";
}

function getClickPayload(element: HTMLElement, eventName: string, href: string) {
  return {
    clickText: getElementText(element),
    clickHref: href,
    clickLocation: getSectionLabel(element),
    eventSection: getSectionLabel(element),
    buttonLabel: getElementText(element),
    finalAction: element.dataset.trackFinalAction || getFinalAction(eventName),
    actionType: eventName,
    actionTarget: href || getElementText(element),
    elementTag: element.tagName.toLowerCase(),
    elementId: element.id || "",
    linkDomain: getHostname(href),
  };
}

function getFormPayload(form: HTMLFormElement) {
  const formName = cleanText(
    form.dataset.trackForm || form.getAttribute("name") || form.id || "website_form",
    "website_form",
  );

  return {
    formName,
    formId: form.id || "",
    formAction: form.action || "",
    formMethod: form.method || "",
    eventSection: getSectionLabel(form),
    finalAction: "lead_intent",
    actionType: "form_submit_attempt",
    actionTarget: formName,
  };
}

export default function ServerTrack() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef("");
  const journeyStepRef = useRef(0);
  const pageViewIndexRef = useRef(0);

  function trackJourneyEvent(eventName: string, extra: TrackingPayload = {}) {
    journeyStepRef.current += 1;

    sendServerTrack(
      buildTrackingContext(eventName, {
        journeyIndex: journeyStepRef.current,
        journeyStep: String(journeyStepRef.current),
        ...extra,
      }),
    );
  }

  useEffect(() => {
    saveAttributionFromUrl();

    const search = searchParams.toString();
    const currentUrl = `${pathname}${search ? `?${search}` : ""}`;

    if (lastTrackedUrl.current === currentUrl) {
      return;
    }

    lastTrackedUrl.current = currentUrl;
    pageViewIndexRef.current += 1;

    const startedAt = Date.now();
    const pageSnapshot = {
      pageTitle: document.title,
      pageLocation: window.location.href,
      pagePath: window.location.pathname,
      pageSearch: window.location.search,
      pageLabel: getPageLabel(window.location.pathname),
      pageViewIndex: pageViewIndexRef.current,
      maxScrollPercent: getScrollPercent(),
    };

    trackJourneyEvent("page_view", pageSnapshot);

    if (isSecureReportPage()) {
      return;
    }

    const firedScrollMarks = new Set<number>();
    let ticking = false;
    let maxScrollPercent = getScrollPercent();
    let pageExitSent = false;

    function fireScrollCheck() {
      ticking = false;
      const percent = getScrollPercent();
      maxScrollPercent = Math.max(maxScrollPercent, percent);

      SCROLL_DEPTH_MARKS.forEach((mark) => {
        if (percent >= mark && !firedScrollMarks.has(mark)) {
          firedScrollMarks.add(mark);
          trackJourneyEvent("scroll_depth", {
            ...pageSnapshot,
            scrollPercent: mark,
            maxScrollPercent,
            finalAction: "scroll_depth",
            actionType: `scroll_${mark}`,
            eventSection: "scroll",
            buttonLabel: `${mark}% scroll`,
          });
        }
      });
    }

    function requestScrollCheck() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(fireScrollCheck);
    }

    function sendPageExit(durationEventType = "page_exit") {
      if (pageExitSent) return;
      const milliseconds = Math.max(0, Date.now() - startedAt);
      if (milliseconds < 2500 && maxScrollPercent < 25) return;

      pageExitSent = true;
      trackJourneyEvent("page_engagement", {
        ...pageSnapshot,
        durationEventType,
        timeOnPageSeconds: Math.round(milliseconds / 1000),
        timeOnPageMilliseconds: milliseconds,
        timeOnReportSeconds: Math.round(milliseconds / 1000),
        timeOnReportMilliseconds: milliseconds,
        scrollPercent: maxScrollPercent,
        maxScrollPercent,
        finalAction: "engaged_visit",
        actionType: durationEventType,
        eventSection: "engagement",
        buttonLabel: `${Math.round(milliseconds / 1000)}s active time`,
      });
    }

    const engagementTimers = ENGAGEMENT_MARKS_SECONDS.map((seconds) =>
      window.setTimeout(() => {
        trackJourneyEvent("page_engagement", {
          ...pageSnapshot,
          durationEventType: `${seconds}s_engagement`,
          timeOnPageSeconds: seconds,
          timeOnPageMilliseconds: seconds * 1000,
          timeOnReportSeconds: seconds,
          timeOnReportMilliseconds: seconds * 1000,
          scrollPercent: maxScrollPercent,
          maxScrollPercent,
          finalAction: "engaged_visit",
          actionType: `${seconds}s_engagement`,
          eventSection: "engagement",
          buttonLabel: `${seconds}s engagement`,
        });
      }, seconds * 1000),
    );

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") sendPageExit("visibility_hidden");
    }

    function onPageHide() {
      sendPageExit("pagehide");
    }

    window.addEventListener("scroll", requestScrollCheck, { passive: true });
    window.addEventListener("resize", requestScrollCheck);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.setTimeout(fireScrollCheck, 800);

    return () => {
      engagementTimers.forEach((timer) => window.clearTimeout(timer));
      sendPageExit("route_change");
      window.removeEventListener("scroll", requestScrollCheck);
      window.removeEventListener("resize", requestScrollCheck);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const element = target.closest<HTMLElement>(
        "[data-track-event], a[href], button, [role='button'], input[type='submit'], input[type='button']",
      );

      if (!element) return;

      const hasExplicitTracking = Boolean(element.dataset.trackEvent);

      if (!hasExplicitTracking && element.closest("main[data-trackflow-secure-report]")) {
        return;
      }

      const href = getElementHref(element);
      const eventName = inferClickEventName(element, href);

      trackJourneyEvent(eventName, getClickPayload(element, eventName, href));
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.closest("main[data-trackflow-secure-report]")) return;

      const eventName = form.dataset.trackEvent || "form_submit_attempt";
      trackJourneyEvent(eventName, getFormPayload(form));
    };

    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("submit", handleSubmit, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("submit", handleSubmit, { capture: true });
    };
  }, []);

  return null;
}
