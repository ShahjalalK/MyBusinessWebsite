"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { BsLinkedin, BsTwitter, BsGlobe } from 'react-icons/bs'

const team = [
  {
    name: "Shahjalal (Jalal)",
    role: "Founder & Tracking Specialist",
    desc: "Expert in GTM Server-Side Tracking & Analytics Architecture. Bridging the gap between privacy and data.",
    image: "/team/jalal.jpg", // আপনার ছবি এখানে দিন
    skills: ["SST", "GA4", "GTM"],
    linkedin: "#",
  },
  {
    name: "Team Member 01",
    role: "Google Ads Strategist",
    desc: "Specializing in High-ROI Search & PMax campaigns with a focus on scaling e-commerce brands.",
    image: "/team/brother1.jpg", // আপনার ভাইয়ের ছবি এখানে দিন
    skills: ["Google Ads", "SEM", "ROI"],
    linkedin: "#",
  },
  {
    name: "Team Member 02",
    role: "Conversion Expert",
    desc: "Expert in Facebook CAPI and pixel optimization to ensure maximum attribution accuracy.",
    image: "/team/brother2.jpg", // আপনার অন্য ভাইয়ের ছবি এখানে দিন
    skills: ["Meta CAPI", "Pixel", "CRO"],
    linkedin: "#",
  }
]

export default function MeetTheTeam() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-20">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mb-4"
          >
            The Experts
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            Meet the Minds Behind <span className="text-blue-600">Your Growth.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
            A dedicated team of tracking specialists and ad strategists working together to recover your data and scale your revenue.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="relative mb-6 overflow-hidden rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 aspect-[4/5]">
                {/* Image Placeholder - আপনি এখানে আসল ইমেজ পাথ বসাবেন */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/400x500?text=Expert";
                  }}
                />
                
                {/* Social Floating Icons */}
                <div className="absolute bottom-6 left-6 flex gap-3 translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                  <a href={member.linkedin} className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors shadow-xl">
                    <BsLinkedin size={18} />
                  </a>
                  <div className="w-10 h-10 bg-white text-slate-900 rounded-xl flex items-center justify-center shadow-xl">
                    <BsGlobe size={18} />
                  </div>
                </div>
              </div>

              <div className="px-2">
                <div className="flex items-center gap-2 mb-2">
                   {member.skills.map((skill, i) => (
                     <span key={i} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                       {skill}
                     </span>
                   ))}
                </div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                  {member.name}
                </h4>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-4 tracking-tight">
                  {member.role}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {member.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Agency Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 text-center p-10 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
          <h3 className="text-2xl md:text-3xl font-black mb-4 relative z-10">We’re more than just a vendor.</h3>
          <p className="text-slate-400 max-w-xl mx-auto mb-8 relative z-10 font-medium">
            Our team becomes an extension of your marketing department. We take care of the technical complexity so you can focus on scaling.
          </p>
          <button className="relative z-10 bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-xs">
            Join Our Ecosystem
          </button>
        </motion.div>

      </div>
    </section>
  )
}