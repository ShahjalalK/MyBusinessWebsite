/**
 * TrackFlowPro lead cache store
 * বাংলা ব্যাখ্যা: Dashboard বারবার open/tab switch করলে যেন Firestore/API read না বাড়ে।
 * তাই leads cache, TTL, pagination, load more, refresh control এখানে রাখা হয়েছে।
 */
import { create } from "zustand";
import { auth } from "@/lib/firebase";

export type LeadViewFilter = "active" | "archived" | "trash" | "all";
export type LeadSourceFilter = "all" | "manual" | "manual_report_linked" | "sheet" | "sheet_primary" | "sheet_additional" | "test";

export type CachedLead = {
  id: string;
  email?: string;
  emailLower?: string;
  name?: string;
  company_name?: string;
  subject?: string;
  status?: string;
  createdAt?: any;
  follow_up_count?: number;
  open_count?: number;
  click_count?: number;
  stopAutomation?: boolean;
  service?: string;
  reportUrl?: string;
  reportToken?: string;
  sourceOrigin?: string;
  sourceRole?: string;
  keepUnderSheetAudit?: boolean;
  sheetRowNumber?: number | null;
  sheetFinalEmail?: string;
  sheetWebsiteUrl?: string;
  parentSheetEmail?: string;
  parentSheetRowNumber?: number | null;
  parentSheetWebsiteUrl?: string;
  parentReportToken?: string;
  reportReady?: boolean;
  reportViewedAt?: any;
  pdfFileId?: string;
  pdfViewUrl?: string;
  pdfDownloadUrl?: string;
  pdfExpiresAt?: any;
  pdfDownloadedAt?: any;
  reportCtaClickedAt?: any;
  sender_email?: string;
  sender_name?: string;
  nextFollowupAt?: any;
  nextFollowupStep?: number;
  nextFollowupStatus?: string;
  nextFollowupReason?: string;
  archived?: boolean;
  archivedAt?: any;
  deleted?: boolean;
  deletedAt?: any;
  [key: string]: any;
};

type LeadFetchOptions = {
  force?: boolean;
  view?: LeadViewFilter;
  month?: string;
  status?: string;
  source?: LeadSourceFilter;
  reportReadyOnly?: boolean;
};

type LeadStoreState = {
  leads: CachedLead[];
  loading: boolean;
  loadingMore: boolean;
  error: string;
  pageSize: number;
  cacheTtlMs: number;
  hasLoadedOnce: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  lastFetchedAt: number | null;
  inFlightFetchKey: string | null;
  filters: {
    view: LeadViewFilter;
    month: string;
    status: string;
    source: LeadSourceFilter;
    reportReadyOnly: boolean;
  };
  fetchLatestLeads: (options?: LeadFetchOptions) => Promise<void>;
  refreshLeads: (options?: Omit<LeadFetchOptions, "force">) => Promise<void>;
  fetchMoreLeads: () => Promise<void>;
  patchLeadInCache: (leadId: string, patch: Partial<CachedLead>) => void;
  patchLeadsInCache: (leadIds: string[], patch: Partial<CachedLead>) => void;
  removeLeadFromCache: (leadId: string) => void;
  removeLeadsFromCache: (leadIds: string[]) => void;
  clearLeadCache: () => void;
};

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_CACHE_TTL_MS = 90_000;

function normalizeFetchFilters(state: LeadStoreState, options: LeadFetchOptions = {}) {
  return {
    view: options.view || state.filters.view || "active",
    month: options.month || state.filters.month || "All",
    status: options.status || state.filters.status || "All",
    source: options.source || state.filters.source || "all",
    reportReadyOnly: options.reportReadyOnly ?? state.filters.reportReadyOnly ?? false,
  };
}

function buildFetchKey(filters: LeadStoreState["filters"]) {
  return `${filters.view}|${filters.month}|${filters.status}|source:${filters.source}|reportReady:${filters.reportReadyOnly ? "1" : "0"}`;
}

function isCacheFresh(lastFetchedAt: number | null, ttlMs: number) {
  return Boolean(lastFetchedAt && Date.now() - lastFetchedAt < ttlMs);
}

async function getAuthToken() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Please login again to load leads.");
  return currentUser.getIdToken();
}

export const useLeadStore = create<LeadStoreState>((set, get) => ({
  leads: [],
  loading: false,
  loadingMore: false,
  error: "",
  pageSize: DEFAULT_PAGE_SIZE,
  cacheTtlMs: DEFAULT_CACHE_TTL_MS,
  hasLoadedOnce: false,
  hasMore: true,
  nextCursor: null,
  lastFetchedAt: null,
  inFlightFetchKey: null,
  filters: {
    view: "active",
    month: "All",
    status: "All",
    source: "all",
    reportReadyOnly: false,
  },

  fetchLatestLeads: async (options: LeadFetchOptions = {}) => {
    const state = get();
    const { force = false } = options;
    const filters = normalizeFetchFilters(state, options);
    const fetchKey = buildFetchKey(filters);
    const sameFilters = buildFetchKey(state.filters) === fetchKey;

    // Cache empty results too. TTL prevents repeated reads on tab switch/re-render,
    // while still allowing automatic freshness after a short window.
    if (!force && sameFilters && state.hasLoadedOnce && isCacheFresh(state.lastFetchedAt, state.cacheTtlMs)) {
      return;
    }

    // Avoid duplicate API reads when React effects fire twice during dev/Strict Mode.
    if (!force && state.loading && state.inFlightFetchKey === fetchKey) {
      return;
    }

    set({ loading: true, error: "", filters, inFlightFetchKey: fetchKey });

    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        limit: String(state.pageSize),
        view: filters.view,
      });

      if (filters.month && filters.month !== "All") params.set("month", filters.month);
      if (filters.status && filters.status !== "All") params.set("status", filters.status);
      if (filters.source && filters.source !== "all") params.set("source", filters.source);
      if (filters.reportReadyOnly) params.set("reportReadyOnly", "true");

      const response = await fetch(`/api/trackflow/leads?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Lead load failed");

      const rows = Array.isArray(data.rows) ? data.rows : [];

      set({
        leads: rows,
        nextCursor: data.nextCursor || null,
        hasMore: Boolean(data.hasMore),
        hasLoadedOnce: true,
        lastFetchedAt: Date.now(),
        loading: false,
        error: "",
        inFlightFetchKey: null,
        filters,
      });
    } catch (error: any) {
      console.error("Lead cache load error:", error);
      set({ loading: false, inFlightFetchKey: null, error: error?.message || "Lead load failed" });
    }
  },

  refreshLeads: async (options: Omit<LeadFetchOptions, "force"> = {}) => {
    await get().fetchLatestLeads({ ...options, force: true });
  },

  fetchMoreLeads: async () => {
    const state = get();
    if (state.loadingMore || !state.hasMore || !state.nextCursor) return;

    const fetchKey = buildFetchKey(state.filters);
    set({ loadingMore: true, error: "", inFlightFetchKey: `more:${fetchKey}` });

    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        limit: String(state.pageSize),
        view: state.filters.view,
        cursor: state.nextCursor,
      });

      if (state.filters.month && state.filters.month !== "All") params.set("month", state.filters.month);
      if (state.filters.status && state.filters.status !== "All") params.set("status", state.filters.status);
      if (state.filters.source && state.filters.source !== "all") params.set("source", state.filters.source);
      if (state.filters.reportReadyOnly) params.set("reportReadyOnly", "true");

      const response = await fetch(`/api/trackflow/leads?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "More lead load failed");

      const moreRows = Array.isArray(data.rows) ? data.rows : [];

      set((current) => {
        const stillSameFilters = buildFetchKey(current.filters) === fetchKey;

        // If the user changed filters while the request was in flight, ignore this old page.
        if (!stillSameFilters) {
          return {
            loadingMore: false,
            inFlightFetchKey: null,
            error: "",
          };
        }

        const existingIds = new Set(current.leads.map((lead) => lead.id));
        const uniqueMoreRows = moreRows.filter((lead: CachedLead) => lead?.id && !existingIds.has(lead.id));

        return {
          leads: [...current.leads, ...uniqueMoreRows],
          nextCursor: data.nextCursor || null,
          hasMore: Boolean(data.hasMore),
          loadingMore: false,
          inFlightFetchKey: null,
          lastFetchedAt: Date.now(),
          error: "",
        };
      });
    } catch (error: any) {
      console.error("Lead cache pagination error:", error);
      set({ loadingMore: false, inFlightFetchKey: null, error: error?.message || "More lead load failed" });
    }
  },

  patchLeadInCache: (leadId, patch) => {
    set((state) => ({
      leads: state.leads.map((lead) => (lead.id === leadId ? { ...lead, ...patch } : lead)),
    }));
  },

  patchLeadsInCache: (leadIds, patch) => {
    const idSet = new Set(leadIds);
    set((state) => ({
      leads: state.leads.map((lead) => (idSet.has(lead.id) ? { ...lead, ...patch } : lead)),
    }));
  },

  removeLeadFromCache: (leadId) => {
    set((state) => ({
      leads: state.leads.filter((lead) => lead.id !== leadId),
    }));
  },

  removeLeadsFromCache: (leadIds) => {
    const idSet = new Set(leadIds);
    set((state) => ({
      leads: state.leads.filter((lead) => !idSet.has(lead.id)),
    }));
  },

  clearLeadCache: () => {
    set({
      leads: [],
      loading: false,
      loadingMore: false,
      error: "",
      hasLoadedOnce: false,
      hasMore: true,
      nextCursor: null,
      lastFetchedAt: null,
      inFlightFetchKey: null,
      filters: {
        view: "active",
        month: "All",
        status: "All",
        source: "all",
        reportReadyOnly: false,
      },
    });
  },
}));
