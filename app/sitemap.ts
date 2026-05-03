import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.trackflowpro.com',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: 'https://www.trackflowpro.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
     {
      url: 'https://www.trackflowpro.com/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://www.trackflowpro.com/book-audit',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    
    {
      url: 'https://www.trackflowpro.com/services/server-side-tracking',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://www.trackflowpro.com/services/google-ads-expert',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://www.trackflowpro.com/services/facebook-capi',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://www.trackflowpro.com/services/email-signature',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://www.trackflowpro.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.trackflowpro.com/tracking-lab',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },    
   
    {
      url: 'https://www.trackflowpro.com/join-the-team',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://www.trackflowpro.com/privacy-policy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://www.trackflowpro.com/terms-of-service',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]
}