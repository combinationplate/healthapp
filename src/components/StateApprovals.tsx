"use client";

import React, { useState, useEffect, useMemo } from "react";

const ALL_DISCIPLINES = ["Nursing", "Social Work", "Case Management", "PT", "OT", "ST"] as const;
type Discipline = (typeof ALL_DISCIPLINES)[number];

const DISCIPLINE_COLORS: Record<Discipline, { bg: string; text: string; activeBg: string; activeText: string }> = {
  "Nursing":        { bg: "rgba(36,85,255,0.07)",   text: "#2455ff",  activeBg: "#2455ff",  activeText: "#fff" },
  "Social Work":    { bg: "rgba(13,148,136,0.07)",  text: "#0d9488",  activeBg: "#0d9488",  activeText: "#fff" },
  "Case Management":{ bg: "rgba(146,103,10,0.07)",  text: "#92670A",  activeBg: "#92670A",  activeText: "#fff" },
  "PT":             { bg: "rgba(232,96,76,0.07)",   text: "#e8604c",  activeBg: "#e8604c",  activeText: "#fff" },
  "OT":             { bg: "rgba(139,92,246,0.07)",  text: "#7c3aed",  activeBg: "#7c3aed",  activeText: "#fff" },
  "ST":             { bg: "rgba(16,185,129,0.07)",  text: "#059669",  activeBg: "#059669",  activeText: "#fff" },
};

const SHORT_LABELS: Record<Discipline, string> = {
  "Nursing": "Nursing", "Social Work": "Social Work",
  "Case Management": "Case Mgmt", "PT": "PT", "OT": "OT", "ST": "SLP",
};

type Row = { profession: string; state: string };

export function StateApprovals() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Discipline | null>(null);
  const [stateSearch, setStateSearch] = useState("");

  useEffect(() => {
    fetch("/api/accreditation/states")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); } else { setRows(d.data ?? []); }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load approval data."); setLoading(false); });
  }, []);

  // All unique states, optionally filtered
  const allStates = useMemo(() => {
    const set = new Set(rows.map((r) => r.state));
    return Array.from(set).sort();
  }, [rows]);

  // Build fast lookup: state+discipline → true
  const lookup = useMemo(() => {
    const map = new Set<string>();
    for (const r of rows) map.add(`${r.state}|${r.profession}`);
    return map;
  }, [rows]);

  // Count per discipline
  const countByDiscipline = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.profession] = (counts[r.profession] ?? 0) + 1;
    return counts;
  }, [rows]);

  // Which disciplines to show as columns (all, or just the active filter)
  const visibleDisciplines: Discipline[] = activeFilter ? [activeFilter] : [...ALL_DISCIPLINES];

  // States to show after search
  const visibleStates = useMemo(() => {
    const q = stateSearch.trim().toLowerCase();
    if (!q) return allStates;
    return allStates.filter((s) => s.toLowerCase().includes(q));
  }, [allStates, stateSearch]);

  return (
    <div id="state-approvals" style={{ scrollMarginTop: "80px" }}>
      {/* Section header */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: "clamp(22px, 4vw, 30px)",
          fontWeight: 800,
          color: "#0b1222",
          margin: "0 0 8px",
        }}>
          State-by-State Approvals
        </h2>
        <p style={{ fontSize: "15px", color: "#3b4963", margin: 0, lineHeight: 1.6 }}>
          Each cell shows whether that discipline's CE credits are approved in that state.
          Filter by discipline or search for a specific state.
        </p>
      </div>

      {/* Discipline filter badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        <button
          onClick={() => setActiveFilter(null)}
          style={{
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 700,
            border: "1.5px solid",
            borderColor: activeFilter === null ? "#0b1222" : "rgba(11,18,34,0.12)",
            background: activeFilter === null ? "#0b1222" : "white",
            color: activeFilter === null ? "white" : "#7a8ba8",
            cursor: "pointer",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            transition: "all 0.15s",
          }}
        >
          All Disciplines
        </button>
        {ALL_DISCIPLINES.map((d) => {
          const c = DISCIPLINE_COLORS[d];
          const isActive = activeFilter === d;
          return (
            <button
              key={d}
              onClick={() => setActiveFilter(isActive ? null : d)}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
                border: "1.5px solid",
                borderColor: isActive ? c.activeBg : "rgba(11,18,34,0.10)",
                background: isActive ? c.activeBg : c.bg,
                color: isActive ? c.activeText : c.text,
                cursor: "pointer",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                transition: "all 0.15s",
              }}
            >
              {SHORT_LABELS[d]}
              {countByDiscipline[d] !== undefined && (
                <span style={{
                  marginLeft: "6px",
                  fontSize: "10px",
                  opacity: 0.75,
                  fontWeight: 600,
                }}>
                  {countByDiscipline[d]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* State search */}
      <div style={{ marginBottom: "16px", maxWidth: "280px" }}>
        <input
          type="text"
          placeholder="Search state…"
          value={stateSearch}
          onChange={(e) => setStateSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(11,18,34,0.10)",
            fontSize: "13px",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            color: "#0b1222",
            outline: "none",
            background: "white",
          }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#7a8ba8", fontSize: "14px" }}>
          Loading approvals…
        </div>
      ) : error ? (
        <div style={{ padding: "32px", borderRadius: "12px", background: "rgba(232,96,76,0.06)", color: "#e8604c", fontSize: "14px" }}>
          {error}
        </div>
      ) : (
        <div style={{
          overflowX: "auto",
          borderRadius: "14px",
          border: "1px solid rgba(11,18,34,0.08)",
          boxShadow: "0 2px 12px rgba(11,18,34,0.04)",
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            <thead>
              <tr style={{ background: "#0b1222" }}>
                {/* Sticky state column header */}
                <th style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 2,
                  background: "#0b1222",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  padding: "12px 20px",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  borderRight: "1px solid rgba(255,255,255,0.08)",
                }}>
                  State
                </th>
                {visibleDisciplines.map((d) => {
                  const c = DISCIPLINE_COLORS[d];
                  return (
                    <th key={d} style={{
                      padding: "12px 16px",
                      color: c.activeText,
                      background: c.activeBg,
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      minWidth: "110px",
                    }}>
                      {SHORT_LABELS[d]}
                      <div style={{ fontSize: "10px", fontWeight: 500, opacity: 0.8, marginTop: "2px" }}>
                        {countByDiscipline[d] ?? 0} states
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleStates.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleDisciplines.length + 1}
                    style={{ padding: "32px", textAlign: "center", color: "#7a8ba8" }}
                  >
                    No states match your search.
                  </td>
                </tr>
              ) : (
                visibleStates.map((state, idx) => (
                  <tr
                    key={state}
                    style={{ background: idx % 2 === 0 ? "white" : "#fafaf8" }}
                  >
                    <td style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      background: idx % 2 === 0 ? "white" : "#fafaf8",
                      fontWeight: 600,
                      color: "#0b1222",
                      padding: "10px 20px",
                      whiteSpace: "nowrap",
                      borderRight: "1px solid rgba(11,18,34,0.06)",
                    }}>
                      {state}
                    </td>
                    {visibleDisciplines.map((d) => {
                      const approved = lookup.has(`${state}|${d}`);
                      const c = DISCIPLINE_COLORS[d];
                      return (
                        <td key={d} style={{ padding: "10px 16px", textAlign: "center" }}>
                          {approved ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              background: c.activeBg,
                              color: "white",
                              fontSize: "13px",
                              fontWeight: 700,
                            }}>
                              ✓
                            </span>
                          ) : (
                            <span style={{ color: "rgba(11,18,34,0.18)", fontSize: "16px", lineHeight: 1 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PT/OT/SLP expansion note */}
      {(!activeFilter || ["PT", "OT", "ST"].includes(activeFilter)) && !loading && !error && (
        <div style={{
          marginTop: "20px",
          padding: "16px 20px",
          borderRadius: "12px",
          background: "rgba(232,96,76,0.05)",
          border: "1px solid rgba(232,96,76,0.12)",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}>
          <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>📋</span>
          <p style={{ margin: 0, fontSize: "13px", color: "#3b4963", lineHeight: 1.6 }}>
            <strong style={{ color: "#0b1222" }}>PT, OT & SLP:</strong>{" "}
            Currently approved in Texas — PT through <strong style={{ color: "#0b1222" }}>TPTA</strong> (Texas Physical Therapy Association), OT through the Texas OT Board, and SLP through the Texas SLP Board.
            Expanding to additional states via reciprocity — check back as new states are added.
          </p>
        </div>
      )}
    </div>
  );
}
