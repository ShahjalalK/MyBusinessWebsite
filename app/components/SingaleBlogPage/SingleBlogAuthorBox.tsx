import React from 'react'
import { FaLinkedinIn, FaTwitter, FaGlobe } from 'react-icons/fa'
import { BlogPost } from '../BlogMainPage/blogData';
import Image from 'next/image';
import Link from 'next/link';


interface AuthorBoxProps {
  post: BlogPost;
}

export default function SingleBlogAuthorBox({ post }: AuthorBoxProps) {
  return (
    <div className="max-w-4xl mx-auto mt-10 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 gap-8">
        
        {/* Author Info Left */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-600 p-1">
               {/* এখানে আপনার নিজের ছবি দিন */}
              <Image 
                src="/team/ceo.jpg" 
                alt="Shahjalal Jalal" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-blue-600 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white">Shahjalal Jalal</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Google Ads & Server-side Tracking Expert</p>
          </div>
        </div>

        {/* Post Meta & Social Right */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Published on <span className="text-slate-900 dark:text-blue-400">{post.date}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="https://www.linkedin.com/in/shahjalal-khan/" target="_blank" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
              <FaLinkedinIn size={14} />
            </Link>
            {/* <a href="#" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-400 hover:text-white transition-all shadow-sm">
              <FaTwitter size={14} />
            </a> */}
            <Link href="www.trackflowpro.com/about" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
              <FaGlobe size={14} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}