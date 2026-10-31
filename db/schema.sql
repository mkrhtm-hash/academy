-- VaultEdge Academy schema (PRACTICE platform: all balances are virtual demo funds)
-- Safe to run repeatedly: every object uses IF NOT EXISTS.
-- Money and prices are NUMERIC, never float.

CREATE TABLE IF NOT EXISTS plans (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL UNIQUE CHECK (name IN ('Free', 'Pro', 'Elite')),
  price_monthly  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  features       JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_popular     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS users (
  id                SERIAL PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  full_name         TEXT NOT NULL,
  experience_level  TEXT NOT NULL DEFAULT 'Beginner' CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced')),
  plan_id           INTEGER NOT NULL REFERENCES plans(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_plan_idx ON users(plan_id);
-- Admins can open /admin (manage students, sessions, view orders and stats).
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS courses (
  id                SERIAL PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  subtitle          TEXT NOT NULL DEFAULT '',
  level             TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  category          TEXT NOT NULL CHECK (category IN ('Forex', 'Gold', 'Indices', 'Crypto', 'Risk Management', 'Psychology')),
  instructor_name   TEXT NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 0,
  thumbnail         TEXT NOT NULL DEFAULT '#10b981,#f2c14e', -- two gradient colours used for the generated artwork
  description       TEXT NOT NULL DEFAULT '',
  outcomes          JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_free           BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS courses_category_level_idx ON courses(category, level);

CREATE TABLE IF NOT EXISTS modules (
  id           SERIAL PRIMARY KEY,
  course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  order_index  INTEGER NOT NULL,
  UNIQUE (course_id, order_index)
);

CREATE TABLE IF NOT EXISTS lessons (
  id                SERIAL PRIMARY KEY,
  module_id         INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 8,
  content           TEXT NOT NULL DEFAULT '',
  video_url         TEXT,
  order_index       INTEGER NOT NULL,
  UNIQUE (module_id, order_index)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id     INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed     BOOLEAN NOT NULL DEFAULT TRUE,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS lesson_progress_lesson_idx ON lesson_progress(lesson_id);

CREATE TABLE IF NOT EXISTS certificates (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id         INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_code  TEXT NOT NULL UNIQUE,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS instruments (
  id                SERIAL PRIMARY KEY,
  symbol            TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  asset_class       TEXT NOT NULL,
  base_price        NUMERIC(18, 6) NOT NULL,
  pip_size          NUMERIC(18, 6) NOT NULL,
  contract_size     NUMERIC(18, 4) NOT NULL,
  decimals          INTEGER NOT NULL,
  quote_is_usd      BOOLEAN NOT NULL DEFAULT TRUE,   -- false for USD/JPY: P&L is converted back to USD
  spread_pips       NUMERIC(10, 2) NOT NULL DEFAULT 1.5,
  volatility        NUMERIC(10, 6) NOT NULL DEFAULT 0.0001, -- per-second standard deviation for the server random walk
  current_price     NUMERIC(18, 6),
  price_updated_at  TIMESTAMPTZ
);

-- Real-market reference prices (refreshed about once a minute by api/_lib/feed.js).
-- The simulated price follows ref_price; ref_prev_close drives the daily % change.
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS ref_price NUMERIC(18, 6);
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS ref_prev_close NUMERIC(18, 6);
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS ref_time TIMESTAMPTZ;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS ref_source TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS ref_checked_at TIMESTAMPTZ;

-- Server-generated price ticks, used to draw the chart history. Pruned to the last 2 hours.
CREATE TABLE IF NOT EXISTS price_ticks (
  id             BIGSERIAL PRIMARY KEY,
  instrument_id  INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  ts             TIMESTAMPTZ NOT NULL DEFAULT now(),
  price          NUMERIC(18, 6) NOT NULL
);
CREATE INDEX IF NOT EXISTS price_ticks_instrument_ts_idx ON price_ticks(instrument_id, ts);

CREATE TABLE IF NOT EXISTS demo_accounts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance     NUMERIC(14, 2) NOT NULL DEFAULT 10000,
  equity      NUMERIC(14, 2) NOT NULL DEFAULT 10000,
  currency    TEXT NOT NULL DEFAULT 'USD',
  leverage    INTEGER NOT NULL DEFAULT 30,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS positions (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instrument_id  INTEGER NOT NULL REFERENCES instruments(id),
  side           TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  lot_size       NUMERIC(10, 2) NOT NULL CHECK (lot_size > 0),
  entry_price    NUMERIC(18, 6) NOT NULL,
  stop_loss      NUMERIC(18, 6),
  take_profit    NUMERIC(18, 6),
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at      TIMESTAMPTZ,
  close_price    NUMERIC(18, 6),
  realized_pnl   NUMERIC(14, 2),
  close_reason   TEXT
);
CREATE INDEX IF NOT EXISTS positions_user_status_idx ON positions(user_id, status);
CREATE INDEX IF NOT EXISTS positions_open_instrument_idx ON positions(instrument_id) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS live_sessions (
  id                SERIAL PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  mentor_name       TEXT NOT NULL,
  start_time        TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 45,
  capacity          INTEGER NOT NULL CHECK (capacity > 0),
  seats_taken       INTEGER NOT NULL DEFAULT 0 CHECK (seats_taken >= 0),
  topic             TEXT NOT NULL DEFAULT '',
  level             TEXT NOT NULL DEFAULT 'All levels',
  CHECK (seats_taken <= capacity)
);
CREATE INDEX IF NOT EXISTS live_sessions_start_idx ON live_sessions(start_time);

CREATE TABLE IF NOT EXISTS session_bookings (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id  INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  booked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_id)
);
CREATE INDEX IF NOT EXISTS session_bookings_session_idx ON session_bookings(session_id);

-- Demo checkout orders. Virtual only: no card data is collected and no payment is processed.
CREATE TABLE IF NOT EXISTS demo_orders (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id        INTEGER NOT NULL REFERENCES plans(id),
  billing_cycle  TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount         NUMERIC(10, 2) NOT NULL,
  reference      TEXT NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'paid_virtual',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS demo_orders_user_idx ON demo_orders(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS activity_log (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date    DATE NOT NULL,
  minutes_learned  INTEGER NOT NULL DEFAULT 0,
  trades_placed    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, activity_date)
);
