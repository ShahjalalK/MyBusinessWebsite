"use client"
import React, { useEffect, useState, useMemo } from 'react'
import { db } from '../../lib/firebase'
import { collection, query, orderBy, onSnapshot, limit, doc, deleteDoc } from 'firebase/firestore'
import { 
  X, Send, MessageSquare, Activity, Trash2, Mail, Monitor, Clock, User, 
  AlertCircle, CheckCircle2, ShieldAlert, Flame, Filter, Calendar, ChevronDown, ChevronUp, Timer, ExternalLink, Globe
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion';
import AdminGuard from '@/app/components/AdminGuard'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'

// --- Interfaces ---
interface TrackingHistory {
  event: string;
  time: any;
  link?: string;
  step?: number; // ফলো-আপ স্টেপ ট্র্যাকিংয়ের জন্য
}

interface SentMessage {
  step: number;
  subject: string;
  message?: string;
  sentAt: any;
}

interface Lead {
  id: string;
  name?: string;
  company_name?: string;
  website?: string;
  email: string;
  subject: string;
  message?: string; 
  open_count: number;
  status: string; 
  createdAt: any;
  lastOpenedAt?: any;
  lastFollowUp?: any;
  sentAt?: any;
  tracking_history?: TrackingHistory[];
  follow_up_count?: number;
  sent_messages?: SentMessage[]; 
  service?: string;
  preferred_hour?: number;
  stopAutomation?: boolean;
  [key: string]: any; 
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [displayLimit] = useState<number>(100); 
  const [activeService, setActiveService] = useState<string>('All'); 
  const [activeStep, setActiveStep] = useState<number | 'All'>('All'); 
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [showAllLogs, setShowAllLogs] = useState<boolean>(false);

  useEffect(() => {
    const q = query(collection(db, "outreach_leads"), orderBy("createdAt", "desc"), limit(displayLimit));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const leadsArray: Lead[] = [];
      querySnapshot.forEach((doc) => { leadsArray.push({ id: doc.id, ...doc.data() } as Lead); });
      setLeads(leadsArray);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [displayLimit]);

  const toMillis = (time: any): number => {
    if (!time) return 0;
    if (typeof time.toMillis === 'function') return time.toMillis();
    if (time.seconds) return time.seconds * 1000;
    const date = new Date(time);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

const isHotLead = (lead: Lead) => {
  return (lead.open_count || 0) >= 2; 
};

const getNextFollowUpStatus = (lead: Lead) => {
  if (lead.status === 'replied' || lead.stopAutomation) return null;
  const followUpCount = lead.follow_up_count || 0;
  if (followUpCount >= 5) return null;

  const lastSent = toMillis(lead.lastFollowUp || lead.sentAt);
  const lastOpened = toMillis(lead.lastOpenedAt || lead.last_opened || 0);
  
  if (followUpCount === 0) {
    if ((lead.open_count || 0) < 1) return null; 
  }
  if (followUpCount >= 1) {
    if (!lastOpened || lastOpened <= lastSent) return { label: "Waiting for Open", color: "text-orange-400", time: null };
  }

  const rawBaseTime = lead.lastOpenedAt || lead.last_opened || lead.lastFollowUp || lead.sentAt;
  if (!rawBaseTime) return { label: "Syncing...", color: "text-gray-300", time: null };

  const baseDate = new Date(toMillis(rawBaseTime));
  const roundedDate = new Date(baseDate);
  const minutes = baseDate.getMinutes();
  const roundedMinutes = Math.floor(minutes / 30) * 30; 
  roundedDate.setMinutes(roundedMinutes, 0, 0);

  const nextStep = followUpCount + 1;
  const delayMinutes = lead[`step${nextStep}Delay`] || 1440; 
  const scheduledMillis = roundedDate.getTime() + (delayMinutes * 60000);
  const now = new Date().getTime();

  const timeString = new Date(scheduledMillis).toLocaleString('en-GB', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true 
  });

  if (now >= scheduledMillis) return { label: `Ready: Step ${nextStep}`, color: "text-green-500", time: timeString };
  return { label: `Step ${nextStep} Scheduled:`, color: "text-blue-500", time: timeString };
};

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("Are you sure to delete this lead?")) {
      try { await deleteDoc(doc(db, "outreach_leads", id)); } catch (error) { alert("Delete failed!"); }
    }
  };

  const formatDate = (timestamp: any) => {
    const millis = toMillis(timestamp);
    if (millis === 0) return "N/A";
    return new Date(millis).toLocaleString('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (lead.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                            (lead.company_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesService = activeService === 'All' || lead.service === activeService;
      const matchesStep = activeStep === 'All' || (lead.follow_up_count || 0) === activeStep;
      let matchesMonth = true;
      if (selectedMonth !== 'All' && lead.createdAt) {
        const date = new Date(toMillis(lead.createdAt));
        matchesMonth = date.getMonth().toString() === selectedMonth;
      }
      return matchesSearch && matchesService && matchesMonth && matchesStep;
    });
  }, [leads, searchTerm, activeService, selectedMonth, activeStep]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-600 uppercase text-xs">Syncing Intelligence...</div>

  return (
  <>
  <Navbar />
  <AdminGuard>
  <div className="max-w-7xl mx-auto p-4 lg:p-10 bg-[#FAFBFF] min-h-screen">
      {/* Header, Stats, Filters (আগের মতোই থাকবে) */}
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-6 items-start md:items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Intelligence Hub</h1>
          <div className="flex gap-4 mt-2">
            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Active Leads: {filteredLeads.length}</span>
            <span className="text-orange-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
                <Flame size={12}/> Hot Leads: {leads.filter(l => isHotLead(l)).length}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
            <select onChange={(e) => setSelectedMonth(e.target.value)} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black outline-none shadow-sm">
                <option value="All">All Months</option>
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                ))}
            </select>
            <input type="text" placeholder="Search..." className="px-5 py-2 bg-white shadow-sm border border-gray-100 rounded-xl text-[10px] font-black outline-none w-48 focus:border-blue-500" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Service & Step Tabs (আগের মতোই থাকবে) */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['All', 'Email Signature', 'Google Ads', 'Server Side Tracking'].map((s) => (
          <button key={s} onClick={() => {setActiveService(s); setActiveStep('All');}} className={`px-5 py-2 rounded-full text-[10px] font-black transition-all whitespace-nowrap ${activeService === s ? 'bg-black text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {activeService !== 'All' && (
        <div className="flex gap-2 mb-8 bg-gray-100/50 p-1.5 rounded-2xl w-fit border border-gray-100">
            {[0, 1, 2, 3, 4].map((step) => {
                const count = leads.filter(l => l.service === activeService && (l.follow_up_count || 0) === step).length;
                return (
                    <button key={step} onClick={() => setActiveStep(step)} className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all flex items-center gap-2 ${activeStep === step ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                        {step === 0 ? "INITIAL" : `F-${step}`}
                        <span className={`px-1.5 py-0.5 rounded-md ${activeStep === step ? 'bg-blue-50' : 'bg-gray-200'} text-[8px]`}>{count}</span>
                    </button>
                )
            })}
            <button onClick={() => setActiveStep('All')} className={`px-4 py-2 rounded-xl text-[9px] font-black ${activeStep === 'All' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>ALL</button>
        </div>
      )}

      {/* Table (আগের মতোই থাকবে) */}
      <div className="bg-white rounded-[30px] shadow-xl border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Lead Information</th>
              <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Status & Time</th>
              <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Engagement</th>
              <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover:bg-blue-50/20 cursor-pointer group transition-all">
                <td className="p-5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 uppercase italic tracking-tighter group-hover:text-blue-600 leading-none">{lead.name || "Unknown"}</span>
                        {isHotLead(lead) && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[8px] font-black flex items-center gap-1 animate-pulse"><Flame size={10}/> HOT</span>}
                    </div>
                    <span className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{lead.company_name || "No Company"}</span>
                    <span className="text-[10px] text-gray-300 font-bold">{lead.email}</span>
                  </div>
                </td>
                <td className="p-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${lead.status === 'replied' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500'}`}>
                           {lead.follow_up_count ? `Follow-up ${lead.follow_up_count}` : 'Initial Sent'}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 italic">{formatDate(lead.createdAt)}</span>
                    </div>
                </td>
                <td className="p-5 text-center">
                  <div className="inline-flex flex-col items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    <span className="text-xs font-black text-gray-900">{lead.open_count || 0}</span>
                    <span className="text-[8px] font-black text-gray-400 uppercase">Opens</span>
                  </div>
                </td>
                <td className="p-5 text-right">
                    <button onClick={(e) => handleDelete(lead.id, e)} className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLead(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-[101] overflow-y-auto shadow-2xl">
              
              <div className="p-8 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center">
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Lead Intelligence</h2>
                <button onClick={() => setSelectedLead(null)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-black transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-8 pb-32">
                {/* Target Profile */}
                <section className="bg-black p-8 rounded-[35px] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold opacity-50 uppercase mb-2 tracking-widest">Target Profile</p>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">{selectedLead.name || "Unknown Lead"}</h3>
                        {selectedLead.company_name && (
                          <span className="text-blue-400 font-black text-xs uppercase italic tracking-tighter">/ {selectedLead.company_name}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium opacity-70 mt-1">{selectedLead.email}</p>
                      
                      {selectedLead.website && (
                        <a href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all group">
                          <Globe size={14} className="text-blue-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Visit Website</span>
                          <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      )}
                      <div className="mt-6 flex gap-2">
                          <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/5">{selectedLead.service}</span>
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${selectedLead.status === 'replied' ? 'bg-green-500' : 'bg-blue-600'}`}>Status: {selectedLead.status}</span>
                      </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/20 blur-[80px] rounded-full" />
                </section>

                {/* Next Follow-up Prediction */}
                {getNextFollowUpStatus(selectedLead) && (
                  <section className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl bg-gray-50 ${getNextFollowUpStatus(selectedLead)?.color}`}>
                        <Timer size={20} />
                      </div>
                      <div>
                        <p className={`text-[11px] font-black uppercase tracking-tight ${getNextFollowUpStatus(selectedLead)?.color}`}>
                          {getNextFollowUpStatus(selectedLead)?.label}
                        </p>
                        {getNextFollowUpStatus(selectedLead)?.time && (
                          <p className="text-lg font-black text-gray-900 mt-1">
                            {getNextFollowUpStatus(selectedLead)?.time}
                          </p>
                        )}
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 italic leading-tight">
                          * Syncing with Database Slot
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Engagement History (এখানেই আমরা পরিবর্তন করেছি) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={12} /> Full Engagement Logs
                    </h4>
                    { (selectedLead.tracking_history?.length || 0) > 3 && (
                      <button onClick={() => setShowAllLogs(!showAllLogs)} className="text-[9px] font-black text-blue-600 uppercase">
                        {showAllLogs ? "Show Less" : `View All (${selectedLead.tracking_history?.length})`}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {(selectedLead.tracking_history || [])
                      .slice() // copy array
                      .sort((a, b) => toMillis(b.time) - toMillis(a.time)) // Newest first
                      .slice(0, showAllLogs ? undefined : 5) // Show 5 or all
                      .map((info, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex justify-between items-center transition-all hover:border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${info.event === 'opened' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                              <Monitor size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-800 uppercase">
                                  {info.event === 'opened' ? 'Email Opened' : info.event}
                                  {info.step ? <span className="ml-2 text-blue-500">[Step {info.step}]</span> : ""}
                                </p>
                                <p className="text-[9px] font-bold text-blue-600 italic">{formatDate(info.time)}</p>
                            </div>
                        </div>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      </div>
                    ))}
                    {(!selectedLead.tracking_history || selectedLead.tracking_history.length === 0) && (
                      <p className="text-[10px] text-gray-400 font-bold text-center py-4 italic">No engagement tracked yet.</p>
                    )}
                  </div>
                </div>

                {/* Journey Tracking (আগের মতোই থাকবে) */}
                <section className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MessageSquare size={14} /> Full Journey Tracking
                  </h4>
                  <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                    {selectedLead.sent_messages && [...selectedLead.sent_messages].reverse().map((msg, idx) => (
                      <div key={idx} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-white border-2 border-blue-500 z-10 flex items-center justify-center text-[8px] font-bold">{msg.step}</div>
                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                          <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">{formatDate(msg.sentAt)}</span>
                          <p className="text-[11px] font-black text-gray-800 uppercase italic">Follow-up {msg.step}</p>
                          <p className="text-[10px] text-blue-600 font-bold mt-1">{msg.subject}</p>
                          {msg.message && <div className="mt-2 text-[9px] text-gray-500 bg-white p-3 rounded-lg border border-gray-100 italic" dangerouslySetInnerHTML={{ __html: msg.message }} />}
                        </div>
                      </div>
                    ))}
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-blue-600 border-4 border-white shadow-sm z-10" />
                      <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100">
                        <span className="text-[8px] font-black text-blue-400 uppercase block mb-1">{formatDate(selectedLead.createdAt)}</span>
                        <p className="text-[11px] font-black text-blue-600 uppercase italic tracking-tighter">Initial Outreach</p>
                        <p className="text-[10px] font-bold text-gray-700 mt-2">Sub: {selectedLead.subject}</p>
                        {selectedLead.message && (
                            <div className="mt-2 text-[9px] text-gray-500 bg-white p-3 rounded-lg border border-blue-50 italic" dangerouslySetInnerHTML={{ __html: selectedLead.message }} />
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Action Bar */}
              <div className="fixed bottom-0 w-full max-w-lg p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3">
                <button className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Direct Email</button>
                <button onClick={(e) => { handleDelete(selectedLead.id, e); setSelectedLead(null); }} className="p-4 bg-red-50 text-red-500 rounded-2xl"><Trash2 size={18} /></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
    </AdminGuard>
  <Footer />
  </>
  )
}