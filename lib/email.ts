// lib/email.ts
import { getOtpTemplate, getWelcomeTemplate, getSubscriptionTemplate } from "./email-templates";

const API_KEY = (process.env.RESEND_API_KEY ?? "").trim();
const FROM_EMAIL = (process.env.EMAIL_FROM ?? "onboarding@resend.dev").trim();

export interface EmailResult {
  ok: boolean;
  error?: string;
}

async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  if (!API_KEY) {
    console.log(`[email:dev] ⚠️ Resend key missing. To=${to}`);
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      console.error("[email] Resend error:", res.status, data);
      return { ok: false, error: data?.message ?? `HTTP ${res.status}` };
    }

    console.log(`[email] ✅ Sent via Resend to ${to}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[email] exception:", e);
    return { ok: false, error: e?.message ?? "Network error" };
  }
}

export async function sendOtpEmail(email: string, code: string): Promise<EmailResult> {
  const html = getOtpTemplate(code);
  return sendEmail(email, `کد ورود نوترون: ${code}`, html);
}

export async function sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
  const html = getWelcomeTemplate(name);
  return sendEmail(email, "به نوترون خوش آمدی 🚀", html);
}

export async function sendSubscriptionEmail(email: string, name: string, planName: string, expiresAt: string): Promise<EmailResult> {
  const html = getSubscriptionTemplate(name, planName, expiresAt);
  return sendEmail(email, "اشتراک نوترون فعال شد 👑", html);
}