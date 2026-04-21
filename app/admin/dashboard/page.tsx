"use client"
import React, { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { 
  X, Send, MessageSquare, Activity, Trash2, Mail, Monitor, MapPin, Clock 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion';
import AdminGuard from '@/app/components/AdminGuard'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'

// --- Interfaces ---
interface DeviceInfo {
  device: string;
  time: any; 
  location?: string; // লোকেশন ফিল্ড যোগ করা হয়েছে
}

interface SentMessage {
  step: number;
  subject: string;
  body: string;
  sentAt: any;
}

interface Lead {
  id: string;
  name?: string;
  company_name?: string;
  email: string;
  subject: string;
  message?: string; 
  open_count: number;
  status: 'active' | 'archived' | 'interested' | 'opened'; 
  createdAt: any;
  device_info?: DeviceInfo[];
  follow_up_count?: number;
  sent_messages?: SentMessage[]; 
  service?: string;
  sender_email?: string;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [displayLimit, setDisplayLimit] = useState<number>(100);
  const [activeService, setActiveService] = useState<string>('All'); 
  const [activeStepTab, setActiveStepTab] = useState<string>('All');
  const [journeyFilter, setJourneyFilter] = useState<string>('All Steps');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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

  const checkQualification = (lead: Lead) => {
    if (!lead.name || lead.name.trim() === "" || !lead.company_name || lead.company_name.trim() === "") return false;
    if ((lead.open_count || 0) < 2) return false;
    
    if (lead.device_info && lead.device_info.length >= 2) {
      const getMs = (time: any) => time?.toMillis ? time.toMillis() : new Date(time).getTime();
      const firstMillis = getMs(lead.device_info[0].time);
      const lastMillis = getMs(lead.device_info[lead.device_info.length - 1].time);
      if ((lastMillis - firstMillis) / 1000 < 30) return false;
    } else {
      return false;
    }
    return true;
  };

  const getFilteredLeads = () => {
    return leads.filter(lead => {
      const matchesSearch = lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (lead.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                            (lead.sender_email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesService = activeService === 'All' || lead.service === activeService;
      if (!matchesSearch || !matchesService) return false;

      const isQualified = checkQualification(lead);
      const count = lead.follow_up_count || 0;
      
      if (activeStepTab === 'F-1 Ready') return count === 0 && isQualified;
      if (activeStepTab === 'In Journey') {
        if (count === 0 || count >= 5) return false;
        if (journeyFilter !== 'All Steps') {
             const stepNum = parseInt(journeyFilter.split('-')[1]);
             return count === (stepNum - 1);
        }
        return true;
      }
      return true; 
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
    return date.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-600 italic uppercase tracking-widest">SHAHJALAL'S HUB LOADING...</div>

  return (
  <>
  <Navbar />
  <AdminGuard>

  <div className="max-w-7xl mx-auto p-6 lg:p-10 bg-[#FAFBFF] min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-6 items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Intelligence Hub</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Comprehensive Phase Tracking</p>
        </div>
        <div className="flex gap-3">
          <input 
              type="text" 
              placeholder="Search leads..." 
              className="px-5 py-3 bg-white shadow-sm border border-gray-100 rounded-2xl text-[10px] font-black outline-none w-72 focus:border-blue-500 transition-all" 
              onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
          {['All', 'Email Signature', 'Google Ads', 'Server Side Tracking'].map((s) => (
            <button key={s} onClick={() => setActiveService(s)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeService === s ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>{s === 'Server Side Tracking' ? 'Server Side' : s}</button>
          ))}
        </div>

        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
          {['All', 'F-1 Ready', 'In Journey'].map((tab) => (
            <button key={tab} onClick={() => setActiveStepTab(tab)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeStepTab === tab ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-50'}`}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-6">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead & Sender</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Device & Activity</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tracking</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Phase</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {getFilteredLeads().map((lead) => (
              <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover:bg-blue-50/20 cursor-pointer group transition-all">
                <td className="p-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 uppercase italic tracking-tighter group-hover:text-blue-600">{lead.name || "Unknown"}</span>
                        <span className="text-[9px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                           <Clock size={10}/> {formatDate(lead.createdAt)}
                        </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold">To: {lead.email}</span>
                    <span className="text-[9px] font-black text-blue-600 uppercase mt-1">From: {lead.sender_email || "Not Set"}</span>
                  </div>
                </td>
                <td className="p-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Monitor size={12} className="text-gray-400" />
                            <span className="text-[10px] font-black uppercase">{lead.device_info?.[0]?.device || "Waiting..."}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <MapPin size={12} />
                            <span className="text-[9px] font-bold">{lead.device_info?.[0]?.location || "Location Private"}</span>
                        </div>
                    </div>
                </td>
                <td className="p-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black ${lead.open_count >= 2 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {lead.open_count || 0} OPENS
                  </span>
                </td>
                <td className="p-6 text-center">
                    {(() => {
                    const isQualified = checkQualification(lead);
                    const count = lead.follow_up_count || 0;
                    return (
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-tighter ${count > 0 ? 'bg-black text-white' : isQualified ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400'}`}>
                            {count > 0 ? `STEP ${count + 1}` : isQualified ? 'F-1 Ready' : 'Cold Lead'}
                        </span>
                    );
                    })()}
                </td>
                <td className="p-6 text-right">
                    <button onClick={(e) => { e.stopPropagation(); }} className="p-2 text-gray-200 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer Profile */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLead(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[101] overflow-y-auto border-l border-gray-100 shadow-2xl">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900 leading-none">Lead Profile</h2>
                <button onClick={() => setSelectedLead(null)} className="p-3 bg-white text-gray-400 rounded-2xl border border-gray-100 hover:text-black transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-8">
                <section className="bg-blue-50/50 p-6 rounded-[30px] border border-blue-100">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Account & Tracking</p>
                    <div className="flex items-center gap-2 mb-2">
                        <Mail size={14} className="text-blue-500" />
                        <p className="text-sm font-black text-gray-800">{selectedLead.sender_email}</p>
                    </div>
                    <div className="flex items-center gap-4 border-t border-blue-100 pt-3 mt-3">
                        <div>
                            <p className="text-[8px] uppercase font-black text-blue-400">First Sent</p>
                            <p className="text-[10px] font-black text-gray-700">{formatDate(selectedLead.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-[8px] uppercase font-black text-blue-400">Current Phase</p>
                            <p className="text-[10px] font-black text-gray-700">Step {(selectedLead.follow_up_count || 0) + 1}</p>
                        </div>
                    </div>
                </section>

                <section className="bg-gray-50/80 p-6 rounded-[35px] border border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MessageSquare size={14} /> Full Outreach Thread
                  </h4>
                  
                  <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
                    {/* Initial Email */}
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-600 border-4 border-white shadow-sm z-10" />
                      <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-black text-blue-600 uppercase italic">Phase 1: Initial</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">{formatDate(selectedLead.createdAt)}</span>
                        </div>
                        <p className="text-[11px] font-black text-gray-800 my-1">{selectedLead.subject}</p>
                        <div className="text-[10px] text-gray-500 italic bg-gray-50 p-3 rounded-xl">"{selectedLead.message || "Message body..."}"</div>
                      </div>
                    </div>

                    {/* Follow-up Messages */}
                    {selectedLead.sent_messages?.map((msg, idx) => (
                      <div key={idx} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-black border-4 border-white shadow-sm z-10" />
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-black text-black uppercase italic">Phase {msg.step}: Follow-up</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">{formatDate(msg.sentAt)}</span>
                          </div>
                          <p className="text-[11px] font-bold text-gray-800 my-1">{msg.subject}</p>
                          <div className="text-[10px] text-gray-500 bg-gray-50 p-3 rounded-xl">"{msg.body}"</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={14} /> Tracking History
                    </h4>
                    <div className="space-y-2">
                        {selectedLead.device_info?.slice(-5).reverse().map((info, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-700 uppercase">{info.device}</span>
                                    <span className="text-[8px] text-blue-500 font-bold">{info.location || "IP Logged"}</span>
                                </div>
                                <span className="text-[9px] text-gray-400 font-black">{formatDate(info.time)}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <button className="w-full bg-blue-600 text-white p-5 rounded-[28px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all hover:bg-blue-700">
                    <Send size={18} />
                    <div className="text-left leading-tight">
                        <p className="text-[10px] font-black opacity-70 uppercase">Ready for Next Phase</p>
                        <p className="text-sm font-black uppercase italic">Send Follow-up {(selectedLead.follow_up_count || 0) + 1}</p>
                    </div>
                </button>
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