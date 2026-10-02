import type { Metadata } from "next";
import { getCoursesForProfessions } from "@/lib/seo/courses";
import { HUB, IN_SERVICE_PROFESSIONS } from "@/lib/seo/in-service";
import { InServiceLanding } from "@/components/seo/InServiceLanding";

export const revalidate = 3600;
const url = `https://pulsereferrals.com/${HUB.slug}`;

export const metadata: Metadata = {
  title: HUB.title,
  description: HUB.description,
  alternates: { canonical: url },
  openGraph: { title: HUB.title, description: HUB.description, url, siteName: "Pulse", type: "website" },
  twitter: { card: "summary_large_image", title: HUB.title, description: HUB.description },
};

export default async function Page() {
  const courses = await getCoursesForProfessions(IN_SERVICE_PROFESSIONS);
  return (
    <InServiceLanding
      slug={null}
      h1={HUB.h1}
      subhead={HUB.subhead}
      intro={HUB.intro}
      categories={HUB.categories}
      faqs={HUB.faqs}
      courses={courses}
    />
  );
}
