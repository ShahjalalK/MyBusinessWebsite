"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles, Clock, BookOpen, ShieldCheck, Zap } from 'lucide-react'
import { blogPosts } from './blogData'
 // আপনার ডাটা পাথ

export default function FeaturedPost() {
  // লজিক: প্রথম যে ব্লগে isFeatured: true পাবে সেটিই দেখাবে
  const featuredPost = blogPosts.find(post => post.isFeatured) || blogPosts[0];

  if (!featuredPost) return null;

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-xs mb-8">
          <Sparkles size={16} /> Featured Masterclass
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
          
          <div className="relative bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row items-center">
            
            {/* Left Side: Dynamic Content */}
            <div className="flex-1 p-8 md:p-16">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-4 py-1.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {featuredPost.category}
                </span>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <Clock size={14} /> {featuredPost.readTime}
                </div>
              </div>

              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tighter">
                {featuredPost.title}
              </h2>

              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-2xl">
                {featuredPost.description}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link 
                  href={`/blog/${featuredPost.id}`} 
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/25 active:scale-95 group/btn text-sm uppercase tracking-widest"
                >
                  Read Full Post <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
                
                <div className="flex items-center gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                   <div className="flex items-center gap-1.5 text-emerald-500">
                      <ShieldCheck size={18} /> Verified Setup
                   </div>
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                   <div className="flex items-center gap-1.5">
                      <Zap size={18} className="text-amber-500" /> Professional
                   </div>
                </div>
              </div>
            </div>

            {/* Right Side: Portrait Image Logic */}
            <div className="w-full lg:w-[42%] aspect-[9/16] relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-transparent z-10" />
               
               <Image 
                  src={featuredPost.image} // ডাটা থেকে ছবি আসছে
                  alt={featuredPost.title} 
                  fill
                  priority 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-80"
               />
               
               {/* Dashboard Overlay */}
               <div className="absolute bottom-10 left-10 right-10 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl z-20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] font-bold uppercase text-blue-400 tracking-widest">
                        {featuredPost.ctaType === 'tracking' ? 'Data Accuracy' : 'Optimization Active'}
                     </span>
                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex justify-between mt-1">
                     <span className="text-white font-black text-xs uppercase">Quality Score</span>
                     <span className="text-emerald-400 font-black text-xs">95%</span>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}