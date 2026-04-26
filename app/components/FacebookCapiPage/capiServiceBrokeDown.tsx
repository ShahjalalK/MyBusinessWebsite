"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaSearchPlus, FaToolbox, FaVial, FaChartPie } from 'react-icons/fa'
import { HiCheckCircle } from 'react-icons/hi'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const services = [
  {
    icon: <FaSearchPlus />,
    title: "Deep Pixel & GTM Audit",
    desc: "I begin with a thorough google ads account audit and pixel health check. I pinpoint data gaps, duplicate events, and broken triggers that leak your ad budget.",
    features: ["Event Quality Scoring", "Data Leakage Analysis", "Measurement Protocol Audit"],
    step: "01"
  },
  {
    icon: <FaToolbox />,
    title: "Server-Side Infrastructure",
    desc: "Robust integration of Meta Conversions API using gtm server side tracking. I set up a private cloud server to ensure direct and secure data flow.",
    features: ["First-Party Cookie Extension", "Cloud Server Hosting", "Custom Domain Mapping"],
    step: "02"
  },
  {
    icon: <FaChartPie />,
    title: "Advanced Event Matching",
    desc: "Achieve a 6-10 matching score. I implement hashing for user parameters (Email, Phone, Lead ID) to ensure Meta’s AI identifies every buyer.",
    features: ["Hashed Data Integration", "Event Deduplication", "User-ID Tracking"],
    step: "03"
  },
  {
    icon: <FaVial />,
    title: "Rigorous Debugging",
    desc: "I don't just ship; I validate. Using Meta Test Events and GTM Preview Mode, I guarantee 100% data accuracy before final handover.",
    features: ["Live Event Validation", "Conversion Gap Analysis", "Final Performance Report"],
    step: "04"
  }
];

export default function CapiServicesBreakdown() {
  return (
    <section className="py-28 bg-slate-50 dark:bg-slate-900/40 relative overflow-hidden">
      
      {/* Background Decorative Text */}
      <div className="absolute top-10 right-10 text-[12rem] font-black text-slate-200/20 dark:text-slate-800/20 pointer-events-none select-none hidden lg:block">
        WORKFLOW
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <span className="h-[2px] w-10 bg-blue-600"></span>
            <span className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px]">
              The Execution Plan
            </span>
          </motion.div>
          
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
            My Professional <br /> <span className="text-blue-600 italic">Tracking Workflow.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-6 max-w-xl text-lg">
            A standardized, 4-step framework designed to restore your tracking accuracy and scale your revenue.
          </p>
        </div>

        {/* Services List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative group flex gap-8 p-4"
            >
              {/* Step Number Overlay */}
              <span className="absolute -left-4 -top-4 text-6xl font-black text-slate-100 dark:text-slate-800/50 group-hover:text-blue-600/10 transition-colors duration-500 -z-10">
                {service.step}
              </span>

              {/* Icon Container */}
              <div className="shrink-0">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-3xl text-blue-600 shadow-2xl shadow-blue-500/5 border border-slate-100 dark:border-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:rotate-6">
                  {service.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {service.desc}
                </p>
                
                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {service.features.map((feature, fIdx) => (
                    <span 
                      key={fIdx} 
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 shadow-sm"
                    >
                      <HiCheckCircle className="text-blue-600 text-sm" /> {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Audit Call-to-Action (Redesigned for conversion) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-24 relative overflow-hidden rounded-[3.5rem] bg-gradient-to-br from-slate-900 to-[#041f60] p-10 md:p-16 text-white border border-white/5"
        >
          {/* Subtle Decorative Circle */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px]"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-xl text-center lg:text-left space-y-4">
              <div className="inline-block px-4 py-1 bg-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
                Limited Availability
              </div>
              <h4 className="text-3xl md:text-5xl font-black tracking-tighter leading-[1.1]">
                Not sure if your tracking is <span className="text-blue-400">actually broken?</span>
              </h4>
              <p className="text-slate-400 font-medium text-lg">
                Stop losing data. Let me perform a professional 15-minute tracking audit at zero cost.
              </p>
            </div>

            <div className="shrink-0 w-full lg:w-auto">
              <Link href="/book-audit">
                <button className="w-full lg:w-auto group bg-white text-[#041f60] px-12 py-5 rounded-3xl font-black text-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-3 shadow-2xl">
                  Get Free Audit <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}