"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";
import { showModal } from "./LandingModals";

function PulseLogo() {
  return (
    <svg
      width="36"
      height="24"
      viewBox="0 0 36 24"
      className="overflow-visible"
      fill="none"
      stroke="#2455FF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12"
        className="animate-[heartbeat-line_1.5s_ease_forwards] [stroke-dasharray:200] [stroke-dashoffset:200]"
        style={{
          animation: "heartbeat-line 1.5s ease forwards",
          strokeDasharray: 200,
          strokeDashoffset: 200,
        }}
      />
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
            className="flex items-center gap-1.5 font-serif text-[26px] font-extrabold text-ink"
          >
            <span className="flex items-center gap-0.5">
              <PulseLogo />
            </span>
            Pulse
          </Link>
          <ul className="flex list-none items-center gap-7">
            <li>
              <Link
                href="#toolkit"
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Toolkit
              </Link>
            </li>
            <li>
              <Link
                href="#distribution"
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Distribution
              </Link>
            </li>
            <li>
              <Link
                href="#professionals"
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                For Professionals
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
              I&apos;m a Healthcare Pro
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
