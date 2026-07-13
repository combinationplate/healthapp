"use client";

import { useRef, useState } from "react";
import { US_MAP_SVG, MAP_VIEWBOX } from "@/lib/demand/us-map";
import type { MetroDot } from "@/lib/demand/data";

export function DemandMap({ dots }: { dots: MetroDot[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  function showAt(i: number, clientX: number, clientY: number) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) setTip({ x: clientX - r.left, y: clientY - r.top });
    setActive(i);
  }
  function showFromEl(i: number, el: SVGGElement) {
    const wr = wrapRef.current?.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    if (wr) setTip({ x: er.left - wr.left + er.width / 2, y: er.top - wr.top + er.height / 2 });
    setActive(i);
  }

  const dot = active != null ? dots[active] : null;

  return (
    <div className="pulse-demand-map" ref={wrapRef} style={{ position: "relative" }}>
      <svg
        viewBox={MAP_VIEWBOX}
        role="img"
        aria-label="Map of US metro areas where licensed professionals have open continuing-education requests"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <g dangerouslySetInnerHTML={{ __html: US_MAP_SVG }} />
        <g>
          {dots.map((d, i) => (
            <g
              key={`${d.name}-${d.state}`}
              className="pin"
              tabIndex={0}
              role="button"
              aria-label={`${d.label}. ${d.disciplines.join(", ")}. ${d.topics.slice(0, 3).join(", ")}. ${d.hours} CE hours.`}
              transform={`translate(${d.x},${d.y})`}
              style={{ cursor: "pointer", outline: "none" }}
              onMouseMove={(e) => showAt(i, e.clientX, e.clientY)}
              onMouseLeave={() => setActive(null)}
              onFocus={(e) => showFromEl(i, e.currentTarget)}
              onBlur={() => setActive(null)}
              onTouchStart={(e) => {
                const t = e.touches[0];
                if (t) showAt(i, t.clientX, t.clientY);
              }}
            >
              <circle r={11} fill="#0D9488" opacity={0.15} />
              <circle r={5.5} fill="#0D9488" opacity={0.92} stroke="#fff" strokeWidth={2} />
            </g>
          ))}
        </g>
      </svg>

      {dot && tip && (
        <div
          role="status"
          style={{
            position: "absolute",
            left: tip.x,
            top: tip.y,
            transform: "translate(-50%,-120%)",
            pointerEvents: "none",
            background: "#1E293B",
            color: "#fff",
            fontSize: 13,
            lineHeight: 1.45,
            padding: "8px 12px",
            borderRadius: 8,
            whiteSpace: "nowrap",
            zIndex: 5,
            boxShadow: "0 6px 20px rgba(2,6,23,0.25)",
          }}
        >
          <strong>{dot.label}</strong>
          <br />
          {dot.disciplines.join(", ")}
          <br />
          {dot.topics.slice(0, 3).join(", ")}
          {dot.topics.length > 3 ? " +more" : ""} &middot; {dot.hours} CE hrs
        </div>
      )}
    </div>
  );
}
