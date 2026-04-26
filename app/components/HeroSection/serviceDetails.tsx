"use client"
import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link' 
import { Check, Target, Server, Mail, ChevronRight } from 'lucide-react'

const MotionLink = motion(Link);

const detailedServices = [
  {
    title: "Expert Google Ads Management", // 'Expert' keyword added
    icon: <Target className="w-8 h-8 text-blue-600" />,
    description: "As a certified Google Ads Specialist, I build conversion-focused campaigns. From deep keyword research to scaling high-performance PMax campaigns that maximize your ROAS.",
    features: ["Search & Display Ads", "PMax Campaign Optimization", "Advanced Remarketing", "Competitor Data Analysis"],
    color: "blue",
    link: "/services/google-ads-expert",
  },
  {
    title: "GTM Server-Side Tracking", // Keyword optimized title
    icon: <Server className="w-8 h-8 text-indigo-600" />,
    description: "Future-proof your analytics. I set up private GTM server containers to bypass iOS 14+ restrictions, recover 40% of lost data, and fix tracking gaps permanently.",
    features: ["First-Party Cookie Setup", "GA4 Server-Side Config", "Meta Conversions API", "Data Accuracy Audit"],
    color: "indigo",
    link: "/services/server-side-tracking",
  },
  {
    title: "Professional Email Signatures",
    icon: <Mail className="w-8 h-8 text-cyan-600" />,
    description: "Transform every outgoing email into a high-ticket client magnet. I design clickable, responsive HTML signatures that drive traffic and build instant brand authority.",
    features: ["Interactive CTA Buttons", "Mobile Responsive Design", "Social Media Integration", "Custom Brand Branding"],
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
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 leading-tight">
            Advanced Tracking & <br /> <span className="text-blue-600">Marketing Infrastructure.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
            We provide the technical backbone for modern e-commerce. From recovering lost conversion data to scaling ads that actually bring in revenue.
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
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center p-8 md:p-12 rounded-[3.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-shadow duration-500`}
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
                
                <MotionLink 
                  href={service.link} 
                  whileHover={{ x: 5 }}
                  className="inline-flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs group"
                >
                  See how we solve this 
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </MotionLink>
              </div>

              {/* Right Side: Features List */}
              <div className="w-full lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {service.features.map((feature, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                    className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-start gap-4 shadow-sm transition-all"
                  >
                    <div className="mt-1 bg-emerald-500/10 p-1 rounded-full">
                      <Check className="w-4 h-4 text-emerald-600" />
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