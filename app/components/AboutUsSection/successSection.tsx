"use client"
import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView, animate } from 'framer-motion'

// এনিমেশন ভেরিয়েন্ট
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" }
}

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.15 } }
}

// ১. সংখ্যা কাউন্টের জন্য কাস্টম কম্পোনেন্ট
function CounterUp({ value, suffix = "", duration = 2 }: { value: string, suffix?: string, duration?: number }) {
  // শুধুমাত্র সংখ্যাটুকু আলাদা করে নেওয়া (যেমন: "50+" থেকে 50)
  const numericValue = parseInt(value, 10);
  
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  
  // চেক করা যে কম্পোনেন্টটি স্ক্রিনে দৃশ্যমান কি না
  const isInView = useInView(ref, { once: true, amount: 0.5 }); // ৫০% দৃশ্যমান হলে শুরু হবে

  useEffect(() => {
    // যদি স্ক্রিনে দৃশ্যমান হয় এবং ভ্যালু একটি সঠিক সংখ্যা হয়
    if (isInView && !isNaN(numericValue)) {
      // ০ থেকে numericValue পর্যন্ত এনিমেট করা
      const controls = animate(0, numericValue, {
        duration: duration, // এনিমেশন কতক্ষণ চলবে
        ease: "easeOut",    // শেষে আস্তে হবে
        onUpdate(value) {
          setDisplayValue(Math.floor(value)); // পূর্ণসংখ্যা দেখানোর জন্য
        },
      });

      return () => controls.stop(); // কম্পোনেন্ট আনমাউন্ট হলে এনিমেশন বন্ধ করা
    }
  }, [isInView, numericValue, duration]);

  return (
    <span ref={ref}>
      {/* যদি সংখ্যা না হয় (যেমন "Global") তবে সরাসরি ভ্যালু দেখাবে */}
      {isNaN(numericValue) ? value : displayValue}
      {/* যদি সংখ্যা হয়, তবে সাফিক্স (%, +) যোগ করবে */}
      {!isNaN(numericValue) && suffix}
    </span>
  );
}

// ২. মেইন SuccessSection কম্পোনেন্ট
export default function SuccessSection() {
  const stats = [
    { val: "50", label: "Projects Done", suffix: "+" },
    { val: "100", label: "Data Accuracy", suffix: "%" },
    { val: "24/7", label: "Client Support", suffix: "" }, // ২৪/৭ এনিমেশন না করাই ভালো, এটি সরাসরি থাক
    { val: "Global", label: "Service Reach", suffix: "" }, // টেক্সট এনিমেশন হবে না
  ];

  return (
    <section className="bg-slate-900 py-24 text-white relative overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {stats.map((stat, i) => (
            <motion.div 
                key={i} 
                variants={fadeInUp}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all duration-300"
            >
              <p className="text-5xl md:text-6xl font-black text-blue-400 mb-3 tracking-tighter">
                {/* এখানে CounterUp কম্পোনেন্ট ব্যবহার করা হয়েছে */}
                <CounterUp value={stat.val} suffix={stat.suffix} duration={2.5} />
              </p>
              <p className="text-xs md:text-sm uppercase tracking-widest opacity-80 font-bold">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}