"use client";

import React, { type MouseEvent, type ReactNode } from "react";
import {
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Database,
  Flame,
  Layers,
  Mail,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type { LeadSourceFilter, LeadViewFilter } from "../../stores/useLeadStore";

import type { BulkLeadAction, Lead } from "./types";
import { SERVICE_NAMES } from "./constants";
import { isHotLead } from "./followup-utils";
import { formatDate } from "./utils";

type MonthOption = {
  value: string;
  label: string;
};

type LeadActionHandler = (id: string, event?: MouseEvent) => Promise<void> | void;

type LeadsPanelProps = {
  leads: Lead[];
  filteredLeads: Lead[];
  selectedLeadIds: string[];
  leadView: LeadViewFilter;
  selectedMonth: string;
  leadStatusFilter: string;
  leadSourceFilter: LeadSourceFilter;
  activeService: string;
  searchTerm: string;
  loading: boolean;
  refreshStatus?: string;
  loadingMoreLeads: boolean;
  hasMoreLeads: boolean;
  monthOptions: MonthOption[];
  bulkActionLoading: boolean;
  bulkActionStatus: string;
  setLeadView: (value: LeadViewFilter) => void;
  setSelectedMonth: (value: string) => void;
  setLeadStatusFilter: (value: string) => void;
  setLeadSourceFilter: (value: LeadSourceFilter) => void;
  setActiveService: (value: string) => void;
  setSearchTerm: (value: string) => void;
  setSelectedLeadIds: (value: string[]) => void;
  setSelectedLead: (value: Lead | null) => void;
  refreshLeads: (input: { view: LeadViewFilter; month: string; status: string; source?: LeadSourceFilter }) => Promise<unknown> | unknown;
  fetchMoreLeads: () => Promise<unknown> | unknown;
  applyLeadBulkAction: (action: BulkLeadAction, idsInput?: string[]) => Promise<void>;
  handleMarkAsReplied: LeadActionHandler;
  handleArchiveLead: LeadActionHandler;
  handleRestoreLead: LeadActionHandler;
  handleDelete: LeadActionHandler;
  handlePermanentDeleteLead: LeadActionHandler;
};

function StatCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: "blue" | "green" | "orange" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "bg-green-50 text-green-600"
      : tone === "orange"
        ? "bg-orange-50 text-orange-600"
        : tone === "red"
          ? "bg-red-50 text-red-600"
          : "bg-blue-50 text-blue-600";

  return (
    <div className="bg-white rounded-[30px] border border-gray-100 p-6 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl ${toneClass} flex items-center justify-center mb-5`}>{icon}</div>
      <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

type LeadSourceKind = "manual" | "manual_report_linked" | "sheet_primary" | "sheet_additional" | "test";

function getLeadSourceKind(lead: Lead): LeadSourceKind {
  const source = String(lead.source || "").toLowerCase();
  const sourceOrigin = String(lead.sourceOrigin || "").toLowerCase();
  const sourceRole = String(lead.sourceRole || "").toLowerCase();
  const email = String(lead.emailLower || lead.email || "").toLowerCase();
  const keepUnderSheetAudit = lead.keepUnderSheetAudit === true;

  if (sourceRole === "test" || source.includes("test") || email.includes("test@")) return "test";
  if (sourceRole === "sheet_primary") return "sheet_primary";
  if (sourceRole === "sheet_additional_recipient" || sourceRole === "sheet_additional") return "sheet_additional";
  if (sourceRole === "manual_report_linked") return "manual_report_linked";
  if (keepUnderSheetAudit || sourceOrigin === "sheet") {
    const sheetEmail = String(lead.sheetFinalEmail || lead.parentSheetEmail || "").trim().toLowerCase();
    return sheetEmail && sheetEmail !== email ? "sheet_additional" : "sheet_primary";
  }
  if (source.includes("google_sheet") && lead.keepUnderSheetAudit !== false) return "sheet_primary";
  if (Number(lead.sheetRowNumber || 0) > 0 && lead.keepUnderSheetAudit !== false) return "sheet_primary";
  if (lead.reportToken || lead.reportUrl) return "manual_report_linked";
  return "manual";
}

function isSheetAuditLead(lead: Lead): boolean {
  const kind = getLeadSourceKind(lead);
  return kind === "sheet_primary" || kind === "sheet_additional";
}

function sourceBadgeClass(kind: LeadSourceKind) {
  if (kind === "sheet_primary") return "bg-violet-50 text-violet-600";
  if (kind === "sheet_additional") return "bg-fuchsia-50 text-fuchsia-600";
  if (kind === "manual_report_linked") return "bg-indigo-50 text-indigo-600";
  if (kind === "test") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function sourceBadgeLabel(kind: LeadSourceKind) {
  if (kind === "sheet_primary") return "SHEET PRIMARY";
  if (kind === "sheet_additional") return "SHEET ADDITIONAL";
  if (kind === "manual_report_linked") return "MANUAL + REPORT";
  if (kind === "test") return "TEST";
  return "MANUAL";
}

export default function LeadsPanel({
  leads,
  filteredLeads,
  selectedLeadIds,
  leadView,
  selectedMonth,
  leadStatusFilter,
  leadSourceFilter,
  activeService,
  searchTerm,
  loading,
  refreshStatus,
  loadingMoreLeads,
  hasMoreLeads,
  monthOptions,
  bulkActionLoading,
  bulkActionStatus,
  setLeadView,
  setSelectedMonth,
  setLeadStatusFilter,
  setLeadSourceFilter,
  setActiveService,
  setSearchTerm,
  setSelectedLeadIds,
  setSelectedLead,
  refreshLeads,
  fetchMoreLeads,
  applyLeadBulkAction,
  handleMarkAsReplied,
  handleArchiveLead,
  handleRestoreLead,
  handleDelete,
  handlePermanentDeleteLead,
}: LeadsPanelProps) {
  const allLoadedSelected = filteredLeads.length > 0 && filteredLeads.every((lead) => selectedLeadIds.includes(lead.id));
  const selectedCount = selectedLeadIds.length;
  const selectedLeads = filteredLeads.filter((lead) => selectedLeadIds.includes(lead.id));
  const selectedManualCount = selectedLeads.filter((lead) => !isSheetAuditLead(lead)).length;
  const selectedSheetCount = selectedLeads.filter(isSheetAuditLead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">Lead Management</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Simple hide/restore plus manual-vs-sheet cleanup control</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refreshLeads({ view: leadView, month: selectedMonth, status: leadStatusFilter, source: leadSourceFilter })}
            disabled={loading}
            className="px-4 py-3 rounded-2xl bg-black text-white text-[10px] font-black uppercase disabled:bg-gray-300 flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {loading ? "Refreshing..." : "Refresh latest 20"}
          </button>
          <button
            type="button"
            onClick={fetchMoreLeads}
            disabled={loadingMoreLeads || !hasMoreLeads}
            className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-2"
          >
            <ChevronDown size={14} /> {hasMoreLeads ? (loadingMoreLeads ? "Loading..." : "See more 20") : "All loaded"}
          </button>
        </div>
      </div>

      {refreshStatus ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-700">
          {refreshStatus}
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Loaded" value={leads.length} icon={<Mail size={22} />} />
        <StatCard label="Filtered" value={filteredLeads.length} icon={<Database size={22} />} tone="blue" />
        <StatCard label="Selected" value={selectedCount} icon={<CheckCircle2 size={22} />} tone="green" />
        <StatCard label="View" value={String(leadView).toUpperCase()} icon={<Layers size={22} />} tone="orange" />
      </div>

      <div className="bg-white rounded-[28px] border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <select value={leadView} onChange={(event) => setLeadView(event.target.value as LeadViewFilter)} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black outline-none uppercase">
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="trash">Trash</option>
            <option value="all">All</option>
          </select>
          <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black outline-none uppercase">
            <option value="All">All Months</option>
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={leadStatusFilter} onChange={(event) => setLeadStatusFilter(event.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black outline-none uppercase">
            <option value="All">All Status</option>
            {["scheduled", "sent", "opened", "clicked", "replied", "bounced", "spam", "unsubscribed", "cancelled", "finished"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select value={leadSourceFilter} onChange={(event) => setLeadSourceFilter(event.target.value as LeadSourceFilter)} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black outline-none uppercase">
            <option value="all">All Sources</option>
            <option value="manual">Manual Leads</option>
            <option value="manual_report_linked">Manual + Report</option>
            <option value="sheet">All Sheet Audit</option>
            <option value="sheet_primary">Sheet Primary</option>
            <option value="sheet_additional">Sheet Additional</option>
            <option value="test">Test Leads</option>
          </select>
          <select value={activeService} onChange={(event) => setActiveService(event.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black outline-none uppercase">
            <option value="All">All Services</option>
            {SERVICE_NAMES.map((service) => <option key={service} value={service}>{service}</option>)}
          </select>
          <input type="text" placeholder="Search email/company..." className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black outline-none" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-gray-50">
          <div>
            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Bulk actions</p>
            <p className="text-[10px] font-bold text-gray-400 mt-1">
              {selectedCount} selected. Hide removes leads from Active without deleting history. Restore brings hidden/trash leads back. Manual/test leads can be deleted here; sheet audit leads must use Report Cleanup.
              {selectedSheetCount ? ` ${selectedSheetCount} sheet audit lead(s) selected.` : ""}
              {bulkActionStatus ? ` ${bulkActionStatus}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={!selectedCount || bulkActionLoading} onClick={() => applyLeadBulkAction("archive")} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-[9px] font-black uppercase disabled:opacity-40">Hide from Active</button>
            <button disabled={!selectedCount || bulkActionLoading} onClick={() => applyLeadBulkAction("restore")} className="px-4 py-2 rounded-xl bg-green-50 text-green-600 text-[9px] font-black uppercase disabled:opacity-40">Show in Active</button>
            <button disabled={!selectedManualCount || bulkActionLoading} onClick={() => applyLeadBulkAction("delete_manual_keep_memory")} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-[9px] font-black uppercase disabled:opacity-40">Delete Manual — Keep Memory</button>
            <button disabled={!selectedManualCount || bulkActionLoading} onClick={() => applyLeadBulkAction("delete_manual_no_footprint")} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-[9px] font-black uppercase disabled:opacity-40">Delete Manual — No Footprint</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[30px] shadow-xl border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <input
                    type="checkbox"
                    checked={allLoadedSelected}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedLeadIds(Array.from(new Set([...selectedLeadIds, ...filteredLeads.map((lead) => lead.id)])));
                      } else {
                        const filteredIds = new Set(filteredLeads.map((lead) => lead.id));
                        setSelectedLeadIds(selectedLeadIds.filter((id) => !filteredIds.has(id)));
                      }
                    }}
                  />
                </th>
                <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Lead Information</th>
                <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Sender</th>
                <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Engagement</th>
                <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filteredLeads.map((lead) => {
                const checked = selectedLeadIds.includes(lead.id);
                const sourceKind = getLeadSourceKind(lead);
                const sheetAuditLead = sourceKind === "sheet_primary" || sourceKind === "sheet_additional";
                return (
                  <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover:bg-blue-50/20 cursor-pointer group transition-all">
                    <td className="p-5" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          if (event.target.checked) setSelectedLeadIds(Array.from(new Set([...selectedLeadIds, lead.id])));
                          else setSelectedLeadIds(selectedLeadIds.filter((id) => id !== lead.id));
                        }}
                      />
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-gray-900 uppercase italic tracking-tighter group-hover:text-blue-600 leading-none">{lead.name || "Unknown"}</span>
                          {isHotLead(lead) && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[8px] font-black flex items-center gap-1"><Flame size={10} /> HOT</span>}
                          <span className={`${sourceBadgeClass(sourceKind)} px-2 py-0.5 rounded text-[8px] font-black`}>{sourceBadgeLabel(sourceKind)}</span>
                          {lead.reportToken && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[8px] font-black">REPORT</span>}
                          {lead.archived === true && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black">HIDDEN</span>}
                          {lead.deleted === true && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[8px] font-black">TRASH</span>}
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{lead.company_name || "No Company"}</span>
                        <span className="text-[10px] text-gray-300 font-bold">{lead.email || lead.emailLower}</span>
                      </div>
                    </td>

                    <td className="p-5">
                      <p className="text-[10px] text-gray-600 font-black">{lead.sender_name || "Sender"}</p>
                      <p className="text-[9px] text-gray-400 font-bold">{lead.sender_email || "N/A"}</p>
                    </td>

                    <td className="p-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${lead.status === "replied" ? "bg-green-100 text-green-600" : "bg-blue-50 text-blue-500"}`}>{lead.status || "unknown"}</span>
                        <span className="text-[9px] font-bold text-gray-400 italic">{formatDate(lead.createdAt)}</span>
                      </div>
                    </td>

                    <td className="p-5 text-center">
                      <div className="inline-flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                        <div><span className="text-xs font-black text-gray-900">{lead.open_count || 0}</span><span className="block text-[8px] font-black text-gray-400 uppercase">Open</span></div>
                        <div><span className="text-xs font-black text-gray-900">{lead.click_count || 0}</span><span className="block text-[8px] font-black text-gray-400 uppercase">Click</span></div>
                      </div>
                    </td>

                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                        {lead.status !== "replied" && lead.deleted !== true && (
                          <button onClick={(event) => handleMarkAsReplied(lead.id, event)} className="p-3 text-gray-300 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all" title="Mark as Replied"><CheckCircle size={16} /></button>
                        )}
                        {lead.archived !== true && lead.deleted !== true && (
                          <button onClick={(event) => handleArchiveLead(lead.id, event)} className="p-3 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Hide from Active"><Database size={16} /></button>
                        )}
                        {(lead.archived === true || lead.deleted === true) && (
                          <button onClick={(event) => handleRestoreLead(lead.id, event)} className="p-3 text-gray-300 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all" title="Show in Active"><RefreshCw size={16} /></button>
                        )}
                        {sheetAuditLead ? (
                          <span className="rounded-xl bg-violet-50 px-3 py-2 text-[8px] font-black uppercase text-violet-600" title="Sheet audit leads are deleted from Report Cleanup by report token.">Use Cleanup</span>
                        ) : (
                          <>
                            <button onClick={(event) => handleDelete(lead.id, event)} className="px-3 py-2 rounded-xl bg-amber-50 text-[8px] font-black uppercase text-amber-700 hover:bg-amber-100" title="Delete manual/test lead and keep tiny contact memory">Keep Memory</button>
                            <button onClick={(event) => handlePermanentDeleteLead(lead.id, event)} className="px-3 py-2 rounded-xl bg-red-50 text-[8px] font-black uppercase text-red-600 hover:bg-red-100" title="Delete manual/test lead with no footprint"><X size={13} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-xs font-black text-gray-400 uppercase">No leads found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-5 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase">{filteredLeads.length} filtered from {leads.length} cached lead(s)</p>
          <button type="button" onClick={fetchMoreLeads} disabled={loadingMoreLeads || !hasMoreLeads} className="px-5 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase disabled:bg-gray-200 disabled:text-gray-400 flex items-center gap-2">
            <ChevronDown size={14} /> {hasMoreLeads ? (loadingMoreLeads ? "Loading more..." : "See more leads") : "No more leads"}
          </button>
        </div>
      </div>
    </div>
  );
}
