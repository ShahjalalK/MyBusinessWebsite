"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, LayoutGrid, Settings2, BarChart4, Target } from 'lucide-react'

// কাস্টম SVG আইকনগুলো টেকনিক্যাল ফিনিশিং দেয়
const FacebookIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const detailedServices = [
  {
    icon: <Settings2 className="text-blue-500" size={24} />,
    title: "Server-Side Tagging GTM",
    features: [
      "Enterprise Provisioning (Google Cloud / Stape.io)",
      "Custom Subdomain Mapping (First-Party Data)",
      "Server Container Architecture Design",
      "Request Header & Privacy optimization"
    ]
  },
  {
    icon: <BarChart4 className="text-emerald-500" size={24} />,
    title: "GA4 Server-Side Tracking",
    features: [
      "Advanced Event Parameter Mapping",
      "ITP & Intelligent Tracking Prevention Fix",
      "First-party Cookie Life Extension",
      "E-commerce Purchase Data Validation"
    ]
  },
  {
    icon: <FacebookIcon className="text-indigo-600" size={24} />, 
    title: "Meta Conversions API (CAPI)",
    features: [
      "Server-to-Server Event Integration",
      "Advanced Event Deduplication Logic",
      "Maximized Event Match Quality (EMQ)",
      "Signal Recovery for iOS 14+ users"
    ]
  },
  {
    icon: <Target className="text-orange-500" size={24} />,
    title: "Google Ads Precision Setup",
    features: [
      "Enhanced Conversions Implementation",
      "GCLID & Tracking Parameter Preservation",
      "Offline Conversion Tracking (OCI)",
      "High-Value Lead & Sales Attribution"
    ]
  }
];

export default function ServicesBreakdown() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-[#030712] transition-colors duration-500">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px] mb-4"
          >
            <LayoutGrid size={16} /> Service Architecture
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            Precision Tracking. <br />
            <span className="text-blue-600">No Data Left Behind.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-2xl">
            From server provisioning to advanced deduplication logic, I build tracking infrastructures that scale with your ad spend.
          </p>
        </div>

        {/* Detailed Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {detailedServices.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-blue-500/30 transition-all duration-500 group"
            >
              <div className="flex items-center gap-5 mb-10">
                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {service.title}
                </h3>
              </div>

              <ul className="space-y-5">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-4 group/item">
                    <div className="mt-1 bg-blue-500/10 rounded-full p-1 group-hover/item:bg-blue-600 transition-colors">
                      <CheckCircle2 size={14} className="text-blue-600 group-hover/item:text-white" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-400 font-bold text-[15px] tracking-tight group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Technical Stack Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-center gap-x-12 gap-y-6"
        >
          {['Google Cloud', 'Stape.io', 'AWS', 'BigQuery', 'Next.js'].map((tech) => (
            <span key={tech} className="text-slate-400 dark:text-slate-600 text-[11px] font-black uppercase tracking-[0.3em]">
              {tech}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}