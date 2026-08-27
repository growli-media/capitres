import "server-only";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "CAPITRES Admin";

/** A fresh base32 TOTP secret — not yet persisted until the owner
 * proves they can generate a valid code with it (see users.enableTotp). */
export function generateSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

function totpFor(email: string, secret: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

/** The otpauth:// URI an authenticator app scans (as a QR code) or the
 * raw secret is entered manually against. */
export function enrollmentUri(email: string, secret: string): string {
  return totpFor(email, secret).toString();
}

export async function enrollmentQrDataUrl(email: string, secret: string): Promise<string> {
  return QRCode.toDataURL(enrollmentUri(email, secret));
}

/** ±1 time-step (±30s) tolerance is otpauth's default window — enough
 * for clock drift without meaningfully widening the guessable window. */
export function verifyTotpToken(secret: string, token: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  return totpFor("", secret).validate({ token }) !== null;
}
