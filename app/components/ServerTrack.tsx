"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type TrackingPayload = Record<string, unknown>;

type StoredSession = {
  id?: string;
  updatedAt?: number;
};

const ANONYMOUS_ID_KEY = "tfp_anon_id";
const SHARED_ANONYMOUS_ID_KEY = "tfp_first_party_analytics_id";
const ANONYMOUS_ID_COOKIE = "tfp_aid";
const GA_SESSION_KEY = "tfp_ga_session";
const GA_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

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

function buildTrackingContext(eventName: string, extra: TrackingPayload = {}) {
  const params = new URLSearchParams(window.location.search);

  return {
    eventName,
    eventId: `${eventName}_${Date.now()}_${Math.random().toString(16).slice(2)}`,

    pageTitle: document.title,
    pageLocation: window.location.href,
    pagePath: window.location.pathname,
    pageSearch: window.location.search,
    referrer:
      document.referrer || safeGetSessionStorage("tfp_first_referrer") || "",
    landingPage:
      safeGetSessionStorage("tfp_landing_page") || window.location.href,

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
    transport: "client_server_track",

    ...extra,
  };
}

function sendServerTrack(payload: TrackingPayload) {
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

export default function ServerTrack() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef("");

  useEffect(() => {
    saveAttributionFromUrl();

    const currentUrl = `${pathname}?${searchParams.toString()}`;

    if (lastTrackedUrl.current === currentUrl) {
      return;
    }

    lastTrackedUrl.current = currentUrl;

    sendServerTrack(buildTrackingContext("page_view"));
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest(
        "[data-track-event]",
      ) as HTMLElement | null;

      if (!element) return;

      const eventName = element.dataset.trackEvent || "cta_click";

      sendServerTrack(
        buildTrackingContext(eventName, {
          clickText: element.textContent?.trim() || "",
          clickHref: element instanceof HTMLAnchorElement ? element.href : "",
          clickLocation: element.dataset.trackLocation || "",
        }),
      );
    };

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}
