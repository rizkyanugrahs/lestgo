-- LestGo: refactor ke satu tabel "places".
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run.
-- Data lama (ideas & memories) disalin otomatis. Tabel lama tidak dihapus.

-- Pastikan kolom tambahan Fase 3 ada (aman kalau sudah ada)
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Foto pasangan di header
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS couple_photo_url TEXT;

CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Date Ideas',
  status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'visited')),
  planned_date DATE,
  visited_date DATE,
  location_name TEXT,
  gmaps_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  social_link TEXT,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  photos TEXT[] NOT NULL DEFAULT '{}',
  is_comfort_pick BOOLEAN NOT NULL DEFAULT FALSE,
  comfort_pick_by TEXT CHECK (comfort_pick_by IN ('kiky', 'safina')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS places_room_status_idx ON places (room_id, status);
CREATE INDEX IF NOT EXISTS places_room_planned_idx ON places (room_id, planned_date);

ALTER TABLE places ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon all" ON places;
CREATE POLICY "anon all" ON places FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'places') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE places;
  END IF;
END $$;

-- Salin data lama (hanya kalau tabel places masih kosong)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM places LIMIT 1) THEN
    INSERT INTO places (room_id, title, description, category, status, visited_date,
                        location_name, gmaps_url, latitude, longitude, social_link, photos, created_at)
    SELECT i.room_id, i.title, i.notes, COALESCE(f.category, 'Date Ideas'),
           CASE WHEN i.is_visited THEN 'visited' ELSE 'wishlist' END,
           CASE WHEN i.is_visited THEN i.created_at::date END,
           i.location_name,
           CASE WHEN i.link ~* '(google\.com/maps|goo\.gl|maps\.app)' THEN i.link END,
           i.latitude, i.longitude,
           CASE WHEN i.link IS NOT NULL AND i.link !~* '(google\.com/maps|goo\.gl|maps\.app)' THEN i.link END,
           CASE WHEN i.cover_url IS NOT NULL THEN ARRAY[i.cover_url] ELSE '{}'::text[] END,
           i.created_at
    FROM ideas i
    LEFT JOIN list_folders f ON f.id = i.folder_id
    WHERE NOT (i.is_visited AND EXISTS (
      SELECT 1 FROM memories m WHERE m.room_id = i.room_id AND lower(trim(m.place_name)) = lower(trim(i.title))
    ));

    INSERT INTO places (room_id, title, description, category, status, visited_date, rating,
                        latitude, longitude, photos, created_at)
    SELECT m.room_id, m.place_name, m.notes, COALESCE(m.category, 'Date Ideas'), 'visited', m.visit_date, m.rating,
           m.latitude, m.longitude,
           CASE WHEN m.photo_url IS NOT NULL THEN ARRAY[m.photo_url] ELSE '{}'::text[] END,
           m.created_at
    FROM memories m;
  END IF;
END $$;
