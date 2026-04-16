"use client"
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, User, Mail, ChevronDown, MessageSquare, Sparkles, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: 'Google Ads Management',
    message: ''
  });

  const services = [
    "Google Ads Management",
    "Server-Side Tracking (GA4/GTM)",
    "Meta Ads Conversion API",
    "Email Signature Design",
    "Technical Audit / Consulting"
  ];

  // --- GA4 Tracking Function ---
  const trackLeadInGA4 = async (data: any) => {
    try {
      // ১. আসল গুগল কুকি থেকে Client ID এবং Session ID খোঁজা
      const gaCookie = typeof document !== 'undefined' 
        ? document.cookie.match(/_ga=(?:GA1\.\d\.)?([\d.]+)/)?.[1] 
        : null;
      
      // আপনার Measurement ID অনুযায়ী সেশন কুকি খোঁজা
      const sessionId = typeof document !== 'undefined'
        ? document.cookie.match(/_ga_Y0XEPCVC6L=GS1\.1\.([\d]+)/)?.[1]
        : null;

      let clientId = gaCookie || localStorage.getItem('ga_client_id');
      if (!clientId) {
        clientId = `${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`;
        localStorage.setItem('ga_client_id', clientId);
      }

      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          service: data.service,
          clientId: clientId,
          sessionId: sessionId, // সেশন আইডি পাঠানো হচ্ছে
          pageTitle: document.title // ডাইনামিক পেজ টাইটেল পাঠানো হচ্ছে
        }),
      });
      console.log("GA4 Lead Tracked Successfully with Session:", sessionId);
    } catch (error) {
      console.error("GA4 Tracking Error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // ইমেইল সফলভাবে গেলে GA4-এ ডাটা পাঠানো হবে
        await trackLeadInGA4(formData);
        
        toast.success('Thank you! Message sent successfully.');
        setFormData({ name: '', email: '', service: 'Google Ads Management', message: '' });
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error) {
      toast.error('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="form" className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Background Subtle Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 dark:bg-blue-900/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-10">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <Sparkles size={14} className="animate-pulse" /> Fast Response Guaranteed
                </div>
                
                <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
                  Let’s Build Something <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Extraordinary.</span>
                </h2>
                
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                  Ready to fix your tracking or scale your ads? Fill out the form and I'll get back to you with a custom strategy within 24 hours.
                </p>
              </motion.div>

              {/* Trust Features Cards */}
              <div className="grid gap-4">
                {[
                  { title: "Free Technical Audit", desc: "I'll analyze your current setup for free." },
                  { title: "Strategic Growth", desc: "Data-driven decisions for your business." },
                  { title: "Direct Support", desc: "Work 1-on-1 with me, no middleman." }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="mt-1">
                      <CheckCircle2 size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column: Premium Form Card */}
            <div className="lg:col-span-7">
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-orange-500 opacity-[0.03] dark:opacity-[0.07] rounded-[3rem] blur-2xl group-hover:opacity-[0.05] dark:group-hover:opacity-[0.1] transition-opacity"></div>

                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none">
                  <form onSubmit={handleSubmit} className="space-y-7">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                        <div className="group/input relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                          <input 
                            type="text" 
                            required
                            value={formData.name}
                            placeholder="Your name"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-900 dark:text-white"
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                        <div className="group/input relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                          <input 
                            type="email" 
                            required
                            value={formData.email}
                            placeholder="hello@company.com"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-900 dark:text-white"
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">What can I help you with?</label>
                      <div className="relative group/select">
                        <select 
                          value={formData.service}
                          className="w-full pl-16 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
                          onChange={(e) => setFormData({...formData, service: e.target.value})}
                        >
                          {services.map((service, i) => (
                            <option key={i} value={service}>{service}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Project Details</label>
                      <div className="relative group/input">
                        <MessageSquare className="absolute left-4 top-5 text-slate-300 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                        <textarea 
                          required
                          rows={4}
                          value={formData.message}
                          placeholder="Tell me about your project or goals..."
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-900 dark:text-white resize-none"
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                        ></textarea>
                      </div>
                    </div>

                    <motion.button 
                      disabled={loading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full bg-[#041f60] hover:bg-blue-800 text-white py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 group disabled:opacity-70 cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <>
                          Send Message 
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ArrowRight size={18} />
                          </div>
                        </>
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