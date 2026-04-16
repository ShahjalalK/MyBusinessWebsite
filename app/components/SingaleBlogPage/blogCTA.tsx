"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaRocket, FaWhatsapp } from 'react-icons/fa'
import Link from 'next/link'

// ১. প্রপস টাইপ ডিফাইন করা
interface BlogCTAProps {
  type: 'tracking' | 'signature' | 'ads';
}

export default function BlogCTA({ type }: BlogCTAProps) {
  
  // ২. টাইপ অনুযায়ী ডাইনামিক কন্টেন্ট সেট করা
  const ctaData = {
    tracking: {
      title: "Want us to fix your tracking?",
      spanText: "Recover your lost data now.",
      desc: "Stop losing 40% of your data. Let's implement Server-side Tracking and optimize your ROAS with precision.",
      link: "/services/server-side-tracking",
    },
    signature: {
      title: "Need a Professional",
      spanText: "Email Signature?",
      desc: "Boost your brand identity with custom-coded, responsive HTML signatures for your whole team.",
      link: "/services/email-signature",
    },
    ads: {
      title: "Ready to scale your",
      spanText: "Google Ads results?",
      desc: "Stop wasting budget on wrong keywords. Let's use value-based bidding to grow your revenue.",
      link: "/services/google-ads-expert",
    }
  };

  // বর্তমান টাইপের ডাটা সিলেক্ট করা (ভুল টাইপ আসলে ডিফল্ট ট্র্যাকিং দেখাবে)
  const currentContent = ctaData[type] || ctaData.tracking;

  return (
    <section className="py-20 container mx-auto px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-[3rem] p-10 md:p-16 text-center text-white shadow-2xl shadow-blue-500/20"
      >
        {/* Background Decorative Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.2em]">
            <FaRocket className="text-yellow-400" /> Let's Scale Together
          </div>

          <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter">
            {currentContent.title} <br /> 
            <span className="text-blue-200">{currentContent.spanText}</span>
          </h2>

          <p className="text-lg text-blue-100 font-medium opacity-90">
            {currentContent.desc}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {/* Main Contact Button */}
            <Link 
              href="/contact" 
              className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20"
            >
              Contact Us Now
            </Link>

            {/* Secondary WhatsApp Button */}
            <a 
              href="https://wa.me/+8801329532551" // জালাল, এখানে আপনার আসল নাম্বার দিন
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-10 py-5 bg-blue-500/20 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <FaWhatsapp className="text-xl" /> WhatsApp
            </a>
          </div>

          <p className="text-[10px] text-blue-200/60 font-bold uppercase tracking-widest">
            Average Response Time: Under 2 Hours
          </p>
        </div>
      </motion.div>
    </section>
  )
}