"use client"
import React, { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { 
  X, Send, MessageSquare, Activity, Trash2, Mail, Monitor, MapPin, Clock, User, AlertCircle, CheckCircle2, ShieldAlert
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
}

interface SentMessage {
  step: number;
  subject: string;
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
  status: 'active' | 'archived' | 'interested' | 'opened' | 'sent' | 'bounced' | 'spam'; 
  createdAt: any;
  lastOpenedAt?: any;
  tracking_history?: TrackingHistory[];
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
      return date.toLocaleString('en-GB', { 
          day: '2-digit', month: '2-digit', year: 'numeric', 
          hour: '2-digit', minute: '2-digit', hour12: true 
      }).replace(',', '');
    } catch (e) { return "Invalid Date"; }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'bounced': return <span className="text-[8px] bg-red-50 text-red-500 px-2 py-0.5 rounded-md font-bold flex items-center gap-1"><AlertCircle size={10}/> BOUNCED</span>;
      case 'spam': return <span className="text-[8px] bg-orange-50 text-orange-500 px-2 py-0.5 rounded-md font-bold flex items-center gap-1"><ShieldAlert size={10}/> SPAM</span>;
      case 'sent': return <span className="text-[8px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md font-bold flex items-center gap-1"><Send size={10}/> SENT</span>;
      case 'opened': return <span className="text-[8px] bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded-md font-bold flex items-center gap-1"><CheckCircle2 size={10}/> DELIVERED</span>;
      default: return null;
    }
  };

  const getFilteredLeads = () => {
    return leads.filter(lead => {
      const matchesSearch = lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (lead.name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesService = activeService === 'All' || lead.service === activeService;
      return matchesSearch && matchesService;
    });
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-600 uppercase">Loading Intelligence...</div>

  return (
  <>
  <Navbar />
  <AdminGuard>
  <div className="max-w-7xl mx-auto p-6 lg:p-10 bg-[#FAFBFF] min-h-screen font-sans">
      
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-6 items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Intelligence Hub</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Brevo Live Webhook Engine</p>
        </div>
        <input type="text" placeholder="Search leads..." className="px-5 py-3 bg-white shadow-sm border border-gray-100 rounded-2xl text-[10px] font-black outline-none w-72 focus:border-blue-500" onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-6">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead & Sender Info</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Engagement Time</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Activity</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {getFilteredLeads().map((lead) => (
              <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover:bg-blue-50/20 cursor-pointer group transition-all">
                <td className="p-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 uppercase italic tracking-tighter group-hover:text-blue-600">{lead.name || "Unknown"}</span>
                        {getStatusBadge(lead.status)}
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold">To: {lead.email}</span>
                    <span className="text-[9px] font-black text-blue-600 uppercase mt-1 flex items-center gap-1">
                       <Clock size={10}/> Initiated: {formatDate(lead.createdAt)}
                    </span>
                  </div>
                </td>
                
                <td className="p-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Last Interaction</span>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                            {lead.lastOpenedAt ? formatDate(lead.lastOpenedAt) : "No Action Yet"}
                        </span>
                    </div>
                </td>

                <td className="p-6 text-center">
                  <div className="flex flex-col items-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black ${lead.open_count >= 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {lead.open_count || 0} TOTAL OPENS
                    </span>
                    {lead.follow_up_count ? <span className="text-[8px] font-black text-blue-500 uppercase mt-1">Step {lead.follow_up_count} Sent</span> : null}
                  </div>
                </td>
                
                <td className="p-6 text-right">
                    <button className="p-2 text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLead(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[101] overflow-y-auto border-l border-gray-100 shadow-2xl">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900 leading-none">Intelligence Profile</h2>
                <button onClick={() => setSelectedLead(null)} className="p-3 bg-white text-gray-400 rounded-2xl border border-gray-100 hover:text-black transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-8">
                <section className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                            <User size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Target Client:</p>
                            <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tighter leading-none">{selectedLead.name || "N/A"}</h3>
                            <p className="text-xs font-bold text-gray-400 mt-1">{selectedLead.email}</p>
                        </div>
                    </div>
                </section>

                <section className="bg-blue-50/50 p-6 rounded-[30px] border border-blue-100">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Source Account</p>
                    <div className="flex items-center gap-2">
                        <Mail size={14} className="text-blue-500" />
                        <p className="text-sm font-black text-gray-800">{selectedLead.sender_email || "System Default"}</p>
                    </div>
                </section>

                {/* ৩. লাইভ ডিভাইস ও টাইম লগস (আপডেটেড লজিক) */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <Activity size={12} /> Live Engagement Logs
                  </h4>
                  
                  <div className="space-y-2">
                  {selectedLead?.tracking_history && [...selectedLead.tracking_history].reverse().map((info, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-[24px] p-4 shadow-sm group hover:border-blue-200 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-xl ${info.event === 'opened' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                             {info.event === 'opened' ? <Monitor size={14} /> : <Send size={14} />}
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-gray-800 uppercase block">Email {info.event}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                               <Clock size={10} className="text-gray-400" />
                               <span className="text-[10px] font-black text-blue-600 italic">{formatDate(info.time)}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`text-[8px] font-black px-2 py-1 rounded-md uppercase ${info.event === 'opened' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          {info.event}
                        </div>
                      </div>
                      {info.link && (
                        <div className="mt-2 text-[9px] bg-gray-50 p-2 rounded-lg text-blue-500 font-bold break-all">
                           Clicked: {info.link}
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                  
                  {(!selectedLead?.tracking_history || selectedLead.tracking_history.length === 0) && (
                    <p className="text-center text-[10px] text-gray-400 italic py-4 bg-gray-50 rounded-2xl uppercase tracking-widest">Awaiting interaction...</p>
                  )}
                </div>

                <section className="bg-gray-50/80 p-6 rounded-[35px] border border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MessageSquare size={14} /> Outreach Journey
                  </h4>
                  <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200 flex flex-col">
                    {selectedLead.sent_messages && [...selectedLead.sent_messages].reverse().map((msg, idx) => (
                      <div key={idx} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-black border-4 border-white shadow-sm z-10" />
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <span className="text-[8px] font-bold text-gray-400 uppercase block mb-1">{formatDate(msg.sentAt)}</span>
                          <p className="text-[11px] font-black text-gray-800 leading-tight uppercase tracking-tighter italic">Follow-up {msg.step}</p>
                          <p className="text-[9px] text-gray-500 mt-1">{msg.subject}</p>
                        </div>
                      </div>
                    ))}
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-600 border-4 border-white shadow-sm z-10" />
                      <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm">
                        <span className="text-[8px] font-bold text-gray-400 uppercase block mb-1">{formatDate(selectedLead.createdAt)}</span>
                        <p className="text-[11px] font-black text-blue-600 uppercase tracking-tighter italic">Initial Outreach</p>
                        <div className="text-[10px] text-gray-500 italic mt-1 bg-gray-50 p-2 rounded-lg">"{selectedLead.subject}"</div>
                      </div>
                    </div>
                  </div>
                </section>

                <button className="w-full bg-blue-600 text-white p-5 rounded-[28px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all hover:bg-blue-700 shadow-blue-100">
                    <Send size={18} />
                    <div className="text-left leading-tight">
                        <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Automation Active</p>
                        <p className="text-sm font-black uppercase italic">Current Status: {selectedLead.status}</p>
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