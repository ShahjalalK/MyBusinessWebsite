"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Search, PenTool, BarChart4, Settings2, Rocket } from 'lucide-react'
import Link from 'next/link';

const detailedServices = [
  {
    step: "01",
    icon: <Search className="text-blue-600" size={24} />,
    title: "Strategic Keyword Research",
    description: "We don't just find keywords; we find 'Buyer Intent'. We analyze search volume, competition, and negative keywords to ensure you only pay for high-value traffic."
  },
  {
    step: "02",
    icon: <Rocket className="text-blue-600" size={24} />,
    title: "Expert Campaign Setup",
    description: "From Search and Shopping to Display and Remarketing, we build campaign structures (Alpha-Beta/SKAGs) that Google's algorithm loves."
  },
  {
    step: "03",
    icon: <PenTool className="text-blue-600" size={24} />,
    title: "High-Converting Ad Copy",
    description: "Words that sell. We write compelling headlines and descriptions that increase your Click-Through Rate (CTR) and lower your Cost-Per-Click."
  },
  {
    step: "04",
    icon: <BarChart4 className="text-blue-600" size={24} />,
    title: "Full Conversion Tracking",
    description: "The backbone of ROI. We set up GTM, GA4, and Server-Side tracking to ensure every conversion is attributed correctly to the right campaign."
  },
  {
    step: "05",
    icon: <Settings2 className="text-blue-600" size={24} />,
    title: "Continuous Optimization",
    description: "Data-driven scaling. We perform weekly bid adjustments, A/B testing, and audience refining to keep your ROAS growing month after month."
  }
];

export default function GoogleAdsServicesBreakdown() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 inline-block"
          >
            What's Included
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            Everything You Need to <br />
            <span className="text-blue-600">Dominating Google Search.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            A complete, end-to-end management service designed to take the guesswork out of your advertising.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {detailedServices.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden"
            >
              {/* Step Number Background */}
              <span className="absolute top-6 right-8 text-6xl font-black text-slate-200/50 dark:text-slate-800/30 group-hover:text-blue-600/10 transition-colors">
                {service.step}
              </span>

              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center mb-8 shadow-sm group-hover:shadow-blue-500/10 transition-all">
                {service.icon}
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 relative z-10">
                {service.title}
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed relative z-10">
                {service.description}
              </p>
            </motion.div>
          ))}

          {/* Special CTA Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-[2.5rem] bg-blue-600 flex flex-col justify-center items-center text-center text-white"
          >
            <h3 className="text-2xl font-black mb-4">Ready to Grow?</h3>
            <p className="text-blue-100 text-sm mb-8">
              Let's audit your account and find the hidden opportunities.
            </p>
            <Link href="/book-audit" className="px-6 py-3 bg-white text-blue-600 font-black rounded-xl text-sm shadow-xl hover:bg-slate-100 transition-all">
              Book Free Audit
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  )
}