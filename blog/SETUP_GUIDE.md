# Pulse Blog — Setup Guide
## Exact steps to implement in Cursor

---

## STEP 1: Install packages

Run in your project root terminal:

```bash
npm install gray-matter remark remark-html remark-gfm
```

If using TypeScript (you are), also:

```bash
npm install -D @types/remark-html
```

> gray-matter = parses frontmatter from markdown
> remark + remark-html = converts markdown to HTML on the server
> remark-gfm = GitHub Flavored Markdown (tables, strikethrough, etc.)

---

## STEP 2: Create files (in this exact order)

### File 1: `content/blog/free-ce-courses-nurses-2026.md`

Create directory: `content/blog/` at your PROJECT ROOT (same level as `app/`, `lib/`, `src/`)

Copy the markdown file provided.

### File 2: `lib/blog.ts`

This goes in your existing `lib/` directory at project root.
@/lib/blog will resolve correctly since @/* → project root.

Copy the file provided.

### File 3: `app/blog/page.tsx`

Create directory: `app/blog/`
Copy the file provided.

### File 4: `app/blog/[slug]/page.tsx`

Create directory: `app/blog/[slug]/`
Copy the file provided.

### File 5: Blog styles → append to globals.css

Open your existing `globals.css` (likely at `app/globals.css` or root).
Scroll to the BOTTOM of the file.
Paste the entire `.blog-content` style block.

DO NOT replace existing content — APPEND to end of file.

---

## STEP 3: Update sitemap

Open `app/sitemap.ts`.

1. Add import at top:
   ```typescript
   import { getAllPosts } from "@/lib/blog";
   ```

2. Add blog URLs to the returned array (see SITEMAP_UPDATE.ts for the exact entries).

---

## STEP 4: Add blog link to navigation

Wherever your nav/header component is (check `src/components/` or `components/`),
add a link to `/blog`.

This is likely in one of:
- `src/components/landing/Header.tsx` or `Nav.tsx`
- `components/landing/Header.tsx` or `Nav.tsx`
- Your root layout header

Just add:
```tsx
<Link href="/blog">Blog</Link>
```

alongside your existing nav links (How It Works, Accreditation, etc.)

---

## STEP 5: Test locally

```bash
npm run dev
```

Visit:
- http://localhost:3000/blog — should show listing with 1 post
- http://localhost:3000/blog/free-ce-courses-nurses-2026 — full post

Check:
- ✅ Fraunces headings render correctly
- ✅ Table displays properly (the accreditation table)
- ✅ Links to /accreditation and /signup work
- ✅ Bottom CTA buttons work
- ✅ Mobile layout looks good (resize browser)

---

## STEP 6: Deploy

```bash
git add .
git commit -m "feat: blog infrastructure + first SEO post"
git push
```

Vercel auto-deploys. Check https://pulsereferrals.com/blog after deploy.

---

## STEP 7: Submit to Google (same day as deploy)

1. Go to Google Search Console (you already have it set up)
2. In the URL Inspection tool, enter: https://pulsereferrals.com/blog/free-ce-courses-nurses-2026
3. Click "Request Indexing"
4. Also submit: https://pulsereferrals.com/blog
5. Check that your sitemap is still live: https://pulsereferrals.com/sitemap.xml
   - It should now include the /blog and /blog/free-ce-courses-nurses-2026 URLs

---

## FILE STRUCTURE AFTER SETUP

```
project-root/
├── app/
│   ├── blog/
│   │   ├── page.tsx              ← Blog listing
│   │   └── [slug]/
│   │       └── page.tsx          ← Individual post
│   ├── sitemap.ts                ← Updated with blog URLs
│   └── globals.css               ← Updated with .blog-content styles
├── content/
│   └── blog/
│       └── free-ce-courses-nurses-2026.md
├── lib/
│   └── blog.ts                   ← Blog utility functions
└── ...
```

---

## ADDING FUTURE POSTS

To publish a new post:

1. Create a new `.md` file in `content/blog/`
   - Filename becomes the URL slug (e.g., `my-post.md` → `/blog/my-post`)
2. Add frontmatter at top:
   ```markdown
   ---
   title: "Your Post Title"
   description: "One-sentence summary for SEO."
   date: "2026-04-01"
   author: "Pulse Team"
   tags: ["Continuing Education", "Social Work"]
   ---
   ```
3. Write your content in markdown below the frontmatter
4. Commit and push — it's live

No code changes needed for new posts. Just add a markdown file.

---

## SUGGESTED NEXT POSTS (priority order)

1. "CE Requirements by State for Nurses, Social Workers & Case Managers"
   → Target: "CE requirements by state", "nursing CE hours by state"
   → Heavy table content, link to /accreditation

2. "Free Continuing Education for Social Workers — ASWB Approved"
   → Target: "free CEU social workers", "free ASWB CE"
   → Same structure as the nursing post but for SWs

3. "How Hospice BD Reps Use Free CEs to Build Referral Relationships"
   → Target: "hospice business development strategies"
   → This one targets REPS, not professionals

4. "ANCC Accredited CE — What Nurses Need to Know"
   → Target: "ANCC accredited CE", "ANCC approved continuing education"

Write one per month. Use Claude to draft, you edit for 15 min, publish.
