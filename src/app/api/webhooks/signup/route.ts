import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "stackxdigital@gmail.com";
const WEBHOOK_SECRET = process.env.SIGNUP_WEBHOOK_SECRET ?? "";

export async function POST(req: NextRequest) {
  // Verify simple secret header to prevent abuse
  const secret = req.headers.get("x-webhook-secret");
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Supabase Database Webhook sends { type, table, record, old_record, schema }
  const record = body?.record;
  if (!record) {
    return NextResponse.json({ error: "No record" }, { status: 400 });
  }

  const email = record.email ?? "unknown";
  const name = record.full_name ?? "—";
  const signedUpAt = record.created_at
    ? new Date(record.created_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })
    : new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "PDFix <noreply@pdfix.my>",
    to: ADMIN_EMAIL,
    subject: `🎉 New signup: ${email}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#dc2626;margin-bottom:4px">New User Signed Up</h2>
        <p style="color:#6b7280;margin-top:0">PDFix — ${signedUpAt} (MYT)</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:120px">Name</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${name}</td>
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
  });

  return NextResponse.json({ ok: true });
}
