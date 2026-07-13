import type { Metadata } from "next";
import Link from "next/link";
import { getDemandData, type DemandData } from "@/lib/demand/data";
import { DemandMap } from "@/components/demand/DemandMap";
import { DemandCards } from "@/components/demand/DemandCards";

// Statically generated, revalidated every 5 min — no per-visitor DB queries.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Healthcare professionals near you are waiting for CE sponsors | Pulse",
  description:
    "Nurses, social workers, and case managers request free, nationally accredited CE. Local hospice, home health, and rehab reps sponsor it — and get the introduction. No account needed to look.",
  openGraph: {
    title: "Healthcare professionals near you are waiting for CE sponsors | Pulse",
    description:
      "See real, anonymized CE demand in your market. Sponsor a professional's free accredited CE and earn the introduction.",
    type: "website",
    url: "https://pulsereferrals.com/demand",
  },
  twitter: {
    card: "summary_large_image",
    title: "Healthcare professionals near you are waiting for CE sponsors | Pulse",
    description:
      "See real, anonymized CE demand in your market. Sponsor a professional's free accredited CE and earn the introduction.",
  },
};

const CSS = `
.pd-wrap{font-family:'DM Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;background:#F8FAFC;min-height:100vh}
.pd-nav{display:flex;justify-content:space-between;align-items:center;padding:18px clamp(16px,4vw,48px);background:#fff;border-bottom:1px solid #E2E8F0}
.pd-logo{font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#0F766E}
.pd-logo span{color:#1E293B}
.pd-cta{background:#0F766E;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px}
.pd-hero{max-width:1060px;margin:0 auto;padding:52px 24px 8px;text-align:center}
.pd-hero h1{font-size:clamp(28px,5vw,38px);letter-spacing:-1px;line-height:1.15;margin:0}
.pd-hero h1 em{color:#0F766E;font-style:normal}
.pd-hero p{margin:14px auto 0;font-size:17px;color:#475569;max-width:660px;line-height:1.55}
.pd-hoursline{margin-top:12px;font-size:13px;color:#64748B}
.pd-tiles{display:flex;gap:14px;justify-content:center;margin:34px auto 0;max-width:960px;flex-wrap:wrap}
.pd-tile{background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:16px 22px;min-width:180px;flex:1 1 200px;max-width:230px}
.pd-tile .t{font-size:15px;font-weight:800;color:#1E293B;line-height:1.25}
.pd-tile .l{font-size:12px;color:#64748B;margin-top:5px;line-height:1.35}
.pd-mapwrap{max-width:1060px;margin:36px auto 0;padding:0 24px}
.pd-mapcard{background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:18px}
.pulse-demand-map .state{fill:#EEF2F6;stroke:none}
.pulse-demand-map .stateline{fill:none;stroke:#FFFFFF;stroke-width:1.1}
.pulse-demand-map .pin:hover circle:last-child{opacity:1}
.pulse-demand-map .pin:focus-visible circle:last-child{stroke:#0F766E;stroke-width:3}
.pd-legend{display:flex;gap:18px;justify-content:center;padding:12px 0 2px;font-size:13px;color:#64748B}
.pd-legend .sw{display:inline-block;width:12px;height:12px;border-radius:50%;background:#0D9488;margin-right:6px;vertical-align:-1px}
.pd-mapnote{text-align:center;color:#64748B;font-size:14px;padding:14px 8px 4px}
.pd-section{max-width:1060px;margin:44px auto;padding:0 24px}
.pd-section h2{font-size:24px;letter-spacing:-0.5px;margin:0}
.pd-section .sub{color:#64748B;font-size:14px;margin-top:6px}
.demand-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-top:20px}
.demand-card{background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:16px;display:flex;flex-direction:column}
.demand-card-top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.demand-disc{font-size:12px;font-weight:700;border:1px solid;padding:3px 9px;border-radius:99px;white-space:nowrap}
.demand-need{font-size:12px;color:#64748B;font-weight:600;white-space:nowrap}
.demand-card-city{font-size:18px;font-weight:700;margin-top:12px;color:#1E293B}
.demand-card-topic{font-size:14px;color:#475569;margin-top:4px}
.demand-card-note{font-size:12px;color:#64748B;margin-top:10px}
.demand-claim{margin-top:14px;width:100%;background:#fff;color:#0F766E;border:1.5px solid #0F766E;border-radius:8px;padding:9px 0;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}
.demand-claim:hover{background:#0F766E;color:#fff}
.demand-claim:disabled{opacity:0.6;cursor:default}
.demand-status{margin-top:14px;font-size:13px;color:#475569;line-height:1.4}
.demand-status a{color:#0F766E;font-weight:700}
.demand-ok{color:#0F766E;font-weight:600}
.demand-err{color:#B91C1C}
.demand-empty{background:#fff;border:1px dashed #CBD5E1;border-radius:12px;padding:28px;text-align:center;color:#475569;font-size:15px;line-height:1.6;margin-top:20px}
.demand-empty a{color:#0F766E;font-weight:700}
.pd-how{background:#fff;border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;padding:40px 24px;margin-top:52px}
.pd-how-inner{max-width:1060px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.pd-step .k{font-size:13px;font-weight:800;color:#0F766E}
.pd-step h3{font-size:17px;margin:6px 0 0}
.pd-step p{font-size:14px;color:#475569;margin-top:6px;line-height:1.5}
.pd-trust{max-width:1060px;margin:28px auto;padding:0 24px 48px;text-align:center;color:#64748B;font-size:13px;line-height:1.6}
@media(max-width:720px){.pd-how-inner{grid-template-columns:1fr}}
`;

export default async function DemandPage() {
  let data: DemandData = { requests: [], dots: [], ceHoursDelivered: null };
  try {
    data = await getDemandData();
  } catch (e) {
    console.error("getDemandData failed; rendering empty demand page", e);
  }
  const { requests, dots, ceHoursDelivered } = data;

  return (
    <div className="pd-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav className="pd-nav">
        <Link href="/" className="pd-logo" style={{ textDecoration: "none" }}>
          pulse<span>referrals</span>
        </Link>
        <Link href="/signup?type=sales" className="pd-cta">Sign up free</Link>
      </nav>

      <header className="pd-hero">
        <h1>
          Licensed professionals near you are <em>waiting for a CE sponsor.</em>
        </h1>
        <p>
          Nurses, social workers, and case managers request free accredited CE on Pulse.
          Local hospice, home health, and rehab reps sponsor it — and get the introduction.
          No account needed to look.
        </p>
        {ceHoursDelivered !== null && (
          <div className="pd-hoursline">{ceHoursDelivered.toLocaleString()} CE hours delivered to professionals so far</div>
        )}
        <div className="pd-tiles">
          <div className="pd-tile"><div className="t">50 states</div><div className="l">covered by our accreditation</div></div>
          <div className="pd-tile"><div className="t">Nurses, social workers &amp; case managers</div><div className="l">request CE every week</div></div>
          <div className="pd-tile"><div className="t">Nationally accredited since 2007</div><div className="l">ANCC &amp; ASWB ACE</div></div>
          <div className="pd-tile"><div className="t">Always free</div><div className="l">for professionals</div></div>
        </div>
      </header>

      <div className="pd-mapwrap">
        <div className="pd-mapcard">
          <DemandMap dots={dots} />
          <div className="pd-legend"><span><span className="sw" />Open CE request</span></div>
          {dots.length === 0 && (
            <div className="pd-mapnote">
              New requests appear on the map as professionals ask for CE in their area. Here&apos;s how it works &darr;
            </div>
          )}
        </div>
      </div>

      <section className="pd-section">
        <h2>Open requests</h2>
        <div className="sub">Each is a licensed professional with a verified profile. Claim one to sponsor their CE and start the relationship.</div>
        <DemandCards requests={requests} />
      </section>

      <div className="pd-how">
        <div className="pd-how-inner">
          <div className="pd-step"><div className="k">STEP 1</div><h3>Claim a request in your market</h3><p>Pick a professional in your referral territory. Claiming is free — we cover the CE.</p></div>
          <div className="pd-step"><div className="k">STEP 2</div><h3>They get CE, from you</h3><p>The professional completes nationally accredited CE, delivered with your name and organization as the sponsor.</p></div>
          <div className="pd-step"><div className="k">STEP 3</div><h3>You get the introduction</h3><p>Pulse connects you both. A warm referral-source relationship, started with a genuine favor.</p></div>
        </div>
      </div>

      <div className="pd-trust">
        All CE is provided by H.I.S. Cornerstone Continuing Education — ANCC-accredited provider, ASWB ACE provider #2082, serving healthcare professionals since 2007.
      </div>
    </div>
  );
}
