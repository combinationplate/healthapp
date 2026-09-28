"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  displayName: string;
  roleLabel: string | null;
  onSwitchRole?: () => void;
};

export function AppHeader({ displayName, roleLabel, onSwitchRole }: Props) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackState, setFeedbackState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteState, setDeleteState] = useState<"idle" | "deleting" | "deleted" | "error">("idle");
  const [deleteError, setDeleteError] = useState("");
  const isPro = !roleLabel || roleLabel === "Professional";

  function closeDelete() {
    if (deleteState === "deleting" || deleteState === "deleted") return;
    setDeleteOpen(false);
    setDeleteConfirm("");
    setDeleteState("idle");
    setDeleteError("");
  }

  async function deleteAccount() {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") return;
    setDeleteState("deleting");
    setDeleteError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data?.message || "Something went wrong — please try again.");
        setDeleteState("error");
        return;
      }
      setDeleteState("deleted");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch {
      setDeleteError("Something went wrong — please try again.");
      setDeleteState("error");
    }
  }

  async function submitFeedback() {
    const message = feedbackText.trim();
    if (!message) return;
    setFeedbackState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, page: typeof window !== "undefined" ? window.location.pathname : undefined }),
      });
      if (!res.ok) throw new Error("failed");
      setFeedbackState("sent");
      setFeedbackText("");
      setTimeout(() => {
        setFeedbackOpen(false);
        setFeedbackState("idle");
      }, 1800);
    } catch {
      setFeedbackState("error");
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-8">
        <Link href="/app" className="flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-xl font-extrabold text-[var(--ink)]">
          <svg width={28} height={18} viewBox="0 0 36 24"><path d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12" fill="none" stroke="#2455FF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
          Pulse
        </Link>
        <nav className="flex items-center gap-3">
          {displayName && (
            <span className="hidden text-sm font-medium text-[var(--ink)] sm:inline">
              {displayName}
            </span>
          )}
          {onSwitchRole && (
            <button
              type="button"
              onClick={onSwitchRole}
              className="text-sm text-[var(--ink-muted)] underline hover:text-[var(--ink-soft)]"
            >
              Switch role
            </button>
          )}
          {roleLabel && (
            <span className="rounded-lg bg-[var(--blue-glow)] px-3 py-1.5 text-xs font-semibold text-[var(--blue)]">
              {roleLabel}
            </span>
          )}
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
          >
            Feedback
          </button>
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
            >
              Account ▾
            </button>
            {menuOpen && (
              <>
                {/* click-away layer */}
                <div className="fixed inset-0 z-[55]" onClick={() => setMenuOpen(false)} />
                <div
                  role="menu"
                  className="absolute right-0 z-[60] mt-2 w-48 overflow-hidden rounded-lg border border-[var(--border)] bg-white py-1 shadow-lg"
                >
                  <form action="/auth/signout" method="POST">
                    <button
                      type="submit"
                      role="menuitem"
                      className="block w-full px-4 py-2 text-left text-sm font-semibold text-[var(--ink-soft)] hover:bg-[var(--cream)]"
                    >
                      Sign out
                    </button>
                  </form>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteOpen(true);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm font-semibold text-[var(--coral)] hover:bg-[var(--cream)]"
                  >
                    Delete account
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>
      </div>

      {feedbackOpen && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center bg-[var(--ink)]/50 backdrop-blur-sm"
          onClick={() => feedbackState !== "sending" && setFeedbackOpen(false)}
        >
          <div
            className="w-[92%] max-w-[440px] rounded-xl border border-[var(--border)] bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="font-[family-name:var(--font-fraunces)] text-lg font-extrabold text-[var(--ink)]">
                Send us feedback
              </h3>
              <button
                type="button"
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cream)] text-[var(--ink-soft)] hover:bg-[var(--border)]"
                onClick={() => feedbackState !== "sending" && setFeedbackOpen(false)}
              >
                ×
              </button>
            </div>
            {feedbackState === "sent" ? (
              <p className="py-3 text-sm font-semibold text-[var(--teal)]">
                Thank you — we read every note.
              </p>
            ) : (
              <>
                <p className="mb-3 text-[13px] text-[var(--ink-muted)]">
                  Bug, idea, or something confusing? Tell us — we&apos;re building Pulse with you.
                </p>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="What&apos;s on your mind?"
                  className="w-full resize-none rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--blue)] focus:outline-none"
                />
                {feedbackState === "error" && (
                  <p className="mt-2 text-[13px] text-[var(--coral)]">Something went wrong — please try again.</p>
                )}
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)]"
                    onClick={() => setFeedbackOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={feedbackState === "sending" || !feedbackText.trim()}
                    onClick={submitFeedback}
                    className="rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {feedbackState === "sending" ? "Sending…" : "Send feedback"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {deleteOpen && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center bg-[var(--ink)]/50 backdrop-blur-sm"
          onClick={closeDelete}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-[92%] max-w-[460px] rounded-xl border border-[var(--border)] bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {deleteState === "deleted" ? (
              <div className="py-2">
                <h3 className="mb-2 font-[family-name:var(--font-fraunces)] text-lg font-extrabold text-[var(--ink)]">
                  Your account has been deleted
                </h3>
                <p className="text-sm text-[var(--ink-muted)]">Thanks for trying Pulse. Taking you home…</p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-[family-name:var(--font-fraunces)] text-lg font-extrabold text-[var(--ink)]">
                    Delete your Pulse account?
                  </h3>
                  <button
                    type="button"
                    aria-label="Close"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cream)] text-[var(--ink-soft)] hover:bg-[var(--border)]"
                    onClick={closeDelete}
                  >
                    ×
                  </button>
                </div>
                <ul className="mb-4 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-[var(--ink-soft)]">
                  {isPro ? (
                    <>
                      <li>Your profile, CE requests, and Pulse emails are removed permanently.</li>
                      <li>
                        Courses you&apos;ve started on hiscornerstone.com — and your certificates — stay in your
                        H.I.S. Cornerstone account.
                      </li>
                    </>
                  ) : (
                    <>
                      <li>Your profile, contact list, and any CE requests you&apos;ve claimed are removed permanently.</li>
                      <li>
                        If you&apos;ve sent CE courses or have billing history, we&apos;ll ask you to email support so
                        nothing billable is lost.
                      </li>
                    </>
                  )}
                  <li>This can&apos;t be undone.</li>
                </ul>
                <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink)]">
                  Type <span className="font-mono text-[var(--coral)]">DELETE</span> to confirm
                </label>
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  autoComplete="off"
                  className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--coral)] focus:outline-none"
                />
                {deleteState === "error" && deleteError && (
                  <p className="mt-2 text-[13px] text-[var(--coral)]">{deleteError}</p>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)]"
                    onClick={closeDelete}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleteState === "deleting" || deleteConfirm.trim().toUpperCase() !== "DELETE"}
                    onClick={deleteAccount}
                    className="rounded-lg bg-[var(--coral)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {deleteState === "deleting" ? "Deleting…" : "Delete my account"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
