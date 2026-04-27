"use client"
import React, { useEffect, useState } from 'react'
import { BlogPost } from '../BlogMainPage/blogData';
import { FaFacebookF, FaLinkedinIn, FaTwitter, FaLink, FaCheck } from 'react-icons/fa';

interface SingleBlogContentProps {
  post: BlogPost;
}

export default function SingleBlogContent({ post }: SingleBlogContentProps) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    { 
      name: 'Facebook', 
      icon: <FaFacebookF />, 
      url: `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`,
      color: 'hover:bg-[#1877F2]' 
    },
    { 
      name: 'LinkedIn', 
      icon: <FaLinkedinIn />, 
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`,
      color: 'hover:bg-[#0A66C2]' 
    },
    { 
      name: 'Twitter', 
      icon: <FaTwitter />, 
      url: `https://twitter.com/intent/tweet?url=${currentUrl}&text=${post.title}`,
      color: 'hover:bg-[#1DA1F2]' 
    },
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-950 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          
          
          

          {/* Loop through each content block */}
          <div className="space-y-10">
            {post.content.map((block, index) => {
              switch (block.type) {
                case 'heading':
                  return (
                    <h2 key={index} className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-16">
                      {block.text}
                    </h2>
                  );
                case 'paragraph':
                  return (
                    <p key={index} className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {block.text}
                    </p>
                  );
                case 'image':
                  return (
                    <div key={index} className="my-12">
                      <div className="rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800">
                        <img src={block.url} alt={block.caption || "Blog Image"} className="w-full h-auto" />
                      </div>
                      {block.caption && (
                        <p className="text-center text-sm mt-4 text-slate-400 italic font-medium">
                          — {block.caption}
                        </p>
                      )}
                    </div>
                  );
                case 'list':
                  return (
                    <ul key={index} className="space-y-4 my-8">
                      {block.items?.map((item, i) => (
                        <li key={i} className="flex items-start gap-4 text-lg text-slate-600 dark:text-slate-400">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center text-[10px] font-black mt-1">
                            {i + 1}
                          </span>
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  );
                case 'code':
                  return (
                    <div key={index} className="my-8 p-6 bg-slate-900 rounded-3xl overflow-x-auto border border-slate-800 shadow-inner">
                      <pre className="text-blue-400 font-mono text-sm leading-relaxed">
                        <code>{block.text}</code>
                      </pre>
                      {block.language && (
                        <div className="mt-4 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                          Language: {block.language}
                        </div>
                      )}
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </div>

          {/* Bottom Share Section - Encouragement */}
          <div className="mt-20 p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
             <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Did you find this helpful?</h3>
             <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Share this guide with your network to help others optimize their tracking!</p>
             <div className="flex justify-center gap-3">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    className="px-6 py-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all hover:scale-105 active:scale-95"
                  >
                    {link.icon} {link.name}
                  </a>
                ))}
             </div>
          </div>

        </div>
      </div>
    </section>
  )
}