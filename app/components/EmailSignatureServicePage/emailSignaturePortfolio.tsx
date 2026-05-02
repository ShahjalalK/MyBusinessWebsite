"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, ShieldCheck, Mail, Paperclip, Send, MoreVertical, X } from 'lucide-react'
import Link from 'next/link';

const portfolioImages = [
  {
    category: "Real Estate Specialist",
    client: "Luxury Properties NY",
    image: "/email-signature/signature1.webp",
    description: "High-impact signature designed for top-tier real estate brokers.",
    to: "client-lead@realestate.com",
    subject: "Property Viewing Schedule"
  },
  {
    category: "E-commerce Agency",
    client: "Velocity Brands",
    image: "/email-signature/signature2.webp",
    description: "Modern, clickable signature focusing on brand authority.",
    to: "marketing@velocity.io",
    subject: "Monthly Campaign Strategy"
  },
  {
    category: "Legal & Medical",
    client: "HealthCare Solutions",
    image: "/email-signature/signature3.webp",
    description: "Professional design featuring HIPAA compliance statements.",
    to: "records@hospital.org",
    subject: "Confidential Patient Report"
  },
  {
    category: "SaaS & Tech",
    client: "CloudPulse Systems",
    image: "/email-signature/signature4.webp",
    description: "Sleek HTML signature with integrated booking links.",
    to: "investors@techcorp.com",
    subject: "Q4 Growth Summary"
  }
];

export default function GlobalSignaturePortfolio() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-[#020617]">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
            Real-World <span className="text-blue-600 italic">Inbox</span> Preview.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-bold">
             See how our signatures transform standard business communication into professional branding.
          </p>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
          {portfolioImages.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group"
            >
              {/* Email Client Interface */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Header: Compose Bar */}
                <div className="bg-slate-100 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">New Message</span>
                  <div className="flex gap-3">
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <X size={14} className="text-slate-400" />
                  </div>
                </div>

                {/* Email Fields */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 space-y-3">
                  <div className="flex text-xs font-bold gap-2">
                    <span className="text-slate-400 w-8">To:</span>
                    <span className="text-blue-600">{item.to}</span>
                  </div>
                  <div className="flex text-xs font-bold gap-2">
                    <span className="text-slate-400 w-8">Sub:</span>
                    <span className="text-slate-800 dark:text-slate-200">{item.subject}</span>
                  </div>
                </div>

                {/* Email Body & Signature Screenshot */}
                <div className="p-8 min-h-[350px] flex flex-col">
                  {/* Dummy Content */}
                  <div className="space-y-3 mb-12">
                    <div className="h-3 w-full bg-slate-50 dark:bg-slate-800 rounded-full" />
                    <div className="h-3 w-[90%] bg-slate-50 dark:bg-slate-800 rounded-full" />
                    <div className="h-3 w-[40%] bg-slate-50 dark:bg-slate-800 rounded-full" />
                  </div>

                  {/* YOUR SCREENSHOT GOES HERE */}
                  <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-8 relative group/sig">
                    <div className="absolute -top-4 left-0 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-md tracking-widest opacity-0 group-hover/sig:opacity-100 transition-opacity">
                      CUSTOM HTML SIGNATURE
                    </div>
                    <img 
                      src={item.image} 
                      alt={item.client} 
                      className="w-full h-auto object-contain drop-shadow-sm group-hover:scale-[1.01] transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Action Bar */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="bg-blue-600 text-white px-5 py-2 rounded-lg text-xs font-black flex items-center gap-2">
                      Send <Send size={12} />
                    </button>
                    <Paperclip size={16} className="text-slate-400" />
                  </div>
                  <MoreVertical size={16} className="text-slate-400" />
                </div>
              </div>

              {/* Info Below Card */}
              <div className="mt-6 px-4 flex justify-between items-start">
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-lg">{item.client}</h4>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">{item.category}</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/20">
                   <ShieldCheck size={12} /> VERIFIED SETUP
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Professional CTA */}
        <div className="mt-24 text-center">
          <Link href="/contact" className="inline-flex items-center gap-4 bg-slate-900 dark:bg-blue-600 text-white font-black py-6 px-12 rounded-2xl shadow-2xl hover:-translate-y-1 transition-all uppercase tracking-widest text-sm">
            Get My Custom Signature <ArrowRight size={20} />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold">
            <Sparkles size={14} className="text-yellow-500" /> Professional Setup in 24 Hours
          </div>
        </div>

      </div>
    </section>
  )
}