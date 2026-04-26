"use client"
import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView, animate } from 'framer-motion'

// ১. CounterUp Component
function CounterUp({ value, suffix = "", duration = 2 }: { value: string, suffix?: string, duration?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  
  const hasSlash = value.includes('/');
  const mainNumber = hasSlash ? parseInt(value.split('/')[0]) : parseInt(value.replace(/[^0-9]/g, ''));
  const secondPart = hasSlash ? `/${value.split('/')[1]}` : "";

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView && !isNaN(mainNumber)) {
      const controls = animate(0, mainNumber, {
        duration: duration,
        ease: "easeOut",
        onUpdate(v) { setDisplayValue(Math.floor(v)); },
      });
      return () => controls.stop();
    }
  }, [isInView, mainNumber, duration]);

  return (
    <span ref={ref}>
      {displayValue}{secondPart}{suffix}
    </span>
  );
}

export default function Achievement() {
  // স্ট্যাটসগুলো আপনার রিসার্চ ফাইল অনুযায়ী অপ্টিমাইজ করা হয়েছে
  const stats = [
    { val: "50", label: "Global Projects", suffix: "+" },
    { val: "99", label: "Tracking Precision", suffix: "%" }, // Data Precision -> Tracking Precision (GTM focus)
    { val: "4", label: "Avg. ROAS Increase", suffix: "X+" }, // $10M Managed এর বদলে ROAS ফোকাস করা ক্লায়েন্টের কাছে বেশি আকর্ষণীয়
    { val: "24/7", label: "Active Monitoring", suffix: "" },
  ];

  return (
    <section className="py-24 bg-blue-600 relative overflow-hidden">
      {/* Background Pattern - Subtle & Professional */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center divide-x-0 md:divide-x divide-blue-400/30"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.05 }}
              className="px-4 group"
            >
              <h3 className="text-4xl md:text-7xl font-black text-white mb-2 tracking-tighter flex justify-center items-center gap-1">
                <CounterUp 
                  value={stat.val} 
                  suffix={stat.suffix} 
                  duration={2.5} 
                />
              </h3>
              <p className="text-blue-100 font-black uppercase tracking-[0.2em] text-[9px] md:text-[11px] opacity-70 group-hover:opacity-100 transition-opacity">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}