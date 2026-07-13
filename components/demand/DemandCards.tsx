"use client";

import { useState } from "react";
import type { PublicRequest } from "@/lib/demand/data";

function discColor(d: string): string {
  const s = d.toLowerCase();
  if (s.includes("nurs")) return "#0D9488";
  if (s.includes("social")) return "#6D28D9";
  if (s.includes("case")) return "#B45309";
  return "#475569";
}

type ClaimState = "idle" | "loading" | "claimed" | "taken" | "reponly" | "error";

export function DemandCards({ requests }: { requests: PublicRequest[] }) {
  const [states, setStates] = useState<Record<string, ClaimState>>({});
  const set = (id: string, s: ClaimState) => setStates((p) => ({ ...p, [id]: s }));

  async function claim(id: string) {
    set(id, "loading");
    try {
      const res = await fetch("/api/demand/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id }),
      });
      if (res.status === 401) {
        window.location.href = `/signup?type=sales&next=${encodeURIComponent("/demand")}`;
        return;
      }
      if (res.status === 409) return set(id, "taken");
      if (res.status === 403) return set(id, "reponly");
      if (!res.ok) return set(id, "error");
      set(id, "claimed");
    } catch {
      set(id, "error");
    }
  }

  if (requests.length === 0) {
    return (
      <div className="demand-empty">
        <p>No open requests to show right now — new ones appear here as professionals request CE.</p>
        <p>
          Are you a licensed professional who needs CE?{" "}
          <a href="/signup?type=hcp">Request free CE &rarr;</a>
        </p>
      </div>
    );
  }

  return (
    <div className="demand-cards">
      {requests.map((r) => {
        const st = states[r.id] ?? "idle";
        const color = discColor(r.discipline);
        return (
          <div className="demand-card" key={r.id}>
            <div className="demand-card-top">
              <span
                className="demand-disc"
                style={{ color, background: `${color}1a`, borderColor: `${color}40` }}
              >
                {r.discipline}
              </span>
              <span className="demand-need">{r.urgency}</span>
            </div>
            <div className="demand-card-city">{r.metro}</div>
            <div className="demand-card-topic">
              {r.topic} &middot; <strong>{r.hours} CE hr{r.hours !== 1 ? "s" : ""}</strong>
            </div>
            <div className="demand-card-note">Licensed professional, verified profile</div>

            {st === "claimed" ? (
              <div className="demand-status demand-ok">✓ Claimed — we&apos;ll introduce you once the CE is delivered.</div>
            ) : st === "taken" ? (
              <div className="demand-status">
                Already claimed.{" "}
                <a href={`/signup?type=sales&next=${encodeURIComponent("/demand")}`}>Watch your market &rarr;</a>
              </div>
            ) : st === "reponly" ? (
              <div className="demand-status">
                Rep accounts only. <a href="/signup?type=sales">Create a rep account &rarr;</a>
              </div>
            ) : (
              <button className="demand-claim" disabled={st === "loading"} onClick={() => claim(r.id)}>
                {st === "loading" ? "Claiming…" : "Claim this intro — free"}
              </button>
            )}
            {st === "error" && <div className="demand-status demand-err">Something went wrong — please try again.</div>}
          </div>
        );
      })}
    </div>
  );
}
