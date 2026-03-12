export const metadata = {
  title: "Contact Pulse",
  description: "Get in touch with the Pulse team for questions, support, and billing.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--cream)] px-6 py-12 text-[var(--ink)]">
      <div className="mx-auto max-w-xl rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <h1 className="mb-3 font-[family-name:var(--font-fraunces)] text-2xl font-extrabold">
          Have a question?
        </h1>
        <p className="mb-6 text-sm text-[var(--ink-soft)]">
          We&apos;d love to hear from you. The fastest way to reach us is by email.
        </p>

        <div className="space-y-4 text-sm">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              General &amp; Sales
            </h2>
            <p className="mt-1">
              Email{" "}
              <a
                href="mailto:hello@pulsereferrals.com"
                className="font-semibold text-[var(--blue)] hover:underline"
              >
                hello@pulsereferrals.com
              </a>
              . We typically reply within a few hours during business days.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Product Support
            </h2>
            <p className="mt-1">
              Reps and managers can reach our support team at{" "}
              <a
                href="mailto:support@pulsereferrals.com"
                className="font-semibold text-[var(--blue)] hover:underline"
              >
                support@pulsereferrals.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Billing
            </h2>
            <p className="mt-1">
              For questions about invoices or pricing, email{" "}
              <a
                href="mailto:billing@pulsereferrals.com"
                className="font-semibold text-[var(--blue)] hover:underline"
              >
                billing@pulsereferrals.com
              </a>
              .
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs text-[var(--ink-muted)]">
          Please include your name, organization, and—if you&apos;re comfortable—your phone number so we
          can follow up quickly for enterprise or manager requests.
        </p>
      </div>
    </main>
  );
}

