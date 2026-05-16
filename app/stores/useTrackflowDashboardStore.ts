import { create } from "zustand";

type SetValue<T> = T | ((current: T) => T);
type Setter<T> = (value: SetValue<T>) => void;

export type LeadViewFilter = "active" | "archived" | "trash" | "all";

export type ServiceId = "Email Signature" | "Google Ads" | "Server Side Tracking";
export type StepId = "step1" | "step2" | "step3" | "step4" | "step5";
export type TriggerMode = "no_reply_after_delay" | "open_required";
export type CleanupBucket = "due" | "cold" | "warm" | "replied" | "protected" | "upcoming";

export type Variant = {
  id: string;
  content: string;
};

export type StepConfig = {
  variants: Variant[];
  delay: number;
};

export type FollowupConfig = Record<ServiceId, Record<StepId, StepConfig>>;

type FollowupSummaryState = {
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

type FirebaseUsageState = {
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

export type CleanupState = {
  loading: boolean;
  actionLoading: boolean;
  error: string;
  status: string;
  loadedAt: number | null;
  bucket: CleanupBucket;
  rows: any[];
  policy?: any;
};

const initialFollowupSummary: FollowupSummaryState = {
  loading: false,
  error: "",
  loadedAt: null,
  sentToday: 0,
  dailyLimit: 50,
  batchPerRun: 5,
  remainingToday: 50,
  maxThisRun: 5,
  dueNow: 0,
  scheduled: 0,
  waitingFirstOpen: 0,
  waitingNewEngagement: 0,
  templateBlocked: 0,
  failedRetry: 0,
  failedFinal: 0,
  blocked: 0,
};

const initialFirebaseUsage: FirebaseUsageState = {
  loading: false,
  error: "",
  loadedAt: null,
  usage: {
    estimatedReadsToday: 0,
    estimatedWritesToday: 0,
    estimatedDeletesToday: 0,
    estimatedStorageMb: 0,
    readPercent: 0,
    writePercent: 0,
    deletePercent: 0,
    storagePercent: 0,
  },
  quota: {
    readsPerDay: 50000,
    writesPerDay: 20000,
    deletesPerDay: 20000,
    storageMb: 1024,
  },
  counts: {
    leadCount: 0,
    activeLeadCount: 0,
    archivedLeadCount: 0,
    trashedLeadCount: 0,
    emailEventCount: 0,
    suppressionCount: 0,
    initialSentToday: 0,
    followupSentToday: 0,
    eventsToday: 0,
  },
  note: "",
};

const initialLeadCleanup: CleanupState = {
  loading: false,
  actionLoading: false,
  error: "",
  status: "",
  loadedAt: null,
  bucket: "due",
  rows: [],
  policy: null,
};

function resolveValue<T>(current: T, value: SetValue<T>): T {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

function buildSetter<T>(key: keyof TrackflowDashboardStoreState, set: any): Setter<T> {
  return (value: SetValue<T>) => {
    set((state: TrackflowDashboardStoreState) => ({
      [key]: resolveValue(state[key] as T, value),
    }));
  };
}

export type TrackflowDashboardStoreState = {
  // Lead screen UI/cache state
  searchTerm: string;
  activeService: string;
  activeStep: number | "All";
  selectedMonth: string;
  leadView: LeadViewFilter;
  leadStatusFilter: string;
  selectedLeadIds: string[];
  bulkActionLoading: boolean;
  bulkActionStatus: string;
  showAllLogs: boolean;

  // Google Sheet tab cache state
  sheetLeads: any[];
  sheetLoading: boolean;
  sheetStatus: string;
  selectedSheetRows: number[];
  sheetLeadFilter: string;
  sheetApprovalFilter: string;
  sheetSendFilter: string;
  sheetLoadedAt: number | null;
  sheetCacheKey: string;

  // Automation/follow-up state
  followupConfig: FollowupConfig;
  followupLoading: boolean;
  followupSaving: boolean;
  hasUnsavedChanges: boolean;
  activeFollowupService: ServiceId;
  activeFollowupStep: StepId;
  dailyFollowupLimit: number;
  followupBatchPerRun: number;
  triggerMode: TriggerMode;
  showVariantLeads: string | null;
  dryRunLoading: boolean;
  dryRunRows: any[];
  dryRunStatus: string;
  postmasterLoading: boolean;
  postmasterHealth: any;
  postmasterStatus: string;
  followupConfigLoadedAt: number | null;

  // Scheduled tab state
  scheduledEmails: any[];
  scheduledLoading: boolean;
  scheduledStatus: string;
  scheduledEdit: any | null;
  scheduledSaving: boolean;
  scheduledLoadedAt: number | null;

  // System/cleanup state
  followupSummary: FollowupSummaryState;
  firebaseUsage: FirebaseUsageState;
  cleanupLoading: boolean;
  leadCleanup: CleanupState;
  selectedCleanupIds: string[];

  setSearchTerm: Setter<string>;
  setActiveService: Setter<string>;
  setActiveStep: Setter<number | "All">;
  setSelectedMonth: Setter<string>;
  setLeadView: Setter<LeadViewFilter>;
  setLeadStatusFilter: Setter<string>;
  setSelectedLeadIds: Setter<string[]>;
  setBulkActionLoading: Setter<boolean>;
  setBulkActionStatus: Setter<string>;
  setShowAllLogs: Setter<boolean>;

  setSheetLeads: Setter<any[]>;
  setSheetLoading: Setter<boolean>;
  setSheetStatus: Setter<string>;
  setSelectedSheetRows: Setter<number[]>;
  setSheetLeadFilter: Setter<string>;
  setSheetApprovalFilter: Setter<string>;
  setSheetSendFilter: Setter<string>;
  setSheetLoadedAt: Setter<number | null>;
  setSheetCacheKey: Setter<string>;
  updateSheetRowInCache: (rowNumber: number, updates: Record<string, any>) => void;
  updateSheetRowsInCache: (items: Array<{ rowNumber: number; updates: Record<string, any> }>) => void;
  invalidateSheetCache: () => void;

  setFollowupConfig: Setter<FollowupConfig>;
  setFollowupLoading: Setter<boolean>;
  setFollowupSaving: Setter<boolean>;
  setHasUnsavedChanges: Setter<boolean>;
  setActiveFollowupService: Setter<ServiceId>;
  setActiveFollowupStep: Setter<StepId>;
  setDailyFollowupLimit: Setter<number>;
  setFollowupBatchPerRun: Setter<number>;
  setTriggerMode: Setter<TriggerMode>;
  setShowVariantLeads: Setter<string | null>;
  setDryRunLoading: Setter<boolean>;
  setDryRunRows: Setter<any[]>;
  setDryRunStatus: Setter<string>;
  setPostmasterLoading: Setter<boolean>;
  setPostmasterHealth: Setter<any>;
  setPostmasterStatus: Setter<string>;
  setFollowupConfigLoadedAt: Setter<number | null>;

  setScheduledEmails: Setter<any[]>;
  setScheduledLoading: Setter<boolean>;
  setScheduledStatus: Setter<string>;
  setScheduledEdit: Setter<any | null>;
  setScheduledSaving: Setter<boolean>;
  setScheduledLoadedAt: Setter<number | null>;
  updateScheduledEmailInCache: (leadId: string, patch: Record<string, any>) => void;
  removeScheduledEmailFromCache: (leadId: string) => void;

  setFollowupSummary: Setter<FollowupSummaryState>;
  setFirebaseUsage: Setter<FirebaseUsageState>;
  setCleanupLoading: Setter<boolean>;
  setLeadCleanup: Setter<CleanupState>;
  setSelectedCleanupIds: Setter<string[]>;
  resetDashboardStore: () => void;
};


function makeInitialFollowupConfig(): FollowupConfig {
  const services: ServiceId[] = ["Email Signature", "Google Ads", "Server Side Tracking"];
  const steps: StepId[] = ["step1", "step2", "step3", "step4", "step5"];

  return services.reduce((serviceAcc, service) => {
    serviceAcc[service] = steps.reduce((stepAcc, step) => {
      stepAcc[step] = { variants: [{ id: "V1", content: "" }], delay: 1440 };
      return stepAcc;
    }, {} as Record<StepId, StepConfig>);
    return serviceAcc;
  }, {} as FollowupConfig);
}

const initialState = {
  searchTerm: "",
  activeService: "All",
  activeStep: "All" as number | "All",
  selectedMonth: "All",
  leadView: "active" as LeadViewFilter,
  leadStatusFilter: "All",
  selectedLeadIds: [] as string[],
  bulkActionLoading: false,
  bulkActionStatus: "",
  showAllLogs: false,

  sheetLeads: [] as any[],
  sheetLoading: false,
  sheetStatus: "",
  selectedSheetRows: [] as number[],
  sheetLeadFilter: "Qualified",
  sheetApprovalFilter: "All",
  sheetSendFilter: "Not Sent",
  sheetLoadedAt: null as number | null,
  sheetCacheKey: "",

  followupConfig: makeInitialFollowupConfig(),
  followupLoading: false,
  followupSaving: false,
  hasUnsavedChanges: false,
  activeFollowupService: "Email Signature" as ServiceId,
  activeFollowupStep: "step1" as StepId,
  dailyFollowupLimit: 50,
  followupBatchPerRun: 5,
  triggerMode: "open_required" as TriggerMode,
  showVariantLeads: null as string | null,
  dryRunLoading: false,
  dryRunRows: [] as any[],
  dryRunStatus: "",
  postmasterLoading: false,
  postmasterHealth: null as any,
  postmasterStatus: "",
  followupConfigLoadedAt: null as number | null,

  scheduledEmails: [] as any[],
  scheduledLoading: false,
  scheduledStatus: "",
  scheduledEdit: null as any | null,
  scheduledSaving: false,
  scheduledLoadedAt: null as number | null,

  followupSummary: initialFollowupSummary,
  firebaseUsage: initialFirebaseUsage,
  cleanupLoading: false,
  leadCleanup: initialLeadCleanup,
  selectedCleanupIds: [] as string[],
};

export const useTrackflowDashboardStore = create<TrackflowDashboardStoreState>((set) => ({
  ...initialState,

  setSearchTerm: buildSetter<string>("searchTerm", set),
  setActiveService: buildSetter<string>("activeService", set),
  setActiveStep: buildSetter<number | "All">("activeStep", set),
  setSelectedMonth: buildSetter<string>("selectedMonth", set),
  setLeadView: buildSetter<LeadViewFilter>("leadView", set),
  setLeadStatusFilter: buildSetter<string>("leadStatusFilter", set),
  setSelectedLeadIds: buildSetter<string[]>("selectedLeadIds", set),
  setBulkActionLoading: buildSetter<boolean>("bulkActionLoading", set),
  setBulkActionStatus: buildSetter<string>("bulkActionStatus", set),
  setShowAllLogs: buildSetter<boolean>("showAllLogs", set),

  setSheetLeads: buildSetter<any[]>("sheetLeads", set),
  setSheetLoading: buildSetter<boolean>("sheetLoading", set),
  setSheetStatus: buildSetter<string>("sheetStatus", set),
  setSelectedSheetRows: buildSetter<number[]>("selectedSheetRows", set),
  setSheetLeadFilter: buildSetter<string>("sheetLeadFilter", set),
  setSheetApprovalFilter: buildSetter<string>("sheetApprovalFilter", set),
  setSheetSendFilter: buildSetter<string>("sheetSendFilter", set),
  setSheetLoadedAt: buildSetter<number | null>("sheetLoadedAt", set),
  setSheetCacheKey: buildSetter<string>("sheetCacheKey", set),
  updateSheetRowInCache: (rowNumber, updates) => {
    set((state) => ({
      sheetLeads: state.sheetLeads.map((lead) =>
        Number(lead?.rowNumber) === Number(rowNumber) ? { ...lead, ...updates } : lead
      ),
    }));
  },
  updateSheetRowsInCache: (items) => {
    set((state) => {
      const updateMap = new Map<number, Record<string, any>>(items.map((item) => [Number(item.rowNumber), item.updates]));
      return {
        sheetLeads: state.sheetLeads.map((lead) => {
          const updates = updateMap.get(Number(lead?.rowNumber));
          return updates ? { ...(typeof lead === "object" && lead !== null ? lead : {}), ...updates } : lead;
        }),
      };
    });
  },
  invalidateSheetCache: () => set({ sheetLoadedAt: null, sheetCacheKey: "" }),

  setFollowupConfig: buildSetter<FollowupConfig>("followupConfig", set),
  setFollowupLoading: buildSetter<boolean>("followupLoading", set),
  setFollowupSaving: buildSetter<boolean>("followupSaving", set),
  setHasUnsavedChanges: buildSetter<boolean>("hasUnsavedChanges", set),
  setActiveFollowupService: buildSetter<ServiceId>("activeFollowupService", set),
  setActiveFollowupStep: buildSetter<StepId>("activeFollowupStep", set),
  setDailyFollowupLimit: buildSetter<number>("dailyFollowupLimit", set),
  setFollowupBatchPerRun: buildSetter<number>("followupBatchPerRun", set),
  setTriggerMode: buildSetter<TriggerMode>("triggerMode", set),
  setShowVariantLeads: buildSetter<string | null>("showVariantLeads", set),
  setDryRunLoading: buildSetter<boolean>("dryRunLoading", set),
  setDryRunRows: buildSetter<any[]>("dryRunRows", set),
  setDryRunStatus: buildSetter<string>("dryRunStatus", set),
  setPostmasterLoading: buildSetter<boolean>("postmasterLoading", set),
  setPostmasterHealth: buildSetter<any>("postmasterHealth", set),
  setPostmasterStatus: buildSetter<string>("postmasterStatus", set),
  setFollowupConfigLoadedAt: buildSetter<number | null>("followupConfigLoadedAt", set),

  setScheduledEmails: buildSetter<any[]>("scheduledEmails", set),
  setScheduledLoading: buildSetter<boolean>("scheduledLoading", set),
  setScheduledStatus: buildSetter<string>("scheduledStatus", set),
  setScheduledEdit: buildSetter<any | null>("scheduledEdit", set),
  setScheduledSaving: buildSetter<boolean>("scheduledSaving", set),
  setScheduledLoadedAt: buildSetter<number | null>("scheduledLoadedAt", set),
  updateScheduledEmailInCache: (leadId, patch) => {
    set((state) => ({
      scheduledEmails: state.scheduledEmails.map((lead) => (lead?.id === leadId ? { ...(typeof lead === "object" && lead !== null ? lead : {}), ...patch } : lead)),
    }));
  },
  removeScheduledEmailFromCache: (leadId) => {
    set((state) => ({
      scheduledEmails: state.scheduledEmails.filter((lead) => lead?.id !== leadId),
    }));
  },

  setFollowupSummary: buildSetter<FollowupSummaryState>("followupSummary", set),
  setFirebaseUsage: buildSetter<FirebaseUsageState>("firebaseUsage", set),
  setCleanupLoading: buildSetter<boolean>("cleanupLoading", set),
  setLeadCleanup: buildSetter<CleanupState>("leadCleanup", set),
  setSelectedCleanupIds: buildSetter<string[]>("selectedCleanupIds", set),
  resetDashboardStore: () => set({ ...initialState }),
}));
