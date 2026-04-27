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
  ctaType: "tracking" | "signature" | "ads";
  isFeatured?: boolean; // নতুন যোগ করা হয়েছে
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
    ctaType: "tracking",
    isFeatured: true, // এটি ট্র্যাকিং সার্ভিস প্রমোট করবে
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
    id: "ultimate-google-ads-audit-checklist",
    title: "The Ultimate Google Ads Audit Checklist to Maximize ROAS",
    description: "Stop wasting your ad spend. Learn how a professional Google Ads audit service can find hidden leaks and scale your business growth.",
    image: "/blog-audit.jpg", // এখানে আপনার তৈরি করা লম্বা লম্বি ছবিটি ব্যবহার করতে পারেন
    category: "Google Ads",
    date: "May 02, 2026",
    readTime: "10 min read",
    ctaType: "ads",
    isFeatured: true, // এটিকে এখন Featured করতে পারেন
    content: [
      { 
        type: 'paragraph', 
        text: "Are you pumping money into Google Ads but seeing a declining Return on Ad Spend (ROAS)? Many businesses face this because their accounts are running on 'Auto-pilot'. A professional google ads audit service isn't just about finding errors; it's about uncovering growth opportunities that your competitors are missing." 
      },
      { 
        type: 'heading', 
        text: "1. Audit Your Conversion Tracking Accuracy" 
      },
      { 
        type: 'paragraph', 
        text: "The most common issue I find in audits is 'Broken Tracking'. If your GA4 or GTM conversion tags aren't firing correctly, Google's Smart Bidding will fail. You must ensure that you are using Server-Side Tracking to recover data lost to ad-blockers and ITP updates." 
      },
      { 
        type: 'heading', 
        text: "2. The Search Term Report: Stop Burning Cash" 
      },
      { 
        type: 'paragraph', 
        text: "Check your search terms. Are you paying for keywords that have zero intent to buy? By identifying these and moving them to a 'Negative Keyword List', you can instantly save 20-30% of your daily budget." 
      },
      { 
        type: 'image', 
        url: "/audit-dashboard.jpg", 
        caption: "A deep dive into search term reports can save thousands of dollars." 
      },
      { 
        type: 'heading', 
        text: "3. Ad Copy & Asset (Extension) Quality" 
      },
      { 
        type: 'paragraph', 
        text: "Google Ads is a competition of attention. Your ads must have high CTR (Click-Through Rate). Audit your headlines and ensure you are using all relevant assets like Sitelinks, Callouts, and Structured Snippets to dominate the search results page." 
      },
      { 
        type: 'heading', 
        text: "Your Quick Google Ads Audit Checklist" 
      },
      { 
        type: 'list', 
        items: [
          "Verify GA4 and Google Ads conversion link status.",
          "Check for 'Limited by Budget' warnings and analyze Impression Share.",
          "Review Campaign bidding strategies (Shift to Target ROAS if data allows).",
          "Remove redundant keywords and consolidate 'Keyword Cannibalization'.",
          "Test Landing Page loading speed and mobile responsiveness."
        ] 
      },
      { 
        type: 'paragraph', 
        text: "If this sounds technical, don't worry. Performing a regular audit is a continuous process. However, the initial cleanup can often double your lead flow without increasing your spend by a single dollar." 
      }
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