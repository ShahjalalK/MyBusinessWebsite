import React from 'react'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'
import { Briefcase, Mail, Target, Zap, Search } from 'lucide-react'

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[85vh] bg-white dark:bg-slate-950 py-20 flex items-center">
        <div className="container mx-auto px-6">
          
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <Search size={14} /> Career Opportunities
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                Work with <span className="text-blue-600">TrackFlowPro Team</span>
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
                Join a team dedicated to precision tracking and data-driven marketing. We are always on the lookout for innovative minds.
              </p>
            </div>

            {/* Status Card: No Active Openings */}
            <div className="relative group overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-16 text-center">
              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors duration-500" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                  <Briefcase size={32} className="text-blue-600" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4">
                  No Open Positions Right Now
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 max-w-md mx-auto">
                  We don’t have any active openings at the moment. However, we value great talent and keep all promising resumes in our database for future roles.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a 
                    href="mailto:shahjalal@trackflowpro.com" 
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black transition-all hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white active:scale-95 text-sm uppercase tracking-widest shadow-lg"
                  >
                    <Mail size={18} /> Submit Your Resume
                  </a>
                </div>
                
                <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  Response time: 2-3 Business Days
                </p>
              </div>
            </div>

            {/* Why Join Section - Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                {[
                    { icon: <Target className="text-blue-600" />, title: "Remote First", desc: "Work from anywhere in the world." },
                    { icon: <Zap className="text-amber-500" />, title: "Growth", desc: "Access to premium marketing tools." },
                    { icon: <Search className="text-emerald-500" />, title: "Innovation", desc: "Solve complex tracking problems." }
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-6 rounded-2xl border border-slate-50 dark:border-slate-900 bg-white dark:bg-slate-950">
                        <div className="flex-shrink-0">{item.icon}</div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">{item.title}</h4>
                            <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}