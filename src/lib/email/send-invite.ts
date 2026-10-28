import { Resend } from "resend";

export async function sendInviteEmail({
  toEmail,
  inviteUrl,
  orgName,
  inviterName,
}: {
  toEmail: string;
  inviteUrl: string;
  orgName: string;
  inviterName: string;
}): Promise<{ error?: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Rinse Report <admin@rinsereport.com>",
    to: toEmail,
    subject: `${inviterName} invited you to join ${orgName} on Rinse Report`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e4df;overflow:hidden;">

        <!-- Header -->
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #e5e4df;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:28px;height:28px;background:#e8427c;border-radius:7px;text-align:center;vertical-align:middle;">
                <span style="color:#ffffff;font-size:13px;font-weight:700;line-height:28px;">R</span>
              </td>
              <td style="padding-left:10px;font-size:15px;font-weight:700;color:#1a1a18;letter-spacing:-0.3px;">Rinse Report</td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1a1a18;letter-spacing:-0.4px;">You've been invited</p>
          <p style="margin:0 0 16px;font-size:15px;color:#6b6b67;line-height:1.6;">
            <strong style="color:#1a1a18;">${inviterName}</strong> has invited you to join
            <strong style="color:#1a1a18;">${orgName}</strong> on Rinse Report.
          </p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b6b67;line-height:1.7;background:#f5f5f0;padding:14px 18px;border-radius:8px;">
            Rinse Report helps compliance teams identify suspicious activity, manage cases, and file AML reports with the FIU. Your team uses it to log suspicions, and write up STRs and SARs. It is also used to track investigations, and generate goAML-ready XML submissions.
          </p>

          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:#e8427c;border-radius:100px;">
              <a href="${inviteUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">Accept invitation</a>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:13px;color:#9b9b97;">Or copy this link into your browser:</p>
          <p style="margin:0;font-size:12px;color:#6b6b67;word-break:break-all;background:#f5f5f0;padding:10px 14px;border-radius:8px;font-family:monospace;">${inviteUrl}</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #e5e4df;">
          <p style="margin:0;font-size:12px;color:#9b9b97;line-height:1.6;">
            This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) return { error: error.message };
  return {};
}
