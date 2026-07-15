import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, the admin dashboard (its own non-localized area,
  // gated by src/app/admin/layout.tsx instead), Next internals and all
  // static files.
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
