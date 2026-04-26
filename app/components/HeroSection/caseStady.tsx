"use client"

import React from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, ArrowRight, TrendingUp, ShieldCheck } from "lucide-react"
import Link from "next/link"

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
}

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.2 } },
}

export default function CaseStudy() {
  const services = [
    {
      title: "Advanced Tracking & Attribution Setup",
      desc: "We help businesses set up Meta Pixel, Conversions API, GA4, and server-side tracking to improve data accuracy and make smarter marketing decisions.",
      tags: ["Meta CAPI", "GA4", "Server-Side Tracking"],
      imgText: "Tracking & Attribution System",
      results: "Better Data Visibility",
      link: "/services/tracking-attribution",
    },
    {
      title: "Google Ads Audit & Growth Strategy",
      desc: "We analyze campaign structure, wasted ad spend, conversion tracking, and targeting opportunities to build a clearer path for profitable growth.",
      tags: ["Google Ads Audit", "PMax Strategy", "ROAS Optimization"],
      imgText: "Google Ads Performance Review",
      results: "Smarter Ad Decisions",
      link: "/services/google-ads-audit",
    },
  ]

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950/50 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Header Section */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-2xl">
            <span className="text-blue-600 dark:text-blue-400 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
              Our Expertise
            </span>

            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[0.9]">
              Growth <span className="text-blue-600">Solutions.</span>
            </h2>

            <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl leading-relaxed">
              We help brands build stronger tracking, cleaner analytics, and
              smarter advertising systems — so every marketing decision is backed
              by reliable data.
            </p>
          </div>

          <Link
            href="/services"
            className="group px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-900 dark:text-white font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
          >
            View All Services
            <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          </Link>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {services.map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group relative flex flex-col"
            >
              <Link
                href={item.link}
                className="absolute inset-0 z-30"
                aria-label={item.title}
              />

              {/* Visual Card with Highlight Badge */}
              <div className="relative h-[400px] w-full overflow-hidden rounded-[2.5rem] mb-8 bg-slate-200 dark:bg-slate-800 shadow-2xl shadow-blue-500/5 transition-transform duration-500 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500 z-10" />

                <div className="w-full h-full flex items-center justify-center p-12 bg-white dark:bg-slate-900">
                  <div className="w-full h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm transition-colors group-hover:border-blue-500/50">
                    <TrendingUp className="w-12 h-12 text-blue-600/20 mb-4" />

                    <span className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] text-center">
                      {item.imgText}
                    </span>
                  </div>
                </div>

                {/* Highlight Badge */}
                <div className="absolute bottom-8 left-8 z-20">
                  <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <p className="text-sm font-black tracking-tight">
                      {item.results}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="px-2">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {item.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-4 py-1.5 rounded-full uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 transition-colors leading-[1.1] tracking-tighter">
                  {item.title}
                </h3>

                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-base mb-8 line-clamp-2 h-[3rem]">
                  {item.desc}
                </p>

                <div className="inline-flex items-center gap-3 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-[0.2em]">
                  Explore This Service
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}