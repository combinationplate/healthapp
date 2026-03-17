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
  const firstName = p.repName.split(/\s+/)[0];
  return p.repOrgName
    ? `${firstName} from ${p.repOrgName} sent you a CE course`
    : `${firstName} sent you a CE course`;
}

export function buildCeEmailHtml(p: CeEmailParams): string {
  const recipientFirst = p.recipientName.split(/\s+/)[0];
  const repFirst = p.repName.split(/\s+/)[0];

  const personalBlock = p.personalMessage?.trim()
    ? `<p style="margin:16px 0;padding:12px 16px;background:#f9f9f6;border-left:3px solid #0d9488;border-radius:4px;font-size:14px;color:#3b4963;line-height:1.6;">${escapeHtml(p.personalMessage.trim())}</p>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;text-align:left;">
<tr><td>

  <p style="margin:0 0 16px;font-size:15px;color:#0b1222;line-height:1.6;">
    Hi ${escapeHtml(recipientFirst)},
  </p>

  <p style="margin:0 0 16px;font-size:15px;color:#3b4963;line-height:1.6;">
    ${escapeHtml(repFirst)}${p.repOrgName ? ` at ${escapeHtml(p.repOrgName)}` : ""} sent you a complimentary continuing education course:
  </p>

  <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#0b1222;">
    ${escapeHtml(p.courseName)}
  </p>
  <p style="margin:0 0 20px;font-size:14px;color:#7a8ba8;">
    ${p.courseHours} credit hour${p.courseHours !== 1 ? "s" : ""} &middot; Nationally accredited &middot; Online, self-paced
  </p>

  ${personalBlock}

  <p style="margin:0 0 20px;">
    <a href="${escapeHtml(p.accessUrl)}" style="display:inline-block;background:#2455ff;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">
      Access Your Course
    </a>
  </p>

  <p style="margin:0 0 8px;font-size:13px;color:#7a8ba8;">
    Your coupon code: <strong style="color:#0b1222;">${escapeHtml(p.couponCode)}</strong>
  </p>

  <p style="margin:0 0 24px;font-size:13px;color:#7a8ba8;line-height:1.5;">
    Click the button above, then complete checkout on HISCornerstone.com with your coupon applied. The course is 100% online and self-paced.
  </p>

  <p style="margin:0;font-size:13px;color:#7a8ba8;line-height:1.5;">
    ${escapeHtml(p.repName)}${p.repEmail ? `<br/><a href="mailto:${escapeHtml(p.repEmail)}" style="color:#2455ff;text-decoration:none;">${escapeHtml(p.repEmail)}</a>` : ""}${p.repOrgName ? `<br/>${escapeHtml(p.repOrgName)}` : ""}
  </p>

</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export function buildCeEmailText(p: CeEmailParams): string {
  const recipientFirst = p.recipientName.split(/\s+/)[0];
  const repFirst = p.repName.split(/\s+/)[0];
  return [
    `Hi ${recipientFirst},`,
    ``,
    `${repFirst}${p.repOrgName ? ` at ${p.repOrgName}` : ""} sent you a complimentary continuing education course:`,
    ``,
    `${p.courseName}`,
    `${p.courseHours} credit hour${p.courseHours !== 1 ? "s" : ""} - Nationally accredited - Online, self-paced`,
    ``,
    p.personalMessage?.trim() ? `"${p.personalMessage.trim()}"` : ``,
    p.personalMessage?.trim() ? `` : ``,
    `Access your course: ${p.accessUrl}`,
    ``,
    `Coupon code: ${p.couponCode}`,
    ``,
    `Click the link, then complete checkout on HISCornerstone.com with your coupon applied.`,
    ``,
    `${p.repName}`,
    p.repEmail ? p.repEmail : ``,
    p.repOrgName ? p.repOrgName : ``,
  ].filter(line => line !== undefined).join("\n");
}

