"use client"
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, MapPin, Monitor, Globe, Database, ArrowRight, Zap, CheckCircle2, LayoutPanelLeft, Cpu, Activity, TrendingDown, Target } from 'lucide-react'
import Navbar from '../components/navbar';
import Footer from '../components/footer';

export default function TrackingLab() {
  const [userData, setUserData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const fetchFromServer = async () => {
      try {
        const response = await fetch('/api/user-info');
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setUserData({ location: "Dhaka, BD", device: "Desktop", browser: "Chrome", ip: "103.xxx.xxx.xxx" });
      } finally {
        setTimeout(() => setIsScanning(false), 2000);
      }
    };
    fetchFromServer();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#fcfdfe] dark:bg-slate-950 pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full mb-6">
              <Activity size={14} className="text-blue-600 animate-pulse" />
              <span className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">Server-Side Engine Active</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              The <span className="text-blue-600 underline decoration-blue-200">Tracking</span> Lab
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
              We intercept browser signals at the server level, ensuring 100% data accuracy for your Google Ads campaigns.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-2xl shadow-blue-500/5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 pb-8 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 dark:bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                    <Database size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black dark:text-white">Live Data Stream</h2>
                    <p className="text-slate-400 text-xs font-bold">First-Party Cookie Container: FP-9928</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-green-100 text-green-600 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest">Bypassing ITP</span>
                  <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest">GTM SS Ready</span>
                </div>
              </div>

              {isScanning ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 border-[6px] border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">Analyzing Hit Payload...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <GA4Card icon={<MapPin size={20}/>} label="User Geo-Location" value={userData?.location} color="blue" />
                  <GA4Card icon={<Monitor size={20}/>} label="Device Category" value={userData?.device} color="indigo" />
                  <GA4Card icon={<Globe size={20}/>} label="Browser Engine" value={userData?.browser} color="sky" />
                  <GA4Card icon={<Cpu size={20}/>} label="System Platform" value={userData?.os} color="violet" />
                  <GA4Card icon={<Zap size={20}/>} label="ISP/Carrier" value={userData?.isp} color="amber" />
                  <GA4Card icon={<Database size={20}/>} label="Endpoint IP" value={userData?.ip} color="emerald" />
                </div>
              )}

              <div className="mt-12 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Google Ads Optimization Signals</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl shadow-sm flex items-center justify-center text-blue-600 border border-slate-100 dark:border-slate-700">
                       <Target size={20} />
                    </div>
                    <div>
                      <p className="font-black dark:text-white text-sm">Enhanced Conversions</p>
                      <p className="text-xs text-slate-500">First-party data hashing is active for better matching.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl shadow-sm flex items-center justify-center text-green-600 border border-slate-100 dark:border-slate-700">
                       <TrendingDown size={20} />
                    </div>
                    <div>
                      <p className="font-black dark:text-white text-sm">CPA Reduction</p>
                      <p className="text-xs text-slate-500">Recovering 25% of data lost to iOS & Ad-Blockers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-6">
               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-600/20">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                    <ShieldCheck size={28} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 leading-tight">Future-Proof Tracking</h3>
                  <p className="text-blue-100/80 text-sm leading-relaxed mb-6 font-medium">
                    As cookies disappear, server-side is the ONLY way to track Google Ads conversions accurately.
                  </p>
                  <ul className="space-y-3">
                    {['No Data Loss', 'Fast Load Speed', 'iOS 14+ Fix'].map((t) => (
                      <li key={t} className="flex items-center gap-2 text-xs font-bold text-white">
                        <CheckCircle2 size={14} className="text-blue-200" /> {t}
                      </li>
                    ))}
                  </ul>
               </div>

               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm grow flex flex-col justify-between group cursor-pointer hover:border-blue-600 transition-all">
                  <div>
                    <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">Ready to scale?</p>
                    <h4 className="text-2xl font-black dark:text-white leading-tight tracking-tighter">Fix your tracking today.</h4>
                  </div>
                  <button className="w-full mt-8 bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    Free Audit <ArrowRight size={18}/>
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function GA4Card({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    sky: "text-sky-600 bg-sky-50 dark:bg-sky-900/20",
    violet: "text-violet-600 bg-violet-50 dark:bg-violet-900/20",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-[2rem] hover:shadow-lg transition-all border-b-4 hover:border-b-blue-600">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.blue}`}>
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
      </div>
      <div className="text-lg font-black text-slate-900 dark:text-white truncate">
        {value || 'Detecting...'}
      </div>
    </div>
  )
}