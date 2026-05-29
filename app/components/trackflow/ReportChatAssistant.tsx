"use client";

// ============================================================
// FILE: app/components/trackflow/ReportChatAssistant.tsx
// Purpose: Premium floating Messenger-style secure-page chatbot UI.
// ============================================================

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
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

function getOrCreateSessionId(token: string): string {
  const key = `trackflow_report_chat_session_${token || "unknown"}`;

  try {
    const existing = window.localStorage.getItem(key);
    if (existing && isUuid(existing)) return existing;

    const next = createUuid();
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return createUuid();
  }
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
      const content = String(record.content || "").replace(/\s+/g, " ").trim();

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

function isAssistantHeading(value: string): boolean {
  const text = cleanDisplayLine(value).replace(/[:：]\s*$/, "");
  if (!text || text.length > 62) return false;

  return /^(short answer|what this means|what to verify next|important note|evidence to review|next step|why it matters|how to think about it|recommended action|verification plan)$/i.test(
    text,
  );
}

function splitKnownHeading(value: string): { title: string; body: string } | null {
  const cleaned = cleanDisplayLine(value);
  const match = cleaned.match(
    /^(Short answer|What this means|What to verify next|Important note|Evidence to review|Next step|Why it matters|How to think about it|Recommended action|Verification plan)\s*[:：]\s*(.+)$/i,
  );

  if (!match) return null;

  return {
    title: match[1],
    body: match[2],
  };
}

function FormattedAssistantMessage({ content }: { content: string }) {
  const lines = String(content || "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n");

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
          <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-700">{headingPair.body}</p>
        </div>,
      );
      return;
    }

    elements.push(
      <p key={`p-${elements.length}`} className="text-sm font-semibold leading-6 text-slate-700">
        {paragraph}
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
            <span>{item}</span>
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
            <span>{item}</span>
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
        {cleanDisplayLine(content)}
      </p>
    );
  }

  return <div className="space-y-3">{elements}</div>;
}

function UserMessageText({ content }: { content: string }) {
  return <p className="whitespace-pre-wrap text-sm font-semibold leading-6">{content}</p>;
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
    setSessionId(getOrCreateSessionId(token));
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
    const openChat = () => {
      setIsOpen(true);
      window.setTimeout(() => {
        inputRef.current?.focus();
        resizeInput();
      }, 180);
    };

    const openFromHash = () => {
      if (window.location.hash === "#ask-this-review") openChat();
    };

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const trigger = target.closest('a[href="#ask-this-review"], [data-trackflow-chat-open="true"]');
      if (!trigger) return;

      event.preventDefault();
      openChat();
    };

    openFromHash();
    document.addEventListener("click", onDocumentClick);
    window.addEventListener("hashchange", openFromHash);

    return () => {
      document.removeEventListener("click", onDocumentClick);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, []);

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

  async function submitQuestion(nextQuestion?: string) {
    const cleanQuestion = String(nextQuestion ?? question).trim();
    if (!cleanQuestion || isSending || isDisabled) return;

    const activeSessionId = sessionId || getOrCreateSessionId(token);
    if (!sessionId) setSessionId(activeSessionId);

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

      <div className="fixed inset-x-3 bottom-4 z-[90] flex flex-col items-end sm:inset-x-auto sm:right-6 lg:bottom-6">
        {isOpen ? (
          <div
            className="flex h-[min(720px,calc(100vh-32px))] w-full max-w-[540px] flex-col overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-2xl shadow-slate-950/25 sm:w-[470px] lg:w-[520px]"
            role="dialog"
            aria-modal="false"
            aria-label="TrackFlow Pro report chat"
          >
            <div className="relative overflow-hidden bg-slate-950 px-5 py-4 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.45),transparent_32%),linear-gradient(135deg,#020617,#0f172a)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-600 shadow-lg shadow-blue-900/40">
                    <Bot className="h-5 w-5" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">Ask about this review</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-blue-100">{helperBadge} · answers from this report</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/10 bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                  aria-label="Close chat"
                >
                  <ChevronDown className="h-4 w-4 sm:hidden" />
                  <X className="hidden h-4 w-4 sm:block" />
                </button>
              </div>

              <div className="relative mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Report-aware
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Evidence-safe
                </span>
              </div>
            </div>

            <div className="border-b border-slate-100 bg-slate-50 px-5 py-2.5">
              <p className="line-clamp-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Private tracking review for {companyName}
              </p>
              <p className="mt-1 line-clamp-1 text-sm font-extrabold text-slate-900">{headline}</p>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50 px-4 py-4"
              aria-live="polite"
            >
              <div className="space-y-3">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  const isLatestAssistant = message.id === latestAssistantMessage?.id;

                  return (
                    <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[92%] ${isUser ? "text-right" : "text-left"}`}>
                        <div
                          className={`rounded-3xl px-4 py-3 shadow-sm ${
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
                          <div className="mt-2 flex flex-wrap gap-2">
                            {followUpQuestionChips.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => void submitQuestion(item)}
                                disabled={isSending || isDisabled}
                                className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-left text-[11px] font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="border-t border-slate-100 bg-white p-4">
              {!hasUserMessages && !isDisabled && starterQuestionChips.length > 0 ? (
                <div className="mb-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                      Start with one question
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {starterQuestionChips.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => void submitQuestion(item)}
                        disabled={isSending || isDisabled}
                        className="rounded-2xl border border-blue-100 bg-white px-3 py-2 text-left text-[11px] font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
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
                    className="min-h-[48px] flex-1 resize-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || isSending}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    aria-label="Send question"
                  >
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </form>
              )}

              <p className="mt-2 text-center text-[10px] font-semibold leading-4 text-slate-400">
                Conversation may be saved for follow-up. Final confirmation requires approved access.
              </p>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="group flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-full bg-blue-600 px-4 py-3.5 text-white shadow-2xl shadow-blue-950/25 transition hover:-translate-y-1 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:px-5 sm:py-4"
              aria-label="Open tracking review chat"
              aria-expanded={isOpen}
            >
              <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white/15">
                <MessageCircle className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-blue-600 bg-emerald-400" />
                <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-ping rounded-full bg-emerald-300 opacity-60" />
              </span>

              <span className="hidden text-left sm:block">
                <span className="block text-sm font-black leading-none">Ask about this review</span>
                <span className="mt-1 block text-[11px] font-bold text-blue-100">Online • report-aware answers</span>
              </span>

              <Sparkles className="hidden h-4 w-4 opacity-80 transition group-hover:rotate-12 sm:block" />
            </button>
          </>
        )}
      </div>
    </>
  );
}
