"use client";

type Role = "manager" | "rep" | "professional";

type Props = {
  onSelect: (role: Role) => void;
};

export function RoleSelector({ onSelect }: Props) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#F8FAFC]">
      <div className="w-full max-w-[460px] rounded-xl border border-[var(--border)] bg-white p-10 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="mb-7 flex items-center gap-2.5 font-[family-name:var(--font-fraunces)] text-[30px] font-extrabold text-[var(--ink)]">
          <svg width={36} height={24} viewBox="0 0 36 24">
            <path d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12" fill="none" stroke="#2455FF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Pulse
        </div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-xl font-bold text-[var(--ink)] mb-1">Welcome back</h1>
        <p className="text-[13px] text-[var(--ink-muted)] mb-6">Select your role to continue</p>
        <div className="grid gap-2 mb-5">
          <button
            type="button"
            onClick={() => onSelect("manager")}
            className="rounded-xl border-2 border-transparent bg-[#F8FAFC] px-4 py-3.5 text-left transition-colors hover:bg-[var(--sage)] focus:bg-[var(--blue-glow)] focus:border-[var(--blue)]"
          >
            <h3 className="text-[13px] font-bold text-[var(--ink)] mb-0.5">Team Manager</h3>
            <p className="text-[11px] text-[var(--ink-muted)] m-0">Performance, territories, credits, team oversight</p>
          </button>
          <button
            type="button"
            onClick={() => onSelect("rep")}
            className="rounded-xl border-2 border-transparent bg-[#F8FAFC] px-4 py-3.5 text-left transition-colors hover:bg-[var(--sage)] focus:bg-[var(--blue-glow)] focus:border-[var(--blue)]"
          >
            <h3 className="text-[13px] font-bold text-[var(--ink)] mb-0.5">Sales Representative</h3>
            <p className="text-[11px] text-[var(--ink-muted)] m-0">Distribute CEs, manage events, QR tools, grow your network</p>
          </button>
          <button
            type="button"
            onClick={() => onSelect("professional")}
            className="rounded-xl border-2 border-transparent bg-[#F8FAFC] px-4 py-3.5 text-left transition-colors hover:bg-[var(--sage)] focus:bg-[var(--blue-glow)] focus:border-[var(--blue)]"
          >
            <h3 className="text-[13px] font-bold text-[var(--ink)] mb-0.5">Healthcare Professional</h3>
            <p className="text-[11px] text-[var(--ink-muted)] m-0">Free CEs, events, career opportunities, local reps</p>
          </button>
        </div>
      </div>
    </div>
  );
}
