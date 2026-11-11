import type { Metadata } from "next";
import { SimplePage } from "@/components/seo/SimplePage";
import { LEGAL_UPDATED, TERMS_INTRO, TERMS_SECTIONS } from "@/lib/site/legal";

const url = "https://pulsereferrals.com/terms";
const title = "Terms of Use | Pulse";
const description =
  "The terms for using Pulse: free for healthcare professionals, $15 per opened CE credit hour for sponsoring sales teams, and what each side is responsible for.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, siteName: "Pulse", type: "website" },
};

export default function TermsPage() {
  return (
    <SimplePage
      h1="Terms of Use"
      updated={LEGAL_UPDATED}
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
      links={[
        { href: "/privacy", label: "Privacy policy →" },
        { href: "/pricing", label: "Pricing →" },
      ]}
    />
  );
}
