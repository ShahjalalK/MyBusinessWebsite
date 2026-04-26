"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Target, Zap, MailCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// এনিমেশন ভেরিয়েন্ট
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" }
}

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.2 } }
}

export default function WhatWeDo() {
  const services = [
    {
      title: "GA4 Server-Side Tracking", // Keyword Optimized
      desc: "Recover 30%+ lost data and bypass iOS 14+ restrictions with advanced GTM Server-Side setup for 100% precision.",
      color: "blue",
      icon: <Zap className="w-6 h-6" />,
      link: "/services/server-side-tracking"
    },
    {
      title: "Google Ads Audit & ROI", // Targeting 0% KD "Audit" Keyword
      desc: "Get a comprehensive Google Ads audit service to identify waste and scale high-ROI campaigns effectively.",
      color: "indigo",
      icon: <Target className="w-6 h-6" />,
      link: "/services/google-ads-expert",
    },
    {
      title: "Conversion API (CAPI)", // High Value Keyword
      desc: "Expert Meta (Facebook) and GA4 Conversion API integration for seamless server-to-server data tracking.",
      color: "purple",
      icon: <BarChart3 className="w-6 h-6" />,
      link: "/services/facebook-capi",
    },
    {
      title: "HTML Email Signatures", // wisestamp-based keyword
      desc: "Professional, clickable HTML email signatures with brand disclaimers to boost your business authority.",
      color: "cyan",
      icon: <MailCheck className="w-6 h-6" />,
      link: "/services/email-signature",
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header Animation */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span 
            className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mb-4 inline-block"
          >
            Our Expertise
          </motion.span>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
            Data-Driven <span className="text-blue-600">Solutions.</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg font-medium">
            We bridge the gap between <span className="text-slate-900 dark:text-white font-bold">client side vs server side tracking</span> to ensure your marketing budget works smarter, not harder.
          </p>
        </motion.div>

        {/* Services Cards Animation */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -10 }}
              className="group bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all duration-300 relative flex flex-col justify-between"
            >
              <div>
                {/* Icon Container */}
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <div className="text-blue-600 group-hover:text-white">
                    {service.icon}
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-tight group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>
                
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 text-sm font-medium">
                  {service.desc}
                </p>
              </div>

              <Link href={service.link} className="flex items-center text-blue-600 font-black text-xs uppercase tracking-widest cursor-pointer group/link">
                Explore Service 
                <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}