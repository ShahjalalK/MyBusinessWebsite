"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, ShieldCheck, Mail, Paperclip, Send, MoreVertical, X, Lock } from 'lucide-react'
import Link from 'next/link';

const portfolioImages = [
  {
    category: "Real Estate Expert",
    client: "High-Volume NY Brokerage",
    image: "/email-signature/clickable-html-signature-for-real-estate-agents.webp",
    description: "Multi-clickable HTML signature with integrated property listing links and direct WhatsApp CTA.",
    to: "client-lead@realestate-deals.com",
    subject: "Exclusive Property Listing Detail",
    body: "I’ve just confirmed the viewing for the downtown penthouse this Sunday at 10 AM. The owner is motivated, so this might move fast. Let me know if the time works for you!",
    greeting: "Best regards,"
  },
  {
    category: "Google Ads Agency",
    client: "Global Marketing Firm",
    image: "/email-signature/corporate-email-branding-identity-trackflowpro.webp",
    description: "Conversion-optimized signature featuring tracking-ready social icons and verified brand identity.",
    to: "strategy@marketing-agency.io",
    subject: "Q3 Campaign Performance Audit",
    body: "I’ve attached the latest performance audit for the Google Ads campaigns. We’re seeing a 15% decrease in CPA, so I recommend scaling the budget for the upcoming holiday season.",
    greeting: "Talk soon,"
  },
  {
    category: "Healthcare & Corporate",
    client: "Private Wellness Clinic",
    image: "/email-signature/head-floral-designer-email-branding-identity-trackflowpro.webp",
    description: "Clean, professional design with HIPAA-compliant legal disclaimers and dynamic appointment booking.",
    to: "appointments@healthcare-solutions.org",
    subject: "Confidential Consultation Confirmation",
    body: "Please find the attached summary from our consultation today. Ensure you review the privacy guidelines mentioned in the document. Let us know if you have further questions.",
    greeting: "Sincerely,"
  },
  {
    category: "Authors & Personal Brands",
    client: "Best-Selling Author",
    image: "/email-signature/professional-email-signature-design-sample.webp",
    description: "Minimalist yet bold signature focusing on personal authority and book launch promotions.",
    to: "press@author-official.com",
    subject: "Speaking Engagement Inquiry",
    body: "We’ve officially hit our 10k MRR milestone! I’ve shared the detailed growth sheet in the link below. Thanks for everyone's hard work this quarter.",
    greeting: "Cheers,"
  }
];

export default function GlobalSignaturePortfolio() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-[#020617]">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
            Turning <span className="text-blue-600 italic">Emails</span> Into Branding.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-bold max-w-2xl mx-auto">
            Trusted by 50+ international clients. See how our custom HTML signatures transform standard business communication into high-converting professional assets.
          </p>
        </div>

        {/* Privacy Shield */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 bg-white dark:bg-slate-900 px-6 py-3 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
            <Lock size={12} className="text-blue-600" /> 
            Client details anonymized for privacy protection
          </div>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
          {portfolioImages.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Compose Bar */}
                <div className="bg-slate-100 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">New Message</span>
                  <div className="flex gap-3">
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <X size={14} className="text-slate-400" />
                  </div>
                </div>

                {/* Email Fields */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 space-y-3">
                  <div className="flex text-xs font-bold gap-2">
                    <span className="text-slate-400 w-8">To:</span>
                    <span className="text-blue-600">{item.to}</span>
                  </div>
                  <div className="flex text-xs font-bold gap-2">
                    <span className="text-slate-400 w-8">Sub:</span>
                    <span className="text-slate-800 dark:text-slate-200">{item.subject}</span>
                  </div>
                </div>

                {/* Email Body & Signature Container */}
                <div className="p-8 min-h-[420px] flex flex-col justify-start">
                  
                  {/* Real Email Content */}
                  <div className="mb-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-4">
                      Hi there,
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {item.body}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-bold mt-6">
                      {item.greeting}
                    </p>
                  </div>
                    --
                  {/* HTML Signature Screenshot */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6 relative group/sig">
                    <div className="absolute -top-4 left-0 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-md tracking-widest opacity-0 group-hover/sig:opacity-100 transition-opacity uppercase">
                      Premium HTML Setup
                    </div>
                    <img 
                      src={item.image} 
                      alt={`${item.category} Sample`} 
                      className="w-full max-w-[350px] h-auto object-contain group-hover:scale-[1.02] transition-transform duration-500 rounded-md"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white px-5 py-2 rounded-lg text-xs font-black flex items-center gap-2">
                      Send <Send size={12} />
                    </div>
                    <Paperclip size={16} className="text-slate-400" />
                  </div>
                  <MoreVertical size={16} className="text-slate-400" />
                </div>
              </div>

              {/* Verified Badge below card */}
              <div className="mt-4 flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/20 w-fit">
                <ShieldCheck size={12} /> {item.category} - VERIFIED SETUP
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <Link href="/contact" className="inline-flex items-center gap-4 bg-slate-900 dark:bg-blue-600 text-white font-black py-6 px-12 rounded-2xl shadow-2xl hover:-translate-y-1 hover:shadow-blue-500/20 transition-all uppercase tracking-widest text-sm">
            Get My Custom Signature <ArrowRight size={20} />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold">
            <Sparkles size={14} className="text-yellow-500" /> Delivered within 24 Hours
          </div>
        </div>
      </div>
    </section>
  )
}