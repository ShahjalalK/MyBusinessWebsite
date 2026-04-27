"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ShieldCheck, Mail, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import Turnstile from 'react-turnstile' 

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null); 

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    // ১. ক্যাপচা চেক
    if (!turnstileToken) {
      setStatus('error');
      setMessage("Please complete the security check.");
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          captchaToken: turnstileToken // ২. সার্ভারে টোকেন পাঠানো হচ্ছে
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage("Success! Welcome to the TrackFlowPro community.");
        setEmail(""); 
        setTurnstileToken(null); // টোকেন রিসেট
      } else {
        throw new Error(data.error || "Something went wrong");
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || "Subscription failed. Please try again.");
    }
  };

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto relative overflow-hidden bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-16 shadow-2xl border border-slate-100 dark:border-slate-800">
          
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs mb-4">
                <Sparkles size={16} /> Stay Updated
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                Get Actionable <br />
                <span className="text-blue-600">Marketing Tips</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-lg">
                Join our newsletter to receive practical tips on Google Ads, tracking, and data-driven growth strategies.
              </p>
            </div>

            <div className="w-full md:w-[400px]">
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input 
                    type="email" 
                    required
                    disabled={status === 'loading' || status === 'success'}
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-blue-600 dark:focus:border-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all placeholder:text-slate-400 disabled:opacity-50"
                  />
                </div>

                {/* ৩. Turnstile Widget - ENV Variable ব্যবহার করা হয়েছে */}
                <div className="flex justify-center md:justify-start">
                  <Turnstile
                    sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} 
                    onVerify={(token) => setTurnstileToken(token)}
                    theme="light" 
                    refresh-expired="auto"      // টোকেন শেষ হয়ে গেলে নিজে নিজে নতুন টোকেন নেবে
                    onExpire={() => setTurnstileToken(null)} // এক্সপায়ার হলে টোকেন স্টেট খালি করে দেবে
                    onError={() => setTurnstileToken(null)}
                  />
                </div>

                <motion.button 
                  disabled={status === 'loading' || status === 'success'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black shadow-lg transition-all group ${
                    status === 'success' ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                  }`}
                >
                  {status === 'loading' ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : status === 'success' ? (
                    <>Subscribed <CheckCircle2 size={20} /></>
                  ) : (
                    <>Subscribe Now <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                  )}
                </motion.button>

                <AnimatePresence>
                  {(status === 'error' || status === 'success') && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`text-xs font-bold text-center mt-2 ${status === 'error' ? 'text-red-500' : 'text-emerald-500'}`}
                    >
                      {message}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>No spam. Only high-value insights.</span>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}