import type { Metadata } from "next";

// QR landing pages are thin per-rep duplicates — keep them out of the index.
// page.tsx is a client component and cannot export metadata, so robots lives
// in this layout. It also covers /ce/[repId]/[courseId], which re-exports
// the same page.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CeLandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
