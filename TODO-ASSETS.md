# TODO-ASSETS — placeholders & items pending client sign-off

Everything visual on this site is traced to **real Capitres brand assets**
pulled from the live storefront CDN (capitres.com → ucarecdn.com originals,
2048–4097px). Instagram itself is login-walled to automation, so the
storefront — which carries the same logo and product photography as the
IG feed — was used as the canonical source. The items below are the only
things that are placeholder, assumed, or awaiting real data.

## Imagery

| Asset | Status | Source / action needed |
| --- | --- | --- |
| Logo (C mark) | ✅ Real | `src/images/brand/logo.png` — storefront favicon original (2163×2163), same mark as the IG profile picture |
| Wordmark hero | ✅ Real | `src/images/brand/wordmark.png` — storefront hero (3340×2161) |
| 7 product photos | ✅ Real | `src/images/products/*` — storefront originals, resized to 1600px |
| Homepage hero | ✅ Real (repurposed) | Amo Baba product shot recompressed to 1920px/q70 for LCP. Swap for a dedicated campaign photo or video when the client shoots one |
| Additional PDP angles | ❌ Missing | Each product has ONE photo. Gallery supports multiples — export more angles from the client |
| Instagram strip | ⚠️ Repurposed | Uses the 4 strongest product photos and links to instagram.com/capitres. Replace with a live IG feed (Behold/EmbedSocial or the IG Basic Display API) post-launch |
| Gift card art | ⚠️ Designed here | Brand wordmark on black. Have the client approve or supply their own |

## Copy

- **Iraq 84 Arabic story** is **verbatim** from capitres.com. All other
  product/collection/blog copy was written in that same voice — client
  should review before launch.
- **Kurdish (Sorani) translations** were written in-house. A native
  Sorani speaker should proofread `messages/ku.json` and the `ku` fields
  in `src/lib/catalog/data/*`.
- **About-page narrative** deliberately avoids specific founding
  dates/names because they aren't public. Confirm with the client.
- **Reviews** are sample seed content (`reviews` arrays in
  `src/lib/catalog/data/products.ts`). Real submissions land in
  `.data/reviews.json` for moderation.

## Commercial data (assumptions to confirm)

| Item | Assumed value | Where |
| --- | --- | --- |
| IQD prices | Converted from the USD prices on the live store at ~1310 IQD/USD, rounded to retail (e.g. $49.24 → 65,000 IQD) | `src/lib/catalog/data/products.ts` |
| Sale price on Iraq 80's Heritage | 39,000 (was 55,000) — invented to exercise the Sale mechanics | same |
| Inventory counts | Placeholder stock numbers | `variants` in same file |
| Flat shipping / free threshold | 5,000 IQD / 100,000 IQD | `src/lib/commerce/config.ts` |
| Promo codes | `CAPITRES10` (10%), `SHUKRAN` (free shipping) | same |
| Gift card denominations | 25k / 50k / 100k / 250k IQD | same |
| USD reference rate | 1310 IQD/USD (PDP "≈ $" hint only) | `src/lib/money.ts` |

## Integrations pending credentials

- **Wayl**: fully implemented against the documented API
  (`api.thewayl.com/api/v1/links`, `X-WAYL-AUTHENTICATION`, HMAC-SHA256
  webhooks). Runs in **mock mode** until `WAYL_API_TOKEN` is set — see
  `.env.example`. No code changes needed to go live.
- **Email delivery** (order confirmations + gift-card emails): stubbed
  with TODO markers in `src/app/api/webhooks/wayl/route.ts`. Wire to
  Resend/Postmark.
- **Newsletter/contact/notify/reviews** persist to `.data/*.json`; swap
  `src/lib/server/records.ts` and `src/lib/orders/store.ts` for Postgres
  or a CMS for multi-instance deploys (interfaces already in place).
- **Social links**: only Instagram is linked (the one channel verified to
  exist). Add TikTok/X when handles are confirmed.

## Domain & analytics

- Set `NEXT_PUBLIC_SITE_URL` for canonical URLs/sitemap.
- No analytics installed (deliberate) — add a lightweight option
  (Plausible/Umami) after client sign-off.
