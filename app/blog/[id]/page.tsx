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
      {/* Schema.org ডাটা */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <Navbar />
      <main className="min-h-screen bg-slate-50/30 pb-20"> {/* হালকা ব্যাকগ্রাউন্ড দিলে রিডাবিলিটি বাড়ে */}
        <article>
          <SingleBlogHeader post={post} />
          
          {/* এই সেকশনটি কন্টেন্টকে মাঝখানে এবং সুন্দরভাবে গুছিয়ে রাখবে */}
          <div className="container mx-auto px-4 sm:px-6 lg:max-w-7xl mt-16">
            <div className="flex flex-col lg:flex-row gap-12">
              
              {/* মেইন কন্টেন্ট এলাকা (বাম দিকে) */}
              <div className="w-full lg:w-2/3">
                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100">
                   <SingleBlogContent post={post} />
                </div>
                
                <div className="mt-12">
                  <SingleBlogAuthorBox post={post} />
                </div>
                
                <div className="mt-16">
                  <RelatedPosts currentPostId={post.id} category={post.category} />
                </div>
              </div>

              {/* সাইডবার (ডান দিকে) */}
              <aside className="w-full lg:w-1/3 space-y-8">
                <div className="sticky top-24"> {/* স্ক্রল করলে সাইডবার আটকে থাকবে, যা দেখতে প্রিমিয়াম লাগে */}
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                     <h3 className="text-xl font-bold text-slate-900 mb-6">Explore My Services</h3>
                     <ServiceLinks />
                  </div>
                  <div className="mt-8">
                     <BlogCTA type={post.ctaType as any} />
                  </div>
                </div>
              </aside>

            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}