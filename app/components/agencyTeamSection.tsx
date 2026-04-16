"use client"
import React from 'react'
import { motion } from 'framer-motion'

const team = [
  {
    name: "Shahjalal Jalal",
    role: "Founder & Tracking Architect",
    desc: "Specialist in GTM Server-Side architecture and high-precision data analytics for global enterprises.",
    image: "/team/ceo.jpg",
    linkedin: "https://linkedin.com/in/your-profile", 
  },
  {
    name: "Team Member 01",
    role: "Senior Google Ads Strategist",
    desc: "Expert in scaling performance marketing campaigns with a focus on maximizing ROAS and lead quality.",
    image: "/team/profile.png",
    linkedin: "#",
  },
  {
    name: "Team Member 02",
    role: "Technical Conversion Expert",
    desc: "Specializes in Meta CAPI, API integrations, and ensuring seamless cross-platform data flow.",
    image: "/team/shahjalalkweb.jpg",
    linkedin: "#",
  },
   {
    name: "Team Member 02",
    role: "Technical Conversion Expert",
    desc: "Specializes in Meta CAPI, API integrations, and ensuring seamless cross-platform data flow.",
    image: "/team/shahjalalkweb.jpg",
    linkedin: "#",
  }
]

export default function AgencyTeamSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-40 z-0" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-wrap items-center -mx-4">
          
          <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
            <div className="max-w-xl">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mb-4 inline-block"
              >
                Our Expertise
              </motion.span>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.1]">
                Driven by Data, <br />
                <span className="text-blue-600">Led by Experts.</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 leading-relaxed font-medium">
                We are a specialized collective of tracking architects and digital strategists. Our mission is to provide businesses with the technical infrastructure needed to dominate in a privacy-first digital world.
              </p>

              {/* SVG Icons - No Library Needed */}
              <div className="flex gap-8">
                {[
                  { 
                    label: "Precision",
                    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m16 16-4-4 4-4M8 8l4 4-4 4"/></svg> 
                  },
                  { 
                    label: "Growth",
                    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  },
                  { 
                    label: "Certified",
                    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                  },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-slate-50 dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-all duration-300 relative flex flex-col justify-between"
                >
                  <div>
                    <div className="relative w-28 h-28 rounded-[2rem] overflow-hidden mb-6 border-4 border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/150/0000FF/FFFFFF?text=Expert";
                        }}
                      />
                    </div>

                    <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {member.name}
                    </h4>
                    <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">
                      {member.role}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-8">
                      {member.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect</span>
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 dark:border-blue-700">
                      {/* Custom LinkedIn SVG */}
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}