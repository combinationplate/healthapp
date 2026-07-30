import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getLiveDisciplines, getPublishableRequirements } from "@/lib/ce-requirements";

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

  // /free-ce/[discipline]/[state] — verified states only (getPublishableRequirements
  // filters out entries with lastVerified: null, matching page generation).
  const freeCe: MetadataRoute.Sitemap = getLiveDisciplines().flatMap((discipline) => [
    {
      url: `${base}/free-ce/${discipline}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...getPublishableRequirements(discipline).map((r) => ({
      url: `${base}/free-ce/${discipline}/${r.slug}`,
      lastModified: r.lastVerified ? new Date(r.lastVerified) : lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]);

  return [...staticPages, ...freeCe, ...posts];
}
