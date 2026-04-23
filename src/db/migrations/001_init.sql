-- ============================================================
-- Migration 001 — Initial schema
-- Tables: funds, investors, investments
-- ============================================================

-- Enum-like CHECK constraints keep the database honest without
-- requiring a separate enum type, making future status additions
-- a simple ALTER TABLE rather than an ALTER TYPE.

-- ---------------------------------------------------------------
-- funds
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS funds (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  vintage_year     INTEGER     NOT NULL CHECK (vintage_year BETWEEN 1900 AND 2200),
  target_size_usd  NUMERIC(20, 2) NOT NULL CHECK (target_size_usd > 0),
  status           TEXT        NOT NULL CHECK (status IN ('Fundraising', 'Investing', 'Closed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- investors
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investors (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  investor_type  TEXT        NOT NULL CHECK (investor_type IN ('Individual', 'Institution', 'Family Office')),
  email          TEXT        NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- investments  (junction between investors and funds)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id      UUID        NOT NULL REFERENCES investors(id) ON DELETE RESTRICT,
  fund_id          UUID        NOT NULL REFERENCES funds(id)     ON DELETE RESTRICT,
  amount_usd       NUMERIC(20, 2) NOT NULL CHECK (amount_usd > 0),
  investment_date  DATE        NOT NULL
);

-- Useful for the common query pattern: "all investments for a given fund"
CREATE INDEX IF NOT EXISTS idx_investments_fund_id     ON investments(fund_id);
CREATE INDEX IF NOT EXISTS idx_investments_investor_id ON investments(investor_id);
