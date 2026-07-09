import type { MetadataRoute } from "next";

const siteUrl = "https://trackflowpro.com";

const routes = [
  {
    path: "/",
    priority: 1,
    changeFrequency: "weekly" as const,
  },
  {
    path: "/services",
    priority: 0.9,
    changeFrequency: "weekly" as const,
  },
  {
    path: "/services/google-ads-conversion-tracking",
    priority: 0.9,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/services/server-side-tracking",
    priority: 0.85,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/services/ga4-gtm-audit",
    priority: 0.85,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/services/meta-capi",
    priority: 0.8,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/about",
    priority: 0.7,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/contact",
    priority: 0.7,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/free-tracking-audit",
    priority: 0.9,
    changeFrequency: "weekly" as const,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
