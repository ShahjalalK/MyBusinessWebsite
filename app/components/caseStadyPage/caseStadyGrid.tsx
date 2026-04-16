"use client"
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Zap, BarChart3, Globe, ShieldCheck } from 'lucide-react'
import { useCaseStadyFilterStore } from '@/app/store/useCaseStadyFilterStore';
import { caseStudies } from './caseStadyData';




export default function CaseStudyGrid() {
  const activeTab = useCaseStadyFilterStore((state) => state.activeTab);

  // ফিল্টারিং লজিক
  const filteredCases = activeTab === 'All' 
    ? caseStudies 
    : caseStudies.filter(item => item.filterCategory === activeTab);

  return (
    <section className="py-20 bg-white dark:bg-slate-950 min-h-[600px]">
      <div className="container mx-auto px-6">
        
        {/* গ্রিড কন্টেইনার */}
        <motion.div 
          layout 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
        >
          <AnimatePresence mode='popLayout'>
            {filteredCases.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="group relative flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 transition-all duration-500 overflow-hidden"
              >
                {/* কার্ডের ভেতরের কন্টেন্ট */}
                <div className="p-8 md:p-12 flex flex-col h-full">
                  
                  {/* Top: Tags & ID */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="space-y-3">
                      <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                        <Zap size={12} fill="currentColor" /> {item.tags}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tighter">
                        <BarChart3 size={14} className="text-blue-500" /> {item.category}
                      </div>
                    </div>
                    <div className="text-slate-200 dark:text-slate-800 text-6xl font-black leading-none select-none">
                      {item.id}
                    </div>
                  </div>

                  {/* Middle: Title & Description */}
                  <div className="flex-grow">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-6 leading-tight group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
                      {item.description}
                    </p>
                  </div>

                  {/* Bottom: Action Button */}
                  <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm group/btn uppercase tracking-tight">
                      View Case Study 
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all duration-300">
                        <ArrowUpRight size={18} />
                      </div>
                    </button>
                    
                    {/* Visual Indicator */}
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === 1 ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 dark:bg-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hover Background Decor */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State (যদি কোনো ক্যাটাগরিতে ডাটা না থাকে) */}
        {filteredCases.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-slate-300 dark:text-slate-700 mb-4 flex justify-center">
              <Globe size={64} />
            </div>
            <h3 className="text-xl font-bold text-slate-400">More case studies coming soon in this category...</h3>
          </motion.div>
        )}
      </div>
    </section>
  )
}