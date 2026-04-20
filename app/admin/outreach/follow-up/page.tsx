"use client"
import React, { useState, useEffect } from 'react'
import { db } from '../../../lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore'
import { Save, Loader2, Plus, Trash2, Mail, ChevronDown, ChevronUp, Target, MousePointer2, Database, UserPlus, AlertCircle, Layers, Clock } from 'lucide-react'
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
          // নিশ্চিত করা হচ্ছে যে সব ক্যাটাগরি এবং স্টেপ উপস্থিত আছে
          const mergedData = { ...categoryVariants, ...fetchedData };
          setCategoryVariants(mergedData);
        }
        
        const q = query(collection(db, "outreach_leads"), where("status", "in", ["interested", "opened"]));
        const snapshot = await getDocs(q);
        setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []); // শুধু একবার লোড হবে

  // নিরাপদ ডাটা রিডিং লজিক
  const currentTabSettings = categoryVariants[activeTab] || {};
  const currentCategoryData = currentTabSettings[activeStep] || { variants: [{ id: 'V1', content: "" }], delay: 1440 };
  const currentVariants = currentCategoryData.variants || [];
  const currentCategoryLeads = leads.filter(l => (l.service || 'Email Signature') === activeTab);

  const days = Math.floor((currentCategoryData.delay || 1440) / 1440);

  const getEmailsForVariant = (variantId: string) => {
    const validVariants = currentVariants.filter((v: any) => v && v.content && v.content.trim() !== "");
    const vIndex = validVariants.findIndex((v: any) => v.id === variantId);
    if (vIndex === -1) return [];
    return currentCategoryLeads.filter((_, index) => index % validVariants.length === vIndex);
  };

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
    if (filteredVariants.length === 0) return alert("Please write something!");

    setSaving(true);
    try {
      await setDoc(doc(db, "automation_settings", "followup_config"), categoryVariants);
      const batchPromises = currentCategoryLeads.map((lead, index) => {
        const assignedVariantId = filteredVariants[index % filteredVariants.length].id; 
        return updateDoc(doc(db, "outreach_leads", lead.id), { 
          [`${activeStep}AssignedVariant`]: assignedVariantId, 
          [`${activeStep}Delay`]: currentCategoryData.delay,
          followUpReady: true 
        });
      });
      await Promise.all(batchPromises);
      setHasUnsavedChanges(false);
      alert(`✅ ${activeTab} ${activeStep.toUpperCase()} Synced!`);
    } catch (error) { 
      console.error(error); 
      alert("Save failed!");
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFBFF]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10 bg-[#FAFBFF] min-h-screen pb-40">
      {/* Services Tabs */}
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
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-[22px] font-black text-xs hover:bg-blue-700 shadow-lg transition-all active:scale-95">
          <Plus size={18} /> ADD NEW VARIANT
        </button>
      </div>

      {/* Step Switcher & Day Input */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex items-center gap-2 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
          {STEPS.map((step, idx) => (
            <button key={step} onClick={() => setActiveStep(step)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] tracking-tighter transition-all whitespace-nowrap ${activeStep === step ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
              <Layers size={14} /> F-{idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 border-r border-gray-100 pr-4">
            <Clock size={18} className="text-blue-500" />
            <span className="text-[11px] font-black text-gray-500 uppercase tracking-tighter">Follow-up After:</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              min="1" 
              value={days} 
              onChange={(e) => {
                const d = parseInt(e.target.value) || 1;
                updateGlobalState({ ...currentCategoryData, delay: d * 1440 });
              }}
              className="w-12 bg-blue-50 rounded-xl py-1.5 text-center text-sm font-black text-blue-700 focus:ring-2 focus:ring-blue-200 outline-none" 
            />
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Days</span>
          </div>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="mb-6 flex items-center gap-3 bg-orange-50 border border-orange-200 p-4 rounded-3xl animate-pulse">
            <AlertCircle className="text-orange-500" size={20} />
            <p className="text-orange-700 text-[10px] font-black uppercase">Unsaved changes in {activeTab} ({activeStep})</p>
        </div>
      )}

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {currentVariants.map((variant: any, index: number) => {
          if (!variant) return null;
          const targetEmails = getEmailsForVariant(variant.id);
          return (
            <div key={variant.id} className="bg-white rounded-[40px] shadow-xl border border-gray-50 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <span className="text-[10px] font-black px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full uppercase tracking-widest">
                  {activeStep.toUpperCase()} - VARIATION {index + 1}
                </span>
                <button onClick={() => {
                  const updatedVars = currentVariants.filter((v: any) => v.id !== variant.id);
                  updateGlobalState({ ...currentCategoryData, variants: updatedVars });
                }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>

              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="modern-editor-wrapper rounded-3xl border-2 border-gray-100 overflow-hidden focus-within:border-blue-500 transition-all bg-gray-50">
                  <EditorProvider>
                    <Toolbar className="bg-white border-b border-gray-100 p-2 flex gap-1 flex-wrap items-center">
                      <BtnBold /> <BtnItalic /> <BtnUnderline /> <BtnStrikeThrough />
                      <span className="w-px h-6 bg-gray-200 mx-1"></span>
                      <BtnNumberedList /> <BtnBulletList />
                      <span className="w-px h-6 bg-gray-200 mx-1"></span>
                      <BtnLink />
                      <BtnClearFormatting />
                      <button type="button" onClick={() => {
                        const updatedVars = currentVariants.map((v: any) => v.id === variant.id ? { ...v, content: (v.content || "") + " {name}" } : v);
                        updateGlobalState({ ...currentCategoryData, variants: updatedVars });
                      }} className="ml-auto flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase">
                        <UserPlus size={12} /> {`{Name}`}
                      </button>
                    </Toolbar>
                    <Editor 
                      value={variant.content || ""} 
                      onChange={(e: any) => {
                        const updatedVars = currentVariants.map((v: any) => v.id === variant.id ? { ...v, content: e.target.value } : v);
                        updateGlobalState({ ...currentCategoryData, variants: updatedVars });
                      }} 
                      className="min-h-[250px] p-5 bg-transparent outline-none text-gray-800 font-medium email-editor-content"
                    />
                  </EditorProvider>
                </div>
                
                <button onClick={() => setShowEmails(showEmails === variant.id ? null : variant.id)} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-[22px] border border-gray-100 hover:bg-gray-100 transition-colors">
                  <span className="text-[10px] font-black text-gray-600 uppercase flex items-center gap-2"><Mail size={14} /> Potential Leads ({targetEmails.length})</span>
                  {showEmails === variant.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
                {showEmails === variant.id && (
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1 p-2 bg-white rounded-xl border border-gray-100 text-[9px] shadow-inner">
                    {targetEmails.length > 0 ? targetEmails.map((l: any, i: number) => (
                      <div key={i} className="flex justify-between p-2 border-b border-gray-50 last:border-0 hover:bg-blue-50 rounded-lg">
                        <span className="font-bold text-gray-700">{l.email}</span>
                        <span className="text-orange-500 font-black">Opens: {l.open_count || 0}</span>
                      </div>
                    )) : <p className="text-center py-2 text-gray-400 font-bold">No leads assigned to this variant yet</p>}
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
          className={`w-full p-5 rounded-[30px] font-black text-base shadow-2xl transition-all flex items-center justify-center gap-3 border-4 border-white ${hasUnsavedChanges ? 'bg-blue-600 text-white scale-105 shadow-blue-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {hasUnsavedChanges ? `SYNC ALL ${activeStep.toUpperCase()} SETTINGS` : `EVERYTHING SYNCED`}</>}
        </button>
      </div>

      <style jsx global>{`
        .rsw-editor { border: none !important; background: transparent !important; }
        .rsw-toolbar { background: white !important; border: none !important; padding: 10px !important; }
        .email-editor-content { color: #1e293b !important; line-height: 1.6 !important; }
        .email-editor-content a { color: #2563eb !important; text-decoration: underline !important; font-weight: 700 !important; }
        .email-editor-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
        .email-editor-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
      `}</style>
    </div>
  )
}