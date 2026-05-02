"use client"
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Swiper এর ভারি CSS ফাইলগুলো শুধু স্লাইডার লোড হওয়ার সময় আসবে
const DynamicSwiper = dynamic(() => import('./TestimonialSwiper'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
});

export default function TestimonialSection() {
  const [loadSlider, setLoadSlider] = useState(false);

  useEffect(() => {
    // ২ সেকেন্ড পর স্লাইডার লোড হবে (যাতে LCP এবং TBT স্কোর ১০০% ঠিক থাকে)
    const timer = setTimeout(() => {
      setLoadSlider(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-16 bg-[#F8F9FA] dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-4 text-center">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">TrackFlow Reviews</h3>
              <div className="text-5xl font-black text-slate-900 dark:text-white my-4">5.0</div>
              <div className="flex justify-center gap-1 text-yellow-400 mb-6 text-xl" aria-label="5 star rating">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <Link 
                href="https://www.fiverr.com/shahjalalk" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                See all reviews
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8 min-h-[350px]">
            {loadSlider ? <DynamicSwiper /> : <div className="h-[350px] w-full bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />}
          </div>
        </div>
      </div>
    </section>
  )
}