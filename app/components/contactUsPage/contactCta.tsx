"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, MessageSquare, ArrowRight, Video, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function ContactFinalContactStep() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-[#041f60] rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 relative overflow-hidden shadow-2xl shadow-blue-900/30"
        >
          {/* Background Decorative Blurs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full -ml-48 -mb-48 blur-[100px]"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side: Text & Message Push */}
            <div className="text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 backdrop-blur-sm">
                <Sparkles size={14} /> Final Step
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1]">
                Ready to Get <br /> Started?
              </h2>
              <p className="text-blue-100/70 text-lg font-medium max-w-md mx-auto lg:mx-0">
                Choose how you want to connect. Whether it's a quick message or a detailed strategy call, I'm here to help.
              </p>
              
              <div className="pt-4">
                <Link 
                  href="#form" 
                  className="inline-flex items-center gap-3 bg-[#ff6a00] hover:bg-orange-600 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-orange-900/40 group"
                >
                  Send a Message <MessageSquare size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Side: Calendly / Booking Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-[2.5rem] text-center space-y-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Calendar className="text-white" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Book a Strategy Call</h3>
                <p className="text-blue-100/60 text-sm font-medium">
                  Prefer a video meeting? Pick a time that works for you.
                </p>
              </div>
              
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-center gap-3 text-white/80 text-xs font-bold uppercase tracking-widest">
                  <Video size={14} className="text-green-400" /> 15-Min Zoom/Google Meet
                </div>
                
                <Link 
                  href="/book-audit" 
                 
                  className="block w-full py-4 bg-white hover:bg-blue-50 text-[#041f60] rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2"
                >
                  Schedule Call <ArrowRight size={18} />
                </Link>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  )
}