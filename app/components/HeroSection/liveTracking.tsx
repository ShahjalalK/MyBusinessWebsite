"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaLaptop, FaTimes, FaUserShield, FaArrowRight, FaMobileAlt, FaGlobe } from 'react-icons/fa'
import Link from 'next/link'

export default function LiveNotificationMap() {
  const [isVisible, setIsVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode) return null;
    return countryCode
      .toUpperCase()
      .split("")
      .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join("");
  };

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('hasSeenTrackingPopup');

    if (!hasSeenPopup) {
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/user-info');
          const data = await response.json();
          setUserData(data);
        } catch (err) {
          setUserData({
            location: "Secure Region",
            device: "Verified Device",
            countryCode: ""
          });
        }
      };

      fetchUserData();

      // ৫ সেকেন্ড পর শো হবে (ভালো করে পড়ার সময় দিতে)
      const timer = setTimeout(() => {
        setIsVisible(true);
        
        // ২৫ সেকেন্ড পর হাইড হবে
        const hideTimer = setTimeout(() => {
          setIsVisible(false);
          sessionStorage.setItem('hasSeenTrackingPopup', 'true');
        }, 25000);

        return () => clearTimeout(hideTimer);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasSeenTrackingPopup', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          className="fixed bottom-6 right-6 z-[999] w-[340px] md:w-[380px]"
        >
          {/* Main Card with Gradient Border Effect */}
          <div className="relative group overflow-hidden bg-slate-950/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
            
            {/* Animated Glow Decor */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 blur-[60px] group-hover:bg-blue-500/30 transition-all duration-500"></div>
            
            <button 
              onClick={handleClose}
              className="absolute top-5 right-5 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all"
            >
              <FaTimes size={12} />
            </button>

            <div className="flex gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                <div className="relative flex items-center justify-center h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <FaGlobe className="text-blue-400 animate-pulse" size={18} />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-500/80">
                    SST Intelligent Signal
                  </h4>
                  <p className="text-[15px] text-white font-bold leading-tight tracking-tight">
                    Welcome! Identified from <span className="text-blue-400">
                      {userData?.location || "Private Region"} {getFlagEmoji(userData?.countryCode) || "🌐"}
                    </span>
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-[12px] text-slate-300 leading-relaxed font-medium">
                    This tracking precision is vital for your <span className="text-blue-400 font-bold">Ads Platforms</span> to reach the right audience and scale your business with maximum ROI.
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg text-[10px] text-slate-400 border border-white/5">
                      {userData?.device?.includes("Mobile") ? <FaMobileAlt size={10} className="text-blue-400" /> : <FaLaptop size={10} className="text-blue-400" />}
                      <span className="font-semibold uppercase tracking-wider">{userData?.device || "Verified System"}</span>
                    </div>
                    <div className="px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                      ✓ Zero AdBlock Leak
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                    <FaUserShield className="text-blue-500/50" size={14} />
                    <span>Privacy-first server-side bypass active</span>
                  </div>
                  
                  <Link 
                    href="/services/server-side-tracking" 
                    className="flex items-center justify-center gap-2 w-full text-[11px] font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 rounded-2xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 uppercase tracking-[0.2em] shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)] group/btn"
                  >
                    Explore SST Tech
                    <FaArrowRight size={10} className="group-hover/btn:translate-x-1 transition-transform" />
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