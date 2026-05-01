"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

// এই পাথগুলো ট্রাই করুন
import 'swiper/swiper-bundle.css'; 
// অথবা যদি উপরেরটা কাজ না করে, তবে নিচের গুলো:
import 'swiper/css';
import 'swiper/css/pagination';

const reviews = [
  {
    name: "John Smith",
    role: "E-commerce Owner, USA",
    initials: "JS", // ছবির Fallback হিসেবে ইনিশিয়াল থাকবে
    image: "/testimonials/kaitlinanth11.jpg", // ছবিগুলো public/testimonials ফোল্ডারে রাখুন
    text: "This is the 3rd time I have worked with him and everytime he has delivered an exceptional product."
  },
  {
    name: "Mark A.",
    role: "Real Estate Agent, Canada",
    initials: "MA",
    image: "/testimonials/anna-david.webp", 
    text: "We love working with him! He is so kind and goes above and beyond when it comes to making us happy!"
  },
  {
    name: "Patricia Winter",
    role: "Marketing Director, Australia",
    initials: "SK",
    image: "/testimonials/patriciawinter.webp", 
    text: "Again excellent work, thank you very much ! I am very satisfied."
  },
  {
    name: "David L.",
    role: "SaaS Founder, Germany",
    initials: "DL",
    // ইমেজ ফোল্ডারে ছবিটি না থাকলে Fallback কাজ করবে
    image: "/testimonials/rodharrisre.webp", 
    text: "Very professional. I highly recommend him."
  },
];

export default function TestimonialSwiper() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mb-4 inline-block"
            >
              Testimonials
            </motion.span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              What Our <span className="text-blue-600">Clients Say.</span>
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium md:text-right max-w-xs">
            Trusted by 28+ brands worldwide for precision tracking and data accuracy.
          </p>
        </div>

        {/* Swiper Slider */}
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true, el: '.custom-pag' }}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="pb-20"
        >
          {reviews.map((item, index) => (
            <SwiperSlide key={index}>
              <div className="h-full bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 hover:border-blue-500/30 group shadow-sm hover:shadow-xl hover:shadow-blue-500/5">
                
                <div>
                  {/* Stars */}
                  <div className="flex gap-1 text-yellow-400 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-8">
                    "{item.text}"
                  </p>
                </div>

                <div className="flex items-center pt-6 border-t border-slate-50 dark:border-slate-800/50">
                  
                  {/* Client Image Container */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden mr-4 shadow-lg shadow-slate-200/50 dark:shadow-blue-500/10 flex items-center justify-center bg-blue-600 text-white font-black text-lg group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // যদি ছবি লোড না হয়, তবে ইমেজ ট্যাগটি লুকিয়ে ইনিশিয়াল দেখাবে
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      // যদি ডাটাতে ইমেজ পাথ না থাকে, তবে সরাসরি ইনিশিয়াল দেখাবে
                      <span>{item.initials}</span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</h4>
                    <p className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">{item.role}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Pagination Dots */}
        <div className="custom-pag flex justify-center gap-2 mt-4" />

      </div>

      <style jsx global>{`
        .custom-pag .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #cbd5e1;
          opacity: 1;
          transition: all 0.3s;
          border-radius: 4px;
        }
        .custom-pag .swiper-pagination-bullet-active {
          width: 24px;
          background: #2563eb !important;
        }
      `}</style>
    </section>
  )
}