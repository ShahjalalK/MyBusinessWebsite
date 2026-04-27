"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, User, Mail, ChevronDown, MessageSquare, Sparkles, ArrowRight, CheckCircle2, Loader2, ShieldCheck, Lock, Sparkle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Turnstile from 'react-turnstile' // ১. টার্নস্টাইল ইমপোর্ট

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null); // ২. টোকেন স্টেট
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: 'Google Ads Audit & Strategy',
    message: ''
  });

  const services = [
    "Google Ads Audit & Strategy",
    "GTM Server-Side Tracking",
    "GA4 & Conversion API Setup",
    "Google Ads Account Management",
    "Email Signature Design",
    "Data Tech Consulting"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ৩. ক্যাপচা চেক
    if (!turnstileToken) {
      toast.error("Please complete the security check.");
      return;
    }

    setLoading(true);

    const gaCookie = typeof document !== 'undefined' 
      ? document.cookie.match(/_ga=(?:GA1\.\d\.)?([\d.]+)/)?.[1] 
      : null;
    
    const sessionId = typeof document !== 'undefined'
      ? document.cookie.match(/_ga_Y0XEPCVC6L=GS1\.1\.([\d]+)/)?.[1]
      : null;

    let clientId = gaCookie || localStorage.getItem('ga_client_id');
    if (!clientId) {
      clientId = `${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`;
      localStorage.setItem('ga_client_id', clientId);
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          captchaToken: turnstileToken, // ৪. টোকেন সার্ভারে পাঠানো
          clientId,
          sessionId,
          pageTitle: document.title,
          source: "Contact Page Form"
        }),
      });

      if (response.ok) {
        toast.success('Strategy request sent! I\'ll contact you shortly.');
        setFormData({ name: '', email: '', service: 'Google Ads Audit & Strategy', message: '' });
        setTurnstileToken(null); // ৫. সাকসেস হলে টোকেন রিসেট
      } else {
        throw new Error("Failed to send");
      }
    } catch (error) {
      toast.error('Network issue. Please try again.');
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
            
            {/* Left Column Content */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                   <ShieldCheck size={14} /> Available for New Projects
                </div>
                
                <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter">
                  Stop Guessing. <br />
                  <span className="text-blue-600">Start Tracking.</span>
                </h2>
                
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                  Have a specific tracking issue or need to scale your Google Ads? 
                  Send me your project details for a <span className="text-slate-900 dark:text-white font-bold underline decoration-blue-500/30">complimentary audit.</span>
                </p>

                <div className="grid grid-cols-2 gap-6 pt-4">
                    <div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">24h</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Reply Time</p>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">1-on-1</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Access</p>
                    </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column Content - Form */}
            <div className="lg:col-span-7">
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-14 rounded-[2.5rem] shadow-2xl">
                  
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* ... (Inputs are same as yours) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Client Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="text" required value={formData.name} placeholder="Alex Johnson"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-900 dark:text-white"
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Work Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="email" required value={formData.email} placeholder="alex@company.com"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-900 dark:text-white"
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expertise Select & Message Textarea (Keep your original code here) */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Required Expertise</label>
                      <div className="relative group/select">
                        <select 
                          value={formData.service}
                          className="w-full pl-6 pr-12 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
                          onChange={(e) => setFormData({...formData, service: e.target.value})}
                        >
                          {services.map((service, i) => (
                            <option key={i} value={service}>{service}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDown size={20} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Brief Proposal</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-5 text-slate-300" size={18} />
                        <textarea 
                          required rows={4} value={formData.message} placeholder="Tell me about your tracking setup..."
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-900 dark:text-white resize-none"
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                        ></textarea>
                      </div>
                    </div>

                    {/* ৬. Turnstile Widget Placement */}
                    <div className="flex justify-start">
                      <Turnstile
                        sitekey="YOUR_CLOUDFLARE_SITE_KEY"
                        onVerify={(token) => setTurnstileToken(token)}
                        theme="auto" // আপনার ডার্ক মোড সাপোর্ট করবে
                      />
                    </div>

                    <div className="pt-2">
                        <div className="space-y-4">
                            <motion.button 
                              disabled={loading}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              type="submit"
                              className="w-full bg-[#041f60] hover:bg-blue-800 text-white py-6 rounded-2xl font-black text-xl transition-all flex flex-col items-center justify-center shadow-2xl shadow-blue-900/30 group disabled:opacity-70 relative overflow-hidden"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <div className="flex items-center gap-3">
                                        <Sparkle size={20} className="text-blue-300 animate-pulse" />
                                        Get My Free Strategy Audit
                                        <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                                    </div>
                                )}
                            </motion.button>
                            
                            <p className="text-center text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                                No upfront commitment required. I usually reply within 24 hours.
                            </p>
                        </div>
                    </div>
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