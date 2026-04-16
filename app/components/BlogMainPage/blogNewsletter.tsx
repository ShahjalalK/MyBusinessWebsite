"use client"
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, ShieldCheck, Mail, Sparkles } from 'lucide-react'

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e : any) => {
    e.preventDefault();
    // এখানে আপনার ইমেল সাবস্ক্রিপশন লজিক (যেমন: Mailchimp বা API) যোগ করতে পারেন
    console.log("Subscribed:", email);
    alert("Thank you for subscribing, Jalal!");
  };

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto relative overflow-hidden bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-16 shadow-2xl border border-slate-100 dark:border-slate-800">
          
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            
            {/* Left Side: Text Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs mb-4">
                <Sparkles size={16} /> Stay Updated
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                Get Actionable <br />
                <span className="text-blue-600">Marketing Tips</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Join our newsletter to receive practical tips on Google Ads, tracking, and data-driven growth strategies.
              </p>
            </div>

            {/* Right Side: Input Form */}
            <div className="w-full md:w-[400px]">
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input 
                    type="email" 
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-blue-600 dark:focus:border-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                  />
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black shadow-lg shadow-blue-500/20 transition-all group"
                >
                  Subscribe Now <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </motion.button>

                {/* Small Note */}
                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mt-4">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>No spam. Only useful insights.</span>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}