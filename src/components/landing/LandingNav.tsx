"use client";

import Link from "next/link";
import { useState } from "react";

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(11,18,34,0.08)",
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          .lnav-desktop { display: none !important; }
        }
        @media (min-width: 768px) {
          .lnav-hamburger { display: none !important; }
          .lnav-mobile-menu { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        <div
          style={{
            display: "flex",
            height: "64px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="14" fill="#0b1222" />
              <path
                d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
                stroke="url(#lnav-glow)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.3"
              />
              <path
                d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
                stroke="url(#lnav-line)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="lnav-line" x1="10" y1="28" x2="46" y2="28">
                  <stop offset="0%" stopColor="#6B8AFF" />
                  <stop offset="100%" stopColor="#5EEAD4" />
                </linearGradient>
                <linearGradient id="lnav-glow" x1="10" y1="28" x2="46" y2="28">
                  <stop offset="0%" stopColor="#2455ff" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
            </svg>
            <span
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: "24px",
                fontWeight: 900,
                color: "#0b1222",
              }}
            >
              Pulse
            </span>
          </Link>

          {/* Desktop nav links — hidden below 768px */}
          <ul
            className="lnav-desktop"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            <li>
              <Link href="/how-it-works" style={{ fontSize: "14px", fontWeight: 500, color: "#3b4963", textDecoration: "none" }}>
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/#professionals" style={{ fontSize: "14px", fontWeight: 500, color: "#3b4963", textDecoration: "none" }}>
                Free CEs
              </Link>
            </li>
            <li>
              <Link href="/#cta" style={{ fontSize: "14px", fontWeight: 500, color: "#3b4963", textDecoration: "none" }}>
                For Sales Teams
              </Link>
            </li>
            <li>
              <Link href="/accreditation" style={{ fontSize: "14px", fontWeight: 500, color: "#3b4963", textDecoration: "none" }}>
                Accreditation
              </Link>
            </li>
          </ul>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/signup?type=hcp"
              className="lnav-desktop"
              style={{
                display: "inline-block",
                padding: "8px 20px",
                borderRadius: "10px",
                border: "1px solid rgba(11,18,34,0.08)",
                background: "transparent",
                fontSize: "13px",
                fontWeight: 600,
                color: "#3b4963",
                textDecoration: "none",
              }}
            >
              I&apos;m a Healthcare Pro
            </Link>
            <Link
              href="/signup?type=sales"
              style={{
                padding: "8px 20px",
                borderRadius: "10px",
                background: "#0b1222",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Get Started Free
            </Link>
            <button
              type="button"
              className="lnav-hamburger"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                fontSize: "22px",
                cursor: "pointer",
                color: "#0b1222",
                padding: "4px 0 4px 8px",
              }}
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            className="lnav-mobile-menu"
            style={{
              display: "flex",
              flexDirection: "column",
              borderTop: "1px solid rgba(11,18,34,0.08)",
              paddingBottom: "16px",
            }}
          >
            {[
              { href: "/how-it-works", label: "How It Works" },
              { href: "/#professionals", label: "Free CEs" },
              { href: "/#cta", label: "For Sales Teams" },
              { href: "/accreditation", label: "Accreditation" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0b1222",
                  textDecoration: "none",
                  padding: "14px 0",
                  borderBottom: "1px solid rgba(11,18,34,0.04)",
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/signup?type=hcp"
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#0d9488",
                textDecoration: "none",
                padding: "14px 0",
              }}
            >
              I&apos;m a Healthcare Pro →
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}