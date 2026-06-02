import { useCallback } from "react";
import { auth } from "@/lib/firebase";
import { ACTIVE_SENDERS } from "@/lib/senders";
import type { Lead, ScheduledEditState, ServiceId } from "../types";
import { SERVICE_NAMES } from "../constants";
import { isEmailPatternValid, normalizeOptionalUrl, stripHtml, toDateTimeLocalInput } from "../utils";
import { isSecureReportUrl } from "../sheet-readiness";

type SetState<T> = (value: T | ((current: T) => T)) => void;

const SCHEDULED_EMAIL_CACHE_TTL_MS = 30_000;
const BREVO_SCHEDULED_TAB_GRACE_MS = 10 * 60 * 1000;

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value?.toMillis === "function") return Number(value.toMillis()) || 0;
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return 0;
}

function isVisibleScheduledEmail(lead: Lead): boolean {
  const status = String(lead.status || "").trim().toLowerCase();
  if (status && status !== "scheduled") return false;
  if (lead.sentAt || lead.lastSentAt) return false;

  const providerStatus = String(lead.providerScheduleStatus || "").trim().toLowerCase();
  if (["sent", "delivered", "opened", "clicked", "processed", "cancelled", "failed"].includes(providerStatus)) return false;

  const provider = String(lead.scheduledProvider || "").trim().toLowerCase();
  const brevoManaged = lead.brevoScheduled === true || provider === "brevo";
  const scheduledAtMs = toMillis(lead.scheduledAt || lead.brevoScheduledAt);

  if (brevoManaged && scheduledAtMs > 0 && scheduledAtMs <= Date.now() - BREVO_SCHEDULED_TAB_GRACE_MS) return false;

  return true;
}

type UseScheduledEmailsParams = {
  scheduledEmails: Lead[];
  scheduledLoadedAt: number | null;
  scheduledEdit: ScheduledEditState | null;
  setScheduledEmails: SetState<Lead[]>;
  setScheduledLoadedAt: SetState<number | null>;
  setScheduledStatus: SetState<string>;
  setScheduledLoading: SetState<boolean>;
  setScheduledEdit: SetState<ScheduledEditState | null>;
  setScheduledSaving: SetState<boolean>;
};

export function useScheduledEmails(params: UseScheduledEmailsParams) {
  const {
    scheduledEmails,
    scheduledLoadedAt,
    scheduledEdit,
    setScheduledEmails,
    setScheduledLoadedAt,
    setScheduledStatus,
    setScheduledLoading,
    setScheduledEdit,
    setScheduledSaving,
  } = params;

  const loadScheduledEmails = useCallback(
    async (force = false) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setScheduledStatus("Please login again to load scheduled emails.");
        return;
      }

      if (!force && scheduledLoadedAt && Date.now() - scheduledLoadedAt < SCHEDULED_EMAIL_CACHE_TTL_MS) {
        const visibleCachedRows = scheduledEmails.filter(isVisibleScheduledEmail);
        if (visibleCachedRows.length !== scheduledEmails.length) {
          setScheduledEmails(visibleCachedRows);
        }
        setScheduledStatus(`Cached ${visibleCachedRows.length} scheduled email(s). Use refresh if needed.`);
        return;
      }

      try {
        setScheduledLoading(true);
        setScheduledStatus("Loading scheduled emails...");
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/trackflow/scheduled-emails?status=scheduled&limit=100", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Scheduled email load failed");
        const rows = Array.isArray(data.rows) ? data.rows.filter(isVisibleScheduledEmail) : [];
        setScheduledEmails(rows);
        setScheduledLoadedAt(Date.now());
        setScheduledStatus(`Loaded ${rows.length} scheduled email(s).`);
      } catch (error: any) {
        console.error("Scheduled emails load error:", error);
        setScheduledEmails([]);
        setScheduledStatus(`Scheduled email load failed: ${error.message || "Unknown error"}`);
      } finally {
        setScheduledLoading(false);
      }
    },
    [scheduledEmails, scheduledLoadedAt, setScheduledEmails, setScheduledLoadedAt, setScheduledLoading, setScheduledStatus],
  );

  const openScheduledEditor = useCallback(
    (lead: Lead) => {
      setScheduledEdit({
        leadId: lead.id,
        email: String(lead.email || lead.emailLower || ""),
        clientName: String(lead.name || ""),
        companyName: String(lead.company_name || ""),
        website: String(lead.website || ""),
        businessType: String(lead.business_type || ""),
        subject: String(lead.subject || ""),
        message: String(lead.message || ""),
        scheduledTime: toDateTimeLocalInput(lead.scheduledAt),
        selectedService: SERVICE_NAMES.includes(lead.service as ServiceId) ? (lead.service as ServiceId) : "Google Ads",
        selectedSender: String(
          lead.sender_id ||
            ACTIVE_SENDERS.find((sender: any) => sender.email === lead.sender_email)?.id ||
            ACTIVE_SENDERS[0]?.id ||
            "",
        ),
        includeSignature: lead.include_signature !== false,
        reportUrl: String(lead.reportUrl || ""),
        reportButtonText: String(lead.reportButtonText || "View short audit note"),
      });
    },
    [setScheduledEdit],
  );

  const saveScheduledEdit = useCallback(async () => {
    if (!scheduledEdit) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return window.alert("Please login again.");

    if (!isEmailPatternValid(scheduledEdit.email.trim())) return window.alert("Please enter a valid recipient email.");
    if (!scheduledEdit.subject.trim()) return window.alert("Subject is required.");
    if (!stripHtml(scheduledEdit.message)) return window.alert("Message body cannot be empty.");
    if (scheduledEdit.reportUrl?.trim() && (!normalizeOptionalUrl(scheduledEdit.reportUrl) || !isSecureReportUrl(scheduledEdit.reportUrl))) {
      return window.alert("Scheduled email report URL must be the secure TrackFlow /r/[token] page.");
    }
    if (!scheduledEdit.scheduledTime) return window.alert("Scheduled time is required.");

    try {
      setScheduledSaving(true);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/trackflow/scheduled-emails", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: scheduledEdit.leadId,
          email: scheduledEdit.email,
          clientName: scheduledEdit.clientName,
          companyName: scheduledEdit.companyName,
          website: scheduledEdit.website,
          businessType: scheduledEdit.businessType,
          subject: scheduledEdit.subject,
          message: scheduledEdit.message,
          scheduledAt: new Date(scheduledEdit.scheduledTime).toISOString(),
          selectedService: scheduledEdit.selectedService,
          senderId: scheduledEdit.selectedSender,
          includeSignature: scheduledEdit.includeSignature,
          reportUrl: scheduledEdit.reportUrl,
          reportButtonText: scheduledEdit.reportButtonText,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Scheduled email update failed");
      setScheduledEdit(null);
      setScheduledStatus(data.message || "Scheduled email updated successfully.");
      await loadScheduledEmails(true);
    } catch (error: any) {
      console.error("Scheduled email update error:", error);
      window.alert(error.message || "Scheduled email update failed.");
    } finally {
      setScheduledSaving(false);
    }
  }, [loadScheduledEmails, scheduledEdit, setScheduledEdit, setScheduledSaving, setScheduledStatus]);

  const cancelScheduledEmail = useCallback(
    async (leadId: string) => {
      const currentUser = auth.currentUser;
      if (!currentUser) return window.alert("Please login again.");
      if (!window.confirm("Cancel this scheduled email? For Brevo-managed schedules, TrackFlow will cancel the Brevo provider schedule first.")) return;

      try {
        setScheduledSaving(true);
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/trackflow/send-email?leadId=${encodeURIComponent(leadId)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Cancel failed");
        setScheduledStatus(data.message || "Scheduled email cancelled.");
        setScheduledEdit(null);
        await loadScheduledEmails(true);
      } catch (error: any) {
        console.error("Scheduled email cancel error:", error);
        window.alert(error.message || "Scheduled email cancel failed.");
      } finally {
        setScheduledSaving(false);
      }
    },
    [loadScheduledEmails, setScheduledEdit, setScheduledSaving, setScheduledStatus],
  );

  const sendScheduledSoon = useCallback(
    async (leadId: string) => {
      const currentUser = auth.currentUser;
      if (!currentUser) return window.alert("Please login again.");
      if (!window.confirm("Send this scheduled email now? For Brevo-managed schedules, TrackFlow will cancel the Brevo schedule first, then send the email now.")) return;

      try {
        setScheduledSaving(true);
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/trackflow/scheduled-emails", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ leadId, action: "send_now" }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Send-soon update failed");
        setScheduledStatus(data.message || "Scheduled email sent now or moved to the immediate send queue.");
        setScheduledEdit(null);
        await loadScheduledEmails(true);
      } catch (error: any) {
        console.error("Scheduled send-soon error:", error);
        window.alert(error.message || "Send-soon update failed.");
      } finally {
        setScheduledSaving(false);
      }
    },
    [loadScheduledEmails, setScheduledEdit, setScheduledSaving, setScheduledStatus],
  );

  return {
    loadScheduledEmails,
    openScheduledEditor,
    saveScheduledEdit,
    cancelScheduledEmail,
    sendScheduledSoon,
  };
}
