"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Users, Target, Shield, Zap } from 'lucide-react'
import SuccessSection from './successSection'

// এনিমেশন ভেরিয়েন্ট (সহজে ম্যানেজ করার জন্য)
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
}

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.2 } }
}

export default function AboutSection() {
  return (
    <div className="flex flex-col gap-24 py-16 overflow-hidden">
      
      {/* 1. Agency Hero Section */}
      <section className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Content */}
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h4 className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4">Our Agency</h4>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
              Empowering Businesses with <span className="text-blue-600">Accurate Data</span> & Growth
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              TrackFlow Pro is a specialized digital agency born from a passion for precision. We don't just run ads; we build the technical infrastructure that ensures every dollar you spend is tracked, analyzed, and optimized.
            </p>
            <p className="text-slate-600 text-lg leading-relaxed">
              Based in Bangladesh, we are a growing team of technical marketers and analytics experts dedicated to helping global brands navigate the complex world of server-side tracking.
            </p>
          </motion.div>

          {/* Right Grid - কার্ডগুলো একের পর এক জুম হবে */}
          <motion.div 
            className="lg:w-1/2 grid grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {[
              { icon: Shield, title: "Privacy First", bg: "bg-blue-50" },
              { icon: Zap, title: "Fast Execution", bg: "bg-slate-50" },
              { icon: Target, title: "ROI Focused", bg: "bg-slate-50" },
              { icon: Users, title: "Expert Team", bg: "bg-blue-600", dark: true },
            ].map((item, index) => (
              <motion.div 
                key={index}
                variants={{
                    initial: { opacity: 0, scale: 0.8 },
                    whileInView: { opacity: 1, scale: 1 }
                }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className={`p-8 ${item.bg} rounded-3xl text-center shadow-sm hover:shadow-xl transition-shadow`}
              >
                <item.icon className={`w-10 h-10 mx-auto mb-4 ${item.dark ? 'text-white' : 'text-blue-600'}`} />
                <h5 className={`font-bold ${item.dark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h5>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SuccessSection />

      {/* 3. Team Section - মেম্বাররা স্টাইলিশ ভাবে আসবে */}
      <section className="container mx-auto px-6">
        <motion.div 
  className="text-center mb-16"
  initial="initial"
  whileInView="whileInView"
  viewport={{ once: true }}
  variants={fadeInUp} // সরাসরি স্প্রেড {...fadeInUp} না করে ভেরিয়েন্ট হিসেবে ব্যবহার করা নিরাপদ
>
  <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Meet Our Experts</h2>
  <p className="text-slate-500 max-w-xl mx-auto">The dedicated team behind your business growth.</p>
</motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {/* শাহজালাল ও টিম মেম্বার কার্ড */}
          {[
            { name: "Shahjalal Khan", role: "Founder & Lead", initial: "SK", sub: "Google Ads & SST Expert" },
            { name: "Team Member", role: "Web Developer", initial: "WD", sub: "MERN Stack Specialist" },
            { name: "Team Member", role: "Marketing Strategist", initial: "MS", sub: "ROI Optimization" }
          ].map((member, idx) => (
            <motion.div 
              key={idx}
              variants={fadeInUp}
              whileHover={{ y: -15 }}
              className="flex flex-col items-center p-8 rounded-3xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-48 h-48 bg-white rounded-full mb-6 border-8 border-slate-50 shadow-2xl flex items-center justify-center text-blue-600 font-bold text-3xl">
                {member.initial}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
              <p className="text-blue-600 font-semibold mb-2">{member.role}</p>
              <p className="text-slate-500 text-sm text-center">{member.sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Technologies Section - লোগোগুলো স্লাইড হয়ে আসবে */}
      <motion.section 
        className="py-20 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Technologies We Master</p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {["Google Ads", "GA4", "Meta CAPI", "GTM Server-Side", "Clickable Email Signature"].map((tech, i) => (
            <motion.span 
                key={i}
                whileHover={{ scale: 1.1, opacity: 1, color: "#2563eb" }}
                className="text-xl md:text-2xl font-bold cursor-default"
            >
                {tech}
            </motion.span>
          ))}
        </div>
      </motion.section>
    </div>
  )
}