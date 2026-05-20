/**
 * TrackFlowPro free-limit + integration smoke tests
 *
 * Run from the EMAIL AUTOMATION / Next.js project root, not from the Python audit project.
 *   node --test trackflow-free-limit-smoke.test.js
 *
 * Optional deeper checks:
 *   RUN_INTEGRATION_SMOKE=true node --test trackflow-free-limit-smoke.test.js
 *   RUN_GOOGLE_DRIVE_SMOKE=true node --test trackflow-free-limit-smoke.test.js
 *   RUN_PYTHON_HEALTH_SMOKE=true node --test trackflow-free-limit-smoke.test.js
 *
 * Why this file exists:
 * - Logic tests catch safety regressions without touching Firebase/Drive/Brevo.
 * - Project file tests catch accidentally removed guardrails.
 * - Env tests catch missing production settings before deploy.
 * - Optional integration tests verify real external connections only when explicitly enabled.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES = 60;
const DEFAULT_MAX_FOLLOWUP_BATCH = 20;
const PROJECT_ROOT = path.resolve(process.env.TRACKFLOW_PROJECT_ROOT || process.cwd());

// This test file is meant for the email automation Next.js project.
// The Python audit project can live in another folder; we only hit it by URL when RUN_PYTHON_HEALTH_SMOKE=true.
const PROJECT_FILES = {
  trackflowRoute: path.join(PROJECT_ROOT, "app/api/trackflow/[...action]/route.ts"),
  reportPage: path.join(PROJECT_ROOT, "app/r/[token]/page.tsx"),
  senders: path.join(PROJECT_ROOT, "lib/senders.ts"),
  leadStore: path.join(PROJECT_ROOT, "app/stores/useLeadStore.ts"),
  dashboardStore: path.join(PROJECT_ROOT, "app/stores/useTrackflowDashboardStore.ts"),
};

function parseDotEnv(content) {
  const out = {};
  for (const line of String(content || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2] || "";
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value.replace(/\\n/g, "\n");
  }
  return out;
}

function loadLocalEnv() {
  const envFiles = [".env", ".env.local", ".env.development", ".env.development.local", ".env.production.local"];
  for (const file of envFiles) {
    const abs = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(abs)) continue;
    const parsed = parseDotEnv(fs.readFileSync(abs, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadLocalEnv();

function envFlag(name, fallback = false) {
  const raw = String(process.env[name] ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "on", "enabled"].includes(raw);
}

function envValue(name) {
  return String(process.env[name] || "").trim();
}

function hasAnyEnv(names) {
  return names.some((name) => Boolean(envValue(name)));
}

function missingEnv(names) {
  return names.filter((name) => !envValue(name));
}

function skipProjectFileChecks() {
  return envFlag("TRACKFLOW_SKIP_PROJECT_FILE_CHECKS", false);
}

function readProjectFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function scheduleBeforeEngagementTime(anchorEngagedMs, delayMinutes) {
  if (!anchorEngagedMs) return 0;
  const safeDelay = Number.isFinite(delayMinutes) && delayMinutes > 0 ? delayMinutes : 1440;
  return anchorEngagedMs + (safeDelay - FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES) * 60_000;
}

function stripDangerousHtml(input) {
  let html = String(input || "");
  html = html.replace(/<(script|iframe|object|embed|form|textarea|input|button|select|option|link|meta|style)[\s\S]*?>[\s\S]*?<\/\1>/gi, "");
  html = html.replace(/<(script|iframe|object|embed|form|textarea|input|button|select|option|link|meta|style)\b[^>]*\/?\s*>/gi, "");
  html = html.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  html = html.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
  html = html.replace(/javascript\s*:/gi, "");
  html = html.replace(/data\s*:\s*text\/html/gi, "");
  html = html.replace(/vbscript\s*:/gi, "");
  return html.trim();
}

function isSheetProcessingLockStale(lockedAt, nowMs, maxAgeMinutes = 30) {
  const parsed = Date.parse(String(lockedAt || ""));
  if (!Number.isFinite(parsed)) return true;
  return nowMs - parsed > maxAgeMinutes * 60_000;
}

function normalizeReportToken(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

function normalizeOptionalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function isUnsafeLocalOrRawReportUrl(value) {
  const lower = String(value || "").trim().toLowerCase();
  if (!lower) return true;
  if (lower.includes("localhost") || lower.includes("127.0.0.1") || lower.includes("0.0.0.0")) return true;
  if (lower.includes(":8000/") || lower.includes("/audit/pdf/") || lower.includes("/audit/evidence/")) return true;
  if (lower.includes("drive.google.com") || lower.includes("googleusercontent.com")) return true;
  if (/\.pdf(?:$|[?#])/.test(lower)) return true;
  return false;
}

function extractTokenFromReportUrl(value) {
  const safe = normalizeOptionalUrl(value);
  if (!safe) return "";
  try {
    const url = new URL(safe);
    const match = url.pathname.match(/^\/r\/([a-z0-9_-]{8,96})\/?$/i);
    return match ? normalizeReportToken(match[1]) : "";
  } catch {
    return "";
  }
}

function isSecureReportUrl(value) {
  const safe = normalizeOptionalUrl(value);
  if (!safe || isUnsafeLocalOrRawReportUrl(safe)) return false;
  return Boolean(extractTokenFromReportUrl(safe));
}

function isSafePdfStorageUrl(value) {
  const safe = normalizeOptionalUrl(value);
  if (!safe) return false;
  const lower = safe.toLowerCase();
  if (lower.includes("localhost") || lower.includes("127.0.0.1") || lower.includes("0.0.0.0")) return false;
  if (lower.includes(":8000/") || lower.includes("/audit/pdf/") || lower.includes("/audit/evidence/")) return false;
  return /^https?:\/\//i.test(safe);
}

function isFutureOrEmptyDate(value, nowMs = Date.now()) {
  const raw = String(value || "").trim();
  if (!raw) return true;
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return false;
  return parsed > nowMs;
}

function validateSheetReportReady(row, nowMs = Date.now()) {
  const blockers = [];
  const reportToken = normalizeReportToken(row.reportToken || row["Report Token"]);
  const reportUrl = row.reportUrl || row["Report URL"];
  const urlToken = extractTokenFromReportUrl(reportUrl);

  if (!/^\S+@\S+\.\S+$/.test(String(row.finalEmail || row["Final Email"] || "").trim())) blockers.push("invalid_email");
  if (!String(row.emailSubject || row["Email Subject"] || "").trim()) blockers.push("missing_subject");
  if (!String(row.emailBody || row["Email Body"] || "").trim()) blockers.push("missing_body");
  if (!String(row.mainIssue || row["Main Issue"] || "").trim()) blockers.push("missing_main_issue");
  if (!isSecureReportUrl(reportUrl)) blockers.push("unsafe_report_url");
  if (!reportToken) blockers.push("missing_report_token");
  if (reportToken && urlToken && reportToken !== urlToken) blockers.push("report_token_url_mismatch");
  if (!String(row.pdfFileId || row["PDF File ID"] || "").trim()) blockers.push("missing_pdf_file_id");
  if (!isSafePdfStorageUrl(row.pdfViewUrl || row["PDF View URL"]) && !isSafePdfStorageUrl(row.pdfDownloadUrl || row["PDF Download URL"])) blockers.push("missing_safe_pdf_url");
  if (!isFutureOrEmptyDate(row.pdfExpiresAt || row["PDF Expires At"], nowMs)) blockers.push("expired_or_invalid_pdf_expires_at");

  return blockers;
}

function cleanupDecisionForTest({ status = "sent", sentAt, openCount = 0, clickCount = 0, locked = false }, nowMs) {
  if (locked || status === "processing_initial" || status === "processing_followup") return { eligible: false, outcome: "blocked" };
  const daysOld = Math.floor((nowMs - sentAt) / 86_400_000);
  if (["unsubscribed", "spam", "bounced", "not_interested"].includes(status)) return { eligible: true, outcome: "suppression_required" };
  if (status === "replied" || status === "interested") return { eligible: daysOld >= 365, outcome: daysOld >= 365 ? "replied_review" : "not_due" };
  const hasEngagement = openCount > 0 || clickCount > 0;
  if (hasEngagement) return { eligible: daysOld >= 90, outcome: daysOld >= 90 ? "warm_no_reply" : "not_due" };
  return { eligible: daysOld >= 45, outcome: daysOld >= 45 ? "cold_no_reply" : "not_due" };
}

function isContactMemoryCooldownActive(memory, nowMs) {
  const cooldownMs = Date.parse(String(memory.cooldownUntil || ""));
  const expiresMs = Date.parse(String(memory.memoryExpiresAt || ""));
  if (!Number.isFinite(cooldownMs) || cooldownMs <= nowMs) return false;
  if (Number.isFinite(expiresMs) && expiresMs <= nowMs) return false;
  return true;
}

function isRetryableDailyLimitErrorForTest(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("daily limit") || message.includes("limit reached") || message.includes("blocked_daily_limit");
}

function shouldReleaseDailySlotForTest(emailActuallySent) {
  return !emailActuallySent;
}

function shouldStoreRawEmailEventForTest(event, options = {}) {
  const name = String(event || "").toLowerCase().trim();
  if (!name) return false;
  if (options.storeLowValue === true) return true;
  if (name === "sent") return options.storeSent === true;
  return ["replied", "reply", "unsubscribed", "spam", "hard_bounce", "soft_bounce", "bounced", "failed", "cron_error", "manual_action"].includes(name);
}

function clampBatch(value, fallback = 5, max = DEFAULT_MAX_FOLLOWUP_BATCH) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.max(1, Math.min(Math.floor(n), max));
}

function automationSwitchState(env = process.env) {
  const paused = ["1", "true", "yes", "on"].includes(String(env.AUTOMATION_PAUSED || "").toLowerCase());
  return {
    automationPaused: paused,
    sheetQueueEnabled: !paused && !["0", "false", "no", "off", "disabled"].includes(String(env.SHEET_QUEUE_SEND_ENABLED || "true").toLowerCase()),
    followupsEnabled: !paused && !["0", "false", "no", "off", "disabled"].includes(String(env.FOLLOWUPS_ENABLED || "true").toLowerCase()),
  };
}

function isDriveCleanupRequiredForPermanentDelete(env = process.env) {
  const enabled = !["0", "false", "no", "off", "disabled"].includes(String(env.DELETE_DRIVE_PDF_ON_LEAD_DELETE || "true").toLowerCase());
  const mode = String(env.DRIVE_PDF_DELETE_MODE || "trash").toLowerCase();
  return { enabled, mode: mode === "delete" ? "delete" : "trash" };
}

// -----------------------------
// Pure safety tests: always run
// -----------------------------

test("follow-up is scheduled one hour before the same engagement window", () => {
  const openedAt = new Date("2026-05-15T10:30:00+06:00").getTime();
  const scheduled = scheduleBeforeEngagementTime(openedAt, 2 * 24 * 60);
  assert.equal(new Date(scheduled).toISOString(), new Date("2026-05-17T09:30:00+06:00").toISOString());
});

test("sanitizer removes risky HTML", () => {
  const html = '<p onclick="x()">Hi</p><script>alert(1)</script><a href="javascript:bad()">bad</a><iframe src="x"></iframe>';
  const clean = stripDangerousHtml(html);
  assert.equal(clean.includes("script"), false);
  assert.equal(clean.includes("iframe"), false);
  assert.equal(clean.includes("onclick"), false);
  assert.equal(clean.includes("javascript:"), false);
});

test("fresh Sheet Processing lock is not stale", () => {
  const now = Date.parse("2026-05-15T10:30:00.000Z");
  assert.equal(isSheetProcessingLockStale("2026-05-15T10:10:00.000Z", now), false);
});

test("old Sheet Processing lock is stale", () => {
  const now = Date.parse("2026-05-15T10:30:00.000Z");
  assert.equal(isSheetProcessingLockStale("2026-05-15T09:00:00.000Z", now), true);
});

test("cold no-reply lead becomes cleanup due after 45 days", () => {
  const now = Date.parse("2026-03-31T00:00:00.000Z");
  const sentAt = Date.parse("2026-02-10T00:00:00.000Z");
  const decision = cleanupDecisionForTest({ sentAt }, now);
  assert.equal(decision.eligible, true);
  assert.equal(decision.outcome, "cold_no_reply");
});

test("warm open/click lead waits 90 days before cleanup", () => {
  const now = Date.parse("2026-03-31T00:00:00.000Z");
  const sentAt = Date.parse("2026-02-10T00:00:00.000Z");
  const decision = cleanupDecisionForTest({ sentAt, openCount: 1 }, now);
  assert.equal(decision.eligible, false);
  assert.equal(decision.outcome, "not_due");
});

test("queued or processing lead is blocked from hard cleanup", () => {
  const now = Date.parse("2026-03-31T00:00:00.000Z");
  const sentAt = Date.parse("2026-01-01T00:00:00.000Z");
  const decision = cleanupDecisionForTest({ sentAt, status: "processing_followup" }, now);
  assert.equal(decision.eligible, false);
  assert.equal(decision.outcome, "blocked");
});

test("active contact memory blocks first send attempt with warning", () => {
  const now = Date.parse("2026-05-15T10:30:00.000Z");
  const memory = { cooldownUntil: "2026-08-15T10:30:00.000Z", memoryExpiresAt: "2026-08-15T10:30:00.000Z" };
  assert.equal(isContactMemoryCooldownActive(memory, now), true);
});

test("expired contact memory does not block send", () => {
  const now = Date.parse("2026-05-15T10:30:00.000Z");
  const memory = { cooldownUntil: "2026-04-15T10:30:00.000Z", memoryExpiresAt: "2026-08-15T10:30:00.000Z" };
  assert.equal(isContactMemoryCooldownActive(memory, now), false);
});

test("daily limit sheet queue failure stays retryable", () => {
  assert.equal(isRetryableDailyLimitErrorForTest(new Error("Sender daily limit reached")), true);
  assert.equal(isRetryableDailyLimitErrorForTest(new Error("Invalid email")), false);
});

test("daily slot is not released after provider accepts email", () => {
  assert.equal(shouldReleaseDailySlotForTest(true), false);
  assert.equal(shouldReleaseDailySlotForTest(false), true);
});

test("sheet queued send is blocked without secure report/PDF fields", () => {
  const blockers = validateSheetReportReady({
    finalEmail: "owner@example.com",
    emailSubject: "Quick tracking note",
    emailBody: "Hi, I noticed one tracking item.",
    mainIssue: "Lead tracking may need verification.",
    reportToken: "abc123456789",
    reportUrl: "http://localhost:8000/audit/pdf/abc",
    pdfFileId: "",
    pdfViewUrl: "http://localhost:8000/audit/pdf/abc",
  });
  assert.ok(blockers.includes("unsafe_report_url"));
  assert.ok(blockers.includes("missing_pdf_file_id"));
  assert.ok(blockers.includes("missing_safe_pdf_url"));
});

test("sheet queued send accepts secure /r report page and Drive PDF fields", () => {
  const blockers = validateSheetReportReady({
    finalEmail: "owner@example.com",
    emailSubject: "Quick tracking note",
    emailBody: "Hi, I noticed one tracking item.",
    mainIssue: "Lead tracking may need verification.",
    reportToken: "abc123456789",
    reportUrl: "https://trackflowpro.com/r/abc123456789",
    pdfFileId: "drive-file-id",
    pdfViewUrl: "https://drive.google.com/file/d/drive-file-id/view?usp=sharing",
    pdfDownloadUrl: "https://drive.google.com/uc?export=download&id=drive-file-id",
    pdfExpiresAt: "2099-01-01T00:00:00.000Z",
  });
  assert.deepEqual(blockers, []);
});

test("report token mismatch between Sheet token and /r URL is blocked", () => {
  const blockers = validateSheetReportReady({
    finalEmail: "owner@example.com",
    emailSubject: "Quick tracking note",
    emailBody: "Hi",
    mainIssue: "Tracking item",
    reportToken: "token-one",
    reportUrl: "https://trackflowpro.com/r/token-two",
    pdfFileId: "drive-file-id",
    pdfViewUrl: "https://drive.google.com/file/d/drive-file-id/view?usp=sharing",
  });
  assert.ok(blockers.includes("report_token_url_mismatch"));
});

test("expired PDF/report is blocked before outreach", () => {
  const blockers = validateSheetReportReady({
    finalEmail: "owner@example.com",
    emailSubject: "Quick tracking note",
    emailBody: "Hi",
    mainIssue: "Tracking item",
    reportToken: "abc123456789",
    reportUrl: "https://trackflowpro.com/r/abc123456789",
    pdfFileId: "drive-file-id",
    pdfViewUrl: "https://drive.google.com/file/d/drive-file-id/view?usp=sharing",
    pdfExpiresAt: "2020-01-01T00:00:00.000Z",
  }, Date.parse("2026-01-01T00:00:00.000Z"));
  assert.ok(blockers.includes("expired_or_invalid_pdf_expires_at"));
});

test("automation emergency switches behave as kill switches only", () => {
  assert.deepEqual(automationSwitchState({ AUTOMATION_PAUSED: "true", SHEET_QUEUE_SEND_ENABLED: "true", FOLLOWUPS_ENABLED: "true" }), {
    automationPaused: true,
    sheetQueueEnabled: false,
    followupsEnabled: false,
  });
  assert.deepEqual(automationSwitchState({ AUTOMATION_PAUSED: "false", SHEET_QUEUE_SEND_ENABLED: "true", FOLLOWUPS_ENABLED: "false" }), {
    automationPaused: false,
    sheetQueueEnabled: true,
    followupsEnabled: false,
  });
});

test("cron batch limits are clamped to free-limit friendly caps", () => {
  assert.equal(clampBatch(0), 5);
  assert.equal(clampBatch(3), 3);
  assert.equal(clampBatch(999), DEFAULT_MAX_FOLLOWUP_BATCH);
});

test("low-value raw email events are not stored by default", () => {
  assert.equal(shouldStoreRawEmailEventForTest("open"), false);
  assert.equal(shouldStoreRawEmailEventForTest("click"), false);
  assert.equal(shouldStoreRawEmailEventForTest("sent"), false);
  assert.equal(shouldStoreRawEmailEventForTest("reply"), true);
  assert.equal(shouldStoreRawEmailEventForTest("bounce"), false);
  assert.equal(shouldStoreRawEmailEventForTest("bounced"), true);
  assert.equal(shouldStoreRawEmailEventForTest("sent", { storeSent: true }), true);
});

test("permanent lead delete defaults to Drive PDF trash cleanup, not archive cleanup", () => {
  assert.deepEqual(isDriveCleanupRequiredForPermanentDelete({}), { enabled: true, mode: "trash" });
  assert.deepEqual(isDriveCleanupRequiredForPermanentDelete({ DRIVE_PDF_DELETE_MODE: "delete" }), { enabled: true, mode: "delete" });
  assert.deepEqual(isDriveCleanupRequiredForPermanentDelete({ DELETE_DRIVE_PDF_ON_LEAD_DELETE: "false" }), { enabled: false, mode: "trash" });
});

// ---------------------------------------------
// Project guardrail tests: run in Next.js root
// ---------------------------------------------

test("email automation project files exist in the current project root", (t) => {
  if (skipProjectFileChecks()) return t.skip("TRACKFLOW_SKIP_PROJECT_FILE_CHECKS=true");
  const missing = Object.entries(PROJECT_FILES).filter(([, file]) => !fs.existsSync(file));
  assert.deepEqual(
    missing.map(([name]) => name),
    [],
    `Run this test from the EMAIL AUTOMATION project root, not the Python project. Missing: ${missing.map(([name, file]) => `${name} (${file})`).join(", ")}`,
  );
});

test("trackflow route keeps dashboard follow-up config as source of truth", (t) => {
  if (skipProjectFileChecks()) return t.skip("TRACKFLOW_SKIP_PROJECT_FILE_CHECKS=true");
  const src = readProjectFile(PROJECT_FILES.trackflowRoute);
  assert.match(src, /automation_settings/);
  assert.match(src, /followup_config/);
  assert.match(src, /daily_followup_limit/);
  assert.match(src, /followup_batch_per_run/);
  assert.match(src, /FOLLOWUPS_ENABLED/);
  assert.doesNotMatch(src, /process\.env\.FOLLOWUP_BATCH_PER_RUN\s*\|\|\s*[^;]*followup_batch_per_run/, "ENV must not override dashboard follow-up batch config");
});

test("trackflow route contains automation safety switches and sheet readiness guards", (t) => {
  if (skipProjectFileChecks()) return t.skip("TRACKFLOW_SKIP_PROJECT_FILE_CHECKS=true");
  const src = readProjectFile(PROJECT_FILES.trackflowRoute);
  for (const marker of [
    "AUTOMATION_PAUSED",
    "SHEET_QUEUE_SEND_ENABLED",
    "FOLLOWUPS_ENABLED",
    "Sheet queue send blocked",
    "reportToken",
    "pdfFileId",
    "pdfViewUrl",
    "pdfDownloadUrl",
  ]) {
    assert.match(src, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Missing guardrail marker: ${marker}`);
  }
});

test("trackflow route contains Drive PDF cleanup for permanent delete", (t) => {
  if (skipProjectFileChecks()) return t.skip("TRACKFLOW_SKIP_PROJECT_FILE_CHECKS=true");
  const src = readProjectFile(PROJECT_FILES.trackflowRoute);
  for (const marker of [
    "DELETE_DRIVE_PDF_ON_LEAD_DELETE",
    "DRIVE_PDF_DELETE_MODE",
    "REQUIRE_DRIVE_PDF_CLEANUP_ON_LEAD_DELETE",
    "audit_reports",
    "pdfFileId",
  ]) {
    assert.match(src, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Missing Drive cleanup marker: ${marker}`);
  }
});

test("trackflow route reduces raw event writes by default", (t) => {
  if (skipProjectFileChecks()) return t.skip("TRACKFLOW_SKIP_PROJECT_FILE_CHECKS=true");
  const src = readProjectFile(PROJECT_FILES.trackflowRoute);
  assert.match(src, /STORE_LOW_VALUE_EMAIL_EVENTS/);
  assert.match(src, /STORE_LOW_VALUE_TRACKING_HISTORY/);
  assert.match(src, /shouldStoreRawEmailEvent/);
});

test("public report page stays private, expires old reports, and hides inactive reports", (t) => {
  if (skipProjectFileChecks()) return t.skip("TRACKFLOW_SKIP_PROJECT_FILE_CHECKS=true");
  const src = readProjectFile(PROJECT_FILES.reportPage);
  for (const marker of ["index: false", "follow: false", "audit_reports", "active === false", "pdfExpiresAt", "notFound", "ReportViewBeacon"] ) {
    assert.match(src, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Missing report page marker: ${marker}`);
  }
});

test("sender config remains code-based and active senders have safe fields", (t) => {
  if (skipProjectFileChecks()) return t.skip("TRACKFLOW_SKIP_PROJECT_FILE_CHECKS=true");
  const src = readProjectFile(PROJECT_FILES.senders);
  assert.match(src, /export const SENDERS/);
  assert.match(src, /ACTIVE_SENDERS/);
  // Comments may mention "Firestore/Firebase" to explain why senders stay code-based.
  // So this guard only blocks real imports or API calls, not harmless comments.
  assert.doesNotMatch(
    src,
    /from\s+["'][^"']*(firebase|firestore)[^"']*["']|require\(["'][^"']*(firebase|firestore)[^"']*["']\)/i,
    "senders.ts should not import Firebase/Firestore"
  );
  assert.doesNotMatch(
    src,
    /\b(collection|getDoc|getDocs|query|where|onSnapshot)\s*\(/,
    "senders.ts should not call Firebase/Firestore read APIs"
  );

  const emailMatches = [...src.matchAll(/email:\s*["']([^"']+@[^"]+)["']/g)].map((m) => m[1].toLowerCase());
  const unique = new Set(emailMatches);
  assert.equal(emailMatches.length, unique.size, "Duplicate sender emails found in senders.ts");
});

test("lead store caches list reads and supports reportReadyOnly param", (t) => {
  if (skipProjectFileChecks()) return t.skip("TRACKFLOW_SKIP_PROJECT_FILE_CHECKS=true");
  const src = readProjectFile(PROJECT_FILES.leadStore);
  assert.match(src, /hasLoadedOnce/);
  assert.match(src, /inFlightFetchKey/);
  assert.match(src, /reportReadyOnly/);
  assert.match(src, /lastFetchedAt/);
});

test("dashboard store has system health state for readiness checks", (t) => {
  if (skipProjectFileChecks()) return t.skip("TRACKFLOW_SKIP_PROJECT_FILE_CHECKS=true");
  const src = readProjectFile(PROJECT_FILES.dashboardStore);
  assert.match(src, /systemHealth/);
  assert.match(src, /setSystemHealth/);
});

// -----------------------------------------------------
// Environment tests: strict only for deploy/integration
// -----------------------------------------------------

test("production email automation env is complete", (t) => {
  const strict = envFlag("RUN_ENV_SMOKE", false) || envValue("NODE_ENV") === "production" || envValue("VERCEL_ENV") === "production";
  if (!strict) return t.skip("Set RUN_ENV_SMOKE=true or run in production env to enforce env completeness");

  const required = [
    "NEXT_PUBLIC_APP_URL",
    "ALLOWED_ADMIN_EMAILS",
    "BREVO_API_KEY",
    "CRON_SECRET",
    "BREVO_WEBHOOK_SECRET",
    "REPLY_WEBHOOK_SECRET",
    "UNSUBSCRIBE_SECRET",
  ];

  const missing = missingEnv(required);
  assert.deepEqual(missing, [], `Missing required email automation ENV: ${missing.join(", ")}`);

  const appUrl = envValue("NEXT_PUBLIC_APP_URL");
  assert.ok(/^https:\/\//i.test(appUrl), "NEXT_PUBLIC_APP_URL must be https in production");
  assert.equal(/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(appUrl), false, "NEXT_PUBLIC_APP_URL cannot be localhost in production");
});

test("Firebase Admin env is present for the email automation project", (t) => {
  const strict = envFlag("RUN_ENV_SMOKE", false) || envValue("NODE_ENV") === "production" || envValue("VERCEL_ENV") === "production";
  if (!strict) return t.skip("Set RUN_ENV_SMOKE=true or run in production env to enforce Firebase Admin env");

  const hasServiceAccountJson = hasAnyEnv(["FIREBASE_SERVICE_ACCOUNT_KEY", "FIREBASE_ADMIN_SERVICE_ACCOUNT", "GOOGLE_APPLICATION_CREDENTIALS"]);
  const hasSplitFirebaseAdmin = hasAnyEnv(["FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"]) &&
    hasAnyEnv(["FIREBASE_CLIENT_EMAIL", "GOOGLE_CLIENT_EMAIL"]) &&
    hasAnyEnv(["FIREBASE_PRIVATE_KEY", "GOOGLE_PRIVATE_KEY"]);

  assert.equal(hasServiceAccountJson || hasSplitFirebaseAdmin, true, "Missing Firebase Admin credentials. Provide service account JSON or split project/client/private key envs.");
});

test("Sheet queue env is present when Sheet queue sending is enabled", (t) => {
  const strict = envFlag("RUN_ENV_SMOKE", false) || envValue("NODE_ENV") === "production" || envValue("VERCEL_ENV") === "production";
  if (!strict) return t.skip("Set RUN_ENV_SMOKE=true or run in production env to enforce Sheet env");

  const switches = automationSwitchState(process.env);
  if (!switches.sheetQueueEnabled) return t.skip("Sheet queue sending disabled");

  const required = ["SHEET_API_SECRET", "GOOGLE_SHEET_ID", "GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY"];
  const missing = missingEnv(required);
  assert.deepEqual(missing, [], `Missing Sheet queue ENV: ${missing.join(", ")}`);
});

test("Drive cleanup env is present when permanent delete Drive cleanup is required", (t) => {
  const strict = envFlag("RUN_ENV_SMOKE", false) || envValue("NODE_ENV") === "production" || envValue("VERCEL_ENV") === "production";
  if (!strict) return t.skip("Set RUN_ENV_SMOKE=true or run in production env to enforce Drive env");

  const cleanup = isDriveCleanupRequiredForPermanentDelete(process.env);
  const requireCleanup = envFlag("REQUIRE_DRIVE_PDF_CLEANUP_ON_LEAD_DELETE", false);
  if (!cleanup.enabled && !requireCleanup) return t.skip("Drive PDF cleanup disabled and not required");

  const required = ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"];
  const missing = missingEnv(required);
  assert.deepEqual(missing, [], `Missing Google Drive OAuth ENV for PDF cleanup: ${missing.join(", ")}`);
});

// ---------------------------------------
// Optional real external integration tests
// ---------------------------------------

test("live TrackFlow health endpoint responds", async (t) => {
  if (!envFlag("RUN_INTEGRATION_SMOKE", false)) return t.skip("Set RUN_INTEGRATION_SMOKE=true to call live endpoints");
  const base = envValue("SMOKE_BASE_URL") || envValue("NEXT_PUBLIC_APP_URL");
  assert.ok(base, "SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL is required");

  const response = await fetch(`${base.replace(/\/+$/, "")}/api/trackflow/health?deep=true`, { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  assert.ok(response.ok, `Health endpoint failed: ${response.status} ${JSON.stringify(data)}`);
  assert.equal(data.success !== false, true, `Health endpoint returned failure: ${JSON.stringify(data)}`);
});

test("local/separate Python audit server health responds when enabled", async (t) => {
  if (!envFlag("RUN_PYTHON_HEALTH_SMOKE", false)) return t.skip("Set RUN_PYTHON_HEALTH_SMOKE=true to call Python audit server");
  const base = envValue("PYTHON_AUDIT_BASE_URL") || envValue("NEXT_PUBLIC_AUDIT_API_URL");
  assert.ok(base, "PYTHON_AUDIT_BASE_URL or NEXT_PUBLIC_AUDIT_API_URL is required");

  const candidates = ["/health", "/docs"];
  let lastError = "";
  for (const suffix of candidates) {
    try {
      const response = await fetch(`${base.replace(/\/+$/, "")}${suffix}`, { cache: "no-store" });
      if (response.ok) return;
      lastError = `${suffix}: ${response.status}`;
    } catch (error) {
      lastError = `${suffix}: ${error.message}`;
    }
  }
  assert.fail(`Python audit server did not respond. Last error: ${lastError}`);
});

test("Google Drive OAuth can access Drive when enabled", async (t) => {
  if (!envFlag("RUN_GOOGLE_DRIVE_SMOKE", false)) return t.skip("Set RUN_GOOGLE_DRIVE_SMOKE=true to call Google Drive API");
  const missing = missingEnv(["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"]);
  assert.deepEqual(missing, [], `Missing Google OAuth env: ${missing.join(", ")}`);

  let google;
  try {
    google = require("googleapis").google;
  } catch (error) {
    assert.fail("googleapis package is required for RUN_GOOGLE_DRIVE_SMOKE=true");
  }

  const oauth2Client = new google.auth.OAuth2(envValue("GOOGLE_OAUTH_CLIENT_ID"), envValue("GOOGLE_OAUTH_CLIENT_SECRET"));
  oauth2Client.setCredentials({ refresh_token: envValue("GOOGLE_OAUTH_REFRESH_TOKEN") });
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const folderId = envValue("GOOGLE_DRIVE_REPORT_FOLDER_ID") || envValue("GOOGLE_DRIVE_FOLDER_ID");
  if (folderId) {
    const response = await drive.files.get({ fileId: folderId, fields: "id,name,mimeType", supportsAllDrives: true });
    assert.ok(response.data?.id, "Drive folder/file lookup did not return id");
  } else {
    const response = await drive.files.list({ pageSize: 1, fields: "files(id,name)", supportsAllDrives: true, includeItemsFromAllDrives: true });
    assert.ok(Array.isArray(response.data.files), "Drive files.list did not return files array");
  }
});
