"use client"
import { Mail, MapPin, Send, Loader2 } from 'lucide-react'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BsLinkedin } from 'react-icons/bs'
import Link from 'next/link'
import Turnstile from 'react-turnstile' 

const MotionLink = motion(Link);

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  
  const trackSubscription = async (emailAddress: string) => {
    try {
      const gaCookie = typeof document !== 'undefined' ? document.cookie.match(/_ga=(?:GA1\.\d\.)?([\d.]+)/)?.[1] : null;
      const sessionId = typeof document !== 'undefined' ? document.cookie.match(/_ga_Y0XEPCVC6L=GS1\.1\.([\d]+)/)?.[1] : null;

      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: "generate_lead",
          email: emailAddress,
          service: "Newsletter",
          clientId: gaCookie || "anonymous",
          sessionId: sessionId || "none",
          pageTitle: "Footer Newsletter"
        }),
      });
    } catch (err) {
      console.error("GA4 Footer Track Error:", err);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      alert("Please complete the security check!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          captchaToken: turnstileToken 
        }),
      });

      if (response.ok) {
        await trackSubscription(email);
        alert("Success! You're now subscribed to TrackFlow Pro updates.");
        setEmail("");
        setTurnstileToken(null);
      } else {
        alert("Subscription failed. Please check the email and try again.");
      }
    } catch (error) {
      console.error("Subscription Error:", error);
      alert("Something went wrong! Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer className="bg-slate-950 text-slate-400 pt-24 pb-12">
      <div className="container mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-black text-xl">T</span>
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">
                TrackFlow<span className="text-blue-600">Pro</span>
              </span>
            </div>
            <p className="text-base leading-relaxed max-w-xs">
              Advanced GTM Server-Side Tracking and Google Ads optimization for modern agencies.
            </p>
            <div className="flex gap-4">
              {[
                { icon: <BsLinkedin />, link: "https://www.linkedin.com/in/shahjalal-khan/" },
              ].map((social, i) => (
                <MotionLink
                  key={i}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -5, color: '#2563eb' }}
                  href={social.link} 
                  className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 transition-all hover:border-blue-500/50"
                >
                  {social.icon}
                </MotionLink>
              ))}
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="lg:col-span-4 lg:px-6">
            <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-6">Weekly Insights</h4>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Join 500+ marketers. Get GA4 setup tips and tracking hacks directly in your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="relative group space-y-4">
              <div className="relative">
                <input 
                  type="email" 
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-slate-600 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/20 disabled:bg-slate-700"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>

              <div className="flex justify-start overflow-hidden rounded-lg">
                <Turnstile
                  sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} 
                  onVerify={(token) => setTurnstileToken(token)}
                  theme="dark"
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </div>
            </form>
            <p className="text-[10px] text-slate-600 mt-4 italic font-medium uppercase tracking-widest">
              * Secure & Private. No Spam.
            </p>
          </div>

          {/* Contact Info Column */}
          <div className="lg:col-span-4 space-y-8">
            <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-6">Contact</h4>
            <ul className="space-y-5">
              <li className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Email Us</p>
                  <a href="mailto:shahjalal@trackflowpro.com" className="text-sm font-bold text-white hover:text-blue-500 transition-colors">
                    shahjalal@trackflowpro.com
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Location</p>
                  <p className="text-sm font-bold text-white">Kushtia, Bangladesh</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-slate-600 tracking-widest uppercase">
            Data Quality is our Priority.
          </p>
          <div className="flex flex-col items-center md:items-end gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-black">
            <p>© {new Date().getFullYear()} TrackFlow Pro. All Rights Reserved.</p>
            <div className="flex gap-6 opacity-60">
              <Link href="/privacy-policy" className="hover:text-blue-500">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-blue-500">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}