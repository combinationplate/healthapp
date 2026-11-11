import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SponsorshipLanding } from "@/components/seo/SponsorshipLanding";
import { SPONSOR_INDUSTRIES, getSponsorIndustry, sponsorMetadata } from "@/lib/seo/sponsorship";

type Props = { params: Promise<{ industry: string }> };

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return SPONSOR_INDUSTRIES.map((i) => ({ industry: i.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry } = await params;
  const page = getSponsorIndustry(industry);
  if (!page) return { title: "Not Found" };
  return sponsorMetadata(page);
}

export default async function Page({ params }: Props) {
  const { industry } = await params;
  const page = getSponsorIndustry(industry);
  if (!page) notFound();
  return <SponsorshipLanding page={page} />;
}
