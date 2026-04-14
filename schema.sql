-- Reply rate optimization engine schema (PostgreSQL)
-- Order: drop old tables -> create tables -> indexes

BEGIN;

-- Optional cleanup for repeated local runs
DROP TABLE IF EXISTS strategy_metrics CASCADE;
DROP TABLE IF EXISTS inbound_replies CASCADE;
DROP TABLE IF EXISTS message_events CASCADE;
DROP TABLE IF EXISTS outbound_messages CASCADE;
DROP TABLE IF EXISTS message_sequences CASCADE;
DROP TABLE IF EXISTS campaign_leads CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS sender_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(120),
  password_hash TEXT NOT NULL,
  plan VARCHAR(30) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'advanced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sender_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(30) NOT NULL DEFAULT 'smtp' CHECK (provider IN ('smtp', 'gmail', 'outlook', 'resend', 'sendgrid')),
  from_name VARCHAR(120),
  from_email VARCHAR(255) NOT NULL,
  smtp_host VARCHAR(255),
  smtp_port INT,
  smtp_username VARCHAR(255),
  smtp_password_encrypted TEXT,
  daily_limit INT NOT NULL DEFAULT 200 CHECK (daily_limit > 0),
  warmup_limit INT NOT NULL DEFAULT 30 CHECK (warmup_limit > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  contact_name VARCHAR(120),
  email VARCHAR(255) NOT NULL,
  country VARCHAR(80),
  industry VARCHAR(120),
  customer_type VARCHAR(80),
  source VARCHAR(80) DEFAULT 'csv',
  email_status VARCHAR(20) NOT NULL DEFAULT 'unknown' CHECK (email_status IN ('unknown', 'valid', 'invalid', 'risky')),
  lead_score INT CHECK (lead_score BETWEEN 0 AND 100),
  current_status VARCHAR(30) NOT NULL DEFAULT 'NEW' CHECK (current_status IN ('NEW', 'QUALIFIED', 'CONTACTED', 'REPLIED', 'NEGOTIATING', 'WON', 'LOST')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, email)
);

CREATE TABLE strategies (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(120) NOT NULL,
  target_country VARCHAR(80),
  target_industry VARCHAR(120),
  customer_type VARCHAR(80),
  goal VARCHAR(80) NOT NULL DEFAULT 'get_reply',
  angle VARCHAR(80) NOT NULL,
  tone VARCHAR(80) NOT NULL DEFAULT 'soft',
  sequence_days INT[] NOT NULL DEFAULT '{0,3,7}',
  constraints_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaigns (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_account_id BIGINT REFERENCES sender_accounts(id) ON DELETE SET NULL,
  name VARCHAR(160) NOT NULL,
  product_name VARCHAR(160),
  product_desc TEXT,
  target_country VARCHAR(80),
  target_industry VARCHAR(120),
  goal VARCHAR(80) DEFAULT 'get_reply',
  default_strategy_id BIGINT REFERENCES strategies(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_leads (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  strategy_id BIGINT REFERENCES strategies(id) ON DELETE SET NULL,
  sequence_version INT NOT NULL DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'contacted', 'followup_pending', 'replied', 'finished', 'bounced', 'unsubscribed')),
  last_message_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ,
  reply_at TIMESTAMPTZ,
  stop_reason VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, lead_id)
);

CREATE TABLE message_sequences (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  strategy_id BIGINT REFERENCES strategies(id) ON DELETE SET NULL,
  version INT NOT NULL DEFAULT 1,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  email_1_subject VARCHAR(255) NOT NULL,
  email_1_body TEXT NOT NULL,
  email_2_subject VARCHAR(255),
  email_2_body TEXT,
  email_3_subject VARCHAR(255),
  email_3_body TEXT,
  prompt_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, version)
);

CREATE TABLE outbound_messages (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_lead_id BIGINT NOT NULL REFERENCES campaign_leads(id) ON DELETE CASCADE,
  sender_account_id BIGINT REFERENCES sender_accounts(id) ON DELETE SET NULL,
  sequence_step INT NOT NULL CHECK (sequence_step BETWEEN 1 AND 3),
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  provider_message_id VARCHAR(255),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'bounced', 'cancelled')),
  reply_detected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE message_events (
  id BIGSERIAL PRIMARY KEY,
  outbound_message_id BIGINT NOT NULL REFERENCES outbound_messages(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'complained')),
  event_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inbound_replies (
  id BIGSERIAL PRIMARY KEY,
  campaign_lead_id BIGINT NOT NULL REFERENCES campaign_leads(id) ON DELETE CASCADE,
  outbound_message_id BIGINT REFERENCES outbound_messages(id) ON DELETE SET NULL,
  from_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  body_text TEXT,
  reply_type VARCHAR(30) DEFAULT 'neutral' CHECK (reply_type IN ('positive', 'neutral', 'not_interested', 'out_of_office', 'invalid')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE strategy_metrics (
  id BIGSERIAL PRIMARY KEY,
  country VARCHAR(80),
  industry VARCHAR(120),
  customer_type VARCHAR(80),
  strategy_id BIGINT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  sample_size INT NOT NULL DEFAULT 0 CHECK (sample_size >= 0),
  reply_count INT NOT NULL DEFAULT 0 CHECK (reply_count >= 0),
  reply_rate NUMERIC(6,5) NOT NULL DEFAULT 0 CHECK (reply_rate >= 0 AND reply_rate <= 1),
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (country, industry, customer_type, strategy_id)
);

-- Useful indexes
CREATE INDEX idx_sender_accounts_user_id ON sender_accounts(user_id);
CREATE INDEX idx_leads_user_status ON leads(user_id, current_status);
CREATE INDEX idx_leads_country_industry ON leads(country, industry);
CREATE INDEX idx_strategies_segment ON strategies(target_country, target_industry, customer_type);
CREATE INDEX idx_campaigns_user_status ON campaigns(user_id, status);
CREATE INDEX idx_campaign_leads_campaign_status ON campaign_leads(campaign_id, status);
CREATE INDEX idx_campaign_leads_next_action ON campaign_leads(next_action_at);
CREATE INDEX idx_outbound_messages_schedule_status ON outbound_messages(scheduled_at, delivery_status);
CREATE INDEX idx_outbound_messages_campaign_lead ON outbound_messages(campaign_lead_id);
CREATE INDEX idx_message_events_outbound_event ON message_events(outbound_message_id, event_type);
CREATE INDEX idx_inbound_replies_campaign_lead ON inbound_replies(campaign_lead_id);
CREATE INDEX idx_strategy_metrics_segment_rate ON strategy_metrics(country, industry, customer_type, reply_rate DESC);

COMMIT;
