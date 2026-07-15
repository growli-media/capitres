# CAPITRES — Storefront

Trilingual (EN / AR / KU-Sorani) e-commerce build for Capitres —
*Fashion Inspired by Football* — on Next.js 16 (App Router),
TypeScript, Tailwind v4, Framer Motion, Lenis and next-intl, with
payments through **Wayl** (Iraq's unified payment gateway).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 → redirects to /en
npm run build && npm start
```

Payments run in **mock mode** out of the box (a local simulated Wayl
gateway at `/{locale}/pay-mock`), so the full order → payment →
confirmation loop works offline. To go live, copy `.env.example` to
`.env.local` and set `WAYL_API_TOKEN` (+ `WAYL_ENV=live`,
`WAYL_WEBHOOK_SECRET`). No code changes required.

Without `DATABASE_URL` set, the storefront runs off a hardcoded demo
catalog with no admin panel — useful for quick UI work. For the full
catalog + orders + `/admin` dashboard, run a local Postgres with
`npm run db:dev` (in a second terminal) and `npm run db:migrate` once —
see **DEPLOYMENT.md** for the full setup and how to ship this to
production.

## Map

| Area | Where |
| --- | --- |
| Locales & routing | `src/i18n/*`, `src/proxy.ts`, `messages/{en,ar,ku}.json` |
| Catalog (products/collections/posts, trilingual) | `src/lib/catalog/` — swappable `CatalogProvider`, Postgres-backed when `DATABASE_URL` is set |
| Cart (persistent, zustand) | `src/lib/cart/store.ts` |
| Commerce rules (shipping, promos, gift cards) | `src/lib/commerce/` |
| Wayl client + webhook HMAC verify | `src/lib/payments/wayl.ts` |
| Orders / form records | `src/lib/orders/store.ts`, `src/lib/server/records.ts` — Postgres-backed when `DATABASE_URL` is set, file-based fallback otherwise |
| Admin dashboard (`/admin`) | `src/app/admin/` — products, KPIs, abandoned carts, orders, reviews; single shared password, see DEPLOYMENT.md |
| Analytics (GA4, Google Ads, Meta Pixel + Conversions API, Clarity) | `src/lib/analytics/`, `src/components/analytics/` — all env-gated, no-op if unset |
| API routes | `src/app/api/*` (checkout, orders, webhooks/wayl, mock-wayl, newsletter, contact, reviews, notify) |
| Pages | `src/app/[locale]/*` |
| Design tokens & rules | `src/app/globals.css`, `design-system/MASTER.md` |
| Placeholders & assumptions | `TODO-ASSETS.md` |
| Hosting, going live, day-to-day admin use | `DEPLOYMENT.md` |

## Swapping the backend

`catalog`, `orderStore` and the record appenders are interfaces — the
Postgres implementations are the production path (`src/lib/db/`,
enabled by `DATABASE_URL`); local/file implementations remain as a
DB-less fallback. Point either at a different backend by implementing
the interface and changing one export — pages and API routes only ever
import the boundary.

## Quality gates (last verified)

- Lighthouse (prod build, mobile emulation): home **89 performance /
  100 best-practices / 100 SEO**, CLS 0, TBT 40ms.
- All 99 static paths prerender across the three locales.
- Checkout E2E (mock Wayl): order → pay → status flip → confirmation +
  cart clear. Stock oversell returns 409; webhooks with a bad HMAC
  signature return 401.
# capitres
