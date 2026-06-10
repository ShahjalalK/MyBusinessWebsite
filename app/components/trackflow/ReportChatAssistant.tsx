"use client";

// ============================================================
// FILE: app/components/trackflow/ReportChatAssistant.tsx
// Purpose: Premium floating Messenger-style secure-page chatbot UI.
// ============================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  buildReportChatQuestionSuggestions,
  normalizeReportChatQuestionKey,
  type ReportChatQuestionContext,
} from "./reportChatQuestions";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
};

type StoredChatMessage = {
  role?: string;
  content?: string;
  createdAt?: string;
  created_at?: string;
};

type ReportChatAssistantProps = {
  token: string;
  domainSlug: string;
  companyName?: string;
  headline?: string;
  ctaHref?: string;
  ctaText?: string;
  chatContext?: ReportChatQuestionContext;
};

const GREETING =
  "Hi — I can help explain this private tracking review, the evidence points, and the safest next verification steps. I’ll stay within the browser-visible evidence shown here.";

function createId(prefix = "msg"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeSessionToken(value: string): string {
  return (
    String(value || "unknown")
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 96) || "unknown"
  );
}

function getSessionStorageKey(token: string): string {
  return `trackflow_report_chat_session_${normalizeSessionToken(token)}`;
}

function getSessionCookieName(token: string): string {
  return `tfp_chat_session_${normalizeSessionToken(token).slice(0, 64)}`;
}

function isBrowserAvailable(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function hashToUuid(input: string): string {
  // Small deterministic browser-safe hash fallback.
  // Used only when storage/cookie is unavailable or not persisted.
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  const text = String(input || "trackflow-session");

  for (let index = 0; index < text.length; index += 1) {
    const char = text.charCodeAt(index);
    h1 ^= char;
    h1 = Math.imul(h1, 16777619);
    h2 ^= char + index;
    h2 = Math.imul(h2, 2246822519);
  }

  const hex = [h1, h2, h1 ^ h2, Math.imul(h1 + h2, 3266489917)]
    .map((value) => (value >>> 0).toString(16).padStart(8, "0"))
    .join("")
    .slice(0, 32);

  const variantNibble = ((parseInt(hex[16] || "8", 16) & 0x3) | 0x8).toString(16);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variantNibble}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

function getDeterministicBrowserSessionId(token: string): string {
  if (!isBrowserAvailable()) return createUuid();

  const fingerprint = [
    normalizeSessionToken(token),
    window.location.origin,
    navigator.userAgent || "",
    navigator.language || "",
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    String(window.screen?.width || ""),
    String(window.screen?.height || ""),
    String(window.screen?.colorDepth || ""),
    String(window.devicePixelRatio || ""),
  ].join("|");

  return hashToUuid(fingerprint);
}

function readCookieValue(name: string): string {
  if (!isBrowserAvailable()) return "";

  const encodedName = `${encodeURIComponent(name)}=`;
  const parts = String(document.cookie || "").split(";");

  for (const part of parts) {
    const item = part.trim();
    if (item.startsWith(encodedName)) {
      return decodeURIComponent(item.slice(encodedName.length));
    }
  }

  return "";
}

function writeCookieValue(name: string, value: string) {
  if (!isBrowserAvailable()) return;

  const maxAgeSeconds = 60 * 60 * 24 * 180;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
}

function readStorageValue(storage: Storage | undefined, key: string): string {
  try {
    const value = storage?.getItem(key) || "";
    return value && isUuid(value) ? value : "";
  } catch {
    return "";
  }
}

function writeStorageValue(storage: Storage | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Storage can be blocked in some browser modes.
  }
}

function readStoredSessionId(token: string): string {
  if (!isBrowserAvailable()) return "";

  const key = getSessionStorageKey(token);
  const localValue = readStorageValue(window.localStorage, key);
  if (localValue) return localValue;

  const sessionValue = readStorageValue(window.sessionStorage, key);
  if (sessionValue) return sessionValue;

  const cookieValue = readCookieValue(getSessionCookieName(token));
  return cookieValue && isUuid(cookieValue) ? cookieValue : "";
}

function writeStoredSessionId(token: string, sessionId: string) {
  if (!isBrowserAvailable() || !isUuid(sessionId)) return;

  const key = getSessionStorageKey(token);

  writeStorageValue(window.localStorage, key, sessionId);
  writeStorageValue(window.sessionStorage, key, sessionId);
  writeCookieValue(getSessionCookieName(token), sessionId);
}

function getOrCreateSessionId(token: string, preferredSessionId = ""): string {
  if (preferredSessionId && isUuid(preferredSessionId)) {
    writeStoredSessionId(token, preferredSessionId);
    return preferredSessionId;
  }

  const existing = readStoredSessionId(token);
  if (existing) {
    writeStoredSessionId(token, existing);
    return existing;
  }

  const randomSessionId = createUuid();
  writeStoredSessionId(token, randomSessionId);

  const confirmedSessionId = readStoredSessionId(token);
  if (confirmedSessionId) return confirmedSessionId;

  const fallbackSessionId = getDeterministicBrowserSessionId(token);
  writeStoredSessionId(token, fallbackSessionId);

  return fallbackSessionId;
}

function buildGreeting(): ChatMessage {
  return {
    id: createId("hello"),
    role: "assistant",
    content: GREETING,
  };
}

function normalizeStoredMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): ChatMessage | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;

      const record = item as StoredChatMessage;
      const role: ChatRole | "" =
        record.role === "assistant" ? "assistant" : record.role === "user" ? "user" : "";
      const content = String(record.content || "")
        .replace(/\r/g, "")
        .replace(/[\t\f\v ]+/g, " ")
        .replace(/ *\n */g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (!role || !content) return null;

      return {
        id: createId(role),
        role,
        content,
        createdAt: String(record.createdAt || record.created_at || ""),
      };
    })
    .filter((item): item is ChatMessage => Boolean(item));
}

function compactHistory(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.content.trim())
    .slice(-6)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 900),
    }));
}

function getMessagesStorageKey(token: string, sessionId: string): string {
  return `trackflow_report_chat_messages_${token || "unknown"}_${sessionId || "unknown"}`;
}

function cleanDisplayLine(value: string): string {
  return String(value || "")
    .replace(/\*\*/g, "")
    .replace(/__+/g, "")
    .replace(/`+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ASSISTANT_DISPLAY_HEADINGS = [
  "Short answer",
  "What this means",
  "What to verify next",
  "Important note",
  "Evidence to review",
  "Next step",
  "Best next step",
  "Recommended first step",
  "Why it matters",
  "How to think about it",
  "Recommended action",
  "Verification plan",
  "Minimum access for diagnosis",
  "Only if you approve implementation",
  "Not needed",
  "Best practice",
  "How we reduce risk",
  "What we do not need",
  "Recommended access order",
  "When higher access may be needed",
  "Safer way",
  "Why this is safer",
  "What we may need instead",
  "Safety note",
  "Access safety",
  "What we may need",
  "What we can do without access",
  "For this review",
  "If campaign work is approved",
  "If campaign management is approved",
  "How we normally approach it",
  "For campaign review",
  "For campaign setup or management",
  "What we can review safely",
  "What we will not do in read-only mode",
  "Recommended order",
  "Best way to contact",
  "Book a call",
  "Direct contact",
  "Marketplace option",
  "Before sharing access",
  "What to prepare",
  "How we would proceed",
  "Contact email",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeAssistantContentForDisplay(value: string): string {
  let text = String(value || "").replace(/\r/g, "").trim();

  if (!text) return "";

  text = text
    .replace(/Best\s*next\s*step/gi, "Recommended first step")
    .replace(/Recommended\s*first\s*step/gi, "Recommended first step")
    .replace(/Recommended\s*order/gi, "Recommended order")
    .replace(/Important\s*note/gi, "Important note")
    .replace(/Direct\s*contact/gi, "Direct contact")
    .replace(/Marketplace\s*option/gi, "Marketplace option")
    .replace(/Access\s*safety/gi, "Access safety");

  // Repair old saved answers where newlines were collapsed into one paragraph.
  // Example: "Short answer Yes. Recommended order: • Confirm..."
  text = text.replace(/\s*[•]\s+/g, "\n- ");

  for (const heading of ASSISTANT_DISPLAY_HEADINGS) {
    const pattern = new RegExp(`(^|\\s)(${escapeRegExp(heading)})\\s*[:：]\\s*`, "gi");
    text = text.replace(pattern, (_match, prefix: string, title: string) => {
      const leading = prefix && prefix.trim() ? "\n\n" : "";
      return `${leading}${title}:\n`;
    });
  }

  return text
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isAssistantHeading(value: string): boolean {
  const text = cleanDisplayLine(value).replace(/[:：]\s*$/, "");
  if (!text || text.length > 62) return false;

  return /^(short answer|what this means|what to verify next|important note|evidence to review|next step|best next step|recommended first step|why it matters|how to think about it|recommended action|verification plan|minimum access for diagnosis|only if you approve implementation|not needed|best practice|how we reduce risk|what we do not need|recommended access order|when higher access may be needed|safer way|why this is safer|what we may need instead|safety note|access safety|what we may need|what we can do without access|for this review|if campaign work is approved|if campaign management is approved|how we normally approach it|for campaign review|for campaign setup or management|what we can review safely|what we will not do in read-only mode|recommended order|best way to contact|book a call|direct contact|marketplace option|before sharing access|what to prepare|how we would proceed|contact email)$/i.test(
    text,
  );
}

function splitKnownHeading(value: string): { title: string; body: string } | null {
  const cleaned = cleanDisplayLine(value);
  const match = cleaned.match(
    /^(Short answer|What this means|What to verify next|Important note|Evidence to review|Next step|Best next step|Recommended first step|Why it matters|How to think about it|Recommended action|Verification plan|Minimum access for diagnosis|Only if you approve implementation|Not needed|Best practice|How we reduce risk|What we do not need|Recommended access order|When higher access may be needed|Safer way|Why this is safer|What we may need instead|Safety note|Access safety|What we may need|What we can do without access|For this review|If campaign work is approved|If campaign management is approved|How we normally approach it|For campaign review|For campaign setup or management|What we can review safely|What we will not do in read-only mode|Recommended order|Best way to contact|Book a call|Direct contact|Marketplace option|Before sharing access|What to prepare|How we would proceed|Contact email)\s*[:：]\s*(.+)$/i,
  );

  if (!match) return null;

  return {
    title: match[1],
    body: match[2],
  };
}

function InlineText({ text }: { text: string }) {
  const value = String(text || "");
  const parts: ReactNode[] = [];
  const pattern = /(https?:\/\/[^\s]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
  let lastIndex = 0;

  for (const match of value.matchAll(pattern)) {
    const raw = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push(value.slice(lastIndex, index));
    }

    const clean = raw.replace(/[),.;:!?]+$/g, "");
    const trailing = raw.slice(clean.length);
    const href = clean.includes("@") && !clean.startsWith("http") ? `mailto:${clean}` : clean;

    parts.push(
      <a
        key={`${clean}-${index}`}
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className="font-black text-blue-700 underline decoration-blue-300 underline-offset-4 hover:text-blue-800"
      >
        {clean}
      </a>,
    );

    if (trailing) parts.push(trailing);
    lastIndex = index + raw.length;
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return <>{parts.length ? parts : value}</>;
}

function FormattedAssistantMessage({ content }: { content: string }) {
  const lines = normalizeAssistantContentForDisplay(content).split("\n");

  const elements: ReactElement[] = [];
  let paragraphLines: string[] = [];
  let bulletItems: string[] = [];
  let numberItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;

    const paragraph = paragraphLines.join(" ").trim();
    paragraphLines = [];

    if (!paragraph) return;

    const headingPair = splitKnownHeading(paragraph);
    if (headingPair) {
      elements.push(
        <div
          key={`section-${elements.length}`}
          className="rounded-2xl border border-blue-100 bg-blue-50/70 px-3.5 py-3"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
            {headingPair.title}
          </p>
          <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-700">
            <InlineText text={headingPair.body} />
          </p>
        </div>,
      );
      return;
    }

    elements.push(
      <p key={`p-${elements.length}`} className="text-sm font-semibold leading-6 text-slate-700">
        <InlineText text={paragraph} />
      </p>,
    );
  };

  const flushBullets = () => {
    if (!bulletItems.length) return;

    const items = [...bulletItems];
    bulletItems = [];

    elements.push(
      <ul key={`ul-${elements.length}`} className="space-y-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2.5 text-sm font-semibold leading-6 text-slate-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            <span><InlineText text={item} /></span>
          </li>
        ))}
      </ul>,
    );
  };

  const flushNumbers = () => {
    if (!numberItems.length) return;

    const items = [...numberItems];
    numberItems = [];

    elements.push(
      <ol key={`ol-${elements.length}`} className="space-y-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2.5 text-sm font-semibold leading-6 text-slate-700">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-900 text-[10px] font-black text-white">
              {index + 1}
            </span>
            <span><InlineText text={item} /></span>
          </li>
        ))}
      </ol>,
    );
  };

  const flushAll = () => {
    flushParagraph();
    flushBullets();
    flushNumbers();
  };

  for (const rawLine of lines) {
    const line = cleanDisplayLine(rawLine.replace(/^#{1,4}\s*/, ""));

    if (!line) {
      flushAll();
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    const numberMatch = line.match(/^\d+[\).]\s+(.+)$/);

    if (bulletMatch) {
      flushParagraph();
      flushNumbers();
      bulletItems.push(cleanDisplayLine(bulletMatch[1]));
      continue;
    }

    if (numberMatch) {
      flushParagraph();
      flushBullets();
      numberItems.push(cleanDisplayLine(numberMatch[1]));
      continue;
    }

    if (isAssistantHeading(line)) {
      flushAll();
      elements.push(
        <p
          key={`h-${elements.length}`}
          className="pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500"
        >
          {line.replace(/[:：]\s*$/, "")}
        </p>,
      );
      continue;
    }

    flushBullets();
    flushNumbers();
    paragraphLines.push(line);
  }

  flushAll();

  if (!elements.length) {
    return (
      <p className="text-sm font-semibold leading-6 text-slate-700">
        <InlineText text={cleanDisplayLine(content)} />
      </p>
    );
  }

  return <div className="space-y-3">{elements}</div>;
}

function UserMessageText({ content }: { content: string }) {
  return <p className="whitespace-pre-wrap text-sm font-semibold leading-6">{content}</p>;
}

type SecureReportAnalyticsDetail = {
  eventName: string;
  buttonLabel?: string;
  question?: string;
  questionKey?: string;
  questionSource?: string;
  messageLength?: number;
};

function dispatchSecureReportAnalyticsEvent(detail: SecureReportAnalyticsDetail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("trackflow:secure-report-event", {
      detail,
    }),
  );
}

export default function ReportChatAssistant({
  token,
  domainSlug,
  companyName = "this website",
  headline = "Private Tracking Review",
  ctaHref = "/contact",
  ctaText = "Book verification review",
  chatContext,
}: ReportChatAssistantProps) {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildGreeting()]);
  const [question, setQuestion] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [statusLabel, setStatusLabel] = useState("Report-aware assistant");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const sessionIdRef = useRef("");
  const sessionTokenRef = useRef("");

  const emitAnalyticsEvent = useCallback((detail: SecureReportAnalyticsDetail) => {
    dispatchSecureReportAnalyticsEvent(detail);
  }, []);

  const openAssistantChat = useCallback((source = "button") => {
    emitAnalyticsEvent({
      eventName: "secure_report_assistant_open",
      buttonLabel: source,
    });

    setIsOpen(true);

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 180);
  }, [emitAnalyticsEvent]);

  const storageKey = useMemo(
    () => (token && sessionId ? getMessagesStorageKey(token, sessionId) : ""),
    [token, sessionId],
  );

  const hasUserMessages = useMemo(
    () => messages.some((message) => message.role === "user"),
    [messages],
  );

  const latestAssistantMessage = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === "assistant" && message.content.trim());
  }, [messages]);

  const askedQuestionSignature = useMemo(() => {
    return messages
      .filter((message) => message.role === "user")
      .map((message) => normalizeReportChatQuestionKey(message.content))
      .filter(Boolean)
      .join("|");
  }, [messages]);

  const askedQuestionKeys = useMemo(() => {
    return new Set(askedQuestionSignature ? askedQuestionSignature.split("|") : []);
  }, [askedQuestionSignature]);

  const reportQuestionContext = useMemo<ReportChatQuestionContext>(
    () => ({
      companyName,
      headline,
      ...(chatContext || {}),
    }),
    [chatContext, companyName, headline],
  );

  const questionSuggestions = useMemo(
    () =>
      buildReportChatQuestionSuggestions({
        context: reportQuestionContext,
        askedKeys: askedQuestionKeys,
        latestAssistantContent: latestAssistantMessage?.content || "",
        limits: {
          closed: 2,
          starter: 4,
          followUp: 3,
        },
      }),
    [askedQuestionKeys, latestAssistantMessage?.content, reportQuestionContext],
  );

  const starterQuestionChips = questionSuggestions.starterQuestions;
  const followUpQuestionChips = questionSuggestions.followUpQuestions;

  useEffect(() => {
    if (!token) return;

    const tokenKey = normalizeSessionToken(token);
    const preferredSessionId = sessionTokenRef.current === tokenKey ? sessionIdRef.current : "";
    const stableSessionId = getOrCreateSessionId(token, preferredSessionId);

    sessionTokenRef.current = tokenKey;
    sessionIdRef.current = stableSessionId;
    setSessionId((current) => (current === stableSessionId ? current : stableSessionId));
  }, [token]);

  useEffect(() => {
    if (!token || !sessionId) return;

    let cancelled = false;
    const controller = new AbortController();

    async function loadHistory() {
      setIsHistoryLoading(true);

      try {
        const localRaw = window.localStorage.getItem(getMessagesStorageKey(token, sessionId));
        const localMessages = normalizeStoredMessages(localRaw ? JSON.parse(localRaw) : []);
        if (!cancelled && localMessages.length) {
          setMessages(localMessages);
        }
      } catch {
        // Local history is optional.
      }

      try {
        const params = new URLSearchParams({
          token,
          domainSlug,
          sessionId,
        });

        const response = await fetch(`/api/trackflow/report-chat?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await response.json().catch(() => null)) as
          | { messages?: StoredChatMessage[]; disableChat?: boolean }
          | null;

        if (cancelled) return;

        const remoteMessages = normalizeStoredMessages(payload?.messages || []);
        if (remoteMessages.length) {
          setMessages(remoteMessages);
        } else {
          setMessages((current) => (current.length ? current : [buildGreeting()]));
        }

        if (payload?.disableChat) {
          setIsDisabled(true);
          setStatusLabel("Manual verification recommended");
        }
      } catch {
        if (!cancelled) {
          setMessages((current) => (current.length ? current : [buildGreeting()]));
        }
      } finally {
        if (!cancelled) {
          setHistoryLoaded(true);
          setIsHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [domainSlug, sessionId, token]);

  useEffect(() => {
    if (!storageKey || !historyLoaded) return;

    try {
      const cleanMessages = messages
        .filter((message) => message.content.trim())
        .slice(-60)
        .map((message) => ({
          role: message.role,
          content: message.content,
          createdAt: message.createdAt || new Date().toISOString(),
        }));

      window.localStorage.setItem(storageKey, JSON.stringify(cleanMessages));
    } catch {
      // Local history is optional.
    }
  }, [historyLoaded, messages, storageKey]);

  useEffect(() => {
    if (!isOpen) return;
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isOpen, isSending]);

  const resizeInput = () => {
    const input = inputRef.current;
    if (!input) return;

    input.style.height = "auto";

    const minHeight = 48;
    const maxHeight = 150;
    const nextHeight = Math.min(Math.max(input.scrollHeight, minHeight), maxHeight);

    input.style.height = `${nextHeight}px`;
    input.style.overflowY = input.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    resizeInput();
  }, [question, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      resizeInput();
    }, 180);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#ask-this-review") openAssistantChat("hash_or_anchor");
    };

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const trigger = target.closest('a[href="#ask-this-review"], [data-trackflow-chat-open="true"]');
      if (!trigger) return;

      event.preventDefault();
      openAssistantChat("anchor_click");
    };

    openFromHash();
    document.addEventListener("click", onDocumentClick);
    window.addEventListener("hashchange", openFromHash);

    return () => {
      document.removeEventListener("click", onDocumentClick);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, [openAssistantChat]);

  const helperBadge = isDisabled
    ? "Manual review"
    : isSending
      ? "Typing..."
      : isHistoryLoading
        ? "Loading history..."
        : statusLabel;

  const updateAssistantMessage = (assistantId: string, content: string) => {
    setMessages((current) =>
      current.map((item) => (item.id === assistantId ? { ...item, content } : item)),
    );
  };

  const waitForTypingFrame = (ms = 10) =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });

  async function submitQuestion(nextQuestion?: string, source: "manual" | "starter" | "follow_up" = "manual") {
    const cleanQuestion = String(nextQuestion ?? question).trim();
    if (!cleanQuestion || isSending || isDisabled) return;

    const questionKey = normalizeReportChatQuestionKey(cleanQuestion);

    if (nextQuestion) {
      emitAnalyticsEvent({
        eventName: "secure_report_assistant_question_click",
        buttonLabel: cleanQuestion.slice(0, 120),
        question: cleanQuestion.slice(0, 300),
        questionKey,
        questionSource: source,
        messageLength: cleanQuestion.length,
      });
    }

    emitAnalyticsEvent({
      eventName: "secure_report_assistant_message_sent",
      buttonLabel: source === "manual" ? "Manual question sent" : "Suggested question sent",
      question: cleanQuestion.slice(0, 300),
      questionKey,
      questionSource: source,
      messageLength: cleanQuestion.length,
    });

    const tokenKey = normalizeSessionToken(token);
    const activeSessionId = getOrCreateSessionId(
      token,
      sessionTokenRef.current === tokenKey ? sessionIdRef.current || sessionId : "",
    );

    sessionTokenRef.current = tokenKey;
    sessionIdRef.current = activeSessionId;

    if (sessionId !== activeSessionId) setSessionId(activeSessionId);

    const userMessage: ChatMessage = {
      id: createId("user"),
      role: "user",
      content: cleanQuestion,
      createdAt: new Date().toISOString(),
    };

    const assistantId = createId("assistant");
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setIsOpen(true);
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setQuestion("");
    setIsSending(true);
    setStatusLabel("Answering from this review...");

    window.setTimeout(() => resizeInput(), 0);

    const abortController = new AbortController();
    const timeout = window.setTimeout(() => abortController.abort(), 65000);
    let renderedText = "";

    const typeAssistantText = async (targetText: string, speed: "normal" | "fast" = "normal") => {
      const nextText = String(targetText || "");
      const step = speed === "fast" ? 10 : 5;
      const delay = speed === "fast" ? 4 : 10;

      while (renderedText.length < nextText.length) {
        renderedText = nextText.slice(0, Math.min(nextText.length, renderedText.length + step));
        updateAssistantMessage(assistantId, renderedText);
        await waitForTypingFrame(delay);
      }
    };

    try {
      const response = await fetch("/api/trackflow/report-chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        cache: "no-store",
        signal: abortController.signal,
        body: JSON.stringify({
          token,
          domainSlug,
          question: cleanQuestion,
          sessionId: activeSessionId,
          history: compactHistory(messages),
        }),
      });

      if (!response.ok) {
        let payload: { message?: string; disableChat?: boolean } = {};

        try {
          payload = (await response.json()) as { message?: string; disableChat?: boolean };
        } catch {
          payload = {};
        }

        const message =
          payload.message ||
          "The assistant could not answer right now. You can still request a manual verification review.";

        if (payload.disableChat) {
          setIsDisabled(true);
          setStatusLabel("Manual verification recommended");
        } else {
          setStatusLabel("Temporary fallback");
        }

        await typeAssistantText(message, "fast");
        return;
      }

      if (!response.body) {
        const text = await response.text();
        await typeAssistantText(text || "I could not generate an answer right now.", "fast");
        setStatusLabel("Report-aware assistant");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const result = await reader.read();
        if (result.done) break;

        fullText += decoder.decode(result.value, { stream: true });
        await typeAssistantText(fullText);
      }

      if (!fullText.trim()) {
        await typeAssistantText("I could not generate an answer right now.", "fast");
      }

      if (/usage limit|temporarily unavailable|quota|rate limit/i.test(fullText)) {
        setIsDisabled(true);
        setStatusLabel("Usage limit reached");
      } else {
        setStatusLabel("Report-aware assistant");
      }
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "The assistant took longer than expected. You can still use the verification CTA below, or try one shorter question."
          : "The assistant could not answer right now. You can still request a manual tracking verification review.";

      await typeAssistantText(message, "fast");
      setStatusLabel("Temporary fallback");
    } finally {
      window.clearTimeout(timeout);
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion();
  }

  const showFollowUps =
    Boolean(latestAssistantMessage?.id) &&
    hasUserMessages &&
    !isSending &&
    !isDisabled &&
    latestAssistantMessage?.role === "assistant" &&
    followUpQuestionChips.length > 0;

  return (
    <>
      <span id="ask-this-review" className="sr-only">
        Ask about this review
      </span>

      <div className="fixed inset-x-2 bottom-3 z-[90] flex max-w-full flex-col items-end sm:inset-x-auto sm:right-6 lg:bottom-6"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
        {isOpen ? (
          <div
            className="flex h-[calc(100vh_-_1rem)] max-h-[720px] w-full max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-[1.6rem] border border-blue-100 bg-white shadow-2xl shadow-slate-950/25 sm:w-[470px] sm:max-w-[470px] sm:rounded-[1.75rem] lg:w-[520px] lg:max-w-[520px]"
            style={{
              height: "min(760px, calc(100dvh - 1rem))",
              maxHeight: "calc(100dvh - 1rem)",
            }}
            role="dialog"
            aria-modal="false"
            aria-label="TrackFlow Pro report chat"
          >
            <div className="relative shrink-0 overflow-hidden bg-slate-950 px-4 py-3.5 text-white sm:px-5 sm:py-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.42),transparent_36%),linear-gradient(135deg,#020617,#0f172a)]" />

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-3 top-3 z-20 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-white/80 shadow-lg shadow-slate-950/20 backdrop-blur transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/30 sm:right-4 sm:top-4"
                aria-label="Minimize chat"
              >
                <ChevronDown className="h-5 w-5 sm:hidden" />
                <X className="hidden h-4 w-4 sm:block" />
              </button>

              <div className="relative z-10 flex min-w-0 items-center gap-3 pr-12 sm:pr-14">
                <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-600 shadow-lg shadow-blue-900/40 sm:h-12 sm:w-12">
                  <Bot className="h-5 w-5" />
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
                </div>

                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-[15px] font-black leading-5 sm:text-base">Ask about this review</p>
                  <p className="mt-0.5 truncate text-xs font-semibold leading-5 text-blue-100/90">
                    {helperBadge} · answers from this report
                  </p>
                </div>
              </div>

              <div className="relative z-10 mt-3 grid grid-cols-2 gap-2 pr-0 sm:flex sm:flex-wrap sm:items-center">
                <span className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-blue-100 shadow-sm shadow-black/10 sm:px-3 sm:text-[10px] sm:tracking-[0.16em]">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Report-aware</span>
                </span>
                <span className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-blue-100 shadow-sm shadow-black/10 sm:px-3 sm:text-[10px] sm:tracking-[0.16em]">
                  <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Evidence-safe</span>
                </span>
              </div>
            </div>

            <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-4 py-2.5 sm:px-5">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[11px] sm:tracking-[0.18em]">
                Private tracking review for {companyName}
              </p>
              <p className="mt-1 truncate text-sm font-extrabold leading-5 text-slate-900">{headline}</p>
            </div>

            <div
              className="min-h-0 flex-1 overscroll-contain overflow-y-auto bg-gradient-to-b from-white to-slate-50 px-3.5 py-4 sm:px-4"
              aria-live="polite"
            >
              <div className="space-y-3">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  const isLatestAssistant = message.id === latestAssistantMessage?.id;

                  return (
                    <div key={message.id} className={`flex min-w-0 ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`min-w-0 max-w-[88%] sm:max-w-[86%] ${isUser ? "text-left" : "text-left"}`}>
                        <div
                          className={`min-w-0 break-words rounded-[1.35rem] px-4 py-3 shadow-sm ${
                            isUser
                              ? "rounded-br-md bg-blue-600 text-white shadow-blue-900/15"
                              : "rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-slate-950/5"
                          }`}
                        >
                          {message.content ? (
                            isUser ? (
                              <UserMessageText content={message.content} />
                            ) : (
                              <FormattedAssistantMessage content={message.content} />
                            )
                          ) : (
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Thinking...
                            </span>
                          )}
                        </div>

                        {isLatestAssistant && showFollowUps ? (
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            {followUpQuestionChips.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => void submitQuestion(item, "follow_up")}
                                disabled={isSending || isDisabled}
                                className="min-h-10 rounded-full border border-blue-100 bg-white px-3 py-2 text-left text-[11px] font-bold leading-4 text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {isHistoryLoading && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-500 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading saved conversation...
                    </div>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-3.5 pb-[calc(env(safe-area-inset-bottom)_+_0.75rem)] pt-3 sm:px-4 sm:pb-4">
              {!hasUserMessages && !isDisabled && starterQuestionChips.length > 0 ? (
                <div className="mb-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-blue-600" />
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 sm:tracking-[0.18em]">
                      Start with one question
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {starterQuestionChips.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => void submitQuestion(item, "starter")}
                        disabled={isSending || isDisabled}
                        className="min-h-11 rounded-2xl border border-blue-100 bg-white px-3 py-2.5 text-left text-[11px] font-bold leading-4 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {isDisabled ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-bold leading-5 text-amber-800">
                    The AI assistant is unavailable right now. You can still request a manual verification review.
                  </p>
                  <a
                    href={ctaHref}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-blue-700"
                  >
                    {ctaText}
                    <CheckCircle2 className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex min-w-0 items-end gap-2">
                  <label className="sr-only" htmlFor="trackflow-report-chat-input">
                    Ask a question about this tracking review
                  </label>
                  <textarea
                    ref={inputRef}
                    id="trackflow-report-chat-input"
                    value={question}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setQuestion(event.target.value)}
                    onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void submitQuestion();
                      }
                    }}
                    placeholder="Ask about this review..."
                    rows={1}
                    disabled={isSending}
                    className="min-h-[50px] min-w-0 flex-1 resize-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[48px] sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || isSending}
                    className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:h-12 sm:w-12"
                    aria-label="Send question"
                  >
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </form>
              )}

              <p className="mt-2 px-1 text-center text-[10px] font-semibold leading-4 text-slate-400">
                Conversation and basic visit details may be saved for follow-up. Final confirmation requires approved access.
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openAssistantChat("sticky_button")}
            className="group flex max-w-[calc(100vw-1rem)] items-center gap-3 rounded-full bg-blue-600 px-3.5 py-3.5 text-white shadow-2xl shadow-blue-950/25 transition hover:-translate-y-1 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:px-5 sm:py-4"
            aria-label="Open tracking review chat"
            aria-expanded={isOpen}
          >
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white/15">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-blue-600 bg-emerald-400" />
              <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-ping rounded-full bg-emerald-300 opacity-60" />
            </span>

            <span className="hidden min-w-0 text-left sm:block">
              <span className="block truncate text-sm font-black leading-none">Ask about this review</span>
              <span className="mt-1 block truncate text-[11px] font-bold text-blue-100">Online • report-aware answers</span>
            </span>

            <Sparkles className="hidden h-4 w-4 shrink-0 opacity-80 transition group-hover:rotate-12 sm:block" />
          </button>
        )}
      </div>
    </>
  );
}
