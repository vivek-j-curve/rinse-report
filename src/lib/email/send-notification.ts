import { Resend } from "resend";

export async function sendNotificationEmail({
  toEmail,
  toName,
  subject,
  body,
  actionUrl,
}: {
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
  actionUrl?: string;
}): Promise<{ error?: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.rinsereport.com";
  const url = actionUrl ?? appUrl;

  const { error } = await resend.emails.send({
    from: "Rinse Report <admin@rinsereport.com>",
    to: toEmail,
    subject,
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
          <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1a1a18;letter-spacing:-0.3px;">Hi ${toName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#6b6b67;line-height:1.6;">${body}</p>

          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#e8427c;border-radius:100px;">
              <a href="${url}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">View in Rinse Report</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #e5e4df;">
          <p style="margin:0;font-size:12px;color:#9b9b97;line-height:1.6;">
            You're receiving this because you're an admin or owner in your organisation on Rinse Report.
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
