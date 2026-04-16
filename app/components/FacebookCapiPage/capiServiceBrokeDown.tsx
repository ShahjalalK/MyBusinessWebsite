"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaSearchPlus, FaToolbox, FaVial, FaChartPie } from 'react-icons/fa'
import { HiCheckCircle } from 'react-icons/hi'
import Link from 'next/link'

const services = [
  {
    icon: <FaSearchPlus />,
    title: "Facebook Pixel Audit",
    desc: "I start by analyzing your current tracking health. I identify data gaps, duplicate events, and pixel errors that are hurting your ad performance.",
    features: ["Event Health Check", "ID Matching Audit", "Issue Reporting"]
  },
  {
    icon: <FaToolbox />,
    title: "Advanced CAPI Setup",
    desc: "Seamless integration of Facebook Conversion API via GTM Server-Side. I ensure your server communicates directly with Meta's servers.",
    features: ["GTM Server-Side Setup", "Cloud Server Config", "First-Party Cookie Fix"]
  },
  {
    icon: <FaChartPie />,
    title: "High-Quality Event Matching",
    desc: "The secret to low CPA. I set up advanced matching using hashed customer data (Email, Phone, City) to reach a 6-10 quality score.",
    features: ["Advanced Matching", "Event Deduplication", "Parameters Tuning"]
  },
  {
    icon: <FaVial />,
    title: "Testing & Debugging",
    desc: "I don't just 'set and forget'. I perform rigorous testing using the Test Events tool and GTM Preview mode to ensure 100% data accuracy.",
    features: ["Real-time Event Testing", "Error Monitoring", "Final Delivery Report"]
  }
];

export default function CapiServicesBreakdown() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/40">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-blue-600 font-black uppercase tracking-widest text-xs"
          >
            Deep Dive
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mt-3 leading-none">
            My Professional <br /> <span className="text-blue-600">Workflow.</span>
          </h2>
          <div className="h-1.5 w-20 bg-blue-600 mt-6 rounded-full"></div>
        </div>

        {/* Services List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-6 group"
            >
              {/* Icon Container with Line */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl text-blue-600 shadow-xl border border-slate-100 dark:border-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  {service.icon}
                </div>
                {idx < 2 && <div className="hidden lg:block w-px h-full bg-gradient-to-b from-blue-200 dark:from-blue-900 to-transparent mt-4"></div>}
              </div>

              {/* Content Container */}
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {service.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {service.desc}
                </p>
                
                {/* Feature Tags */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {service.features.map((feature, fIdx) => (
                    <span 
                      key={fIdx} 
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-300"
                    >
                      <HiCheckCircle className="text-blue-600" /> {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Audit Call-to-Action */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="mt-20 p-8 md:p-12 rounded-[3rem] bg-[#041f60] text-white flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-2xl md:text-3xl font-black">Not sure where to start?</h4>
            <p className="text-blue-200 font-medium italic">Let me perform a 15-minute tracking audit for free.</p>
          </div>
          <Link href="/book-audit" className="block w-fit cursor-pointer">
            <button className="bg-white text-[#041f60] px-10 py-4 cursor-pointer rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-white/10 transition-all active:scale-95 whitespace-nowrap">
                Claim Your Free Audit
            </button>
            </Link>
        </motion.div>

      </div>
    </section>
  )
}