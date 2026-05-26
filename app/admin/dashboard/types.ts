export type MainTab = "overview" | "sheet" | "outreach" | "scheduled" | "leads" | "cleanup" | "automation" | "analytics";
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

export type SentMessage = {
  step: number;
  subject: string;
  message?: string;
  sentAt: any;
  trackingTag?: string;
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
  lastOpenedAt?: any;
  lastClickedAt?: any;
  lastEngagedAt?: any;
  lastFollowUp?: any;
  nextFollowupAt?: any;
  nextFollowupStep?: number;
  nextFollowupStatus?: string;
  nextFollowupReason?: string;
  retryCount?: number;
  lastFollowupError?: string;
  sentAt?: any;
  tracking_history?: TrackingHistory[];
  follow_up_count?: number;
  sent_messages?: SentMessage[];
  service?: ServiceId | string;
  stopAutomation?: boolean;
  sender_email?: string;
  sender_name?: string;
  source?: string;
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
  [key: string]: any;
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

export type BulkLeadAction = "archive" | "restore" | "trash" | "delete_permanent";
