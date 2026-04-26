"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, Monitor, Globe, Database, ArrowRight, Zap, CheckCircle2, 
  Cpu, Terminal, Fingerprint, Lock, Sparkles, MessageSquare 
} from 'lucide-react'
import Link from 'next/link'
// ফ্ল্যাগ আইকনের জন্য এগুলো ইমপোর্ট করুন (npm install country-flag-icons আগে করে নিন)
import * as Flags from 'country-flag-icons/react/3x2'

export default function TrackingLabClient() {
  const [userData, setUserData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  // লোকেশন টেক্সট ছোট করার ফাংশন
  const formatLocation = (loc: string) => {
    if (!loc) return "Analyzing...";
    const parts = loc.split(',');
    // যদি অনেক বড় ঠিকানা হয়, তবে শুধু শেষ ২ অংশ (City, Country) দেখাবে
    if (parts.length > 1) {
      return `${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim()}`;
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
        const response = await fetch('/api/user-info');
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setUserData({ 
          location: "Dhaka, Bangladesh", 
          countryCode: "BD",
          device: "Apple MacBook Pro", 
          browser: "Chrome", 
          ip: "103.114.173.xxx",
          os: "macOS 14.2",
          isp: "Local ISP"
        });
      } finally {
        setTimeout(() => setIsScanning(false), 3000);
      }
    };
    fetchFromServer();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] relative pt-16 pb-20 lg:pt-20 lg:pb-32 px-6 overflow-hidden">
      
      {/* Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px]"></div>
          <div 
            className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]" 
            style={{ 
              backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }}
          ></div>
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
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tightest mb-8 leading-[0.85]">
              Precision <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400">Intelligence.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-xl font-medium leading-relaxed">
            Experience 100% data accuracy through <span className="text-blue-600 font-bold">First-Party Server-Side</span> infrastructure.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-8 bg-white dark:bg-slate-900/50 rounded-[3.5rem] border border-slate-200 dark:border-white/5 p-10 md:p-14 shadow-2xl backdrop-blur-xl relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                <Fingerprint size={120} className="text-blue-600" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-blue-600 dark:to-indigo-700 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl rotate-3">
                  <Database size={30} />
                </div>
                <div>
                  <h2 className="text-3xl font-black dark:text-white tracking-tighter">Diagnostic Report</h2>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Protocol: HTTPS/TLS 1.3 Secure</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['AES-256 Hashing', 'No-Cookie Fix', 'iOS 17+ Ready'].map(tag => (
                  <span key={tag} className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[9px] font-black px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 uppercase tracking-widest">
                      {tag}
                  </span>
                ))}
              </div>
            </div>

            <AnimatePresence mode='wait'>
              {isScanning ? (
                <motion.div 
                  key="scanning"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="py-16 flex flex-col items-center justify-center min-h-[400px]"
                >
                  <div className="relative mb-10">
                      <div className="w-24 h-24 border-[3px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                      <Terminal size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 animate-pulse" />
                  </div>
                  <div className="bg-slate-950 rounded-2xl p-6 w-full max-w-md font-mono text-xs text-blue-400 border border-white/10 shadow-2xl">
                      {logs.map((log, i) => (
                          <motion.p initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={i} className="mb-2">
                              <span className="text-blue-600 mr-2 font-bold">root@trackflow:~$</span> {log}
                          </motion.p>
                      ))}
                      <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1"></span>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    <GA4Card 
                        icon={<MapPin size={20}/>} 
                        label="User Geo-Location" 
                        value={
                          <div className="flex items-center gap-3 overflow-hidden">
                            {userData?.countryCode && (
                              <div className="w-6 h-4 shrink-0 overflow-hidden rounded-sm border border-slate-100 dark:border-white/10 shadow-sm">
                                {/* SVG Flag Rendering */}
                                {React.createElement((Flags as any)[userData.countryCode.toUpperCase()] || Flags.US)}
                              </div>
                            )}
                            <span className="truncate" title={userData?.location}>
                              {formatLocation(userData?.location)}
                            </span>
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-8 rounded-[2.5rem] bg-blue-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-blue-500/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Sparkles className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black tracking-tight">Need 100% Tracking Accuracy?</h4>
                        <p className="text-blue-100 text-sm font-medium">Get a free technical audit for your website.</p>
                      </div>
                    </div>
                    <Link href="/contact" className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-sm hover:scale-105 transition-transform flex items-center gap-2 whitespace-nowrap">
                      Start Free Audit <ArrowRight size={16} />
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
             <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex-1">
                <h3 className="text-3xl font-black mb-6 tracking-tighter">Future-Proof Data Protocol.</h3>
                <div className="space-y-4">
                  {['Zero Data Leakage', 'Ultra-Fast Loading', 'iOS 17+ Fix'].map((t) => (
                    <div key={t} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                      <CheckCircle2 size={18} className="text-blue-300 shrink-0" />
                      <span className="text-sm font-black uppercase">{t}</span>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[3.5rem] p-10 shadow-xl">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  <MessageSquare size={24} />
                </div>
                <h4 className="text-xl font-black dark:text-white mb-2 tracking-tight">Expert Consultation</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                  Confused about GTM Server-Side or GA4? Let's discuss your tracking strategy.
                </p>
                <Link href="/contact" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors group">
                  Contact Me <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
    <motion.div whileHover={{ y: -5 }} className="p-8 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2.5rem] transition-all relative overflow-hidden group shadow-sm hover:shadow-2xl min-h-[160px]">
      <div className="flex flex-col gap-6 h-full justify-between">
        <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
        <div className="overflow-hidden">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] block mb-2">{label}</span>
            <div className="text-lg md:text-xl font-black text-slate-900 dark:text-white truncate tracking-tight">{value || 'Analyzing...'}</div>
        </div>
      </div>
    </motion.div>
  )
}