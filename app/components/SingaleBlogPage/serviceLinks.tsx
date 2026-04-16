import React from 'react'
import Link from 'next/link'
import { FaArrowRight, FaBullhorn, FaServer } from 'react-icons/fa'

export default function ServiceLinks() {
  const services = [
    {
      title: "Google Ads Expert",
      desc: "Scale your ROAS with data-driven Google Ads strategies.",
      link: "/services/google-ads-expert",
      icon: <FaBullhorn />,
      color: "blue"
    },
    {
      title: "Server-side Tracking",
      desc: "Recover 40% of lost data with GTM Server-side & CAPI.",
      link: "/services/server-side-tracking",
      icon: <FaServer />,
      color: "indigo"
    }
  ]

  return (
    <section className="py-12 border-t border-slate-100 dark:border-slate-800 mt-10">
      <div className="max-w-4xl mx-auto px-6">
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 text-center md:text-left">
          Explore My Services
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, idx) => (
            <Link 
              key={idx} 
              href={service.link}
              className="group p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl bg-${service.color}-600/10 text-${service.color}-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                  {service.title}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
                  {service.desc}
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest">
                Learn More <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}