"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { 
  XCircle, 
  Smartphone, 
  Link2Off, 
  ImageOff, 
  UserX, 
  MousePointerClick, 
  AlertCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link';

/**
 * SEO & UI Enhancement Notes:
 * 1. Semantic Tags: Used <section>, <article>, and <h2> for better indexing.
 * 2. Keywords: Integrated "Professional Email Signature," "Clickable Links," and "Mobile Responsive" for SEO.
 * 3. Accessibility: Added ARIA labels for icon containers.
 * 4. UI: Added subtle gradient borders and backdrop-blur for a "Saas" look.
 */

const problems = [
  {
    icon: <UserX size={28} />,
    title: "Unprofessional Image",
    desc: "Inconsistent signatures make your personal brand look amateur to high-ticket clients and partners."
  },
  {
    icon: <Link2Off size={28} />,
    title: "Broken Clickable Links",
    desc: "Website, social profiles, or CTA buttons aren't clickable, killing potential email engagement instantly."
  },
  {
    icon: <Smartphone size={28} />,
    title: "Not Mobile Responsive",
    desc: "Layouts that break or look distorted on mobile devices frustrate over 60% of your email recipients."
  },
  {
    icon: <ImageOff size={28} />,
    title: "Broken Signature Images",
    desc: "Images failing to load or appearing as 'red X' boxes ruin your professional first impression."
  },
  {
    icon: <MousePointerClick size={28} />,
    title: "Poor CTR Conversion",
    desc: "Missing out on valuable traffic by not having strategic 'Book a Call' or 'Portfolio' links in your email."
  },
  {
    icon: <AlertCircle size={28} />,
    title: "Cross-Platform Conflicts",
    desc: "Poor HTML coding causes formatting issues across Gmail, Outlook, and Apple Mail environments."
  }
];

export default function EmailSignatureProblem() {
  return (
    <section className="py-24 bg-white dark:bg-[#020617] overflow-hidden font-sans" aria-labelledby="problem-heading">
      <div className="container mx-auto px-6">
        
        {/* Title Area - SEO Optimized */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-black uppercase tracking-[0.25em] mb-8"
          >
            <AlertTriangle size={14} className="animate-pulse" /> The Cost of Poor Branding
          </motion.div>
          
          <h2 id="problem-heading" className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-8">
            Why Your Current Signature <br />
            <span className="text-red-600 italic font-serif">Might Be Failing You.</span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-bold max-w-2xl mx-auto leading-relaxed">
            Outdated email signatures don't just look bad—they actively damage your <span className="text-slate-900 dark:text-white">professional credibility</span> and conversion rates.
          </p>
        </div>

        {/* Problem Grid - Improved UI Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {problems.map((item, idx) => (
            <motion.article
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="relative p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 backdrop-blur-sm hover:border-red-500/30 transition-all duration-500 group overflow-hidden"
            >
              {/* Background Glow Effect */}
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors" />

              <div className="mb-8 p-5 bg-slate-50 dark:bg-slate-800/50 w-fit rounded-[2rem] shadow-inner border border-slate-100 dark:border-slate-700/50 group-hover:bg-red-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                {React.cloneElement(item.icon, {
                  className: "text-red-600 group-hover:text-white transition-colors duration-300",
                  "aria-hidden": "true"
                })}
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                {item.title}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed font-bold">
                {item.desc}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Impact Section - Premium UI */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[4rem] p-12 md:p-24 overflow-hidden shadow-[0_50px_100px_-20px_rgba(220,38,38,0.3)]"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-red-600" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h3 className="text-white text-4xl md:text-6xl font-black tracking-tighter mb-10 leading-[1.1]">
              "A broken signature is a <br /> broken handshake."
            </h3>
            <p className="text-white/90 text-lg md:text-2xl font-bold mb-12 leading-relaxed">
              Don't let a technical glitch ruin your first impression. Switch to professional, <span className="underline decoration-4 underline-offset-8">hand-coded HTML signatures</span> designed for real estate high-flyers.
            </p>
            
            <Link 
                href="/contact" 
                className="bg-white text-red-600 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-100 transition-all flex items-center justify-center inline-flex w-fit mx-auto group shadow-lg"
              >
                Fix My Signature Now 
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform ml-3" />
              </Link>
          </div>
          
          {/* Aesthetic Decor */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 text-[180px] font-black select-none pointer-events-none whitespace-nowrap">
             URGENT ISSUE
          </div>
        </motion.div>

        {/* Footer Note */}
        <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-4 border-t border-slate-100 dark:border-slate-800/50 pt-10">
            <span className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase rounded-full">Did You Know?</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-black tracking-tight italic">
              "62% of clients form an opinion of your brand based on the quality of your email communication."
            </p>
        </div>

      </div>
    </section>
  )
}