import "server-only";
import { Resend } from "resend";

/**
 * Transactional email — the admin password-reset code, and a notification
 * whenever a customer submits the storefront contact form.
 *
 * MOCK MODE: when RESEND_API_KEY is unset, the code is logged to the
 * server console instead of actually emailed, so the reset flow is
 * still fully testable in local dev without a Resend account. Setting
 * the env var is the only change needed to send real email — no code
 * edits (same pattern as src/lib/payments/wayl.ts's mock mode).
 */

const FROM = process.env.RESEND_FROM_EMAIL || "CAPITRES Admin <onboarding@resend.dev>";
/** Where storefront contact-form submissions land. The message itself is
 * also always saved to the admin's Messages list (src/lib/server/records.ts)
 * regardless of whether this send succeeds, so nothing is lost to a
 * misfiled or bounced email. */
const CONTACT_INBOX = "capitresoficial@gmail.com";

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

export async function sendContactNotification(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  if (isEmailMockMode()) {
    console.log(`[email:mock] contact form message from ${input.name} <${input.email}>: ${input.message}`);
    return;
  }
  const { error } = await client().emails.send({
    from: FROM,
    to: CONTACT_INBOX,
    replyTo: input.email,
    subject: `Contact form: ${input.subject} — ${input.name}`,
    text: `From: ${input.name} <${input.email}>\nSubject: ${input.subject}\n\n${input.message}`,
  });
  if (error) {
    // A failed notification email shouldn't fail the customer's submission —
    // it's already saved to the admin Messages list either way.
    console.error("Failed to send contact notification email:", error.message);
  }
}
