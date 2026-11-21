-- LestGo v5 (Nearby): run ONCE in Supabase > SQL Editor > New query > Run.
-- Safe to run again. Nothing is deleted and your existing security rules (RLS) stay as they are.

-- Sub-category of a Nearby place (e.g. Kopi, Makan Berat, Snack)
ALTER TABLE places ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- The list of Nearby sub-categories you manage in the app
ALTER TABLE room_settings ADD COLUMN IF NOT EXISTS nearby_categories JSONB;
