const test = require("node:test");
const assert = require("node:assert/strict");

const FOLLOWUP_SEND_BEFORE_ENGAGEMENT_MINUTES = 60;

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


function cleanupDecisionForTest({ status = "sent", sentAt, openCount = 0, clickCount = 0, locked = false }, nowMs) {
  if (locked || status === "processing_initial" || status === "processing_followup") return { eligible: false, outcome: "blocked" };
  const daysOld = Math.floor((nowMs - sentAt) / 86_400_000);
  if (["unsubscribed", "spam", "bounced", "not_interested"].includes(status)) return { eligible: true, outcome: "suppression_required" };
  if (status === "replied" || status === "interested") return { eligible: daysOld >= 365, outcome: daysOld >= 365 ? "replied_review" : "not_due" };
  const hasEngagement = openCount > 0 || clickCount > 0;
  if (hasEngagement) return { eligible: daysOld >= 90, outcome: daysOld >= 90 ? "warm_no_reply" : "not_due" };
  return { eligible: daysOld >= 45, outcome: daysOld >= 45 ? "cold_no_reply" : "not_due" };
}

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

function isContactMemoryCooldownActive(memory, nowMs) {
  const cooldownMs = Date.parse(String(memory.cooldownUntil || ""));
  const expiresMs = Date.parse(String(memory.memoryExpiresAt || ""));
  if (!Number.isFinite(cooldownMs) || cooldownMs <= nowMs) return false;
  if (Number.isFinite(expiresMs) && expiresMs <= nowMs) return false;
  return true;
}

test("active contact memory blocks first send attempt with warning", () => {
  const now = Date.parse("2026-05-15T10:30:00.000Z");
  const memory = {
    cooldownUntil: "2026-08-15T10:30:00.000Z",
    memoryExpiresAt: "2026-08-15T10:30:00.000Z",
  };
  assert.equal(isContactMemoryCooldownActive(memory, now), true);
});

test("expired contact memory does not block send", () => {
  const now = Date.parse("2026-05-15T10:30:00.000Z");
  const memory = {
    cooldownUntil: "2026-04-15T10:30:00.000Z",
    memoryExpiresAt: "2026-08-15T10:30:00.000Z",
  };
  assert.equal(isContactMemoryCooldownActive(memory, now), false);
});
