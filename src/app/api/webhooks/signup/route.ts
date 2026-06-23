import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "stackxdigital@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://pdfix.my";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  const expected = process.env.SIGNUP_WEBHOOK_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = body?.record;
  if (!record) {
    return NextResponse.json({ error: "No record" }, { status: 400 });
  }

  const email = record.email ?? "";
  const name = record.full_name ?? "";
  const signedUpAt = record.created_at
    ? new Date(record.created_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })
    : new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });

  await Promise.allSettled([
    email
      ? sendEmail({
          to: email,
          subject: "Welcome to PDFix! 🎉",
          html: welcomeEmail(name || email, APP_URL),
        })
      : Promise.resolve(),

    sendEmail({
      to: ADMIN_EMAIL,
      subject: `🎉 New signup: ${email}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#dc2626;margin-bottom:4px">New User Signed Up</h2>
          <p style="color:#6b7280;margin-top:0">PDFix — ${signedUpAt} (MYT)</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr>
              <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:120px">Name</td>
              <td style="padding:8px 12px;border:1px solid #e5e7eb">${name || "—"}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Email</td>
              <td style="padding:8px 12px;border:1px solid #e5e7eb">${email}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Plan</td>
              <td style="padding:8px 12px;border:1px solid #e5e7eb">${record.plan ?? "free"}</td>
            </tr>
          </table>
          <p style="margin-top:20px;color:#9ca3af;font-size:12px">PDFix Admin Notification</p>
        </div>
      `,
    }),
  ]);

  return NextResponse.json({ ok: true });
}

function welcomeEmail(nameOrEmail: string, appUrl: string): string {
  const firstName = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail.split(" ")[0];

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
          <tr>
            <td style="background:#dc2626;padding:32px 40px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px">PDF<span style="color:#fca5a5">ix</span></h1>
              <p style="margin:6px 0 0;color:#fca5a5;font-size:13px">Free PDF Tools For Everyone</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px">
              <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700">Welcome, ${firstName}! 👋</h2>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6">
                Your PDFix account has been successfully created. All PDF tools are available for free — no limits, no credit card required.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:28px">
                <tr><td style="padding:6px 0;color:#374151;font-size:14px">✅ &nbsp;Edit, merge, split &amp; compress PDF</td></tr>
                <tr><td style="padding:6px 0;color:#374151;font-size:14px">✅ &nbsp;E-Sign, watermark &amp; fill PDF forms</td></tr>
                <tr><td style="padding:6px 0;color:#374151;font-size:14px">✅ &nbsp;OCR PDF — extract text from scanned PDFs</td></tr>
                <tr><td style="padding:6px 0;color:#374151;font-size:14px">✅ &nbsp;Activity log — record of all processed files</td></tr>
                <tr><td style="padding:6px 0;color:#374151;font-size:14px">✅ &nbsp;100% in-browser — files never sent to servers</td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard"
                       style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600">
                      Get Started with PDFix →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.5">
                Questions? Contact us at
                <a href="mailto:stackxdigital@gmail.com" style="color:#dc2626;text-decoration:none">stackxdigital@gmail.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f3f4f6;padding:20px 40px;text-align:center">
              <p style="margin:0;color:#9ca3af;font-size:12px">
                © ${new Date().getFullYear()} PDFix · <a href="${appUrl}" style="color:#9ca3af">${appUrl.replace("https://", "")}</a>
              </p>
              <p style="margin:6px 0 0;color:#d1d5db;font-size:11px">
                You received this email because you recently signed up for PDFix.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
