import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readTime: string;
  image?: string;
  content: string; // raw markdown
};

export type BlogPostWithHtml = BlogPost & {
  html: string;
};

/**
 * Get all blog post slugs (for generateStaticParams)
 */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/**
 * Get all posts sorted by date (newest first)
 */
export function getAllPosts(): BlogPost[] {
  const slugs = getAllSlugs();
  return slugs
    .map((slug) => getPostBySlug(slug))
    .filter(Boolean)
    .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime()) as BlogPost[];
}

/**
 * Get a single post by slug (without HTML — for listing pages)
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    date: data.date || new Date().toISOString(),
    author: data.author || "Pulse Team",
    tags: data.tags || [],
    readTime: data.readTime || estimateReadTime(content),
    image: data.image || undefined,
    content,
  };
}

/**
 * Get a single post with rendered HTML (for post pages)
 */
export async function getPostWithHtml(slug: string): Promise<BlogPostWithHtml | null> {
  const post = getPostBySlug(slug);
  if (!post) return null;

  const result = await remark().use(remarkGfm).use(html, { sanitize: false }).process(post.content);

  return {
    ...post,
    html: result.toString(),
  };
}

/**
 * Estimate read time from content
 */
function estimateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 230));
  return `${minutes} min read`;
}
