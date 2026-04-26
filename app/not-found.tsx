"use client"
import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search,  Ghost } from 'lucide-react'
import Navbar from './components/navbar'
import Footer from './components/footer'

export default function NotFound() {
  return (
    <>    
    <Navbar />

    <div className="min-h-screen bg-white dark:bg-[#020617] flex items-center justify-center px-6 overflow-hidden relative">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[20%] h-[20%] bg-indigo-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="container max-w-2xl text-center relative z-10">
        
        {/* Animated Icon */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] mb-8 relative"
        >
          <Ghost size={48} className="text-blue-600 dark:text-blue-400 animate-bounce" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-blue-400 rounded-[2rem] blur-xl -z-10"
          ></motion.div>
        </motion.div>

        {/* 404 Text */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-9xl font-black text-slate-900 dark:text-white tracking-tighter mb-4"
        >
          404
        </motion.h1>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-6 tracking-tight"
        >
          Lost in Tracking?
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-md mx-auto font-medium leading-relaxed"
        >
          The page you are looking for has been bypassed or doesn't exist. Let's get you back to the main container.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link 
            href="/" 
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:shadow-2xl hover:shadow-blue-500/40 transition-all hover:scale-105 active:scale-95 group"
          >
            <Home size={18} /> Back to Home
          </Link>
          
          <Link 
            href="/contact" 
            className="flex items-center gap-2 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Contact Support <ArrowLeft size={18} className="rotate-180" />
          </Link>
        </motion.div>

        {/* Decorative Tag */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 flex items-center justify-center gap-3 opacity-50"
        >
          <div className="h-px w-12 bg-slate-300 dark:bg-slate-700"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Error Protocol: Null_Pointer</span>
          <div className="h-px w-12 bg-slate-300 dark:bg-slate-700"></div>
        </motion.div>

      </div>
    </div>

    <Footer />
    </>
  )
}