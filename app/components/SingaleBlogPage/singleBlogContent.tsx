import React from 'react'
import { BlogPost } from '../BlogMainPage/blogData';


interface SingleBlogContentProps {
  post: BlogPost;
}

export default function SingleBlogContent({ post }: SingleBlogContentProps) {
  return (
    <section className="py-16 bg-white dark:bg-slate-950">
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
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center text-xs font-bold mt-1">
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

        </div>
      </div>
    </section>
  )
}