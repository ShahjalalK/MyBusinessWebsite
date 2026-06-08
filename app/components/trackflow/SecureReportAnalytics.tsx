"use client";

// ============================================================
// FILE: app/components/trackflow/SecureReportAnalytics.tsx
// Purpose: First-party secure-report behavior events for GA4 MP.
// Notes:
// - Sends to TrackFlow's own API first, then the server forwards to GA4.
// - Does not expose the raw report token to GA4.
// - Respects Global Privacy Control / Do Not Track.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";

type SecureReportAnalyticsProps = {
  token: string;
  domainSlug: string;
  companyName?: string;
  headline?: string;
  primaryActionLabel?: string;
  primaryPageLabel?: string;
  evidenceVideoId?: string;
  endpoint?: string;
};

type TrackEventInput = {
  eventName: string;
  eventSection?: string;
  buttonLabel?: string;
  clickHref?: string;
  videoId?: string;
  videoProgress?: number;
  scrollPercent?: number;
  extra?: Record<string, string | number | boolean | undefined>;
};

type YouTubePlayerEvent = {
  target?: {
    getDuration?: () => number;
    getCurrentTime?: () => number;
  };
  data?: number;
};

type YouTubePlayerConstructor = new (
  element: HTMLIFrameElement | string,
  options: {
    events?: {
      onStateChange?: (event: YouTubePlayerEvent) => void;
    };
  },
) => {
  getDuration?: () => number;
  getCurrentTime?: () => number;
};

type YouTubeApiWindow = Window & {
  YT?: {
    Player?: YouTubePlayerConstructor;
    PlayerState?: {
      PLAYING?: number;
      PAUSED?: number;
      ENDED?: number;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
};

type PrivacyNavigator = Navigator & {
  globalPrivacyControl?: boolean;
};

const ANONYMOUS_ID_KEY = "tfp_first_party_analytics_id";
const ANONYMOUS_ID_COOKIE = "tfp_aid";
const REPORT_SESSION_PREFIX = "tfp_report_session_";
const CONSENT_SKIP_KEY = "tfp_analytics_disabled";
const EVENT_SESSION_PREFIX = "tfp_event_once_";
const DEFAULT_ENDPOINT = "/api/report-event";
const FALLBACK_ENDPOINT = "/api/server-track";
const YOUTUBE_PROGRESS_MARKS = [25, 50, 75] as const;

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function sanitizeEventName(value: string) {
  return cleanText(value, "secure_report_event")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "secure_report_event";
}

function sanitizeParam(value: unknown, max = 120) {
  return cleanText(value, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, max);
}

function normalizeToken(value: string) {
  return cleanText(value, "unknown")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96) || "unknown";
}

function simpleHash(input: string) {
  let hash = 0x811c9dc5;
  const text = String(input || "trackflow-report");

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function shortHash(input: string, length = 12) {
  return simpleHash(input).padStart(8, "0").slice(0, Math.max(8, Math.min(16, length)));
}

function visitorLabelFromAnonymousId(anonymousId: string) {
  return anonymousId ? `vis_${shortHash(anonymousId, 12)}` : "vis_unknown";
}

function reportVisitorLabel(reportId: string, anonymousId: string) {
  if (!reportId || !anonymousId) return "";
  return `${reportId}_v_${shortHash(`${reportId}:${anonymousId}`, 12)}`.slice(0, 80);
}

function getReportSessionId(token: string) {
  if (typeof window === "undefined" || hasPrivacyOptOut()) return "";

  const key = `${REPORT_SESSION_PREFIX}${normalizeToken(token)}`;

  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;

    const next = `ses_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 10)}`;
    window.sessionStorage.setItem(key, next);
    return next;
  } catch {
    return `ses_${shortHash(`${normalizeToken(token)}:${Date.now()}:${Math.random()}`, 12)}`;
  }
}

type EventJourneyMeta = {
  visitStage: string;
  journeyStep: string;
  intentLevel: "low" | "medium" | "high" | "hot";
  intentScore: number;
  isCoreEvent: boolean;
};

function getEventJourneyMeta(eventName: string): EventJourneyMeta {
  const name = sanitizeEventName(eventName);

  if (name.includes("booking")) {
    return { visitStage: "booking", journeyStep: "08_booking_clicked", intentLevel: "hot", intentScore: 95, isCoreEvent: true };
  }

  if (name.includes("email") || name.includes("linkedin")) {
    return { visitStage: "contact", journeyStep: "07_contact_clicked", intentLevel: "high", intentScore: 85, isCoreEvent: true };
  }

  if (name.includes("assistant_message_sent")) {
    return { visitStage: "chat", journeyStep: "06_chat_message_sent", intentLevel: "high", intentScore: 80, isCoreEvent: true };
  }

  if (name.includes("assistant_question_click") || name.includes("assistant_open")) {
    return { visitStage: "chat", journeyStep: "05_chat_engaged", intentLevel: "medium", intentScore: 55, isCoreEvent: false };
  }

  if (name.includes("pdf_download")) {
    return { visitStage: "pdf", journeyStep: "04_pdf_downloaded", intentLevel: "high", intentScore: 75, isCoreEvent: true };
  }

  if (name.includes("pdf_open") || name.includes("pdf_preview")) {
    return { visitStage: "pdf", journeyStep: "03_pdf_viewed", intentLevel: "medium", intentScore: 45, isCoreEvent: true };
  }

  if (name.includes("video_progress_75") || name.includes("video_complete")) {
    return { visitStage: "video", journeyStep: "04_video_deep_watch", intentLevel: "high", intentScore: 70, isCoreEvent: false };
  }

  if (name.includes("video_start") || name.includes("video_progress") || name.includes("video_visible")) {
    return { visitStage: "video", journeyStep: "03_video_engaged", intentLevel: "medium", intentScore: 50, isCoreEvent: false };
  }

  if (name.includes("scroll_90")) {
    return { visitStage: "reading", journeyStep: "03_deep_scroll", intentLevel: "medium", intentScore: 40, isCoreEvent: false };
  }

  if (name.includes("scroll_50")) {
    return { visitStage: "reading", journeyStep: "02_mid_scroll", intentLevel: "low", intentScore: 25, isCoreEvent: false };
  }

  return { visitStage: "view", journeyStep: "01_report_viewed", intentLevel: "low", intentScore: 10, isCoreEvent: true };
}

async function hashReportId(token: string) {
  const normalized = normalizeToken(token);

  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const bytes = new TextEncoder().encode(`trackflow-report:${normalized}`);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const hex = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 12);
      return `rpt_${hex}`;
    }
  } catch {
    // Fallback below.
  }

  return `rpt_${simpleHash(normalized)}`;
}

function createUuidLike() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const prefix = `${encodeURIComponent(name)}=`;
  const parts = String(document.cookie || "").split(";");

  for (const part of parts) {
    const item = part.trim();
    if (item.startsWith(prefix)) return decodeURIComponent(item.slice(prefix.length));
  }

  return "";
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;

  const maxAgeSeconds = 60 * 60 * 24 * 180;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
}

function hasPrivacyOptOut() {
  if (typeof navigator === "undefined") return false;

  const nav = navigator as PrivacyNavigator;
  const dnt = String(nav.doNotTrack || "").toLowerCase();

  if (nav.globalPrivacyControl === true) return true;
  if (dnt === "1" || dnt === "yes") return true;

  try {
    return window.localStorage.getItem(CONSENT_SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

function getAnonymousId() {
  if (typeof window === "undefined") return "";
  if (hasPrivacyOptOut()) return "";

  try {
    const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
    if (existing) {
      writeCookie(ANONYMOUS_ID_COOKIE, existing);
      return existing;
    }
  } catch {
    // Storage can be blocked.
  }

  const cookieValue = readCookie(ANONYMOUS_ID_COOKIE);
  if (cookieValue) return cookieValue;

  const next = createUuidLike();
  try {
    window.localStorage.setItem(ANONYMOUS_ID_KEY, next);
  } catch {
    // Cookie fallback below.
  }
  writeCookie(ANONYMOUS_ID_COOKIE, next);

  return next;
}

function getDeviceType() {
  if (typeof navigator === "undefined" || typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent || "";
  const width = window.innerWidth || 0;
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|iphone|android.*mobile/i.test(ua) || width < 768) return "mobile";
  return "desktop";
}

function getGaClientId() {
  const cookie = readCookie("_ga");
  const match = cookie.match(/GA\d+\.\d+\.(.+)$/);
  return match?.[1] || "";
}

function getUrlParam(name: string) {
  try {
    return new URL(window.location.href).searchParams.get(name) || "";
  } catch {
    return "";
  }
}

function onePerSession(key: string) {
  try {
    const storageKey = `${EVENT_SESSION_PREFIX}${key}`;
    if (window.sessionStorage.getItem(storageKey)) return false;
    window.sessionStorage.setItem(storageKey, "1");
    return true;
  } catch {
    return true;
  }
}

function postWithBeacon(url: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (sent) return Promise.resolve({ ok: true, transport: "beacon" });
    }
  } catch {
    // Fallback to fetch below.
  }

  return fetch(url, {
    method: "POST",
    keepalive: true,
    cache: "no-store",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body,
  });
}

export default function SecureReportAnalytics({
  token,
  domainSlug,
  companyName = "",
  headline = "Private Tracking Review",
  primaryActionLabel = "Secure report engagement",
  primaryPageLabel = "Secure tracking review",
  evidenceVideoId = "",
  endpoint = DEFAULT_ENDPOINT,
}: SecureReportAnalyticsProps) {
  const [reportId, setReportId] = useState("");
  const reportIdRef = useRef("");
  const anonymousIdRef = useRef("");
  const reportSessionIdRef = useRef("");
  const sentEventIdsRef = useRef(new Set<string>());
  const youtubeProgressRef = useRef(new Set<number>());
  const endpointList = useMemo(() => {
    const cleanEndpoint = endpoint || DEFAULT_ENDPOINT;
    return cleanEndpoint === FALLBACK_ENDPOINT ? [cleanEndpoint] : [cleanEndpoint, FALLBACK_ENDPOINT];
  }, [endpoint]);

  useEffect(() => {
    let cancelled = false;

    hashReportId(token).then((nextReportId) => {
      if (cancelled) return;
      reportIdRef.current = nextReportId;
      setReportId(nextReportId);
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    anonymousIdRef.current = getAnonymousId();
    reportSessionIdRef.current = getReportSessionId(token);
  }, [token]);

  const sendEvent = useMemo(() => {
    return async ({
      eventName,
      eventSection = "secure_report",
      buttonLabel = "",
      clickHref = "",
      videoId = "",
      videoProgress,
      scrollPercent,
      extra = {},
    }: TrackEventInput) => {
      if (typeof window === "undefined" || hasPrivacyOptOut()) return;

      const name = sanitizeEventName(eventName);
      const eventId = `${reportIdRef.current || "rpt_pending"}_${name}_${Date.now()}_${Math.random()
        .toString(16)
        .slice(2, 8)}`;

      if (sentEventIdsRef.current.has(eventId)) return;
      sentEventIdsRef.current.add(eventId);

      const url = new URL(window.location.href);
      const journeyMeta = getEventJourneyMeta(name);
      const visitorId = visitorLabelFromAnonymousId(anonymousIdRef.current);
      const reportVisitorId = reportVisitorLabel(reportIdRef.current, anonymousIdRef.current);

      const payload = {
        eventName: name,
        eventId,
        pageTitle: document.title || headline,
        pageLocation: url.href.slice(0, 1200),
        pagePath: url.pathname,
        pageSearch: url.search,
        referrer: document.referrer || "",
        landingPage: window.location.href,

        utm_source: getUrlParam("utm_source"),
        utm_medium: getUrlParam("utm_medium"),
        utm_campaign: getUrlParam("utm_campaign"),
        utm_term: getUrlParam("utm_term"),
        utm_content: getUrlParam("utm_content"),
        gclid: getUrlParam("gclid"),
        fbclid: getUrlParam("fbclid"),
        msclkid: getUrlParam("msclkid"),

        gaClientId: getGaClientId(),
        anonymousId: anonymousIdRef.current,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        language: navigator.language || "",
        languages: Array.isArray(navigator.languages) ? navigator.languages.join(",") : "",
        platform: navigator.platform || "",
        viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
        screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
        devicePixelRatio: String(window.devicePixelRatio || ""),
        colorScheme: window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light",
        cookieEnabled: String(navigator.cookieEnabled),
        doNotTrack: String(navigator.doNotTrack || ""),

        reportId: reportIdRef.current,
        domainSlug: sanitizeParam(domainSlug, 96),
        companyName: sanitizeParam(companyName, 160),
        primaryActionLabel: sanitizeParam(primaryActionLabel, 160),
        primaryPageLabel: sanitizeParam(primaryPageLabel, 160),
        eventSection: sanitizeParam(eventSection, 120),
        buttonLabel: sanitizeParam(buttonLabel, 160),
        videoId: sanitizeParam(videoId || evidenceVideoId, 64),
        videoProgress: typeof videoProgress === "number" ? videoProgress : undefined,
        scrollPercent: typeof scrollPercent === "number" ? scrollPercent : undefined,
        deviceType: getDeviceType(),
        visitorId,
        reportVisitorId,
        reportSessionId: reportSessionIdRef.current,
        visitStage: journeyMeta.visitStage,
        journeyStep: journeyMeta.journeyStep,
        intentLevel: journeyMeta.intentLevel,
        intentScore: journeyMeta.intentScore,
        isCoreEvent: journeyMeta.isCoreEvent,
        transport: "client_first_party",

        clickText: sanitizeParam(buttonLabel, 300),
        clickHref: sanitizeParam(clickHref, 1200),
        clickLocation: sanitizeParam(eventSection, 200),
        ...extra,
      };

      for (const item of endpointList) {
        try {
          const response = await postWithBeacon(item, payload);
          if (response && "ok" in response && response.ok) break;
        } catch {
          // Try the next first-party endpoint if available.
        }
      }
    };
  }, [companyName, domainSlug, endpointList, evidenceVideoId, headline, primaryActionLabel, primaryPageLabel]);

  useEffect(() => {
    if (!reportId) return;
    if (!onePerSession(`view_${reportId}`)) return;

    void sendEvent({
      eventName: "secure_report_view",
      eventSection: "page",
      buttonLabel: "Secure report viewed",
    });
  }, [reportId, sendEvent]);

  useEffect(() => {
    if (!reportId) return;

    const fired = new Set<number>();
    let ticking = false;

    function calculateScrollPercent() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
      );
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const maxScroll = Math.max(1, documentHeight - viewportHeight);
      return Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));
    }

    function checkScroll() {
      ticking = false;
      const percent = calculateScrollPercent();

      ([50, 90] as const).forEach((mark) => {
        if (percent >= mark && !fired.has(mark)) {
          fired.add(mark);
          void sendEvent({
            eventName: `secure_report_scroll_${mark}`,
            eventSection: "scroll",
            scrollPercent: mark,
            buttonLabel: `${mark}% scroll`,
          });
        }
      });
    }

    function requestCheck() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(checkScroll);
    }

    window.addEventListener("scroll", requestCheck, { passive: true });
    window.addEventListener("resize", requestCheck);
    window.setTimeout(checkScroll, 800);

    return () => {
      window.removeEventListener("scroll", requestCheck);
      window.removeEventListener("resize", requestCheck);
    };
  }, [reportId, sendEvent]);

  useEffect(() => {
    if (!reportId || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.35) return;

          const element = entry.target as HTMLElement;
          const eventName = element.dataset.trackflowObserveEvent || "";
          if (!eventName) return;

          const onceKey = `${reportId}_${eventName}_${element.dataset.trackflowAnalyticsSection || "section"}`;
          if (!onePerSession(onceKey)) return;

          void sendEvent({
            eventName,
            eventSection: element.dataset.trackflowAnalyticsSection || "section_visible",
            buttonLabel: element.dataset.trackflowAnalyticsLabel || "Section visible",
            videoId: element.dataset.trackflowVideoId || evidenceVideoId,
          });

          observer.unobserve(element);
        });
      },
      { threshold: [0.35, 0.6] },
    );

    document.querySelectorAll<HTMLElement>("[data-trackflow-observe-event]").forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [evidenceVideoId, reportId, sendEvent]);

  useEffect(() => {
    if (!reportId) return;

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const element = target.closest<HTMLElement>("[data-trackflow-analytics-event]");
      if (!element) return;

      const eventName = element.dataset.trackflowAnalyticsEvent || "secure_report_click";
      const label =
        element.dataset.trackflowAnalyticsLabel ||
        cleanText(element.textContent || element.getAttribute("aria-label") || "Click", "Click");
      const section = element.dataset.trackflowAnalyticsSection || "click";
      const href = element instanceof HTMLAnchorElement ? element.href : element.getAttribute("href") || "";

      void sendEvent({
        eventName,
        eventSection: section,
        buttonLabel: label,
        clickHref: href,
        videoId: element.dataset.trackflowVideoId || evidenceVideoId,
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [evidenceVideoId, reportId, sendEvent]);

  useEffect(() => {
    if (!reportId) return;

    function onAssistantEvent(event: Event) {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail || {};
      const eventName = sanitizeEventName(String(detail.eventName || "secure_report_assistant_event"));

      void sendEvent({
        eventName,
        eventSection: "assistant",
        buttonLabel: sanitizeParam(detail.buttonLabel || detail.question || "Assistant interaction", 160),
        extra: {
          question_key: sanitizeParam(detail.questionKey || "", 160),
          question_source: sanitizeParam(detail.questionSource || "", 80),
          message_length: typeof detail.messageLength === "number" ? detail.messageLength : undefined,
        },
      });
    }

    window.addEventListener("trackflow:secure-report-event", onAssistantEvent);
    return () => window.removeEventListener("trackflow:secure-report-event", onAssistantEvent);
  }, [reportId, sendEvent]);

  useEffect(() => {
    if (!reportId || !evidenceVideoId) return;

    const iframe = document.querySelector<HTMLIFrameElement>("[data-trackflow-youtube-iframe]");
    if (!iframe) return;

    // Keep a non-null local reference for callbacks below.
    // TypeScript does not preserve querySelector null-narrowing across nested functions.
    const youtubeIframe: HTMLIFrameElement = iframe;

    try {
      const iframeUrl = new URL(youtubeIframe.src);
      iframeUrl.searchParams.set("enablejsapi", "1");
      iframeUrl.searchParams.set("origin", window.location.origin);
      youtubeIframe.src = iframeUrl.toString();
    } catch {
      // Keep the existing iframe if URL parsing fails.
    }

    const win = window as YouTubeApiWindow;
    let intervalId = 0;
    let disposed = false;

    function trackProgress(player?: { getDuration?: () => number; getCurrentTime?: () => number }) {
      if (!player?.getDuration || !player?.getCurrentTime) return;

      const duration = Number(player.getDuration() || 0);
      const current = Number(player.getCurrentTime() || 0);
      if (!duration || !current) return;

      const percent = Math.max(0, Math.min(100, Math.round((current / duration) * 100)));
      YOUTUBE_PROGRESS_MARKS.forEach((mark) => {
        if (percent >= mark && !youtubeProgressRef.current.has(mark)) {
          youtubeProgressRef.current.add(mark);
          void sendEvent({
            eventName: `secure_report_evidence_video_progress_${mark}`,
            eventSection: "evidence_video",
            buttonLabel: `Video progress ${mark}%`,
            videoId: evidenceVideoId,
            videoProgress: mark,
          });
        }
      });
    }

    function initPlayer() {
      if (disposed || !win.YT?.Player) return;

      const player = new win.YT.Player(youtubeIframe, {
        events: {
          onStateChange: (event) => {
            const state = event.data;
            const states = win.YT?.PlayerState || {};

            if (state === states.PLAYING) {
              if (!onePerSession(`${reportId}_video_start_${evidenceVideoId}`)) {
                return;
              }

              void sendEvent({
                eventName: "secure_report_evidence_video_start",
                eventSection: "evidence_video",
                buttonLabel: "Evidence video started",
                videoId: evidenceVideoId,
              });

              window.clearInterval(intervalId);
              intervalId = window.setInterval(() => trackProgress(event.target), 2500);
              return;
            }

            if (state === states.ENDED) {
              window.clearInterval(intervalId);
              void sendEvent({
                eventName: "secure_report_evidence_video_complete",
                eventSection: "evidence_video",
                buttonLabel: "Evidence video completed",
                videoId: evidenceVideoId,
                videoProgress: 100,
              });
            }
          },
        },
      });

      window.setTimeout(() => trackProgress(player), 3000);
    }

    if (win.YT?.Player) {
      initPlayer();
    } else {
      const previousReady = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        initPlayer();
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [evidenceVideoId, reportId, sendEvent]);

  return null;
}
