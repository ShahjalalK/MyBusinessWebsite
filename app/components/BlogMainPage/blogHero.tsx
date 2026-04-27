"use client"
import React from 'react'
import { motion, Variants } from 'framer-motion'
import { FaPenNib, FaSearch, FaEnvelope, FaIdCard, FaPalette } from 'react-icons/fa'
import { useBlogStore } from '@/app/store/useBlogStore';

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
  const searchQuery = useBlogStore((state) => state.searchQuery);
  const setSearchQuery = useBlogStore((state) => state.setSearchQuery);

  return (
    <section className="relative pt-16 pb-20 lg:pt-20 lg:pb-32 bg-white dark:bg-slate-950 overflow-hidden">
      
      {/* Background Decor - Email & Design Icons */}
      <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none">
          {[
            { icon: FaEnvelope, top: "20%", left: "10%" },
            { icon: FaIdCard, top: "30%", right: "15%" },
            { icon: FaPalette, bottom: "25%", left: "20%" },
            { icon: FaPenNib, bottom: "35%", right: "25%" },
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
        <div className="max-w-5xl mx-auto text-center space-y-8">
          
          <motion.div 
            variants={childVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest"
          >
            <FaPenNib className="animate-bounce" /> Signature Design Tips
          </motion.div>

          {/* SEO Optimized H1: Focusing on Personalized & Professional Signatures */}
          <motion.h1 
            variants={childVariants}
            className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.95]"
          >
            Elevate Your Brand with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
               Professional Email Signatures.
            </span>
          </motion.h1>

          {/* Content focused on HIPAA compliance and personalized branding */}
          <motion.p 
            variants={childVariants}
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed"
          >
            Insights on creating <span className="text-slate-900 dark:text-slate-200 font-bold">personalized signatures</span>, 
            mastering <span className="text-slate-900 dark:text-slate-200 font-bold">HIPAA disclaimers</span>, 
            and building trust in every email you send.
          </motion.p>

          <motion.div 
            variants={childVariants}
            whileHover={{ scale: 1.01 }}
            className="max-w-xl mx-auto relative group pt-4"
          >
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <FaSearch />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search Design Articles"
              placeholder="Search for Clickable signatures, HTML tips..." 
              className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-none focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </motion.div>

        </div>
      </motion.div>
    </section>
  )
}