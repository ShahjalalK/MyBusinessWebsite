"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles, Clock, ShieldCheck, Zap, TrendingUp } from 'lucide-react'
import { blogPosts } from './blogData'

export default function FeaturedPost() {
  // লজিক: প্রথম যে ব্লগে isFeatured: true পাবে সেটিই দেখাবে
  const featuredPost = blogPosts.find(post => post.isFeatured) || blogPosts[0];

  if (!featuredPost) return null;

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        
        {/* Label Header */}
        <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-xs mb-8">
          <Sparkles size={16} className="animate-pulse" /> Featured Masterclass
        </div>

        <div className="relative group">
          {/* Background Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[2rem] md:rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
          
          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] md:rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl shadow-slate-200/50 dark:shadow-none">
            
            {/* Left Side: Content Area */}
            <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center order-2 lg:order-1">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                  {featuredPost.category}
                </span>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold border-l border-slate-200 dark:border-slate-700 pl-3">
                  <Clock size={14} /> {featuredPost.readTime}
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                {featuredPost.title}
              </h2>

              <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-2xl">
                {featuredPost.description}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                <Link 
                  href={`/blog/${featuredPost.id}`} 
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-xl active:scale-95 group/btn text-sm uppercase tracking-widest"
                >
                  Read Full Post <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
                
                <div className="flex items-center gap-6">
                   <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[11px] uppercase tracking-tighter">
                         <ShieldCheck size={16} /> Verified Setup
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Industry Standard</span>
                   </div>
                   <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                   <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-blue-500 font-black text-[11px] uppercase tracking-tighter">
                         <TrendingUp size={16} /> Scale Ready
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Profit Optimized</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Side: Responsive Image Area */}
            <div className="w-full lg:w-[45%] relative min-h-[300px] lg:min-h-full order-1 lg:order-2 overflow-hidden">
               <Image 
                  src={featuredPost.image} 
                  alt={featuredPost.title} 
                  fill
                  priority 
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-1000"
               />
               
               {/* Decorative Gradient Overlay */}
               <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-slate-900/40 via-transparent to-transparent" />

               {/* Live Tech Badge */}
               <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Integration</span>
               </div>

               {/* Stats Card Overlay (Desktop Only) */}
               <div className="hidden md:block absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Zap size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-xs uppercase tracking-tighter">Performance Audit</h4>
                      <p className="text-white/60 text-[10px]">Data matched with precision</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-[95%] rounded-full shadow-[0_0_10px_#3b82f6]" />
                  </div>
                  <div className="flex justify-between mt-2">
                     <span className="text-white/40 font-bold text-[9px] uppercase italic tracking-widest font-mono">Status: Secure</span>
                     <span className="text-emerald-400 font-black text-xs uppercase">95% Score</span>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}