"use client"
import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, ChevronDown, MessageSquare, ArrowRight, Loader2, ShieldCheck, Sparkle, Globe, Paperclip, X, FileText } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Turnstile from 'react-turnstile'

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    service: 'Google Ads Audit & Strategy',
    message: ''
  });

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const services = [
    "Google Ads Audit & Strategy",
    "GTM Server-Side Tracking",
    "GA4 & Conversion API Setup",
    "Google Ads Account Management",
    "Email Signature Design",
    "Data Tech Consulting"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error("File is too large! Please upload under 2MB.");
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('pdf');
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      toast.error("Please complete the security check.");
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('website', formData.website);
    data.append('service', formData.service);
    data.append('message', formData.message);
    data.append('captchaToken', turnstileToken);
    
    if (file) {
      data.append('file', file);
    }

    // --- ট্র্যাকিং ডাটা সংগ্রহ এবং সংযুক্তি ---
    // ১. Google Analytics Client ID সংগ্রহ
    const gaCookie = typeof document !== 'undefined' ? document.cookie.match(/_ga=(?:GA1\.\d\.)?([\d.]+)/)?.[1] : null;
    
    // ২. GA4 Session ID সংগ্রহ (আপনার Measurement ID অনুযায়ী কুকি নাম ভিন্ন হতে পারে, তাই একটি ফলব্যাক রাখা হয়েছে)
    const sidCookie = typeof document !== 'undefined' ? document.cookie.match(/_ga_[A-Z0-9]+=(?:GS1\.\d\.)?([\d.]+)/)?.[1] : null;

    data.append('clientId', gaCookie || "");
    data.append('sessionId', sidCookie || Date.now().toString()); // কুকি না থাকলে টাইমস্ট্যাম্প ব্যাকআপ
    data.append('pageTitle', typeof document !== 'undefined' ? document.title : "Contact Page");
    // --------------------------------------

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: data, 
      });

      if (response.ok) {
        toast.success('Strategy request sent! Check your email.');
        setFormData({ name: '', email: '', website: '', service: 'Google Ads Audit & Strategy', message: '' });
        removeFile();
        setTurnstileToken(null);
        // টার্নস্টাইল রিসেট করার জন্য উইন্ডো রিলোড বা স্পেসিফিক মেথড ব্যবহার করা যায়, আপাতত সাকসেস মেসেজই যথেষ্ট।
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send");
      }
    } catch (error: any) {
      toast.error(error.message || 'Network issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="form" className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      <Toaster position="bottom-right" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
            
            {/* Left Content */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                   <ShieldCheck size={14} /> Available for New Projects
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter">
                  Stop Guessing. <br />
                  <span className="text-blue-600">Start Tracking.</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                  Have a specific tracking issue? Send me your details for a <span className="text-slate-900 dark:text-white font-bold underline decoration-blue-500/30">complimentary audit.</span>
                </p>
              </motion.div>
            </div>

            {/* Right Column - Form */}
            <div className="lg:col-span-7">
              <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] blur opacity-20"></div>

                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-14 rounded-[2.5rem] shadow-2xl">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Client Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="text" required value={formData.name} placeholder="Alex Johnson"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Work Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="email" required value={formData.email} placeholder="alex@company.com"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Website URL (Optional)</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="url" value={formData.website} placeholder="https://www.yourbusiness.com"
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
                          onChange={(e) => setFormData({...formData, website: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Required Expertise</label>
                      <div className="relative">
                        <select value={formData.service}
                          className="w-full pl-6 pr-12 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
                          onChange={(e) => setFormData({...formData, service: e.target.value})}
                        >
                          {services.map((service, i) => (
                            <option key={i} value={service}>{service}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={20} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Brief Proposal</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-5 text-slate-300" size={18} />
                        <textarea required rows={4} value={formData.message} placeholder="Tell me about your tracking setup..."
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white resize-none"
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                        ></textarea>
                      </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Attachments (Logo/Audit PDF - Max 2MB)</label>
                      <div className="flex items-center gap-4">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-colors text-slate-500 font-bold text-sm">
                          <Paperclip size={18} /> {file ? "Change File" : "Add File"}
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                        
                        <AnimatePresence>
                          {previewUrl && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative group">
                              {previewUrl === 'pdf' ? (
                                <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                  <FileText size={24} />
                                </div>
                              ) : (
                                <img src={previewUrl} alt="Preview" className="h-12 w-12 rounded-lg object-cover border-2 border-blue-500" />
                              )}
                              <button onClick={removeFile} type="button" className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={12} />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <Turnstile 
                        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} 
                        onVerify={(token) => setTurnstileToken(token)} 
                        theme="auto" 
                      />
                    </div>

                    <motion.button disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit"
                      className="w-full bg-[#041f60] hover:bg-blue-800 text-white py-6 rounded-2xl font-black text-xl transition-all flex items-center justify-center shadow-2xl shadow-blue-900/30 group disabled:opacity-70"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : (
                        <div className="flex items-center gap-3">
                          <Sparkle size={20} className="text-blue-300 animate-pulse" />
                          Get My Free Audit
                          <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                      )}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}