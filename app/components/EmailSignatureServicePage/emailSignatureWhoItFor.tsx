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
  Gem
} from 'lucide-react'

// ১. টার্গেট অডিয়েন্স ডাটা
const targetAudience = [
  {
    icon: <Briefcase size={24} />,
    title: "Business Owners",
    desc: "Entrepreneurs looking to represent their brand with a high-end professional identity."
  },
  {
    icon: <Home size={24} />,
    title: "Real Estate Agents",
    desc: "Agents who communicate frequently with clients and need to build instant trust."
  },
  {
    icon: <UserCheck size={24} />,
    title: "Freelancers & Consultants",
    desc: "Individual professionals aiming to boost their personal branding and credibility."
  },
  {
    icon: <Megaphone size={24} />,
    title: "Marketing Agencies",
    desc: "Agencies that need a sleek, consistent, and clickable identity for their outreach."
  },
  {
    icon: <Building2 size={24} />,
    title: "Corporate Teams",
    desc: "Small to mid-sized businesses looking to maintain uniform branding across all employees."
  },
  {
    icon: <Gem size={24} />,
    title: "Personal Brands",
    desc: "Thought leaders and creators who want every interaction to feel premium and polished."
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
            <Target size={14} /> Who We Serve
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1] mb-6">
            Designed For Professionals <br />
            Who Want To <span className="text-indigo-600 italic">Stand Out.</span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
            Our clickable email signature service is perfect for individuals and teams who demand a clean, professional, and consistent brand in every interaction.
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
              If You Send Emails Daily — This Is For You.
            </h3>
            <p className="text-indigo-100 text-lg font-medium">
              Whether you’re sending proposals, replying to clients, or building long-term relationships — we help you make <span className="text-white font-bold underline decoration-indigo-400 underline-offset-4">every interaction more impactful.</span>
            </p>
          </div>
          
          {/* Background Pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-0 left-0 w-64 h-64 bg-white blur-[100px] -ml-32 -mt-32 rounded-full" />
          </div>
        </motion.div>

        {/* Final Conversion Line */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">
            ⚡ If you care about the small details of your brand — we are built for you.
          </p>
        </div>

      </div>
    </section>
  )
}