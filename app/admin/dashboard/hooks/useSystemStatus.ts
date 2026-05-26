import { useCallback } from "react";
import { auth } from "@/lib/firebase";
import type { FirebaseUsageState } from "../types";

type SetState<T> = (value: T | ((current: T) => T)) => void;

type UseSystemStatusParams = {
  firebaseUsage: FirebaseUsageState;
  systemHealth: any;
  setFirebaseUsage: SetState<FirebaseUsageState>;
  setSystemHealth: SetState<any>;
  setCleanupLoading: SetState<boolean>;
  refreshLeads: (input: any) => Promise<any>;
  leadView: string;
  selectedMonth: string;
  leadStatusFilter: string;
};

export function useSystemStatus(params: UseSystemStatusParams) {
  const {
    firebaseUsage,
    systemHealth,
    setFirebaseUsage,
    setSystemHealth,
    setCleanupLoading,
    refreshLeads,
    leadView,
    selectedMonth,
    leadStatusFilter,
  } = params;

  const loadFirebaseUsage = useCallback(
    async (force = false) => {
      if (!force && firebaseUsage.loadedAt && Date.now() - firebaseUsage.loadedAt < 60_000) return;

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setFirebaseUsage((current) => ({ ...current, error: "Please login again.", loading: false }));
        return;
      }

      try {
        setFirebaseUsage((current) => ({ ...current, loading: true, error: "" }));
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/trackflow/system/usage-summary", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Usage summary failed");

        setFirebaseUsage({
          loading: false,
          error: "",
          loadedAt: Date.now(),
          usage: {
            estimatedReadsToday: Number(data.usage?.estimatedReadsToday || 0),
            estimatedWritesToday: Number(data.usage?.estimatedWritesToday || 0),
            estimatedDeletesToday: Number(data.usage?.estimatedDeletesToday || 0),
            estimatedStorageMb: Number(data.usage?.estimatedStorageMb || 0),
            readPercent: Number(data.usage?.readPercent || 0),
            writePercent: Number(data.usage?.writePercent || 0),
            deletePercent: Number(data.usage?.deletePercent || 0),
            storagePercent: Number(data.usage?.storagePercent || 0),
          },
          quota: {
            readsPerDay: Number(data.quota?.readsPerDay || 50000),
            writesPerDay: Number(data.quota?.writesPerDay || 20000),
            deletesPerDay: Number(data.quota?.deletesPerDay || 20000),
            storageMb: Number(data.quota?.storageMb || 1024),
          },
          counts: {
            leadCount: Number(data.counts?.leadCount || 0),
            activeLeadCount: Number(data.counts?.activeLeadCount || 0),
            archivedLeadCount: Number(data.counts?.archivedLeadCount || 0),
            trashedLeadCount: Number(data.counts?.trashedLeadCount || 0),
            emailEventCount: Number(data.counts?.emailEventCount || 0),
            suppressionCount: Number(data.counts?.suppressionCount || 0),
            initialSentToday: Number(data.counts?.initialSentToday || 0),
            followupSentToday: Number(data.counts?.followupSentToday || 0),
            eventsToday: Number(data.counts?.eventsToday || 0),
          },
          note: String(data.note || ""),
        });
      } catch (error: any) {
        console.error("Firebase usage summary error:", error);
        setFirebaseUsage((current) => ({ ...current, loading: false, error: error.message || "Usage summary failed" }));
      }
    },
    [firebaseUsage.loadedAt, setFirebaseUsage],
  );

  const loadSystemHealth = useCallback(
    async (force = false, deep = false) => {
      if (!force && systemHealth.loadedAt && Date.now() - systemHealth.loadedAt < 60_000) return;

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSystemHealth((current: any) => ({ ...current, loading: false, error: "Please login again.", status: "error" }));
        return;
      }

      try {
        setSystemHealth((current: any) => ({ ...current, loading: true, error: "" }));
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/trackflow/admin/health${deep ? "?deep=true" : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "System health check failed");

        setSystemHealth({
          loading: false,
          error: "",
          loadedAt: Date.now(),
          status: data.switches?.automationPaused ? "paused" : data.status || "ok",
          service: String(data.service || data.mode || "TrackFlowPro API"),
          deep: Boolean(data.deep),
          env: data.env || {},
          switches: {
            ...(data.switches || {}),
            ...(data.drivePdfCleanup ? { drivePdfCleanup: data.drivePdfCleanup } : {}),
          },
          checks: data.checks || data.cronStatus || {},
          followupConfigSource: data.followupConfigSource || data.admin?.followupConfigSource || "",
          followupConfigSavedInFirestore: Boolean(data.followupConfigSavedInFirestore || data.admin?.followupConfigSavedInFirestore),
          followupDailyLimit: Number(data.followupDailyLimit || data.admin?.followupDailyLimit || 0),
          followupBatchPerRun: Number(data.followupBatchPerRun || data.admin?.followupBatchPerRun || 0),
        });
      } catch (error: any) {
        console.error("System health check error:", error);
        setSystemHealth((current: any) => ({
          ...current,
          loading: false,
          error: error?.message || "System health check failed",
          status: "error",
        }));
      }
    },
    [setSystemHealth, systemHealth.loadedAt],
  );

  const runSystemCleanup = useCallback(
    async (action: string, days = 30) => {
      const currentUser = auth.currentUser;
      if (!currentUser) return window.alert("Please login again.");
      const labelMap: Record<string, string> = {
        archive_replied: `Archive replied leads older than ${days} days?`,
        archive_finished: `Archive finished/bounced/unsubscribed leads older than ${days} days?`,
        trash_test_leads: "Move detected test/fake leads to trash?",
        delete_old_events: `Delete email event logs older than ${days} days? This cannot be restored.`,
      };
      if (!window.confirm(labelMap[action] || "Run cleanup action?")) return;

      try {
        setCleanupLoading(true);
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/trackflow/system/cleanup", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, days }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Cleanup failed");
        window.alert(data.message || "Cleanup completed.");
        await refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter });
        await loadFirebaseUsage(true);
      } catch (error: any) {
        console.error("System cleanup error:", error);
        window.alert(error.message || "Cleanup failed.");
      } finally {
        setCleanupLoading(false);
      }
    },
    [leadStatusFilter, leadView, loadFirebaseUsage, refreshLeads, selectedMonth, setCleanupLoading],
  );

  return {
    loadFirebaseUsage,
    loadSystemHealth,
    runSystemCleanup,
  };
}
