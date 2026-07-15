# Deploying CAPITRES

This is the step-by-step path from "code on a laptop" to "live store the
client can run themselves." Read it top to bottom once — after the
one-time setup, going live is just filling in a few settings.

## What you're deploying

- The trilingual storefront (shop, checkout, blog, gift cards).
- Real payments through **Wayl**, Iraq's payment gateway.
- `/admin` — a password-protected dashboard where the client adds
  products, marks things sold out, sets discounts, sees revenue/order
  KPIs, and gets a nudge (with a one-click WhatsApp message) for anyone
  who started checkout but didn't pay.
- Optional ad tracking: GA4, Google Ads, Meta Pixel, Microsoft Clarity.

## Accounts you'll need

| Account | For | Cost |
| --- | --- | --- |
| [GitHub](https://github.com) | Hosting the code | Free |
| [Vercel](https://vercel.com) | Hosting the site + database + image storage | Free tier is enough to start |
| [Wayl](https://wayl.io) merchant account | Accepting real payments | Ask Wayl for their fee schedule |
| Google, Meta, Microsoft Clarity accounts | Ad tracking (optional, skip for launch day) | Free |

---

## One-time setup

### 1. Push the code to GitHub

From inside the `capitres` folder:

```bash
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

(No GitHub repo yet? Create one at github.com/new — leave it empty, no
README — then use the URL it gives you.)

### 2. Import the project into Vercel

- vercel.com → **Add New → Project** → pick the GitHub repo you just pushed.
- Framework preset: Next.js (auto-detected, leave everything default).
- Click **Deploy**. It will fail — that's expected, there's no database
  connected yet. Continue to the next step.

### 3. Add a Postgres database

- In the Vercel project → **Storage** tab → **Create Database** → Postgres
  (Neon, via the Storage marketplace, works identically).
- Vercel automatically adds `DATABASE_URL` to your project's environment
  variables — nothing to copy by hand.

### 4. Add Blob storage (for product photos)

- **Storage** tab → **Create** → **Blob**.
- This automatically adds `BLOB_READ_WRITE_TOKEN`. Without it, the admin
  photo uploader still works — it just asks you to paste an image URL
  instead of uploading a file.

### 5. Set the remaining environment variables

Project → **Settings → Environment Variables**:

| Variable | Value |
| --- | --- |
| `ADMIN_PASSWORD` | A real password — this is what the client types to get into `/admin`. Don't leave the placeholder. |
| `ADMIN_SESSION_SECRET` | Random string. Generate one: `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | Your real domain, e.g. `https://capitres.com`, no trailing slash |

(Wayl and analytics variables come in steps 7 and 9 — you can launch
without them and add them later.)

### 6. Load the starter catalog into the database

One-time only, from your own computer, pointed at the **production**
database (copy the value from Vercel → Storage → your Postgres → `.env.local` tab):

```bash
DATABASE_URL="<paste the production connection string>" npm run db:migrate
```

This creates the tables and loads the 8 starter products, collections
and blog posts. After this, every catalog change goes through
`/admin` — this script is safe to re-run (it never overwrites edits
you've made in the dashboard) but you won't need to.

### 7. Redeploy

Vercel → **Deployments** → **Redeploy** on the latest one (or just push
any commit). It builds successfully now that the database is connected.

### 8. Connect real payments — Wayl

- Sign up as a merchant at [wayl.io](https://wayl.io).
- Once approved, Wayl gives you a merchant token. In Vercel, set:
  - `WAYL_API_TOKEN` — the token Wayl gave you
  - `WAYL_ENV` — `live`
  - `WAYL_WEBHOOK_SECRET` — any random string you generate yourself
    (`openssl rand -hex 32`) — enter this **exact same value** in the
    Wayl dashboard's webhook settings, it has to match on both sides.
- In the Wayl dashboard, set the webhook URL to:
  `https://yourdomain.com/api/webhooks/wayl`
- Redeploy after adding these.

Until this step is done, checkout runs in **mock mode** automatically
— real customers would see a test payment screen instead of Wayl, so
don't advertise the site until this is set.

### 9. Point your domain

- Vercel project → **Settings → Domains** → add your domain.
- Vercel shows the DNS records to add (usually one A record and a
  CNAME for `www`) — add those at wherever the domain is registered.
- Takes anywhere from a few minutes to a few hours to go live.

At this point the store is fully live and taking real orders.

---

## Running the store day-to-day

Go to `yourdomain.com/admin` and log in with `ADMIN_PASSWORD`.

- **Dashboard** — revenue, paid order count, average order value, and
  abandoned-cart count at a glance. Recent orders and top-selling
  products underneath.
- **Products** — add a new product (photo, trilingual title/description,
  price, sizes and stock), edit an existing one, mark every size sold
  out in one click, set a discount (fill in the "was" price), archive
  (hides it from the site without deleting anything) or permanently
  delete. Every change goes live immediately, no redeploy.
- **Abandoned carts** — anyone who started checkout and didn't pay
  within 20 minutes shows up here with their name, phone, and what was
  in their cart. Click **WhatsApp** to message them directly (pre-filled
  with a friendly nudge), or **call**.
- **Orders** — every order ever placed, newest first, with status.
- **Reviews** — new reviews wait here for approval before they appear
  on the site.

## Ad tracking (optional — add whenever you're ready)

All of these are switched on just by setting an environment variable —
no code changes, and the site works identically with none of them set.
Add them in Vercel → Settings → Environment Variables, then redeploy.

| Variable | What it turns on | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_GA4_ID` | Google Analytics 4 | analytics.google.com → Admin → Data Streams → your web stream → Measurement ID (`G-...`) |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` + `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` | Google Ads conversion tracking, so ad spend can be measured against real purchases | Google Ads → Tools → Conversions → your conversion action → "Google tag" (`AW-...` and the label after the slash) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta (Facebook/Instagram) Pixel — retargeting + ad optimization | Meta Events Manager → your pixel → Settings |
| `META_CAPI_ACCESS_TOKEN` | Server-side copy of every purchase sent straight to Meta, on top of the Pixel. Recommended — browser-only tracking loses a real chunk of conversions to ad blockers and iOS privacy settings, which quietly wastes ad spend | Same Events Manager page → Conversions API → Generate access token |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity — session recordings and heatmaps. This is the direct answer to "who stayed how long on which page" | clarity.microsoft.com → your project → Settings → Setup |

GA4 also gets a "who's on the site right now and what are they doing"
view for free under **Reports → Realtime**.

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Vercel build fails, error mentions a database connection | `DATABASE_URL` isn't set, or step 6's migration hasn't been run yet |
| Can't log into `/admin` | `ADMIN_PASSWORD` isn't set in **Vercel's** environment variables (setting it only in your local `.env.local` doesn't affect the live site) |
| Product photo upload fails | `BLOB_READ_WRITE_TOKEN` isn't set — pasting an image URL still works as a fallback |
| Checkout shows a "Test Gateway" screen instead of real payment methods | `WAYL_API_TOKEN` isn't set, or `WAYL_ENV` isn't `live` — redeploy after setting both |
| Orders never flip from "Pending" to "Paid" after a real payment | `WAYL_WEBHOOK_SECRET` doesn't exactly match the value entered in the Wayl dashboard |
