import { MetadataRoute } from 'next'
import { blogPosts } from '@/app/components/BlogMainPage/blogData' // আপনার ব্লগ ডাটা ইম্পোর্ট করুন

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.trackflowpro.com'

  // ১. আপনার সব ব্লগ পোস্টের জন্য ডাইনামিক ইউআরএল তৈরি করা
  const blogUrls = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.id}`,
    lastModified: new Date(post.date || new Date()), // পোস্টের ডেট থাকলে সেটি ব্যবহার হবে
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // ২. আপনার স্ট্যাটিক পেজগুলোর লিস্ট
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/book-audit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/server-side-tracking`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/google-ads-expert`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/facebook-capi`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/email-signature`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tracking-lab`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/join-the-team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // ৩. স্ট্যাটিক এবং ডাইনামিক ইউআরএল গুলোকে একসাথে জোড়া দেওয়া
  return [...staticPages, ...blogUrls]
}