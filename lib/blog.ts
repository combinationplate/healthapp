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
  content: string;
};

export type BlogPostWithHtml = BlogPost & {
  html: string;
};

export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllPosts(): BlogPost[] {
  const slugs = getAllSlugs();
  return slugs
    .map((slug) => getPostBySlug(slug))
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b!.date).getTime() - new Date(a!.date).getTime(),
    ) as BlogPost[];
}

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

export async function getPostWithHtml(
  slug: string,
): Promise<BlogPostWithHtml | null> {
  const post = getPostBySlug(slug);
  if (!post) return null;

  const result = await remark()
    .use(remarkGfm)
    .use(html, { sanitize: false as any })
    .process(post.content);

  return {
    ...post,
    html: result.toString(),
  };
}

function estimateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 230));
  return `${minutes} min read`;
}

