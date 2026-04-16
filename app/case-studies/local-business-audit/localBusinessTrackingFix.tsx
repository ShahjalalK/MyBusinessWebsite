"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Database, 
  Target, 
  LineChart, 
  Search,
  Server,
  MousePointer2
} from 'lucide-react';

export default function LeadTrackingCaseStudy() {
  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      
      {/* 1. Hero Section */}
      <section className="pt-16 pb-20 lg:pt-20 lg:pb-32 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-8 border border-blue-100 dark:border-blue-800"
          >
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Google Ads Optimization</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.9]">
            Improving Lead Tracking with <br />
            <span className="text-blue-600 italic">Server-Side Setup.</span>
          </h1>
          
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
            Reducing data loss and improving conversion accuracy using GTM Server-Side architecture for better business growth.
          </p>
        </div>
      </section>

      {/* 2. Overview Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-4">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                Project <span className="text-blue-600">Overview</span>
              </h2>
            </div>
            <div className="lg:col-span-8">
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                This is a demo implementation designed to showcase how <span className="text-blue-600 font-bold">server-side tracking using Google Tag Manager (GTM)</span> can improve data accuracy and reduce tracking loss in digital advertising campaigns. Many businesses rely only on browser-based tracking, which often leads to missing or inaccurate conversion data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Problem Section */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-wrap items-center -mx-6">
            <div className="w-full lg:w-1/2 px-6 mb-12 lg:mb-0">
              <div className="p-10 bg-red-50 dark:bg-red-950/20 rounded-[3rem] border border-red-100 dark:border-red-900/30">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
                  The <span className="text-red-600">Problem.</span>
                </h3>
                <div className="space-y-4">
                  {[
                    "Browser restrictions (Safari / iOS updates)",
                    "Ad blockers preventing script execution",
                    "3rd Party Cookie limitations",
                    "JavaScript execution loss on slow connections"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2 px-6">
              <div className="lg:pl-12">
                <span className="text-red-600 font-black uppercase tracking-widest text-xs mb-4 block">Negative Impact</span>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">As a result, businesses experience:</h2>
                <div className="space-y-6 text-slate-600 dark:text-slate-400 font-medium">
                   <p className="flex gap-3"><span className="text-red-500 font-black">→</span> Missing conversion data</p>
                   <p className="flex gap-3"><span className="text-red-500 font-black">→</span> Incorrect attribution</p>
                   <p className="flex gap-3"><span className="text-red-500 font-black">→</span> Poor campaign optimization</p>
                   <p className="flex gap-3"><span className="text-red-500 font-black">→</span> Wasted ad spend</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Solution Section */}
      <section className="py-24 bg-blue-600 rounded-[4rem] mx-4 md:mx-10 text-white overflow-hidden relative">
        <Server className="absolute -right-20 -bottom-20 w-96 h-96 text-white/10" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">The Solution.</h2>
            <p className="text-xl text-blue-100 mb-16 font-medium leading-relaxed">
              Implemented a <span className="text-white font-bold">GTM Server Container</span> environment to bypass browser limitations and establish a direct server-to-ad-platform data stream.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {[
                { title: "Data Recovery", desc: "Reduce data loss from browser-side blockers." },
                { title: "Enhanced Accuracy", desc: "Improve conversion tracking precision for Google Ads." },
                { title: "Stronger Signals", desc: "Send richer data for better machine learning optimization." },
                { title: "Clean Attribution", desc: "Enable reliable reporting across all marketing channels." }
              ].map((s, i) => (
                <div key={i} className="p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
                  <h4 className="text-xl font-black mb-2 uppercase tracking-tighter">{s.title}</h4>
                  <p className="text-blue-100 text-sm font-medium">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Implementation Process Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Implementation Process</h2>
          </div>
          <div className="space-y-12">
            {[
              { step: "01", title: "GTM Web Container Setup", items: ["Configured Google Tag Manager web container", "Installed base tracking scripts", "Defined key conversion events"] },
              { step: "02", title: "Server-Side GTM Setup", items: ["Created server-side GTM environment", "Configured tagging server endpoint", "Connected web container with server container"] },
              { step: "03", title: "Event Tracking Configuration", items: ["Set up key events (Page View, Lead, Purchase)", "Forwarded events from browser → server", "Improved event reliability and consistency"] },
              { step: "04", title: "Testing & Validation", items: ["Verified events using GTM Preview Mode", "Checked data flow integrity", "Ensured no duplicate or missing events"] }
            ].map((proc, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-8 items-start p-10 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                <span className="text-5xl font-black text-blue-600/20">{proc.step}</span>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{proc.title}</h3>
                  <ul className="space-y-3">
                    {proc.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Technical Proof (Screenshots) */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950/50">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-16 tracking-tighter underline decoration-blue-600/20 underline-offset-8">Technical Proof.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xl">
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center border-4 border-slate-50 dark:border-slate-950">
                <span className="text-slate-400 uppercase font-black text-xs tracking-widest">[ GTM Server Dashboard Screenshot ]</span>
              </div>
              <p className="mt-6 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Tag Firing Confirmation</p>
            </div>
            <div className="group rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xl">
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center border-4 border-slate-50 dark:border-slate-950">
                <span className="text-slate-400 uppercase font-black text-xs tracking-widest">[ GA4 Event Preview Screenshot ]</span>
              </div>
              <p className="mt-6 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Event Matching Quality</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Results & CTA */}
      <section className="py-32">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 text-left">
            {[
              "More accurate conversion tracking",
              "Better Google Ads optimization",
              "Reduced data loss from blockers",
              "Improved ROI from ad campaigns"
            ].map((res, i) => (
              <div key={i} className="flex items-center gap-4 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-slate-700 dark:text-slate-200">{res}</span>
              </div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="p-16 bg-slate-900 dark:bg-white rounded-[4rem] text-white dark:text-slate-900 relative overflow-hidden"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">Need Accurate Tracking?</h2>
            <p className="text-slate-400 dark:text-slate-500 mb-10 font-medium">
              Better data leads to better decisions — and better decisions lead to better growth.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-3 bg-blue-600 text-white font-black py-5 px-10 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
            >
              Get Free Tracking Audit <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}