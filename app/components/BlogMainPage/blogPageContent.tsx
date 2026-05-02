"use client"
import React, { useState } from 'react'
import { blogPosts } from './blogData';
import Navbar from '../navbar';
import BlogHero from './blogHero';
import BlogCategories from './BlogCategory';
import BlogGrid from './blogGrid';
import FeaturedPost from './blogFeatured';
import NewsletterSignup from './blogNewsletter';
import BlogCTA from './blogCta';
import Footer from '../footer';


export default function BlogPageContent() {
  const [activeTab, setActiveTab] = useState("All Posts");

  // ফিল্টারিং লজিক
  const filteredPosts = activeTab === "All Posts" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeTab);

  return (
    <>
      <Navbar />
      <Navbar />
      <BlogHero />
      
      {/* এখন আর কোনো প্রপস পাঠাতে হবে না, এরর চলে যাবে */}
      <BlogCategories />
      <BlogGrid />

      <FeaturedPost />
      <NewsletterSignup />
      <BlogCTA />
      
      <Footer />
    </>
  )
}