"use client";

type Props = { userName: string };

export function ManagerDashboard({ userName }: Props) {
  return (
    <div className="space-y-6 pb-20">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">Team Dashboard</h1>
      <p className="text-[13px] text-[var(--ink-muted)] -mt-5 mb-6">Texas Region · 8 representatives</p>

      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(170px,1fr))] mb-6">
        {[
          { label: "Team Points", val: "847", note: "↑ 23%", noteClass: "text-[var(--green)]" },
          { label: "Touchpoints", val: "142", note: "This week", noteClass: "text-[var(--blue)]" },
          { label: "CEs Distributed", val: "38", note: "This month", noteClass: "text-[var(--green)]" },
          { label: "Credits Used", val: "58", note: "142 left", noteClass: "text-[var(--blue)]" },
          { label: "Events", val: "6", note: "Next 30 days", noteClass: "text-[var(--blue)]" },
          { label: "Professionals", val: "267", note: "18 need attn", noteClass: "text-[var(--coral)]" },
        ].map((s) => (
          <div key={s.label} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-5 transition-shadow hover:shadow-[var(--shadow)]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] mb-1">{s.label}</div>
            <div className="font-[family-name:var(--font-fraunces)] text-[28px] font-extrabold text-[var(--ink)]">{s.val}</div>
            <div className={`text-[11px] font-medium ${s.noteClass}`}>{s.note}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6 mb-4">
        <div className="border-b border-[var(--border)] pb-3 mb-4">
          <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Team Leaderboard</h2>
        </div>
        {[
          { rank: 1, name: "Marcus Johnson", meta: "Houston · 45 pros · 12 CEs · 3 events", pts: "248 pts", rankClass: "text-[var(--gold)]" },
          { rank: 2, name: "Jessica Chen", meta: "Dallas · 38 pros · 9 CEs · 2 events", pts: "215 pts", rankClass: "text-[#9CA3AF]" },
          { rank: 3, name: "David Rodriguez", meta: "Austin · 42 pros · 8 CEs", pts: "187 pts", rankClass: "text-[#CD7F32]" },
          { rank: 4, name: "Amanda Williams", meta: "San Antonio · 31 pros · 5 CEs", pts: "156 pts", rankClass: "text-[var(--ink-muted)]" },
          { rank: 5, name: "Kevin Park", meta: "Fort Worth · 28 pros · 4 CEs", pts: "134 pts", rankClass: "text-[var(--ink-muted)]" },
        ].map((r) => (
          <div key={r.rank} className="grid grid-cols-[40px_1fr_auto] gap-3 py-2.5 items-center border-b border-[var(--border)] last:border-0">
            <div className={`font-[family-name:var(--font-fraunces)] font-extrabold text-lg text-center ${r.rankClass}`}>{r.rank}</div>
            <div>
              <div className="font-bold text-[13px] text-[var(--ink)]">{r.name}</div>
              <div className="text-[10px] text-[var(--ink-muted)]">{r.meta}</div>
            </div>
            <span className="rounded-full bg-[var(--blue-glow)] px-3 py-1 text-[11px] font-bold text-[var(--blue)]">{r.pts}</span>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
          <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Credit Usage</h2>
          <button type="button" className="rounded-[var(--r)] bg-[var(--blue)] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => alert("Redirecting to purchase credits...")}>Purchase Credits</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "COMPLIMENTARY", val: "38", sub: "1 credit each" },
            { label: "DISCOUNTED", val: "14", sub: "Commission earned" },
            { label: "REFERRED", val: "6", sub: "Commission earned" },
          ].map((c) => (
            <div key={c.label} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4 text-center">
              <div className="text-[10px] font-semibold text-[var(--ink-muted)] mb-1">{c.label}</div>
              <div className="font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">{c.val}</div>
              <div className="text-[10px] text-[var(--ink-muted)]">{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6">
        <div className="border-b border-[var(--border)] pb-3 mb-4">
          <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Upcoming Events</h2>
        </div>
        <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4 mb-2.5">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div>
              <div className="font-bold text-[13px] text-[var(--ink)]">Ethics Lunch & Learn</div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">Feb 20 · Memorial Medical, Houston · Marcus Johnson</div>
            </div>
            <span className="rounded-full bg-[var(--green-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--green)]">12 RSVPs</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--teal-glow)] text-[var(--teal)]">Nursing</span>
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--teal-glow)] text-[var(--teal)]">Social Work</span>
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--blue-glow)] text-[var(--blue)]">TX</span>
          </div>
        </div>
        <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div>
              <div className="font-bold text-[13px] text-[var(--ink)]">Palliative Care In-Service</div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">Feb 27 · St. Luke&apos;s, Houston · Marcus Johnson</div>
            </div>
            <span className="rounded-full bg-[var(--blue-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--blue)]">8 RSVPs</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--teal-glow)] text-[var(--teal)]">Nursing</span>
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--teal-glow)] text-[var(--teal)]">Case Mgmt</span>
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--blue-glow)] text-[var(--blue)]">TX</span>
          </div>
        </div>
      </div>
    </div>
  );
}
