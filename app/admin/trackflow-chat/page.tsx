import type { Metadata } from "next";
import Link from "next/link";
import {
  isReportChatLoggingConfigured,
  listReportChatSessions,
  loadReportChatMessages,
} from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TrackFlow Chat Conversations",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type PageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function formatDate(value?: string): string {
  if (!value) return "Unknown time";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function maskToken(value: string): string {
  if (!value) return "";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default async function TrackFlowChatAdminPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const providedKey = firstParam(params.key);
  const selectedSessionId = firstParam(params.sessionId);
  const adminSecret = process.env.TRACKFLOW_CHAT_ADMIN_SECRET || "";
  const configured = isReportChatLoggingConfigured();

  if (!adminSecret) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">TrackFlow Chat Admin</p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em]">Admin viewer is locked.</h1>
          <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
            Set <code className="rounded bg-white/10 px-2 py-1">TRACKFLOW_CHAT_ADMIN_SECRET</code> in Vercel before opening saved chat conversations.
          </p>
        </div>
      </main>
    );
  }

  if (providedKey !== adminSecret) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">TrackFlow Chat Admin</p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em]">Enter the admin key.</h1>
          <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
            Open this page with <code className="rounded bg-white/10 px-2 py-1">?key=YOUR_ADMIN_SECRET</code> to review saved Supabase chat conversations.
          </p>
        </div>
      </main>
    );
  }

  const sessions = configured ? await listReportChatSessions({ limit: 100 }) : [];
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) || sessions[0] || null;
  const messages = selectedSession
    ? await loadReportChatMessages({
        sessionId: selectedSession.id,
        reportToken: selectedSession.reportToken,
        limit: 120,
      })
    : [];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">TrackFlow Chat Admin</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Saved report chat conversations</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-300">
                Review client questions and assistant answers saved from secure tracking-review pages. Supabase stores the conversations; Firestore remains focused on report rendering.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-blue-100">
              {configured ? `${sessions.length} recent session${sessions.length === 1 ? "" : "s"}` : "Supabase not configured"}
            </div>
          </div>
        </div>

        {!configured ? (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <h2 className="text-lg font-black">Supabase logging is not configured.</h2>
            <p className="mt-2 text-sm font-semibold leading-7">
              Add <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>TRACKFLOW_CHAT_SESSIONS_TABLE</code>, and <code>TRACKFLOW_CHAT_MESSAGES_TABLE</code> to Vercel, then create the SQL tables from the patch.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
            <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Sessions</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Latest Supabase chat sessions</p>
                </div>
              </div>

              <div className="mt-4 max-h-[72vh] space-y-2 overflow-y-auto pr-1">
                {sessions.length ? (
                  sessions.map((session) => {
                    const active = selectedSession?.id === session.id;
                    return (
                      <Link
                        key={session.id}
                        href={`/admin/trackflow-chat?key=${encodeURIComponent(providedKey)}&sessionId=${encodeURIComponent(session.id)}`}
                        className={`block rounded-2xl border p-4 transition ${
                          active
                            ? "border-blue-200 bg-blue-50 shadow-sm"
                            : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-black text-slate-900">{session.domain || "Unknown domain"}</p>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">
                            {maskToken(session.reportToken)}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-xs font-semibold text-slate-500">Session: {session.id}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">{formatDate(session.updatedAt)}</p>
                      </Link>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                    <p className="text-sm font-bold text-slate-500">No chat sessions found yet.</p>
                  </div>
                )}
              </div>
            </aside>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 sm:p-6">
              {selectedSession ? (
                <>
                  <div className="border-b border-slate-100 pb-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Conversation</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
                      {selectedSession.domain || "Unknown domain"}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Token {maskToken(selectedSession.reportToken)} · Session {selectedSession.id}
                    </p>
                  </div>

                  <div className="mt-6 max-h-[72vh] space-y-4 overflow-y-auto pr-1">
                    {messages.length ? (
                      messages.map((message, index) => {
                        const isUser = message.role === "user";

                        return (
                          <div key={`${message.createdAt || index}_${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[82%] rounded-3xl px-5 py-4 text-sm leading-7 shadow-sm ${
                                isUser
                                  ? "rounded-br-md bg-blue-600 text-white"
                                  : "rounded-bl-md border border-slate-100 bg-slate-50 text-slate-700"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{message.content}</p>
                              <p className={`mt-3 text-[10px] font-bold ${isUser ? "text-blue-100" : "text-slate-400"}`}>
                                {formatDate(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                        <p className="text-sm font-bold text-slate-500">No messages were found for this session.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm font-bold text-slate-500">Select a session to review saved messages.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
