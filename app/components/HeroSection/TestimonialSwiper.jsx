// TestimonialSwiper.jsx
"use client"
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, A11y } from 'swiper/modules';
import Image from 'next/image';

// CSS Imports (শুধু এই ফাইলেই থাকবে)
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const reviews = [
  {
    name: "Kaitlinan",
    role: "9 months ago",
    image: "/testimonials/kaitlinanth11.webp", 
    text: "This is the 3rd time I have worked with him and everytime he has delivered an exceptional product..."
  },
  {
    name: "Anna David",
    role: "1 year ago",
    image: "/testimonials/anna-david.webp", 
    text: "We love working with him! He is so kind and goes above and beyond when it comes to making us happy!"
  },
  {
    name: "Patricia Winter",
    role: "2 months ago",
    image: "/testimonials/patriciawinter.webp", 
    text: "Again excellent work, thank you very much! I am very satisfied with the GA4 server-side tracking setup."
  }
];

export default function TestimonialSwiper() {
  return (
    <>
      <Swiper
        modules={[Autoplay, Pagination, Navigation, A11y]}
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
        }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={true}
        className="testimonial-swiper !pb-14"
      >
        {reviews.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 h-full flex flex-col shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12">
                     <Image 
                       src={item.image} 
                       alt={item.name} 
                       fill 
                       sizes="48px"
                       className="rounded-full object-cover border-2 border-blue-50 dark:border-slate-700" 
                     />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</h4>
                    <p className="text-slate-400 text-xs">{item.role}</p>
                  </div>
                </div>
                <div className="text-green-500 font-black text-xl italic" aria-hidden="true">fi</div>
              </div>
              <div className="flex text-yellow-400 mb-4 text-sm">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-grow">
                {item.text}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

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
    </>
  );
}