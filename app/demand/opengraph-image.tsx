import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Healthcare professionals near you are waiting for CE sponsors";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Simple branded card with a scattered-dot "map" motif. No counts anywhere.
const DOTS = [
  [240, 250], [330, 210], [420, 300], [520, 240], [610, 330],
  [700, 220], [790, 300], [880, 250], [960, 340], [300, 400],
  [500, 430], [720, 420], [400, 200], [850, 400],
];

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0f766e,#0d9488)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: "80px",
          position: "relative",
        }}
      >
        {DOTS.map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 18,
              height: 18,
              borderRadius: 9,
              background: "rgba(255,255,255,0.35)",
              display: "flex",
            }}
          />
        ))}
        <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>
          pulsereferrals
        </div>
        <div style={{ display: "flex", fontSize: 62, fontWeight: 800, lineHeight: 1.1, marginTop: 24, maxWidth: 900 }}>
          Professionals near you are waiting for CE sponsors.
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 24, opacity: 0.9, maxWidth: 820 }}>
          Sponsor a professional&apos;s free accredited CE — and get the introduction.
        </div>
      </div>
    ),
    { ...size }
  );
}
