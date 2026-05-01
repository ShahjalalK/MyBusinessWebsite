"use client"

import React from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, TrendingUp, ShieldCheck, Mail, BarChart3 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" },
}

export default function CaseStudy() {
  const services = [
    {
      title: "Advanced Tracking & Attribution",
      desc: "Restore 100% data accuracy using Server-Side GTM and Meta Conversions API to bypass ad-blockers.",
      tag: "Tracking",
      results: "100% Accuracy",
      link: "/case-studies/server-side-tracking-expert-solution",
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      image: "/case-stady/facebook-conversions-api-server-side-tracking-proof.png", 
    },
    {
      title: "Google Ads Growth Strategy",
      desc: "Optimizing search and PMax campaigns to reduce wasted spend and maximize conversion value.",
      tag: "Google Ads",
      results: "Lower CPA",
      link: "/services/google-ads-audit",
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      image: "/screenshots/google-ads-results.png",
    },
    {
      title: "Clickable Email Signatures",
      desc: "Custom-coded interactive branding assets designed to drive traffic from every outgoing email.",
      tag: "Branding",
      results: "Brand Growth",
      link: "/case-study/clickable-email-signature-branding",
      icon: <Mail className="w-5 h-5 text-blue-600" />,
      image: "/screenshots/signature-mockup.png",
    },
  ]

  return (
    <section  id='case-studies' className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
            Featured <span className="text-blue-600">Case Studies</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
            A showcase of technical solutions and growth strategies implemented for global clients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              initial="initial"
              whileInView="whileInView"
              className="relative group" // Parent container
            >
              {/* কার্ডের পুরো এরিয়া ক্লিকযোগ্য করার জন্য Link এখন সবার উপরে */}
              <Link 
                href={item.link} 
                className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 relative z-10"
              >
                {/* Image Section */}
                <div className="relative h-56 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <Image 
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <div className="px-3 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm text-[10px] font-bold uppercase tracking-widest text-blue-600">
                      {item.tag}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      {item.icon}
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase">{item.results}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                    {item.desc}
                  </p>

                  <div className="mt-auto flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    Learn More 
                    <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}