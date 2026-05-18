import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Tracking Audit Note | TrackFlow Pro",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type ReportPageProps = {
  params: Promise<{ token: string }> | { token: string };
};

function normalizeToken(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function cleanText(value: unknown, fallback = ""): string {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function cleanList(value: unknown, fallback: string[] = []): string[] {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\n|\||;/g) : [];
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of items) {
    const text = cleanText(item);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    output.push(text);
    if (output.length >= 8) break;
  }

  return output.length ? output : fallback;
}

function safeUrl(value: unknown): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function formatDate(value: unknown): string {
  const ms = toMillis(value);
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function ReportPage({ params }: ReportPageProps) {
  const resolvedParams = await params;
  const token = normalizeToken(resolvedParams.token);

  if (!token) notFound();

  const reportRef = adminDb.collection("audit_reports").doc(token);
  const reportSnap = await reportRef.get();

  if (!reportSnap.exists) notFound();

  const report = reportSnap.data() || {};

  if (report.active === false) notFound();

  const expiresAtMs = toMillis(report.pdfExpiresAt || report.expiresAt);
  if (expiresAtMs && Date.now() > expiresAtMs) notFound();

  await reportRef.set(
    {
      viewCount: admin.firestore.FieldValue.increment(1),
      lastViewedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  if (report.leadId) {
    await adminDb
      .collection("outreach_leads")
      .doc(String(report.leadId))
      .set(
        {
          reportViewedAt: admin.firestore.FieldValue.serverTimestamp(),
          reportPageViewed: true,
          tracking_history: admin.firestore.FieldValue.arrayUnion({
            event: "report_page_viewed",
            reportToken: token,
            time: admin.firestore.Timestamp.now(),
          }),
        },
        { merge: true },
      );
  }

  const companyName = cleanText(report.companyName, "this website");
  const domain = cleanText(report.domain || report.websiteUrl || report.website, "");
  const headline = cleanText(report.headline, "Private tracking audit note");
  const mainFinding = cleanText(
    report.mainFinding,
    "A tracking review may be useful based on public browser-visible evidence.",
  );
  const businessImpact = cleanText(
    report.businessImpact,
    "If important lead actions are not measured clearly, it can be harder to know which marketing channels are creating enquiries.",
  );

  const proofPoints = cleanList(report.proofPoints, [
    "Public browser-visible audit evidence was reviewed.",
    "Final account-level confirmation still requires access to GA4, GTM, Google Ads, CRM, or server tools.",
  ]);

  const recommendations = cleanList(report.recommendations, [
    "Verify the main lead journey in GA4, GTM Preview, and Google Ads diagnostics.",
    "Confirm final lead recording inside the account or CRM before making final tracking decisions.",
  ]);

  const pdfPreviewUrl = safeUrl(report.pdfViewUrl || report.pdfDownloadUrl);
  const downloadHref = `/api/trackflow/reports/download?token=${encodeURIComponent(token)}`;
  const ctaTarget = cleanText(report.ctaUrl, "/contact");
  const ctaHref = `/api/trackflow/reports/cta?token=${encodeURIComponent(token)}&target=${encodeURIComponent(ctaTarget)}`;
  const expiresLabel = formatDate(report.pdfExpiresAt || report.expiresAt);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-900 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between gap-4 text-white">
          <Link href="/" className="text-sm font-black tracking-tight md:text-base">
            TrackFlow Pro
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-200">
              Private client page
            </span>
          </div>
        </header>

        <section className="overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-2xl shadow-blue-950/40">
          <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white md:p-12">
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">
                Google Ads · GA4 · Conversion tracking review
              </p>
              <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight md:text-5xl">
                {headline}
              </h1>
              <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-slate-200 md:text-base">
                Prepared for <span className="font-black text-white">{companyName}</span>
                {domain ? (
                  <>
                    {" "}
                    · <span className="text-blue-100">{domain}</span>
                  </>
                ) : null}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-100">
                  Client-safe summary
                </span>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-100">
                  PDF attached
                </span>
                {expiresLabel ? (
                  <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-amber-100">
                    Available until {expiresLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 md:grid-cols-[1.15fr_0.85fr] md:p-8">
            <div className="space-y-6">
              <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                  Main finding
                </p>
                <p className="mt-3 text-base font-bold leading-8 text-slate-900">
                  {mainFinding}
                </p>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Evidence reviewed
                </p>
                <ul className="mt-4 space-y-3">
                  {proofPoints.map((point, index) => (
                    <li key={`${point}-${index}`} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                  Why this matters
                </p>
                <p className="mt-3 text-sm font-bold leading-7 text-emerald-950">
                  {businessImpact}
                </p>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Audit PDF preview
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      The full PDF is hosted separately and shown here through this private TrackFlow page.
                    </p>
                  </div>
                  <a
                    href={downloadHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track-event="report_pdf_download_click"
                    className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-700"
                  >
                    Download PDF
                  </a>
                </div>

                {pdfPreviewUrl ? (
                  <iframe
                    src={pdfPreviewUrl}
                    title="Tracking audit PDF preview"
                    className="h-[540px] w-full rounded-2xl border border-slate-200 bg-slate-100"
                    loading="lazy"
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
                    PDF preview link is not available. Use the download button or contact TrackFlow Pro.
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Recommended next step
                </p>
                <ul className="mt-4 space-y-3">
                  {recommendations.map((item, index) => (
                    <li key={`${item}-${index}`} className="text-sm font-bold leading-6 text-slate-700">
                      {index + 1}. {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-3">
                  <a
                    href={ctaHref}
                    data-track-event="report_book_review_click"
                    className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-slate-950"
                  >
                    {cleanText(report.ctaText, "Book a tracking review")}
                  </a>

                  <a
                    href={downloadHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track-event="report_pdf_download_click"
                    className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-black text-slate-900 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    Download PDF
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">What this page is</p>
                <p className="mt-3 text-xs font-semibold leading-6 text-slate-600">
                  This is a client-safe summary based on public browser-visible evidence. It does not claim account-level conversion recording without access to GA4, GTM, Google Ads, server logs, CRM, or ad account diagnostics.
                </p>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-xs font-semibold leading-6 text-amber-900">
                Final implementation decisions should be made after checking the internal tracking tools and lead journey inside the account.
              </div>
            </aside>
          </div>
        </section>

        <footer className="mt-6 text-center text-xs font-semibold text-slate-400">
          TrackFlow Pro · Google Ads, GA4 & server-side tracking specialist
        </footer>
      </div>
    </main>
  );
}
