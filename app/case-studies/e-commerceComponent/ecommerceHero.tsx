"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowDown, Database, BarChart3, Activity, TrendingUp, LinkIcon, Zap, ArrowRight, Sparkles, Lightbulb, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function EcommerseCaseStudyHero() {
  return (
    <>
    <section className="relative pt-16 pb-20 lg:pt-20 lg:pb-32 bg-white dark:bg-slate-950 overflow-hidden">
      
      {/* ব্যাকগ্রাউন্ড ডেকোরেশন - প্রফেশনাল গ্রিড ইফেক্ট */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          
          {/* ১. ব্যাজ - ট্রাস্ট বিল্ডিং */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-8"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-700 dark:text-blue-400">
              Technical Case Study: #01
            </span>
          </motion.div>

          {/* ২. মেইন টাইটেল - বোল্ড এবং ইমপ্যাক্টফুল */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.05] max-w-4xl mb-8"
          >
            Fixing Data Tracking for <span className="text-blue-600">Scalable E-commerce</span> Growth
          </motion.h1>

          {/* ৩. সাবটাইটেল - সলিউশন ফোকাসড */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed mb-12"
          >
            A demo implementation showing how accurate tracking setup can improve data reliability between <span className="text-slate-900 dark:text-white font-bold">Shopify and Meta Ads</span> using Server-Side Tracking.
          </motion.p>

          {/* ৪. কুইক মেটরিক্স - কাজের ইমপ্যাক্ট বোঝাতে */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-16"
          >
            {[
              { label: "Data Accuracy", value: "99.9%", icon: <Activity className="text-green-500" /> },
              { label: "Lost Data Recovery", value: "+30%", icon: <Database className="text-blue-500" /> },
              { label: "ROAS Improvement", value: "2.4x", icon: <BarChart3 className="text-indigo-500" /> },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col items-center">
                <div className="mb-3">{stat.icon}</div>
                <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* ৫. স্ক্রল গাইড */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-slate-400"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Deep Dive Into Details</span>
            <ArrowDown className="w-5 h-5" />
          </motion.div>

        </div>
      </div>

      {/* ডেকোরেটিভ গ্লো */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/5 blur-[120px] -z-0" />
    </section>

    {/* --- Overview Section --- */}
<section className="py-20 bg-white dark:bg-slate-950">
  <div className="container mx-auto px-6">
    <div className="max-w-5xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative p-10 md:p-16 rounded-[3.5rem] bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        {/* ডেকোরেটিভ এলিমেন্ট */}
        <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-20">
          <Database className="w-32 h-32 text-blue-600" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* লেফট সাইড: বড় টাইটেল */}
          <div className="lg:col-span-4">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              Project <br /> 
              <span className="text-blue-600 font-black uppercase tracking-[0.2em] text-sm">Overview</span>
            </h2>
            <div className="mt-4 h-1 w-12 bg-blue-600 rounded-full" />
          </div>

          {/* রাইট সাইড: মেইন টেক্সট */}
          <div className="lg:col-span-8 space-y-6">
            <p className="text-xl font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
              This is a sample implementation created to demonstrate how <span className="text-blue-600">Facebook Conversion API (CAPI)</span> can solve common tracking issues in e-commerce businesses.
            </p>
            
            <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Many Shopify stores face <span className="underline decoration-red-500/30 underline-offset-4">data mismatches</span> between their website and Meta Ads, which leads to poor optimization and inaccurate reporting. This setup focuses on fixing that gap with a more reliable tracking system.
            </p>

            {/* ছোট হাইলাইট বক্স */}
            <div className="flex flex-wrap gap-4 mt-8">
              {["Shopify Fix", "Meta CAPI", "Zero Data Loss"].map((tag, i) => (
                <span key={i} className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl text-xs font-black text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 uppercase tracking-widest shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
</section>


{/* --- The Problem Section --- */}
<section className="py-24 bg-slate-50 dark:bg-slate-950/50 overflow-hidden">
  <div className="container mx-auto px-6">
    <div className="flex flex-wrap items-center -mx-6">
      
      {/* ১. লেফট সাইড: ভিজ্যুয়াল এলিমেন্ট (Error/Alert Style) */}
      <div className="w-full lg:w-1/2 px-6 mb-12 lg:mb-0">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-red-100 dark:border-red-900/30 shadow-2xl shadow-red-500/5 relative overflow-hidden">
            
            {/* Background Icon */}
            <div className="absolute -right-10 -bottom-10 opacity-5">
              <ShieldCheck className="w-64 h-64 text-red-600" />
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-8">
                <Activity className="w-8 h-8 text-red-600 animate-pulse" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                The Core <span className="text-red-600">Issue.</span>
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8">
                Most e-commerce businesses rely only on <span className="text-red-600 font-bold underline decoration-red-500/20 underline-offset-4">browser-based tracking</span>, which is no longer fully reliable due to modern privacy standards.
              </p>

              {/* Problem List Cards */}
              <div className="space-y-4">
                {[
                  { label: "Ad Blockers", desc: "Blocks tracking scripts from firing." },
                  { label: "iOS Privacy", label2: "Restrictions", desc: "Apple's ITP limits cookie lifespan." },
                  { label: "Browser Limits", desc: "Chrome & Safari blocking 3rd party cookies." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ x: 10 }}
                    className="p-5 bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/20 rounded-2xl flex items-center gap-4 group"
                  >
                    <div className="h-2 w-2 rounded-full bg-red-500 group-hover:scale-150 transition-transform" />
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{item.label} {item.label2}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ২. রাইট সাইড: কনসিকোয়েন্স (Impact on Business) */}
      <div className="w-full lg:w-1/2 px-6">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:pl-10"
        >
          <span className="text-red-600 font-black uppercase tracking-[0.3em] text-xs mb-4 block">
            Business Impact
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter leading-[1.1]">
            How This Hurts Your <span className="text-red-600 underline decoration-red-500/20">Revenue.</span>
          </h2>

          <div className="space-y-10">
            {[
              { 
                title: "Missing Purchase Events", 
                desc: "When customers buy but the pixel doesn't fire, you lose credit for the sale." 
              },
              { 
                title: "Inaccurate Reporting", 
                desc: "Your Meta Ads dashboard shows less ROAS than you're actually getting." 
              },
              { 
                title: "Poor Optimization", 
                desc: "Facebook's AI can't find new buyers because it doesn't know who bought." 
              }
            ].map((point, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-red-100 dark:border-red-900/30 flex items-center justify-center font-black text-red-600">
                  0{i + 1}
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{point.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Hint */}
          <div className="mt-12 p-6 bg-slate-900 rounded-3xl border-l-4 border-red-600">
            <p className="text-slate-400 text-sm font-medium italic">
              "Without accurate data, scaling your ads is like driving with a blindfold on."
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  </div>
</section>

{/* --- The Solution Section --- */}
<section className="py-24 bg-white dark:bg-slate-950">
  <div className="container mx-auto px-6">
    <div className="max-w-6xl mx-auto">
      
      {/* ১. সেকশন হেডার */}
      <div className="flex flex-col items-center text-center mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6"
        >
          <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
        </motion.div>
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
          The <span className="text-blue-600 font-black italic underline decoration-blue-500/20">Hybrid</span> Solution.
        </h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
          To address tracking gaps, we implemented a combined system that uses both browser and server power to ensure 100% data reliability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* ২. লেফট সাইড: টেকনিক্যাল আর্কিটেকচার (Visual Representation) */}
        <div className="lg:col-span-7">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="relative p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-100 dark:border-slate-800"
          >
            <div className="flex flex-col gap-8 relative">
              
              {/* Browser Side Card */}
              <div className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative z-10">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 font-bold">01</div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm mb-1">Facebook Pixel</h4>
                  <p className="text-xs text-slate-500 font-bold tracking-tighter">(Browser-Side Tracking)</p>
                </div>
              </div>

              {/* Connecting Line (Animation) */}
              <div className="absolute left-[30px] top-1/2 -translate-y-1/2 w-1 h-20 bg-gradient-to-b from-blue-500 to-indigo-600 -z-0 opacity-30" />

              {/* Server Side Card */}
              <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-500/20 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold">02</div>
                <div>
                  <h4 className="font-black text-white uppercase tracking-widest text-sm mb-1">Conversion API (CAPI)</h4>
                  <p className="text-xs text-blue-100 font-bold tracking-tighter">(Server-Side Tracking)</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ৩. রাইট সাইড: বেনিফিট লিস্ট (The Result) */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Why This Works?
            </h3>
            
            <div className="space-y-6">
              {[
                { 
                  title: "Consistent Tracking", 
                  desc: "Even if the browser blocks the pixel, the server sends the data directly to Meta.",
                  icon: <Activity className="w-5 h-5" /> 
                },
                { 
                  title: "Better Data Matching", 
                  desc: "Shopify customer data is hashed and matched precisely with Meta user profiles.",
                  // এখানে LinkIcon ব্যবহার করুন
                  icon: <LinkIcon className="w-5 h-5" /> 
                },
                { 
                  title: "Improved Signal Quality", 
                  desc: "Higher quality signals lead to lower Cost-Per-Action (CPA) and better scaling.",
                  icon: <TrendingUp className="w-5 h-5" /> 
                }
              ].map((benefit, i) => (
                <div key={i} className="group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all shadow-sm hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                      {benefit.icon}
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 dark:text-white mb-1">{benefit.title}</h5>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{benefit.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  </div>
</section>

{/* --- Implementation Process Section --- */}
<section className="py-24 bg-slate-50 dark:bg-slate-950/50">
  <div className="container mx-auto px-6">
    <div className="max-w-4xl mx-auto">
      
      {/* সেকশন হেডার */}
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
          The <span className="text-blue-600">Step-by-Step</span> Process.
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          How we transformed a broken tracking system into a data powerhouse.
        </p>
      </div>

      {/* টাইমলাইন কন্টেইনার */}
      <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-10 space-y-16">
        
        {[
          {
            step: "01",
            title: "Base Pixel Setup",
            items: ["Installed Facebook Pixel on Shopify", "Verified standard events (PageView, ViewContent, Purchase)"],
            color: "blue"
          },
          {
            step: "02",
            title: "Conversion API Integration",
            items: ["Connected server-side tracking using CAPI", "Configured event forwarding from server to Meta"],
            color: "indigo"
          },
          {
            step: "03",
            title: "Event Matching Optimization",
            items: ["Added user data parameters (email, IP, user agent)", "Improved event match quality score"],
            color: "cyan"
          },
          {
            step: "04",
            title: "Testing & Verification",
            items: ["Used Meta Events Manager", "Verified events are firing correctly", "Ensured no duplication or missing data"],
            color: "green"
          }
        ].map((item, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-10 md:pl-16"
          >
            {/* টাইমলাইন ডট/আইকন */}
            <div className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full border-4 border-white dark:border-slate-950 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]`} />

            {/* কার্ড কন্টেন্ট */}
            <div className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-blue-200 dark:hover:border-blue-900 transition-all">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <span className="text-4xl font-black text-slate-100 dark:text-slate-800 group-hover:text-blue-600/20 transition-colors">
                  {item.step}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {item.title}
                </h3>
              </div>

              <ul className="space-y-4">
                {item.items.map((subItem, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      {subItem}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}

      </div>
    </div>
  </div>
</section>

{/* --- Tracking Setup Preview Section --- */}
<section className="py-24 bg-white dark:bg-slate-950">
  <div className="container mx-auto px-6">
    <div className="max-w-6xl mx-auto">
      
      {/* ১. সেকশন হেডার */}
      <div className="flex flex-col items-center text-center mb-20">
        <motion.span 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4"
        >
          Visual Documentation
        </motion.span>
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
          Technical <span className="text-blue-600">Proof.</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
          Real-world screenshots showing how data flows accurately between Shopify and Meta's servers.
        </p>
      </div>

      {/* ২. স্ক্রিনশট গ্রিড */}
      <div className="space-y-20">
        
        {[
          {
            title: "Meta Events Manager Overview",
            desc: "Example of properly configured Conversion API events inside Meta Events Manager, showing both Browser and Server triggers.",
            imgText: "Events Manager Screenshot", // আপনার ছবির পাথ এখানে দিন
            tag: "Facebook CAPI",
            features: ["Deduplication Active", "Standard Events Tracked"]
          },
          {
            title: "Event Match Quality Score",
            desc: "By passing advanced customer parameters (Email, IP, User-Agent), we achieved a high match quality score, improving ad delivery.",
            imgText: "Match Quality Screenshot",
            tag: "Optimization",
            features: ["High Quality Signal", "Advanced Matching"]
          }
        ].map((proof, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
          >
            {/* ছবির অংশ */}
            <div className="w-full lg:w-3/5">
              <div className="relative group overflow-hidden rounded-[2.5rem] border-8 border-slate-50 dark:border-slate-900 shadow-2xl shadow-blue-500/10 bg-slate-100 dark:bg-slate-800 aspect-video flex items-center justify-center">
                {/* এখানে <Image /> ট্যাগ ব্যবহার করবেন */}
                <span className="text-slate-400 font-black uppercase tracking-widest text-xs">
                   [ {proof.imgText} ]
                </span>
                
                {/* Overlay Decoration */}
                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>

            {/* টেক্সট অংশ */}
            <div className="w-full lg:w-2/5">
              <div className="space-y-6">
                <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  {proof.tag}
                </span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {proof.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {proof.desc}
                </p>
                
                <div className="pt-4 space-y-3">
                  {proof.features.map((feat, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

      </div>

      


    </div>
  </div>
</section>


{/* 6. Expected Outcome Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950/50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
              The Expected <span className="text-blue-600">Outcomes.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              What happens when your tracking works perfectly? You get clarity and growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              "More accurate conversion tracking",
              "Improved data consistency between Shopify and Meta Ads",
              "Better ad performance optimization",
              "Increased confidence in campaign data"
            ].map((outcome, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-slate-700 dark:text-slate-200 font-bold leading-tight">
                  {outcome}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Key Takeaways Section (Highlight Box) */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto p-10 md:p-16 rounded-[3.5rem] bg-blue-600 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20"
          >
            {/* Background Decoration */}
            <Lightbulb className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 rotate-12" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="w-6 h-6 text-blue-200" />
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-blue-100">Key Takeaways</h3>
              </div>
              
              <div className="space-y-8">
                {[
                  "Browser-only tracking is no longer enough for high-growth stores.",
                  "Server-side tracking improves data reliability by bypassing browser limits.",
                  "Better data leads to smarter ad decisions and lower CPA."
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-6 border-l-2 border-blue-400/50 pl-6">
                    <p className="text-xl md:text-2xl font-bold leading-snug tracking-tight">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 8. Final Call To Action (The Closer) */}
      <section className="py-32 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Secure Your Data Today</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.9]">
              Want to Fix Your <br />
              <span className="text-blue-600">Tracking Setup?</span>
            </h2>
            
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium mb-12 leading-relaxed">
              If you're running ads but not confident in your tracking accuracy, I can help you set up a reliable tracking system for your business.
            </p>

            <Link 
              href="/contact" 
              className="flex items-center justify-center gap-4 w-fit mx-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 px-12 rounded-[2rem] text-xl transition-all hover:scale-105 hover:shadow-2xl shadow-blue-500/10 group"
            >
              Get Free Tracking Audit
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
            
            <p className="mt-8 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              Available for new audits this week
            </p>
          </motion.div>
        </div>
        
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-blue-600/5 blur-[120px] -z-0" />
      </section>
    </>
  );
}