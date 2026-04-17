"use client"
import React, { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { Mail, Eye, Clock, CheckCircle } from 'lucide-react'

interface Lead {
  id: string;
  email: string;
  subject: string;
  open_count: number;
  status: string;
  createdAt: any;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ফায়ারবেস থেকে রিয়েল-টাইম ডাটা নিয়ে আসা
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

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Outreach Dashboard</h1>
        <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full font-bold text-sm">
          Total Leads: {leads.length}
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <p className="text-center py-10 font-bold text-gray-400">Loading data...</p>
        ) : leads.map((lead) => (
          <div key={lead.id} className="bg-white border-2 border-gray-50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-wrap items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-4 rounded-2xl">
                <Mail className="text-gray-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{lead.email}</h3>
                <p className="text-gray-500 text-sm">{lead.subject}</p>
              </div>
            </div>

            <div className="flex gap-10">
              <div className="text-center">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1 justify-center">
                  <Eye size={14} /> Opens
                </p>
                <p className={`text-2xl font-black ${lead.open_count > 0 ? 'text-green-500' : 'text-gray-300'}`}>
                  {lead.open_count}
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1 justify-center">
                  <Clock size={14} /> Status
                </p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.open_count > 2 ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                  {lead.open_count > 2 ? 'High Interest' : 'Followed'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-400 text-sm">
               <CheckCircle size={16} className={lead.status === 'sent' ? 'text-blue-500' : ''} />
               <span>Sent</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}