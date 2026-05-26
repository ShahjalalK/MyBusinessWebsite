"use client";

// ============================================================
// FILE: app/components/trackflow/ReportChatAssistant.tsx
// Purpose: Premium secure-page chatbot UI for report-aware tracking review Q&A.
// ============================================================

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ReportChatAssistantProps = {
  token: string;
  domainSlug: string;
  companyName?: string;
  headline?: string;
  ctaHref?: string;
  ctaText?: string;
};

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

function compactHistory(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.content.trim())
    .slice(-6)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 900),
    }));
}

export default function ReportChatAssistant({
  token,
  domainSlug,
  companyName = "this website",
  headline = "Private Tracking Review",
  ctaHref = "/contact",
  ctaText = "Book verification review",
}: ReportChatAssistantProps) {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: createId(),
      role: "assistant",
      content:
        "Hi — I can help explain this private tracking review, the evidence points, and the safest next verification steps. You can also ask who prepared the review. I’ll stay within the browser-visible evidence shown here.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [statusLabel, setStatusLabel] = useState("Report-aware assistant");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const suggestedQuestions = useMemo(
    () => [
      "What does this finding mean?",
      "What should we verify first?",
      "Can this affect Google Ads reporting?",
      "Who prepared this review?",
    ],
    [],
  );

  useEffect(() => {
    if (!token) return;
    setSessionId(getOrCreateSessionId(token));
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  async function submitQuestion(nextQuestion?: string) {
    const cleanQuestion = String(nextQuestion ?? question).trim();
    if (!cleanQuestion || isSending || isDisabled) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: cleanQuestion,
    };

    const assistantId = createId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setQuestion("");
    setIsSending(true);
    setStatusLabel("Answering from this review...");

    const abortController = new AbortController();
    const timeout = window.setTimeout(() => abortController.abort(), 65000);

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
          sessionId,
          history: compactHistory(messages),
        }),
      });

      if (!response.ok) {
        let payload: any = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }

        const message =
          payload?.message ||
          "The assistant could not answer right now. You can still request a manual verification review.";

        if (payload?.disableChat) {
          setIsDisabled(true);
          setStatusLabel("Manual verification recommended");
        } else {
          setStatusLabel("Temporary fallback");
        }

        setMessages((current) =>
          current.map((item) => (item.id === assistantId ? { ...item, content: message } : item)),
        );
        return;
      }

      if (!response.body) {
        const text = await response.text();
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantId
              ? {
                  ...item,
                  content: text || "I could not generate an answer right now.",
                }
              : item,
          ),
        );
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

        setMessages((current) =>
          current.map((item) => (item.id === assistantId ? { ...item, content: fullText } : item)),
        );
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

      setMessages((current) =>
        current.map((item) => (item.id === assistantId ? { ...item, content: message } : item)),
      );
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

  return (
    <section className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16" id="ask-this-review">
      <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-2xl shadow-blue-950/5">
        <div className="grid gap-0 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="relative overflow-hidden bg-slate-950 p-5 text-white sm:p-7 lg:p-8 xl:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.35),transparent_34%),linear-gradient(to_bottom,#020617,#0f172a)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-100">
                <Sparkles className="h-4 w-4" />
                Ask about this review
              </div>

              <h2 className="mt-5 text-2xl font-black leading-tight tracking-[-0.04em] sm:mt-6 sm:text-3xl lg:text-4xl">
                Understand the tracking findings before the next step.
              </h2>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
                This assistant answers from the saved private review for{" "}
                <span className="text-white">{companyName}</span>. It explains browser-visible
                evidence, recommendations, and the account-level checks that should happen next.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:block xl:space-y-3">
                {[
                  "Report-aware answers only",
                  "Evidence-safe wording",
                  "Final confirmation still requires approved access",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-bold text-slate-200 xl:border-0 xl:bg-transparent xl:p-0">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 sm:p-5 xl:mt-8">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-300" />
                  <p className="text-sm font-black text-white">Evidence note</p>
                </div>
                <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">
                  The assistant will not claim final account-level truth unless that evidence exists
                  in the review. It will recommend verification when account/server access is needed.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 sm:p-5 lg:p-6 xl:p-8">
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                        <Bot className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-black tracking-[-0.02em] text-slate-950 sm:text-base">
                          TrackFlow Review Assistant
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-slate-500">{statusLabel}</p>
                      </div>
                    </div>

                    <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                      {headline}
                    </p>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Private report
                  </div>
                </div>
              </div>

              <div className="max-h-[62vh] min-h-[300px] space-y-4 overflow-y-auto bg-slate-50 p-3 sm:min-h-[340px] sm:p-5 lg:max-h-[480px]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[94%] rounded-[1.25rem] px-4 py-3 text-sm font-semibold leading-7 shadow-sm sm:max-w-[88%] ${
                        message.role === "user"
                          ? "bg-blue-600 text-white shadow-blue-600/10"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {message.content ? (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Reviewing the saved report...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>

              <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-4 grid gap-2 sm:flex sm:flex-wrap">
                  {suggestedQuestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => void submitQuestion(item)}
                      disabled={isSending || isDisabled}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-black text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:rounded-full sm:text-center"
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
                  <label htmlFor="trackflow-report-chat-question" className="sr-only">
                    Ask a question about this tracking review
                  </label>
                  <input
                    id="trackflow-report-chat-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    disabled={isSending || isDisabled}
                    maxLength={700}
                    placeholder={
                      isDisabled
                        ? "Assistant temporarily unavailable — use the verification CTA."
                        : "Ask about this review, the evidence, or the next step..."
                    }
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isSending || isDisabled || !question.trim()}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send question"
                  >
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </form>

                {isDisabled ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-bold leading-6 text-amber-900">
                      The AI assistant is temporarily unavailable. You can still request a manual
                      tracking verification review.
                    </p>
                    <a
                      href={ctaHref}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 sm:w-auto"
                    >
                      {ctaText}
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <p className="mt-4 text-xs font-semibold leading-6 text-slate-500">
                    Questions may be saved to help review and respond to your tracking concerns.
                    Final confirmation may require account/server access.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
