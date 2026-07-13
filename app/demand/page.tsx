import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
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
.pd-wrap{font-family:'DM Sans',system-ui,sans-serif;color:#0b1222;background:#f6f5f0;min-height:100vh}
.pd-hero{max-width:1060px;margin:0 auto;padding:56px 24px 8px;text-align:center}
.pd-hero h1{font-family:'Fraunces',Georgia,serif;font-size:clamp(30px,5vw,46px);font-weight:900;letter-spacing:-1px;line-height:1.12;margin:0}
.pd-hero h1 em{color:#0d9488;font-style:normal}
.pd-hero p{margin:16px auto 0;font-size:17px;color:#3b4963;max-width:660px;line-height:1.6}
.pd-hoursline{margin-top:14px;font-size:13px;color:#7a8ba8}
.pd-tiles{display:flex;gap:14px;justify-content:center;margin:34px auto 0;max-width:980px;flex-wrap:wrap}
.pd-tile{background:#fff;border:1px solid rgba(11,18,34,0.08);border-radius:16px;padding:18px 22px;min-width:180px;flex:1 1 200px;max-width:235px}
.pd-tile .t{font-size:15px;font-weight:800;color:#0b1222;line-height:1.25}
.pd-tile .l{font-size:12px;color:#7a8ba8;margin-top:6px;line-height:1.35}
.pd-mapwrap{max-width:1060px;margin:38px auto 0;padding:0 24px}
.pd-mapcard{background:#fff;border:1px solid rgba(11,18,34,0.08);border-radius:24px;padding:18px;box-shadow:0 1px 3px rgba(11,18,34,0.04)}
.pulse-demand-map .state{fill:#eae9e4;stroke:none}
.pulse-demand-map .stateline{fill:none;stroke:#f6f5f0;stroke-width:1.1}
.pulse-demand-map .pin:hover circle:last-child{opacity:1}
.pulse-demand-map .pin:focus-visible circle:last-child{stroke:#2455ff;stroke-width:3}
.pd-legend{display:flex;gap:18px;justify-content:center;padding:12px 0 2px;font-size:13px;color:#7a8ba8}
.pd-legend .sw{display:inline-block;width:12px;height:12px;border-radius:50%;background:#0d9488;margin-right:6px;vertical-align:-1px}
.pd-mapnote{text-align:center;color:#7a8ba8;font-size:14px;padding:14px 8px 4px;line-height:1.5}
.pd-section{max-width:1060px;margin:46px auto;padding:0 24px}
.pd-section h2{font-family:'Fraunces',Georgia,serif;font-size:26px;font-weight:800;letter-spacing:-0.5px;margin:0}
.pd-section .sub{color:#7a8ba8;font-size:14px;margin-top:6px;line-height:1.5}
.demand-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(244px,1fr));gap:14px;margin-top:22px}
.demand-card{background:#fff;border:1px solid rgba(11,18,34,0.08);border-radius:16px;padding:18px;display:flex;flex-direction:column;box-shadow:0 1px 3px rgba(11,18,34,0.04)}
.demand-card-top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.demand-disc{font-size:12px;font-weight:700;border:1px solid;padding:3px 10px;border-radius:99px;white-space:nowrap}
.demand-need{font-size:12px;color:#7a8ba8;font-weight:600;white-space:nowrap}
.demand-card-city{font-size:18px;font-weight:700;margin-top:12px;color:#0b1222}
.demand-card-topic{font-size:14px;color:#3b4963;margin-top:4px}
.demand-card-note{font-size:12px;color:#7a8ba8;margin-top:10px}
.demand-claim{margin-top:14px;width:100%;background:#fff;color:#2455ff;border:1.5px solid #2455ff;border-radius:10px;padding:10px 0;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;transition:background .15s,color .15s}
.demand-claim:hover{background:#2455ff;color:#fff}
.demand-claim:disabled{opacity:0.6;cursor:default}
.demand-status{margin-top:14px;font-size:13px;color:#3b4963;line-height:1.45}
.demand-status a{color:#2455ff;font-weight:700;text-decoration:none}
.demand-ok{color:#0d9488;font-weight:600}
.demand-err{color:#e8604c}
.demand-empty{background:#fff;border:1px dashed rgba(11,18,34,0.18);border-radius:16px;padding:30px;text-align:center;color:#3b4963;font-size:15px;line-height:1.6;margin-top:22px}
.demand-empty a{color:#2455ff;font-weight:700;text-decoration:none}
.pd-how{background:#fff;border-top:1px solid rgba(11,18,34,0.08);border-bottom:1px solid rgba(11,18,34,0.08);padding:44px 24px;margin-top:56px}
.pd-how-inner{max-width:1060px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
.pd-step .k{font-size:12px;font-weight:800;letter-spacing:0.08em;color:#2455ff}
.pd-step h3{font-family:'Fraunces',Georgia,serif;font-size:18px;font-weight:800;margin:8px 0 0}
.pd-step p{font-size:14px;color:#3b4963;margin-top:8px;line-height:1.55}
.pd-trust{max-width:1060px;margin:32px auto;padding:0 24px 40px;text-align:center;color:#7a8ba8;font-size:13px;line-height:1.65}
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

      <LandingNav />

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "18px 24px 0" }}>
        <Link href="/" style={{ fontSize: 13, color: "#7a8ba8", textDecoration: "none", fontWeight: 600 }}>
          &larr; Back to home
        </Link>
      </div>

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
          <div className="pd-step"><div className="k">STEP 1</div><h3>Claim a request in your market</h3><p>Pick a professional in your referral territory. You sponsor their CE — less than the cost of a lunch-and-learn, and far more valuable.</p></div>
          <div className="pd-step"><div className="k">STEP 2</div><h3>They get CE, from you</h3><p>The professional completes nationally accredited CE, delivered with your name and organization as the sponsor.</p></div>
          <div className="pd-step"><div className="k">STEP 3</div><h3>You get the introduction</h3><p>Pulse connects you both. A warm referral-source relationship, started with a genuine favor.</p></div>
        </div>
      </div>

      <div className="pd-trust">
        All CE is provided by H.I.S. Cornerstone Continuing Education — ANCC-accredited provider, ASWB ACE provider #2082, serving healthcare professionals since 2007.
      </div>

      <Footer />
    </div>
  );
}
