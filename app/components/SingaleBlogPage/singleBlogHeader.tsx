import React from 'react'
import { FaCalendarAlt, FaClock, FaUser } from 'react-icons/fa'
import { BlogPost } from '../BlogMainPage/blogData';


interface SingleBlogHeaderProps {
  post: BlogPost;
}

export default function SingleBlogHeader({ post }: SingleBlogHeaderProps) {
  return (
    <article className="bg-white dark:bg-slate-950">
      {/* --- Title Section --- */}
      <header className="pt-16 pb-20 lg:pt-20 lg:pb-32 container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-6">
            <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
              {post.category}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter mb-8">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800 pb-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <FaUser className="text-slate-400" />
              </div>
              <span>By Shahjalal Jalal</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-blue-600" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="text-blue-600" />
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- Featured Image Section --- */}
      <section className="container mx-auto px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="relative h-[300px] md:h-[500px] lg:h-[600px] w-full rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl">
            <img 
              src={post.image} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent"></div>
          </div>
        </div>
      </section>
    </article>
  )
}