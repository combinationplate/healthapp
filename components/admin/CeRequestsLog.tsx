"use client";

import { useMemo, useState } from "react";

export type CeRequestRow = {
  id: string;
  created_at: string;
  topic: string;
  hours: number;
  deadline: string | null;
  status: string;
  professional_name: string;
  professional_email: string;
  discipline: string;
  facility: string;
  location: string;
  rep_name: string;
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#FEF3C7", color: "#92400E" },
  fulfilled: { bg: "rgba(13,148,136,0.10)", color: "#0d9488" },
  cancelled: { bg: "#f0efeb", color: "#7a8ba8" },
};

const STATUSES = ["all", "pending", "fulfilled", "cancelled"];

export function CeRequestsLog({ rows }: { rows: CeRequestRow[] }) {
  const [status, setStatus] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return (
        r.professional_name.toLowerCase().includes(q) ||
        r.professional_email.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q) ||
        r.rep_name.toLowerCase().includes(q) ||
        (r.discipline ?? "").toLowerCase().includes(q) ||
        (r.facility ?? "").toLowerCase().includes(q) ||
        (r.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, status, query]);

  return (
    <div style={{ marginBottom: "32px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search professional, topic, rep…"
          style={{
            flex: "1 1 220px",
            minWidth: "180px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(11,18,34,0.15)",
            fontSize: "13px",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            style={{
              padding: "7px 14px",
              borderRadius: "999px",
              border: "1px solid rgba(11,18,34,0.12)",
              background: status === s ? "#0b1222" : "#fff",
              color: status === s ? "#fff" : "#3b4963",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {s}
          </button>
        ))}
        <span style={{ fontSize: "12px", color: "#7a8ba8", marginLeft: "auto" }}>
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid rgba(11,18,34,0.08)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid rgba(11,18,34,0.08)",
                  background: "#f6f5f0",
                }}
              >
                {[
                  "Date",
                  "Professional",
                  "Discipline",
                  "Facility",
                  "Location",
                  "Topic",
                  "Hrs",
                  "Deadline",
                  "Assigned Rep",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#7a8ba8",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{ padding: "24px", textAlign: "center", color: "#7a8ba8" }}
                  >
                    No CE requests match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const st = STATUS_STYLES[r.status] ?? STATUS_STYLES.cancelled;
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: "1px solid rgba(11,18,34,0.04)" }}
                    >
                      <td
                        style={{
                          padding: "8px 10px",
                          color: "#7a8ba8",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#0b1222" }}>
                        <div style={{ fontWeight: 600 }}>{r.professional_name}</div>
                        {r.professional_email ? (
                          <div style={{ color: "#7a8ba8", fontSize: "11px" }}>
                            {r.professional_email}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#3b4963" }}>
                        {r.discipline || "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: "#3b4963",
                        }}
                      >
                        {r.facility || "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: "#3b4963",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.location || "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: "#3b4963",
                          maxWidth: "240px",
                        }}
                      >
                        {r.topic}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: "#7a8ba8",
                          textAlign: "center",
                        }}
                      >
                        {r.hours}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: "#3b4963",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.deadline
                          ? new Date(r.deadline).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#3b4963" }}>
                        {r.rep_name}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 700,
                            background: st.bg,
                            color: st.color,
                            textTransform: "capitalize",
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
