import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { readB2Object, sanitizeB2Key } from "@/lib/trackflow-storage/b2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TFP_SECURE_EVIDENCE_ASSET_DEBUG_VERSION = "v27.57-secure-evidence-render-phase3-2026-06-21";

type AnyRecord = Record<string, any>;

function clean(value: unknown, fallback = ""): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeToken(value: unknown): string {
  return clean(value)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

function normalizeAssetId(value: unknown): string {
  return clean(value)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 120);
}

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstArrayCandidate(...values: unknown[]): AnyRecord[] {
  for (const value of values) {
    if (Array.isArray(value)) return value.filter((item): item is AnyRecord => Boolean(item && typeof item === "object" && !Array.isArray(item)));
  }
  return [];
}

function isAllowedEvidenceMimeType(value: unknown): boolean {
  const type = clean(value).toLowerCase();
  return ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/avif"].includes(type);
}

function safeDebugLog(stage: string, details: AnyRecord = {}) {
  try {
    console.log(
      "[TFP_SECURE_EVIDENCE_ASSET_DEBUG]",
      JSON.stringify({
        version: TFP_SECURE_EVIDENCE_ASSET_DEBUG_VERSION,
        stage,
        ...details,
      }),
    );
  } catch {
    console.log("[TFP_SECURE_EVIDENCE_ASSET_DEBUG]", TFP_SECURE_EVIDENCE_ASSET_DEBUG_VERSION, stage, details);
  }
}

function findEvidenceAsset(report: AnyRecord, assetId: string): AnyRecord | null {
  const privateCopy = report.privateReportCopy || report.private_report_copy || {};
  const assets = firstArrayCandidate(
    report.securePageEvidenceAssets,
    report.secure_page_evidence_assets,
    privateCopy.securePageEvidenceAssets,
    privateCopy.secure_page_evidence_assets,
  );

  return assets.find((asset) => normalizeAssetId(asset.id || asset.assetId || asset.asset_id) === assetId) || null;
}

function safeEvidenceKey(rawKey: unknown, token: string): string {
  const key = sanitizeB2Key(clean(rawKey));

  if (!key.startsWith("reports/")) {
    throw new Error("Evidence asset key is outside the reports folder.");
  }

  if (!key.includes(`/${token}/secure-evidence/`)) {
    throw new Error("Evidence asset key does not belong to this secure report token.");
  }

  if (/\.pdf(?:$|[?#])/i.test(key) || key.includes("/pdf/")) {
    throw new Error("PDF keys cannot be served through the evidence image endpoint.");
  }

  return key;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = normalizeToken(url.searchParams.get("token"));
  const assetId = normalizeAssetId(url.searchParams.get("assetId") || url.searchParams.get("asset_id"));

  safeDebugLog("request", {
    hasToken: Boolean(token),
    tokenSuffix: token ? token.slice(-8) : "",
    assetId,
  });

  if (!token || !assetId) {
    return NextResponse.json({ error: "Missing report token or asset id." }, { status: 400 });
  }

  try {
    const snap = await adminDb.collection("audit_reports").doc(token).get();
    if (!snap.exists) {
      safeDebugLog("report_not_found", { tokenSuffix: token.slice(-8), assetId });
      return NextResponse.json({ error: "Evidence asset not found." }, { status: 404 });
    }

    const report = snap.data() || {};
    if (report.active === false) {
      safeDebugLog("report_inactive", { tokenSuffix: token.slice(-8), assetId });
      return NextResponse.json({ error: "Evidence asset not found." }, { status: 404 });
    }

    const expiresAtMs = toMillis(report.pdfExpiresAt || report.expiresAt);
    if (expiresAtMs && Date.now() > expiresAtMs) {
      safeDebugLog("report_expired", { tokenSuffix: token.slice(-8), assetId });
      return NextResponse.json({ error: "Evidence asset not found." }, { status: 404 });
    }

    const asset = findEvidenceAsset(report, assetId);
    if (!asset) {
      safeDebugLog("asset_not_found", {
        tokenSuffix: token.slice(-8),
        assetId,
        storedCount: firstArrayCandidate(report.securePageEvidenceAssets, report.secure_page_evidence_assets).length,
      });
      return NextResponse.json({ error: "Evidence asset not found." }, { status: 404 });
    }

    const mimeType = clean(asset.mimeType || asset.mime_type).toLowerCase();
    if (!isAllowedEvidenceMimeType(mimeType)) {
      safeDebugLog("asset_mime_rejected", { tokenSuffix: token.slice(-8), assetId, mimeType });
      return NextResponse.json({ error: "Evidence asset type is not supported." }, { status: 415 });
    }

    const key = safeEvidenceKey(asset.b2Key || asset.b2_key || asset.key || asset.storageKey || asset.storage_key, token);
    safeDebugLog("b2_read_start", {
      tokenSuffix: token.slice(-8),
      assetId,
      role: clean(asset.role),
      mimeType,
      b2Key: key,
    });

    const object = await readB2Object(key);
    const responseContentType = mimeType || object.contentType || "application/octet-stream";

    safeDebugLog("b2_read_success", {
      tokenSuffix: token.slice(-8),
      assetId,
      role: clean(asset.role),
      size: object.buffer.byteLength,
      contentType: responseContentType,
    });

    return new NextResponse(new Uint8Array(object.buffer), {
      status: 200,
      headers: {
        "content-type": responseContentType,
        "content-length": String(object.buffer.byteLength),
        "cache-control": "private, max-age=600, stale-while-revalidate=120",
        "x-content-type-options": "nosniff",
        ...(object.etag ? { etag: object.etag.startsWith('"') ? object.etag : `"${object.etag}"` } : {}),
      },
    });
  } catch (error) {
    safeDebugLog("error", {
      tokenSuffix: token.slice(-8),
      assetId,
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: "Evidence asset could not be loaded." }, { status: 500 });
  }
}
