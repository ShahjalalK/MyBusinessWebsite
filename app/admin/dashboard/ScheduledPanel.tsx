"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import {
  Editor,
  EditorProvider,
  Toolbar,
  BtnBold,
  BtnItalic,
  BtnUnderline,
  BtnNumberedList,
  BtnBulletList,
  BtnClearFormatting,
} from "react-simple-wysiwyg";
import { ACTIVE_SENDERS } from "../../../lib/senders";

import type { Lead, ScheduledEditState, ServiceId } from "./types";
import { SERVICE_NAMES } from "./constants";
import { formatDate, stripHtml } from "./utils";

type ScheduledPanelProps = {
  scheduledEmails: Lead[];
  scheduledStatus: string;
  scheduledLoading: boolean;
  scheduledEdit: ScheduledEditState | null;
  scheduledSaving: boolean;
  minDateTime: string;
  setScheduledEdit: (value: ScheduledEditState | null) => void;
  loadScheduledEmails: (force?: boolean) => Promise<void>;
  openScheduledEditor: (lead: Lead) => void;
  sendScheduledSoon: (leadId: string) => Promise<void>;
  cancelScheduledEmail: (leadId: string) => Promise<void>;
  saveScheduledEdit: () => Promise<void>;
};

function isBrevoScheduledLead(lead: Lead) {
  return lead.brevoScheduled === true || String(lead.scheduledProvider || "").toLowerCase() === "brevo";
}

export default function ScheduledPanel({
  scheduledEmails,
  scheduledStatus,
  scheduledLoading,
  scheduledEdit,
  scheduledSaving,
  minDateTime,
  setScheduledEdit,
  loadScheduledEmails,
  openScheduledEditor,
  sendScheduledSoon,
  cancelScheduledEmail,
  saveScheduledEdit,
}: ScheduledPanelProps) {
  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-5 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} /> Scheduled Email Manager
          </p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter mt-1">Edit Scheduled Initial Emails</h2>
          <p className="text-xs font-bold text-gray-400 mt-1 max-w-2xl">
            New initial schedules are delivered by Brevo at the selected time. Future scheduled rows stay editable here; sent rows are hidden from this tab.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadScheduledEmails(true)}
          disabled={scheduledLoading}
          className="px-5 py-3 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:bg-gray-300"
        >
          {scheduledLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>

      {scheduledStatus && (
        <div className="bg-blue-50 border border-blue-100 rounded-[24px] p-4 text-blue-700 text-xs font-black uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 size={15} /> {scheduledStatus}
        </div>
      )}

      <div className="bg-white rounded-[35px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="max-w-full overflow-x-auto overscroll-x-contain touch-pan-x">
          <table className="w-full text-left min-w-[980px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Send Time", "Recipient", "Subject", "Service", "Sender", "Actions"].map((header) => (
                  <th key={header} className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {scheduledEmails.map((lead) => {
                const brevoManaged = isBrevoScheduledLead(lead);
                return (
                  <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4">
                      <p className="text-xs font-black text-gray-900">{formatDate(lead.scheduledAt)}</p>
                      <p className="text-[10px] font-bold text-blue-500 uppercase">
                        {brevoManaged ? "Brevo scheduled" : lead.status || "scheduled"}
                      </p>
                      {brevoManaged ? (
                        <p className="text-[9px] font-black text-emerald-600 uppercase">
                          Provider delivery · not cron batch
                        </p>
                      ) : null}
                    </td>
                  <td className="p-4">
                    <p className="text-xs font-black text-gray-900">{lead.name || lead.company_name || "Unnamed"}</p>
                    <p className="text-[10px] font-bold text-gray-400">{lead.email || lead.emailLower}</p>
                  </td>
                  <td className="p-4 max-w-sm">
                    <p className="text-xs font-black text-gray-900 truncate">{lead.subject || "No subject"}</p>
                    <p className="text-[10px] font-bold text-gray-400 truncate">{stripHtml(lead.message || "") || "No body"}</p>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase">{lead.service || "N/A"}</span>
                  </td>
                  <td className="p-4">
                    <p className="text-[10px] font-black text-gray-700">{lead.sender_name || "Sender"}</p>
                    <p className="text-[10px] font-bold text-gray-400">{lead.sender_email || "N/A"}</p>
                  </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openScheduledEditor(lead)}
                          className="px-3 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => sendScheduledSoon(lead.id)}
                          className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase"
                        >
                          Send Now
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelScheduledEmail(lead.id)}
                          className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase"
                        >
                          Cancel
                        </button>
                      </div>
                      {brevoManaged ? (
                        <p className="mt-2 text-[9px] font-bold leading-relaxed text-emerald-600">
                          Brevo managed: edit safely cancels the old provider schedule and creates a new one.
                        </p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}

              {scheduledEmails.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Clock size={26} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-black text-gray-400 uppercase">No scheduled emails found.</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1">Schedule one from the Send Email tab and it will appear here until it is sent.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {scheduledEdit && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-40" onClick={() => setScheduledEdit(null)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Edit Scheduled Email</p>
                  <h3 className="text-xl font-black text-gray-900 tracking-tighter">{scheduledEdit.email}</h3>
                </div>
                <button type="button" onClick={() => setScheduledEdit(null)} className="p-3 rounded-2xl bg-gray-50 text-gray-500">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Recipient email" value={scheduledEdit.email} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, email: e.target.value })} />
                  <input className="p-4 bg-blue-50 text-blue-700 rounded-2xl outline-none font-bold text-sm" type="datetime-local" min={minDateTime} value={scheduledEdit.scheduledTime} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, scheduledTime: e.target.value })} />
                  <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Client name" value={scheduledEdit.clientName} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, clientName: e.target.value })} />
                  <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Company name" value={scheduledEdit.companyName} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, companyName: e.target.value })} />
                  <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Website" value={scheduledEdit.website} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, website: e.target.value })} />
                  <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Business type" value={scheduledEdit.businessType} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, businessType: e.target.value })} />
                  <select className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={scheduledEdit.selectedService} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, selectedService: e.target.value as ServiceId })}>
                    {SERVICE_NAMES.map((service) => <option key={service} value={service}>{service}</option>)}
                  </select>
                  <select className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={scheduledEdit.selectedSender} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, selectedSender: e.target.value })}>
                    {ACTIVE_SENDERS.map((sender: any) => <option key={sender.id} value={sender.id}>{sender.name} — {sender.email}</option>)}
                  </select>
                </div>

                <input className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-lg" placeholder="Subject" value={scheduledEdit.subject} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, subject: e.target.value })} />

                <div className="rounded-[26px] border-2 border-gray-100 overflow-hidden bg-white">
                  <EditorProvider>
                    <Toolbar className="bg-white border-b border-gray-100 p-2 flex gap-1 flex-wrap items-center">
                      <BtnBold /> <BtnItalic /> <BtnUnderline /> <BtnNumberedList /> <BtnBulletList /> <BtnClearFormatting />
                    </Toolbar>
                    <Editor value={scheduledEdit.message} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, message: e.target.value })} className="min-h-[260px] p-5 bg-white outline-none text-gray-800 font-medium email-editor-content" />
                  </EditorProvider>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Report URL optional" value={scheduledEdit.reportUrl} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, reportUrl: e.target.value })} />
                  <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Report button text" value={scheduledEdit.reportButtonText} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, reportButtonText: e.target.value })} />
                </div>

                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                  <input type="checkbox" checked={scheduledEdit.includeSignature} onChange={(e: any) => setScheduledEdit({ ...scheduledEdit, includeSignature: e.target.checked })} className="w-4 h-4" />
                  <span className="text-xs font-black text-gray-700 uppercase">Include signature</span>
                </label>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-[11px] font-bold text-amber-700 leading-relaxed">
                  For Brevo-managed scheduled emails, Save safely cancels the old Brevo schedule and creates a new updated schedule. Cancel and Send Now also cancel the provider schedule first.
                </div>
              </div>

              <div className="fixed bottom-0 right-0 grid w-full max-w-2xl grid-cols-1 gap-2 border-t border-gray-100 bg-white/90 p-4 backdrop-blur sm:grid-cols-3 sm:p-5">
                <button type="button" onClick={() => cancelScheduledEmail(scheduledEdit.leadId)} disabled={scheduledSaving} className="py-4 rounded-2xl bg-red-50 text-red-600 text-xs font-black uppercase disabled:opacity-60">
                  Cancel
                </button>
                <button type="button" onClick={() => sendScheduledSoon(scheduledEdit.leadId)} disabled={scheduledSaving} className="py-4 rounded-2xl bg-blue-50 text-blue-600 text-xs font-black uppercase disabled:opacity-60">
                  Send Now
                </button>
                <button type="button" onClick={saveScheduledEdit} disabled={scheduledSaving} className="py-4 rounded-2xl bg-black text-white text-xs font-black uppercase disabled:bg-gray-300 flex items-center justify-center gap-2">
                  {scheduledSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
