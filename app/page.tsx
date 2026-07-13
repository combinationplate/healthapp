import type { Metadata } from "next";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import DemandBanner from "@/components/landing/DemandBanner";
import Toolkit from "@/components/landing/Toolkit";
import Distribution from "@/components/landing/Distribution";
import ProblemSolution from "@/components/landing/ProblemSolution";
import StatsBanner from "@/components/landing/StatsBanner";
import HCPSection from "@/components/landing/HCPSection";
import { AccreditationStrip } from "@/src/components/AccreditationStrip";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import DisciplineLinks from "@/components/landing/DisciplineLinks";
export const metadata: Metadata = {
  title: "Free CE for Nurses, Social Workers & Case Managers | Pulse",
  description:
    "Free, nationally accredited CE for nurses, social workers, and case managers — no credit card, all 50 states. Sponsored by local hospice, home health, and rehab teams.",
  alternates: { canonical: "https://pulsereferrals.com" },
  openGraph: {
    title: "Free CE for Nurses, Social Workers & Case Managers | Pulse",
    description:
      "Free, nationally accredited CE for healthcare professionals, sponsored by local sales teams.",
    url: "https://pulsereferrals.com",
    siteName: "Pulse",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <DemandBanner />
        <Toolkit />
        <Distribution />
        <ProblemSolution />
        <StatsBanner />
        <HCPSection />
        <DisciplineLinks />
        <AccreditationStrip />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
