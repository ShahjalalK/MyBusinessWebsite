/**
 * TrackFlowPro lead cache store
 * বাংলা ব্যাখ্যা: Dashboard বারবার open/tab switch করলে যেন Firestore/API read না বাড়ে,
 * তাই leads cache, pagination, load more, refresh control এখানে রাখা হয়েছে।
 */
import { create } from "zustand";
import { auth } from "@/lib/firebase";

export type LeadViewFilter = "active" | "archived" | "trash" | "all";

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
};

type LeadStoreState = {
  leads: CachedLead[];
  loading: boolean;
  loadingMore: boolean;
  error: string;
  pageSize: number;
  hasLoadedOnce: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  lastFetchedAt: number | null;
  filters: {
    view: LeadViewFilter;
    month: string;
    status: string;
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

function normalizeFetchFilters(state: LeadStoreState, options: LeadFetchOptions = {}) {
  return {
    view: options.view || state.filters.view || "active",
    month: options.month || state.filters.month || "All",
    status: options.status || state.filters.status || "All",
  };
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
  hasLoadedOnce: false,
  hasMore: true,
  nextCursor: null,
  lastFetchedAt: null,
  filters: {
    view: "active",
    month: "All",
    status: "All",
  },

  fetchLatestLeads: async (options = {}) => {
    const state = get();
    const { force = false } = options;
    const filters = normalizeFetchFilters(state, options);
    const sameFilters =
      filters.view === state.filters.view &&
      filters.month === state.filters.month &&
      filters.status === state.filters.status;

    if (!force && sameFilters && state.hasLoadedOnce && state.leads.length > 0) {
      return;
    }

    set({ loading: true, error: "", filters });

    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        limit: String(state.pageSize),
        view: filters.view,
      });

      if (filters.month && filters.month !== "All") params.set("month", filters.month);
      if (filters.status && filters.status !== "All") params.set("status", filters.status);

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
        filters,
      });
    } catch (error: any) {
      console.error("Lead cache load error:", error);
      set({ loading: false, error: error?.message || "Lead load failed" });
    }
  },

  refreshLeads: async (options = {}) => {
    await get().fetchLatestLeads({ ...options, force: true });
  },

  fetchMoreLeads: async () => {
    const state = get();
    if (state.loadingMore || !state.hasMore || !state.nextCursor) return;

    set({ loadingMore: true, error: "" });

    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        limit: String(state.pageSize),
        view: state.filters.view,
        cursor: state.nextCursor,
      });

      if (state.filters.month && state.filters.month !== "All") params.set("month", state.filters.month);
      if (state.filters.status && state.filters.status !== "All") params.set("status", state.filters.status);

      const response = await fetch(`/api/trackflow/leads?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "More lead load failed");

      const moreRows = Array.isArray(data.rows) ? data.rows : [];

      set({
        leads: [...state.leads, ...moreRows],
        nextCursor: data.nextCursor || null,
        hasMore: Boolean(data.hasMore),
        loadingMore: false,
        lastFetchedAt: Date.now(),
        error: "",
      });
    } catch (error: any) {
      console.error("Lead cache pagination error:", error);
      set({ loadingMore: false, error: error?.message || "More lead load failed" });
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
      filters: {
        view: "active",
        month: "All",
        status: "All",
      },
    });
  },
}));
