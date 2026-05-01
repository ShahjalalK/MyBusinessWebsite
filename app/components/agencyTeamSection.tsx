"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaLinkedinIn } from 'react-icons/fa' // React Icons theke LinkedIn use korchi
import { ShieldCheck, Zap, BarChart3 } from 'lucide-react' // Bakigulo Lucide thakbe

const team = [
  {
    name: "Shahjalal Khan",
    role: "Founding Tracking Architect",
    desc: "Expert in GTM Server-Side architecture and advanced data recovery for global e-commerce scaling.",
    image: "/team/founder.webp",
    linkedin: "https://linkedin.com/in/your-profile", 
    skill: "Server Side Tagging"
  },
  {
    name: "Shamim Hossain",
    role: "Google Ads Specialist",
    desc: "Optimizing High-ROI Google Ads campaigns with a focus on Search, PMax, and precise conversion audits.",
    image: "/team/samim.png",
    linkedin: "#",
    skill: "Ads Audit"
  },
  {
    name: "Ebrahim Khan",
    role: "Meta CAPI Specialist",
    desc: "Bypassing iOS signal loss through Meta Conversions API integrations and server-to-server data syncing.",
    image: "/team/kazol.png",
    linkedin: "#",
    skill: "Conversion API"
  },
  {
    name: "Sazzad Hossen",
    role: "GA4 Audit Expert",
    desc: "Identifying tracking gaps and ensuring 100% data accuracy through professional GA4 infrastructure audits.",
    image: "/team/sany.jpg",
    linkedin: "#",
    skill: "GA4 Specialist"
  }
]

export default function AgencyTeamSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -z-0" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-wrap items-center -mx-4">
          
          <div className="w-full lg:w-5/12 px-4 mb-16 lg:mb-0">
            <div className="max-w-xl">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[10px]">Data Architects</span>
              </motion.div>
              
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.1]">
                Technical Brains Behind <br />
                <span className="text-blue-600">Your ROI Growth.</span>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: "Precision", icon: <ShieldCheck className="w-5 h-5 text-blue-600" /> },
                  { label: "Velocity", icon: <Zap className="w-5 h-5 text-yellow-500" /> },
                  { label: "Insights", icon: <BarChart3 className="w-5 h-5 text-indigo-600" /> },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    {item.icon}
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-7/12 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className={`group relative p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-blue-900/20 ${index % 2 !== 0 ? 'md:mt-12' : ''}`}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-slate-50 dark:ring-slate-800">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
                        />
                      </div>
                      {/* Social Icon Optimization with React Icons */}
                      <a 
                        href={member.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute -bottom-2 -right-2 w-9 h-9 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#0077B5] shadow-lg border border-slate-100 dark:border-slate-700 transition-all hover:scale-110"
                      >
                        <FaLinkedinIn className="text-lg" />
                      </a>
                    </div>
                    <span className="py-1 px-3 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase text-slate-500 tracking-tighter">
                      {member.skill}
                    </span>
                  </div>

                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                    {member.name}
                  </h4>
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">
                    {member.role}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {member.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}