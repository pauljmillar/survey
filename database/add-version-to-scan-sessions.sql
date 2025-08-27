-- Run this in your Supabase SQL editor
ALTER TABLE scan_sessions ADD COLUMN version TEXT;
COMMENT ON COLUMN scan_sessions.version IS 'App version when the session was created (e.g., "0.0.1")';