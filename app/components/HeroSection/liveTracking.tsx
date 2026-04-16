"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaLaptop, FaTimes, FaUserShield, FaArrowRight } from 'react-icons/fa'
import Link from 'next/link'

export default function LiveNotificationMap() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Check kora jekhane user ei session-e popup-ti dekheche kina
    const hasSeenPopup = sessionStorage.getItem('hasSeenTrackingPopup');

    if (!hasSeenPopup) {
      // 2. Page load hobar 4 second por show hobe
      const timer = setTimeout(() => {
        setIsVisible(true);
        
        // 3. Ebar eta 20 second porjonto thakbe (Longer duration for reading)
        const hideTimer = setTimeout(() => {
          setIsVisible(false);
          sessionStorage.setItem('hasSeenTrackingPopup', 'true');
        }, 20000); // 20000ms = 20 seconds

        return () => clearTimeout(hideTimer);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasSeenTrackingPopup', 'true'); // Bondho korle ar ashbe na
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[999] w-[320px] md:w-[360px]"
        >
          <div className="bg-[#0f172a] border border-blue-500/30 p-5 rounded-2xl shadow-2xl relative">
            
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors p-1"
            >
              <FaTimes size={14} />
            </button>

            <div className="flex gap-4">
              {/* Live Status Indicator */}
              <div className="mt-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                  Live Audit Signal
                </h4>

                <div className="space-y-2">
                  <p className="text-sm text-slate-100 font-bold leading-tight">
                    Visitor from <span className="text-blue-400">United States</span> just landed on <span className="italic text-blue-200">"Google Ads Service"</span> page.
                  </p>
                  
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><FaLaptop /> Desktop</span>
                    <span className="text-green-500 font-bold uppercase tracking-tighter">✓ Captured via Server</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/50">
                  <p className="text-[10px] text-slate-500 mb-3 flex items-center gap-2 italic">
                    <FaUserShield className="text-blue-500/40" />
                    Tracking bypass enabled...
                  </p>
                  
                  <Link 
                    href="/services/server-side-tracking" 
                    className="inline-flex items-center gap-2 text-[10px] font-black text-white bg-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest shadow-lg shadow-blue-900/20 group"
                  >
                    How This Works 
                    <FaArrowRight size={8} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}