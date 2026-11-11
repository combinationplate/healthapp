import type { Metadata } from "next";
import { SimplePage } from "@/components/seo/SimplePage";
import { ABOUT_INTRO, ABOUT_SECTIONS } from "@/lib/site/legal";

const url = "https://pulsereferrals.com/about";
const title = "About Pulse — Sponsored CE for Healthcare Professionals";
const description =
  "Pulse gives nurses, social workers, case managers and therapists free accredited CE, paid for by the hospice, home health and senior care teams who work with them.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, siteName: "Pulse", type: "website" },
};

export default function AboutPage() {
  return (
    <SimplePage
      h1="About Pulse"
      intro={ABOUT_INTRO}
      sections={ABOUT_SECTIONS}
      links={[
        { href: "/signup?type=hcp", label: "Get free CE →" },
        { href: "/for-sales-teams", label: "Pulse for sales teams →" },
        { href: "/accreditation", label: "Accreditation →" },
      ]}
    />
  );
}
