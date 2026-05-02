"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import Link from 'next/link';

const reviews = [
  {
    name: "Kaitlinan",
    role: "9 months ago",
    platform: "fiverr",
    image: "/testimonials/kaitlinanth11.webp", 
    text: "This is the 3rd time I have worked with him and everytime he has delivered an exceptional product. Writing a book is a daunting task and a massive process. All along the way he was there for me..."
  },
  {
    name: "Anna David",
    role: "1 year ago",
    platform: "fiverr",
    image: "/testimonials/anna-david.webp", 
    text: "We love working with him! He is so kind and goes above and beyond when it comes to making us happy! Excellent communication and perfect delivery."
  },
  {
    name: "Patricia Winter",
    role: "2 months ago",
    platform: "fiverr",
    image: "/testimonials/patriciawinter.webp", 
    text: "Again excellent work, thank you very much! I am very satisfied with the GA4 server-side tracking setup. Highly recommend."
  }
];

export default function TestimonialSection() {
  return (
    <section className="py-20 bg-[#F8F9FA] dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* বাম পাশের স্ট্যাটাস কার্ড (ইমেজের মতো) */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 leading-tight">
                TrackFlow Pro <br /> Client Reviews
              </h3>
              <div className="text-6xl font-black text-slate-900 dark:text-white my-6">5.0</div>
              <div className="flex justify-center gap-1 text-yellow-400 mb-4 text-2xl">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="text-slate-500 text-sm mb-8">
                Based on 50+ reviews on Fiverr & Upwork for Digital Marketing & Tracking services.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="https://www.fiverr.com/shahjalalk" rel="nofollow noopener noreferrer" target="_blank"  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all">
                  See all reviews
                </Link>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">
                  Last review received 3 weeks ago
                </p>
              </div>
            </div>
          </div>

          {/* ডান পাশের স্লাইডার */}
          <div className="lg:col-span-8 relative">
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2 },
              }}
              autoplay={{ delay: 4000 }}
              pagination={{ clickable: true }}
              navigation={true}
              className="testimonial-swiper !pb-14"
            >
              {reviews.map((item, index) => (
                <SwiperSlide key={index}>
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 h-full flex flex-col shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-50" />
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</h4>
                          <p className="text-slate-400 text-xs">{item.role}</p>
                        </div>
                      </div>
                      {/* Fiverr Logo Icon (Simplified) */}
                      <div className="text-green-500 font-black text-xl italic">fi</div>
                    </div>
                    
                    <div className="flex text-yellow-400 mb-4 text-sm">
                      {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-grow">
                      {item.text.length > 150 ? item.text.substring(0, 150) + "..." : item.text}
                      <span className="text-blue-600 font-bold ml-1 cursor-pointer">Read more</span>
                    </p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .testimonial-swiper .swiper-button-next, 
        .testimonial-swiper .swiper-button-prev {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 50%;
          color: #333;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .testimonial-swiper .swiper-button-next:after, 
        .testimonial-swiper .swiper-button-prev:after {
          font-size: 18px;
          font-weight: bold;
        }
        .testimonial-swiper .swiper-pagination-bullet-active {
          background: #2563eb !important;
        }
      `}</style>
    </section>
  )
}