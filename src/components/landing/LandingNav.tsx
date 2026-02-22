"use client";

import Link from "next/link";
import { useState } from "react";

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[200] border-b border-[var(--border)] bg-white/92 backdrop-blur-[16px]">
      <div className="mx-auto max-w-[1200px] px-7">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-[family-name:var(--font-fraunces)] text-[26px] font-extrabold text-[var(--ink)] no-underline"
          >
            <span className="inline-flex items-center gap-0.5">
              <svg
                className="overflow-visible"
                width={36}
                height={24}
                viewBox="0 0 36 24"
              >
                <path
                  className="heartbeat-path"
                  d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12"
                  fill="none"
                  stroke="#2455FF"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Pulse
          </Link>
          <ul className="hidden items-center gap-7 list-none md:flex">
            <li>
              <Link
                href="/#toolkit"
                className="text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
              >
                Toolkit
              </Link>
            </li>
            <li>
              <Link
                href="/#distribution"
                className="text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
              >
                Distribution
              </Link>
            </li>
            <li>
              <Link
                href="/#professionals"
                className="text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
              >
                For Professionals
              </Link>
            </li>
          </ul>
          <div className="flex items-center gap-2.5">
            <Link
              href="/signup?type=hcp"
              className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-5 py-2 text-[13px] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--teal)] hover:text-[var(--teal)] hidden sm:inline-block"
            >
              I&apos;m a Healthcare Pro
            </Link>
            <Link
              href="/signup?type=sales"
              className="rounded-[var(--r)] bg-[var(--ink)] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--blue)]"
            >
              Request Demo
            </Link>
          </div>
          <button
            type="button"
            className="block cursor-pointer border-none bg-transparent text-2xl md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            &#9776;
          </button>
        </div>
        {mobileOpen && (
          <div className="flex flex-col gap-4 border-t border-[var(--border)] py-4 md:hidden">
            <Link href="/#toolkit" className="text-sm font-medium text-[var(--ink-soft)]" onClick={() => setMobileOpen(false)}>Toolkit</Link>
            <Link href="/#distribution" className="text-sm font-medium text-[var(--ink-soft)]" onClick={() => setMobileOpen(false)}>Distribution</Link>
            <Link href="/#professionals" className="text-sm font-medium text-[var(--ink-soft)]" onClick={() => setMobileOpen(false)}>For Professionals</Link>
            <Link href="/signup?type=hcp" className="text-sm font-medium text-[var(--ink-soft)]" onClick={() => setMobileOpen(false)}>I&apos;m a Healthcare Pro</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
