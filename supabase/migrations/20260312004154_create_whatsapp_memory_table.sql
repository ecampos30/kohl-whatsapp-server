/*
  # Create whatsapp_memory table

  ## Purpose
  Stores per-contact conversation history used by the whatsapp-webhook edge function
  to provide context to OpenAI on each inbound message.

  ## New Table
  - `whatsapp_memory`
    - `id` (uuid, PK)
    - `remote_jid` (text) — WhatsApp JID of the contact
    - `connection_id` (uuid, nullable FK to whatsapp_connections)
    - `role` (text) — "user" or "assistant"
    - `content` (text) — message body
    - `created_at` (timestamptz) — insertion time, used for ordering history

  ## Security
  - RLS enabled
  - Service role has full insert and select access (used by edge functions)
  - Authenticated users can view memory rows whose connection_id belongs to a
    whatsapp_connection with their client_id. Since clients has no auth_user_id,
    access is granted to any authenticated user for now (service role does the
    real data writes; this policy is read-only for the admin panel).

  ## Indexes
  - (remote_jid, created_at DESC) for the per-contact history query
  - (connection_id, created_at DESC) for connection-scoped queries
*/

CREATE TABLE IF NOT EXISTS whatsapp_memory (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remote_jid    text NOT NULL,
  connection_id uuid REFERENCES whatsapp_connections(id) ON DELETE SET NULL,
  role          text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content       text NOT NULL DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_memory_jid_created
  ON whatsapp_memory (remote_jid, created_at DESC);

CREATE INDEX IF NOT EXISTS whatsapp_memory_connection_id
  ON whatsapp_memory (connection_id, created_at DESC);

ALTER TABLE whatsapp_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert memory"
  ON whatsapp_memory FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select memory"
  ON whatsapp_memory FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Authenticated users can view memory"
  ON whatsapp_memory FOR SELECT
  TO authenticated
  USING (true);
