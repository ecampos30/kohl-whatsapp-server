/*
  # Allow anonymous INSERT on system_logs

  ## Summary
  The logger runs under the `anon` role (no authenticated session) and was being
  blocked by the existing INSERT policy which only allows `authenticated` users.

  ## Changes
  - Adds a new INSERT policy for the `anon` role on `system_logs`
  - Existing policies (authenticated INSERT and SELECT) are untouched

  ## Security Notes
  - `system_logs` is an internal append-only diagnostics table
  - No sensitive data is exposed; this only allows writing new log rows
  - SELECT access remains restricted to authenticated users only
*/

CREATE POLICY "system_logs: anon can insert"
  ON system_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);
