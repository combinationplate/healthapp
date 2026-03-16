import Link from "next/link";
import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="bg-ink py-14 pt-14 text-white">
      <Container>
        <div className="mb-10 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-2.5 flex items-center gap-2.5 font-serif text-[26px] font-extrabold">
              <svg width="28" height="28" viewBox="0 0 56 56" fill="none">
                <rect width="56" height="56" rx="14" fill="#1a2744" />
                <path
                  d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
                  stroke="url(#footer-glow)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                />
                <path
                  d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
                  stroke="url(#footer-line)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="footer-line" x1="10" y1="28" x2="46" y2="28">
                    <stop offset="0%" stopColor="#6B8AFF" />
                    <stop offset="100%" stopColor="#5EEAD4" />
                  </linearGradient>
                  <linearGradient id="footer-glow" x1="10" y1="28" x2="46" y2="28">
                    <stop offset="0%" stopColor="#2455ff" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
              </svg>
              Pulse
            </div>
            <p className="text-[14px] leading-[1.7] text-white/45">
              Free, nationally accredited CE courses for healthcare
              professionals. Referral-building distribution tools for hospice,
              home health, and rehab sales teams.
            </p>
          </div>
          <div>
            <h4 className="mb-3.5 text-[12px] font-bold uppercase tracking-[.1em] text-white/35">
              Product
            </h4>
            <ul className="list-none">
              <li className="mb-2">
                <Link href="#how-it-works" className="text-[14px] text-white/65 hover:text-white">
                  How It Works
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#professionals" className="text-[14px] text-white/65 hover:text-white">
                  Free CEs
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#sales-teams" className="text-[14px] text-white/65 hover:text-white">
                  For Sales Teams
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3.5 text-[12px] font-bold uppercase tracking-[.1em] text-white/35">
              Company
            </h4>
            <ul className="list-none">
              <li className="mb-2">
                <Link href="#" className="text-[14px] text-white/65 hover:text-white">
                  About
                </Link>
              </li>
              <li className="mb-2">
                <a
                  href="mailto:hello@pulsereferrals.com?subject=Question%20about%20Pulse"
                  className="text-[14px] text-white/65 hover:text-white"
                >
                  Contact
                </a>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-[14px] text-white/65 hover:text-white">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3.5 text-[12px] font-bold uppercase tracking-[.1em] text-white/35">
              Legal
            </h4>
            <ul className="list-none">
              <li className="mb-2">
                <Link href="#" className="text-[14px] text-white/65 hover:text-white">
                  Privacy
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-[14px] text-white/65 hover:text-white">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/6 pt-5 flex flex-wrap items-center justify-center gap-3 text-[12px] text-white/25">
          <span>© 2026 Pulse. All rights reserved.</span>
          <a
            href="https://www.linkedin.com/company/pulsereferrals"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center text-white/25 hover:text-white/65 transition-colors"
            aria-label="Pulse on LinkedIn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </Container>
    </footer>
  );
}
