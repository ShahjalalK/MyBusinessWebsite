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

      const timer = setTimeout(() => {
        setIsVisible(true);
        
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
          className="fixed bottom-6 right-6 z-[999] w-[350px] md:w-[400px]" // Width বাড়ানো হয়েছে
        >
          <div className="relative group overflow-hidden bg-slate-950/90 backdrop-blur-2xl border border-white/20 p-7 rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.9)]">
            
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 blur-[70px]"></div>
            
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2 rounded-full transition-all"
            >
              <FaTimes size={14} />
            </button>

            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-500/20 border border-blue-500/30">
                  <FaGlobe className="text-blue-400 animate-pulse" size={22} />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-500">
                    SST Intelligent Signal
                  </h4>
                  {/* ফন্ট সাইজ বাড়ানো হয়েছে (text-lg) */}
                  <p className="text-[17px] text-white font-extrabold leading-snug tracking-tight">
                    Welcome! Identified from <span className="text-blue-400">
                      {userData?.location || "Private Region"} {getFlagEmoji(userData?.countryCode) || "🌐"}
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  {/* মেইন টেক্সট এখন আরও বড় এবং পরিষ্কার (text-sm/base) */}
                  <p className="text-[14px] text-slate-200 leading-relaxed font-semibold">
                    This tracking precision is vital for your <span className="text-blue-400 font-bold underline underline-offset-4 decoration-blue-500/30">Ads Platforms</span> to reach the right audience and scale your business with maximum ROI.
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl text-[11px] text-slate-300 border border-white/10">
                      {userData?.device?.includes("Mobile") ? <FaMobileAlt size={12} className="text-blue-400" /> : <FaLaptop size={12} className="text-blue-400" />}
                      <span className="font-bold uppercase tracking-wider">{userData?.device || "Verified System"}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      ✓ Zero AdBlock Leak
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-white/10 space-y-5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium italic">
                    <FaUserShield className="text-blue-500/60" size={16} />
                    <span>Privacy-first server-side bypass active</span>
                  </div>
                  
                  <Link 
                    href="/services/server-side-tracking" 
                    className="flex items-center justify-center gap-3 w-full text-[12px] font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-2xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 uppercase tracking-[0.2em] shadow-[0_15px_30px_-10px_rgba(37,99,235,0.6)] group/btn"
                  >
                    Explore SST Tech
                    <FaArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
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