import type { Metadata } from "next";
import { SimplePage } from "@/components/seo/SimplePage";
import { LEGAL_UPDATED, PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/lib/site/legal";

const url = "https://pulsereferrals.com/privacy";
const title = "Privacy Policy | Pulse";
const description =
  "What Pulse collects, how it is used, and exactly what sponsoring sales reps can and cannot see about healthcare professionals.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, siteName: "Pulse", type: "website" },
};

export default function PrivacyPage() {
  return (
    <SimplePage
      h1="Privacy Policy"
      updated={LEGAL_UPDATED}
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
      links={[
        { href: "/terms", label: "Terms of use →" },
        { href: "/contact", label: "Contact →" },
      ]}
    />
  );
}
