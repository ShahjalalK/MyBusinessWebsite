"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type TrackingPayload = Record<string, unknown>;

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

  if (!ga) {
    return "";
  }

  const parts = ga.split(".");

  if (parts.length >= 4) {
    return `${parts[2]}.${parts[3]}`;
  }

  return ga;
}

function getOrCreateAnonymousId() {
  if (typeof window === "undefined") return "";

  const key = "tfp_anon_id";
  const existing = localStorage.getItem(key);

  if (existing) return existing;

  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `anon_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(key, value);
  return value;
}

function saveAttributionFromUrl() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);

  if (!sessionStorage.getItem("tfp_landing_page")) {
    sessionStorage.setItem("tfp_landing_page", window.location.href);
  }

  if (!sessionStorage.getItem("tfp_first_referrer")) {
    sessionStorage.setItem("tfp_first_referrer", document.referrer || "");
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
      sessionStorage.setItem(`tfp_${key}`, value);
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
    referrer: document.referrer || sessionStorage.getItem("tfp_first_referrer") || "",
    landingPage: sessionStorage.getItem("tfp_landing_page") || window.location.href,

    utm_source: params.get("utm_source") || sessionStorage.getItem("tfp_utm_source") || "",
    utm_medium: params.get("utm_medium") || sessionStorage.getItem("tfp_utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || sessionStorage.getItem("tfp_utm_campaign") || "",
    utm_term: params.get("utm_term") || sessionStorage.getItem("tfp_utm_term") || "",
    utm_content: params.get("utm_content") || sessionStorage.getItem("tfp_utm_content") || "",

    gclid: params.get("gclid") || sessionStorage.getItem("tfp_gclid") || "",
    fbclid: params.get("fbclid") || sessionStorage.getItem("tfp_fbclid") || "",
    msclkid: params.get("msclkid") || sessionStorage.getItem("tfp_msclkid") || "",

    gaClientId: getGaClientId(),
    anonymousId: getOrCreateAnonymousId(),
    fbp: getCookie("_fbp"),
    fbc: getCookie("_fbc"),

    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    language: navigator.language || "",
    languages: navigator.languages?.join(", ") || "",
    platform: navigator.platform || "",
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${window.screen.width}x${window.screen.height}`,
    devicePixelRatio: window.devicePixelRatio,
    colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || "",

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
      const element = target?.closest("[data-track-event]") as HTMLElement | null;

      if (!element) return;

      const eventName = element.dataset.trackEvent || "cta_click";

      sendServerTrack(
        buildTrackingContext(eventName, {
          clickText: element.textContent?.trim() || "",
          clickHref: element instanceof HTMLAnchorElement ? element.href : "",
          clickLocation: element.dataset.trackLocation || "",
        })
      );
    };

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}