"use client";

import Link from "next/link";
import { useState } from "react";

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/how-it-works", label: "How It Works" },
    { href: "/#professionals", label: "Free CEs" },
    { href: "/#cta", label: "For Sales Teams" },
  ];

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
          .lnav-mobile-only { display: flex !important; }
        }
        @media (min-width: 768px) {
          .lnav-mobile-only { display: none !important; }
          .lnav-hamburger { display: none !important; }
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

          {/* Desktop nav links */}
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
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#3b4963",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side: buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/signup?type=hcp"
              className="lnav-desktop"
              style={{
                padding: "8px 20px",
                borderRadius: "10px",
                border: "1px solid rgba(11,18,34,0.08)",
                background: "transparent",
                fontSize: "13px",
                fontWeight: 600,
                color: "#3b4963",
                textDecoration: "none",
                transition: "border-color 0.15s, color 0.15s",
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
                transition: "background 0.15s",
              }}
            >
              Request Demo
            </Link>

            {/* Hamburger — mobile only */}
            <button
              type="button"
              className="lnav-hamburger"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#0b1222",
                padding: "4px",
                marginLeft: "4px",
              }}
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="lnav-mobile-only"
            style={{
              flexDirection: "column",
              gap: "4px",
              borderTop: "1px solid rgba(11,18,34,0.08)",
              padding: "12px 0 16px",
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0b1222",
                  textDecoration: "none",
                  padding: "12px 0",
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
                padding: "12px 0",
              }}
            >
              I&apos;m a Healthcare Pro
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
