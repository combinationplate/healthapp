import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pulsereferrals.com"),
  title: "Pulse — Free CE Courses for Healthcare Pros | Referral Tools for Sales Teams",
  description:
    "Free, nationally accredited CE courses for nurses, social workers, case managers, PTs, OTs, and SLPs. CE distribution, QR codes, branded flyers, and network tools for hospice, home health & rehab sales teams.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://pulsereferrals.com/#organization",
      name: "Pulse",
      alternateName: "Pulse Referrals",
      url: "https://pulsereferrals.com",
      logo: "https://pulsereferrals.com/favicon.svg",
      description:
        "Free, nationally accredited continuing education for healthcare professionals — nurses, social workers, and case managers — sponsored by hospice, home health, and rehab sales teams.",
      sameAs: ["https://www.linkedin.com/company/pulsereferrals"],
      provider: { "@id": "https://pulsereferrals.com/#his-cornerstone" },
    },
    {
      "@type": "EducationalOrganization",
      "@id": "https://pulsereferrals.com/#his-cornerstone",
      name: "H.I.S. Cornerstone Continuing Education",
      description:
        "Nationally accredited continuing education provider — ANCC-accredited provider and ASWB ACE provider #2082 — serving healthcare professionals since 2007.",
      foundingDate: "2007",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Analytics />
      </body>
    </html>
  );
}
