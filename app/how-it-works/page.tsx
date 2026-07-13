import HowItWorksPage from "@/src/components/landing/HowItWorksPage";

export const metadata = {
  title: "How It Works — Pulse",
  description:
    "Learn how Pulse connects healthcare professionals who need CE credits with hospice, home health, and rehab sales teams who can provide them — for free.",
  alternates: { canonical: "https://pulsereferrals.com/how-it-works" },
  openGraph: {
    title: "How It Works — Pulse",
    description: "How Pulse connects healthcare professionals who need CE with sales teams who sponsor it — for free.",
    url: "https://pulsereferrals.com/how-it-works",
    siteName: "Pulse",
    type: "website",
  },
};

export default function Page() {
  return <HowItWorksPage />;
}
