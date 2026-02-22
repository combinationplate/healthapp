"use client";

import { useCallback, useEffect, useState } from "react";

export type ModalId = "sales" | "hcp";

let setModalState: (id: ModalId | null) => void;

export function showModal(id: ModalId) {
  setModalState?.(id);
}

export function closeModals() {
  setModalState?.(null);
}

export default function LandingModals() {
  const [active, setActive] = useState<ModalId | null>(null);

  useEffect(() => {
    setModalState = setActive;
    return () => {
      setModalState = () => {};
    };
  }, []);

  const onOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeModals();
  }, []);

  useEffect(() => {
    if (active) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <>
      <div
        id="modal-sales"
        className={`fixed inset-0 z-[500] flex items-center justify-center bg-ink/60 backdrop-blur-[8px] ${active === "sales" ? "flex" : "hidden"}`}
        onClick={onOverlayClick}
      >
        <div className="relative max-h-[90vh] w-[92%] max-w-[480px] overflow-y-auto rounded-[var(--r-xl)] bg-white p-11 shadow-[0_32px_80px_rgba(0,0,0,.15)]">
          <button
            type="button"
            onClick={closeModals}
            className="absolute right-[18px] top-[18px] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-cream text-[20px] text-ink-soft transition-colors hover:bg-[var(--border)] hover:text-ink"
          >
            ×
          </button>
          <h3 className="font-serif text-[24px] font-extrabold">
            Request a Demo
          </h3>
          <p className="mb-6 mt-1.5 text-[14px] text-ink-muted">
            See how Pulse helps your sales team win more referrals.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert(
                "Thanks! We'll reach out within 24 hours to schedule your demo."
              );
              closeModals();
            }}
            className="grid gap-3.5"
          >
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Sarah Martinez"
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                Work Email
              </label>
              <input
                type="email"
                required
                placeholder="sarah@yourhospice.com"
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                Company
              </label>
              <input
                type="text"
                required
                placeholder="Your Hospice / Home Health / Rehab"
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                Role
              </label>
              <select
                required
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              >
                <option value="">Select role…</option>
                <option>Sales Representative</option>
                <option>Sales Manager / Director</option>
                <option>Marketing Director</option>
                <option>Executive</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                Team Size
              </label>
              <select
                required
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              >
                <option value="">Select…</option>
                <option>Just me</option>
                <option>2–5 reps</option>
                <option>6–15 reps</option>
                <option>16+ reps</option>
              </select>
            </div>
            <button
              type="submit"
              className="mt-1.5 w-full rounded-[var(--r)] bg-blue py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-blue-dark"
            >
              Request Demo
            </button>
          </form>
        </div>
      </div>

      <div
        id="modal-hcp"
        className={`fixed inset-0 z-[500] flex items-center justify-center bg-ink/60 backdrop-blur-[8px] ${active === "hcp" ? "flex" : "hidden"}`}
        onClick={onOverlayClick}
      >
        <div className="relative max-h-[90vh] w-[92%] max-w-[480px] overflow-y-auto rounded-[var(--r-xl)] bg-white p-11 shadow-[0_32px_80px_rgba(0,0,0,.15)]">
          <button
            type="button"
            onClick={closeModals}
            className="absolute right-[18px] top-[18px] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-cream text-[20px] text-ink-soft transition-colors hover:bg-[var(--border)] hover:text-ink"
          >
            ×
          </button>
          <h3 className="font-serif text-[24px] font-extrabold">
            Register for Free
          </h3>
          <p className="mb-6 mt-1.5 text-[14px] text-ink-muted">
            Get free CE courses, event invites, career opportunities, and local
            rep connections.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert(
                "Welcome to Pulse! Check your email for next steps.\n\nYou'll start receiving free CE course offers, event invites, career opportunities, and rep connections in your area."
              );
              closeModals();
            }}
            className="grid gap-3.5"
          >
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Jennifer Lopez, RN"
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="jennifer@hospital.com"
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                Facility
              </label>
              <input
                type="text"
                required
                placeholder="St. Luke's Hospital"
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                Discipline
              </label>
              <select
                required
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              >
                <option value="">Select…</option>
                <option>Nursing (RN, LPN, LVN)</option>
                <option>Social Work (MSW, LCSW)</option>
                <option>Case Management</option>
                <option>Physical Therapy</option>
                <option>Occupational Therapy</option>
                <option>Speech Therapy</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                State Licensed In
              </label>
              <select
                required
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              >
                <option value="">Select state…</option>
                <option>Texas</option>
                <option>California</option>
                <option>Florida</option>
                <option>New York</option>
                <option>Pennsylvania</option>
                <option>Illinois</option>
                <option>Ohio</option>
                <option>Georgia</option>
                <option>North Carolina</option>
                <option>Michigan</option>
                <option>… (all 50)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                City / ZIP
              </label>
              <input
                type="text"
                required
                placeholder="Houston, TX or 77001"
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="mt-1.5 w-full rounded-[var(--r)] bg-teal py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-teal-dark"
            >
              Create Free Account
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
