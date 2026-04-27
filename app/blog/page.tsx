"use client"
import React, { useState } from 'react'
import { blogPosts } from '../components/BlogMainPage/blogData';
import BlogHero from '../components/BlogMainPage/blogHero';
import BlogCategories from '../components/BlogMainPage/BlogCategory';
import BlogGrid from '../components/BlogMainPage/blogGrid';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import FeaturedPost from '../components/BlogMainPage/blogFeatured';
import NewsletterSignup from '../components/BlogMainPage/blogNewsletter';
import BlogCTA from '../components/BlogMainPage/blogCta';



export default function BlogPage() {
  const [activeTab, setActiveTab] = useState("All Posts");

  // ফিল্টারিং লজিক: যদি "All Posts" থাকে তবে সব দেখাবে, নাহলে ক্যাটাগরি মিললে দেখাবে
  const filteredPosts = activeTab === "All Posts" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeTab);

  return (
    <>
    <Navbar />
    <BlogHero />
      
      {/* ক্যাটাগরি কম্পোনেন্টে স্টেট পাঠানো হচ্ছে */}
      <BlogCategories/>

      {/* গ্রিড কম্পোনেন্টে ফিল্টার করা ডাটা পাঠানো হচ্ছে */}
      <BlogGrid />

      <FeaturedPost />

      <NewsletterSignup />

      <BlogCTA />


      
    <Footer />
    </>
  )
}