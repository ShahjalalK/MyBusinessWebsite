// ১. কন্টেন্টের টাইপ ডিফাইন করা
export interface BlogContent {
  type: 'paragraph' | 'heading' | 'image' | 'list' | 'code';
  text?: string;
  url?: string;
  caption?: string;
  items?: string[];
  language?: string;
}

// ২. ব্লগের মেইন ইন্টারফেস (ctaType যোগ করা হয়েছে)
export interface BlogPost {
  id: string;
  title: string;
  description: string;
  image: string;
  category: "Facebook CAPI" | "Server-side Tracking" | "Google Ads" | "Web Analytics" | "Email Marketing";
  date: string;
  readTime: string;
  content: BlogContent[];
  ctaType: "tracking" | "signature" | "ads"; // নতুন ফিল্ড
}

// ৩. ব্লগ ডাটা লিস্ট
export const blogPosts: BlogPost[] = [
  {
    id: "facebook-capi-recovery-guide",
    title: "How to Recover 40% Lost Data with Facebook CAPI",
    description: "After iOS 14 updates, many businesses lose significant tracking data. Learn how to recover it using Server-side GTM and CAPI.",
    image: "/blog1.jpg",
    category: "Facebook CAPI",
    date: "April 10, 2026",
    readTime: "6 min read",
    ctaType: "tracking", // এটি ট্র্যাকিং সার্ভিস প্রমোট করবে
    content: [
      { type: 'paragraph', text: "In today's privacy-first world, browser-side tracking is no longer enough. Facebook Conversion API (CAPI) allows you to send data directly from your server to Facebook." },
      { type: 'heading', text: "Why Browser Tracking is Failing?" },
      { type: 'paragraph', text: "Ad-blockers, ITP updates, and the famous iOS 14.5 prompt have made standard pixel tracking unreliable. This is where Server-side tracking comes in." },
      { type: 'image', url: "https://images.unsplash.com/photo-1551288049-bbda48658a7d?q=80", caption: "Difference between Browser and Server Tracking" },
      { type: 'heading', text: "Key Steps to Setup CAPI" },
      { type: 'list', items: ["Setup a Google Tag Manager Server Container", "Configure a Web Container to send data to the Server", "Enable Facebook CAPI Tag in the Server Container", "Deduplicate events using Event ID"] },
    ]
  },
  {
    id: "google-ads-roas-optimization",
    title: "Advanced Google Ads Strategies to Boost ROAS",
    description: "Stop wasting budget on broad keywords. Discover the advanced bidding strategies that experts use to scale ROAS efficiently.",
    image: "/blog1.jpg",
    category: "Google Ads",
    date: "April 05, 2026",
    readTime: "8 min read",
    ctaType: "ads", // এটি গুগল অ্যাডস সার্ভিস প্রমোট করবে
    content: [
      { type: 'paragraph', text: "Scaling a Google Ads account requires more than just high budgets. It requires precision and data accuracy." },
      { type: 'heading', text: "The Power of Value-Based Bidding" },
      { type: 'paragraph', text: "Instead of focusing on clicks, focus on conversion value. This allows Google's AI to find customers who spend more." },
    ]
  },
  {
    id: "server-side-tracking-future",
    title: "Why Server-Side Tracking is the Future of Marketing",
    description: "Browser cookies are dying. Understand why server-side tracking is no longer an option, but a necessity for digital marketers in 2026.",
    image: "/blog1.jpg",
    category: "Server-side Tracking",
    date: "March 28, 2026",
    readTime: "5 min read",
    ctaType: "tracking", // এটি ট্র্যাকিং সার্ভিস প্রমোট করবে
    content: [
      { type: 'paragraph', text: "Third-party cookies are being phased out. Server-side tracking provides a more secure and accurate way to collect data." },
    ]
  }
];