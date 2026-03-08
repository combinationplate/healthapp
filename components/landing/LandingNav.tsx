"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";
import { showModal } from "./LandingModals";

function PulseLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="14" fill="#0b1222" />
      <path
        d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
        stroke="url(#nav-glow)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
      <path
        d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
        stroke="url(#nav-line)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="nav-line" x1="10" y1="28" x2="46" y2="28">
          <stop offset="0%" stopColor="#6B8AFF" />
          <stop offset="100%" stopColor="#5EEAD4" />
        </linearGradient>
        <linearGradient id="nav-glow" x1="10" y1="28" x2="46" y2="28">
          <stop offset="0%" stopColor="#2455ff" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function LandingNav() {
  return (
    <nav className="sticky top-0 z-[200] border-b border-[var(--border)] bg-white/92 backdrop-blur-[16px]">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-serif text-[26px] font-extrabold text-ink"
          >
            <PulseLogo />
            Pulse
          </Link>
          <ul className="flex list-none items-center gap-7">
            <li>
              <Link
                href="/how-it-works"
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                How It Works
              </Link>
            </li>
            <li>
              <Link
                href="#professionals"
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Free CEs
              </Link>
            </li>
            <li>
              <Link
                href="#sales-teams"
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                For Sales Teams
              </Link>
            </li>
          </ul>
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-teal hover:text-teal"
            >
              Log in
            </Link>
            <button
              type="button"
              onClick={() => showModal("hcp")}
              className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-teal hover:text-teal"
            >
              Get Free CEs
            </button>
            <button
              type="button"
              onClick={() => showModal("sales")}
              className="rounded-[var(--r)] bg-ink px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-blue"
            >
              Request Demo
            </button>
          </div>
        </div>
      </Container>
    </nav>
  );
}
