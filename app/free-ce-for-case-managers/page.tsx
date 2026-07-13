import type { Metadata } from "next";
import { LANDINGS } from "@/lib/seo/landing";
import { getCoursesForProfessions } from "@/lib/seo/courses";
import { DisciplineLanding } from "@/components/seo/DisciplineLanding";

export const revalidate = 3600;
const cfg = LANDINGS["case-managers"];

export const metadata: Metadata = {
  title: cfg.title,
  description: cfg.description,
  alternates: { canonical: `https://pulsereferrals.com/${cfg.slug}` },
  openGraph: {
    title: cfg.title,
    description: cfg.description,
    url: `https://pulsereferrals.com/${cfg.slug}`,
    siteName: "Pulse",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: cfg.title, description: cfg.description },
};

export default async function Page() {
  const courses = await getCoursesForProfessions(cfg.professions);
  return <DisciplineLanding config={cfg} courses={courses} />;
}
