"use client"
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import { motion } from 'framer-motion'
import { Quote, Star, User2, Award } from 'lucide-react'
import Image from 'next/image'

// Swiper Styles
import 'swiper/css'
import 'swiper/css/pagination'

/**
 * SEO & Social Proof Optimization:
 * 1. Keywords: Clickable HTML signature, Outlook compatibility, Professional branding.
 * 2. Focus: Verified feedback from diverse professional sectors.
 */

const testimonials = [
  {
    content: "The best HTML signature I've used. It's fully clickable and looks consistent on both my iPhone and Desktop Outlook. Truly professional work!",
    author: "James Wilson",
    role: "Real Estate Professional",
    image: "/clients/client1.jpg", 
    rating: 5
  },
  {
    content: "Fast delivery and exceptional coding quality. My brand icons and social links work perfectly across all email platforms without any bugs.",
    author: "Sarah Jenkins",
    role: "E-commerce Founder",
    image: "", 
    rating: 5
  },
  {
    content: "I needed a specialized layout for my team. The result was a pixel-perfect, mobile-responsive signature that represents our firm perfectly.",
    author: "Michael Ross",
    role: "Legal Consultant",
    image: "/clients/client3.jpg",
    rating: 5
  },
  {
    content: "Clean code and very easy to install. The personalized video guide made the setup effortless even for someone with no tech background.",
    author: "David Miller",
    role: "Creative Director",
    image: "/clients/client4.jpg",
    rating: 5
  }
];

export default function EmailSignatureTestimonialSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/30 font-sans overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
          >
            <Star size={14} fill="currentColor" /> Global Success Stories
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight mb-6">
            Trusted by 50+ Professionals <br />
            <span className="text-amber-600 italic font-serif">Across the Globe.</span>
          </h2>
        </div>

        {/* Swiper Slider */}
        <div className="max-w-6xl mx-auto">
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            loop={true}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            pagination={{ clickable: true, el: '.custom-pagination' }}
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="pb-20"
          >
            {testimonials.map((item, idx) => (
              <SwiperSlide key={idx}>
                <div className="h-full p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 flex flex-col justify-between group hover:-translate-y-2 transition-all duration-500">
                  
                  <div>
                    <div className="flex justify-between items-center mb-8">
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600">
                        <Quote size={20} fill="currentColor" />
                      </div>
                      <div className="flex gap-0.5 text-amber-500">
                        {[...Array(item.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-300 text-lg font-medium italic leading-relaxed mb-8">
                      "{item.content}"
                    </p>
                  </div>

                  {/* Client Info */}
                  <div className="flex items-center gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border-2 border-white dark:border-slate-700 shadow-md">
                      {item.image ? (
                        <Image 
                          src={item.image} 
                          alt={item.author}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <User2 size={28} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-white font-black tracking-tight leading-none mb-1">
                        {item.author}
                      </p>
                      <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                        {item.role}
                      </p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          <div className="custom-pagination flex justify-center gap-3 mt-4" />
        </div>

        {/* Footer Trust Line */}
        <div className="mt-20 text-center">
           <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3">
              <Award size={14} className="text-amber-500" /> Verified 5-Star Reviews from Fiverr & Upwork.
           </p>
        </div>
      </div>

      <style jsx global>{`
        .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #cbd5e1;
          opacity: 1;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          width: 28px;
          border-radius: 4px;
          background: #d97706 !important;
        }
      `}</style>
    </section>
  )
}