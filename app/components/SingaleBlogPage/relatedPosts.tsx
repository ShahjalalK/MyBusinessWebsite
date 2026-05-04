"use client"
import React from 'react'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FaArrowRight } from 'react-icons/fa'
import { blogPosts } from '../BlogMainPage/blogData'

interface RelatedPostsProps {
  currentPostId: string;
  category: string;
}

export default function RelatedPosts({ currentPostId, category }: RelatedPostsProps) {
  
  // লজিক: বর্তমান পোস্ট বাদ দিয়ে একই ক্যাটাগরির পোস্টগুলো খুঁজে বের করা
  const related = blogPosts
    .filter(post => post.id !== currentPostId) // বর্তমান পোস্ট বাদ
    .filter(post => post.category === category) // একই ক্যাটাগরি
    .slice(0, 3); // সর্বোচ্চ ৩টি দেখাবে

  // যদি একই ক্যাটাগরির পোস্ট না থাকে, তবে অন্য ক্যাটাগরি থেকে ৩টি দেখাবে
  const displayPosts = related.length > 0 
    ? related 
    : blogPosts.filter(post => post.id !== currentPostId).slice(0, 3);

  if (displayPosts.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
              Related Articles
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              You might also find these articles helpful for scaling your business data and marketing.
            </p>
          </div>
          <Link 
            href="/blog" 
            className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all"
          >
            View All Posts <FaArrowRight />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayPosts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white dark:bg-slate-900 rounded-1rem] border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-500"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              </div>
              <div className="p-6">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 block">
                  {post.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  <Link href={`/blog/${post.id}`}>{post.title}</Link>
                </h3>
                <Link 
                  href={`/blog/${post.id}`}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                >
                  Read Article <FaArrowRight size={10} className="-rotate-45 group-hover:rotate-0 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}