import { useCallback } from "react";
import { auth } from "@/lib/firebase";
import type { FollowupSummaryState } from "../types";

type SetState<T> = (value: T | ((current: T) => T)) => void;

type UseFollowupAdminParams = {
  followupSummary: FollowupSummaryState;
  dailyFollowupLimit: number;
  followupBatchPerRun: number;
  setFollowupSummary: SetState<FollowupSummaryState>;
  setDryRunLoading: SetState<boolean>;
  setDryRunStatus: SetState<string>;
  setDryRunRows: SetState<any[]>;
  setPostmasterLoading: SetState<boolean>;
  setPostmasterStatus: SetState<string>;
  setPostmasterHealth: SetState<any>;
};

export function useFollowupAdmin(params: UseFollowupAdminParams) {
  const {
    followupSummary,
    dailyFollowupLimit,
    followupBatchPerRun,
    setFollowupSummary,
    setDryRunLoading,
    setDryRunStatus,
    setDryRunRows,
    setPostmasterLoading,
    setPostmasterStatus,
    setPostmasterHealth,
  } = params;

  const loadFollowupSummary = useCallback(
    async (force = false) => {
      if (!force && followupSummary.loadedAt && Date.now() - followupSummary.loadedAt < 60_000) return;

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setFollowupSummary((current) => ({ ...current, error: "Please login again.", loading: false }));
        return;
      }

      try {
        setFollowupSummary((current) => ({ ...current, loading: true, error: "" }));
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/trackflow/automation/followups/summary", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Follow-up summary failed");

        setFollowupSummary({
          loading: false,
          error: "",
          loadedAt: Date.now(),
          sentToday: Number(data.sentToday || 0),
          dailyLimit: Number(data.dailyLimit || dailyFollowupLimit || 50),
          batchPerRun: Number(data.batchPerRun || followupBatchPerRun || 5),
          remainingToday: Number(
            data.remainingToday ?? Math.max(0, Number(data.dailyLimit || dailyFollowupLimit || 50) - Number(data.sentToday || 0)),
          ),
          maxThisRun: Number(
            data.maxThisRun ??
              Math.min(
                Number(data.batchPerRun || followupBatchPerRun || 5),
                Math.max(0, Number(data.dailyLimit || dailyFollowupLimit || 50) - Number(data.sentToday || 0)),
              ),
          ),
          dueNow: Number(data.dueNow || 0),
          scheduled: Number(data.scheduled || 0),
          waitingFirstOpen: Number(data.waitingFirstOpen || 0),
          waitingNewEngagement: Number(data.waitingNewEngagement || 0),
          templateBlocked: Number(data.templateBlocked || 0),
          failedRetry: Number(data.failedRetry || 0),
          failedFinal: Number(data.failedFinal || 0),
          blocked: Number(data.blocked || 0),
        });
      } catch (error: any) {
        console.error("Follow-up summary error:", error);
        setFollowupSummary((current) => ({
          ...current,
          loading: false,
          error: error.message || "Follow-up summary failed",
        }));
      }
    },
    [dailyFollowupLimit, followupBatchPerRun, followupSummary.loadedAt, setFollowupSummary],
  );

  const loadFollowupDryRun = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      window.alert("Please login again.");
      return;
    }

    try {
      setDryRunLoading(true);
      setDryRunStatus("Loading dry-run preview...");
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/automation/followups/dry-run?limit=50&includeBlocked=false&mode=due", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Dry-run failed");
      setDryRunRows(Array.isArray(data.rows) ? data.rows : []);
      setDryRunStatus(`Dry-run ready: ${data.eligibleCount || 0} eligible lead(s). Checked ${data.checked || 0}.`);
    } catch (error: any) {
      console.error("Follow-up dry-run error:", error);
      setDryRunRows([]);
      setDryRunStatus(`Dry-run failed: ${error.message || "Unknown error"}`);
    } finally {
      setDryRunLoading(false);
    }
  }, [setDryRunLoading, setDryRunRows, setDryRunStatus]);

  const loadPostmasterHealth = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      window.alert("Please login again.");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort("Postmaster request timeout"), 60000);

    try {
      setPostmasterLoading(true);
      setPostmasterStatus("Loading Google Postmaster health...");
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/postmaster/health?daysBack=1&maxLookback=3", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        cache: "no-store",
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {
          success: false,
          error: `Postmaster API did not return JSON. Status: ${response.status}`,
        };
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Postmaster health failed");
      }

      setPostmasterHealth(data);

      if (!data.configured) {
        setPostmasterStatus("Postmaster API not configured yet.");
      } else if (data.authError || data.needsCredentialRefresh) {
        setPostmasterStatus(data.message || "Postmaster OAuth credentials need to be refreshed.");
      } else if (data.noData) {
        setPostmasterStatus(data.message || "Postmaster connected, but no traffic data is available yet.");
      } else {
        setPostmasterStatus(`Postmaster health loaded for ${data.date || "latest available date"}.`);
      }
    } catch (error: any) {
      console.error("Postmaster health error:", error);
      setPostmasterHealth(null);

      if (error?.name === "AbortError") {
        setPostmasterStatus("Postmaster request timed out. The dashboard is still safe; try again after refreshing credentials or increasing Google API response time.");
      } else {
        setPostmasterStatus(`Postmaster failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      window.clearTimeout(timeout);
      setPostmasterLoading(false);
    }
  }, [setPostmasterHealth, setPostmasterLoading, setPostmasterStatus]);

  return {
    loadFollowupSummary,
    loadFollowupDryRun,
    loadPostmasterHealth,
  };
}
