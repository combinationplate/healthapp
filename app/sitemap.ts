import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { STATE_REQUIREMENTS, VERIFIED_STATE_SLUGS } from "@/lib/seo/state-requirements";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pulsereferrals.com";
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/free-ce-for-nurses`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/free-ce-for-social-workers`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/free-ce-for-case-managers`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/how-it-works`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/accreditation`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/demand`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/blog`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contact`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/signup`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/login`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];

  const posts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const stateReqs: MetadataRoute.Sitemap = VERIFIED_STATE_SLUGS.map((slug) => ({
    url: `${base}/ce-requirements/${slug}`,
    lastModified: STATE_REQUIREMENTS[slug].lastReviewed ? new Date(STATE_REQUIREMENTS[slug].lastReviewed.slice(0, 10)) : lastModified,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticPages, ...stateReqs, ...posts];
}
