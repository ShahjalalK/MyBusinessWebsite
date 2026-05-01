"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Clock, BookOpen, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useBlogStore } from '@/app/store/useBlogStore'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" }
}

export default function BlogSection() {
  const posts = useBlogStore((state) => state.posts);  // Fetch posts from store
  const featuredPosts = posts.slice(0, 3);  // Show latest 3 blog posts

  return (
    <section className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      <div className="container mx-auto px-6 text-center md:text-left">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 inline-block border-l-4 border-blue-600 pl-4"
            >
              Resources & Insights
            </motion.span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mt-2">
              Mastering the Art of <br />
              <span className="text-blue-600 italic">Precision Tracking.</span>
            </h2>
          </div>
          
          <Link href="/blog">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-sm shadow-2xl transition-all hover:bg-blue-600 dark:hover:bg-blue-600 dark:hover:text-white flex items-center gap-3"
            >
              View All Articles
              <ArrowUpRight className="group-hover:rotate-45 transition-transform" />
            </motion.div>
          </Link>
        </div>

        {/* Dynamic Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {featuredPosts.map((post, index) => (
            <motion.div 
              key={post.id}
              variants={fadeInUp}
              initial="initial"
              whileInView="whileInView"
              transition={{ delay: index * 0.1 }}
              className="group relative flex flex-col h-full"
            >
              {/* Image Container with Link (Clicking image will open blog post) */}
              <Link href={`/blog/${post.id}`} className="relative group cursor-pointer mb-8 overflow-hidden rounded-[2rem] bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl transition-transform duration-500">
                <Image 
                  src={post.image} 
                  alt={post.title} 
                  width={500} 
                  height={300}
                  layout="intrinsic"
                  className="object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
                />
                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                {/* Category Badge */}
                <div className="absolute top-8 left-8 z-20">
                  <div className="px-5 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-600 border border-white/20 shadow-lg">
                    {post.category}
                  </div>
                </div>
              </Link>

              {/* Content Area */}
              <div className="px-4 flex flex-col flex-grow">
                <div className="flex items-center gap-6 mb-4 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" /> {post.date}
                  </span>
                  <span className="flex items-center gap-2">
                    <BookOpen size={16} className="text-blue-600" /> {post.readTime}
                  </span>
                </div>
                
                {/* Title Section (Clickable) */}
                <Link href={`/blog/${post.id}`}>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-[1.1] group-hover:text-blue-600 transition-colors tracking-tighter mb-4 cursor-pointer">
                    {post.title}
                  </h3>
                </Link>
                
                <p className="text-slate-500 dark:text-slate-400 font-medium line-clamp-2 text-sm leading-relaxed mb-6">
                  {post.description}
                </p>

                {/* Author Info */}
                <div className="mt-auto flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User size={14} className="text-blue-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">By Shahjalal</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}