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
          <form action="/auth/signout" method="POST">
            <button type="submit" className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:border-[var(--coral)] hover:text-[var(--coral)]">
              Sign out
            </button>
          </form>
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
    </header>
  );
}
