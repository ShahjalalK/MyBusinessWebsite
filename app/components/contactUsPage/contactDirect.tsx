"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageCircle, ExternalLink, Globe, ArrowUpRight, CheckCircle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function ContactDirectContactInfo() {
  const contactMethods = [
    {
      name: "Direct Email",
      value: "shahjalal@trackflowpro.com",
      label: "Business Queries",
      icon: <Mail className="text-blue-600" size={28} />,
      link: "mailto:shahjalal@trackflowpro.com",
      color: "from-blue-500/10 to-cyan-500/10",
      borderColor: "group-hover:border-blue-500/50"
    },
    {
      name: "WhatsApp",
      value: "+880 132 953 2551",
      label: "Quick Support",
      icon: <MessageCircle className="text-green-500" size={28} />,
      link: "https://wa.me/+8801329532551",
      color: "from-green-500/10 to-emerald-500/10",
      isExternal: true,
      borderColor: "group-hover:border-green-500/50"
    },
    {
      name: "Fiverr Profile",
      value: "Hire via Marketplace",
      label: "Secure Transaction",
      icon: <Globe className="text-emerald-500" size={28} />,
      link: "https://www.fiverr.com/shahjalalk",
      color: "from-emerald-500/10 to-green-500/10",
      isExternal: true,
      borderColor: "group-hover:border-emerald-500/50"
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-blue-600/5 blur-[120px] -z-10 rounded-full"></div>

      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
            <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-4"
            >
                Connect Anywhere
            </motion.p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                Preferred Contact Channels
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {contactMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <Link 
                href={method.link} 
                target={method.isExternal ? "_blank" : "_self"}
                className={`group relative block p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all duration-500 ${method.borderColor} shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden`}
              >
                {/* Background Gradient Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                {/* Animated Arrow */}
                <div className="absolute top-8 right-8 w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300">
                  <ArrowUpRight className="text-slate-900 dark:text-white" size={20} />
                </div>

                <div className="relative z-10">
                  {/* Icon with Ring Effect */}
                  <div className="relative inline-flex items-center justify-center mb-8">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative w-16 h-16 rounded-[1.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-inner flex items-center justify-center group-hover:rotate-[10deg] transition-transform duration-500">
                      {method.icon}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {method.label}
                        </span>
                        {method.isExternal && <CheckCircle size={10} className="text-blue-500" />}
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      {method.name}
                    </h3>
                    
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm truncate">
                      {method.value}
                    </p>
                  </div>

                  {/* Trust Badge */}
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified Account</span>
                    <ShieldCheck size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}