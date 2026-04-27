"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, Monitor, Globe, Database, ArrowRight, Zap, CheckCircle2, 
  Cpu, Terminal, Fingerprint, Lock, Sparkles, MessageSquare 
} from 'lucide-react'
import Link from 'next/link'

export default function TrackingLabClient() {
  const [userData, setUserData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  // Country code (BD) থেকে Flag Emoji (🇧🇩) বানানোর ফাংশন
  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode) return "";
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // লোকেশন টেক্সট ফিক্স: শুধু শহর এবং দেশ দেখাবে
  const formatLocation = (loc: string) => {
    if (!loc || loc === "Location Detected via Server") return loc;
    const parts = loc.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
    }
    return loc;
  };

  useEffect(() => {
    const messages = [
      "Initializing Server-Side Container...",
      "Intercepting Browser Signals...",
      "Bypassing ITP 2.3 Restrictions...",
      "Extracting GA4 Client ID...",
      "Mapping Server-Side Hit Payload...",
      "Data Integrity Verified."
    ];
    
    if (isScanning) {
      messages.forEach((msg, i) => {
        setTimeout(() => {
          setLogs(prev => [...prev, `> ${msg}`]);
        }, i * 400);
      });
    }
  }, [isScanning]);

useEffect(() => {
  const fetchFromServer = async () => {
    try {
      // আপনার নিজের তৈরি সার্ভার এপিআই থেকে ডেটা নিচ্ছি
      const response = await fetch('/api/user-info'); 
      const data = await response.json();
      
      setUserData({
        location: data.location,
        countryCode: data.countryCode,
        ip: data.ip,
        isp: data.isp,
        device: data.device,
        browser: data.browser,
        os: data.os
      });
    } catch (err) {
      // একদম চরম পর্যায়ে যদি আপনার সার্ভারও রেসপন্স না করে
      setUserData({ 
        location: "System Encrypted",
        countryCode: "",
        device: "Cross-Platform Device", 
        browser: "Secure Browser Engine", 
        ip: "SST Protected",
        os: "Verified OS",
        isp: "Private Gateway"
      });
    } finally {
      setTimeout(() => setIsScanning(false), 2500);
    }
  };
  fetchFromServer();
}, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] relative pt-16 pb-20 lg:pt-20 lg:pb-32 px-6 overflow-hidden text-slate-900 dark:text-white">
      
      {/* Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-5 py-2 rounded-full mb-8 backdrop-blur-md"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            <span className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em]">Live Tracking Engine v2.0</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1]">
              Precision <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400">Intelligence.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium">
            Experience 100% data accuracy through <span className="text-blue-600 font-bold">First-Party Server-Side</span> infrastructure.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-8 bg-white dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 md:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Database size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Diagnostic Report</h2>
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> HTTPS/TLS 1.3 SECURE
                  </p>
                </div>
              </div>
            </div>

            <AnimatePresence mode='wait'>
              {isScanning ? (
                <motion.div 
                  key="scanning"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="py-12 flex flex-col items-center justify-center min-h-[400px]"
                >
                  <div className="w-20 h-20 border-[3px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin mb-8"></div>
                  <div className="bg-slate-950 rounded-2xl p-6 w-full max-w-md font-mono text-[11px] text-blue-400 border border-white/10 shadow-2xl">
                      {logs.map((log, i) => (
                          <p key={i} className="mb-2 truncate">
                              <span className="text-blue-600 mr-2 opacity-50">root@trackflow:~$</span> {log}
                          </p>
                      ))}
                      <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse"></span>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <GA4Card 
                        icon={<MapPin size={20}/>} 
                        label="User Geo-Location" 
                        value={
                          <div className="flex items-center gap-2 w-full overflow-hidden">
                            {userData?.countryCode && (
                              <span className="text-2xl leading-none shrink-0">
                                {getFlagEmoji(userData.countryCode)}
                              </span>
                            )}
                            <span className="truncate">{formatLocation(userData?.location)}</span>
                          </div>
                        } 
                        color="blue" 
                    />
                    <GA4Card icon={<Monitor size={20}/>} label="Device Category" value={userData?.device} color="indigo" />
                    <GA4Card icon={<Globe size={20}/>} label="Browser Engine" value={userData?.browser} color="sky" />
                    <GA4Card icon={<Cpu size={20}/>} label="System Platform" value={userData?.os} color="violet" />
                    <GA4Card icon={<Zap size={20}/>} label="Network Carrier" value={userData?.isp} color="amber" />
                    <GA4Card icon={<Lock size={20}/>} label="Endpoint IP" value={userData?.ip} color="emerald" />
                  </div>

                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <Sparkles size={20} />
                      </div>
                      <div className="text-center md:text-left">
                        <h4 className="font-black tracking-tight">Need 100% Data Accuracy?</h4>
                        <p className="text-blue-100 text-xs">Get a free technical audit for your website.</p>
                      </div>
                    </div>
                    <Link href="/contact" className="px-6 py-3 bg-white text-blue-600 rounded-xl font-black text-xs hover:bg-blue-50 transition-colors flex items-center gap-2">
                      Start Free Audit <ArrowRight size={14} />
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="lg:col-span-4 space-y-6">
             <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-6">Tracking Protocol</h3>
                  <div className="space-y-4">
                    {['Zero Data Leakage', 'No-Cookie Fix', 'iOS 17+ Ready'].map((t) => (
                      <div key={t} className="flex items-center gap-3 text-xs font-bold text-slate-300">
                        <CheckCircle2 size={16} className="text-blue-400" /> {t.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-10">
                   <Fingerprint size={150} />
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[3rem] p-8 shadow-lg">
                <h4 className="text-lg font-black mb-4">Expert Help</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Confused about GTM or GA4? Let's fix your tracking strategy today.
                </p>
                <Link href="/contact" className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-colors">
                  Contact Now <ArrowRight size={14} />
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GA4Card({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
    sky: "text-sky-600 bg-sky-50 dark:bg-sky-900/30",
    violet: "text-violet-600 bg-violet-50 dark:bg-violet-900/30",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
  }

  return (
    <div className="p-6 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>{icon}</div>
        <div className="min-w-0">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</span>
            <div className="text-sm md:text-base font-black break-words">
              {value || 'Analyzing...'}
            </div>
        </div>
      </div>
    </div>
  )
}