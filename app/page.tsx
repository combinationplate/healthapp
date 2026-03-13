import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import Toolkit from "@/components/landing/Toolkit";
import Distribution from "@/components/landing/Distribution";
import ProblemSolution from "@/components/landing/ProblemSolution";
import StatsBanner from "@/components/landing/StatsBanner";
import HCPSection from "@/components/landing/HCPSection";
import { AccreditationStrip } from "@/src/components/AccreditationStrip";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
export default function Home() {
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <Toolkit />
        <Distribution />
        <ProblemSolution />
        <StatsBanner />
        <HCPSection />
        <AccreditationStrip />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
