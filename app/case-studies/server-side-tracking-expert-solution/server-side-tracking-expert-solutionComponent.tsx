"use client";
import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';



const faqs = [
  {
    q: "Will this work with my WordPress or Shopify store?",
    a: "Absolutely! While this case study showcases a custom Next.js build, we specialize in implementing the same high-accuracy tracking on WordPress (via GTM/Stape) and Shopify. The logic remains the same—moving data from the browser to the server."
  },
  {
    q: "How does this bypass Ad-Blockers?",
    a: "Standard tracking pixels are identified and blocked by browsers and extensions. Our server-side setup sends data through your own custom domain (e.g., tracking.yourdomain.com), making it invisible to ad-blockers and ensuring 100% data flow."
  },
  {
    q: "Do I really need this if my pixel is already 'Active'?",
    a: "An 'Active' pixel only means it's working for users without ad-blockers. Studies show standard pixels miss up to 30% of conversions on iOS and privacy-focused browsers. Server-Side tracking recovers that lost revenue data."
  },
  {
    q: "Will this slow down my website speed?",
    a: "Quite the opposite. By offloading heavy tracking scripts from the browser to the server, your website's front-end stays lightweight and lightning-fast, improving your overall user experience and SEO."
  }
];

export default function ServerSideTrackingCaseStady() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index : any) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      
      <div className="bg-slate-50 min-h-screen text-slate-900 font-sans selection:bg-blue-100">
        
        {/* ১. প্রিমিয়াম হিরো সেকশন */}
        <section className="relative bg-slate-900 py-32 overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-blue-400 uppercase bg-blue-400/10 border border-blue-400/20 rounded-full">
              Success Story: TrackFlowPro
            </span>
            <h1 className="text-4xl md:text-7xl font-black mb-8 leading-tight text-white">
              Recovering <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">30% Lost Data</span> <br/>
              via Server-Side Logic
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We engineered a custom server-to-server tracking architecture to bypass ad-blockers and iOS privacy restrictions, ensuring 100% data integrity.
            </p>
          </div>
        </section>

        {/* ২. মডার্ন প্রবলেম কার্ডস */}
        <section className="py-24 container mx-auto px-6 -mt-16 relative z-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Ad-Blockers", desc: "Standard browser pixels are neutralized by ad-blockers, hiding 30% of your sales data.", icon: "🚫" },
              { title: "iOS Privacy", desc: "Intelligent Tracking Prevention (ITP) erases cookies, making iPhone user tracking nearly impossible.", icon: "📱" },
              { title: "Wasted Budget", desc: "Incomplete data handicaps Google/Meta AI, leading to higher CPAs and lower ROAS.", icon: "📉" }
            ].map((item, index) => (
              <div key={index} className="p-8 bg-white/80 backdrop-blur-md shadow-xl rounded-3xl border border-white hover:border-blue-200 transition-all duration-300 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="font-bold text-xl mb-3 text-slate-800">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ৩. ভিজ্যুয়াল এভিডেন্স ১ - মেটা সিএপিআই */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs uppercase tracking-widest">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                  Implementation 01
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900">Next-Gen Meta Conversions API (CAPI)</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Instead of relying on the browser, we established a secure server-side connection. Every lead generated on **TrackFlowPro** is now mirrored directly to Meta's servers.
                </p>
                <div className="p-6 bg-indigo-900 rounded-2xl shadow-xl text-indigo-100 border-l-8 border-blue-400">
                   <p className="italic font-medium">"Observe the 21 'Lead' events in our dashboard—100% verified through Server-Side Integration with high match quality scores."</p>
                </div>
              </div>
              <div className="flex-1">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative bg-white rounded-2xl p-2 shadow-2xl overflow-hidden border">
                    <Image src="/case-stady/facebook-conversions-api-server-side-tracking-proof.png" alt="Evidence of 21 leads tracked via Facebook Conversions API (CAPI) on TrackFlowPro dashboard" width={1000} height={600} className="rounded-xl transition-transform duration-700 group-hover:scale-[1.02]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ৪. ভিজ্যুয়াল এভিডেন্স ২ - জিএ৪ */}
        <section className="py-24 bg-slate-100/50">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row-reverse gap-16 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-xs uppercase tracking-widest">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></span>
                  Implementation 02
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900">Zero-Latency GA4 Engine</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  We engineered a custom tracking engine that operates independently of third-party plugins. This keeps the site lightning-fast while maintaining a 1:1 data accuracy ratio.
                </p>
                <ul className="grid grid-cols-1 gap-4">
                  {["SHA-256 Data Hashing for Privacy", "100% Ad-Blocker Bypass Logic", "Custom Loaders for GTM Execution"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 font-semibold text-slate-700 bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                      <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative bg-white rounded-2xl p-2 shadow-2xl overflow-hidden border">
                    <Image src="/case-stady/ga4-realtime-tracking-server-side-integration.png" alt="Real-time user tracking on Google Analytics 4 (GA4) with custom server-side logic" width={1000} height={600} className="rounded-xl transition-transform duration-700 group-hover:scale-[1.02]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ৫. সিএমএস ফ্রেন্ডলি সেকশন */}
        <section className="py-20 bg-blue-50 border-y border-blue-100">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-6 text-slate-800">Compatible with Your Favorite Platform</h2>
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
              Whether you use **WordPress**, **Shopify**, or **Wix**, our server-side tracking architecture integrates seamlessly to deliver the same high-performance results.
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 font-black text-2xl text-slate-400">
              <span>WordPress</span>
              <span>Shopify</span>
              <span>Wix</span>
              <span>Custom Web</span>
            </div>
          </div>
        </section>

        {/* ৬. ইন্টারেক্টিভ FAQ সেকশন */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-4">Common Questions</h2>
              <p className="text-slate-600">Everything you need to know about Server-Side Tracking</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => toggleFAQ(i)}
                    className="w-full flex items-center justify-between p-6 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-lg font-bold text-slate-800">{faq.q}</span>
                    <span className={`text-blue-600 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  
                  <div className={`transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <div className="p-6 bg-white text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ৭. সিটিএ সেকশন */}
        <section className="py-32 relative overflow-hidden bg-blue-900">
           <div className="container mx-auto px-6 relative z-10 text-center">
             <h2 className="text-4xl md:text-6xl font-black text-white mb-8">Ready to Claim 100% Data Accuracy?</h2>
             <p className="text-blue-100 text-xl mb-12 max-w-2xl mx-auto opacity-80">
               Stop letting ad-blockers dictate your marketing performance. Let our experts build your custom tracking infrastructure today.
             </p>
             <div className="flex flex-col md:flex-row justify-center gap-6">
                <Link href="/contact" className="px-10 py-5 bg-white text-blue-900 font-bold rounded-2xl text-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all transform hover:-translate-y-1 text-center">
                  Hire Our Experts
                </Link>
                <Link href="/book-audit" className="px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl text-lg border border-blue-400 hover:bg-blue-500 transition-all transform hover:-translate-y-1 text-center">
                  Free Tracking Audit
                </Link>
             </div>
           </div>
        </section>

      </div>
    
    </>
  );
}