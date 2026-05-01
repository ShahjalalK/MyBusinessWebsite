"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Clock, BookOpen, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useBlogStore } from '@/app/store/useBlogStore'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: "easeOut" }
}

export default function BlogSection() {
  const posts = useBlogStore((state) => state.posts);
  const featuredPosts = posts.slice(0, 3);

  return (
    <section className="py-24 bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 text-left">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mb-4"
            >
              <span className="w-8 h-[2px] bg-blue-600"></span>
              <span className="text-blue-600 font-bold uppercase tracking-widest text-[11px]">
                Resources & Insights
              </span>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Mastering the Art of <br />
              <span className="text-blue-600">Precision Tracking.</span>
            </h2>
          </div>
          
          <Link href="/blog">
            <motion.div 
              whileHover={{ y: -5 }}
              className="group px-6 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm shadow-sm transition-all hover:border-blue-600 flex items-center gap-2"
            >
              View All Articles
              <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform text-blue-600" />
            </motion.div>
          </Link>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredPosts.map((post, index) => (
            <motion.div 
              key={post.id}
              variants={fadeInUp}
              initial="initial"
              whileInView="whileInView"
              transition={{ delay: index * 0.1 }}
              className="group bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300"
            >
              {/* Image Container - Updated to show full image */}
              <Link href={`/blog/${post.id}`} className="block relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800/50">
                <Image 
                  src={post.image} 
                  alt={post.title} 
                  fill
                  className="object-contain p-2 transition-transform duration-700 group-hover:scale-105" 
                  // object-contain দিলে ছবি কাটবে না, p-2 দিলে চারদিকে সামান্য গ্যাপ থাকবে যা দেখতে সুন্দর লাগে
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider text-blue-600 shadow-sm">
                    {post.category}
                  </span>
                </div>
              </Link>

              {/* Content Area */}
              <div className="p-7 flex flex-col">
                <div className="flex items-center gap-4 mb-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-blue-500" /> {post.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={14} className="text-blue-500" /> {post.readTime}
                  </span>
                </div>
                
                <Link href={`/blog/${post.id}`}>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 transition-colors mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
                
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">
                  {post.description}
                </p>

                <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                      <User size={12} className="text-blue-600" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Shahjalal</span>
                  </div>
                  <Link href={`/blog/${post.id}`} className="text-blue-600 font-bold text-xs flex items-center gap-1 group/link">
                    Read More 
                    <ArrowUpRight size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}