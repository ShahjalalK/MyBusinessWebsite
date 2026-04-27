"use client"
import React, { useState, useEffect } from 'react'
import { Menu, X, ArrowRight, ChevronDown, Rocket, ShieldCheck, Mail, Activity, LayoutDashboard, Send, Clock, UserCheck, Lock, Sparkles, BookOpen, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { auth } from '../lib/firebase' 

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const isUserAdmin = !!(user && user.email && user.email === ADMIN_EMAIL);
      setIsAdmin(isUserAdmin);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, [ADMIN_EMAIL]);

  const handleNavClick = async (label: string) => {
    try {
      const gaCookie = document.cookie.match(/_ga=(?:GA1\.\d\.)?([\d.]+)/)?.[1];
      const sessionId = document.cookie.match(/_ga_Y0XEPCVC6L=GS1\.1\.([\d]+)/)?.[1];
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "navigation_click",
          service: label,
          clientId: gaCookie,
          sessionId: sessionId,
          pageTitle: document.title
        }),
      });
    } catch (err) {
      console.error("Nav Track Error:", err);
    }
  };

  return (
    <nav className={`sticky top-0 w-full z-[100] transition-all duration-500 ${
      scrolled 
      ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 py-3 shadow-xl" 
      : "bg-transparent py-5"
    }`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        
        {/* লোগো */}
        <Link href="/" className="relative z-10 flex items-center group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3 group-hover:rotate-[10deg] transition-all duration-300 shadow-lg shadow-blue-500/30">
            <span className="text-white font-black text-xl">T</span>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
            TrackFlow<span className="text-blue-600">Pro</span>
          </span>
        </Link>

        {/* ডেস্কটপ মেনু (অপরিবর্তিত) */}
        <div className="hidden lg:flex items-center gap-8">
          <NavLink href="/" onClick={() => handleNavClick('Home')}>Home</NavLink>
          
          <div className="group relative">
            <button className="flex items-center gap-1 text-[15px] font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors py-2">
              Solutions <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
              <div className="w-[650px] bg-white dark:bg-slate-900 shadow-[0px_30px_60px_rgba(0,0,0,0.12)] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 grid grid-cols-2 gap-6">
                <SolutionItem title="Server-Side Tracking" desc="Bypass ITP & iOS restrictions to recover 25% lost data with high precision." icon={<ShieldCheck className="w-6 h-6 text-blue-500" />} href="/services/server-side-tracking" onClick={() => handleNavClick('SST')} />
                <SolutionItem title="Google Ads Expert" desc="Strategic campaign management to scale your ROAS using data-driven insights." icon={<Rocket className="w-6 h-6 text-green-500" />} href="/services/google-ads-expert" onClick={() => handleNavClick('GAds')} />
                <SolutionItem title="Facebook CAPI" desc="Advanced Conversion API integration to stabilize your pixel performance." icon={<Activity className="w-6 h-6 text-indigo-500" />} href="/services/facebook-capi" onClick={() => handleNavClick('CAPI')} />
                <SolutionItem title="Email Signature" desc="Custom, clickable HTML signatures that enhance your brand's outreach." icon={<Mail className="w-6 h-6 text-orange-500" />} href="/services/email-signature" onClick={() => handleNavClick('EmailSign')} />
              </div>
            </div>
          </div>

          <NavLink href="/blog" onClick={() => handleNavClick('Blog')}>Blog</NavLink>
          <NavLink href="/jobs" onClick={() => handleNavClick('Jobs')}>Jobs</NavLink>

          {isAdmin && (
            <div className="group relative">
              <button className="flex items-center gap-1 text-[15px] font-black text-blue-600 py-2">
                <Lock className="w-3 h-3" /> Admin <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full left-0 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                <div className="w-[260px] bg-white dark:bg-slate-900 shadow-2xl rounded-3xl border border-blue-100 dark:border-slate-800 p-4 flex flex-col gap-1">
                  <AdminLink href="/admin/dashboard" label="Main Dashboard" icon={<LayoutDashboard size={16} />} onClick={() => handleNavClick('Admin Dashboard')} />
                  <AdminLink href="/admin/outreach" label="Outreach System" icon={<Send size={16} />} onClick={() => handleNavClick('Admin Outreach')} />
                  <AdminLink href="/admin/outreach/follow-up" label="Follow-up Manager" icon={<UserCheck size={16} />} onClick={() => handleNavClick('Admin FollowUp')} />
                  <AdminLink href="/admin/email-schedule/dashboard" label="Email Schedules" icon={<Clock size={16} />} onClick={() => handleNavClick('Admin Schedules')} />
                </div>
              </div>
            </div>
          )}

          <Link 
            href="/tracking-lab" 
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-2xl text-[13px] font-black hover:scale-105 transition-all shadow-sm"
          >
            <Sparkles size={14} className="animate-pulse" /> Tracking Lab
          </Link>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-4 relative z-10">
          <Link 
            href="/contact" 
            className="hidden sm:flex items-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-7 py-3 rounded-2xl text-sm font-black transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/40 active:scale-95 group"
          >
            Hire Expert <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* মোবাইল মেনু - সম্পূর্ণ ফিক্সড এবং অপ্টিমাইজড */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }} 
            className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <MobileNavLink href="/" onClick={() => setIsOpen(false)}>Home</MobileNavLink>
                <MobileNavLink href="/blog" onClick={() => setIsOpen(false)}>Blog</MobileNavLink>
                <MobileNavLink href="/jobs" onClick={() => setIsOpen(false)}>Jobs</MobileNavLink>
                
                {/* Mobile Tracking Lab */}
                <Link 
                  href="/tracking-lab" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 w-fit px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl font-bold text-sm"
                >
                  <Sparkles size={16} /> Tracking Lab
                </Link>
              </div>

              {/* Mobile Solutions Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Our Solutions</p>
                <div className="grid grid-cols-1 gap-3">
                  <MobileServiceLink href="/services/server-side-tracking" title="Server-Side Tracking" icon={<ShieldCheck size={18}/>} onClick={() => setIsOpen(false)} />
                  <MobileServiceLink href="/services/google-ads-expert" title="Google Ads Expert" icon={<Rocket size={18}/>} onClick={() => setIsOpen(false)} />
                  <MobileServiceLink href="/services/facebook-capi" title="Facebook CAPI" icon={<Activity size={18}/>} onClick={() => setIsOpen(false)} />
                  <MobileServiceLink href="/services/email-signature" title="Email Signature" icon={<Mail size={18}/>} onClick={() => setIsOpen(false)} />
                </div>
              </div>
              
              {/* মোবাইল অ্যাডমিন অপশন (সম্পূর্ণ লিঙ্কসহ) */}
              {isAdmin && (
                <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                    <Lock size={10} /> Admin Control
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><LayoutDashboard size={14}/> Dashboard</Link>
                    <Link href="/admin/outreach" onClick={() => setIsOpen(false)} className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Send size={14}/> Outreach</Link>
                    <Link href="/admin/outreach/follow-up" onClick={() => setIsOpen(false)} className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><UserCheck size={14}/> Follow-ups</Link>
                    <Link href="/admin/email-schedule/dashboard" onClick={() => setIsOpen(false)} className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Clock size={14}/> Schedules</Link>
                  </div>
                </div>
              )}

              <Link href="/contact" onClick={() => setIsOpen(false)} className="w-full text-center bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">Hire Expert Now</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

// Helper Components
function MobileServiceLink({ href, title, icon, onClick }: { href: string, title: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all">
      <span className="text-blue-500">{icon}</span>
      {title}
    </Link>
  )
}

function NavLink({ href, onClick, children }: { href: string, onClick?: () => void, children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="text-[15px] font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors relative group">
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full" />
    </Link>
  )
}

function MobileNavLink({ href, onClick, children }: { href: string, onClick: () => void, children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
      {children}
    </Link>
  )
}

function SolutionItem({ title, desc, icon, href, onClick }: { title: string, desc: string, icon: React.ReactNode, href: string, onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 rounded-3xl transition-all duration-300 group/item border border-transparent hover:border-blue-100 dark:hover:border-blue-800/50 flex flex-col gap-2">
      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover/item:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-[16px] font-black text-slate-900 dark:text-slate-100 group-hover/item:text-blue-600 transition-colors">{title}</p>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">{desc}</p>
      </div>
    </Link>
  )
}

function AdminLink({ href, label, icon, onClick }: { href: string, label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-all font-bold text-sm">
      <span className="text-blue-500">{icon}</span>
      {label}
    </Link>
  );
}