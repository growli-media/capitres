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
