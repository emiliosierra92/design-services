-- Application-owned tables only. Never alter the Stripe-managed schema.
CREATE SCHEMA IF NOT EXISTS luckybird;
CREATE TABLE luckybird.environment (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  mode text NOT NULL CHECK (mode IN ('test', 'live'))
);
CREATE TABLE luckybird.inventory (
  product_id text PRIMARY KEY,
  on_hand integer NOT NULL CHECK (on_hand >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= on_hand)
);
CREATE TABLE luckybird.orders (
  id uuid PRIMARY KEY,
  product_id text NOT NULL REFERENCES luckybird.inventory(product_id),
  price_id text NOT NULL,
  amount_in_cents integer NOT NULL CHECK (amount_in_cents > 0),
  currency text NOT NULL CHECK (currency ~ '^[a-z]{3}$'),
  status text NOT NULL DEFAULT 'RESERVED' CHECK (status IN ('RESERVED', 'OPEN', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED')),
  stripe_session_id text UNIQUE,
  stripe_checkout_url text,
  session_parameters jsonb NOT NULL,
  checkout_expires_at bigint NOT NULL,
  stripe_payment_intent_id text,
  customer_email text,
  shipping_details jsonb,
  total_in_cents integer,
  tax_in_cents integer,
  shipping_in_cents integer,
  refunded_in_cents integer NOT NULL DEFAULT 0 CHECK (refunded_in_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lucky_orders_pending ON luckybird.orders(created_at) WHERE status IN ('RESERVED', 'OPEN');
CREATE INDEX lucky_orders_intent ON luckybird.orders(stripe_payment_intent_id);
CREATE TABLE luckybird.processed_events (
  id text PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES luckybird.orders(id),
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE luckybird.community_posts (
  id uuid PRIMARY KEY,
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 50),
  email text NOT NULL,
  message text NOT NULL CHECK (length(message) BETWEEN 10 AND 1500),
  submitted_photo_url text,
  photo_path text CHECK (photo_path IS NULL OR photo_path ~ '^/images/luckybird/community/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$'),
  consent boolean NOT NULL CHECK (consent),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX lucky_community_public ON luckybird.community_posts(created_at) WHERE status = 'APPROVED';
CREATE TABLE luckybird.rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0)
);
