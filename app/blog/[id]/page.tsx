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

// params কে Promise হিসেবে টাইপ দিন
export default async function SingleBlogPage({ params }: { params: Promise<{ id: string }> }) {
  
  // params কে await করুন
  const { id } = await params;

  // এখন id দিয়ে ডাটা খুঁজুন
  const post = blogPosts.find((p) => p.id === id);

  if (!post) notFound();

  return (
    <>
      <Navbar />
      <main>
        <SingleBlogHeader post={post} />
        <SingleBlogAuthorBox post={post} /> {/* নতুন সেকশন */}

        <SingleBlogContent post={post} />

        <ServiceLinks />

        <BlogCTA type={post.ctaType as any} />

        <RelatedPosts currentPostId={post.id} category={post.category} />
      </main>
      <Footer />
    </>
  )
}