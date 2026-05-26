import { useCallback } from "react";
import { auth } from "@/lib/firebase";
import { ACTIVE_SENDERS } from "@/lib/senders";
import type { Lead, ScheduledEditState, ServiceId } from "../types";
import { SERVICE_NAMES } from "../constants";
import { isEmailPatternValid, normalizeOptionalUrl, stripHtml, toDateTimeLocalInput } from "../utils";
import { isSecureReportUrl } from "../sheet-readiness";

type SetState<T> = (value: T | ((current: T) => T)) => void;

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

      if (!force && scheduledLoadedAt && scheduledEmails.length >= 0) {
        setScheduledStatus(`Cached ${scheduledEmails.length} scheduled email(s). Use refresh if needed.`);
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
        setScheduledEmails(Array.isArray(data.rows) ? data.rows : []);
        setScheduledLoadedAt(Date.now());
        setScheduledStatus(`Loaded ${data.count || 0} scheduled email(s).`);
      } catch (error: any) {
        console.error("Scheduled emails load error:", error);
        setScheduledEmails([]);
        setScheduledStatus(`Scheduled email load failed: ${error.message || "Unknown error"}`);
      } finally {
        setScheduledLoading(false);
      }
    },
    [scheduledEmails.length, scheduledLoadedAt, setScheduledEmails, setScheduledLoadedAt, setScheduledLoading, setScheduledStatus],
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
      setScheduledStatus("Scheduled email updated successfully.");
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
      if (!window.confirm("Cancel this scheduled email? It will not be sent.")) return;

      try {
        setScheduledSaving(true);
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/trackflow/send-email?leadId=${encodeURIComponent(leadId)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Cancel failed");
        setScheduledStatus("Scheduled email cancelled.");
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
      if (!window.confirm("Move this email to the immediate send queue? It will send on the next scheduled-initials cron run.")) return;

      try {
        setScheduledSaving(true);
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/trackflow/scheduled-emails", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ leadId, action: "send_soon" }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Send-soon update failed");
        setScheduledStatus("Email moved to immediate send queue. Scheduled-initials cron will send it on the next run.");
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
