"use client";

import { useEffect, useMemo, useRef } from "react";

type SecureReportAnalyticsProps = {
  token: string;
  domainSlug: string;
  primaryActionLabel?: string;
  primaryPageLabel?: string;
  primaryPageUrl?: string;
  videoId?: string;
};

type TrackingPayload = Record<string, unknown>;

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLIFrameElement | string,
        options: {
          events?: {
            onReady?: (event: { target: YouTubePlayer }) => void;
            onStateChange?: (event: { data: number; target: YouTubePlayer }) => void;
          };
        },
      ) => YouTubePlayer;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubePlayer = {
  getCurrentTime?: () => number;
  getDuration?: () => number;
  getPlayerState?: () => number;
  destroy?: () => void;
};

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeToken(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

function safeLabel(value: unknown, maxLength = 120): string {
  return cleanText(value, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function hashReportId(token: string): string {
  const normalized = normalizeToken(token);
  if (!normalized) return "rpt_unknown";

  let hash = 0x811c9dc5;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `rpt_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function getCookie(name: string) {
  if (typeof document === "undefined") return "";

  const encodedName = `${encodeURIComponent(name)}=`;
  const parts = String(document.cookie || "").split(";");

  for (const part of parts) {
    const item = part.trim();
    if (item.startsWith(encodedName)) return decodeURIComponent(item.slice(encodedName.length));
  }

  return "";
}

function getGaClientId() {
  const ga = getCookie("_ga");
  if (!ga) return "";

  const parts = ga.split(".");
  if (parts.length >= 4) return `${parts[2]}.${parts[3]}`;
  return ga;
}

function getOrCreateAnonymousId() {
  if (typeof window === "undefined") return "";

  const key = "tfp_anon_id";

  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;

    const value =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    window.localStorage.setItem(key, value);
    return value;
  } catch {
    return `anon_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

function getDeviceType() {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth || 0;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getBaseTrackingContext(eventName: string, extra: TrackingPayload = {}) {
  const params = new URLSearchParams(window.location.search);

  return {
    eventName,
    eventId: `${eventName}_${Date.now()}_${Math.random().toString(16).slice(2)}`,

    pageTitle: document.title,
    pageLocation: window.location.href,
    pagePath: window.location.pathname,
    pageSearch: window.location.search,
    referrer: document.referrer || "",
    landingPage: window.sessionStorage?.getItem("tfp_landing_page") || window.location.href,

    utm_source: params.get("utm_source") || window.sessionStorage?.getItem("tfp_utm_source") || "",
    utm_medium: params.get("utm_medium") || window.sessionStorage?.getItem("tfp_utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || window.sessionStorage?.getItem("tfp_utm_campaign") || "",
    utm_term: params.get("utm_term") || window.sessionStorage?.getItem("tfp_utm_term") || "",
    utm_content: params.get("utm_content") || window.sessionStorage?.getItem("tfp_utm_content") || "",

    gclid: params.get("gclid") || window.sessionStorage?.getItem("tfp_gclid") || "",
    fbclid: params.get("fbclid") || window.sessionStorage?.getItem("tfp_fbclid") || "",
    msclkid: params.get("msclkid") || window.sessionStorage?.getItem("tfp_msclkid") || "",

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
    device_type: getDeviceType(),

    ...extra,
  };
}

function sendTrackingEvent(eventName: string, commonParams: TrackingPayload, extra: TrackingPayload = {}) {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;

  const body = JSON.stringify(getBaseTrackingContext(eventName, { ...commonParams, ...extra }));

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/server-track", blob)) return;
    }
  } catch {
    // Fallback to fetch below.
  }

  fetch("/api/server-track", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics should never break the report page experience.
  });
}

function normalizeSecureEventName(value: unknown) {
  const clean = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);

  if (!clean) return "secure_report_event";
  return clean.startsWith("secure_report_") ? clean : `secure_report_${clean}`;
}

function getClickText(element: HTMLElement) {
  return cleanText(element.getAttribute("aria-label") || element.textContent || "", "").slice(0, 140);
}

function getElementHref(element: Element): string {
  const anchor = element.closest("a") as HTMLAnchorElement | null;
  return anchor?.href || "";
}

function classifyClickEvent(element: HTMLElement): { eventName: string; extra: TrackingPayload } | null {
  const explicitEvent = element.closest("[data-secure-report-event]") as HTMLElement | null;
  if (explicitEvent) {
    return {
      eventName: normalizeSecureEventName(explicitEvent.dataset.secureReportEvent),
      extra: {
        event_section: safeLabel(explicitEvent.dataset.secureReportSection || explicitEvent.dataset.trackLocation || "custom_click", 80),
        button_label: safeLabel(explicitEvent.dataset.secureReportLabel || getClickText(explicitEvent), 120),
        clickHref: getElementHref(explicitEvent),
      },
    };
  }

  const pdfDownload = element.closest("[data-trackflow-pdf-download]") as HTMLElement | null;
  if (pdfDownload) {
    return {
      eventName: "secure_report_pdf_download_click",
      extra: {
        event_section: "pdf_report",
        button_label: safeLabel(getClickText(pdfDownload) || "Download PDF", 120),
        clickHref: getElementHref(pdfDownload),
      },
    };
  }

  const chatTrigger = element.closest('a[href="#ask-this-review"], [data-trackflow-chat-open="true"]') as HTMLElement | null;
  if (chatTrigger) {
    return {
      eventName: "secure_report_assistant_open_click",
      extra: {
        event_section: "assistant",
        button_label: safeLabel(getClickText(chatTrigger) || "Ask about this review", 120),
        clickHref: getElementHref(chatTrigger),
      },
    };
  }

  const anchor = element.closest("a") as HTMLAnchorElement | null;
  if (!anchor) return null;

  const href = anchor.href || "";
  const text = getClickText(anchor);
  const lowerHref = href.toLowerCase();
  const lowerText = text.toLowerCase();

  if (lowerHref.includes("/api/trackflow/reports/preview")) {
    return {
      eventName: "secure_report_pdf_open_click",
      extra: {
        event_section: "pdf_report",
        button_label: safeLabel(text || "Open PDF", 120),
        clickHref: href,
      },
    };
  }

  if (lowerHref.includes("/api/trackflow/reports/cta") || lowerHref.includes("/free-tracking-audit") || lowerText.includes("book") || lowerText.includes("verify")) {
    return {
      eventName: "secure_report_booking_click",
      extra: {
        event_section: "booking_cta",
        button_label: safeLabel(text || "Book verification", 120),
        clickHref: href,
      },
    };
  }

  if (lowerHref.startsWith("mailto:")) {
    return {
      eventName: "secure_report_email_click",
      extra: {
        event_section: "contact",
        button_label: safeLabel(text || "Email", 120),
      },
    };
  }

  if (lowerHref.includes("linkedin.com")) {
    return {
      eventName: "secure_report_linkedin_click",
      extra: {
        event_section: "contact",
        button_label: safeLabel(text || "LinkedIn", 120),
        clickHref: href,
      },
    };
  }

  return null;
}

function addEnableJsApiToIframe(iframe: HTMLIFrameElement) {
  try {
    const rawSrc = iframe.getAttribute("src") || "";
    if (!rawSrc) return;

    const url = new URL(rawSrc, window.location.href);
    if (!url.hostname.includes("youtube")) return;

    let changed = false;
    if (url.searchParams.get("enablejsapi") !== "1") {
      url.searchParams.set("enablejsapi", "1");
      changed = true;
    }
    if (!url.searchParams.get("origin")) {
      url.searchParams.set("origin", window.location.origin);
      changed = true;
    }

    if (changed) iframe.src = url.toString();
  } catch {
    // Ignore iframe URL changes if the browser blocks it.
  }
}

function loadYouTubeIframeApi() {
  return new Promise<void>((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === "function") previousReady();
      resolve();
    };

    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
}

export default function SecureReportAnalytics({
  token,
  domainSlug,
  primaryActionLabel = "",
  primaryPageLabel = "",
  primaryPageUrl = "",
  videoId = "",
}: SecureReportAnalyticsProps) {
  const firedEventsRef = useRef<Set<string>>(new Set());
  const videoIntervalRef = useRef<number | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);

  const commonParams = useMemo<TrackingPayload>(
    () => ({
      report_id: hashReportId(token),
      report_type: "secure_tracking_review",
      domain_slug: safeLabel(domainSlug, 120),
      primary_action_label: safeLabel(primaryActionLabel, 120),
      primary_page_label: safeLabel(primaryPageLabel, 120),
      primary_page_url: safeLabel(primaryPageUrl, 700),
      video_id: safeLabel(videoId, 80),
    }),
    [domainSlug, primaryActionLabel, primaryPageLabel, primaryPageUrl, token, videoId],
  );

  const trackOnce = (eventName: string, uniqueKey: string, extra: TrackingPayload = {}) => {
    if (firedEventsRef.current.has(uniqueKey)) return;
    firedEventsRef.current.add(uniqueKey);
    sendTrackingEvent(eventName, commonParams, extra);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    trackOnce("secure_report_view", "secure_report_view", { event_section: "page" });
  }, [commonParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, viewportHeight);
      const progress = Math.round(((scrollTop + viewportHeight) / documentHeight) * 100);

      if (progress >= 50) {
        trackOnce("secure_report_scroll_50", "scroll_50", { event_section: "scroll", scroll_percent: 50 });
      }

      if (progress >= 90) {
        trackOnce("secure_report_scroll_90", "scroll_90", { event_section: "scroll", scroll_percent: 90 });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.setTimeout(handleScroll, 500);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [commonParams]);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.35) return;

          const target = entry.target as HTMLElement;
          const section = target.dataset.secureReportVisibleSection || "section";

          if (section === "evidence_video") {
            trackOnce("secure_report_evidence_video_visible", "video_visible", { event_section: "evidence_video" });
          }

          if (section === "pdf_preview") {
            trackOnce("secure_report_pdf_preview_visible", "pdf_preview_visible", { event_section: "pdf_report" });
          }
        });
      },
      { threshold: [0.35, 0.65] },
    );

    document.querySelectorAll<HTMLElement>("[data-secure-report-visible-section]").forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [commonParams]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const classified = classifyClickEvent(target);
      if (!classified) return;

      sendTrackingEvent(classified.eventName, commonParams, classified.extra);
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [commonParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<TrackingPayload>;
      const detail = customEvent.detail || {};
      const { eventName: rawEventName, question: rawQuestionValue, ...safeDetail } = detail;
      const eventName = normalizeSecureEventName(rawEventName);
      const rawQuestion = safeLabel(rawQuestionValue, 220);

      sendTrackingEvent(eventName, commonParams, {
        ...safeDetail,
        event_section: safeLabel(detail.event_section || "assistant", 80),
        assistant_question_key: safeLabel(detail.assistant_question_key || detail.question_key, 120),
        assistant_question_length: typeof detail.assistant_question_length === "number" ? detail.assistant_question_length : rawQuestion.length || undefined,
      });
    };

    window.addEventListener("trackflow:secure-report-event", handleCustomEvent as EventListener);
    return () => window.removeEventListener("trackflow:secure-report-event", handleCustomEvent as EventListener);
  }, [commonParams]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const html = document.documentElement;
    let wasVisible = html.getAttribute("data-trackflow-assistant-visible") === "true";

    const checkVisibility = () => {
      const isVisible = html.getAttribute("data-trackflow-assistant-visible") === "true";
      if (isVisible && !wasVisible) {
        trackOnce("secure_report_assistant_sticky_visible", "assistant_sticky_visible", { event_section: "assistant" });
      }
      wasVisible = isVisible;
    };

    const observer = new MutationObserver(checkVisibility);
    observer.observe(html, { attributes: true, attributeFilter: ["data-trackflow-assistant-visible"] });
    window.setTimeout(checkVisibility, 800);

    return () => observer.disconnect();
  }, [commonParams]);

  useEffect(() => {
    if (typeof window === "undefined" || !videoId) return;

    let cancelled = false;

    const clearVideoInterval = () => {
      if (videoIntervalRef.current !== null) {
        window.clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
      }
    };

    const startProgressTimer = (player: YouTubePlayer) => {
      clearVideoInterval();
      videoIntervalRef.current = window.setInterval(() => {
        try {
          const duration = Number(player.getDuration?.() || 0);
          const currentTime = Number(player.getCurrentTime?.() || 0);
          if (!duration || !currentTime) return;

          const percent = Math.max(0, Math.min(100, Math.round((currentTime / duration) * 100)));

          [25, 50, 75].forEach((milestone) => {
            if (percent >= milestone) {
              trackOnce(`secure_report_evidence_video_progress_${milestone}`, `video_progress_${milestone}`, {
                event_section: "evidence_video",
                video_progress: milestone,
              });
            }
          });
        } catch {
          // Ignore player polling errors.
        }
      }, 1500);
    };

    const setupPlayer = async () => {
      const iframe = document.querySelector<HTMLIFrameElement>("[data-trackflow-evidence-video]");
      if (!iframe) return;

      addEnableJsApiToIframe(iframe);
      await loadYouTubeIframeApi();
      if (cancelled || !window.YT?.Player) return;

      youtubePlayerRef.current = new window.YT.Player(iframe, {
        events: {
          onStateChange: (event) => {
            const playingState = window.YT?.PlayerState?.PLAYING ?? 1;
            const endedState = window.YT?.PlayerState?.ENDED ?? 0;

            if (event.data === playingState) {
              trackOnce("secure_report_evidence_video_start", "video_start", { event_section: "evidence_video" });
              startProgressTimer(event.target);
            }

            if (event.data === endedState) {
              trackOnce("secure_report_evidence_video_complete", "video_complete", {
                event_section: "evidence_video",
                video_progress: 100,
              });
              clearVideoInterval();
            }
          },
        },
      });
    };

    void setupPlayer();

    return () => {
      cancelled = true;
      clearVideoInterval();
      try {
        youtubePlayerRef.current?.destroy?.();
      } catch {
        // Ignore destroy errors.
      }
      youtubePlayerRef.current = null;
    };
  }, [commonParams, videoId]);

  return null;
}
