"use client"
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { blogPosts, BlogPost } from '../BlogMainPage/blogData'
import { ArrowRight, Clock } from 'lucide-react'

interface RelatedPostsProps {
  currentPostId: string;
  category: string;
}

export default function RelatedPosts({ currentPostId, category }: RelatedPostsProps) {
  
  // লজিক: বর্তমান ব্লগ বাদে একই ক্যাটাগরির সর্বোচ্চ ৩টি ব্লগ দেখাবে
  const related = blogPosts
    .filter(post => post.category === category && post.id !== currentPostId)
    .slice(0, 3);

  // যদি একই ক্যাটাগরির কোনো পোস্ট না থাকে, তবে অন্য যেকোনো ৩টি পোস্ট দেখাবে
  const displayPosts = related.length > 0 
    ? related 
    : blogPosts.filter(post => post.id !== currentPostId).slice(0, 3);

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
      <div className="container mx-auto px-6">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              Related Articles
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Expand your knowledge with more insights on {category} and digital marketing strategies.
            </p>
          </div>
          <Link 
            href="/blog" 
            className="group flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all"
          >
            View All Posts <ArrowRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayPosts.map((post) => (
            <Link 
              key={post.id} 
              href={`/blog/${post.id}`}
              className="group flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image 
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                    {post.category}
                  </span>
                </div>
              </div>

              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-3 text-slate-400 text-xs font-bold mb-4 uppercase tracking-wider">
                  <Clock size={14} className="text-blue-500" /> {post.readTime}
                </div>
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium line-clamp-2 mb-6">
                  {post.description}
                </p>

                <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{post.date}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}