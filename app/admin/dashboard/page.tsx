"use client"
import React, { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { 
  Mail, Eye, Clock, CheckCircle, TrendingUp, Users, 
  Search, Globe, Smartphone, Trash2, Archive, Calendar,
  AlertCircle, X, ChevronRight, Send, Activity, Inbox, MapPin, AlertTriangle
} from 'lucide-react'

// --- ১. ইন্টারফেস ---
interface DeviceInfo {
  device: string;
  ip: string;
  location: string;
  time: any;
}

interface Lead {
  id: string;
  name?: string;
  email: string;
  subject: string;
  business_type?: string;
  open_count: number;
  status: string; 
  sender_email: string;
  createdAt: any;
  device_info?: DeviceInfo[];
  follow_up_count?: number;
  service?: string;
  delivery_status?: string;
  bounceReason?: string; // নতুন ফিল্ড
}

// --- ২. হেল্পার ফাংশন ---
const getInterestStyle = (count: number): string => {
  if (count === 0) return 'bg-gray-100 text-gray-500';
  if (count < 3) return 'bg-blue-100 text-blue-600';
  return 'bg-red-100 text-red-600 animate-pulse';
}

const getDeliveryBadge = (status: string) => {
  const s = status?.toLowerCase();
  switch (s) {
    case 'bounced': 
    case 'hard_bounce':
    case 'soft_bounce':
    case 'invalid':
        return 'bg-red-100 text-red-600 border-red-200';
    case 'spam/complaint':
    case 'spam':
        return 'bg-orange-100 text-orange-600 border-orange-200';
    case 'delivered': 
    case 'sent':
        return 'bg-green-100 text-green-600 border-green-200';
    default: return 'bg-blue-50 text-blue-500 border-blue-100';
  }
}

const StatCard = ({ title, value, icon, color }: { title: string, value: any, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm flex items-center gap-5">
    <div className={`${color} p-4 rounded-2xl`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterDays, setFilterDays] = useState<number>(0)
  const [showArchived, setShowArchived] = useState<boolean>(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    const q = query(collection(db, "outreach_leads"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const leadsArray: Lead[] = [];
      querySnapshot.forEach((doc) => {
        leadsArray.push({ id: doc.id, ...doc.data() } as Lead);
      });
      setLeads(leadsArray);
      setLoading(false);
    });

    const fetchConfig = async () => {
      const configDoc = await getDoc(doc(db, "automation_settings", "followup_config"));
      if (configDoc.exists()) setConfig(configDoc.data());
    }
    fetchConfig();

    return () => unsubscribe();
  }, []);

  const getStepContent = (service: string, step: number) => {
    if (!config || !service) return "Template loading...";
    const stepKey = `step${step}`;
    const stepData = config[service]?.[stepKey];
    return stepData?.variants?.[0]?.content || "No template message found.";
  }

  const toggleArchive = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
    await updateDoc(doc(db, "outreach_leads", id), { status: newStatus });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure? This will delete the data forever!")) {
      await deleteDoc(doc(db, "outreach_leads", id));
      if (selectedLead?.id === id) setSelectedLead(null);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (lead.name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus = showArchived ? lead.status === 'archived' : lead.status !== 'archived';
    
    if (filterDays === 0) return matchesSearch && matchesStatus;
    const leadDate = lead.createdAt?.toDate();
    const diffDays = Math.ceil(Math.abs(new Date().getTime() - leadDate?.getTime()) / (1000 * 60 * 60 * 24));
    return matchesSearch && matchesStatus && diffDays <= filterDays;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10 bg-[#FAFBFF] min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-4">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Outreach Analytics</h1>
        <div className="flex flex-wrap gap-3">
            <select className="px-4 py-2 bg-white border rounded-xl font-bold text-sm shadow-sm outline-none" onChange={(e) => setFilterDays(Number(e.target.value))}>
              <option value="0">All Time</option>
              <option value="1">Today</option>
              <option value="7">Last 7 Days</option>
            </select>
            <button onClick={() => setShowArchived(!showArchived)} className={`px-4 py-2 rounded-xl font-bold text-sm border ${showArchived ? 'bg-black text-white' : 'bg-white text-gray-600'}`}>
              {showArchived ? 'Show Active' : 'Archived'}
            </button>
            <input type="text" placeholder="Search leads..." className="px-4 py-2 border rounded-xl text-sm outline-none focus:border-blue-400" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <StatCard title="Total Leads" value={filteredLeads.length} icon={<Users className="text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Opened" value={filteredLeads.filter(l => l.open_count > 0).length} icon={<Eye className="text-purple-600" />} color="bg-purple-50" />
        <StatCard title="Hot Leads" value={filteredLeads.filter(l => l.open_count > 3).length} icon={<AlertCircle className="text-red-600" />} color="bg-red-50" />
        {/* বাউন্স মেট্রিক কার্ড */}
        <StatCard 
            title="Bounced/Spam" 
            value={filteredLeads.filter(l => ['bounced', 'spam', 'invalid'].includes(l.delivery_status || l.status || '')).length} 
            icon={<AlertTriangle className="text-orange-600" />} 
            color="bg-orange-50" 
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[35px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-50">
            <tr>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Lead Details</th>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Delivery & Tracking</th>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Step</th>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-blue-50/10 cursor-pointer group" onClick={() => setSelectedLead(lead)}>
                <td className="p-5">
                  <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{lead.name || lead.email.split('@')[0]}</p>
                  <p className="text-xs text-gray-400 mb-1">{lead.email}</p>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${getInterestStyle(lead.open_count)}`}>
                    Opens: {lead.open_count}
                  </span>
                </td>

                <td className="p-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-black border uppercase ${getDeliveryBadge(lead.delivery_status || lead.status || '')}`}>
                        {lead.delivery_status || lead.status || 'Sent'}
                      </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                        <Inbox size={12} className={lead.open_count > 0 ? "text-green-500" : "text-gray-300"} />
                        {lead.open_count > 0 ? 'Opened' : (['bounced', 'invalid', 'spam'].includes(lead.delivery_status || lead.status || '') ? 'Undelivered' : 'Pending')}
                      </div>
                    </div>

                    {lead.device_info && lead.device_info.length > 0 ? (
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-700">
                          <MapPin size={11} className="text-red-500" />
                          {lead.device_info[lead.device_info.length - 1].location}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          {lead.device_info[lead.device_info.length - 1].device.toLowerCase().includes('mobile') ? 
                            <Smartphone size={11} /> : <Globe size={11} />
                          }
                          {lead.device_info[lead.device_info.length - 1].device.split('(')[0]}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic">
                        {['bounced', 'invalid'].includes(lead.delivery_status || lead.status || '') ? 'Delivery Failed' : 'Waiting for tracking...'}
                      </span>
                    )}
                  </div>
                </td>

                <td className="p-5">
                  <div className="bg-gray-100 w-fit px-3 py-1 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                    Step {lead.follow_up_count || 0}
                  </div>
                </td>

                <td className="p-5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => toggleArchive(lead.id, lead.status || 'active')} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-black hover:text-white transition-all">
                      <Archive size={16} />
                    </button>
                    <button onClick={() => handleDelete(lead.id)} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Intelligence Drawer --- */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-all">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Communication Intelligence</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedLead.email}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            {/* বাউন্স নোটিফিকেশন অ্যালার্ট (ড্রয়ারের ভেতরে) */}
            {['bounced', 'invalid', 'spam'].includes(selectedLead.delivery_status || selectedLead.status || '') && (
                <div className="mb-8 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                    <div>
                        <p className="text-sm font-black text-red-600 uppercase">Delivery Failure Detected</p>
                        <p className="text-xs text-red-500 font-medium">
                            {selectedLead.bounceReason || "This email address is invalid or has blocked our servers. Automation has been paused for this lead."}
                        </p>
                    </div>
                </div>
            )}

            {/* Sent Messages History */}
            <section className="mb-10">
              <h3 className="flex items-center gap-2 font-black text-gray-900 mb-5 text-sm uppercase">
                <Send size={16} className="text-blue-500"/> Sent Sequences
              </h3>
              <div className="space-y-4">
                {[...Array(selectedLead.follow_up_count || 0)].map((_, i) => (
                  <div key={i} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between mb-3 items-center">
                      <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase">Step {i+1}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest italic ${['bounced', 'invalid'].includes(selectedLead.delivery_status || '') ? 'text-red-400' : 'text-gray-400'}`}>
                        {['bounced', 'invalid'].includes(selectedLead.delivery_status || '') ? 'Failed' : 'Delivered'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed bg-white p-4 rounded-xl border border-gray-50 font-medium">
                      {getStepContent(selectedLead.service || 'Default', i+1)}
                    </div>
                  </div>
                ))}
                {selectedLead.follow_up_count === 0 && <p className="text-gray-400 text-xs italic">No follow-up messages sent yet.</p>}
              </div>
            </section>

            {/* Next Scheduled Message */}
            {selectedLead.status !== 'finished' && !['bounced', 'invalid', 'spam'].includes(selectedLead.delivery_status || selectedLead.status || '') && (
              <section className="mb-10">
                <h3 className="flex items-center gap-2 font-black text-gray-900 mb-5 text-sm uppercase">
                  <Calendar size={16} className="text-orange-500"/> Next Follow-up Plan
                </h3>
                <div className="p-6 bg-orange-50/50 rounded-3xl border-2 border-dashed border-orange-200">
                  <span className="text-[10px] font-black text-orange-600 uppercase mb-2 block tracking-widest">Upcoming Step { (selectedLead.follow_up_count || 0) + 1 }</span>
                  <div className="text-xs text-gray-700 leading-relaxed font-medium">
                    {getStepContent(selectedLead.service || 'Default', (selectedLead.follow_up_count || 0) + 1)}
                  </div>
                </div>
              </section>
            )}

            {/* Live Tracking Logs */}
            <section>
              <h3 className="flex items-center gap-2 font-black text-gray-900 mb-5 text-sm uppercase">
                <Activity size={16} className="text-green-500"/> Tracking Activity
              </h3>
              <div className="space-y-3">
                {selectedLead.device_info?.slice().reverse().map((log: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-50 rounded-xl">
                        {log.device.toLowerCase().includes('mobile') ? <Smartphone size={16} className="text-gray-400"/> : <Globe size={16} className="text-gray-400"/>}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800">{log.location}</p>
                        <p className="text-[10px] text-gray-400">{log.device.split('(')[0]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-blue-600 uppercase block">Opened Email</span>
                      <span className="text-[9px] text-gray-300 font-bold uppercase">{log.ip}</span>
                    </div>
                  </div>
                )) || <p className="text-gray-400 text-xs italic">No activity logged yet.</p>}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}