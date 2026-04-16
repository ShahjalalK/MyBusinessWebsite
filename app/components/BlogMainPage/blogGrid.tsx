"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { FaArrowRight, FaCalendarAlt, FaClock } from 'react-icons/fa'
import Link from 'next/link'
import { useBlogStore } from '@/app/store/useBlogStore'
import { blogPosts } from './blogData'


export default function BlogGrid() {
  // Zustand স্টোর থেকে স্টেটগুলো নিয়ে আসা
  const activeCategory = useBlogStore((state) => state.activeCategory);
  const searchQuery = useBlogStore((state) => state.searchQuery);

  // ফিল্টারিং লজিক: ক্যাটাগরি এবং সার্চ দুইটাই চেক করবে
  const filteredPosts = blogPosts.filter((post) => {
    // ১. ক্যাটাগরি চেক
    const matchesCategory = activeCategory === 'All Posts' || post.category === activeCategory;
    
    // ২. সার্চ কুয়েরি চেক (টাইটেল বা ডেসক্রিপশনে আছে কিনা)
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-10 bg-white dark:bg-slate-950 min-h-[400px]">
      <div className="container mx-auto px-6">
        
        {/* যদি কোনো পোস্ট খুঁজে না পাওয়া যায় তার জন্য একটি মেসেজ */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-slate-400">No articles found matching your search.</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredPosts.map((post, idx) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="group flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
              >
                {/* Image Section */}
                <div className="relative h-64 overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-5 left-5">
                    <span className="px-4 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-100 dark:border-slate-700">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 flex flex-col flex-1 space-y-4">
                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><FaCalendarAlt /> {post.date}</span>
                    <span className="flex items-center gap-1.5"><FaClock /> {post.readTime}</span>
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                    <Link href={`/blog/${post.id}`}>{post.title}</Link>
                  </h3>

                  <p className="text-slate-500 dark:text-slate-400 font-medium line-clamp-3 leading-relaxed">
                    {post.description}
                  </p>

                  <div className="pt-6 mt-auto">
                    <Link href={`/blog/${post.id}`} className="inline-flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white group/btn">
                      <span className="relative">
                        Read More
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover/btn:w-full"></span>
                      </span>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all duration-300">
                        <FaArrowRight size={12} className="-rotate-45 group-hover/btn:rotate-0 transition-transform" />
                      </div>
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}