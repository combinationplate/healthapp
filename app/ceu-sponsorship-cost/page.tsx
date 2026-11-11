import type { Metadata } from "next";
import { SponsorshipLanding } from "@/components/seo/SponsorshipLanding";
import { SPONSOR_COST, sponsorMetadata } from "@/lib/seo/sponsorship";

export const revalidate = 3600;
export const metadata: Metadata = sponsorMetadata(SPONSOR_COST);

export default function Page() {
  return <SponsorshipLanding page={SPONSOR_COST} />;
}
