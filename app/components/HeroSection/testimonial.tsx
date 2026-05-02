"use client"
import React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Swiper কে Dynamic Import করছি এবং SSR (Server Side Rendering) অফ করে দিচ্ছি। 
// এতে পেজ লোড হওয়ার সময় এটি বাধা দেবে না।
const DynamicSwiper = dynamic(() => import('./TestimonialSwiper'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
});

export default function TestimonialSection() {
  return (
    <section className="py-20 bg-[#F8F9FA] dark:bg-slate-950 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Side: Review Summary (এটি স্ট্যাটিক, তাই দ্রুত লোড হবে) */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 leading-tight">
                TrackFlow Pro <br /> Client Reviews
              </h3>
              <div className="text-6xl font-black text-slate-900 dark:text-white my-6">5.0</div>
              <div className="flex justify-center gap-1 text-yellow-400 mb-4 text-2xl" aria-label="5 star rating">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                Based on 50+ reviews on Fiverr & Upwork for Digital Marketing & Tracking services.
              </p>
              <div className="flex flex-col gap-3">
                <Link 
                   href="https://www.fiverr.com/shahjalalk" 
                   rel="nofollow noopener noreferrer" 
                   target="_blank" 
                   aria-label="See all reviews on Fiverr"
                   className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all"
                >
                  See all reviews
                </Link>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">
                  Last review received 3 weeks ago
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Lazy Loaded Swiper Slider */}
          <div className="lg:col-span-8 relative min-h-[300px]">
            <DynamicSwiper />
          </div>
        </div>
      </div>
    </section>
  )
}