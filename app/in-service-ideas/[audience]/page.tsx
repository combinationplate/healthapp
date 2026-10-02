import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCoursesForProfessions } from "@/lib/seo/courses";
import { AUDIENCES, HUB, IN_SERVICE_PROFESSIONS, getAudience } from "@/lib/seo/in-service";
import { InServiceLanding } from "@/components/seo/InServiceLanding";

type Props = { params: Promise<{ audience: string }> };

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return AUDIENCES.map((a) => ({ audience: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { audience } = await params;
  const a = getAudience(audience);
  if (!a) return { title: "Not Found" };
  const url = `https://pulsereferrals.com/${HUB.slug}/${a.slug}`;
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: url },
    openGraph: { title: a.title, description: a.description, url, siteName: "Pulse", type: "website" },
    twitter: { card: "summary_large_image", title: a.title, description: a.description },
  };
}

export default async function Page({ params }: Props) {
  const { audience } = await params;
  const a = getAudience(audience);
  if (!a) notFound();
  const courses = await getCoursesForProfessions(IN_SERVICE_PROFESSIONS);
  return (
    <InServiceLanding
      slug={a.slug}
      h1={a.h1}
      subhead={a.subhead}
      intro={a.intro}
      topicsHeading={a.topicsHeading}
      topics={a.topics}
      tip={a.tip}
      faqs={a.faqs}
      courses={courses}
    />
  );
}
