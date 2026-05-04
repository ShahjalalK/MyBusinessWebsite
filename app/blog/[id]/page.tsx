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

/** 
 * ১. Dynamic Metadata Function 
 * এখানে আমরা post.altText থাকলে সেটি আল্ট ট্যাগ হিসেবে ব্যবহার করছি
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = blogPosts.find((p) => p.id === id);

  if (!post) {
    return { title: "Post Not Found | TrackFlow Pro" };
  }

  // এসইও আল্ট টেক্সট অথবা পোস্ট টাইটেল ডিফাইন করা
  const imageAlt = post.altText || post.title;

  return {
    title: `${post.title} | TrackFlow Pro`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: imageAlt, // এসইও ফ্রেন্ডলি আল্ট টেক্সট
        },
      ],
      type: 'article',
      publishedTime: post.date,
      authors: ['Shahjalal'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image],
    },
    alternates: {
      canonical: `https://www.trackflowpro.com/blog/${post.id}`,
    },
  }
}

export default async function SingleBlogPage({ params }: Props) {
  const { id } = await params;
  const post = blogPosts.find((p) => p.id === id);

  if (!post) notFound();

  /** 
   * ২. JSON-LD Schema 
   * গুগল ইমেজ এবং রিচ স্নাইপেটের জন্য আল্ট টেক্সট সহ স্কিমা
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "image": {
      "@type": "ImageObject",
      "url": post.image,
      "caption": post.altText || post.title // গুগলের জন্য ছবির বর্ণনা
    },
    "datePublished": post.date,
    "author": {
      "@type": "Organization", // ব্যক্তিগত প্রোফাইল থেকে এজেন্সি প্রোফাইলে শিফট করা হয়েছে
      "name": "TrackFlow Pro",
      "url": "https://www.trackflowpro.com/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TrackFlow Pro",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.trackflowpro.com/logo.png"
      }
    }
  };

  return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    
    <Navbar />
    <main className="min-h-screen bg-white">
      <article>
        {/* হেডার সেকশন */}
        <SingleBlogHeader post={post} />
        
        {/* মেইন ব্লগ কন্টেন্ট - পড়ার সুবিধার জন্য এটি একটু সরু (max-w-3xl) রাখা হয়েছে */}
        <div className="container mx-auto px-6 max-w-3xl mt-16">
          <div className="prose prose-lg prose-slate max-w-none">
             <SingleBlogContent post={post} />
          </div>

          {/* অথর বক্স - কন্টেন্টের ঠিক পরেই */}
          <div className="mt-16 pt-10 border-t border-slate-100">
            <SingleBlogAuthorBox post={post} />
          </div>
        </div>
      </article>

      {/* নিচের সেকশনগুলো - এগুলোকে একটু চওড়া (max-w-6xl) রাখা হয়েছে যাতে ডিজাইন সুন্দর লাগে */}
      <div className="container mx-auto px-6 max-w-6xl mt-24 space-y-32 pb-24">
        
        {/* ১. রিলেটেড পোস্টস */}
        <section className="bg-slate-50/50 py-16 rounded-b-xl px-4">
           <div className="max-w-7xl mx-auto">
              <RelatedPosts currentPostId={post.id} category={post.category} />
           </div>
        </section>

        {/* ২. সার্ভিস লিঙ্কস - গ্রিড স্টাইল */}
        <section>
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900">Explore My Services</h3>
            <p className="text-slate-500 mt-2">Professional solutions for your business growth</p>
          </div>
          <ServiceLinks />
        </section>

        {/* ৩. ফাইনাল কল টু অ্যাকশন (CTA) */}
        <section className="pt-10">
          <BlogCTA type={post.ctaType as any} />
        </section>
        
      </div>
    </main>
    <Footer />
  </>
);
}