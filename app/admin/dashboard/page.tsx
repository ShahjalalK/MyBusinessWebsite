"use client"
import React, { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { 
  Mail, Eye, Clock, CheckCircle, TrendingUp, Users, 
  MousePointer2, AlertCircle, Filter, Search, Globe, Smartphone, ShieldCheck
} from 'lucide-react'

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
  device_info?: DeviceInfo[]; // নতুন ফিল্ড
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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
    return () => unsubscribe();
  }, []);

  const totalLeads = leads.length;
  const openedLeads = leads.filter(l => l.open_count > 0).length;
  const openRate = totalLeads > 0 ? ((openedLeads / totalLeads) * 100).toFixed(1) : 0;
  const highInterest = leads.filter(l => l.open_count > 3).length;

  const filteredLeads = leads.filter(l => 
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10 bg-[#FAFBFF] min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-500 font-medium">Real-time performance of your outreach campaigns.</p>
        </div>
        <div className="flex gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search leads..." 
                    className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Outreach" value={totalLeads} icon={<Users className="text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Total Opens" value={openedLeads} icon={<Eye className="text-purple-600" />} color="bg-purple-50" />
        <StatCard title="Open Rate" value={`${openRate}%`} icon={<TrendingUp className="text-green-600" />} color="bg-green-50" />
        <StatCard title="Hot Leads" value={highInterest} icon={<AlertCircle className="text-orange-600" />} color="bg-orange-50" />
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-[35px] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-black text-gray-800 uppercase tracking-widest text-xs">Campaign Activity</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                LIVE TRACKING
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Prospect Details</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Engagement</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Tracking Info</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Sender</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center font-bold text-gray-300">Loading data...</td></tr>
              ) : filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-blue-50/20 transition-all group">
                  {/* Prospect */}
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${getAvatarColor(lead.open_count)} shadow-inner`}>
                        {lead.name ? lead.name[0] : <Mail size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{lead.name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-400 font-medium">{lead.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold uppercase">{lead.business_type || 'N/A'}</span>
                             <span className="text-[9px] text-gray-300 font-medium">{lead.createdAt?.toDate().toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Engagement */}
                  <td className="p-5">
                    <div className="flex flex-col gap-1">
                        <span className={`w-fit px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${getInterestStyle(lead.open_count)}`}>
                            {getInterestText(lead.open_count)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-gray-700">
                             <Eye size={14} className="text-gray-400" />
                             <span className="text-sm font-black">{lead.open_count}</span>
                        </div>
                    </div>
                  </td>

                 
                    <td className="px-6 py-4">
                      {lead.device_info && lead.device_info.length > 0 ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">
                            {lead.device_info[lead.device_info.length - 1].location}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {lead.device_info[lead.device_info.length - 1].device.includes('Mobi') ? 'Mobile' : 'Desktop'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic flex items-center gap-1">
                          <ShieldCheck size={14} className="opacity-30" /> Waiting...
                        </span>
                      )}
                    </td>

                  {/* Sender Source */}
                  <td className="p-5">
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sent Via</p>
                        <p className="text-xs font-bold text-gray-600 truncate max-w-[120px]">{lead.sender_email.split('@')[0]}</p>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="p-5 text-right">
                    <button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all shadow-sm">
                        <MousePointer2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- Stats Card ---
function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm flex items-center gap-5 hover:translate-y-[-4px] transition-all duration-300">
      <div className={`${color} p-4 rounded-2xl`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">{title}</p>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  )
}

// --- Helper Functions ---
function getInterestText(count: number) {
  if (count === 0) return 'Delivered';
  if (count < 3) return 'Engaged';
  if (count < 6) return 'Warm Interest';
  return '🔥 Hot Lead';
}

function getInterestStyle(count: number) {
  if (count === 0) return 'bg-gray-100 text-gray-500';
  if (count < 3) return 'bg-blue-100 text-blue-600';
  if (count < 6) return 'bg-orange-100 text-orange-600';
  return 'bg-red-100 text-red-600 animate-pulse';
}

function getAvatarColor(count: number) {
  if (count === 0) return 'bg-gray-50 text-gray-300';
  if (count < 3) return 'bg-blue-50 text-blue-500';
  return 'bg-green-50 text-green-500';
}