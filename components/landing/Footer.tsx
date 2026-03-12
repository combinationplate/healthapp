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
        <div className="border-t border-white/6 pt-5 text-center text-[12px] text-white/25">
          © 2026 Pulse. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
