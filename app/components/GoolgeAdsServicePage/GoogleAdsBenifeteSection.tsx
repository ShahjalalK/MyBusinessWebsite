"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Rocket, PieChart, Target, CheckCircle } from 'lucide-react'

const benefits = [
  {
    icon: <Target className="text-white" size={24} />,
    color: "bg-blue-600",
    title: "More Qualified Leads",
    description: "Stop sorting through junk. We target high-intent users who are ready to buy, ensuring your sales team only talks to real prospects."
  },
  {
    icon: <Rocket className="text-white" size={24} />,
    color: "bg-indigo-600",
    title: "Better ROI / ROAS",
    description: "Maximize every cent. By cutting waste and scaling winners, we help you get a higher return on your ad spend consistently."
  },
  {
    icon: <PieChart className="text-white" size={24} />,
    color: "bg-purple-600",
    title: "Clear Data Insights",
    description: "No more guessing games. Get crystal-clear reports that show exactly which ads are driving revenue and how your business is growing."
  }
];

export default function GoogleAdsBenefitsSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
      <div className="container mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Content */}
          <div>
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 inline-block"
            >
              The Impact
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.1]">
              Results That Move The <br />
              <span className="text-blue-600">Needle Forward.</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-lg leading-relaxed mb-10 max-w-lg">
              Partnering with a Google Ads specialist means you stop managing "clicks" and start managing "growth". Here is what you can expect:
            </p>

            <div className="space-y-4">
              {["100% Data Accuracy", "Weekly Performance Sync", "Transparent Reporting"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-800 dark:text-slate-200 font-bold">
                  <CheckCircle size={18} className="text-blue-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Benefits Cards */}
          <div className="relative">
            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex flex-col gap-6 relative z-10">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex gap-6 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-blue-600/5 transition-all duration-500"
                >
                  <div className={`w-14 h-14 shrink-0 rounded-2xl ${benefit.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                      {benefit.description}
                    </p>
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