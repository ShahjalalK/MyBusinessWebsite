"use client"
import React, { useState, useEffect } from 'react'
import { db } from '../../lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { Send, Loader2, AlertTriangle, CheckCircle2, User, Building2, Mail, ChevronDown } from 'lucide-react'

const SENDERS = [
  { name: "Shahjalal Khan", email: "shahjalal@trackflowpro.com", limit: 50 },
  { name: "Shahjalal Khan", email: "support@trackflowpro.com", limit: 50 },
  { name: "Shahjalal Khan", email: "contact@trackflowpro.com", limit: 50 },
  { name: "Shahjalal Khan", email: "admin@trackflowpro.com", limit: 50 },
];

export default function OutreachPage() {
  const [email, setEmail] = useState('')
  const [clientName, setClientName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [senderCounts, setSenderCounts] = useState<{ [key: string]: number }>({})
  const [selectedSender, setSelectedSender] = useState<string>('') 

  // ১. মাউন্ট হওয়ার সময় localStorage থেকে সেভ করা ইমেইল লোড করা
  useEffect(() => {
    const savedSender = localStorage.getItem('outreach_selected_sender');
    if (savedSender) {
      setSelectedSender(savedSender);
    }
  }, []);

  // ২. যখনই সেন্ডার চেঞ্জ হবে, তা localStorage-এ সেভ করে রাখা
  const handleSenderChange = (email: string) => {
    setSelectedSender(email);
    localStorage.setItem('outreach_selected_sender', email);
  };

  // ৩. আজকের পাঠানো ইমেইল কাউন্ট ফেচ করা
  useEffect(() => {
    async function fetchCounts() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const counts: { [key: string]: number } = {};
      
      for (const sender of SENDERS) {
        const q = query(
          collection(db, "outreach_leads"),
          where("sender_email", "==", sender.email),
          where("createdAt", ">=", today)
        );
        const snapshot = await getDocs(q);
        counts[sender.email] = snapshot.size;
      }
      setSenderCounts(counts);

      // যদি localStorage-এ কিছু না থাকে, তবেই অটোমেটিক প্রথমটি সিলেক্ট করবে
      const savedSender = localStorage.getItem('outreach_selected_sender');
      if (!savedSender) {
        const firstAvailable = SENDERS.find(s => (counts[s.email] || 0) < s.limit);
        if (firstAvailable) {
          handleSenderChange(firstAvailable.email);
        }
      }
    }
    fetchCounts();
  }, [loading]);

  const activeSender = SENDERS.find(s => s.email === selectedSender);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSender) return alert("Please select an active sender!");
    if ((senderCounts[activeSender.email] || 0) >= activeSender.limit) {
      return alert("This sender has reached today's limit!");
    }

    setLoading(true);
    setStatus('Launching...');

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            subject, 
            message, 
            sender: activeSender,
            clientName,
            businessType 
        }),
      });

      const data = await res.json();

      if (data.success) {
        await addDoc(collection(db, "outreach_leads"), {
          name: clientName,
          business_type: businessType,
          email: email,
          sender_email: activeSender.email,
          originalMessageId: data.messageId,
          subject: subject,
          open_count: 0,
          follow_up_count: 0,
          status: 'sent',
          createdAt: serverTimestamp(),
          lastFollowUp: null
        });
        setStatus('Success! Message Sent.');
        setEmail(''); setClientName(''); setBusinessType(''); setSubject(''); setMessage('');
      } else {
        setStatus('Failed: ' + (data.error || 'Unknown Error'));
      }
    } catch (error) {
      setStatus('Network Error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
      
      {/* বাম পাশ: হেলথ ট্র্যাকার */}
      <div className="lg:col-span-1 space-y-6">
        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            Sender Health
        </h2>
        {SENDERS.map((s) => {
          const count = senderCounts[s.email] || 0;
          const isDanger = count >= s.limit - 5;
          const isActive = selectedSender === s.email;
          
          return (
            <div 
                key={s.email} 
                onClick={() => handleSenderChange(s.email)}
                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 transform ${isActive ? 'border-blue-500 ring-4 ring-blue-50 bg-white scale-105' : 'border-gray-100 bg-gray-50/50 hover:border-blue-200'} ${isDanger && !isActive ? 'bg-red-50/30' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                    <Mail size={16} />
                </div>
                {isDanger && <AlertTriangle className="text-red-500" size={18} />}
              </div>
              <p className={`font-bold text-sm truncate ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>{s.email}</p>
              <div className="mt-4 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${isDanger ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(count / s.limit) * 100}%` }}></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{count} / {s.limit}</p>
                {isActive && <div className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md font-black uppercase">Active</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ডান পাশ: ফর্ম */}
      <div className="lg:col-span-2 bg-white p-8 lg:p-12 rounded-[45px] shadow-2xl shadow-blue-100/30 border border-gray-50">
        <div className="flex flex-col mb-10">
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">Launch.</h1>
            <p className="text-gray-400 font-medium">Send high-converting personalized outreach.</p>
        </div>

        <form onSubmit={handleSendEmail} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase ml-1 tracking-wider">Prospect Name</label>
                <div className="relative">
                    <User className="absolute left-4 top-4 text-gray-300" size={18} />
                    <input 
                        type="text" placeholder="e.g. Robert Fox" required
                        className="w-full pl-12 p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white text-black transition-all font-medium"
                        value={clientName} onChange={(e) => setClientName(e.target.value)}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase ml-1 tracking-wider">Business Niche</label>
                <div className="relative">
                    <Building2 className="absolute left-4 top-4 text-gray-300" size={18} />
                    <input 
                        type="text" placeholder="e.g. Real Estate" required
                        className="w-full pl-12 p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white text-black transition-all font-medium"
                        value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                    />
                </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase ml-1 tracking-wider">Target Email</label>
            <input 
                type="email" placeholder="client@company.com" required
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white text-black transition-all font-medium"
                value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase ml-1 tracking-wider">Subject Line</label>
            <input 
                type="text" placeholder="Regarding your website tracking..." required
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white text-black transition-all font-bold"
                value={subject} onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase ml-1 tracking-wider">Message</label>
            <textarea 
                placeholder="Write a message that converts..." rows={6} required
                className="w-full p-5 bg-gray-50 rounded-3xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white text-black transition-all resize-none font-medium"
                value={message} onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="pt-4">
              <button 
                type="submit" disabled={loading || !activeSender}
                className="w-full py-5 bg-black text-white rounded-3xl font-black text-lg hover:bg-blue-600 transform hover:-translate-y-1 active:scale-95 transition-all shadow-xl disabled:bg-gray-200 flex justify-center items-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Send Outreach Now</>}
              </button>
          </div>

          {status && (
            <div className="flex justify-center items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mt-4">
                <CheckCircle2 size={14} />
                {status}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}