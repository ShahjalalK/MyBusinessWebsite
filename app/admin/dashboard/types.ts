export type MainTab = "overview" | "sheet" | "outreach" | "scheduled" | "leads" | "cleanup" | "automation" | "analytics" | "chat-insights";
export type LeadSourceFilter = "all" | "manual" | "manual_report_linked" | "sheet" | "sheet_primary" | "sheet_additional" | "test";
export type TriggerMode = "no_reply_after_delay" | "open_required";

export type ServiceId = "Email Signature" | "Google Ads" | "Server Side Tracking";
export type StepId = "step1" | "step2" | "step3" | "step4" | "step5";

export type Variant = {
  id: string;
  content: string;
};

export type StepConfig = {
  variants: Variant[];
  delay: number;
};

export type FollowupConfig = Record<ServiceId, Record<StepId, StepConfig>>;

export type TrackingHistory = {
  event: string;
  time: any;
  link?: string;
  step?: number;
  step_tag?: string;
};

export type EvidenceVideoInfo = {
  enabled?: boolean;
  status?: string;
  provider?: "youtube" | string;
  title?: string;
  description?: string;
  videoId?: string;
  video_id?: string;
  videoUrl?: string;
  video_url?: string;
  youtubeUrl?: string;
  youtube_url?: string;
  embedUrl?: string;
  embed_url?: string;
  optional?: boolean;
  addedAt?: any;
  updatedAt?: any;
  [key: string]: any;
};

export type SentMessage = {
  step: number;
  subject: string;
  message?: string;
  sentAt: any;
  trackingTag?: string;
  kind?: "initial" | "followup" | string;
  followupNumber?: number;
  configStepKey?: string;
  variantId?: string;
  messageId?: string;
  brevoMessageId?: string;
  customMessageId?: string;
  inReplyTo?: string;
  references?: string;
  threadRootMessageId?: string;
  eligibilityReasons?: string[];
};

export type Lead = {
  id: string;
  name?: string;
  company_name?: string;
  website?: string;
  email: string;
  emailLower?: string;
  subject: string;
  message?: string;
  open_count?: number;
  click_count?: number;
  status?: string;
  createdAt?: any;
  firstOpenedAt?: any;
  lastOpenedAt?: any;
  firstClickedAt?: any;
  lastClickedAt?: any;
  lastClickedUrl?: string;
  lastEngagedAt?: any;
  lastFollowUp?: any;
  nextFollowupAt?: any;
  nextFollowupStep?: number;
  nextFollowupStatus?: string;
  nextFollowupReason?: string;
  retryCount?: number;
  lastFollowupError?: string;
  sentAt?: any;
  scheduledAt?: any;
  scheduledProvider?: string;
  providerScheduleStatus?: string;
  brevoScheduled?: boolean;
  brevoScheduledAt?: any;
  brevoScheduledAtIso?: string;
  scheduledAcceptedAt?: any;
  brevoMessageId?: string;
  tracking_history?: TrackingHistory[];
  follow_up_count?: number;
  sent_messages?: SentMessage[];
  service?: ServiceId | string;
  stopAutomation?: boolean;
  sender_email?: string;
  sender_name?: string;
  source?: string;
  sourceOrigin?: "manual" | "sheet" | "test" | string;
  sourceRole?: "manual" | "manual_report_linked" | "sheet_primary" | "sheet_additional_recipient" | "test" | string;
  keepUnderSheetAudit?: boolean;
  parentSheetEmail?: string;
  parentSheetRowNumber?: number;
  parentSheetWebsiteUrl?: string;
  parentReportToken?: string;
  sheetRowNumber?: number;
  sheetFinalEmail?: string;
  sheetWebsiteUrl?: string;
  archived?: boolean;
  archivedAt?: any;
  deleted?: boolean;
  deletedAt?: any;
  archiveReason?: string;
  deleteReason?: string;
  [key: string]: any;
};

export type SheetLead = {
  rowNumber: number;
  "Export Date"?: string;
  "Business Name"?: string;
  "Website URL"?: string;
  "Final Email"?: string;
  "Email Source"?: string;
  "Social Platform"?: string;
  "Social Link"?: string;
  "WhatsApp"?: string;
  "ChatGPT Prompt"?: string;
  "Lead Status"?: string;
  "Approval Status"?: string;
  "Send Status"?: string;
  "Service Type"?: string;
  "Audit Score"?: string;
  "Lead Label"?: string;
  "Main Issue"?: string;
  "Proof Points"?: string;
  "Report Token"?: string;
  "Report URL"?: string;
  "PDF File ID"?: string;
  "PDF View URL"?: string;
  "PDF Download URL"?: string;
  "PDF Expires At"?: string;
  "Evidence Video URL"?: string;
  "Evidence Video Status"?: string;
  "Report Page Viewed"?: string;
  "PDF Downloaded"?: string;
  "CTA Clicked"?: string;
  "Last Report Viewed At"?: string;
  "Last PDF Downloaded At"?: string;
  "Last CTA Clicked At"?: string;
  "Email Subject"?: string;
  "Email Body"?: string;
  "Decision Maker"?: string;
  "Decision Maker Title"?: string;
  "Contact Quality"?: string;
  "Tracking ID"?: string;
  "Firestore Lead ID"?: string;
  "Open Count"?: string;
  "Click Count"?: string;
  "Reply Status"?: string;
  "Last Synced"?: string;
  "Archive Status"?: string;
  "Notes"?: string;
  "Sender ID"?: string;
  "Attempt Count"?: string;
  "Queue Lock ID"?: string;
  "Queue Locked At"?: string;
  "Queue Attempt ID"?: string;
  "Source Type"?: string;
  "Outreach Channel"?: string;
  "Lead Source"?: string;
  "Audit Source"?: string;
  "Source Context"?: string;
  "Email Outreach Allowed"?: string;
  "LinkedIn Outreach Allowed"?: string;
  [key: string]: any;
};



export type SendEmailDrawerFilter = "all" | "ready" | "needs_review";

export type SendEmailDrawerLead = SheetLead & {
  queueStatus?: "ready" | "needs_review";
  queueNote?: string;
};

export type ScheduledEditState = {
  leadId: string;
  email: string;
  clientName: string;
  companyName: string;
  website: string;
  businessType: string;
  subject: string;
  message: string;
  scheduledTime: string;
  selectedService: ServiceId | "";
  selectedSender: string;
  includeSignature: boolean;
  reportUrl: string;
  reportButtonText: string;
};

export type FollowupSummaryState = {
  loading: boolean;
  error: string;
  loadedAt: number | null;
  sentToday: number;
  dailyLimit: number;
  batchPerRun: number;
  remainingToday: number;
  maxThisRun: number;
  dueNow: number;
  scheduled: number;
  waitingFirstOpen: number;
  waitingNewEngagement: number;
  templateBlocked: number;
  failedRetry: number;
  failedFinal: number;
  blocked: number;
};

export type FirebaseUsageState = {
  loading: boolean;
  error: string;
  loadedAt: number | null;
  usage: {
    estimatedReadsToday: number;
    estimatedWritesToday: number;
    estimatedDeletesToday: number;
    estimatedStorageMb: number;
    readPercent: number;
    writePercent: number;
    deletePercent: number;
    storagePercent: number;
  };
  quota: {
    readsPerDay: number;
    writesPerDay: number;
    deletesPerDay: number;
    storageMb: number;
  };
  counts: {
    leadCount: number;
    activeLeadCount: number;
    archivedLeadCount: number;
    trashedLeadCount: number;
    emailEventCount: number;
    suppressionCount: number;
    initialSentToday: number;
    followupSentToday: number;
    eventsToday: number;
  };
  note: string;
};


export type CleanupBucket = "due" | "cold" | "warm" | "replied" | "protected" | "upcoming";

export type CleanupCandidate = {
  leadId: string;
  email: string;
  name?: string;
  company?: string;
  website?: string;
  service?: string;
  status?: string;
  source?: string;
  sourceKind?: "sheet" | "cold" | "test";
  sheetLinked?: boolean;
  sheetRowNumber?: number | null;
  openCount?: number;
  clickCount?: number;
  followUpCount?: number;
  lastContactedAt?: string;
  dueAt?: string;
  daysOld?: number;
  eligible?: boolean;
  outcome?: string;
  reason?: string;
  protectedLead?: boolean;
  cooldownMonths?: number;
  memoryMonths?: number;
  blockedReasons?: string[];
};

export type CleanupState = {
  loading: boolean;
  actionLoading: boolean;
  error: string;
  status: string;
  loadedAt: number | null;
  bucket: CleanupBucket;
  rows: CleanupCandidate[];
  policy?: any;
};



export type FootprintMemoryFilter = "blocked" | "old" | "suppression" | "allowed" | "all";

export type FootprintMemoryRow = {
  email: string;
  emailLower: string;
  companyName?: string;
  website?: string;
  service?: string;
  reason?: string;
  lastOutcome?: string;
  status?: "blocked" | "requires_permission" | "allowed_again" | "expired";
  statusLabel?: string;
  source?: "contact_memory" | "suppression_list" | "combined" | "outreach_lead";
  protected?: boolean;
  deletable?: boolean;
  leadCount?: number;
  activeLeadCount?: number;
  lastActivityAt?: string;
  lastContactedAt?: string;
  cooldownUntil?: string;
  memoryExpiresAt?: string;
  updatedAt?: string;
  openCount?: number;
  clickCount?: number;
  sourceLeadId?: string;
  suppressionReason?: string;
};

export type FootprintMemoryState = {
  loading: boolean;
  actionLoading: boolean;
  error: string;
  status: string;
  loadedAt: number | null;
  search: string;
  filter: FootprintMemoryFilter;
  olderThanDays: number;
  selectedEmails: string[];
  rows: FootprintMemoryRow[];
};

export type ContactMemoryWarning = {
  emailLower?: string;
  lastOutcome?: string;
  lastContactedAt?: string;
  cooldownUntil?: string;
  memoryExpiresAt?: string;
  companyName?: string;
  website?: string;
  service?: string;
  openCount?: number;
  clickCount?: number;
  sourceLeadId?: string;
};

export type BulkLeadAction = "archive" | "restore" | "trash" | "delete_permanent" | "delete_manual_keep_memory" | "delete_manual_no_footprint";

export type ReportAssetCleanupMode = "soft" | "hard" | "assets_only";
export type ReportAssetCleanupLeadMode = "none" | "archive" | "trash" | "delete" | "delete_no_memory";
export type ReportAssetCleanupSheetMode = "skip" | "mark" | "clear" | "delete";
export type ReportCleanupStepStatus = "planned" | "skipped" | "ok" | "warning" | "error";

export type ReportCleanupStep = {
  service: string;
  action: string;
  status: ReportCleanupStepStatus;
  target?: string;
  message?: string;
  error?: string;
  details?: Record<string, any>;
};

export type DailySendingStatsCleanupSenderRow = {
  senderEmail: string;
  totalDocs: number;
  oldDocs: number;
  todayDocs: number;
  initialSent: number;
  followupSent: number;
  totalSent: number;
  oldestDateKey?: string;
  latestDateKey?: string;
};

export type DailySendingStatsCleanupDocRow = {
  id: string;
  dateKey: string;
  senderEmail: string;
  initialSent: number;
  followupSent: number;
  totalSent: number;
  updatedAt?: string;
};

export type DailySendingStatsCleanupState = {
  loading: boolean;
  actionLoading: boolean;
  error: string;
  status: string;
  loadedAt: number | null;
  keepDateKey: string;
  totalDocs: number;
  todayDocs: number;
  oldDocs: number;
  deletedCount: number;
  remainingOldDocs: number;
  senderCount: number;
  oldestDateKey: string;
  latestDateKey: string;
  senderRows: DailySendingStatsCleanupSenderRow[];
  sampleRows: DailySendingStatsCleanupDocRow[];
};

export type ReportCleanupManifest = {
  reportToken?: string;
  reportFound?: boolean;
  domainSlug?: string;
  normalizedDomain?: string;
  reportUrl?: string;
  leadId?: string;
  leadFound?: boolean;
  emailLower?: string;
  sheetRowNumber?: number | null;
  b2PdfKey?: string;
  blobImageTargets?: string[];
  domainIndexIds?: string[];
  pdfExpiresAt?: string;
  cleanupStatus?: string;
  leadContacted?: boolean;
  leadContactReason?: string;
  [key: string]: any;
};

export type ReportAssetCleanupState = {
  input: string;
  mode: ReportAssetCleanupMode;
  leadMode: ReportAssetCleanupLeadMode;
  sheetMode: ReportAssetCleanupSheetMode;
  loading: boolean;
  error: string;
  status: string;
  dryRun: boolean;
  confirmText: string;
  jobId: string;
  failedCount: number;
  lastPreviewAt: number | null;
  manifest: ReportCleanupManifest | null;
  steps: ReportCleanupStep[];
};

export type BulkSecureReportCleanupRow = {
  token: string;
  dryRun?: boolean;
  success?: boolean;
  failedCount?: number;
  warningCount?: number;
  jobId?: string;
  error?: string;
  manifest?: ReportCleanupManifest;
  steps?: ReportCleanupStep[];
  [key: string]: any;
};

export type SecureReportFilter = "all" | "active" | "expired" | "viewed" | "no_view" | "cleaned" | "test";
export type SecureReportContactStatus =
  | "not_contacted"
  | "email_sent"
  | "email_opened"
  | "email_clicked"
  | "linkedin_sent"
  | "contacted"
  | "replied"
  | "not_interested"
  | "bounced"
  | "unsubscribed"
  | "unknown";

export type SecureReportRow = {
  token: string;
  reportUrl: string;
  domain: string;
  domainSlug: string;
  companyName?: string;
  email?: string;
  source?: string;
  channel?: "email" | "linkedin" | "manual" | "unknown";
  createdAt?: string;
  updatedAt?: string;
  pdfExpiresAt?: string;
  lastActivityAt?: string;
  lastSeenAt?: string;
  reportPageViewed?: boolean;
  viewCount?: number;
  estimatedActiveSeconds?: number;
  lastReportedActiveSeconds?: number;
  visitorCountry?: string;
  lastVisitorCountry?: string;
  pdfOpened?: boolean;
  pdfOpenCount?: number;
  lastPdfOpenedAt?: string;
  pdfDownloaded?: boolean;
  downloadCount?: number;
  lastDownloadedAt?: string;
  lastPdfDownloadedAt?: string;
  videoPlayClicked?: boolean;
  videoPlayClickCount?: number;
  lastVideoPlayClickedAt?: string;
  videoWatched?: boolean;
  videoWatchedThreshold?: number;
  lastVideoWatchedAt?: string;
  chatboxOpened?: boolean;
  chatboxOpenCount?: number;
  lastChatboxOpenedAt?: string;
  chatQuestionAsked?: boolean;
  chatQuestionCount?: number;
  lastChatQuestionAt?: string;
  ctaClicked?: boolean;
  cleanupStatus?: string;
  active?: boolean;
  leadId?: string;
  sheetRowNumber?: number | null;
  viewedCount?: number;
  pdfDownloadCount?: number;
  ctaClickCount?: number;
  lastCtaClickedAt?: string;
  lastCtaType?: "booking" | "whatsapp" | "email" | "linkedin" | "cta" | string;
  bookingClicked?: boolean;
  whatsappClicked?: boolean;
  emailClicked?: boolean;
  gmailClicked?: boolean;
  linkedinClicked?: boolean;
  lastIntentScore?: number;
  lastIntentLabel?: "low" | "medium" | "high" | "hot" | string;
  contacted?: boolean;
  contactStatus?: SecureReportContactStatus;
  contactStatusLabel?: string;
  contactReason?: string;
  linkedLeadFound?: boolean;
  leadLookupError?: string;
  sentAt?: string;
  lastEngagedAt?: string;
  lastOpenedAt?: string;
  lastClickedAt?: string;
  openCount?: number;
  clickCount?: number;
  followUpCount?: number;
  [key: string]: any;
};

export type SecureReportListState = {
  loading: boolean;
  error: string;
  status: string;
  loadedAt: number | null;
  search: string;
  filter: SecureReportFilter;
  selectedToken: string;
  selectedTokens: string[];
  rows: SecureReportRow[];
  bulkLoading: boolean;
  bulkError: string;
  bulkStatus: string;
  bulkRows: BulkSecureReportCleanupRow[];
  bulkFailedCount: number;
  bulkCompletedCount: number;
};


export type ReportChatMessageRow = {
  sessionId: string;
  reportToken: string;
  role: "user" | "assistant";
  content: string;
  source?: string;
  quotaStatus?: string;
  createdAt?: string;
};

export type ReportChatSessionRow = {
  id: string;
  reportToken: string;
  domain?: string;
  domainSlug?: string;
  companyName?: string;
  countryCode?: string;
  countryName?: string;
  region?: string;
  city?: string;
  deviceType?: "Mobile" | "Tablet" | "Desktop" | "Unknown" | string;
  browser?: string;
  os?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  updatedAt?: string;
  messageCount?: number;
  lastUserQuestion?: string;
  lastAssistantAnswerSnippet?: string;
  reviewedAt?: string;
  reportUrl?: string;
  pdfDownloadedAt?: string;
  lastPdfDownloadedAt?: string;
  pdfDownloadCount?: number;
};

export type ChatInsightsState = {
  loading: boolean;
  transcriptLoading: boolean;
  actionLoading: boolean;
  error: string;
  status: string;
  loadedAt: number | null;
  search: string;
  rows: ReportChatSessionRow[];
  selectedSession: ReportChatSessionRow | null;
  messages: ReportChatMessageRow[];
};
