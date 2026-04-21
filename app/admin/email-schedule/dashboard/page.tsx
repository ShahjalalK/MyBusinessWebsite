"use client"
import React, { useState, useEffect } from 'react'
import { db } from '../../../lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { Mail, Clock, CheckCircle2, Trash2, X, Eye, Calendar, LayoutDashboard, User } from 'lucide-react'
import AdminGuard from '@/app/components/AdminGuard'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<any>(null)

  useEffect(() => {
    const q = query(collection(db, "outreach_leads"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (e: React.MouseEvent, lead: any) => {
    e.stopPropagation(); 
    const confirmMessage = lead.status === 'scheduled' 
      ? "This email is scheduled. Do you want to cancel it from Brevo and delete the record?"
      : "Are you sure you want to delete this record?";

    if (window.confirm(confirmMessage)) {
      try {
        if (lead.status === 'scheduled' && lead.originalMessageId) {
          const res = await fetch(`/api/send-email?messageId=${lead.originalMessageId}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (!data.success) console.error("Brevo Cancel Error:", data.error);
        }
        await deleteDoc(doc(db, "outreach_leads", lead.id));
        if (selectedLead?.id === lead.id) setSelectedLead(null);
      } catch (error) {
        alert("Error deleting record.");
      }
    }
  };

  return (
   <>
   <Navbar />

<AdminGuard>
     <div className="max-w-7xl mx-auto p-6 lg:p-10 bg-[#FAFBFF] min-h-screen">
      {/* List Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
          <LayoutDashboard size={36} className="text-blue-600" /> Outreach Log.
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {leads.map((lead) => {
            // Check korchi somoy par hoyeche ki na
            const isPast = lead.scheduledAt ? new Date(lead.scheduledAt) <= new Date() : true;
            const displayStatus = lead.status === 'scheduled' && !isPast ? 'scheduled' : 'sent';

            return (
              <div 
                key={lead.id} 
                onClick={() => setSelectedLead(lead)}
                className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${displayStatus === 'scheduled' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>
                      {displayStatus === 'scheduled' ? <Clock size={24} /> : <CheckCircle2 size={24} />}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                        {lead.name} <span className="text-[10px] text-gray-400 font-normal px-2 py-0.5 bg-gray-50 rounded-md uppercase">{lead.business_type}</span>
                      </h3>
                      <p className="text-gray-400 text-sm font-medium flex items-center gap-1"><Mail size={12} /> {lead.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Schedule Time Display */}
                    <div className="hidden md:flex flex-col items-end">
                      <p className="text-[10px] font-black text-gray-300 uppercase">Time Details</p>
                      <p className="text-xs font-bold text-blue-600">
                        {lead.scheduledAt ? new Date(lead.scheduledAt).toLocaleString() : 'Sent Now'}
                      </p>
                    </div>

                    {/* Dynamic Status Badge */}
                    <div className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                      displayStatus === 'scheduled' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {displayStatus}
                    </div>

                    <button onClick={(e) => handleDelete(e, lead)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* --- Message Preview Modal --- */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-gray-900">{selectedLead.name}</h2>
                <p className="text-gray-400 font-medium">{selectedLead.email}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 bg-gray-50 rounded-2xl"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Subject Line</label>
                {/* Ekhane thikmoto field name check korun */}
                <p className="text-lg font-bold text-gray-800 mt-1">{selectedLead.subject || "No Subject Found"}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Message Body</label>
                <div className="mt-2 p-6 bg-gray-50 rounded-3xl text-gray-600 whitespace-pre-wrap font-medium text-sm border border-gray-100">
                  {/* message field-ti ekhane dekhabe */}
                  {selectedLead.message || "No Message Body Found"}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 flex justify-end gap-3">
              <button onClick={() => setSelectedLead(null)} className="px-8 py-3 bg-black text-white rounded-2xl font-black text-sm">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
   </AdminGuard>

   <Footer />
   
   </>
  )
}