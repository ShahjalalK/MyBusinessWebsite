"use client";

import React, { type ReactNode } from "react";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Eye,
  Layers,
  Loader2,
  Mail,
  MousePointer2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Target,
  Timer,
  Trash2,
  UserPlus,
  Zap,
} from "lucide-react";
import {
  Editor,
  EditorProvider,
  Toolbar,
  BtnBold,
  BtnItalic,
  BtnClearFormatting,
} from "react-simple-wysiwyg";

import type { Lead, ServiceId, StepConfig, StepId, TriggerMode, Variant } from "./types";
import { STEPS } from "./constants";
import { countLinksFromHtml, countWordsFromHtml, getFollowupRiskLabel } from "./utils";

const SERVICE_LIST: { id: ServiceId; icon: ReactNode }[] = [
  { id: "Email Signature", icon: <MousePointer2 size={16} /> },
  { id: "Google Ads", icon: <Target size={16} /> },
  { id: "Server Side Tracking", icon: <Database size={16} /> },
];

type AutomationPanelProps = {
  activeFollowupService: ServiceId;
  activeFollowupStep: StepId;
  followupLoading: boolean;
  days: number;
  currentStepData: StepConfig;
  currentVariants: Variant[];
  validCurrentVariants: Variant[];
  currentFollowupLeads: Lead[];
  dailyFollowupLimit: number;
  followupBatchPerRun: number;
  triggerMode: TriggerMode;
  dryRunStatus: string;
  dryRunLoading: boolean;
  dryRunRows: any[];
  showVariantLeads: string | null;
  followupSaving: boolean;
  hasUnsavedChanges: boolean;
  setActiveFollowupService: (service: ServiceId) => void;
  setActiveFollowupStep: (step: StepId) => void;
  setShowVariantLeads: (variantId: string | null) => void;
  loadFollowupConfig: (force?: boolean) => Promise<void> | void;
  updateCurrentStep: (newStepData: StepConfig) => void;
  setDailyFollowupLimit: (value: number) => void;
  setHasUnsavedChanges: (value: boolean) => void;
  setFollowupBatchPerRun: (value: number) => void;
  setTriggerMode: (mode: TriggerMode) => void;
  loadFollowupDryRun: () => Promise<void>;
  removeVariant: (variantId: string) => void;
  appendMergeTag: (variantId: string, tag: "{name}" | "{company}" | "{website}" | "{service}") => void;
  updateVariantContent: (variantId: string, content: string) => void;
  saveFollowupSettings: () => Promise<void>;
};

export default function AutomationPanel({
  activeFollowupService,
  activeFollowupStep,
  followupLoading,
  days,
  currentStepData,
  currentVariants,
  validCurrentVariants,
  currentFollowupLeads,
  dailyFollowupLimit,
  followupBatchPerRun,
  triggerMode,
  dryRunStatus,
  dryRunLoading,
  dryRunRows,
  showVariantLeads,
  followupSaving,
  hasUnsavedChanges,
  setActiveFollowupService,
  setActiveFollowupStep,
  setShowVariantLeads,
  loadFollowupConfig,
  updateCurrentStep,
  setDailyFollowupLimit,
  setHasUnsavedChanges,
  setFollowupBatchPerRun,
  setTriggerMode,
  loadFollowupDryRun,
  removeVariant,
  appendMergeTag,
  updateVariantContent,
  saveFollowupSettings,
}: AutomationPanelProps) {
  return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-[25px] shadow-sm border border-gray-100">
            {SERVICE_LIST.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => {
                  setActiveFollowupService(service.id);
                  setActiveFollowupStep("step1");
                  setShowVariantLeads(null);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${
                  activeFollowupService === service.id ? "bg-black text-white" : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                {service.icon} {service.id}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadFollowupConfig(true)}
            className="flex items-center gap-2 px-5 py-4 bg-white text-gray-500 rounded-[22px] font-black text-xs hover:bg-gray-50 shadow-sm active:scale-95 transition-all border border-gray-100"
          >
            {followupLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} REFRESH CONFIG
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            {STEPS.map((step, idx) => (
              <button
                key={step}
                type="button"
                onClick={() => {
                  setActiveFollowupStep(step);
                  setShowVariantLeads(null);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] tracking-tighter transition-all ${
                  activeFollowupStep === step ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:bg-gray-50"
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
              onChange={(e: any) =>
                updateCurrentStep({
                  ...currentStepData,
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
              value={dailyFollowupLimit}
              onChange={(e: any) => {
                setDailyFollowupLimit(parseInt(e.target.value, 10) || 1);
                setHasUnsavedChanges(true);
              }}
              className="w-16 bg-orange-50 rounded-xl py-1.5 text-center text-sm font-black text-orange-700 outline-none"
            />
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Daily Limit</span>
          </div>

          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-3xl border border-gray-100 shadow-sm">
            <Timer size={18} className="text-purple-500" />
            <input
              type="number"
              min="1"
              max="20"
              value={followupBatchPerRun}
              onChange={(e: any) => {
                setFollowupBatchPerRun(Math.max(1, Math.min(parseInt(e.target.value, 10) || 1, 20)));
                setHasUnsavedChanges(true);
              }}
              className="w-16 bg-purple-50 rounded-xl py-1.5 text-center text-sm font-black text-purple-700 outline-none"
            />
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Per Run</span>
          </div>

          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-3xl border border-gray-100 shadow-sm">
            <ShieldCheck size={18} className="text-green-500" />
            <select
              value={triggerMode}
              onChange={(e: any) => {
                setTriggerMode(e.target.value as TriggerMode);
                setHasUnsavedChanges(true);
              }}
              className="bg-green-50 rounded-xl py-1.5 px-3 text-sm font-black text-green-700 outline-none"
            >
              <option value="open_required">Open/click required</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              updateCurrentStep({
                ...currentStepData,
                variants: [...currentVariants, { id: `V${Date.now()}`, content: "" }],
              })
            }
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-[22px] font-black text-xs hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
          >
            <Plus size={18} /> ADD VARIANT
          </button>
        </div>

        <div className="p-5 rounded-[28px] bg-white border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
            Eligible leads for {activeFollowupService} / {activeFollowupStep.toUpperCase()}:{" "}
            <span className="text-blue-600">{currentFollowupLeads.length}</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-2 font-bold">
            Current mode: Follow up only when the lead opened or clicked. Follow-ups are sent in the existing reply thread and do not add a report button or secure page link automatically.
          </p>
        </div>

        <div className="p-5 rounded-[28px] bg-slate-950 text-white border border-slate-800 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">Server Dry-run Preview</p>
              <p className="text-[11px] text-slate-300 mt-2 font-bold">
                This uses the same due-query path as the cron: nextFollowupStatus=scheduled and nextFollowupAt ≤ now. Make sure the Firestore composite index is deployed.
              </p>
              {dryRunStatus && <p className="text-[10px] text-blue-200 mt-2 font-black uppercase">{dryRunStatus}</p>}
            </div>
            <button
              type="button"
              onClick={loadFollowupDryRun}
              disabled={dryRunLoading}
              className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-black text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {dryRunLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />} Dry-run now
            </button>
          </div>

          {dryRunRows.length > 0 && (
            <div className="mt-4 max-h-56 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900">
              {dryRunRows.slice(0, 12).map((row) => (
                <div key={row.leadId} className="p-3 border-b border-slate-800 last:border-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-black text-white">{row.email}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">{row.company || row.name || "No company"} · {row.service} · F-{row.nextFollowupNumber}</p>
                  </div>
                  <div className="text-[9px] text-emerald-300 font-black uppercase max-w-md truncate">
                    {(row.reasons || []).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {currentVariants.map((variant, index) => {
            const vIndex = validCurrentVariants.findIndex((v) => v.id === variant.id);
            const targetEmails =
              validCurrentVariants.length === 0
                ? currentFollowupLeads
                : vIndex === -1
                  ? []
                  : currentFollowupLeads.filter((_, idx) => idx % validCurrentVariants.length === vIndex);

            return (
              <div key={variant.id} className="bg-white rounded-[40px] shadow-xl border border-gray-50 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                  <span className="text-[10px] font-black px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full uppercase tracking-widest">
                    VARIATION {index + 1}
                  </span>
                  <button type="button" onClick={() => removeVariant(variant.id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="p-6 flex-1 flex flex-col space-y-4">
                  <div className="modern-editor-wrapper rounded-3xl border-2 border-gray-100 overflow-hidden bg-gray-50">
                    <EditorProvider>
                      <Toolbar className="bg-white border-b border-gray-100 p-2 flex gap-1 flex-wrap items-center">
                        <BtnBold /> <BtnItalic /> <BtnClearFormatting />
                        <div className="ml-auto flex gap-1 flex-wrap">
                          <button type="button" onClick={() => appendMergeTag(variant.id, "{name}")} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase">
                            <UserPlus size={12} className="inline mr-1" /> {"{Name}"}
                          </button>
                          <button type="button" onClick={() => appendMergeTag(variant.id, "{company}")} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase">
                            <Building2 size={12} className="inline mr-1" /> {"{Company}"}
                          </button>
                          <button type="button" onClick={() => appendMergeTag(variant.id, "{website}")} className="px-3 py-1 bg-slate-700 text-white rounded-lg text-[9px] font-black uppercase">
                            {"{Website}"}
                          </button>
                          <button type="button" onClick={() => appendMergeTag(variant.id, "{service}")} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase">
                            {"{Service}"}
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

                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase">
                    <span className="px-2 py-1 rounded-lg bg-white text-gray-400 border border-gray-100">
                      {countWordsFromHtml(variant.content)} Words
                    </span>
                    <span className={`px-2 py-1 rounded-lg border ${countLinksFromHtml(variant.content) > 1 ? "bg-red-50 text-red-500 border-red-100" : "bg-white text-gray-400 border-gray-100"}`}>
                      {countLinksFromHtml(variant.content)} Links
                    </span>
                    <span className={`px-2 py-1 rounded-lg border ${getFollowupRiskLabel(variant.content).tone}`}>
                      {getFollowupRiskLabel(variant.content).label}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
                      Compact signature auto-added · no report link
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowVariantLeads(showVariantLeads === variant.id ? null : variant.id)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-[22px] border border-gray-100"
                  >
                    <span className="text-[10px] font-black text-gray-600 uppercase flex items-center gap-2">
                      <Mail size={14} className="text-blue-500" /> Active Leads ({targetEmails.length})
                    </span>
                    {showVariantLeads === variant.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showVariantLeads === variant.id && (
                    <div className="mt-2 max-h-40 overflow-y-auto p-2 bg-white rounded-xl border border-gray-100">
                      {targetEmails.length === 0 ? (
                        <p className="text-center py-4 text-gray-400 text-[10px] font-bold uppercase">No matching leads in this step</p>
                      ) : (
                        targetEmails.map((lead) => (
                          <div key={lead.id} className="flex flex-col p-2 border-b last:border-0 hover:bg-blue-50">
                            <div className="flex justify-between gap-2">
                              <span className="text-[11px] font-bold text-gray-700 truncate">{lead.email || lead.emailLower}</span>
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

        <div className="sticky bottom-8 left-0 w-full max-w-md mx-auto px-6 z-50">
          <button
            type="button"
            onClick={saveFollowupSettings}
            disabled={followupSaving || !hasUnsavedChanges}
            className={`w-full p-5 rounded-[30px] font-black text-base shadow-2xl transition-all flex items-center justify-center gap-3 border-4 border-white ${
              hasUnsavedChanges ? "bg-blue-600 text-white scale-105 shadow-blue-300" : "bg-gray-200 text-gray-400"
            }`}
          >
            {followupSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> SAVE FOLLOW-UP SETTINGS</>}
          </button>
        </div>
      </div>
  );
}
