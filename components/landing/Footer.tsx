import Link from "next/link";
import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="bg-ink py-14 pt-14 text-white">
      <Container>
        <div className="mb-10 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-2.5 flex items-center gap-2 font-serif text-[26px] font-extrabold">
              <svg
                width="28"
                height="18"
                viewBox="0 0 36 24"
                fill="none"
                stroke="#6B8AFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12" />
              </svg>
              Pulse
            </div>
            <p className="text-[14px] leading-[1.7] text-white/45">
              The marketing toolkit for hospice, home health, and rehab sales
              teams — and the healthcare professionals they serve.
            </p>
          </div>
          <div>
            <h4 className="mb-3.5 text-[12px] font-bold uppercase tracking-[.1em] text-white/35">
              Product
            </h4>
            <ul className="list-none">
              <li className="mb-2">
                <Link href="#toolkit" className="text-[14px] text-white/65 hover:text-white">
                  Toolkit
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#distribution" className="text-[14px] text-white/65 hover:text-white">
                  Distribution
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#professionals" className="text-[14px] text-white/65 hover:text-white">
                  For Professionals
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
                <Link href="#" className="text-[14px] text-white/65 hover:text-white">
                  Contact
                </Link>
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
