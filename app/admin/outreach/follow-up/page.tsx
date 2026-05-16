"use client";

import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../../../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Mail,
  ChevronDown,
  ChevronUp,
  Target,
  MousePointer2,
  Database,
  UserPlus,
  Layers,
  Clock,
  Building2,
  Zap,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  Editor,
  EditorProvider,
  Toolbar,
  BtnBold,
  BtnItalic,
  BtnUnderline,
  BtnStrikeThrough,
  BtnLink,
  BtnNumberedList,
  BtnBulletList,
  BtnClearFormatting,
} from "react-simple-wysiwyg";
import AdminGuard from "@/app/components/AdminGuard";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";

const SERVICES = [
  { id: "Email Signature", icon: <MousePointer2 size={18} /> },
  { id: "Google Ads", icon: <Target size={18} /> },
  { id: "Server Side Tracking", icon: <Database size={18} /> },
] as const;

const STEPS = ["step1", "step2", "step3", "step4", "step5"] as const;

type ServiceId = (typeof SERVICES)[number]["id"];
type StepId = (typeof STEPS)[number];
type TriggerMode = "no_reply_after_delay" | "open_required";

type Variant = {
  id: string;
  content: string;
};

type StepConfig = {
  variants: Variant[];
  delay: number; // minutes
};

type FollowupConfig = Record<ServiceId, Record<StepId, StepConfig>>;

type Lead = {
  id: string;
  email?: string;
  emailLower?: string;
  name?: string;
  company_name?: string;
  website?: string;
  service?: string;
  status?: string;
  stopAutomation?: boolean;
  follow_up_count?: number;
  open_count?: number;
  click_count?: number;
  sentAt?: any;
  lastFollowUp?: any;
  lastOpenedAt?: any;
  last_opened?: any;
  lastClickedAt?: any;
  lastEngagedAt?: any;
  [key: string]: any;
};

const ACTIVE_STATUSES = new Set(["sent", "opened", "clicked", "active", "interested"]);

function makeDefaultStep(): StepConfig {
  return {
    variants: [{ id: "V1", content: "" }],
    delay: 1440,
  };
}

function makeDefaultConfig(): FollowupConfig {
  return SERVICES.reduce((serviceAcc, service) => {
    serviceAcc[service.id] = STEPS.reduce((stepAcc, step) => {
      stepAcc[step] = makeDefaultStep();
      return stepAcc;
    }, {} as Record<StepId, StepConfig>);
    return serviceAcc;
  }, {} as FollowupConfig);
}

function mergeWithDefaultConfig(data: any): FollowupConfig {
  const defaults = makeDefaultConfig();

  for (const service of SERVICES) {
    for (const step of STEPS) {
      const loadedStep = data?.[service.id]?.[step];
      if (!loadedStep) continue;

      const variants = Array.isArray(loadedStep.variants)
        ? loadedStep.variants.filter((variant: any) => variant && typeof variant === "object")
        : [];

      defaults[service.id][step] = {
        variants: variants.length > 0 ? variants : [{ id: "V1", content: "" }],
        delay: Number(loadedStep.delay || 1440),
      };
    }
  }

  return defaults;
}

function getMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function stripHtml(html: string): string {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLeadService(lead: Lead): string {
  return String(lead.service || "").toLowerCase().trim();
}

function getStepIndex(step: StepId): number {
  return STEPS.indexOf(step);
}

function getLastSentMs(lead: Lead): number {
  return getMillis(lead.lastFollowUp || lead.sentAt || lead.createdAt);
}

function getLastEngagedMs(lead: Lead): number {
  return Math.max(
    getMillis(lead.lastEngagedAt),
    getMillis(lead.lastClickedAt),
    getMillis(lead.lastOpenedAt || lead.last_opened)
  );
}

function isLeadEligibleForStep(lead: Lead, service: ServiceId, step: StepId, triggerMode: TriggerMode): boolean {
  if (lead.stopAutomation === true) return false;
  if (!ACTIVE_STATUSES.has(String(lead.status || ""))) return false;
  if (getLeadService(lead) !== service.toLowerCase().trim()) return false;

  const followUpCount = Number(lead.follow_up_count || 0);
  const currentStepIndex = getStepIndex(step);

  if (followUpCount !== currentStepIndex) return false;

  if (triggerMode === "no_reply_after_delay") {
    return getLastSentMs(lead) > 0;
  }

  const openCount = Number(lead.open_count || 0);
  const clickCount = Number(lead.click_count || 0);

  if (step === "step1") {
    return openCount >= 1 || clickCount >= 1 || String(lead.status) === "clicked";
  }

  const lastSent = getLastSentMs(lead);
  const lastEngaged = getLastEngagedMs(lead);

  if (lastSent === 0) return false;
  return lastEngaged > lastSent;
}

export default function FollowUpAutomationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<ServiceId>("Email Signature");
  const [activeStep, setActiveStep] = useState<StepId>("step1");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [triggerMode, setTriggerMode] = useState<TriggerMode>("no_reply_after_delay");
  const [categoryVariants, setCategoryVariants] = useState<FollowupConfig>(() => makeDefaultConfig());
  const [showEmails, setShowEmails] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const configDoc = await getDoc(doc(db, "automation_settings", "followup_config"));
      if (configDoc.exists()) {
        const data = configDoc.data();
        setCategoryVariants(mergeWithDefaultConfig(data));
        setDailyLimit(Number(data.daily_followup_limit || 50));
        setTriggerMode((data.followup_trigger_mode as TriggerMode) || "no_reply_after_delay");
      } else {
        setCategoryVariants(makeDefaultConfig());
        setDailyLimit(50);
        setTriggerMode("no_reply_after_delay");
      }

      const q = query(collection(db, "outreach_leads"));
      const snapshot = await getDocs(q);

      const allFetchedLeads = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as any),
      })) as Lead[];

      const filtered = allFetchedLeads.filter((lead) => {
        if (lead.stopAutomation === true) return false;
        return ACTIVE_STATUSES.has(String(lead.status || ""));
      });

      setLeads(filtered);
    } catch (err) {
      console.error("Error loading follow-up data:", err);
      alert("Could not load follow-up settings. Check console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentTabSettings = categoryVariants[activeTab] || makeDefaultConfig()[activeTab];
  const currentCategoryData = currentTabSettings[activeStep] || makeDefaultStep();
  const currentVariants = currentCategoryData.variants || [];
  const days = Math.max(1, Math.floor((currentCategoryData.delay || 1440) / 1440));

  const currentCategoryLeads = useMemo(() => {
    return leads.filter((lead) => isLeadEligibleForStep(lead, activeTab, activeStep, triggerMode));
  }, [activeTab, activeStep, leads, triggerMode]);

  const validCurrentVariants = useMemo(() => {
    return currentVariants.filter((variant: Variant) => stripHtml(variant.content));
  }, [currentVariants]);

  const updateGlobalState = (newStepData: StepConfig) => {
    setCategoryVariants((prev) => ({
      ...prev,
      [activeTab]: {
        ...(prev[activeTab] || {}),
        [activeStep]: newStepData,
      },
    }));

    setHasUnsavedChanges(true);
  };

  const updateVariantContent = (variantId: string, content: string) => {
    updateGlobalState({
      ...currentCategoryData,
      variants: currentVariants.map((variant) =>
        variant.id === variantId ? { ...variant, content } : variant
      ),
    });
  };

  const appendMergeTag = (variantId: string, tag: "{name}" | "{company}" | "{website}") => {
    updateGlobalState({
      ...currentCategoryData,
      variants: currentVariants.map((variant) =>
        variant.id === variantId
          ? { ...variant, content: `${variant.content || ""} ${tag}` }
          : variant
      ),
    });
  };

  const addVariant = () => {
    updateGlobalState({
      ...currentCategoryData,
      variants: [
        ...currentVariants,
        {
          id: `V${Date.now()}`,
          content: "",
        },
      ],
    });
  };

  const removeVariant = (variantId: string) => {
    const nextVariants = currentVariants.filter((variant) => variant.id !== variantId);

    updateGlobalState({
      ...currentCategoryData,
      variants: nextVariants.length > 0 ? nextVariants : [{ id: "V1", content: "" }],
    });
  };

  const handleSaveSettings = async () => {
    const finalConfig = {
      ...categoryVariants,
      daily_followup_limit: Number(dailyLimit || 50),
      followup_trigger_mode: triggerMode,
      updatedAt: serverTimestamp(),
    };

    const currentStepVariants = currentVariants.filter((variant) => stripHtml(variant.content));
    if (currentStepVariants.length === 0) {
      return alert("Please add content to at least one variant before saving this step.");
    }

    setSaving(true);

    try {
      await setDoc(doc(db, "automation_settings", "followup_config"), finalConfig, { merge: true });

      setHasUnsavedChanges(false);
      alert(`✅ Follow-up settings saved for ${activeTab} ${activeStep.toUpperCase()}`);
    } catch (error) {
      console.error(error);
      alert("Error saving follow-up settings!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFBFF]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <AdminGuard>
        <div className="max-w-7xl mx-auto p-6 lg:p-10 bg-[#FAFBFF] min-h-screen pb-40">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-[25px] shadow-sm border border-gray-100">
              {SERVICES.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(service.id);
                    setActiveStep("step1");
                    setShowEmails(null);
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${
                    activeTab === service.id ? "bg-black text-white" : "text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {service.icon} {service.id}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadData}
                className="flex items-center gap-2 px-5 py-4 bg-white text-gray-500 rounded-[22px] font-black text-xs hover:bg-gray-50 shadow-sm active:scale-95 transition-all border border-gray-100"
              >
                <RefreshCw size={16} /> REFRESH
              </button>

              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-[22px] font-black text-xs hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
              >
                <Plus size={18} /> ADD VARIANT
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
              {STEPS.map((step, idx) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    setActiveStep(step);
                    setShowEmails(null);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] tracking-tighter transition-all ${
                    activeStep === step ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <Layers size={14} /> F-{idx + 1}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-3xl border border-gray-100 shadow-sm">
              <Clock size={18} className="text-blue-500" />
              <input
                type="number"
                min="1"
                value={days}
                onChange={(e) =>
                  updateGlobalState({
                    ...currentCategoryData,
                    delay: (parseInt(e.target.value, 10) || 1) * 1440,
                  })
                }
                className="w-12 bg-blue-50 rounded-xl py-1.5 text-center text-sm font-black text-blue-700 outline-none"
              />
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Days Gap</span>
            </div>

            <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-3xl border border-gray-100 shadow-sm">
              <Zap size={18} className="text-orange-500" />
              <input
                type="number"
                min="1"
                value={dailyLimit}
                onChange={(e) => {
                  setDailyLimit(parseInt(e.target.value, 10) || 1);
                  setHasUnsavedChanges(true);
                }}
                className="w-16 bg-orange-50 rounded-xl py-1.5 text-center text-sm font-black text-orange-700 outline-none"
              />
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Daily Limit</span>
            </div>

            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-3xl border border-gray-100 shadow-sm">
              <ShieldCheck size={18} className="text-green-500" />
              <select
                value={triggerMode}
                onChange={(e) => {
                  setTriggerMode(e.target.value as TriggerMode);
                  setHasUnsavedChanges(true);
                }}
                className="bg-green-50 rounded-xl py-1.5 px-3 text-sm font-black text-green-700 outline-none"
              >
                <option value="no_reply_after_delay">No reply after delay</option>
                <option value="open_required">Open/click required</option>
              </select>
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Trigger</span>
            </div>
          </div>

          <div className="mb-6 p-5 rounded-[28px] bg-white border border-gray-100 shadow-sm">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
              Eligible leads for {activeTab} / {activeStep.toUpperCase()}:{" "}
              <span className="text-blue-600">{currentCategoryLeads.length}</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-2 font-bold">
              Current mode:{" "}
              {triggerMode === "no_reply_after_delay"
                ? "Follow up after selected delay if no reply/unsubscribe/bounce."
                : "Follow up only when the lead opened or clicked after the previous send."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {currentVariants.map((variant: Variant, index: number) => {
              const vIndex = validCurrentVariants.findIndex((v) => v.id === variant.id);
              const targetEmails =
                vIndex === -1 || validCurrentVariants.length === 0
                  ? []
                  : currentCategoryLeads.filter((_, idx) => idx % validCurrentVariants.length === vIndex);

              return (
                <div
                  key={variant.id}
                  className="bg-white rounded-[40px] shadow-xl border border-gray-50 flex flex-col overflow-hidden"
                >
                  <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <span className="text-[10px] font-black px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full uppercase tracking-widest">
                      VARIATION {index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    <div className="modern-editor-wrapper rounded-3xl border-2 border-gray-100 overflow-hidden bg-gray-50">
                      <EditorProvider>
                        <Toolbar className="bg-white border-b border-gray-100 p-2 flex gap-1 flex-wrap items-center">
                          <BtnBold /> <BtnItalic /> <BtnUnderline /> <BtnStrikeThrough />
                          <span className="w-px h-6 bg-gray-200 mx-1"></span>
                          <BtnNumberedList /> <BtnBulletList /> <BtnLink /> <BtnClearFormatting />

                          <div className="ml-auto flex gap-1">
                            <button
                              type="button"
                              onClick={() => appendMergeTag(variant.id, "{name}")}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase"
                            >
                              <UserPlus size={12} className="inline mr-1" /> {"{Name}"}
                            </button>
                            <button
                              type="button"
                              onClick={() => appendMergeTag(variant.id, "{company}")}
                              className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase"
                            >
                              <Building2 size={12} className="inline mr-1" /> {"{Company}"}
                            </button>
                            <button
                              type="button"
                              onClick={() => appendMergeTag(variant.id, "{website}")}
                              className="px-3 py-1 bg-slate-700 text-white rounded-lg text-[9px] font-black uppercase"
                            >
                              {"{Website}"}
                            </button>
                          </div>
                        </Toolbar>

                        <Editor
                          value={variant.content || ""}
                          onChange={(e: any) => updateVariantContent(variant.id, e.target.value)}
                          className="min-h-[250px] p-5 outline-none text-gray-800 email-editor-content"
                        />
                      </EditorProvider>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowEmails(showEmails === variant.id ? null : variant.id)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-[22px] border border-gray-100"
                    >
                      <span className="text-[10px] font-black text-gray-600 uppercase flex items-center gap-2">
                        <Mail size={14} className="text-blue-500" /> Active Leads ({targetEmails.length})
                      </span>
                      {showEmails === variant.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showEmails === variant.id && (
                      <div className="mt-2 max-h-40 overflow-y-auto p-2 bg-white rounded-xl border border-gray-100">
                        {targetEmails.length === 0 ? (
                          <p className="text-center py-4 text-gray-400 text-[10px] font-bold uppercase">
                            No matching leads in this step
                          </p>
                        ) : (
                          targetEmails.map((lead) => (
                            <div key={lead.id} className="flex flex-col p-2 border-b last:border-0 hover:bg-blue-50">
                              <div className="flex justify-between gap-2">
                                <span className="text-[11px] font-bold text-gray-700 truncate">
                                  {lead.email || lead.emailLower}
                                </span>
                                <span className="text-[9px] text-blue-500 font-black whitespace-nowrap">
                                  O: {lead.open_count || 0} / C: {lead.click_count || 0}
                                </span>
                              </div>
                              <span className="text-[8px] text-gray-400 font-bold uppercase mt-1">
                                Status: {lead.status} | Step: {lead.follow_up_count || 0}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving || !hasUnsavedChanges}
              className={`w-full p-5 rounded-[30px] font-black text-base shadow-2xl transition-all flex items-center justify-center gap-3 border-4 border-white ${
                hasUnsavedChanges ? "bg-blue-600 text-white scale-105 shadow-blue-300" : "bg-gray-200 text-gray-400"
              }`}
            >
              {saving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Save size={20} /> SAVE FOLLOW-UP SETTINGS
                </>
              )}
            </button>
          </div>

          <style jsx global>{`
            .rsw-editor {
              border: none !important;
              background: transparent !important;
            }
            .email-editor-content {
              color: #1e293b !important;
              line-height: 1.6 !important;
              font-size: 14px;
              font-weight: 500;
            }
          `}</style>
        </div>
      </AdminGuard>
      <Footer />
    </>
  );
}
