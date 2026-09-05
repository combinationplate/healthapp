import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getLiveDisciplines, getPublishableRequirements } from "@/lib/ce-requirements";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pulsereferrals.com";
  // Fixed date for static pages — bump manually when a static page meaningfully changes.
  const lastModified = new Date("2026-08-07");
  // 2026-09-05: pricing-clarity pass (homepage, how-it-works) + new /pricing and /for-sales-teams.
  const pricingPass = new Date("2026-09-05");

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: pricingPass, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/free-ce-for-nurses`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/free-ce-for-social-workers`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/free-ce-for-case-managers`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/free-ce-for-therapists`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/for-sales-teams`, lastModified: pricingPass, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/pricing`, lastModified: pricingPass, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/how-it-works`, lastModified: pricingPass, changeFrequency: "monthly", priority: 0.8 },
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
  // filters lastVerified: null, matching page generation). Hub lastmod = newest
  // verification date in that discipline.
  const freeCe: MetadataRoute.Sitemap = getLiveDisciplines().flatMap((discipline) => {
    const states = getPublishableRequirements(discipline);
    const newest = states.reduce(
      (max, r) => (r.lastVerified && r.lastVerified > max ? r.lastVerified : max),
      "2026-07-30"
    );
    return [
      {
        url: `${base}/free-ce/${discipline}`,
        lastModified: new Date(newest),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      ...states.map((r) => ({
        url: `${base}/free-ce/${discipline}/${r.slug}`,
        lastModified: r.lastVerified ? new Date(r.lastVerified) : lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  });

  return [...staticPages, ...freeCe, ...posts];
}
