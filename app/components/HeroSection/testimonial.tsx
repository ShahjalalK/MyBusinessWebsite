"use client"
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamic Import with Intersection Observer logic
// ইউজার যখন এই সেকশনে স্ক্রল করবে কেবল তখনই Swiper এর ভারি JS লোড হবে
const DynamicSwiper = dynamic(() => import('./TestimonialSwiper'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
});

export default function TestimonialSection() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // স্ক্রিন স্ক্রল করার পর স্লাইডার লোড হবে (Performance Optimization)
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShouldLoad(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="py-20 bg-[#F8F9FA] dark:bg-slate-950 transition-colors">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Summary Section - Pure Static (High Speed) */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">TrackFlow Reviews</h3>
              <div className="text-6xl font-black text-slate-900 dark:text-white my-4">5.0</div>
              <div className="flex justify-center gap-1 text-yellow-400 mb-4 text-xl">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <Link 
                 href="https://www.fiverr.com/shahjalalk" 
                 target="_blank" 
                 className="block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all"
              >
                See all reviews
              </Link>
            </div>
          </div>

          {/* Slider Section - Only loads when scrolling */}
          <div className="lg:col-span-8 min-h-[350px]">
            {shouldLoad ? <DynamicSwiper /> : <div className="h-[350px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />}
          </div>
        </div>
      </div>
    </section>
  )
}