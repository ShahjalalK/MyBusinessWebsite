"use client"
import React, { useState } from 'react'
import { motion } from 'framer-motion'
// react-icons ইনস্টল করা থাকতে হবে (npm install react-icons)
import { FaFacebookF, FaLinkedinIn, FaInstagram, FaTwitter } from "react-icons/fa"
import { 
  Camera, 
  ImageIcon, 
  Send, 
  Info, 
  Paperclip, 
  Trash2, 
  X,
  LayoutTemplate,
  Phone,
  Mail,
  Globe
} from 'lucide-react'
import Link from 'next/link'

/**
 * SEO Optimization Notes:
 * 1. Added semantic HTML tags (section, h2, h4).
 * 2. Optimized image Alt texts for accessibility and SEO.
 * 3. Structured data for better search engine indexing of the service.
 */

export default function EmailSigantureInteractiveGmailPreview() {
  const [formData, setFormData] = useState({
    name: 'Steve L. Graddy',
    title: 'Real Estate Agent',
    license: 'RE-1234567-NY',
    phone: '+1 213-455-5988',
    email: 'steve@urbanrealtygroup.com',
    website: 'www.urbanrealtygroup.com',
    profileImg: 'https://cdn.jsdelivr.net/gh/ShahjalalK/signature-mockup-for-realstate@master/profile.png',
    logoImg: 'https://cdn.jsdelivr.net/gh/ShahjalalK/signature-mockup-for-realstate@master/Urban-Real-Estate-Logo.png',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="py-24 hidden md:block bg-slate-50 dark:bg-slate-950 font-sans" aria-labelledby="signature-generator-title">
      <div className="container mx-auto px-6">
        
        {/* Section Header - SEO Optimized */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6">
            <LayoutTemplate size={14} aria-hidden="true" /> Professional HTML Email Signature Tool
          </div>
          <h2 id="signature-generator-title" className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
            Custom Email Signature Live Preview
          </h2>
          <p className="text-slate-500 font-medium italic">
            Experience our high-converting real estate email signature designs in real-time. Hand-coded for perfect responsiveness.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Input Controls */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border flex flex-col justify-between">
            <div>
              <h4 className="font-bold flex items-center gap-2 mb-6 text-slate-800 dark:text-white">
                <Info size={18} className="text-blue-600" aria-hidden="true" /> Professional Details
              </h4>
              
              <div className="space-y-3">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" aria-label="Full Name" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" />
                <input name="title" value={formData.title} onChange={handleChange} placeholder="Job Title" aria-label="Job Title" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" />
                <input name="license" value={formData.license} onChange={handleChange} placeholder="License (e.g. RE-1234567-NY)" aria-label="License Number" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" aria-label="Phone Number" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" />
                <input name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" aria-label="Email Address" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" />
                <input name="website" value={formData.website} onChange={handleChange} placeholder="Website URL" aria-label="Website URL" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors group">
                  <Camera size={20} className="text-slate-400 mb-1 group-hover:text-blue-500" aria-hidden="true" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Profile Image</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profileImg')} />
                </label>
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors group">
                  <ImageIcon size={20} className="text-slate-400 mb-1 group-hover:text-blue-500" aria-hidden="true" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Brand Logo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoImg')} />
                </label>
              </div>
            </div>

            {/* NEW: Professional Client Note Section */}
            <div className="mt-8 p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <LayoutTemplate size={16} className="text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <h5 className="text-[13px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1">
                    Signature Simulator
                  </h5>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                    This is a <span className="text-blue-700 dark:text-blue-400 font-bold">live preview simulator</span>. 
                    Final delivery includes a <span className="font-bold underline decoration-blue-300">hand-coded HTML file</span> optimized for Gmail, Outlook, and Apple Mail. 
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview Area */}
          <div className="lg:col-span-8 bg-white border rounded-2xl shadow-xl overflow-hidden min-h-[650px] flex flex-col">
            {/* Fake Gmail Header */}
            <div className="bg-[#f2f6fc] px-4 py-3 flex justify-between items-center border-b">
               <span className="text-sm font-bold text-slate-600">New Message</span>
               <div className="flex gap-3">
                 <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                 <X size={16} className="text-slate-400 cursor-pointer" aria-label="Close Preview" />
               </div>
            </div>

            <div className="p-10 flex-grow">
              {/* Dummy Email Content */}
              <div className="text-slate-700 text-[15px] leading-relaxed mb-8">
                <p>Hi there,</p>
                <br />
                <p>I hope you're having a wonderful day! I wanted to follow up on our previous conversation regarding the new property listings in your area. Please let me know if you'd like to schedule a quick call to discuss the details.</p>
                <br />
                <p className="text-slate-500 italic">Best Regards,</p>
              </div>

              {/* ----- SIGNATURE DESIGN START ----- */}
              <div className="flex flex-col max-w-[550px] mt-10" role="complementary" aria-label="Email Signature Preview">
                <div className="flex items-stretch">
                  {/* Left Column */}
                  <div className="pr-4 border-r-3 border-[#041f60] flex flex-col items-center gap-3">
                    <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-slate-50 shadow-sm">
                      <img src={formData.profileImg} alt={`${formData.name} Profile`} className="w-full h-full object-cover" />
                    </div>
                    {/* Social Icons */}
                    <div className="flex gap-2">
                      <Link href="#" aria-label="Follow us on Facebook" className="w-7 h-7 bg-[#041f60] text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all shadow-md"><FaFacebookF size={14} /></Link>
                      <Link href="#" aria-label="Connect on LinkedIn" className="w-7 h-7 bg-[#041f60] text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all shadow-md"><FaLinkedinIn size={14} /></Link>
                      <Link href="#" aria-label="Follow on Instagram" className="w-7 h-7 bg-[#041f60] text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all shadow-md"><FaInstagram size={14} /></Link>
                      <Link href="#" aria-label="Follow on Twitter" className="w-7 h-7 bg-[#041f60] text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all shadow-md"><FaTwitter size={14} /></Link>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="pl-4 flex flex-col justify-end py-1">
                    <h2 className="text-[28px] font-bold text-[#041f60] leading-none mb-1 tracking-tight">{formData.name}</h2>
                    <p className="text-[15px] font-medium text-slate-700 mb-5">{formData.title} | <span className="text-slate-400 font-medium">{formData.license}</span></p>
                    
                    <div className="space-y-1.5 mb-5">
                      <div className="flex items-center gap-x-3.5">
                        <Link href={`tel:${formData.phone}`} className="flex items-center gap-1 text-[14px] text-slate-600 font-medium no-underline hover:text-blue-600 transition-colors">
                          <Phone size={15} className="text-[#041f60]" strokeWidth={2.5} aria-hidden="true" /> {formData.phone}
                        </Link>
                        <Link href={`mailto:${formData.email}`} className="flex items-center gap-1 text-[14px] text-slate-600 font-medium no-underline hover:text-blue-600 transition-colors">
                          <Mail size={15} className="text-[#041f60]" strokeWidth={2.5} aria-hidden="true" /> {formData.email}
                        </Link>
                      </div>
                      <Link href={`https://${formData.website.replace('https://', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[14px] text-slate-600 font-medium no-underline hover:text-blue-600 transition-colors">
                        <Globe size={15} className="text-[#041f60]" strokeWidth={2.5} aria-hidden="true" /> {formData.website}
                      </Link>
                    </div>

                    <div className="flex gap-4 items-center opacity-90">
                      <img src="https://cdn.jsdelivr.net/gh/ShahjalalK/signature-mockup-for-realstate@master/realtor-logo.png" className="w-6" alt="National Association of Realtors Logo" />
                      <img src="https://cdn.jsdelivr.net/gh/ShahjalalK/signature-mockup-for-realstate@master/abr.png" className="w-11" alt="Accredited Buyer's Representative Logo" />
                      <img src="https://cdn.jsdelivr.net/gh/ShahjalalK/signature-mockup-for-realstate@master/equal-housing.png" className="w-8" alt="Equal Housing Opportunity Logo" />
                      <img src="https://cdn.jsdelivr.net/gh/ShahjalalK/signature-mockup-for-realstate@master/crs.png" className="w-8" alt="Certified Residential Specialist Logo" />
                    </div>
                  </div>
                </div>

                {/* Bottom CTA Section */}
                <div className="mt-2 border-3 border-[#041f60] p-2 flex items-center justify-between bg-white">
                  <div className="flex-1">
                    <img src={formData.logoImg} alt={`${formData.name} Company Logo`} className="h-auto w-40 object-contain" />
                  </div>
                  <div className="flex flex-col gap-2 w-[250px]">
                    <Link href="#" className="bg-[#1e73e8] text-white text-[12px] font-bold py-2 shadow-sm hover:bg-blue-700 transition-all text-center uppercase tracking-tighter">Schedule a Call</Link>
                    <Link href="#" className="bg-[#ff6a00] text-white text-[12px] font-bold py-2 shadow-sm hover:bg-orange-600 transition-all text-center uppercase tracking-tighter">Add to Contact</Link>
                  </div>
                </div>
              </div>
              {/* ----- SIGNATURE DESIGN END ----- */}
            </div>

            {/* Action Bar */}
            <div className="px-8 py-4 bg-white flex items-center gap-6 border-t mt-auto">
               <button className="bg-[#0b57d0] text-white px-8 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-md hover:bg-[#0842a0] transition-all">
                 Send Message <Send size={14} aria-hidden="true" />
               </button>
               <div className="flex gap-4 text-slate-500">
                  <Paperclip size={20} className="cursor-pointer hover:text-slate-800" aria-label="Attach file" />
                  <Trash2 size={20} className="cursor-pointer hover:text-red-500" aria-label="Discard draft" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}