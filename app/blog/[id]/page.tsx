import React from 'react'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'
import SingleBlogHeader from '@/app/components/SingaleBlogPage/singleBlogHeader'

import { notFound } from 'next/navigation'
import { blogPosts } from '@/app/components/BlogMainPage/blogData'
import SingleBlogAuthorBox from '@/app/components/SingaleBlogPage/SingleBlogAuthorBox'
import SingleBlogContent from '@/app/components/SingaleBlogPage/singleBlogContent'
import ServiceLinks from '@/app/components/SingaleBlogPage/serviceLinks'
import BlogCTA from '@/app/components/SingaleBlogPage/blogCTA'
import RelatedPosts from '@/app/components/SingaleBlogPage/relatedPosts'
import { Metadata } from 'next'

type Props = {
  params: Promise<{ id: string }>
}

/** * ১. Dynamic Metadata Function 
 * এটি গুগলে আপনার ব্লগের টাইটেল এবং ডেসক্রিপশন দেখাবে
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = blogPosts.find((p) => p.id === id);

  if (!post) {
    return { title: "Blog Not Found | Shahjalal" };
  }

  return {
    title: `${post.title} | Shahjalal - Tracking Expert`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: 'article',
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  }
}

export default async function SingleBlogPage({ params }: Props) {
  const { id } = await params;
  const post = blogPosts.find((p) => p.id === id);

  if (!post) notFound();

  /** * ২. JSON-LD Schema 
   * এটি গুগল বটকে আপনার কন্টেন্ট সম্পর্কে টেকনিক্যাল ডাটা দেয়
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "image": post.image,
    "datePublished": post.date,
    "author": {
      "@type": "Person",
      "name": "Shahjalal",
      "url": "https://www.trackflowpro.com/about" // আপনার ওয়েবসাইট অনুযায়ী পরিবর্তন করুন
    },
  };

  return (
    <>
      {/* গুগল বটের জন্য স্ক্রিপ্ট */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <Navbar />
      <main>
        <SingleBlogHeader post={post} />
        <SingleBlogAuthorBox post={post} />

        <SingleBlogContent post={post} />

        <ServiceLinks />

        <BlogCTA type={post.ctaType as any} />

        <RelatedPosts currentPostId={post.id} category={post.category} />
      </main>
      <Footer />
    </>
  )
}