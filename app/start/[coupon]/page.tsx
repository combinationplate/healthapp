import { createClient as createServiceClient } from "@supabase/supabase-js";
import StartButton from "./StartButton";

export const dynamic = "force-dynamic";

/**
 * Interstitial landing for CE email links (/r/[coupon] redirects here).
 * Rendering this page has NO side effects — clicked_at / redeemed_at are only
 * stamped when the human presses the button (POST /api/ce/redeem), which makes
 * billing scanner-bot-proof.
 */
export default async function StartCoursePage({
  params,
}: {
  params: Promise<{ coupon: string }>;
}) {
  const { coupon } = await params;
  const code = decodeURIComponent(coupon).trim().toUpperCase();

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: ceSend } = await admin
    .from("ce_sends")
    .select("id, coupon_code, course_name, course_hours, discount, redeemed_at, rep_id, professional_id")
    .eq("coupon_code", code)
    .single();

  let repName = "";
  if (ceSend?.rep_id) {
    const { data: rep } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", ceSend.rep_id)
      .single();
    repName = rep?.full_name ?? "";
  }

  // Prefill the certificate-name fields from what we have on file; the
  // professional confirms or corrects before enrollment.
  let initialFirst = "";
  let initialLast = "";
  if (ceSend?.professional_id) {
    const { data: proRow } = await admin
      .from("professionals")
      .select("name")
      .eq("id", ceSend.professional_id)
      .single();
    const parts = (proRow?.name ?? "").trim().split(/\s+/).filter(Boolean);
    initialFirst = parts[0] ?? "";
    initialLast = parts.slice(1).join(" ");
  }

  const isFree = ceSend?.discount === "100% Free";
  const alreadyStarted = Boolean(ceSend?.redeemed_at);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f5f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#0b1222",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 8px 30px rgba(11, 18, 34, 0.08)",
          maxWidth: 460,
          width: "100%",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        {ceSend ? (
          <>
            <div style={{ fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase", color: "#0d9488", fontWeight: 700, marginBottom: 12 }}>
              {isFree ? "Your free CE course" : `Your CE course — ${ceSend.discount}`}
            </div>
            <h1
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                fontSize: 28,
                lineHeight: 1.2,
                margin: "0 0 8px",
              }}
            >
              {ceSend.course_name}
            </h1>
            <p style={{ color: "#5b6474", fontSize: 15, margin: "0 0 4px" }}>
              {ceSend.course_hours} contact hour{Number(ceSend.course_hours) === 1 ? "" : "s"}
            </p>
            {repName ? (
              <p style={{ color: "#5b6474", fontSize: 15, margin: "0 0 24px" }}>
                Sent to you by <strong style={{ color: "#0b1222" }}>{repName}</strong>
              </p>
            ) : (
              <div style={{ marginBottom: 24 }} />
            )}

            {alreadyStarted && (
              <p style={{ fontSize: 14, color: "#0d9488", margin: "0 0 16px" }}>
                Welcome back — pick up right where you left off.
              </p>
            )}

            <StartButton
              coupon={code}
              label={
                alreadyStarted
                  ? "Return to Your Course"
                  : isFree
                    ? "Start Your Course"
                    : "Continue to Checkout"
              }
              collectName={isFree}
              initialFirst={initialFirst}
              initialLast={initialLast}
            />

            <p style={{ fontSize: 13, color: "#8a91a0", marginTop: 20, lineHeight: 1.5 }}>
              {isFree
                ? "You'll be taken to hiscornerstone.com and dropped straight into your course — no password or checkout needed."
                : `You'll be taken to hiscornerstone.com with your ${ceSend.discount.toLowerCase()} discount already applied at checkout.`}
            </p>
          </>
        ) : (
          <>
            <h1
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                fontSize: 24,
                lineHeight: 1.25,
                margin: "0 0 12px",
              }}
            >
              This course link isn&apos;t valid
            </h1>
            <p style={{ color: "#5b6474", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              It may have expired or been mistyped. Reach out to the person who sent
              it to you and ask them to resend your course — it only takes them a
              few seconds.
            </p>
          </>
        )}

        <p style={{ fontSize: 12, color: "#b3b9c4", marginTop: 28, marginBottom: 0 }}>
          Powered by Pulse · pulsereferrals.com
        </p>
      </div>
    </main>
  );
}
