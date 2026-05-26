import type { ServiceId, StepId } from "./types";

export const SERVICE_NAMES: ServiceId[] = ["Email Signature", "Google Ads", "Server Side Tracking"];

export const STEPS: StepId[] = ["step1", "step2", "step3", "step4", "step5"];

export const ACTIVE_STATUSES = new Set(["sent", "opened", "clicked", "active", "interested"]);

export const OUTREACH_DRAFT_KEY = "trackflowpro_admin_outreach_draft_v1";
