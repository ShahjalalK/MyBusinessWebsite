"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, ShoppingCart, Users, ShieldCheck, TrendingUp } from 'lucide-react'
import { Category, useCaseStadyFilterStore } from '@/app/store/useCaseStadyFilterStore';


export default function CaseStudyFilter() {
  // Zustand থেকে স্টেট এবং ফাংশন নিয়ে আসা
  const { activeTab, setActiveTab } = useCaseStadyFilterStore();

  const categories: { label: Category; icon: React.ReactNode }[] = [
    { label: 'All', icon: <LayoutGrid size={16} /> },
    { label: 'E-commerce', icon: <ShoppingCart size={16} /> },
    { label: 'Lead Generation', icon: <Users size={16} /> },
    { label: 'Tracking Setup', icon: <ShieldCheck size={16} /> },
    { label: 'Google Ads', icon: <TrendingUp size={16} /> },
  ];

  return (
    <section className="py-10 bg-white dark:bg-slate-950 sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-950/80">
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveTab(cat.label)}
              className={`
                relative flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300
                ${activeTab === cat.label 
                  ? 'text-white' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}
              `}
            >
              {activeTab === cat.label && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-600 rounded-2xl -z-10 shadow-lg shadow-blue-500/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <span className={`${activeTab === cat.label ? 'scale-110' : 'scale-100'} transition-transform`}>
                {cat.icon}
              </span>
              {cat.label}
            </button>
          ))}
        </div>
        <div className="mt-8 h-[1px] w-full bg-slate-100 dark:bg-slate-800" />
      </div>
    </section>
  )
}