import type { FollowupConfig, Lead, ServiceId, StepConfig, StepId, TriggerMode } from "./types";
import { ACTIVE_FOLLOWUP_STEPS, ACTIVE_STATUSES, MAX_AUTOMATED_FOLLOWUPS, SERVICE_NAMES, STEPS } from "./constants";
import { formatDate, toMillis } from "./utils";

export function makeDefaultStep(): StepConfig {
  return {
    variants: [{ id: "V1", content: "" }],
    delay: 1440,
  };
}

export function makeDefaultConfig(): FollowupConfig {
  return SERVICE_NAMES.reduce((serviceAcc, service) => {
    serviceAcc[service] = STEPS.reduce((stepAcc, step) => {
      stepAcc[step] = makeDefaultStep();
      return stepAcc;
    }, {} as Record<StepId, StepConfig>);
    return serviceAcc;
  }, {} as FollowupConfig);
}

export function mergeWithDefaultConfig(data: any): FollowupConfig {
  const defaults = makeDefaultConfig();

  for (const service of SERVICE_NAMES) {
    for (const step of STEPS) {
      const loadedStep = data?.[service]?.[step];
      if (!loadedStep) continue;

      const variants = Array.isArray(loadedStep.variants)
        ? loadedStep.variants.filter((variant: any) => variant && typeof variant === "object")
        : [];

      defaults[service][step] = {
        variants: variants.length > 0 ? variants : [{ id: "V1", content: "" }],
        delay: Number(loadedStep.delay || 1440),
      };
    }
  }

  return defaults;
}

export function getLastSentMs(lead: Lead) {
  return toMillis(lead.lastFollowUp || lead.sentAt || lead.createdAt);
}

export function getLastEngagedMs(lead: Lead) {
  return Math.max(
    toMillis(lead.lastEngagedAt),
    toMillis(lead.lastClickedAt),
    toMillis(lead.lastOpenedAt || lead.last_opened)
  );
}

export function isHotLead(lead: Lead) {
  return Number(lead.click_count || 0) > 0 || Number(lead.open_count || 0) >= 1 || lead.status === "clicked";
}

export function leadScore(lead: Lead) {
  if (["bounced", "spam", "unsubscribed"].includes(String(lead.status || ""))) return -100;
  if (lead.status === "replied") return 100;

  return (
    Number(lead.open_count || 0) * 10 +
    Number(lead.click_count || 0) * 25 +
    Number(lead.follow_up_count || 0) * 3
  );
}

export function getNextFollowUpStatus(lead: Lead, triggerMode: TriggerMode, config: FollowupConfig) {
  if (lead.status === "replied" || lead.stopAutomation) return null;
  if (["bounced", "spam", "unsubscribed", "finished"].includes(String(lead.status || ""))) return null;

  const storedStatus = String(lead.nextFollowupStatus || "").toLowerCase();
  const storedTime = toMillis(lead.nextFollowupAt);
  const followUpCount = Number(lead.follow_up_count || 0);
  const nextNumber = Number(lead.nextFollowupStep || followUpCount + 1);

  if (followUpCount >= MAX_AUTOMATED_FOLLOWUPS || nextNumber > MAX_AUTOMATED_FOLLOWUPS) {
    return { label: `Finished after F-${MAX_AUTOMATED_FOLLOWUPS}`, color: "text-slate-500", time: null };
  }

  if (storedStatus === "scheduled" && storedTime) {
    const now = Date.now();
    return {
      label: now >= storedTime ? `Ready: F-${nextNumber}` : `Scheduled: F-${nextNumber}`,
      color: now >= storedTime ? "text-green-500" : "text-blue-500",
      time: formatDate(lead.nextFollowupAt),
    };
  }

  if (storedStatus === "processing") {
    return { label: `Processing F-${nextNumber}`, color: "text-amber-600", time: null };
  }

  if (storedStatus === "template_blocked") {
    return { label: "Template/config blocked", color: "text-red-600", time: storedTime ? formatDate(lead.nextFollowupAt) : null };
  }

  if (storedStatus === "failed_final") {
    return { label: "Follow-up failed final", color: "text-red-600", time: null };
  }

  if (storedStatus === "waiting_for_first_open_or_click") {
    return { label: "Waiting for first Open/Click", color: "text-orange-500", time: null };
  }

  if (storedStatus === "waiting_for_new_engagement") {
    return { label: "Waiting for New Open/Click", color: "text-orange-500", time: null };
  }

  if (storedStatus === "blocked") {
    return { label: `Blocked: ${lead.nextFollowupReason || "automation stopped"}`, color: "text-red-600", time: null };
  }

  const service = (lead.service || "Email Signature") as ServiceId;
  const nextStep = (ACTIVE_FOLLOWUP_STEPS[followUpCount] || "step1") as StepId;
  const stepConfig = config?.[service]?.[nextStep];
  const delayMinutes = Number(stepConfig?.delay || 1440);

  const lastSent = getLastSentMs(lead);
  const lastEngaged = getLastEngagedMs(lead);

  if (!lastSent) return { label: "Syncing...", color: "text-gray-400", time: null };

  if (Number(lead.open_count || 0) < 1 && Number(lead.click_count || 0) < 1 && !lastEngaged) {
    return { label: "No auto follow-up: No Open/Click", color: "text-orange-500", time: null };
  }

  if (followUpCount >= 1 && lastEngaged <= lastSent) {
    return { label: "Waiting for New Open/Click", color: "text-orange-500", time: null };
  }

  const scheduledMillis = lastEngaged
    ? lastEngaged + (delayMinutes - 60) * 60_000
    : lastSent + delayMinutes * 60_000;

  if (Date.now() >= scheduledMillis) {
    return { label: `Ready: F-${followUpCount + 1}`, color: "text-green-500", time: formatDate(scheduledMillis) };
  }

  return { label: `F-${followUpCount + 1} Scheduled`, color: "text-blue-500", time: formatDate(scheduledMillis) };
}

export function isLeadEligibleForStep(lead: Lead, service: ServiceId, step: StepId, triggerMode: TriggerMode): boolean {
  if (lead.stopAutomation === true) return false;
  if (!ACTIVE_STATUSES.has(String(lead.status || ""))) return false;
  if (String(lead.service || "").toLowerCase().trim() !== service.toLowerCase().trim()) return false;

  if (!ACTIVE_FOLLOWUP_STEPS.includes(step)) return false;

  const followUpCount = Number(lead.follow_up_count || 0);
  if (followUpCount >= MAX_AUTOMATED_FOLLOWUPS) return false;

  const currentStepIndex = ACTIVE_FOLLOWUP_STEPS.indexOf(step);
  if (currentStepIndex < 0 || followUpCount !== currentStepIndex) return false;

  const lastSent = getLastSentMs(lead);
  const lastEngaged = getLastEngagedMs(lead);
  const hasAnyEngagement = Number(lead.open_count || 0) >= 1 || Number(lead.click_count || 0) >= 1 || lastEngaged > 0 || lead.status === "clicked";

  if (!hasAnyEngagement) return false;

  if (step === "step1") {
    return hasAnyEngagement;
  }

  return lastSent > 0 && lastEngaged > lastSent;
}
