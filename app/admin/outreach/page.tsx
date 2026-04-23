"use client"
import React, { useState, useEffect } from 'react'
import { db } from '../../lib/firebase'
import { collection, serverTimestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore' 
import { Send, Loader2, CheckCircle2, Image as ImageIcon, AlertCircle, Briefcase, Building2, Globe } from 'lucide-react'
import { 
  Editor, 
  EditorProvider, 
  Toolbar, 
  BtnBold, 
  BtnItalic, 
  BtnUnderline, 
  BtnStrikeThrough, 
  BtnLink, 
  BtnNumberedList, 
  BtnBulletList, 
  BtnClearFormatting 
} from 'react-simple-wysiwyg';
import AdminGuard from '@/app/components/AdminGuard'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'

const SENDERS = [
  { name: "Shahjalal Khan", email: "shahjalal@trackflowpro.com", limit: 50 },
  { name: "Shahjalal Khan", email: "support@trackflowpro.com", limit: 50 },
  { name: "Shahjalal Khan", email: "contact@trackflowpro.com", limit: 50 },
  { name: "Shahjalal Khan", email: "admin@trackflowpro.com", limit: 50 },
];

const SERVICES = [
  "Email Signature",
  "Google Ads",
  "Server Side Tracking"
];

export default function OutreachPage() {
  const [email, setEmail] = useState('')
  const [clientName, setClientName] = useState('')
  const [companyName, setCompanyName] = useState('') 
  const [website, setWebsite] = useState('') // New Website State
  const [businessType, setBusinessType] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('') 
  const [scheduledTime, setScheduledTime] = useState('') 
  const [selectedService, setSelectedService] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [senderCounts, setSenderCounts] = useState<{ [key: string]: number }>({})
  const [selectedSender, setSelectedSender] = useState<string>('') 
  const [minDateTime, setMinDateTime] = useState('')
  const [emailError, setEmailError] = useState('')

  useEffect(() => {
    const updateMinTime = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1); 
      setMinDateTime(now.toISOString().slice(0, 16));
    };
    updateMinTime();
    const timer = setInterval(updateMinTime, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedSender = localStorage.getItem('outreach_selected_sender');
    const savedService = localStorage.getItem('outreach_selected_service');
    if (savedSender) setSelectedSender(savedSender);
    if (savedService) setSelectedService(savedService);
  }, []);

  const handleSenderChange = (email: string) => {
    setSelectedSender(email);
    localStorage.setItem('outreach_selected_sender', email);
  };

  const handleServiceChange = (service: string) => {
    setSelectedService(service);
    localStorage.setItem('outreach_selected_service', service);
  };

  const isEmailPatternValid = (inputEmail: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(inputEmail);
  };

  const addImage = () => {
    const url = prompt('Enter Image URL:');
    if (url) {
      const width = prompt('Enter width in % (e.g., 50 or 100):', '100');
      const imgHtml = `<br/><img src="${url}" style="width:${width}%; max-width:100%; height:auto; border-radius:12px; margin:10px 0; display:inline-block;" /><br/>`;
      setMessage((prev) => prev + imgHtml);
    }
  };

  useEffect(() => {
    async function fetchCounts() {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const counts: { [key: string]: number } = {};
      for (const sender of SENDERS) {
        const q = query(collection(db, "outreach_leads"), where("sender_email", "==", sender.email), where("createdAt", ">=", startOfToday));
        const snapshot = await getDocs(q);
        counts[sender.email] = snapshot.size;
      }
      setSenderCounts(counts);
    }
    fetchCounts();
  }, [loading]);

  const activeSender = SENDERS.find(s => s.email === selectedSender);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailPatternValid(email)) { setEmailError('Please enter a valid email address!'); return; }
    if (!selectedService) return alert("Please select a service first!");
    if (!activeSender) return alert("Please select an active sender!");
    
    setLoading(true);
    setStatus('Generating Unique ID...');

    try {
      const uniqueTrackingId = crypto.randomUUID();
      const scheduledAtISO = scheduledTime ? new Date(scheduledTime).toISOString() : null;
      
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            subject, 
            message, 
            sender: activeSender, 
            clientName, 
            companyName,
            website, // API তে পাঠানো হচ্ছে
            businessType, 
            trackingId: uniqueTrackingId,
            scheduledAt: scheduledAtISO 
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        const leadRef = doc(collection(db, "outreach_leads")); 
        
        await setDoc(leadRef, {
          name: clientName, 
          company_name: companyName,
          website: website, // ফায়ারবেসে সেভ হচ্ছে
          business_type: businessType, 
          service: selectedService, 
          email, 
          sender_email: activeSender.email, 
          subject, 
          message, 
          trackingId: uniqueTrackingId,
          originalMessageId: data.messageId,
          status: scheduledAtISO ? 'scheduled' : 'sent', 
          open_count: 0,
          follow_up_count: 0,
          scheduledAt: scheduledAtISO, 
          createdAt: serverTimestamp(),
        });

        setStatus(scheduledAtISO ? 'Success! Email Scheduled.' : 'Success! Message Sent.');
        setEmail(''); setClientName(''); setCompanyName(''); setWebsite(''); setBusinessType(''); setSubject(''); setMessage(''); setScheduledTime('');
      } else {
        setStatus('Failed: ' + (data.error?.message || 'Unknown Error'));
      }
    } catch (error) {
      console.error(error);
      setStatus('Network Error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Navbar />
    <AdminGuard>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-4 gap-8 mt-10 bg-[#FAFBFF] text-slate-900">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              Today's Usage
          </h2>
          {SENDERS.map((s) => {
            const count = senderCounts[s.email] || 0;
            const isActive = selectedSender === s.email;
            const isLimitReached = count >= s.limit;
            return (
              <div key={s.email} onClick={() => handleSenderChange(s.email)}
                  className={`p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${isActive ? 'border-blue-500 bg-white shadow-lg scale-105' : 'border-gray-100 bg-gray-50/50 hover:border-blue-200'} ${isLimitReached ? 'opacity-60 grayscale' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <p className={`font-bold text-xs truncate w-2/3 ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>{s.email}</p>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isLimitReached ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{count}/{s.limit}</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${isLimitReached ? 'bg-red-400' : 'bg-blue-500'}`} style={{ width: `${Math.min((count / s.limit) * 100, 100)}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form Container */}
        <div className="lg:col-span-3 bg-white p-8 lg:p-12 rounded-[45px] shadow-2xl border border-gray-50">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-10">Launch Outreach.</h1>
          <form onSubmit={handleSendEmail} className="space-y-6">
            
            {/* Row 1: Name & Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Client Name *</label>
                <input type="text" placeholder="Prospect Name" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 transition-all font-medium" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              
              <div className="space-y-1 group">
                <label className="text-[10px] font-black text-blue-500 uppercase ml-2 tracking-widest flex items-center gap-1">
                   <Building2 size={10}/> Company Name (Recommended)
                </label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <Building2 size={18} />
                   </div>
                   <input type="text" placeholder="e.g. Acme Corp" className="w-full p-4 pl-12 bg-blue-50/30 rounded-2xl outline-none border border-blue-100/50 focus:border-blue-500 transition-all font-medium" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Row 2: Email & Website */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Target Email *</label>
                <input type="email" placeholder="example@domain.com" required className={`w-full p-4 bg-gray-50 rounded-2xl outline-none border transition-all font-medium ${emailError ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-blue-500'}`} value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }} />
                {emailError && <div className="flex items-center gap-1 text-red-500 text-[10px] font-black mt-2 ml-2 uppercase tracking-tight"><AlertCircle size={12}/> {emailError}</div>}
              </div>

              <div className="space-y-1 group">
                <label className="text-[10px] font-black text-blue-500 uppercase ml-2 tracking-widest flex items-center gap-1">
                   <Globe size={10}/> Website Link (Better Tracking)
                </label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <Globe size={18} />
                   </div>
                   <input type="text" placeholder="www.website.com" className="w-full p-4 pl-12 bg-blue-50/30 rounded-2xl outline-none border border-blue-100/50 focus:border-blue-500 transition-all font-medium" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Row 3: Service Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Service Offered *</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Briefcase size={20} />
                </div>
                <select required className="w-full p-4 pl-12 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 transition-all font-bold text-gray-700 appearance-none cursor-pointer" value={selectedService} onChange={(e) => handleServiceChange(e.target.value)}>
                  <option value="" disabled>Select Targeted Service</option>
                  {SERVICES.map(service => <option key={service} value={service}>{service}</option>)}
                </select>
              </div>
            </div>

            <input type="text" placeholder="Subject Line" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 transition-all font-bold text-lg" value={subject} onChange={(e) => setSubject(e.target.value)} />

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Message Body</label>
              <div className="modern-editor-wrapper rounded-3xl border-2 border-gray-100 overflow-hidden focus-within:border-blue-500 transition-all bg-gray-50">
                <EditorProvider>
                  <Toolbar className="bg-white border-b border-gray-100 p-2 flex gap-1 flex-wrap items-center">
                    <BtnBold /> <BtnItalic /> <BtnUnderline /> <BtnStrikeThrough />
                    <span className="w-px h-6 bg-gray-200 mx-1"></span>
                    <BtnNumberedList /> <BtnBulletList />
                    <span className="w-px h-6 bg-gray-200 mx-1"></span>
                    <BtnLink />
                    <button type="button" onClick={addImage} className="p-1.5 hover:bg-blue-50 rounded-md border border-gray-200 flex items-center justify-center transition-all group">
                      <ImageIcon size={16} className="text-gray-600 group-hover:text-blue-600" />
                    </button>
                    <BtnClearFormatting />
                  </Toolbar>
                  <Editor value={message} onChange={(e: any) => setMessage(e.target.value)} className="min-h-[300px] p-5 bg-transparent outline-none text-gray-800 font-medium email-editor-content" />
                </EditorProvider>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-500 ml-1 uppercase">Schedule Send</span>
                <input type="datetime-local" min={minDateTime} className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl outline-none font-bold text-sm border-2 border-blue-100" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
              </div>
              <button type="submit" disabled={loading || !isEmailPatternValid(email) || !selectedService} className="w-full py-5 rounded-3xl font-black text-lg bg-black text-white hover:bg-blue-600 transition-all shadow-xl flex justify-center items-center gap-3 disabled:bg-gray-300">
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={20} /><span>Send Outreach</span></>}
              </button>
            </div>
            {status && <div className="text-center text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mt-4 flex justify-center items-center gap-2"><CheckCircle2 size={14} />{status}</div>}
          </form>
        </div>
      </div>

      <style jsx global>{`
        .rsw-editor { border: none !important; background: transparent !important; }
        .email-editor-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
        .email-editor-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
      `}</style>
    </AdminGuard>
    <Footer />
    </>
  )
}