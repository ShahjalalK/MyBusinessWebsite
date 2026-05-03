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
      <main className="min-h-screen bg-white pb-20">
        <article>
          <SingleBlogHeader post={post} />
          
          {/* কন্টেন্টকে মাঝখানে রাখার জন্য max-w-4xl ব্যবহার করা হয়েছে */}
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl mt-12">
            
            {/* ১. মেইন ব্লগ কন্টেন্ট */}
            <div className="prose prose-lg max-w-none">
               <SingleBlogContent post={post} />
            </div>
            
            {/* ২. কন্টেন্টের শেষে বর্ডার দিয়ে বাকি সেকশন শুরু */}
            <div className="mt-16 pt-12 border-t border-slate-100 space-y-20">
              
              {/* ৩. সার্ভিস লিঙ্কস (এখন এটি পুরো চওড়া জায়গায় থাকবে, তাই ভাঙবে না) */}
              <section>
                <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Explore My Services</h3>
                <ServiceLinks />
              </section>
             

              {/* ৫. অথর বক্স */}
              <section>
                <SingleBlogAuthorBox post={post} />
              </section>

              {/* ৬. রিলেটেড পোস্টস */}
              <section>
                <RelatedPosts currentPostId={post.id} category={post.category} />
              </section>

               {/* ৪. ব্লগ CTA */}
              <section>
                <BlogCTA type={post.ctaType as any} />
              </section>
              
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}