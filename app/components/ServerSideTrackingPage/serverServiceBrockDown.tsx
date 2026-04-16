"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, LayoutGrid, Settings2, BarChart4, Target, Globe } from 'lucide-react'

// ফেসবুকের জন্য কাস্টম SVG আইকন
const FacebookIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const detailedServices = [
  {
    icon: <Settings2 className="text-blue-500" size={24} />,
    title: "GTM Server Container Setup",
    features: [
      "Provisioning Google Cloud or Stape.io server",
      "Domain mapping with custom subdomain",
      "Server-side container configuration",
      "Request & Response header optimization"
    ]
  },
  {
    icon: <BarChart4 className="text-emerald-500" size={24} />,
    title: "GA4 Server-Side Tracking",
    features: [
      "Moving GA4 tags to server container",
      "First-party cookie extension (ITP fix)",
      "Custom event & parameter mapping",
      "Cross-domain tracking configuration"
    ]
  },
  {
    icon: <FacebookIcon className="text-indigo-600" size={24} />, // এখানে কাস্টম আইকন ব্যবহার করা হয়েছে
    title: "Facebook CAPI Setup",
    features: [
      "Server-to-server event integration",
      "Browser & Server event deduplication",
      "High Event Match Quality (EMQ) score",
      "Automatic Advanced Matching setup"
    ]
  },
  {
    icon: <Target className="text-orange-500" size={24} />,
    title: "Google Ads Conversion Fix",
    features: [
      "Enhanced Conversions implementation",
      "Offline conversion import (OCI)",
      "Accurate lead & purchase attribution",
      "Click ID (GCLID) preservation"
    ]
  }
];

export default function ServicesBreakdown() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/40">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px] mb-4"
          >
            <LayoutGrid size={16} /> Service Scope
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
            A Deep Dive into <br />
            <span className="text-blue-600">What I Deliver.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            Every setup is customized to your business needs, ensuring data integrity and long-term scalability.
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
              className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  {/* আইকন রেন্ডারিং */}
                  {service.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {service.title}
                </h3>
              </div>

              <ul className="space-y-4">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 group/item">
                    <div className="mt-1 bg-blue-500/10 rounded-full p-0.5">
                      <CheckCircle2 size={16} className="text-blue-600" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-400 font-bold text-sm tracking-tight group-hover/item:text-slate-900 dark:group-hover/item:text-slate-200 transition-colors">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Technical Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
            Supporting Platforms: Google Cloud • Stape.io • AWS • DigitalOcean
          </p>
        </div>
      </div>
    </section>
  )
}