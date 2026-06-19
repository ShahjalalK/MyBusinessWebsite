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
  reportMode?: string;
  isSetupFirst?: boolean;
  whatChecked?: string[];
  proofPoints?: string[];
  recommendations?: string[];
  auditSnapshotQuestions?: string[];
  manualAdsSummary?: string;
  manualActionLabel?: string;
  manualExpectedEvent?: string;
  manualObservedEvent?: string;
  manualTool?: string;
  manualGa4Status?: string;
  manualGoogleAdsStatus?: string;
  manualGtmStatus?: string;
  manualVerificationMessage?: string;
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
  "Is it risky to give account access?",
  "Can we start with read-only access?",
  "Can you also manage Google Ads campaigns?",
  "Should tracking be fixed before campaign changes?",
  "Can we book a verification call?",
  "How can we contact TrackFlow Pro?",
  "Do you work through Upwork or Fiverr?",
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
    context.reportMode,
    context.isSetupFirst ? 'setup-first' : '',
    context.manualAdsSummary,
    context.manualActionLabel,
    context.manualExpectedEvent,
    context.manualObservedEvent,
    context.manualTool,
    context.manualGa4Status,
    context.manualGoogleAdsStatus,
    context.manualGtmStatus,
    context.manualVerificationMessage,
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

function isSafeReportQuestion(value: string): boolean {
  const text = cleanText(value);
  if (!text || text.length < 18 || text.length > 150) return false;
  if (!/[?]$/.test(text)) return false;
  if (/https?:\/\//i.test(text)) return false;
  if (/\b(token|api key|secret|password|unsubscribe|raw link|private url)\b/i.test(text)) return false;
  return true;
}


function isSetupFirstContext(context?: ReportChatQuestionContext): boolean {
  const mode = cleanText(context?.reportMode || "").toLowerCase();
  if (context?.isSetupFirst) return true;
  if (mode === "tracking_foundation_setup" || mode === "ga4_setup_needed") return true;
  const text = contextToSearchText(context);
  return /tracking foundation|setup readiness|ga4\/gtm tracking foundation|analytics foundation/.test(text);
}

function getSetupFirstQuestionRules(context?: ReportChatQuestionContext): QuestionRule[] {
  if (!isSetupFirstContext(context)) return [];
  const action = cleanText(context?.manualActionLabel || context?.primaryConversionFocus || "");
  const rules: QuestionRule[] = [
    { question: "What needs to be installed before event testing?", priority: 205 },
    { question: "Why should setup come before conversion testing?", priority: 202 },
    { question: action ? `How should ${action} be configured after setup?` : "Which customer action should be configured after setup?", priority: 199 },
    { question: "Where should final recording be confirmed after setup?", priority: 196 },
    { question: "What is the safest next step for this review?", priority: 190 },
  ];
  return rules.filter((rule) => isSafeReportQuestion(rule.question));
}

function getAuditSnapshotQuestionRules(context?: ReportChatQuestionContext): QuestionRule[] {
  const questions = uniqueQuestions(context?.auditSnapshotQuestions || []).filter(isSafeReportQuestion).slice(0, 4);

  return questions.map((question, index) => ({
    question,
    priority: 190 - index,
  }));
}

function getManualEvidenceQuestionRules(context?: ReportChatQuestionContext): QuestionRule[] {
  if (isSetupFirstContext(context)) return [];
  const action = cleanText(context?.manualActionLabel || context?.primaryConversionFocus || "the selected action");
  const expected = cleanText(context?.manualExpectedEvent || "");
  const observed = cleanText(context?.manualObservedEvent || "");
  const rules: QuestionRule[] = [];

  pushQuestion(
    rules,
    Boolean(action && expected),
    `Was ${expected} observed after the ${action} review?`,
    188,
  );

  pushQuestion(
    rules,
    Boolean(observed),
    `Why does the observed result (${observed}) matter for Google Ads reporting?`,
    187,
  );

  pushQuestion(
    rules,
    Boolean(action),
    `What should be checked inside GA4, GTM, and Google Ads for this ${action}?`,
    186,
  );

  pushQuestion(
    rules,
    Boolean(context?.manualGoogleAdsStatus || context?.businessImpact),
    "Could this affect optimization if ads are active?",
    185,
  );

  return rules.filter((rule) => isSafeReportQuestion(rule.question));
}

function getScoreQuestion(context?: ReportChatQuestionContext): QuestionRule[] {
  const hasScore =
    context?.score !== undefined ||
    Boolean(cleanText(context?.scoreLabel)) ||
    /\b\d{1,3}\s*\/\s*100\b/i.test(cleanText(context?.headline));

  return hasScore ? [{ question: "What does this review score mean?", priority: 96 }] : [];
}

function headlineFindingText(context?: ReportChatQuestionContext): string {
  return [context?.headline, context?.mainFinding]
    .map((item) => cleanText(item))
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getHeadlineFindingQuestionRules(context?: ReportChatQuestionContext): QuestionRule[] {
  const text = headlineFindingText(context);
  const rules: QuestionRule[] = [];

  if (!text) return rules;

  // Highest-priority report-title questions. These make the first suggested
  // question match the visible review headline instead of falling back to a
  // generic “what should we verify first?” card.
  pushQuestion(
    rules,
    hasAny(text, [/\bduplicate\b.*\bconversion\b/, /\bconversion\b.*\bduplicate\b/]),
    "What does duplicate conversion tracking mean?",
    160,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bduplicate\b.*\bconversion\b/, /\bconversion\b.*\bduplicate\b/]),
    "Could duplicate conversions affect Google Ads reporting?",
    157,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bphone\b/, /\bcall\b/, /\bclick[-\s]?to[-\s]?call\b/]),
    "What does the phone call tracking finding mean?",
    158,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bcontact form\b/, /\blead form\b/, /\bform submission\b/, /\bgenerate_lead\b/, /\benquiry\b/, /\binquiry\b/]),
    "How should form lead tracking be verified?",
    156,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bcheckout\b/, /\bpurchase\b/, /\bcart\b/, /\becommerce\b/, /\badd[-_\s]?to[-_\s]?cart\b/]),
    "What should be checked for checkout or purchase tracking?",
    154,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bbooking\b/, /\bappointment\b/, /\bevent form\b/, /\bregistration\b/, /\breservation\b/]),
    "How should booking or event form tracking be verified?",
    152,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bserver[-\s]?side\b/, /\bserver logs?\b/, /\bfirst[-\s]?party\b/]),
    "What does the server-side tracking finding mean?",
    150,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bga4\b/, /\bgoogle analytics\b/, /\bform_submit\b/, /\bpage_view\b/]),
    "What does the GA4 event finding mean?",
    148,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bgoogle ads\b/, /\bads reporting\b/, /\bconversion diagnostics\b/]) && !hasAny(text, [/\bduplicate\b.*\bconversion\b/, /\bconversion\b.*\bduplicate\b/]),
    "How could this affect Google Ads reporting?",
    146,
  );

  return rules.sort((a, b) => b.priority - a.priority);
}


function buildContextQuestionRules(context?: ReportChatQuestionContext): QuestionRule[] {
  const text = contextToSearchText(context);
  const rules: QuestionRule[] = [
    ...getSetupFirstQuestionRules(context),
    ...getAuditSnapshotQuestionRules(context),
    ...getManualEvidenceQuestionRules(context),
    ...getHeadlineFindingQuestionRules(context),
    ...getScoreQuestion(context),
  ];

  pushQuestion(
    rules,
    hasAny(text, [/\bphone\b/, /\bcall\b/, /\bcall-click\b/, /\bclick[-\s]?to[-\s]?call\b/, /\bcall tracking\b/]),
    "What does the phone call tracking finding mean?",
    98,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\blead form\b/, /\bform submission\b/, /\bcontact form\b/, /\benquiry\b/, /\binquiry\b/, /\bgenerate_lead\b/]),
    "How should form lead tracking be verified?",
    96,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bbooking\b/, /\bappointment\b/, /\breservation\b/, /\bschedule\b/]),
    "How should booking or appointment tracking be verified?",
    94,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bpurchase\b/, /\bcheckout\b/, /\bcart\b/, /\becommerce\b/, /\badd_to_cart\b/]),
    "What should be checked for checkout or purchase tracking?",
    94,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bdemo\b/, /\bsignup\b/, /\bsign-up\b/, /\btrial\b/, /\bapplication\b/]),
    "How should demo or signup tracking be verified?",
    91,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bno clear\b.*\bconversion\b/, /\bno clear\b.*\bevent\b/, /\bnot clearly observed\b/, /\bno lead-related\b/]),
    "What does not clearly confirmed mean here?",
    93,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bpage_view\b/, /\bpage view\b/]),
    "What does page_view observed mean for this review?",
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
    "What should be verified in GTM Preview?",
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
    hasAny(text, [/\bgoogle ads\b/, /\bads\b/, /\bcampaigns?\b/, /\bppc\b/, /\bad performance\b/]),
    "Should tracking be fixed before campaign changes?",
    89,
  );

  pushQuestion(
    rules,
    hasAny(text, [/\bgoogle ads\b/, /\bcampaigns?\b/, /\bppc\b/, /\bad performance\b/]),
    "Can you also manage Google Ads campaigns?",
    71,
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
    hasAny(text, [/\baccount access\b/, /\bpermissions?\b/, /\bread[-\s]?only\b/, /\bsecurity\b/, /\brisk\b/]),
    "Is it risky to give account access?",
    83,
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
    { question: "Can we book a verification call?", priority: 73 },
    { question: "Can TrackFlow Pro verify this for us?", priority: 70 },
    { question: "How can we contact TrackFlow Pro?", priority: 62 },
  );

  return rules.sort((a, b) => b.priority - a.priority);
}

function looksLikeAccessSecurityAnswer(text: string): boolean {
  return hasAny(text, [
    /\bread[-\s]?only\b/,
    /\bviewer\b/,
    /\bpermission\b/,
    /\bseparate user\b/,
    /\bshare passwords?\b/,
    /\bowner access\b/,
    /\badmin access\b/,
    /\bbilling\b/,
    /\bpayment\b/,
    /\b2fa\b/,
    /\bgtm publish access\b/,
    /\baccess can be removed\b/,
  ]);
}

function buildAccessSecurityFollowUpRules(text: string): QuestionRule[] {
  const rules: QuestionRule[] = [];

  pushQuestion(
    rules,
    !hasAny(text, [/\bread[-\s]?only\b/]),
    "Can we start with read-only access?",
    100,
  );

  pushQuestion(
    rules,
    !hasAny(text, [/\bpassword\b/, /\bsharing passwords?\b/]),
    "Should we share passwords?",
    98,
  );

  pushQuestion(
    rules,
    !hasAny(text, [/\bbilling\b/, /\bpayment\b/]),
    "Do you need billing access?",
    96,
  );

  rules.push(
    { question: "What access is needed to confirm this?", priority: 94 },
    { question: "Can you also manage Google Ads campaigns?", priority: 90 },
    { question: "What should we verify first?", priority: 88 },
    { question: "Can TrackFlow Pro verify this for us?", priority: 82 },
  );

  return rules.sort((a, b) => b.priority - a.priority);
}

function looksLikeGoogleAdsServiceAnswer(text: string): boolean {
  return hasAny(text, [
    /\bgoogle ads campaign\b/,
    /\bgoogle ads campaigns\b/,
    /\bgoogle ads setup\b/,
    /\bgoogle ads management\b/,
    /\bcampaign setup\b/,
    /\bcampaign management\b/,
    /\bongoing management\b/,
    /\bperformance management\b/,
    /\bkeyword\b/,
    /\bad group\b/,
    /\bnegative keyword\b/,
    /\bad copy\b/,
    /\bbudget\b/,
    /\bbid\b/,
    /\bads management\b/,
    /\bconversion tracking before\b/,
    /\btracking should be verified\b/,
    /\bcampaign decisions are based on reliable\b/,
    /\bno agency should guarantee\b/,
  ]);
}

function buildGoogleAdsServiceFollowUpRules(_text: string): QuestionRule[] {
  // Keep these suggestions tied to the Google Ads service conversation.
  // Do not hide them just because the answer mentioned tracking, access, or read-only review.
  // getUnaskedQuestions() will remove only questions the visitor already asked/clicked.
  return [
    { question: "Should tracking be fixed before campaign changes?", priority: 100 },
    { question: "Can you review campaigns without changing anything?", priority: 98 },
    { question: "What Google Ads access is needed for management?", priority: 96 },
    { question: "What should we check in Google Ads?", priority: 92 },
    { question: "Can TrackFlow Pro verify this for us?", priority: 84 },
    { question: "What is the safest next step?", priority: 80 },
  ];
}

function looksLikeContactBookingAnswer(text: string): boolean {
  return hasAny(text, [
    /\bcalendly\.com\b/,
    /\bfree consultation\b/,
    /\bbook a short\b/,
    /\bbook a call\b/,
    /\bverification call\b/,
    /\bcontact trackflow pro\b/,
    /\bshahjalal@trackflowpro\.com\b/,
    /\bmarketplace-based hiring\b/,
    /\bupwork\b/,
    /\bfiverr\b/,
  ]);
}

function buildContactBookingFollowUpRules(text: string): QuestionRule[] {
  const rules: QuestionRule[] = [];

  pushQuestion(
    rules,
    !hasAny(text, [/\baccess checklist\b/, /\bminimum required permission\b/, /\bminimum access\b/]),
    "What access is needed before the call?",
    100,
  );

  pushQuestion(
    rules,
    !hasAny(text, [/\bgoogle ads\b/, /\bcampaign\b/]),
    "Can you also manage Google Ads campaigns?",
    96,
  );

  pushQuestion(
    rules,
    !hasAny(text, [/\btracking should be verified\b/, /\btracking first\b/]),
    "Should tracking be fixed before campaign changes?",
    94,
  );

  rules.push(
    { question: "Can TrackFlow Pro verify this for us?", priority: 92 },
    { question: "What is the safest next step?", priority: 88 },
    { question: "Do you work through Upwork or Fiverr?", priority: 76 },
  );

  return rules.sort((a, b) => b.priority - a.priority);
}

function looksLikeSafestNextStepAnswer(text: string): boolean {
  return hasAny(text, [
    /\bsafest next step\b/,
    /\bhigh-priority conversion path\b/,
    /\bone controlled test\b/,
    /\bgtm preview\b/,
    /\bga4 debugview\b/,
    /\bconversion path is confirmed\b/,
    /\bapproved account-level access\b/,
    /\bverify one high-priority conversion path\b/,
    /\bmaking final tracking or campaign decisions\b/,
    /\bavoid campaign optimization or budget decisions\b/,
  ]);
}

function buildSafestNextStepFollowUpRules(_text: string): QuestionRule[] {
  return [
    { question: "What access is needed to confirm this?", priority: 100 },
    { question: "What should we check inside GA4?", priority: 96 },
    { question: "What should we check in GTM Preview?", priority: 94 },
    { question: "What should we check in Google Ads?", priority: 92 },
    { question: "What should we test on the lead path?", priority: 90 },
    { question: "Can we book a verification call?", priority: 86 },
  ];
}

function buildFollowUpRules(latestAssistantContent: string, context?: ReportChatQuestionContext): QuestionRule[] {
  const latestText = cleanText(latestAssistantContent).toLowerCase();
  const text = `${latestText} ${contextToSearchText(context)}`.toLowerCase();

  if (looksLikeContactBookingAnswer(latestText)) {
    return buildContactBookingFollowUpRules(latestText);
  }

  if (looksLikeSafestNextStepAnswer(latestText)) {
    return buildSafestNextStepFollowUpRules(latestText);
  }

  if (looksLikeGoogleAdsServiceAnswer(latestText)) {
    return buildGoogleAdsServiceFollowUpRules(latestText);
  }

  if (looksLikeAccessSecurityAnswer(latestText)) {
    return buildAccessSecurityFollowUpRules(latestText);
  }

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
    { question: "Should tracking be fixed before campaign changes?", priority: 78 },
    { question: "Can we book a verification call?", priority: 76 },
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

  const setupFirstQuestions = getSetupFirstQuestionRules(context).map((rule) => rule.question);
  const snapshotQuestions = getAuditSnapshotQuestionRules(context).map((rule) => rule.question);
  const manualEvidenceQuestions = getManualEvidenceQuestionRules(context).map((rule) => rule.question);
  const contextQuestions = buildContextQuestionRules(context).map((rule) => rule.question);
  const followUpQuestions = buildFollowUpRules(latestAssistantContent, context).map((rule) => rule.question);
  const reportSpecificQuestions = [...setupFirstQuestions, ...snapshotQuestions, ...manualEvidenceQuestions];

  return {
    closedQuestions: getUnaskedQuestions({
      candidates: [...reportSpecificQuestions, ...contextQuestions, ...DEFAULT_CLOSED_QUESTIONS, ...BROAD_FALLBACK_POOL],
      askedKeys,
      limit: closedLimit,
    }),
    starterQuestions: getUnaskedQuestions({
      candidates: [...reportSpecificQuestions, ...contextQuestions, ...DEFAULT_STARTER_QUESTIONS, ...BROAD_FALLBACK_POOL],
      askedKeys,
      limit: starterLimit,
    }),
    followUpQuestions: getUnaskedQuestions({
      candidates: [...followUpQuestions, ...reportSpecificQuestions, ...contextQuestions, ...DEFAULT_FOLLOW_UP_QUESTIONS, ...BROAD_FALLBACK_POOL],
      askedKeys,
      limit: followUpLimit,
    }),
  };
}
