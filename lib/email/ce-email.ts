function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type CeEmailParams = {
  recipientName: string;
  courseName: string;
  courseHours: number;
  couponCode: string;
  accessUrl: string;
  discount: string;
  repName: string;
  repEmail?: string;
  repOrgName?: string;
  personalMessage?: string;
};

export function buildCeEmailSubject(p: CeEmailParams): string {
  return `Free CE Course${p.repOrgName ? ` from ${p.repOrgName}` : ""}: ${p.courseName}`;
}

export function buildCeEmailHtml(p: CeEmailParams): string {
  const firstName = p.recipientName.split(/\s+/)[0];

  const sponsorLine = p.repOrgName
    ? `<span style="color:rgba(255,255,255,0.85);font-size:14px;">Compliments of</span><br/><strong style="color:#ffffff;font-size:22px;">${escapeHtml(p.repOrgName)}</strong><br/><span style="color:rgba(255,255,255,0.65);font-size:13px;">${escapeHtml(p.repName)}</span>`
    : `<span style="color:rgba(255,255,255,0.85);font-size:14px;">Compliments of</span><br/><strong style="color:#ffffff;font-size:22px;">${escapeHtml(p.repName)}</strong>`;

  const personalBlock = p.personalMessage?.trim()
    ? `<tr><td style="padding:0 40px 24px;">
        <div style="background:#f6f5f0;border-radius:10px;padding:16px 20px;border-left:3px solid #0d9488;">
          <div style="font-size:11px;font-weight:700;color:#7a8ba8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Message from ${escapeHtml(p.repName)}</div>
          <div style="font-size:14px;color:#3b4963;line-height:1.6;">${escapeHtml(p.personalMessage.trim())}</div>
        </div>
      </td></tr>`
    : "";

  const discountLabel = p.discount === "100% Free" ? "Free CE Course" : `CE Course (${escapeHtml(p.discount)})`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f6f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f0;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

  <!-- Sponsor banner -->
  <tr><td style="background:linear-gradient(135deg,#0b1222,#1a2744);padding:28px 40px;">
    <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">
      ${discountLabel}
    </div>
    ${sponsorLine}
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:32px 40px 16px;">
    <p style="margin:0;font-size:16px;color:#0b1222;line-height:1.5;">
      Hi ${escapeHtml(firstName)},
    </p>
    <p style="margin:8px 0 0;font-size:15px;color:#3b4963;line-height:1.6;">
      You've been sent a free, nationally accredited continuing education course. Here are the details:
    </p>
  </td></tr>

  <!-- Course card -->
  <tr><td style="padding:0 40px 24px;">
    <div style="background:#f6f5f0;border-radius:12px;padding:20px 24px;border:1px solid rgba(11,18,34,0.06);">
      <div style="font-size:18px;font-weight:700;color:#0b1222;line-height:1.3;margin-bottom:6px;">
        ${escapeHtml(p.courseName)}
      </div>
      <div style="font-size:14px;color:#3b4963;">
        ${p.courseHours} credit hour${p.courseHours !== 1 ? "s" : ""} · Nationally Accredited · ${escapeHtml(p.discount)}
      </div>
    </div>
  </td></tr>

  ${personalBlock}

  <!-- Coupon code -->
  <tr><td style="padding:0 40px 24px;">
    <div style="background:#ffffff;border:2px dashed rgba(11,18,34,0.12);border-radius:10px;padding:16px;text-align:center;">
      <div style="font-size:12px;color:#7a8ba8;margin-bottom:6px;">Your coupon code</div>
      <div style="font-size:24px;font-weight:800;color:#0b1222;letter-spacing:0.02em;">${escapeHtml(p.couponCode)}</div>
    </div>
  </td></tr>

  <!-- CTA button -->
  <tr><td style="padding:0 40px 28px;" align="center">
    <a href="${escapeHtml(p.accessUrl)}" style="display:inline-block;background:#2455ff;color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:10px;font-size:16px;font-weight:700;box-shadow:0 4px 16px rgba(36,85,255,0.25);">
      Access Your Course &rarr;
    </a>
  </td></tr>

  <!-- How it works steps -->
  <tr><td style="padding:0 40px 28px;">
    <div style="font-size:11px;font-weight:700;color:#7a8ba8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">
      How to access your course
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="28" valign="top" style="padding-bottom:10px;">
          <div style="width:24px;height:24px;border-radius:6px;background:#0b1222;color:#ffffff;font-size:12px;font-weight:800;text-align:center;line-height:24px;">1</div>
        </td>
        <td style="padding:2px 0 10px 10px;font-size:14px;color:#3b4963;">Click "Access Your Course" above</td>
      </tr>
      <tr>
        <td width="28" valign="top" style="padding-bottom:10px;">
          <div style="width:24px;height:24px;border-radius:6px;background:#0b1222;color:#ffffff;font-size:12px;font-weight:800;text-align:center;line-height:24px;">2</div>
        </td>
        <td style="padding:2px 0 10px 10px;font-size:14px;color:#3b4963;">You'll be taken to HISCornerstone.com with your discount applied</td>
      </tr>
      <tr>
        <td width="28" valign="top">
          <div style="width:24px;height:24px;border-radius:6px;background:#0d9488;color:#ffffff;font-size:12px;font-weight:800;text-align:center;line-height:24px;">3</div>
        </td>
        <td style="padding:2px 0 0 10px;font-size:14px;color:#3b4963;">Complete your course online — self-paced, any device</td>
      </tr>
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 40px;"><div style="border-top:1px solid rgba(11,18,34,0.06);"></div></td></tr>

  <!-- Rep contact -->
  <tr><td style="padding:20px 40px;">
    <div style="font-size:13px;color:#7a8ba8;">
      Questions? Contact <strong style="color:#0b1222;">${escapeHtml(p.repName)}</strong>${p.repEmail ? ` at <a href="mailto:${escapeHtml(p.repEmail)}" style="color:#2455ff;text-decoration:none;">${escapeHtml(p.repEmail)}</a>` : ""}${p.repOrgName ? ` · ${escapeHtml(p.repOrgName)}` : ""}
    </div>
  </td></tr>

  <!-- Fallback link -->
  <tr><td style="padding:0 40px 12px;">
    <div style="font-size:11px;color:#7a8ba8;line-height:1.5;">
      If the button above doesn't work, copy and paste this link into your browser:<br/>
      <a href="${escapeHtml(p.accessUrl)}" style="color:#2455ff;word-break:break-all;">${escapeHtml(p.accessUrl)}</a>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 40px 28px;">
    <div style="font-size:11px;color:#7a8ba8;text-align:center;">
      Powered by <strong>Pulse</strong> · <a href="https://hiscornerstone.com" style="color:#7a8ba8;">HISCornerstone.com</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

export function buildCeEmailText(p: CeEmailParams): string {
  return [
    `Hi ${p.recipientName.split(/\s+/)[0]},`,
    ``,
    `You've been sent a free, nationally accredited CE course${p.repOrgName ? ` from ${p.repOrgName}` : ""}.`,
    ``,
    `Course: ${p.courseName}`,
    `Hours: ${p.courseHours} credit hour${p.courseHours !== 1 ? "s" : ""}`,
    `Discount: ${p.discount}`,
    `Coupon Code: ${p.couponCode}`,
    p.personalMessage?.trim() ? `\nMessage from ${p.repName}: ${p.personalMessage.trim()}\n` : ``,
    ``,
    `Access your course here (discount auto-applied):`,
    p.accessUrl,
    ``,
    `How to access:`,
    `1. Click the link above`,
    `2. You'll be taken to HISCornerstone.com with your discount applied`,
    `3. Complete your course online — self-paced, any device`,
    ``,
    `Questions? Contact ${p.repName}${p.repEmail ? ` at ${p.repEmail}` : ""}${p.repOrgName ? ` · ${p.repOrgName}` : ""}`,
    ``,
    `— Powered by Pulse · HISCornerstone.com`,
  ].join("\n");
}
