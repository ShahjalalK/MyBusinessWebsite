"use client"
import React, { useEffect, useState, useMemo } from 'react'
import { db } from '../../lib/firebase'
import { collection, query, orderBy, onSnapshot, limit, doc, deleteDoc, where } from 'firebase/firestore'
import { 
  X, Send, MessageSquare, Activity, Trash2, Mail, Monitor, Clock, User, 
  AlertCircle, CheckCircle2, ShieldAlert, Flame, Filter, Calendar, ChevronDown, ChevronUp
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
  message?: string; // মেসেজ বডি যোগ করা হয়েছে
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
  const [displayLimit, setDisplayLimit] = useState<number>(50); // Firebase Limit
  const [activeService, setActiveService] = useState<string>('All'); 
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [showAllLogs, setShowAllLogs] = useState<boolean>(false);

  useEffect(() => {
    // Firebase কোটা বাঁচাতে লিমিটেড ডেটা এবং রিয়েল টাইম লিসেনার
    const q = query(collection(db, "outreach_leads"), orderBy("createdAt", "desc"), limit(displayLimit));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const leadsArray: Lead[] = [];
      querySnapshot.forEach((doc) => { leadsArray.push({ id: doc.id, ...doc.data() } as Lead); });
      setLeads(leadsArray);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [displayLimit]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("Are you sure to delete this lead?")) {
      try {
        await deleteDoc(doc(db, "outreach_leads", id));
      } catch (error) {
        alert("Delete failed!");
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
      return date.toLocaleString('en-GB', { 
          day: '2-digit', month: 'short', year: 'numeric', 
          hour: '2-digit', minute: '2-digit', hour12: true 
      });
    } catch (e) { return "Invalid Date"; }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (lead.name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesService = activeService === 'All' || lead.service === activeService;
      
      let matchesMonth = true;
      if (selectedMonth !== 'All' && lead.createdAt) {
        const date = lead.createdAt.toMillis ? new Date(lead.createdAt.toMillis()) : new Date(lead.createdAt);
        matchesMonth = date.getMonth().toString() === selectedMonth;
      }

      return matchesSearch && matchesService && matchesMonth;
    });
  }, [leads, searchTerm, activeService, selectedMonth]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-600 uppercase">Syncing Intelligence...</div>

  return (
  <>
  <Navbar />
  <AdminGuard>
  <div className="max-w-7xl mx-auto p-4 lg:p-10 bg-[#FAFBFF] min-h-screen">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-6 items-start md:items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Intelligence Hub</h1>
          <div className="flex gap-4 mt-2">
            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Total: {filteredLeads.length}</span>
            <span className="text-orange-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"><Flame size={12}/> Hot: {filteredLeads.filter(l => l.open_count >= 2).length}</span>
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

      {/* Service Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Email Signature', 'Google Ads', 'Server Side Tracking'].map((s) => (
          <button key={s} onClick={() => setActiveService(s)} className={`px-5 py-2 rounded-full text-[10px] font-black transition-all whitespace-nowrap ${activeService === s ? 'bg-black text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[30px] shadow-xl border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Lead Information</th>
              <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Status & Service</th>
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
                        <span className="font-black text-gray-900 uppercase italic tracking-tighter group-hover:text-blue-600">{lead.name || "Unknown"}</span>
                        {lead.open_count >= 2 && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[8px] font-black flex items-center gap-1 animate-pulse"><Flame size={10}/> HOT</span>}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">{lead.email}</span>
                  </div>
                </td>
                
                <td className="p-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-2 py-0.5 rounded uppercase">{lead.service || 'General'}</span>
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
        {filteredLeads.length === 0 && <div className="p-20 text-center text-gray-300 font-black uppercase tracking-widest">No Leads Found</div>}
      </div>

      {/* Side Panel (Lead Details) */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLead(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-[101] overflow-y-auto shadow-2xl">
              
              <div className="p-8 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center">
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Intelligence Profile</h2>
                <button onClick={() => setSelectedLead(null)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-black transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-8 pb-32">
                {/* Client Info Card */}
                <section className="bg-black p-6 rounded-[30px] text-white">
                    <p className="text-[10px] font-bold opacity-50 uppercase mb-2">Target Information</p>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">{selectedLead.name || "Unknown Lead"}</h3>
                    <p className="text-sm font-medium opacity-70 mt-1">{selectedLead.email}</p>
                    <div className="mt-4 flex gap-2">
                        <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest">{selectedLead.service}</span>
                        <span className="px-3 py-1 bg-blue-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Status: {selectedLead.status}</span>
                    </div>
                </section>

                {/* Live Engagement Logs - ২টা বা ৩টা পর ড্রপডাউন */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <Activity size={12} /> Engagement History
                  </h4>
                  <div className="space-y-2">
                    {(selectedLead.tracking_history || []).slice(0, showAllLogs ? undefined : 3).reverse().map((info, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Monitor size={14} className="text-blue-500" />
                            <div>
                                <p className="text-[10px] font-black text-gray-800 uppercase">Email Opened</p>
                                <p className="text-[9px] font-bold text-blue-600 italic">{formatDate(info.time)}</p>
                            </div>
                        </div>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      </div>
                    ))}

                    {selectedLead.tracking_history && selectedLead.tracking_history.length > 3 && (
                        <button onClick={() => setShowAllLogs(!showAllLogs)} className="w-full py-2 text-[9px] font-black text-gray-400 uppercase bg-gray-50/50 rounded-xl border border-dashed hover:bg-gray-100 transition-all">
                            {showAllLogs ? "Show Less" : `View ${selectedLead.tracking_history.length - 3} More Logs`}
                        </button>
                    )}
                  </div>
                </div>

                {/* Outreach Journey - With Message Body */}
                <section className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MessageSquare size={14} /> Full Journey Tracking
                  </h4>
                  <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                    
                    {/* Follow ups */}
                    {selectedLead.sent_messages && [...selectedLead.sent_messages].reverse().map((msg, idx) => (
                      <div key={idx} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-white border-2 border-blue-500 z-10 flex items-center justify-center text-[8px] font-bold">{msg.step}</div>
                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                          <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">{formatDate(msg.sentAt)}</span>
                          <p className="text-[11px] font-black text-gray-800 uppercase italic">Follow-up {msg.step}</p>
                          <p className="text-[10px] text-blue-600 font-bold mt-1">{msg.subject}</p>
                          {msg.message && <div className="mt-2 text-[9px] text-gray-500 line-clamp-3 bg-white p-2 rounded-lg border border-gray-100 italic" dangerouslySetInnerHTML={{ __html: msg.message }} />}
                        </div>
                      </div>
                    ))}

                    {/* Initial Email */}
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-blue-600 border-4 border-white shadow-sm z-10" />
                      <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100">
                        <span className="text-[8px] font-black text-blue-400 uppercase block mb-1">{formatDate(selectedLead.createdAt)}</span>
                        <p className="text-[11px] font-black text-blue-600 uppercase italic tracking-tighter leading-none">Initial Outreach</p>
                        <p className="text-[10px] font-bold text-gray-700 mt-2">Sub: {selectedLead.subject}</p>
                        {selectedLead.message && (
                            <div className="mt-2 text-[9px] text-gray-500 italic bg-white p-3 rounded-xl border border-blue-50" 
                                 dangerouslySetInnerHTML={{ __html: selectedLead.message.length > 200 ? selectedLead.message.substring(0, 200) + '...' : selectedLead.message }} 
                            />
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Action Bar */}
              <div className="fixed bottom-0 w-full max-w-lg p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3">
                <button className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
                    Send Direct Message
                </button>
                <button onClick={(e) => { handleDelete(selectedLead.id, e); setSelectedLead(null); }} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors">
                    <Trash2 size={18} />
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