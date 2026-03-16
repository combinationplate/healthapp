// ═══════════════════════════════════════════════════════════════
// SITEMAP UPDATE
// 
// Your existing sitemap is at: app/sitemap.ts
// Add the blog post URLs to it. Here's what to add:
// ═══════════════════════════════════════════════════════════════

// At the top of app/sitemap.ts, add this import:
import { getAllPosts } from "@/lib/blog";

// Then inside your sitemap function, add the blog URLs.
// Your existing sitemap probably returns an array of objects.
// Add these entries to that array:

// --- Add this block alongside your existing URLs ---

// Blog listing page
{
  url: "https://pulsereferrals.com/blog",
  lastModified: new Date(),
  changeFrequency: "weekly" as const,
  priority: 0.7,
},

// Individual blog posts (dynamic)
...getAllPosts().map((post) => ({
  url: `https://pulsereferrals.com/blog/${post.slug}`,
  lastModified: new Date(post.date),
  changeFrequency: "monthly" as const,
  priority: 0.8,
})),
