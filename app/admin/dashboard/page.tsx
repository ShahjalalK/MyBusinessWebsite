"use client"
import React, { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { 
  X, Send, MessageSquare, Activity, Trash2, Mail 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion';
import AdminGuard from '@/app/components/AdminGuard'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'

// --- Interfaces ---
interface DeviceInfo {
  device: string;
  time: any; 
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

  // --- স্মার্ট কোয়ালিফিকেশন লজিক (আপনার ফলো-আপ পেজের সাথে ১০০% সিঙ্ক) ---
  const checkQualification = (lead: Lead) => {
    // ১. নাম এবং কোম্পানির নাম থাকতে হবে (Trim করা হয়েছে যাতে শুধু স্পেস থাকলে রিজেক্ট হয়)
    if (!lead.name || lead.name.trim() === "" || !lead.company_name || lead.company_name.trim() === "") {
      return false;
    }
    
    // ২. ওপেন কাউন্ট ২ বা তার বেশি হতে হবে
    if ((lead.open_count || 0) < 2) return false;
    
    // ৩. device_info চেক এবং ৩০ সেকেন্ডের টাইম গ্যাপ
    if (lead.device_info && lead.device_info.length >= 2) {
      const getMs = (time: any) => time?.toMillis ? time.toMillis() : new Date(time).getTime();
      const firstOpen = lead.device_info[0].time;
      const lastOpen = lead.device_info[lead.device_info.length - 1].time;
      
      const firstMillis = getMs(firstOpen);
      const lastMillis = getMs(lastOpen);
      
      // ৩০ সেকেন্ডের কম হলে যোগ্য নয়
      if ((lastMillis - firstMillis) / 1000 < 30) return false;
    } else {
      // যদি ইনফো না থাকে বা ২টির কম ওপেন রেকর্ড থাকে
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
    
    // --- আপডেট করা লজিক ---

    // যদি 'F-1 Ready' ট্যাবে থাকেন, তবে শুধুমাত্র যারা কোয়ালিফাইড এবং নতুন তাদের দেখাবে
    if (activeStepTab === 'F-1 Ready') {
      return count === 0 && isQualified;
    }
    
    // যদি 'In Journey' ট্যাবে থাকেন, তবে যাদের অলরেডি ফলো-আপ পাঠানো হয়েছে তাদের দেখাবে
    if (activeStepTab === 'In Journey') {
      if (count === 0 || count >= 5) return false;
      if (journeyFilter !== 'All Steps') {
           const stepNum = parseInt(journeyFilter.split('-')[1]);
           return count === (stepNum - 1);
      }
      return true;
    }

    // 'All' ট্যাবে থাকলে এখন আমরা সব লিড দেখাবো (যাতে আপনি সব দেখতে পান)
    return true; 
  });
};

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
    return date.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-600 italic">SHAHJALAL'S HUB LOADING...</div>

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
              placeholder="Search leads, senders..." 
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

        {activeStepTab === 'In Journey' && (
          <select value={journeyFilter} onChange={(e) => setJourneyFilter(e.target.value)} className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 text-[9px] font-black uppercase outline-none text-blue-600">
            {['All Steps', 'F-2 Only', 'F-3 Only', 'F-4 Only', 'F-5 Only'].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-6">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead & Sender</th>
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
                    <span className="font-black text-gray-900 uppercase italic tracking-tighter group-hover:text-blue-600">{lead.name || "Unknown"}</span>
                    <span className="text-[10px] text-gray-500 font-bold">To: {lead.email}</span>
                    <span className="text-[9px] font-black text-blue-600 uppercase mt-1">From: {lead.sender_email || "Not Set"}</span>
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

      if (count === 0) {
        return (
          <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-tighter ${isQualified ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400'}`}>
            {isQualified ? 'F-1 Ready' : 'Cold Lead'}
          </span>
        );
      } else {
        return (
          <span className="text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-tighter bg-black text-white">
            STEP {count + 1}
          </span>
        );
      }
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
        {getFilteredLeads().length === 0 && (
          <div className="p-20 text-center text-gray-300 font-black uppercase text-xs italic tracking-widest">No matching leads in this phase</div>
        )}
      </div>

      {/* Load More */}
      {leads.length >= displayLimit && (
        <div className="flex justify-center mb-10">
          <button onClick={() => setDisplayLimit(prev => prev + 100)} className="px-8 py-3 bg-white border border-gray-200 rounded-[20px] font-black text-[10px] uppercase text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">Load More</button>
        </div>
      )}

      {/* Drawer */}
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
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Sending Account</p>
                    <div className="flex items-center gap-2">
                        <Mail size={14} className="text-blue-500" />
                        <p className="text-sm font-black text-gray-800">{selectedLead.sender_email || "N/A"}</p>
                    </div>
                </section>

                <div className="space-y-1">
                    <h3 className="text-xl font-black text-gray-900 italic tracking-tighter">{selectedLead.name || "Prospect"}</h3>
                    <p className="text-xs font-bold text-gray-400">{selectedLead.email}</p>
                    <p className="text-[10px] font-black text-blue-600 uppercase">Service: {selectedLead.service || 'General'}</p>
                    <p className="text-[10px] font-black text-gray-500 uppercase">Company: {selectedLead.company_name || 'Not Provided'}</p>
                </div>

                <section className="bg-gray-50/80 p-6 rounded-[35px] border border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MessageSquare size={14} /> Full Outreach Thread
                  </h4>
                  
                  <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-600 border-4 border-white shadow-sm z-10" />
                      <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm">
                        <span className="text-[9px] font-black text-blue-600 uppercase italic">Phase 1: Initial</span>
                        <p className="text-[11px] font-black text-gray-800 my-1">{selectedLead.subject}</p>
                        <div className="text-[10px] text-gray-500 italic bg-gray-50 p-3 rounded-xl">"{selectedLead.message || "Original message not stored."}"</div>
                      </div>
                    </div>

                    {selectedLead.sent_messages?.map((msg, idx) => (
                      <div key={idx} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-black border-4 border-white shadow-sm z-10" />
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <span className="text-[9px] font-black text-black uppercase italic">Phase {msg.step}: Follow-up</span>
                          <p className="text-[11px] font-bold text-gray-800 my-1">{msg.subject}</p>
                          <div className="text-[10px] text-gray-500 bg-gray-50 p-3 rounded-xl">"{msg.body}"</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={14} /> Recent Activity
                    </h4>
                    <div className="space-y-2">
                        {selectedLead.device_info?.slice(-3).reverse().map((info, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl">
                                <span className="text-[10px] font-bold text-gray-700 uppercase">{info.device}</span>
                                <span className="text-[9px] text-gray-400 font-bold">{formatDate(info.time)}</span>
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