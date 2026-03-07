/*
  # Core Tables for WhatsApp SaaS

  ## Summary
  Creates the foundational tables required to move the application from
  in-memory mock state to persistent, multi-tenant data storage.

  ## New Tables

  ### clients
  - Top-level tenant entity. Each client (account) owns connections and configs.
  - `id` (uuid, PK), `name`, `email`, `is_active`, `created_at`

  ### whatsapp_connections
  - Tracks each WhatsApp number/session per client.
  - `id` (uuid, PK), `client_id` (FK → clients), `phone_number`, `display_name`
  - `status`: scanning | connected | disconnected | error
  - `connection_type`: web | api_oficial
  - `qr_code` (text, temporary QR data), `last_activity`
  - `api_credentials` (jsonb: accessToken, phoneNumberId, businessAccountId)
  - `session_data` (jsonb: persisted Baileys session for reconnect)

  ### ai_configs
  - Per-connection AI configuration. API key stored encrypted.
  - `id` (uuid, PK), `connection_id` (FK → whatsapp_connections), `client_id` (FK)
  - `openai_api_key_encrypted` (text, pgcrypto AES-256 encrypted)
  - `openai_key_last4` (text, last 4 chars for display)
  - `model` (text), `max_tokens` (int), `temperature` (float)
  - `persona_instructions` (text), `escalation_triggers` (text[])
  - `confidence_threshold` (float, default 0.4)
  - `is_active` (bool)

  ### messages
  - All inbound/outbound messages. Has unique constraint on external_message_id
    to guarantee idempotency (no double processing).
  - `id` (uuid, PK), `connection_id` (FK), `client_id` (FK)
  - `external_message_id` (text, UNIQUE) — WhatsApp message ID
  - `direction`: inbound | outbound
  - `from_number`, `to_number`, `body` (text)
  - `ai_response` (bool), `ai_confidence` (float)
  - `processed` (bool, default false), `processed_at`
  - `timestamp`

  ### system_logs
  - Structured log entries for the Status do Sistema screen.
  - `id` (uuid, PK), `client_id` (FK, nullable for global events)
  - `level`: INFO | WARN | ERROR
  - `event_type` (text: qr_generated, session_connected, message_received, etc.)
  - `message` (text), `payload` (jsonb)
  - `created_at`

  ### bot_controls
  - Kill switch per connection.
  - `id` (uuid, PK), `connection_id` (FK, UNIQUE), `client_id` (FK)
  - `is_paused` (bool, default false)
  - `paused_at`, `pause_reason` (text)
  - `updated_at`

  ## Security
  - RLS enabled on all tables
  - Policies allow authenticated users to access only their own client's data
  - Service role (Edge Functions) bypasses RLS for internal operations

  ## Notes
  1. pgcrypto extension enabled for key encryption
  2. All foreign keys use CASCADE on delete to keep data consistent
  3. Index on messages(external_message_id) for fast dedup lookups
  4. Index on system_logs(client_id, created_at) for dashboard queries
*/

-- Enable pgcrypto for AES encryption of API keys
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── clients ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL DEFAULT '',
  email       text UNIQUE NOT NULL DEFAULT '',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients: owner can select"
  ON clients FOR SELECT
  TO authenticated
  USING (id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "clients: owner can update"
  ON clients FOR UPDATE
  TO authenticated
  USING (id = (auth.jwt() ->> 'client_id')::uuid)
  WITH CHECK (id = (auth.jwt() ->> 'client_id')::uuid);

-- ─── whatsapp_connections ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  phone_number     text NOT NULL DEFAULT '',
  display_name     text NOT NULL DEFAULT '',
  status           text NOT NULL DEFAULT 'disconnected'
                     CHECK (status IN ('scanning','connected','disconnected','error')),
  connection_type  text NOT NULL DEFAULT 'web'
                     CHECK (connection_type IN ('web','api_oficial')),
  qr_code          text,
  last_activity    timestamptz,
  api_credentials  jsonb DEFAULT '{}'::jsonb,
  session_data     jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connections: client can select"
  ON whatsapp_connections FOR SELECT
  TO authenticated
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "connections: client can insert"
  ON whatsapp_connections FOR INSERT
  TO authenticated
  WITH CHECK (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "connections: client can update"
  ON whatsapp_connections FOR UPDATE
  TO authenticated
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid)
  WITH CHECK (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "connections: client can delete"
  ON whatsapp_connections FOR DELETE
  TO authenticated
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid);

-- ─── ai_configs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_configs (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id            uuid NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  client_id                uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  openai_api_key_encrypted text,
  openai_key_last4         text DEFAULT '',
  model                    text NOT NULL DEFAULT 'gpt-3.5-turbo',
  max_tokens               integer NOT NULL DEFAULT 500,
  temperature              float NOT NULL DEFAULT 0.7,
  persona_instructions     text NOT NULL DEFAULT '',
  escalation_triggers      text[] NOT NULL DEFAULT '{}',
  confidence_threshold     float NOT NULL DEFAULT 0.4,
  is_active                boolean NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_configs: client can select"
  ON ai_configs FOR SELECT
  TO authenticated
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "ai_configs: client can insert"
  ON ai_configs FOR INSERT
  TO authenticated
  WITH CHECK (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "ai_configs: client can update"
  ON ai_configs FOR UPDATE
  TO authenticated
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid)
  WITH CHECK (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "ai_configs: client can delete"
  ON ai_configs FOR DELETE
  TO authenticated
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid);

-- ─── messages ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id        uuid NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  client_id            uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  external_message_id  text UNIQUE,
  direction            text NOT NULL DEFAULT 'inbound'
                         CHECK (direction IN ('inbound','outbound')),
  from_number          text NOT NULL DEFAULT '',
  to_number            text NOT NULL DEFAULT '',
  body                 text NOT NULL DEFAULT '',
  ai_response          boolean NOT NULL DEFAULT false,
  ai_confidence        float,
  processed            boolean NOT NULL DEFAULT false,
  processed_at         timestamptz,
  timestamp            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_external_id
  ON messages (external_message_id);

CREATE INDEX IF NOT EXISTS idx_messages_connection_ts
  ON messages (connection_id, timestamp DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages: client can select"
  ON messages FOR SELECT
  TO authenticated
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "messages: client can insert"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "messages: client can update"
  ON messages FOR UPDATE
  TO authenticated
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid)
  WITH CHECK (client_id = (auth.jwt() ->> 'client_id')::uuid);

-- ─── system_logs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  level       text NOT NULL DEFAULT 'INFO'
                CHECK (level IN ('INFO','WARN','ERROR')),
  event_type  text NOT NULL DEFAULT '',
  message     text NOT NULL DEFAULT '',
  payload     jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_client_ts
  ON system_logs (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_level
  ON system_logs (level, created_at DESC);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_logs: client can select"
  ON system_logs FOR SELECT
  TO authenticated
  USING (
    client_id IS NULL
    OR client_id = (auth.jwt() ->> 'client_id')::uuid
  );

CREATE POLICY "system_logs: client can insert"
  ON system_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IS NULL
    OR client_id = (auth.jwt() ->> 'client_id')::uuid
  );

-- ─── bot_controls ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_controls (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id  uuid NOT NULL UNIQUE REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  is_paused      boolean NOT NULL DEFAULT false,
  paused_at      timestamptz,
  pause_reason   text DEFAULT '',
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bot_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bot_controls: client can select"
  ON bot_controls FOR SELECT
  TO authenticated
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "bot_controls: client can insert"
  ON bot_controls FOR INSERT
  TO authenticated
  WITH CHECK (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "bot_controls: client can update"
  ON bot_controls FOR UPDATE
  TO authenticated
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid)
  WITH CHECK (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY "bot_controls: client can delete"
  ON bot_controls FOR DELETE
  TO authenticated
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid);
