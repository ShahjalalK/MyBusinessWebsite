"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Send, Search, Rocket, ArrowRight } from 'lucide-react'

export default function WhatHappensNext() {
  const steps = [
    {
      icon: <Send className="text-blue-600" size={28} />,
      title: "You Contact Me",
      description: "Submit the form or reach out via WhatsApp/Fiverr with your project details.",
      color: "blue"
    },
    {
      icon: <Search className="text-orange-600" size={28} />,
      title: "Requirement Review",
      description: "I'll analyze your website and requirements to create a custom strategy for you.",
      color: "orange"
    },
    {
      icon: <Rocket className="text-blue-600" size={28} />,
      title: "Get Started",
      description: "I'll reply with the next steps, timeline, and a transparent proposal to begin.",
      color: "blue"
    }
  ];

  return (
    <section className="py-24 bg-slate-50/50 dark:bg-slate-900/20 border-y border-slate-100 dark:border-slate-800/50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4"
          >
            What Happens Next?
          </motion.h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Clear steps to get your project moving in the right direction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto relative">
          {/* Connecting Line (Desktop Only) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 border-t-2 border-dashed border-slate-200 dark:border-slate-800 -translate-y-12 z-0"></div>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              {/* Icon Circle */}
              <div className={`w-20 h-20 rounded-[2rem] bg-white dark:bg-slate-950 border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500 ring-2 ring-transparent group-hover:ring-blue-500/20`}>
                {step.icon}
              </div>

              {/* Text Content */}
              <div className="space-y-3 px-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  <span className="text-blue-600 mr-2 text-sm italic opacity-50">0{index + 1}.</span> 
                  {step.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow for Mobile (Optional Visual) */}
              {index < 2 && (
                <div className="md:hidden mt-8 text-slate-300">
                  <ArrowRight className="rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}