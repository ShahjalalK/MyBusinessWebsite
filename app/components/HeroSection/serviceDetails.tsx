"use client"
import React from 'react'
import { motion } from 'framer-motion'
// Next.js এর আসল Link ইম্পোর্ট করুন
import Link from 'next/link' 
import { Check, Target, Server, Mail, ChevronRight } from 'lucide-react'

// motion এবং Link কে একসাথে ব্যবহার করার জন্য
const MotionLink = motion(Link);

const detailedServices = [
  {
    title: "Google Ads Management",
    icon: <Target className="w-8 h-8 text-blue-600" />,
    description: "We don't just set up ads; we build revenue engines. From keyword research to scaling high-performance PMax campaigns.",
    features: ["Search & Display Ads", "Performance Max (PMax)", "Remarketing Strategy", "Competitor Analysis"],
    color: "blue",
    link: "/services/google-ads-expert",
  },
  {
    title: "Server-Side Tracking (SST)",
    icon: <Server className="w-8 h-8 text-indigo-600" />,
    description: "Future-proof your data. We set up private GTM servers to bypass iOS 14+ restrictions and recover lost conversions.",
    features: ["GTM Server-Side Setup", "GA4 Configuration", "First-Party Cookies", "Data Accuracy Audit"],
    color: "indigo",
    link: "/services/server-side-tracking",
  },
  {
    title: "Clickable Email Signatures",
    icon: <Mail className="w-8 h-8 text-cyan-600" />,
    description: "Transform every outgoing email into a marketing tool. Professional HTML signatures that drive traffic to your links.",
    features: ["Interactive CTA Buttons", "Mobile Responsive Design", "Social Media Integration", "Brand Consistency"],
    color: "cyan",
    link: "/services/email-signature",
  }
]

export default function ServiceDetails() {
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
            Deep Dive
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            Our Specialized <span className="text-blue-600">Solutions.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
            We focus on three core areas to ensure your business has the data, the visibility, and the professional branding it deserves.
          </p>
        </div>

        {/* Detailed Service Cards */}
        <div className="space-y-12">
          {detailedServices.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center p-8 md:p-12 rounded-[3.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800`}
            >
              {/* Left Side */}
              <div className="w-full lg:w-1/2">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-xl mb-8">
                  {service.icon}
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 font-medium leading-relaxed">
                  {service.description}
                </p>
                
                {/* সংশোধন করা লিঙ্ক অংশ */}
                <MotionLink 
                  href={service.link} 
                  whileHover={{ x: 5 }}
                  className="inline-flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs group decoration-none"
                >
                  Learn about our workflow 
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </MotionLink>
              </div>

              {/* Right Side: Features List */}
              <div className="w-full lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {service.features.map((feature, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-start gap-4 shadow-sm"
                  >
                    <div className="mt-1 bg-blue-600/10 p-1 rounded-full">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}