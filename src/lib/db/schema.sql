-- CAPITRES commerce schema.
--
-- Run once via `npm run db:migrate` (src/lib/db/migrate.ts). Safe to re-run:
-- every statement is idempotent (IF NOT EXISTS / ON CONFLICT).

CREATE TABLE IF NOT EXISTS products (
  id                      text PRIMARY KEY,
  slug                    text NOT NULL UNIQUE,
  title_en                text NOT NULL,
  title_ar                text NOT NULL,
  title_ku                text NOT NULL,
  description_en          text NOT NULL,
  description_ar          text NOT NULL,
  description_ku          text NOT NULL,
  story_en                text,
  story_ar                text,
  story_ku                text,
  details                 jsonb NOT NULL DEFAULT '[]',
  category                text NOT NULL,
  gender                  text NOT NULL,
  price_amount            integer NOT NULL,
  compare_at_amount       integer,
  colors                  jsonb NOT NULL DEFAULT '[]',
  images                  jsonb NOT NULL DEFAULT '[]',
  collection_slugs        jsonb NOT NULL DEFAULT '[]',
  is_new                  boolean NOT NULL DEFAULT false,
  featured                boolean NOT NULL DEFAULT false,
  release_date            date NOT NULL DEFAULT current_date,
  giftcard_denominations  jsonb,
  archived                boolean NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id          text PRIMARY KEY,
  product_id  text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size        text NOT NULL,
  stock       integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, size)
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

CREATE TABLE IF NOT EXISTS reviews (
  id            text PRIMARY KEY,
  product_slug  text NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  author        text NOT NULL,
  rating        smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body          text NOT NULL,
  locale        text,
  approved      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_slug);

CREATE TABLE IF NOT EXISTS collections (
  slug           text PRIMARY KEY,
  title_en       text NOT NULL,
  title_ar       text NOT NULL,
  title_ku       text NOT NULL,
  tagline_en     text NOT NULL,
  tagline_ar     text NOT NULL,
  tagline_ku     text NOT NULL,
  description_en text NOT NULL,
  description_ar text NOT NULL,
  description_ku text NOT NULL,
  hero_image     jsonb NOT NULL,
  theme          text NOT NULL DEFAULT 'light',
  archived       boolean NOT NULL DEFAULT false,
  sort_order     integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS posts (
  slug                  text PRIMARY KEY,
  title_en              text NOT NULL,
  title_ar              text NOT NULL,
  title_ku              text NOT NULL,
  excerpt_en            text NOT NULL,
  excerpt_ar            text NOT NULL,
  excerpt_ku            text NOT NULL,
  cover                 jsonb NOT NULL,
  post_date             date NOT NULL,
  reading_minutes       integer NOT NULL DEFAULT 3,
  author                text NOT NULL,
  body                  jsonb NOT NULL DEFAULT '[]',
  related_product_slugs jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS orders (
  ref             text PRIMARY KEY,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  locale          text NOT NULL,
  status          text NOT NULL,
  wayl_link_id    text,
  payment_method  text,
  mock            boolean NOT NULL DEFAULT false,
  customer        jsonb NOT NULL,
  lines           jsonb NOT NULL,
  totals          jsonb NOT NULL,
  promo_code      text,
  ad_tracking     jsonb,
  meta_capi_sent  boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
-- Added after the initial launch — CREATE TABLE above only covers a fresh
-- install, so already-existing installs need these applied explicitly.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ad_tracking jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS meta_capi_sent boolean NOT NULL DEFAULT false;

-- Admin-set, explicit per-currency prices — optional, in cents (USD/EUR
-- have a minor unit, unlike IQD's whole-unit price_amount above). When
-- absent, display falls back to a computed conversion (see src/lib/money.ts)
-- rather than requiring every product to be re-priced by hand.
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_amount_usd_cents integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_amount_usd_cents integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_amount_eur_cents integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_amount_eur_cents integer;

-- Generic append log for newsletter signups, contact messages and
-- back-in-stock notify requests — low-stakes records that don't need
-- their own table each.
CREATE TABLE IF NOT EXISTS records (
  id          bigserial PRIMARY KEY,
  kind        text NOT NULL,
  payload     jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_records_kind ON records(kind, created_at DESC);

-- Admin dashboard accounts. Email is always stored lowercased by
-- application code (no citext in this schema). token_version is bumped
-- to revoke an already-issued session (e.g. on disable or password
-- reset) — the session cookie carries the version it was issued with,
-- so a stale one stops working immediately, not just for future logins.
CREATE TABLE IF NOT EXISTS admin_users (
  id                text PRIMARY KEY,
  email             text NOT NULL UNIQUE,
  password_hash     text NOT NULL,
  totp_secret       text,
  totp_enabled      boolean NOT NULL DEFAULT false,
  disabled          boolean NOT NULL DEFAULT false,
  failed_attempts   integer NOT NULL DEFAULT 0,
  locked_until      timestamptz,
  token_version     integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Only these emails may sign up for an admin_users account. Removing a
-- row blocks future signups only — it doesn't touch an existing account.
CREATE TABLE IF NOT EXISTS admin_allowlist (
  email       text PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Password-reset codes. code_hash is an HMAC (see src/lib/admin/auth.ts
-- sign()), not bcrypt — these are single-use, 10-minute-lived and
-- attempt-capped, so hash slowness buys nothing a real password needs.
CREATE TABLE IF NOT EXISTS admin_reset_codes (
  id          bigserial PRIMARY KEY,
  email       text NOT NULL,
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  attempts    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_reset_codes_email ON admin_reset_codes(email);

-- Admin-authored free-text note per order — surfaced in Orders and
-- Abandoned Carts. Distinct from customer.notes (delivery instructions,
-- inside the customer jsonb blob) — do not conflate the two.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note text;

-- Self-service profile fields for admin_users. `role` is a free-text
-- display label only (job title), not an RBAC/permissions system — every
-- admin_users account keeps identical capabilities regardless of this value.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role text;

-- Free-text — for team members who aren't Growli Media staff (e.g. an
-- outside marketing agency) to identify who they're with. Mirrors `role`:
-- no validation, no RBAC implication.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS company text;

-- Story banner: multiple hero photos (auto-rotating on the storefront), an
-- optional customer-controlled video, and optional publication credit
-- fields. Additive only — hero_image (singular) stays and still powers
-- every consumer that only ever wants one thumbnail; see
-- src/lib/catalog/types.ts for how the two fields coexist. hero_image is
-- kept in sync as "whatever hero_images[0] currently is" on every save.
ALTER TABLE collections ADD COLUMN IF NOT EXISTS hero_images jsonb;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS published_date date;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS published_where text;

-- Backfill: existing rows get their current hero_image as the sole
-- element of hero_images, so nothing regresses until an admin adds more
-- photos. Guarded by IS NULL so it's safe to re-run.
UPDATE collections SET hero_images = jsonb_build_array(hero_image) WHERE hero_images IS NULL;

-- Per-locale text alignment for the collection hero + description strip —
-- physical left/center/right (not logical start/end): a deliberate ask so
-- an admin can defy a language's natural reading direction on purpose,
-- e.g. a left-aligned Arabic headline for editorial effect. Defaults
-- match today's actual rendering (English naturally starts left, Arabic/
-- Kurdish naturally start right under dir="rtl") so no existing
-- collection's layout changes until someone opts into a different value.
ALTER TABLE collections ADD COLUMN IF NOT EXISTS text_align_en text NOT NULL DEFAULT 'left';
ALTER TABLE collections ADD COLUMN IF NOT EXISTS text_align_ar text NOT NULL DEFAULT 'right';
ALTER TABLE collections ADD COLUMN IF NOT EXISTS text_align_ku text NOT NULL DEFAULT 'right';

-- Team permissions — see src/lib/admin/permissions.ts for the grantable
-- keys and how these are enforced. Owners bypass `permissions` entirely;
-- everyone else needs the specific section granted explicitly (default
-- deny). is_owner is now editable through the UI — see the ownership
-- transfer feature below — so this file must never again write to it in
-- bulk (a prior one-time grandfather backfill lived here; removed once
-- its job was done, since this whole file re-runs on every db:migrate
-- and an unconditional `is_owner = true` UPDATE would silently undo any
-- future transfer the next time this migrates against production).
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '[]';

-- Owner-grantable override: bypasses `permissions` the same way is_owner
-- does, but is a distinct flag — it's meant for a trusted collaborator
-- (e.g. the agency that built/maintains the site) who needs to act with
-- full access without literally holding the owner role, which stays
-- reserved for the two owner-only actions this doesn't unlock: toggling
-- full_access itself, and transferring ownership. See hasFullControl()
-- in src/lib/admin/permissions.ts.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS full_access boolean NOT NULL DEFAULT false;

-- Soft delete for orders — "delete" from the Orders page hides an order
-- from every admin list/aggregate (recent orders, revenue, abandoned
-- carts, top products) without touching the storefront/webhook side
-- (order lookups by ref there stay unfiltered, so a customer's own
-- confirmation page and Wayl status updates keep working regardless).
-- Recently-deleted shows anything with deleted_at within the last 60
-- days; "delete forever" is a real DELETE FROM, not a further column.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at) WHERE deleted_at IS NOT NULL;

-- Admin-curated "frequently bought together" — a jsonb array of other
-- products' slugs, same shape as posts.related_product_slugs above and
-- products.collection_slugs (an array of foreign slugs hung off a row,
-- not a join table — matches how every other product-to-X link in this
-- schema is stored). Empty array = feature off for that product; the
-- storefront PDP only shows the section when it's non-empty.
ALTER TABLE products ADD COLUMN IF NOT EXISTS related_product_slugs jsonb NOT NULL DEFAULT '[]';

-- Admin activity feed — one row per meaningful mutation (product saved,
-- order cancelled, team member's access changed, ...), read by the
-- notification bell and any future "recent activity" view. Append-only,
-- no FK to admin_users (a deleted/disabled account's past actions should
-- stay in the log, not vanish or block the delete).
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id         bigserial PRIMARY KEY,
  actor_name text NOT NULL,
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log (created_at DESC);

-- Draft/publish state for the Journal admin — defaults true so the
-- existing seeded posts stay visible on /blog the moment this column
-- appears; the admin's create/edit form always passes an explicit value
-- going forward (drafts start false, see posts/actions.ts).
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;

-- Per-product size chart — an array of { size, chest?, length?, sleeve?,
-- waist?, shoulder? }, every number stored canonically in centimeters
-- regardless of which unit the admin typed it in (see src/lib/measurements.ts).
-- Empty by default: admins fill it in per product, nothing is required.
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_chart jsonb NOT NULL DEFAULT '[]';

-- Admin-editable legal/help pages — a fixed 4-row set (privacy, terms,
-- shipping-returns, size-guide), not an open collection: no create/delete
-- action exists for this table, only edit. Body is plain text per locale;
-- the public renderer treats a line starting with "## " as a heading and
-- splits everything else into paragraphs on blank lines — just enough
-- structure for shipping-returns' three subsections without a rich-text
-- editor (this codebase has none anywhere else either).
CREATE TABLE IF NOT EXISTS legal_pages (
  slug       text PRIMARY KEY,
  title_en   text NOT NULL,
  title_ar   text NOT NULL,
  title_ku   text NOT NULL,
  body_en    text NOT NULL,
  body_ar    text NOT NULL,
  body_ku    text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Admin-managed discount codes, replacing the old hardcoded PROMO_CODES
-- array in src/lib/commerce/config.ts. value is percentage points for
-- 'percent', a whole-IQD amount for 'fixed', and unused (null) for
-- 'free-shipping'. starts_at/ends_at bound the campaign window (either
-- or both may be null — open-ended on that side); max_uses caps total
-- redemptions (null = unlimited), enforced at checkout by counting
-- orders.promo_code (see src/lib/orders/store.ts's countByPromoCode).
CREATE TABLE IF NOT EXISTS promo_codes (
  code       text PRIMARY KEY,
  type       text NOT NULL CHECK (type IN ('percent', 'fixed', 'free-shipping')),
  value      integer,
  starts_at  timestamptz,
  ends_at    timestamptz,
  max_uses   integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Per-currency admin override for 'fixed' promo codes — mirrors
-- products.price_amount_usd_cents/price_amount_eur_cents exactly. `value`
-- (IQD) stays required/authoritative for real settlement (computeTotals
-- always works in IQD); these are optional display-only overrides for
-- computeDisplayTotals — absent means "convert from IQD instead" (see
-- priceByCurrencyOf() in src/lib/catalog/providers/postgres.ts).
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS value_usd_cents integer;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS value_eur_cents integer;

-- Restricts a code to one shipping region; null = usable from either.
-- Applies to every promo type, orthogonal to 'bogo' below. Enforced
-- authoritatively only at real checkout (validatePromoCode's optional
-- `region` param) — never at /api/promo/validate time, since the cart
-- drawer's "Apply" button runs before the customer has picked a region.
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS region text CHECK (region IN ('IQ', 'INTL'));

-- 'bogo' type — Buy X (from a pool of products/categories) Get Y (from
-- another pool) at a % discount. Pools are jsonb string arrays, same
-- convention as products.related_product_slugs — a mix of exact product
-- slugs and/or whole category slugs, admin's choice per side. buy_qty/
-- get_qty/get_discount_percent are null for every non-'bogo' row; value/
-- value_usd_cents/value_eur_cents are unused for 'bogo' (same treatment
-- as they already get for 'free-shipping').
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS buy_product_slugs jsonb NOT NULL DEFAULT '[]';
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS buy_categories    jsonb NOT NULL DEFAULT '[]';
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS get_product_slugs jsonb NOT NULL DEFAULT '[]';
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS get_categories    jsonb NOT NULL DEFAULT '[]';
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS buy_qty integer;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS get_qty integer;
-- 1-100; 100 = fully free.
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS get_discount_percent integer;

-- Confirmed (checked directly against the live DB) this constraint is the
-- Postgres auto-generated default name "<table>_<column>_check" — not a
-- guess. Widening it only permits a new value on future rows; it cannot
-- alter or reinterpret any existing row.
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS promo_codes_type_check;
ALTER TABLE promo_codes ADD CONSTRAINT promo_codes_type_check
  CHECK (type IN ('percent', 'fixed', 'free-shipping', 'bogo'));

-- Internal admin notice board — any named admin can post a note or reply;
-- every admin can see the shared feed and mark a note checked/unchecked
-- (cross-admin, server-persisted — unlike NotificationBell's client-local
-- last-seen marker). Unlike admin_activity_log (deliberately FK-less, so
-- a deleted account's history survives), these use real admin_users.id
-- FKs because "who has/hasn't checked this" and "is this viewer the
-- author" must stay queryable and correct even after a name change.
-- author_name is still stored redundantly for display robustness, same
-- convention as admin_activity_log's actor_name. deleted_at is a soft
-- delete, mirroring orders.deleted_at exactly (see orderStore.softDelete/
-- restore) — author-only restore via the "Recently deleted" panel.
CREATE TABLE IF NOT EXISTS admin_notes (
  id          bigserial PRIMARY KEY,
  author_id   text NOT NULL REFERENCES admin_users(id),
  author_name text NOT NULL,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  deleted_at  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_admin_notes_created_at ON admin_notes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notes_deleted_at ON admin_notes (deleted_at) WHERE deleted_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS admin_note_replies (
  id          bigserial PRIMARY KEY,
  note_id     bigint NOT NULL REFERENCES admin_notes(id) ON DELETE CASCADE,
  author_id   text NOT NULL REFERENCES admin_users(id),
  author_name text NOT NULL,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  deleted_at  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_admin_note_replies_note_id ON admin_note_replies (note_id, created_at);

-- Toggleable: "checked" = a row exists, "unchecked" = it doesn't — check
-- inserts, uncheck deletes, no separate undo/redo machinery needed.
CREATE TABLE IF NOT EXISTS admin_note_checks (
  note_id     bigint NOT NULL REFERENCES admin_notes(id) ON DELETE CASCADE,
  user_id     text NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  checked_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, user_id)
);

-- When an order actually got paid — previously never recorded anywhere.
-- Set once and never overwritten after (see orderStore.setStatus): the
-- real value straight from Wayl's `completedAt` when available (the
-- confirmation-page poll and the admin "Check Wayl" button both call
-- GET /api/v1/links/{referenceId}, which returns it per Wayl's own
-- OpenAPI spec), otherwise our own clock at the moment the webhook told
-- us the order was paid — a close approximation, not Wayl's authoritative
-- timestamp, for the common case where nothing ever needed to poll.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Anonymous storefront visitor tracking (admin Analytics section) — one
-- row per visitor-id cookie (capitres_vid, see src/lib/analytics/
-- visitor-cookie.ts), minted once by src/proxy.ts on a visitor's first
-- storefront request. id IS the cookie value, not a synthetic surrogate
-- key — one row per visitor, upserted on every tracked event. No PII and
-- no raw IP address is ever stored here, only Vercel's already-coarse
-- geo headers (country/region/city). If a tracked visit later converts
-- into a real order, orders.visitor_id (below) links the two —
-- deliberately not a foreign key, see that column's own comment.
CREATE TABLE IF NOT EXISTS visits (
  id               text PRIMARY KEY,
  first_seen       timestamptz NOT NULL DEFAULT now(),
  last_seen        timestamptz NOT NULL DEFAULT now(),
  country          text,
  region           text,
  city             text,
  landing_path     text NOT NULL,
  referrer_source  text NOT NULL DEFAULT 'direct'
                     CHECK (referrer_source IN ('direct','organic_search','social','referral')),
  referrer_host    text,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  user_agent       text
);
-- Retention cron's WHERE clause (visits inactive 90+ days).
CREATE INDEX IF NOT EXISTS idx_visits_last_seen ON visits (last_seen DESC);
-- Map aggregate counts (visitors per country/region/city).
CREATE INDEX IF NOT EXISTS idx_visits_geo ON visits (country, region, city);

-- One row per tracked interaction within a visit. No separate "time
-- spent" column — the activity-log view derives per-step dwell time as
-- the gap between one event's occurred_at and the next. ON DELETE
-- CASCADE so the retention cron only ever deletes from `visits`; every
-- dependent event goes with it automatically.
CREATE TABLE IF NOT EXISTS visit_events (
  id            bigserial PRIMARY KEY,
  visit_id      text NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('page_view','product_view','add_to_cart')),
  path          text,
  product_slug  text,
  occurred_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visit_events_visit_id ON visit_events (visit_id, occurred_at);

-- Links a real order back to the anonymous visit that led to it,
-- captured from the capitres_vid cookie at checkout time (see
-- src/app/api/checkout/route.ts). Deliberately NOT a foreign key: order
-- creation must never fail or block on an analytics-only linkage, and a
-- hard FK forces an ON DELETE decision that doesn't actually matter here
-- — the 90-day visit retention window means the referenced visits row
-- can legitimately be gone long before the order stops mattering. The
-- order detail page does a plain best-effort lookup and shows nothing
-- extra when it's gone — expected, not a bug.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS visitor_id text;
CREATE INDEX IF NOT EXISTS idx_orders_visitor_id ON orders (visitor_id) WHERE visitor_id IS NOT NULL;

-- Vercel's edge geolocation (x-vercel-ip-latitude/-longitude), captured
-- alongside country/region/city. The map highlights a visit's containing
-- shape (state, district, ...) by testing this point against each
-- shape's polygon (geoContains) rather than matching city/region text
-- against geoBoundaries' names — a country's ADM2 tier is often coarser
-- than a city (e.g. Germany's only goes down to Regierungsbezirk, so
-- there is no shape literally named "Munich" to string-match against),
-- and geoBoundaries' shapeName is frequently in the local language while
-- Vercel's city header is English. A point-in-polygon test sidesteps
-- both problems for every country uniformly. Nullable: older rows
-- predate this column, and not every IP resolves to a precise lat/lng —
-- those fall back to the original text matching in geo-match.ts.
ALTER TABLE visits ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS longitude double precision;
