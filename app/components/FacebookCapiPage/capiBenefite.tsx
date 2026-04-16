"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaChartLine, FaBullseye, FaUserCheck, FaDatabase } from 'react-icons/fa'
import { BsArrowUpRightCircleFill } from 'react-icons/bs'

const benefits = [
  {
    icon: <FaChartLine />,
    title: "Skyrocket Your ROAS",
    desc: "When Facebook gets accurate data, it optimizes better. Most of my clients see a 20-30% increase in Return on Ad Spend (ROAS) after a perfect CAPI setup.",
    color: "from-blue-600 to-cyan-500"
  },
  {
    icon: <FaDatabase />,
    title: "Zero Data Loss",
    desc: "Bypass ad-blockers and iOS tracking restrictions. Stop guessing and start seeing 100% of your customer journey from click to purchase.",
    color: "from-indigo-600 to-blue-500"
  },
  {
    icon: <FaBullseye />,
    title: "Better Ad Optimization",
    desc: "Feed the Facebook algorithm with high-quality signals. This allows the AI to find your ideal customers faster and cheaper.",
    color: "from-blue-700 to-indigo-600"
  },
  {
    icon: <FaUserCheck />,
    title: "Lower Cost Per Action (CPA)",
    desc: "Precise tracking means less wasted ad spend on people who don't convert. Optimize your budget and reduce your cost per lead or sale.",
    color: "from-cyan-600 to-blue-500"
  }
];

export default function CapiBenefitsSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] -z-10"></div>
      
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px]"
            >
              Why Choose CAPI
            </motion.span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mt-2">
              Transform Your Ads Into A <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                Revenue Machine.
              </span>
            </h2>
          </div>
          <div className="hidden md:block">
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-[300px] text-right text-sm">
              Don't just track data, track growth with server-side precision.
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative p-1 rounded-[3rem] bg-slate-100 dark:bg-slate-800/50 hover:bg-gradient-to-br transition-all duration-500 overflow-hidden"
              style={{ backgroundImage: `linear-gradient(to bottom right, transparent, transparent)` }}
            >
               {/* Hover Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

              <div className="relative bg-white dark:bg-slate-900 p-10 rounded-[2.8rem] h-full flex flex-col items-start space-y-6">
                <div className={`text-4xl bg-gradient-to-br ${benefit.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-500`}>
                  {benefit.icon}
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>

                <div className="pt-4 mt-auto">
                   <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                     <BsArrowUpRightCircleFill size={20} className="group-hover:rotate-45 transition-transform" />
                     <span>Proven Results</span>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 text-center"
        >
          <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent w-full mb-12"></div>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
            The Goal: <span className="text-slate-900 dark:text-white">Spend Less, Earn More, Track Everything.</span>
          </p>
        </motion.div>

      </div>
    </section>
  )
}