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
