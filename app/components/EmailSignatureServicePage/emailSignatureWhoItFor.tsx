"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { 
  Target, 
  Briefcase, 
  Home, 
  UserCheck, 
  Megaphone, 
  Building2,
  MailCheck,
  Gem,
  Stethoscope,
  Scale
} from 'lucide-react'

/**
 * SEO Optimization Notes:
 * 1. Targeted Keywords: "Real Estate Email Signature," "Professional Branding," "Corporate Identity."
 * 2. Added niche categories like Legal & Medical as they are high-value leads.
 */

const targetAudience = [
  {
    icon: <Briefcase size={24} />,
    title: "Business Owners",
    desc: "Scale your professional branding and maintain a premium corporate identity in every email."
  },
  {
    icon: <Home size={24} />,
    title: "Real Estate Agents",
    desc: "Build instant trust with buyers and sellers using high-converting, clickable contact signatures."
  },
  {
    icon: <Scale size={24} />, // Added for SEO: Legal niche
    title: "Lawyers & Legal Firms",
    desc: "Project authority and include necessary legal disclaimers with a polished, professional look."
  },
  {
    icon: <Stethoscope size={24} />, // Added for SEO: Medical niche
    title: "Medical Professionals",
    desc: "Perfect for doctors and health consultants requiring HIPAA-compliant, clean email communication."
  },
  {
    icon: <UserCheck size={24} />,
    title: "Freelancers & Experts",
    desc: "Boost your personal branding and credibility to command higher rates from international clients."
  },
  {
    icon: <Gem size={24} />,
    title: "Thought Leaders",
    desc: "For creators and influencers who want every interaction to feel premium and consistent."
  }
];

export default function EmailSignatureWhoItsFor() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 font-sans overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
          >
            <Target size={14} /> Global Solutions
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1] mb-6">
            Elite Signatures For <br />
            <span className="text-indigo-600 italic">Global Professionals.</span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
            Whether you are a solo consultant or a corporate team, our custom clickable email signatures are optimized for conversion and trust.
          </p>
        </div>

        {/* Grid Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {targetAudience.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden"
            >
              <div className="mb-6 p-3 bg-white dark:bg-slate-800 w-fit rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                {item.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{item.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                {item.desc}
              </p>
              
              {/* Decorative Subtle Icon in Background */}
              <div className="absolute -bottom-4 -right-4 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                 {React.cloneElement(item.icon, { size: 100 })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Highlight Quote Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="bg-indigo-600 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden"
        >
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="flex justify-center mb-6">
                <MailCheck size={48} className="text-indigo-200 opacity-50" />
            </div>
            <h3 className="text-white text-2xl md:text-3xl font-black mb-6 leading-tight tracking-tight">
              Optimized for Gmail, Outlook, and Apple Mail.
            </h3>
            <p className="text-indigo-100 text-lg font-medium">
              Every email you send is a branding opportunity. We ensure your <span className="text-white font-bold underline decoration-indigo-400 underline-offset-4">personalized signature</span> works perfectly across all devices and platforms.
            </p>
          </div>
          
          {/* Background Pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-0 left-0 w-64 h-64 bg-white blur-[100px] -ml-32 -mt-32 rounded-full" />
          </div>
        </motion.div>

        {/* Final SEO Micro-Line */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">
            Professional Email Branding • Clickable HTML Signatures • Mobile Responsive Layouts
          </p>
        </div>

      </div>
    </section>
  )
}