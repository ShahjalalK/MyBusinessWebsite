"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, Monitor, Globe, Database, ArrowRight, Zap, CheckCircle2, 
  Cpu, Terminal, Fingerprint, Lock, Sparkles, ShieldCheck, Activity
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

  // লোকেশন টেক্সট ফিক্স
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
      "SHA-256 Hashing Active...",
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
        setUserData({ 
          location: "System Encrypted",
          countryCode: "",
          device: "Cross-Platform", 
          browser: "Secure Engine", 
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
    <div className="min-h-screen bg-white dark:bg-[#020617] relative pt-16 pb-20 lg:pt-20 lg:pb-32 px-6 overflow-hidden text-slate-900 dark:text-white font-sans">
      
      {/* Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16">
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
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium italic">
            "Eliminating data gaps with <span className="text-blue-600 font-bold underline decoration-blue-500/30">Server-Side Tracking</span>."
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
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)]">
                  <Activity size={24} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Diagnostic Report</h2>
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} /> HTTPS/TLS 1.3 SECURE & HASHED
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
                  <div className="bg-slate-950 rounded-2xl p-6 w-full max-w-md font-mono text-[11px] text-blue-400 border border-white/10 shadow-2xl overflow-hidden">
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
                        isScanning={isScanning}
                    />
                    <GA4Card icon={<Monitor size={20}/>} label="Device Category" value={userData?.device} color="indigo" isScanning={isScanning} />
                    <GA4Card icon={<Globe size={20}/>} label="Browser Engine" value={userData?.browser} color="sky" isScanning={isScanning} />
                    <GA4Card icon={<Cpu size={20}/>} label="System Platform" value={userData?.os} color="violet" isScanning={isScanning} />
                    <GA4Card icon={<Zap size={20}/>} label="Network Carrier" value={userData?.isp} color="amber" isScanning={isScanning} />
                    <GA4Card icon={<Lock size={20}/>} label="Endpoint IP" value={userData?.ip} color="emerald" isScanning={isScanning} />
                  </div>

                  {/* Accuracy Gauge Section - NEW */}
                  <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-blue-500/20 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-white">Tracking Accuracy Gauge</h3>
                        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Bypassing Ad-Blockers & ITP 2.3</p>
                      </div>
                      
                      <div className="flex items-center gap-8 md:gap-16">
                        <div>
                          <div className="text-3xl font-black text-slate-500 line-through opacity-50">~72%</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Browser Based</div>
                        </div>
                        
                        <div className="flex items-center text-blue-500 animate-pulse">
                          <ArrowRight size={28} />
                        </div>

                        <div>
                          <div className="text-4xl font-black text-emerald-400 flex items-center gap-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                            100% <CheckCircle2 size={24} />
                          </div>
                          <div className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter underline decoration-wavy underline-offset-4">Server Optimized</div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px]"></div>
                  </div>

                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <Sparkles size={20} />
                      </div>
                      <div className="text-center md:text-left">
                        <h4 className="font-black tracking-tight">Ready for 100% Attribution?</h4>
                        <p className="text-blue-100 text-xs">Let's audit your GTM container and fix data leaks.</p>
                      </div>
                    </div>
                    <Link href="/book-audit" className="px-8 py-3 bg-white text-blue-700 rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2 group">
                      Get Free Audit <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="lg:col-span-4 space-y-6">
             <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-6">Security Protocol</h3>
                  <div className="space-y-5">
                    {[
                      { text: 'SHA-256 Data Hashing', icon: <Lock size={16}/> },
                      { text: 'First-Party Cookies', icon: <CheckCircle2 size={16}/> },
                      { text: 'iOS 17+ Anti-Leak', icon: <Fingerprint size={16}/> }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-300">
                        <span className="text-blue-400">{item.icon}</span> {item.text.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                   <Fingerprint size={180} />
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[3rem] p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-4 text-blue-600">
                  <Terminal size={20} />
                  <h4 className="text-lg font-black">Expert Console</h4>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                  Struggling with <span className="font-bold text-slate-900 dark:text-slate-200">Ad-Blockers</span> or <span className="font-bold text-slate-900 dark:text-slate-200">CAPI errors</span>? We build custom infrastructure to rescue your marketing ROI.
                </p>
                <Link href="/contact" className="flex items-center justify-center gap-2 w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl">
                  Connect Now <ArrowRight size={14} />
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GA4Card({ icon, label, value, color, isScanning }: { icon: any, label: string, value: any, color: string, isScanning: boolean }) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
    sky: "text-sky-600 bg-sky-50 dark:bg-sky-900/30",
    violet: "text-violet-600 bg-violet-50 dark:bg-violet-900/30",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
  }

  return (
    <div className="p-6 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="flex flex-col gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${colorMap[color]}`}>{icon}</div>
        <div className="min-w-0">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-1.5">{label}</span>
            <div className="text-sm md:text-base font-black break-words flex items-center gap-2">
              {value || 'Analyzing...'}
              {!isScanning && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.5 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-emerald-500"
                >
                  <ShieldCheck size={16} />
                </motion.span>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}