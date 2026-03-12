/*
  # Fix RLS policies: use auth.uid() instead of phantom JWT client_id claim

  ## Problem
  All RLS policies on whatsapp_connections, ai_configs, messages, bot_controls,
  and clients check `(auth.jwt() ->> 'client_id')::uuid`. This custom JWT claim
  is never populated — no login flow, hook, or trigger sets it. As a result every
  authenticated read returns 0 rows and every write is silently rejected.

  ## Fix
  Replace the phantom JWT claim check with `auth.uid()` directly. In this
  single-tenant setup the auth user IS the client. The `client_id` column
  on every table stores the user's auth UID.

  ## Changes
  - Drop and recreate SELECT/INSERT/UPDATE/DELETE policies on:
    - clients
    - whatsapp_connections
    - ai_configs
    - messages
    - bot_controls
    - system_logs (already permissive, but align for consistency)

  ## Security
  Each user can only see and modify their own rows (client_id = auth.uid()).
  Service role (edge functions) bypasses RLS entirely — no change needed there.
*/

-- ─── clients ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "clients: owner can select" ON clients;
DROP POLICY IF EXISTS "clients: owner can update" ON clients;

CREATE POLICY "clients: owner can select"
  ON clients FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "clients: owner can update"
  ON clients FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow a user to insert their own client row (needed for auto-provision)
DROP POLICY IF EXISTS "clients: owner can insert" ON clients;
CREATE POLICY "clients: owner can insert"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ─── whatsapp_connections ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "connections: client can select" ON whatsapp_connections;
DROP POLICY IF EXISTS "connections: client can insert" ON whatsapp_connections;
DROP POLICY IF EXISTS "connections: client can update" ON whatsapp_connections;
DROP POLICY IF EXISTS "connections: client can delete" ON whatsapp_connections;

CREATE POLICY "connections: client can select"
  ON whatsapp_connections FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "connections: client can insert"
  ON whatsapp_connections FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "connections: client can update"
  ON whatsapp_connections FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "connections: client can delete"
  ON whatsapp_connections FOR DELETE TO authenticated
  USING (client_id = auth.uid());

-- ─── ai_configs ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ai_configs: client can select" ON ai_configs;
DROP POLICY IF EXISTS "ai_configs: client can insert" ON ai_configs;
DROP POLICY IF EXISTS "ai_configs: client can update" ON ai_configs;
DROP POLICY IF EXISTS "ai_configs: client can delete" ON ai_configs;

CREATE POLICY "ai_configs: client can select"
  ON ai_configs FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "ai_configs: client can insert"
  ON ai_configs FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "ai_configs: client can update"
  ON ai_configs FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "ai_configs: client can delete"
  ON ai_configs FOR DELETE TO authenticated
  USING (client_id = auth.uid());

-- ─── messages ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "messages: client can select" ON messages;
DROP POLICY IF EXISTS "messages: client can insert" ON messages;
DROP POLICY IF EXISTS "messages: client can update" ON messages;

CREATE POLICY "messages: client can select"
  ON messages FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "messages: client can insert"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "messages: client can update"
  ON messages FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- ─── system_logs ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "system_logs: client can select" ON system_logs;
DROP POLICY IF EXISTS "system_logs: client can insert" ON system_logs;

CREATE POLICY "system_logs: client can select"
  ON system_logs FOR SELECT TO authenticated
  USING (client_id IS NULL OR client_id = auth.uid());

CREATE POLICY "system_logs: client can insert"
  ON system_logs FOR INSERT TO authenticated
  WITH CHECK (client_id IS NULL OR client_id = auth.uid());

-- ─── bot_controls ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "bot_controls: client can select" ON bot_controls;
DROP POLICY IF EXISTS "bot_controls: client can insert" ON bot_controls;
DROP POLICY IF EXISTS "bot_controls: client can update" ON bot_controls;
DROP POLICY IF EXISTS "bot_controls: client can delete" ON bot_controls;

CREATE POLICY "bot_controls: client can select"
  ON bot_controls FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "bot_controls: client can insert"
  ON bot_controls FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "bot_controls: client can update"
  ON bot_controls FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "bot_controls: client can delete"
  ON bot_controls FOR DELETE TO authenticated
  USING (client_id = auth.uid());
