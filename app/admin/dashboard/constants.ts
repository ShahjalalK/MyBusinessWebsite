import type { ServiceId, StepId } from "./types";

export const SERVICE_NAMES: ServiceId[] = ["Email Signature", "Google Ads", "Server Side Tracking"];

export const STEPS: StepId[] = ["step1", "step2", "step3", "step4", "step5"];

// Automation policy: send a maximum of three follow-ups per lead.
// step4/step5 stay in the type/config shape only for old saved data compatibility.
export const MAX_AUTOMATED_FOLLOWUPS = 3;
export const ACTIVE_FOLLOWUP_STEPS: StepId[] = STEPS.slice(0, MAX_AUTOMATED_FOLLOWUPS);

export const ACTIVE_STATUSES = new Set(["sent", "opened", "clicked", "active", "interested"]);

export const OUTREACH_DRAFT_KEY = "trackflowpro_admin_outreach_draft_v1";


export const GMAIL_OUTREACH_STAGES = [
  "ready",
  "initial_sent",
  "followup_1",
  "followup_2",
  "followup_3",
  "followup_4",
  "closed",
  "do_not_contact",
] as const;

export const GMAIL_OUTREACH_STAGE_LABELS: Record<(typeof GMAIL_OUTREACH_STAGES)[number], string> = {
  ready: "Ready",
  initial_sent: "Initial Sent",
  followup_1: "Follow-up 1",
  followup_2: "Follow-up 2",
  followup_3: "Follow-up 3",
  followup_4: "Follow-up 4",
  closed: "Closed",
  do_not_contact: "Do Not Contact",
};
