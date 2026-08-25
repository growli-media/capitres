import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { CURRENCY_COOKIE } from "./lib/currency/cookie";
import { detectCurrencyFromCountry } from "./lib/currency/geo";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  // Default display currency, first visit only — never overwrite a choice
  // the customer already made via the currency switcher. Vercel's geo
  // header is only present once deployed; local dev always falls through
  // to detectCurrencyFromCountry's default.
  if (!request.cookies.has(CURRENCY_COOKIE)) {
    const country = request.headers.get("x-vercel-ip-country");
    const currency = detectCurrencyFromCountry(country);
    response.cookies.set(CURRENCY_COOKIE, currency, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  // Skip API routes, the admin dashboard (its own non-localized area,
  // gated by src/app/admin/layout.tsx instead), Next internals and all
  // static files.
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
