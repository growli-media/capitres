import "server-only";
import { Resend } from "resend";

/**
 * Transactional email — currently just the admin password-reset code.
 *
 * MOCK MODE: when RESEND_API_KEY is unset, the code is logged to the
 * server console instead of actually emailed, so the reset flow is
 * still fully testable in local dev without a Resend account. Setting
 * the env var is the only change needed to send real email — no code
 * edits (same pattern as src/lib/payments/wayl.ts's mock mode).
 */

const FROM = process.env.RESEND_FROM_EMAIL || "CAPITRES Admin <onboarding@resend.dev>";

export function isEmailMockMode(): boolean {
  return !process.env.RESEND_API_KEY;
}

function client(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<void> {
  if (isEmailMockMode()) {
    console.log(`[email:mock] password reset code for ${email}: ${code}`);
    return;
  }
  const { error } = await client().emails.send({
    from: FROM,
    to: email,
    subject: `Your CAPITRES admin reset code: ${code}`,
    text:
      `Your password reset code is ${code}.\n\n` +
      `It expires in 10 minutes and can only be used once. ` +
      `If you didn't request this, you can ignore this email.`,
  });
  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
