"use client";

// ============================================================
// FILE: app/components/trackflow/reportChatQuestions.ts
// Purpose: Report-aware smart question suggestions for the secure report chatbot.
// ============================================================

export type ReportChatQuestionContext = {
  companyName?: string;
  domain?: string;
  headline?: string;
  score?: number | string;
  scoreLabel?: string;
  mainFinding?: string;
  businessImpact?: string;
  primaryConversionFocus?: string;
  businessType?: string;
  whatChecked?: string[];
  proofPoints?: string[];
  recommendations?: string[];
  auditSnapshotQuestions?: string[];
  manualAdsSummary?: string;
};

export type ReportChatQuestionSuggestionSet = {
  closedQuestions: string[];
  starterQuestions: string[];
  followUpQuestions: string[];
};

type QuestionRule = {
  question: string;
  priority: number;
};

type BuildQuestionInput = {
  context?: ReportChatQuestionContext;
  askedKeys?: Set<string>;
  latestAssistantContent?: string;
  limits?: {
    closed?: number;
    starter?: number;
    followUp?: number;
  };
};

const DEFAULT_CLOSED_QUESTIONS = [
  "What should we verify first?",
  "Can this affect lead reporting?",
];

const DEFAULT_STARTER_QUESTIONS = [
  "What should we verify first?",
  "Can you explain the main finding?",
  "What evidence was visible in the review?",
  "What needs account access to confirm?",
];

const DEFAULT_FOLLOW_UP_QUESTIONS = [
  "What is the safest next step?",
  "What access is needed to confirm this?",
  "Can TrackFlow Pro verify this for us?",
];

const BROAD_FALLBACK_POOL = [
  "What evidence was visible in the review?",
  "Why does this need account access?",
  "What should we check inside GA4?",
  "What should we check in GTM Preview?",
  "What should we check in Google Ads?",
  "What should we test on the lead path?",
  "Can this affect lead reporting?",
  "What is the safest next step?",
  "Can TrackFlow Pro verify this for us?",
  "Who prepared this review?",
];

function cleanText(value: unknown): string {
  return String(value || "")
    .replace(/\*\*/g, "")
    .replace(/__+/g, "")
    .replace(/`+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeReportChatQuestionKey(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|this|that|a|an|about|please|our|my|we|us)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueQuestions(items: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const clean = cleanText(item);
    const key = normalizeReportChatQuestionKey(clean);
    if (!clean || !key || seen.has(key)) continue;

    seen.add(key);
    output.push(clean);
  }

  return output;
}

function getUnaskedQuestions({
  candidates,
  askedKeys,
  limit,
}: {
  candidates: string[];
  askedKeys: Set<string>;
  limit: number;
}): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const item of uniqueQuestions(candidates)) {
    const key = normalizeReportChatQuestionKey(item);
    if (!key || askedKeys.has(key) || seen.has(key)) continue;

    seen.add(key);
    output.push(item);

    if (output.length >= limit) break;
  }

  return output;
}

function contextToSearchText(context?: ReportChatQuestionContext): string {
  if (!context) return "";

  const parts = [
    context.companyName,
    context.domain,
    context.headline,
    context.score,
    context.scoreLabel,
    context.mainFinding,
    context.businessImpact,
    context.primaryConversionFocus,
    context.businessType,
    context.manualAdsSummary,
    ...(context.whatChecked || []),
    ...(context.proofPoints || []),
    ...(context.recommendations || []),
    ...(context.auditSnapshotQuestions || []),
  ];

  return parts.map((item) => cleanText(item)).filter(Boolean).join(" ").toLowerCase();
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function pushQuestion(rules: QuestionRule[], condition: boolean, question: string, priority: number) {
  if (!condition) return;
  rules.push({ question, priority });
}

function getScoreQuestion(context?: ReportChatQuestionContext): QuestionRule[] {
  const hasScore =
    context?.score !== undefined ||
    Boolean(cleanText(context?.scoreLabel)) ||
    /\b\d{1,3}\s*\/\s*100\b/i.test(cleanText(context?.headline));

  return hasScore ? [{ question: "What does this review score mean?", priority: 96 }] : [];
}

function buildContextQuestionRules(context?: ReportChatQuestionContext): QuestionRule[] {
  const text = contextToSearchText(context);
  const rules: QuestionRule[] = [...getScoreQuestion(context)];

  pushQuestion(
    rules,
    hasAny(text, [/\bphone\b/, /\bcall\b/, /\bcall-click\b/, /\bclick[-\s]?to[-\s]?call\b/, /\bcall tracking\b/]),
    "Are phone calls being tracked properly?",
    98,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\blead form\b/, /\bform submission\b/, /\bcontact form\b/, /\benquiry\b/, /\binquiry\b/, /\bgenerate_lead\b/]),
    "Are form submissions being tracked properly?",
    96,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bbooking\b/, /\bappointment\b/, /\breservation\b/, /\bschedule\b/]),
    "Is booking or appointment tracking recorded clearly?",
    94,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bpurchase\b/, /\bcheckout\b/, /\bcart\b/, /\becommerce\b/, /\badd_to_cart\b/]),
    "Are checkout and purchase events tracked correctly?",
    94,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bdemo\b/, /\bsignup\b/, /\bsign-up\b/, /\btrial\b/, /\bapplication\b/]),
    "Are demo or signup actions tracked properly?",
    91,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bno clear\b.*\bconversion\b/, /\bno clear\b.*\bevent\b/, /\bnot clearly observed\b/, /\bno lead-related\b/]),
    "What does no clear conversion event mean?",
    93,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bpage_view\b/, /\bpage view\b/]),
    "Why was only page_view observed?",
    87,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bga4\b/, /\bgoogle analytics\b/, /\bdebugview\b/]),
    "What should we check inside GA4?",
    86,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bgtm\b/, /\bgoogle tag manager\b/, /\btag manager\b/, /\bpreview\b/]),
    "If GTM is found, why verify again?",
    85,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bgoogle ads\b/, /\bads reporting\b/, /\bconversion diagnostics\b/, /\bad performance\b/]),
    "Can this affect Google Ads reporting?",
    90,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bmeta\b/, /\bpixel\b/, /\bcapi\b/, /\bfacebook\b/]),
    "Does Meta Pixel need verification too?",
    72,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bserver-side\b/, /\bserver side\b/, /\bserver logs\b/, /\bcrm\b/, /\bcall-tracking\b/, /\bcall tracking\b/]),
    "Why does this need account or server access?",
    88,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bspeed\b/, /\bcore web vitals\b/, /\bperformance\b/, /\brequests\b/, /\bthird-party\b/]),
    "Can page speed affect tracking or leads?",
    68,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bads transparency\b/, /\bmanually checked\b/, /\bactive ads\b/]),
    "How does Ads Transparency change this review?",
    76,
  );

  rules.push(
    { question: "What should we verify first?", priority: 100 },
    { question: "Can you explain the main finding?", priority: 92 },
    { question: "What evidence was visible in the review?", priority: 84 },
    { question: "What is the safest next step?", priority: 82 },
    { question: "Can TrackFlow Pro verify this for us?", priority: 70 },
  );

  return rules.sort((a, b) => b.priority - a.priority);
}

function buildFollowUpRules(latestAssistantContent: string, context?: ReportChatQuestionContext): QuestionRule[] {
  const text = `${cleanText(latestAssistantContent)} ${contextToSearchText(context)}`.toLowerCase();
  const rules: QuestionRule[] = [];

  pushQuestion(
    rules,
    hasAny(text, [/\bgoogle ads\b/, /\bads reporting\b/, /\bconversion\b/]),
    "What should we check in Google Ads?",
    96,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bga4\b/, /\bdebugview\b/, /\bpage_view\b/]),
    "What should we check inside GA4?",
    94,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bgtm\b/, /\btag manager\b/, /\bpreview\b/]),
    "What should we check in GTM Preview?",
    92,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bphone\b/, /\bcall\b/]),
    "How should phone call tracking be tested?",
    91,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bform\b/, /\blead\b/, /\benquiry\b/, /\binquiry\b/, /\bbooking\b/]),
    "What should we test on the lead path?",
    90,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\baccount access\b/, /\bserver access\b/, /\bcrm\b/, /\bserver logs\b/]),
    "What access is needed to confirm this?",
    88,
  );

  rules.push(
    { question: "What is the safest next step?", priority: 84 },
    { question: "Why does this need account access?", priority: 82 },
    { question: "Can TrackFlow Pro verify this for us?", priority: 74 },
  );

  return rules.sort((a, b) => b.priority - a.priority);
}

export function buildReportChatQuestionSuggestions({
  context,
  askedKeys = new Set<string>(),
  latestAssistantContent = "",
  limits,
}: BuildQuestionInput): ReportChatQuestionSuggestionSet {
  const closedLimit = Math.max(1, Math.min(2, limits?.closed || 2));
  const starterLimit = Math.max(1, Math.min(5, limits?.starter || 4));
  const followUpLimit = Math.max(1, Math.min(4, limits?.followUp || 3));

  const contextQuestions = buildContextQuestionRules(context).map((rule) => rule.question);
  const followUpQuestions = buildFollowUpRules(latestAssistantContent, context).map((rule) => rule.question);

  return {
    closedQuestions: getUnaskedQuestions({
      candidates: [...contextQuestions, ...DEFAULT_CLOSED_QUESTIONS, ...BROAD_FALLBACK_POOL],
      askedKeys,
      limit: closedLimit,
    }),
    starterQuestions: getUnaskedQuestions({
      candidates: [...contextQuestions, ...DEFAULT_STARTER_QUESTIONS, ...BROAD_FALLBACK_POOL],
      askedKeys,
      limit: starterLimit,
    }),
    followUpQuestions: getUnaskedQuestions({
      candidates: [...followUpQuestions, ...contextQuestions, ...DEFAULT_FOLLOW_UP_QUESTIONS, ...BROAD_FALLBACK_POOL],
      askedKeys,
      limit: followUpLimit,
    }),
  };
}
