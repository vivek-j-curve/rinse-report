import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { name, email, mobile, company, jobTitle } = await req.json();

  if (!name || !email || !mobile || !company || !jobTitle) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "Rinse Report <noreply@rinsereport.com>",
    to: "vivek@jcurve.co.nz",
    subject: `New call request: ${name} — ${company}`,
    html: `
      <p style="font-family:sans-serif;font-size:14px;color:#15171A;line-height:1.6">
        A new call request has been submitted via the Rinse Report landing page.
      </p>
      <table style="font-family:sans-serif;font-size:14px;color:#15171A;border-collapse:collapse;margin-top:16px">
        <tr><td style="padding:6px 24px 6px 0;color:#6B7280;white-space:nowrap">Name</td><td style="padding:6px 0"><strong>${name}</strong></td></tr>
        <tr><td style="padding:6px 24px 6px 0;color:#6B7280;white-space:nowrap">Email</td><td style="padding:6px 0"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:6px 24px 6px 0;color:#6B7280;white-space:nowrap">Mobile</td><td style="padding:6px 0">${mobile}</td></tr>
        <tr><td style="padding:6px 24px 6px 0;color:#6B7280;white-space:nowrap">Company</td><td style="padding:6px 0">${company}</td></tr>
        <tr><td style="padding:6px 24px 6px 0;color:#6B7280;white-space:nowrap">Job title</td><td style="padding:6px 0">${jobTitle}</td></tr>
      </table>
    `,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
