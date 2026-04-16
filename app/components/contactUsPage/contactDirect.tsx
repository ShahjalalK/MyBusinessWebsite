"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageCircle, ExternalLink, Globe, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export default function ContactDirectContactInfo() {
  const contactMethods = [
    {
      name: "Direct Email",
      value: "shahjalal@trackflowpro.com",
      label: "Official Inquiries",
      icon: <Mail className="text-blue-600" />,
      link: "mailto:shahjalal@trackflowpro.com",
      color: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      name: "WhatsApp",
      value: "+880 132 953 2551",
      label: "Instant Message",
      icon: <MessageCircle className="text-green-600" />,
      link: "https://wa.me/+8801329532551",
      color: "bg-green-50 dark:bg-green-900/20",
       isExternal: true
    },
    {
      name: "Fiverr Profile",
      value: "Order via Fiverr",
      label: "Secure Platform",
      icon: <Globe className="text-emerald-600" />,
      link: "https://www.fiverr.com/shahjalalk", // আপনার ফাইবার লিঙ্ক এখানে দিন
      color: "bg-emerald-50 dark:bg-emerald-900/20",
      isExternal: true
    }
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {contactMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link 
                href={method.link} 
                target={method.isExternal ? "_blank" : "_self"}
                className="group block p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden"
              >
                {/* Hover Effect Background */}
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="text-slate-400" size={24} />
                </div>

                <div className={`w-14 h-14 ${method.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {method.icon}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {method.label}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {method.name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    {method.value}
                  </p>
                </div>

                {method.isExternal && (
                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                    Official Seller <ExternalLink size={12} />
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}