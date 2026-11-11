import type { Metadata } from "next";
import { SponsorshipLanding } from "@/components/seo/SponsorshipLanding";
import { SPONSOR_HUB, sponsorMetadata } from "@/lib/seo/sponsorship";

export const revalidate = 3600;
export const metadata: Metadata = sponsorMetadata(SPONSOR_HUB);

export default function Page() {
  return <SponsorshipLanding page={SPONSOR_HUB} />;
}
