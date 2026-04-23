"use client"
import React, { useState, useEffect } from 'react'
import { db } from '../../../lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore'
import { Save, Loader2, Plus, Trash2, Mail, ChevronDown, ChevronUp, Target, MousePointer2, Database, UserPlus, AlertCircle, Layers, Clock, Building2, Tag } from 'lucide-react'
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

const SERVICES = [
  { id: 'Email Signature', icon: <MousePointer2 size={18}/> },
  { id: 'Google Ads', icon: <Target size={18}/> },
  { id: 'Server Side Tracking', icon: <Database size={18}/> }
];

const STEPS = ['step1', 'step2', 'step3', 'step4', 'step5'];

export default function FollowUpAutomationPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('Email Signature')
  const [activeStep, setActiveStep] = useState('step1')
  const [leads, setLeads] = useState<any[]>([])
  
  const [categoryVariants, setCategoryVariants] = useState<any>({
    'Email Signature': Object.fromEntries(STEPS.map(s => [s, { variants: [{ id: 'V1', content: "" }], delay: 1440 }])),
    'Google Ads': Object.fromEntries(STEPS.map(s => [s, { variants: [{ id: 'V1', content: "" }], delay: 1440 }])),
    'Server Side Tracking': Object.fromEntries(STEPS.map(s => [s, { variants: [{ id: 'V1', content: "" }], delay: 1440 }]))
  })
  const [showEmails, setShowEmails] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const configDoc = await getDoc(doc(db, "automation_settings", "followup_config"));
        if (configDoc.exists()) {
          const fetchedData = configDoc.data();
          setCategoryVariants(fetchedData);
        }
        
        // শুধু যারা রিপ্লাই দেয়নি এবং অটোমেশন চালু আছে তাদের আনা হচ্ছে
        const q = query(
          collection(db, "outreach_leads"), 
          where("status", "in", ["sent", "opened", "active"]),
          where("stopAutomation", "==", false)
        );
        const snapshot = await getDocs(q);
        setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- স্মার্ট ফিল্টারিং লজিক (API-র ৩০ মিনিট স্লট এবং সঠিক ট্র্যাকিং প্রপার্টি সহ) ---
  const currentCategoryLeads = leads.filter(l => {
    // ১. সার্ভিস চেক
    if ((l.service || 'Email Signature') !== activeTab) return false;
    
    const followUpCount = l.follow_up_count || 0;
    const currentStepIdx = STEPS.indexOf(activeStep);
    
    // ২. স্টেপ চেক (লিড বর্তমানে যে স্টেপে আছে সেটি ম্যাচ করতে হবে)
    if (followUpCount !== currentStepIdx) return false;

    // ৩. F-1 (Step 1) লজিক: ২+ ওপেন এবং ২ মিনিটের ইন্টারভ্যাল
    if (activeStep === 'step1') {
      if ((l.open_count || 0) < 2) return false;
      const history = l.tracking_history || [];
      const openEvents = history.filter((h: any) => h.event === 'opened');

      if (openEvents.length >= 2) {
        const firstMillis = openEvents[0].time?.toMillis ? openEvents[0].time.toMillis() : new Date(openEvents[0].time).getTime();
        const lastMillis = openEvents[openEvents.length - 1].time?.toMillis ? openEvents[openEvents.length - 1].time.toMillis() : new Date(openEvents[openEvents.length - 1].time).getTime();
        
        // ২ মিনিটের গ্যাপ চেক
        if ((lastMillis - firstMillis) / 1000 < 120) return false;
      } else return false;
    }

    // ৪. F2 to F5 লজিক: শেষ ফলোআপ পাঠানোর পর নতুন ওপেন হতে হবে
    if (currentStepIdx > 0) {
      const lastSent = l.lastFollowUp || l.sentAt;
      const lastOpened = l.lastOpenedAt;
      
      if (!lastSent || !lastOpened) return false;

      const lastSentMillis = lastSent.toMillis ? lastSent.toMillis() : new Date(lastSent).getTime();
      const lastOpenedMillis = lastOpened.toMillis ? lastOpened.toMillis() : new Date(lastOpened).getTime();
      
      // ওপেন করার সময় যদি শেষ পাঠানোর সময়ের পরে হয়, তবেই সে যোগ্য
      if (lastOpenedMillis <= lastSentMillis) return false;
    }
    return true;
  });

  const currentTabSettings = categoryVariants[activeTab] || {};
  const currentCategoryData = currentTabSettings[activeStep] || { variants: [{ id: 'V1', content: "" }], delay: 1440 };
  const currentVariants = currentCategoryData.variants || [];
  const days = Math.floor((currentCategoryData.delay || 1440) / 1440);

  const updateGlobalState = (newStepData: any) => {
    setCategoryVariants((prev: any) => ({
      ...prev,
      [activeTab]: { 
        ...(prev[activeTab] || {}), 
        [activeStep]: newStepData 
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    const filteredVariants = currentVariants.filter((v: any) => v.content && v.content.trim() !== "");
    if (filteredVariants.length === 0) return alert("Please add content to variants!");

    setSaving(true);
    try {
      // ১. গ্লোবাল সেটিংস সেভ
      await setDoc(doc(db, "automation_settings", "followup_config"), categoryVariants);
      
      // ২. লিডগুলোর জন্য API বাফার টাইম (Timing Fix) সহ আপডেট
      const batchPromises = currentCategoryLeads.map((lead, index) => {
        const assignedVariantId = filteredVariants[index % filteredVariants.length].id; 
        
        // API বাফার: ১ দিন (১৪৪০ মিনিট) হলে তাকে ২ ঘণ্টা আগে (১৩২০ মিনিট) রেডি করা 
        // যাতে ৩০ মিনিটের স্লট রাউন্ডিং হলেও মেইল ওই দিনেই যায়।
        const adjustedDelay = (currentCategoryData.delay || 1440) - 120; 

        return updateDoc(doc(db, "outreach_leads", lead.id), { 
          [`${activeStep}AssignedVariant`]: assignedVariantId, 
          [`${activeStep}Delay`]: adjustedDelay,
          followUpReady: true // এটি API ট্রিগার পয়েন্ট
        });
      });
      await Promise.all(batchPromises);
      
      setHasUnsavedChanges(false);
      alert(`✅ ${activeTab} ${activeStep.toUpperCase()} Synced & Ready for Send!`);
    } catch (error) { 
      console.error(error); 
      alert("Error syncing settings!");
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#FAFBFF]">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <>
    <Navbar />
    <AdminGuard>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 bg-[#FAFBFF] min-h-screen pb-40">
      
      {/* Service Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-[25px] shadow-sm border border-gray-100">
          {SERVICES.map((s) => (
            <button key={s.id} onClick={() => { setActiveTab(s.id); setActiveStep('step1'); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${activeTab === s.id ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
              {s.icon} {s.id}
            </button>
          ))}
        </div>
        <button onClick={() => updateGlobalState({ ...currentCategoryData, variants: [...currentVariants, { id: `V${Date.now()}`, content: "" }] })} 
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-[22px] font-black text-xs hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
          <Plus size={18} /> ADD VARIANT
        </button>
      </div>

      {/* Step Navigation & Delay */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex items-center gap-2 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
          {STEPS.map((step, idx) => (
            <button key={step} onClick={() => setActiveStep(step)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] tracking-tighter transition-all ${activeStep === step ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
              <Layers size={14} /> F-{idx + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-3xl border border-gray-100 shadow-sm">
          <Clock size={18} className="text-blue-500" />
          <input type="number" min="1" value={days} onChange={(e) => updateGlobalState({ ...currentCategoryData, delay: (parseInt(e.target.value) || 1) * 1440 })}
            className="w-12 bg-blue-50 rounded-xl py-1.5 text-center text-sm font-black text-blue-700 outline-none" />
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Days Gap</span>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {currentVariants.map((variant: any, index: number) => {
          if (!variant) return null;
          const validVariants = currentVariants.filter((v: any) => v && v.content?.trim() !== "");
          const vIndex = validVariants.findIndex((v: any) => v.id === variant.id);
          const targetEmails = vIndex === -1 ? [] : currentCategoryLeads.filter((_, idx) => idx % validVariants.length === vIndex);

          return (
            <div key={variant.id} className="bg-white rounded-[40px] shadow-xl border border-gray-50 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <span className="text-[10px] font-black px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full uppercase tracking-widest">
                  VARIATION {index + 1}
                </span>
                <button onClick={() => updateGlobalState({ ...currentCategoryData, variants: currentVariants.filter((v: any) => v.id !== variant.id) })} className="text-gray-300 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="modern-editor-wrapper rounded-3xl border-2 border-gray-100 overflow-hidden bg-gray-50">
                  <EditorProvider>
                    <Toolbar className="bg-white border-b border-gray-100 p-2 flex gap-1 flex-wrap items-center">
                      <BtnBold /> <BtnItalic /> <BtnUnderline />
                      <span className="w-px h-6 bg-gray-200 mx-1"></span>
                      <div className="ml-auto flex gap-1">
                        <button type="button" onClick={() => updateGlobalState({ ...currentCategoryData, variants: currentVariants.map((v: any) => v.id === variant.id ? { ...v, content: (v.content || "") + " {name}" } : v) })} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase">
                          <UserPlus size={12} className="inline mr-1" /> {`{Name}`}
                        </button>
                        <button type="button" onClick={() => updateGlobalState({ ...currentCategoryData, variants: currentVariants.map((v: any) => v.id === variant.id ? { ...v, content: (v.content || "") + " {company}" } : v) })} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase">
                          <Building2 size={12} className="inline mr-1" /> {`{Company}`}
                        </button>
                      </div>
                    </Toolbar>
                    <Editor value={variant.content || ""} onChange={(e: any) => updateGlobalState({ ...currentCategoryData, variants: currentVariants.map((v: any) => v.id === variant.id ? { ...v, content: e.target.value } : v) })} 
                      className="min-h-[250px] p-5 outline-none text-gray-800 email-editor-content" />
                  </EditorProvider>
                </div>
                
                {/* Leads Toggle */}
                <button onClick={() => setShowEmails(showEmails === variant.id ? null : variant.id)} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-[22px] border border-gray-100">
                  <span className="text-[10px] font-black text-gray-600 uppercase flex items-center gap-2">
                    <Mail size={14} className="text-blue-500" /> Active Leads ({targetEmails.length})
                  </span>
                  {showEmails === variant.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
                
                {showEmails === variant.id && (
                  <div className="mt-2 max-h-40 overflow-y-auto p-2 bg-white rounded-xl border border-gray-100">
                    {targetEmails.length === 0 ? (
                      <p className="text-center py-4 text-gray-400 text-[10px] font-bold uppercase">No matching leads in this step</p>
                    ) : (
                      targetEmails.map((l: any, i: number) => (
                        <div key={i} className="flex flex-col p-2 border-b last:border-0 hover:bg-blue-50">
                          <div className="flex justify-between">
                            <span className="text-[11px] font-bold text-gray-700">{l.email}</span>
                            <span className="text-[9px] text-blue-500 font-black">Opens: {l.open_count || 0}</span>
                          </div>
                          <span className="text-[8px] text-gray-400 font-bold uppercase mt-1">
                             Status: {l.status} | Step: {l.follow_up_count || 0}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sync Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
        <button onClick={handleSaveSettings} disabled={saving || !hasUnsavedChanges} 
          className={`w-full p-5 rounded-[30px] font-black text-base shadow-2xl transition-all flex items-center justify-center gap-3 border-4 border-white ${hasUnsavedChanges ? 'bg-blue-600 text-white scale-105 shadow-blue-300' : 'bg-gray-200 text-gray-400'}`}>
          {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> SYNC {activeStep.toUpperCase()} SETTINGS</>}
        </button>
      </div>

      <style jsx global>{`
        .rsw-editor { border: none !important; background: transparent !important; }
        .email-editor-content { color: #1e293b !important; line-height: 1.6 !important; font-size: 14px; font-weight: 500; }
      `}</style>
    </div>
    </AdminGuard>
    <Footer />
    </>
  )
}