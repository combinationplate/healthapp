const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pulsereferrals.com";

function wrap(body: string): string {
  return `
<div style="font-family:'DM Sans',system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0b1222;">
  <div style="padding:32px;">
    <div style="margin-bottom:24px;">
      <svg width="32" height="32" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="56" height="56" rx="14" fill="#0b1222"/>
        <path d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28" stroke="url(#g)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <defs><linearGradient id="g" x1="10" y1="28" x2="46" y2="28"><stop stop-color="#6B8AFF"/><stop offset="1" stop-color="#5EEAD4"/></linearGradient></defs>
      </svg>
    </div>
    ${body}
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(11,18,34,0.08);font-size:12px;color:#7a8ba8;">
      Pulse · Free CE distribution for healthcare teams · <a href="${APP_URL}" style="color:#2455ff;text-decoration:none;">pulsereferrals.com</a>
    </div>
  </div>
</div>`;
}

function btn(text: string, href: string, color: string = "#2455ff"): string {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;font-weight:700;padding:14px 32px;border-radius:10px;font-size:15px;text-decoration:none;margin:8px 0;">${text}</a>`;
}

export function getEmailHtml(template: string, data: { name?: string; email?: string }): string {
  const firstName = data.name?.split(/\s+/)[0] || "there";

  switch (template) {
    case "rep-welcome-0":
      return wrap(`
        <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;">Welcome to Pulse, ${firstName}!</h1>
        <p style="font-size:15px;color:#3b4963;line-height:1.7;">
          You're set up and ready to start building referral relationships with free CE courses.
          Here's how to send your first CE in 60 seconds:
        </p>
        <ol style="font-size:14px;color:#3b4963;line-height:2;padding-left:20px;">
          <li><strong>Add a professional</strong> — a nurse, social worker, or case manager you work with</li>
          <li><strong>Pick a course</strong> — ethics, palliative care, mental health, and more</li>
          <li><strong>Hit send</strong> — they get a free CE course by email instantly</li>
        </ol>
        ${btn("Open Your Dashboard →", `${APP_URL}/app`)}
        <p style="font-size:13px;color:#7a8ba8;margin-top:16px;">
          You can also generate a QR code and branded flyer to leave at facilities.
        </p>
      `);

    case "rep-welcome-1":
      return wrap(`
        <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;">Your QR Code Is Ready</h1>
        <p style="font-size:15px;color:#3b4963;line-height:1.7;">
          Hi ${firstName} — heading to a facility soon? Generate a QR code flyer from your dashboard.
          When a nurse scans it, they enter their email and get a free CE course instantly.
          No app needed, takes 10 seconds.
        </p>
        <p style="font-size:15px;color:#3b4963;line-height:1.7;">
          Print it, or just show the QR code on your phone. Either way, it's the easiest
          way to distribute CEs at a facility visit.
        </p>
        ${btn("Generate Your QR Flyer →", `${APP_URL}/app`)}
      `);

    case "rep-welcome-2":
      return wrap(`
        <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;">3 Ways to Use Pulse at Your Next Visit</h1>
        <p style="font-size:15px;color:#3b4963;line-height:1.7;">
          Hi ${firstName} — here are the ways reps are using Pulse in the field:
        </p>
        <div style="background:#f6f5f0;border-radius:12px;padding:20px;margin:16px 0;">
          <p style="font-size:14px;color:#0b1222;margin:0 0 12px;"><strong>1. Direct Send</strong> — know the nurse's email? Send them a free CE right from your dashboard. Takes 10 seconds.</p>
          <p style="font-size:14px;color:#0b1222;margin:0 0 12px;"><strong>2. QR Code</strong> — show the QR on your phone or leave a printed flyer. Nurses scan, enter email, get their CE.</p>
          <p style="font-size:14px;color:#0b1222;margin:0;"><strong>3. Bulk Send</strong> — got a list of contacts? Upload a CSV or select from your network and send to everyone at once.</p>
        </div>
        ${btn("Go to Dashboard →", `${APP_URL}/app`)}
      `);

    case "rep-welcome-3":
      return wrap(`
        <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;">Need Help Getting Started?</h1>
        <p style="font-size:15px;color:#3b4963;line-height:1.7;">
          Hi ${firstName} — I noticed you haven't sent your first CE yet. No pressure —
          just wanted to make sure everything's working for you.
        </p>
        <p style="font-size:15px;color:#3b4963;line-height:1.7;">
          The quickest way to try it: add one professional to your network (just a name and email),
          pick any course, and hit send. They'll get a free accredited CE course in their inbox.
        </p>
        ${btn("Send Your First CE →", `${APP_URL}/app`)}
        <p style="font-size:13px;color:#7a8ba8;margin-top:16px;">
          Have questions? Just reply to this email.
        </p>
      `);

    case "pro-welcome-0":
      return wrap(`
        <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;">Welcome to Pulse, ${firstName}!</h1>
        <p style="font-size:15px;color:#3b4963;line-height:1.7;">
          You now have access to free, nationally accredited CE courses — no cost, no catch.
          Here's how it works:
        </p>
        <ol style="font-size:14px;color:#3b4963;line-height:2;padding-left:20px;">
          <li><strong>Request a CE</strong> — tell us the topic and hours you need</li>
          <li><strong>A local rep sponsors it</strong> — hospice, home health, and rehab teams cover the cost</li>
          <li><strong>You complete it free</strong> — accredited, online, self-paced, certificate issued instantly</li>
        </ol>
        ${btn("Request Your First CE →", `${APP_URL}/app`, "#0d9488")}
        <p style="font-size:13px;color:#7a8ba8;margin-top:16px;">
          Courses cover ethics, palliative care, mental health, chronic disease management, and more —
          approved for RNs, LPNs, MSWs, LCSWs, case managers, PTs, OTs, and SLPs.
        </p>
      `);

    case "pro-welcome-1":
      return wrap(`
        <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;">Your First Free CE Is One Request Away</h1>
        <p style="font-size:15px;color:#3b4963;line-height:1.7;">
          Hi ${firstName} — need CE hours before your next renewal? Open your dashboard,
          tap <strong>Request CE</strong>, and tell us the topic and hours you need.
          A local rep sponsors the course and you complete it free — accredited,
          online, and self-paced.
        </p>
        ${btn("Request a Free CE →", `${APP_URL}/app`, "#0d9488")}
        <p style="font-size:13px;color:#7a8ba8;margin-top:16px;">
          The more specific your request, the faster it gets picked up.
        </p>
      `);

    case "pro-welcome-2":
      return wrap(`
        <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;">Know a Rep? Get Your CE Faster</h1>
        <p style="font-size:15px;color:#3b4963;line-height:1.7;">
          Hi ${firstName} — when you request a CE, you can invite a rep you already work with —
          a hospice, home health, or rehab rep who visits your facility. They'll get an email,
          join Pulse free, and sponsor your course. You get your CE faster, and they get to
          be the one who helped.
        </p>
        <p style="font-size:15px;color:#3b4963;line-height:1.7;">
          No rep in mind? Just submit the request — open requests are visible to local
          sponsors looking for professionals to support.
        </p>
        ${btn("Request a CE Course →", `${APP_URL}/app`, "#0d9488")}
      `);

    default:
      return wrap(`
        <p style="font-size:15px;color:#3b4963;line-height:1.7;">
          Visit your Pulse dashboard to get started.
        </p>
        ${btn("Go to Dashboard →", `${APP_URL}/app`)}
      `);
  }
}
