import type { ServiceId, StepId } from "./types";

export const SERVICE_NAMES: ServiceId[] = ["Email Signature", "Google Ads", "Server Side Tracking"];

export const STEPS: StepId[] = ["step1", "step2", "step3", "step4", "step5"];

// Automation policy: send a maximum of three follow-ups per lead.
// step4/step5 stay in the type/config shape only for old saved data compatibility.
export const MAX_AUTOMATED_FOLLOWUPS = 3;
export const ACTIVE_FOLLOWUP_STEPS: StepId[] = STEPS.slice(0, MAX_AUTOMATED_FOLLOWUPS);

export const ACTIVE_STATUSES = new Set(["sent", "opened", "clicked", "active", "interested"]);

export const OUTREACH_DRAFT_KEY = "trackflowpro_admin_outreach_draft_v1";
