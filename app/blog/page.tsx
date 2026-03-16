import { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | Pulse — Free CE Distribution for Healthcare Teams",
  description:
    "Insights on continuing education, healthcare referral strategies, and how BD reps are using free CE courses to build stronger professional relationships.",
  openGraph: {
    title: "Blog | Pulse",
    description:
      "Insights on continuing education, healthcare referral strategies, and free CE distribution.",
    url: "https://pulsereferrals.com/blog",
    siteName: "Pulse",
    type: "website",
  },
  alternates: {
    canonical: "https://pulsereferrals.com/blog",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--cream, #f6f5f0)",
        color: "var(--ink, #0b1222)",
      }}
    >
      <section
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "80px 24px 40px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            color: "var(--blue, #2455ff)",
            textDecoration: "none",
            fontWeight: 600,
            marginBottom: 32,
          }}
        >
          ← Back to Pulse
        </Link>

        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(36px, 5vw, 48px)",
            fontWeight: 800,
            lineHeight: 1.1,
            margin: "0 0 16px",
            color: "var(--ink, #0b1222)",
          }}
        >
          The Pulse Blog
        </h1>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: "#3b4963",
            maxWidth: 560,
            margin: 0,
          }}
        >
          CE requirements, referral strategies, and how healthcare teams are
          using free continuing education to build stronger relationships.
        </p>
      </section>

      <section
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        {posts.length === 0 ? (
          <p style={{ color: "#7a8ba8", fontSize: 16 }}>
            Posts coming soon — check back shortly.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {posts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <article
                  className="blog-card"
                  style={{
                    padding: "32px",
                    borderRadius: 16,
                    backgroundColor: "#fff",
                    border: "1px solid rgba(11, 18, 34, 0.06)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
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

                  <h2
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: i === 0 ? 28 : 22,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      margin: "0 0 8px",
                    }}
                  >
                    {post.title}
                  </h2>

                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: "#3b4963",
                      margin: "0 0 16px",
                    }}
                  >
                    {post.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: 13,
                      color: "#7a8ba8",
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
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "0 24px 80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            padding: "40px 32px",
            borderRadius: 20,
            backgroundColor: "var(--ink, #0b1222)",
            color: "#fff",
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
            Need free CE courses?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.7)",
              maxWidth: 440,
              margin: "0 auto 24px",
              lineHeight: 1.6,
            }}
          >
            Nurses, social workers, and case managers can access accredited
            continuing education at no cost through Pulse.
          </p>
          <Link
            href="/signup"
            style={{
              display: "inline-block",
              backgroundColor: "var(--blue, #2455ff)",
              color: "#fff",
              fontWeight: 700,
              padding: "14px 32px",
              borderRadius: 10,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            Get Free CEs →
          </Link>
        </div>
      </section>
    </main>
  );
}

