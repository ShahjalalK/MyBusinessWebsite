"use client"
import React, { useState, useEffect } from 'react'
import { Menu, X, ArrowRight, ChevronDown, Rocket, ShieldCheck, Mail, Activity, LayoutDashboard, Send, Clock, UserCheck, Lock } from 'lucide-react'
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
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
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
        
        {/* ১. ব্র্যান্ড লোগো */}
        <Link href="/" className="relative z-10 flex items-center group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3 group-hover:rotate-[10deg] transition-all duration-300 shadow-lg shadow-blue-500/30">
            <span className="text-white font-black text-xl">T</span>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
            TrackFlow<span className="text-blue-600">Pro</span>
          </span>
        </Link>

        {/* ২. ডেস্কটপ মেনু */}
        <div className="hidden lg:flex items-center gap-10">
          <NavLink href="/" onClick={() => handleNavClick('Home')}>Home</NavLink>
          
          <div className="group relative">
            <button className="flex items-center gap-1 text-[15px] font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors py-2">
              Solutions <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
              <div className="w-[580px] bg-white dark:bg-slate-900 shadow-[0px_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 grid grid-cols-2 gap-4">
                
                <SolutionItem 
                  title="Server-Side Tracking" 
                  desc="Recover 25%+ data lost to iOS/Adblockers."
                  icon={<ShieldCheck className="w-5 h-5 text-blue-500" />}
                  href="/services/server-side-tracking"
                  onClick={() => handleNavClick('Server-Side Tracking')}
                />
                
                <SolutionItem 
                  title="Google Ads Expert" 
                  desc="Scaling your business with precision."
                  icon={<ArrowRight className="w-5 h-5 text-green-500" />}
                  href="/services/google-ads-expert" 
                  onClick={() => handleNavClick('Google Ads Expert')}
                />

                <SolutionItem 
                  title="Facebook CAPI" 
                  desc="Advanced Conversion API for better ROAS."
                  icon={<Rocket className="w-5 h-5 text-indigo-500" />}
                  href="/services/facebook-capi" 
                  onClick={() => handleNavClick('Facebook CAPI')}
                />
               
                <SolutionItem 
                  title="Email Signature" 
                  desc="Interactive & Clickable HTML Signatures."
                  icon={<Mail className="w-5 h-5 text-orange-500" />}
                  href="/services/email-signature" 
                  onClick={() => handleNavClick('Email Signature')}
                />
                
                <Link 
                  href="/case-studies" 
                  onClick={() => handleNavClick('All Case Studies')}
                  className="col-span-2 mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between hover:bg-blue-600 group/btn transition-all duration-300"
                >
                  <span className="text-sm font-black uppercase tracking-widest group-hover/btn:text-white transition-colors">View All Case Studies</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:text-white group-hover/btn:translate-x-2 transition-all" />
                </Link>
              </div>
            </div>
          </div>

          <NavLink href="/about" onClick={() => handleNavClick('About')}>About Us</NavLink>

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
            href="/tracking-checker" 
            onClick={() => handleNavClick('Tracking Checker')}
            className="relative group px-5 py-2 bg-blue-600/10 border border-blue-600/30 text-blue-600 rounded-full text-[13px] font-black hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.1)] flex items-center gap-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Tracking Lab
          </Link>
        </div>

        {/* ৪. অ্যাকশন বাটন */}
        <div className="flex items-center gap-4 relative z-10">
          <Link 
            href="/contact" 
            onClick={() => handleNavClick('Contact Button')}
            className="hidden sm:flex items-center gap-2 relative group bg-slate-900 dark:bg-blue-600 text-white px-8 py-3.5 rounded-full text-sm font-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* মোবাইল মেনু */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl"
          >
            <div className="container mx-auto px-6 py-10 flex flex-col gap-6">
              <MobileNavLink href="/" onClick={() => {setIsOpen(false); handleNavClick('Mobile Home');}}>Home</MobileNavLink>
              <MobileNavLink href="/tracking-checker" onClick={() => {setIsOpen(false); handleNavClick('Mobile Lab');}}>Tracking Lab</MobileNavLink>
              
              {isAdmin && (
                <>
                  <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-2" />
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Admin Control</p>
                  <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="text-xl font-bold text-slate-700 dark:text-slate-300">Dashboard</Link>
                  <Link href="/admin/outreach" onClick={() => setIsOpen(false)} className="text-xl font-bold text-slate-700 dark:text-slate-300">Outreach</Link>
                  <Link href="/admin/outreach/follow-up" onClick={() => setIsOpen(false)} className="text-xl font-bold text-slate-700 dark:text-slate-300">Follow-ups</Link>
                </>
              )}

              <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-2" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Our Solutions</p>
              
              <div className="grid grid-cols-1 gap-4">
                <Link onClick={() => {setIsOpen(false); handleNavClick('Mobile Server Side');}} href="/services/server-side-tracking" className="text-base font-bold text-slate-700 dark:text-slate-300">Server-Side Tracking</Link>
                <Link onClick={() => {setIsOpen(false); handleNavClick('Mobile FB CAPI');}} href="/services/facebook-capi" className="text-base font-bold text-slate-700 dark:text-slate-300">Facebook CAPI</Link>
                <Link onClick={() => {setIsOpen(false); handleNavClick('Mobile Google Ads');}} href="/services/google-ads-expert" className="text-base font-bold text-slate-700 dark:text-slate-300">Google Ads</Link>
                {/* Email Signature link added below */}
                <Link onClick={() => {setIsOpen(false); handleNavClick('Mobile Email Signature');}} href="/services/email-signature" className="text-base font-bold text-slate-700 dark:text-slate-300">Email Signature</Link>
              </div>

              <a href="mailto:shahjalal@trackflowpro.com" className="w-full text-center bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-blue-500/30">
                Book A Consultation
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

// Helper Components
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
    <Link href={href} onClick={onClick} className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none italic">
      {children}
    </Link>
  )
}

function SolutionItem({ title, desc, icon, href, onClick }: { title: string, desc: string, icon: React.ReactNode, href: string, onClick: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="p-5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all duration-300 group/item border border-transparent hover:border-blue-100 dark:hover:border-blue-800 flex flex-col gap-3"
    >
      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover/item:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-[15px] font-black text-slate-900 dark:text-slate-100 group-hover/item:text-blue-600 transition-colors">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{desc}</p>
      </div>
    </Link>
  )
}

function AdminLink({ href, label, icon, onClick }: { href: string, label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-all font-bold text-sm"
    >
      <span className="text-blue-500">{icon}</span>
      {label}
    </Link>
  );
}