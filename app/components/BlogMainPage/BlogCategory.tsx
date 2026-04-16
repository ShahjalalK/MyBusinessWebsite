"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { useBlogStore } from '@/app/store/useBlogStore';


const categories = ["All Posts", "Facebook CAPI", "Server-side Tracking", "Google Ads", "Web Analytics", "Email Marketing"];

export default function BlogCategories() {
  // Zustand স্টোর থেকে স্টেট এবং ফাংশন নিয়ে আসা
  const activeTab = useBlogStore((state) => state.activeCategory);
  const setActiveTab = useBlogStore((state) => state.setActiveCategory);

  return (
    <section className="pb-16 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 p-2 bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-md rounded-[2.5rem] border border-slate-100 dark:border-slate-800 max-w-fit mx-auto">
          {categories.map((category) => {
            const isActive = activeTab === category;
            return (
              <button
                key={category}
                onClick={() => setActiveTab(category)} // ক্লিক করলে স্টোর আপডেট হবে
                className={`relative px-6 py-3 rounded-full text-sm font-bold transition-all duration-500 outline-none ${
                  isActive ? "text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <span className="relative z-10">{category}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg shadow-blue-500/30"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}