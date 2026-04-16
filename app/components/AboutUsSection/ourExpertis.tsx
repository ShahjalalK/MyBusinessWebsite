"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { 
  SiGoogleads, 
  SiGoogleanalytics, 
  SiGoogletagmanager, 
  SiShopify, 
  SiMeta, 
  SiWordpress, 
  SiNextdotjs,
  SiDocker 
} from 'react-icons/si'

const tools = [
  { name: "Google Ads", icon: <SiGoogleads className="text-[#4285F4]" />, desc: "Ad Scaling" },
  { name: "GA4", icon: <SiGoogleanalytics className="text-[#E37400]" />, desc: "Analytics" },
  { name: "GTM SST", icon: <SiGoogletagmanager className="text-[#246FDB]" />, desc: "Server Tracking" },
  { name: "Shopify", icon: <SiShopify className="text-[#95BF47]" />, desc: "E-commerce" },
  { name: "Meta CAPI", icon: <SiMeta className="text-[#0668E1]" />, desc: "Data Sync" },
  { name: "WordPress", icon: <SiWordpress className="text-[#21759B]" />, desc: "CMS Integration" },
  { name: "Next.js", icon: <SiNextdotjs className="text-black dark:text-white" />, desc: "Custom Web" },
  { name: "Docker", icon: <SiDocker className="text-[#2496ED]" />, desc: "SST Hosting" },
]

export default function OurExpertis() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mb-4"
          >
            The Tech Stack
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            Industry-Leading <span className="text-blue-600">Tools & Tech.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
            We utilize a specialized suite of premium tools to ensure your tracking is bulletproof and your campaigns are fully optimized for growth.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-[2rem] flex flex-col items-center group transition-all"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {tool.icon}
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                {tool.name}
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {tool.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Trust Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 p-6 bg-blue-600/5 dark:bg-blue-600/10 rounded-2xl border border-blue-600/10 text-center"
        >
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Professional Certification: <span className="text-blue-600">Google Ads Certified & Meta Business Partner Standard</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}