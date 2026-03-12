/*
  # Seed default client and whatsapp_connection rows

  ## Summary
  This migration ensures there is always at least one valid `clients` row and one
  valid `whatsapp_connections` row so that `bot_controls` (which has NOT-NULL FK
  constraints on both) can always be written by the webhook edge function.

  ## Changes
  1. New rows (only if they do not already exist)
     - `clients` — id = '00000000-0000-0000-0000-000000000001', name = 'Kohl Default'
     - `whatsapp_connections` — id = '00000000-0000-0000-0000-000000000002',
       linked to the client above, display_name = 'Kohl Baileys'

  ## Safety
  - Uses deterministic UUIDs so re-running never creates duplicates
  - INSERT ... ON CONFLICT DO NOTHING — fully idempotent
  - Does NOT touch any existing rows
  - Does NOT drop or alter any table/column
*/

INSERT INTO clients (id, name, email, is_active, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Kohl Default',
  'kohl-default@internal.local',
  true,
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO whatsapp_connections (
  id, client_id, phone_number, display_name, status, connection_type, created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '',
  'Kohl Baileys',
  'connected',
  'web',
  now()
)
ON CONFLICT (id) DO NOTHING;
