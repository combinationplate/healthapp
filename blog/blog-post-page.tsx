import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostBySlug, getPostWithHtml } from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

/* ── Static generation ───────────────────────────────────────── */

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

/* ── SEO metadata ────────────────────────────────────────────── */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Pulse Blog`,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://pulsereferrals.com/blog/${slug}`,
      siteName: "Pulse",
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      ...(post.image ? { images: [{ url: post.image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `https://pulsereferrals.com/blog/${slug}`,
    },
  };
}

/* ── Page ────────────────────────────────────────────────────── */

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostWithHtml(slug);
  if (!post) notFound();

  // JSON-LD structured data for Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Pulse" },
    publisher: {
      "@type": "Organization",
      name: "Pulse",
      url: "https://pulsereferrals.com",
    },
    mainEntityOfPage: `https://pulsereferrals.com/blog/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--cream, #f6f5f0)",
          color: "var(--ink, #0b1222)",
        }}
      >
        {/* ── Nav ─────────────────────────────────────────── */}
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 0" }}>
          <Link
            href="/blog"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              color: "var(--blue, #2455ff)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← All posts
          </Link>
        </div>

        {/* ── Article header ─────────────────────────────── */}
        <header
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "40px 24px 0",
          }}
        >
          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--teal, #0d9488)",
                  backgroundColor: "rgba(13, 148, 136, 0.08)",
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(32px, 5vw, 44px)",
              fontWeight: 800,
              lineHeight: 1.15,
              margin: "0 0 16px",
            }}
          >
            {post.title}
          </h1>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: "#3b4963",
              margin: "0 0 24px",
            }}
          >
            {post.description}
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              fontSize: 14,
              color: "#7a8ba8",
              paddingBottom: 32,
              borderBottom: "1px solid rgba(11, 18, 34, 0.08)",
            }}
          >
            <span>
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>·</span>
            <span>{post.readTime}</span>
            <span>·</span>
            <span>By {post.author}</span>
          </div>
        </header>

        {/* ── Article body ───────────────────────────────── */}
        <article
          className="blog-content"
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "40px 24px 60px",
          }}
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        {/* ── Bottom CTA ─────────────────────────────────── */}
        <section
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "0 24px 80px",
          }}
        >
          <div
            style={{
              padding: "40px 32px",
              borderRadius: 20,
              backgroundColor: "var(--ink, #0b1222)",
              color: "#fff",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 24,
                fontWeight: 700,
                margin: "0 0 12px",
              }}
            >
              Get free CE courses delivered to your inbox
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.7)",
                maxWidth: 480,
                margin: "0 auto 24px",
                lineHeight: 1.6,
              }}
            >
              Pulse connects healthcare professionals with free, accredited
              continuing education — paid for by the companies that value your
              expertise.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/signup"
                style={{
                  display: "inline-block",
                  backgroundColor: "var(--blue, #2455ff)",
                  color: "#fff",
                  fontWeight: 700,
                  padding: "14px 28px",
                  borderRadius: 10,
                  fontSize: 15,
                  textDecoration: "none",
                }}
              >
                I'm a Healthcare Professional →
              </Link>
              <Link
                href="/signup"
                style={{
                  display: "inline-block",
                  backgroundColor: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontWeight: 700,
                  padding: "14px 28px",
                  borderRadius: 10,
                  fontSize: 15,
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                I'm a BD Rep →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
