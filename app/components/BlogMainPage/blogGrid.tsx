"use client"

import React from "react"
import { motion } from "framer-motion"
import { FaArrowRight, FaCalendarAlt, FaClock, FaSearch } from "react-icons/fa"
import Link from "next/link"
import { useBlogStore } from "@/app/store/useBlogStore"
import { blogPosts } from "./blogData"
import Image from "next/image"

export default function BlogGrid() {
  const activeCategory = useBlogStore((state) => state.activeCategory)
  const searchQuery = useBlogStore((state) => state.searchQuery)

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = activeCategory === "All Posts" || post.category === activeCategory
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  return (
    <section className="relative overflow-hidden bg-slate-50 py-14 dark:bg-slate-950 sm:py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-5 sm:px-6">
        {filteredPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <FaSearch size={22} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">No articles found</h3>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
              Try changing the category or search keyword to find more articles.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post, idx) => {
              const isFeatured = idx === 0

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: Math.min(idx * 0.07, 0.35), duration: 0.5, ease: "easeOut" }}
                  className={`group relative flex min-h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/70 ${
                    isFeatured ? "md:col-span-2 xl:col-span-2" : ""
                  }`}
                >
                  <Link href={`/blog/${post.id}`} className="block focus:outline-none">
                    <div
                      className={`relative overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 ${
                        isFeatured ? "aspect-[16/7] md:aspect-[16/7]" : "aspect-[16/10]"
                      }`}
                    >
                      <Image
                        src={post.image}
                        alt={post.altText || post.title}
                        loading={idx < 3 ? "eager" : "lazy"}
                        className="h-full w-full object-contain p-2 transition-transform duration-700 group-hover:scale-[1.03]"
                      />

                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/35 to-transparent opacity-70" />

                      <div className="absolute left-4 top-4 flex items-center gap-2 sm:left-5 sm:top-5">
                        <span className="rounded-full border border-white/50 bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/85 dark:text-blue-300">
                          {post.category}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-500" /> {post.date}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <FaClock className="text-blue-500" /> {post.readTime}
                      </span>
                    </div>

                    <h3 className={`font-black leading-[1.08] tracking-tight text-slate-950 transition-colors group-hover:text-blue-600 dark:text-white ${isFeatured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>
                      <Link href={`/blog/${post.id}`}>{post.title}</Link>
                    </h3>

                    <p className={`mt-4 font-medium leading-7 text-slate-600 dark:text-slate-400 ${isFeatured ? "line-clamp-3 text-base" : "line-clamp-3 text-sm"}`}>
                      {post.description}
                    </p>

                    <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
                      <Link
                        href={`/blog/${post.id}`}
                        className="inline-flex items-center gap-3 text-sm font-black text-slate-950 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        Read article
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800 dark:text-white">
                          <FaArrowRight size={12} className="-rotate-45 transition-transform duration-300 group-hover:rotate-0" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
