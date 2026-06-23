import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || "hello@pdfix.my";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) return { error: "RESEND_API_KEY not set" };
  return await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
}
