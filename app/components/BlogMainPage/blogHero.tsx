"use client"
import React from 'react'
import { motion, Variants } from 'framer-motion'
import { FaRss, FaSearch, FaDatabase, FaChartPie, FaMobileAlt } from 'react-icons/fa'
import { useBlogStore } from '@/app/store/useBlogStore';


// এনিমেশন ভেরিয়েন্টগুলো আগের মতোই থাকছে...
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const floatVariants: Variants = {
  hidden: { opacity: 0, y: 0 },
  animate: {
    y: [-15, 15],
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }
  },
  visible: { opacity: 0.2, transition: { delay: 1, duration: 1 } }
};

export default function BlogHero() {
  // Zustand স্টোর থেকে স্টেট এবং ফাংশন নিয়ে আসা
  const searchQuery = useBlogStore((state) => state.searchQuery);
  const setSearchQuery = useBlogStore((state) => state.setSearchQuery);

  return (
    <section className="relative pt-16 pb-20 lg:pt-20 lg:pb-32 bg-white dark:bg-slate-950 overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none">
         {[
            { icon: FaDatabase, top: "20%", left: "10%" },
            { icon: FaChartPie, top: "30%", right: "15%" },
            { icon: FaMobileAlt, bottom: "25%", left: "20%" },
            { icon: FaSearch, bottom: "35%", right: "25%" },
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              className="absolute"
              style={{ top: item.top, left: item.left, right: item.right, bottom: item.bottom }}
              variants={floatVariants}
              initial="hidden"
              animate={["animate", "visible"]}
            >
              <item.icon className="text-blue-600/30 text-5xl md:text-7xl" />
            </motion.div>
          ))}
      </div>

      <motion.div 
        className="container mx-auto px-6 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          <motion.div 
            variants={childVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest"
          >
            <FaRss /> The Tracking Journal
          </motion.div>

          <motion.h1 
            variants={childVariants}
            className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none"
          >
            Insights, Tips & Guides on <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              Ads, Tracking & Growth.
            </span>
          </motion.h1>

          <motion.p 
            variants={childVariants}
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Learn how to recover lost data, optimize your ad spend, and master the world of server-side tracking with my deep-dive articles.
          </motion.p>

          {/* Search Bar - কানেক্ট করা হয়েছে */}
          <motion.div 
            variants={childVariants}
            whileHover={{ scale: 1.02 }}
            className="max-w-xl mx-auto relative group pt-4"
          >
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <FaSearch />
            </div>
            <input 
              type="text" 
              value={searchQuery} // স্টেট থেকে ভ্যালু নিচ্ছে
              onChange={(e) => setSearchQuery(e.target.value)} // টাইপ করলেই স্টেট আপডেট হচ্ছে
              placeholder="Search for articles (e.g. CAPI, iOS 14, GTM...)" 
              className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-slate-900 dark:text-white"
            />
          </motion.div>

        </div>
      </motion.div>
    </section>
  )
}