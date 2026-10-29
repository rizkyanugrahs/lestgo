-- LestGo V3: jalankan SEKALI di Supabase > SQL Editor > New query > Run.
-- Aman dijalankan ulang. Data lama tidak dihapus.

-- 1) Kolom baru untuk tempat
ALTER TABLE places ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES list_folders(id) ON DELETE SET NULL;
ALTER TABLE places ADD COLUMN IF NOT EXISTS minus_notes TEXT;
ALTER TABLE places ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE places ADD COLUMN IF NOT EXISTS visit_dates DATE[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS places_folder_idx ON places (folder_id);

-- Tempat yang sudah dikunjungi: catat tanggalnya sebagai kunjungan pertama
UPDATE places SET visit_dates = ARRAY[visited_date]
WHERE status = 'visited' AND visited_date IS NOT NULL AND cardinality(visit_dates) = 0;

-- 2) Hubungkan kembali tempat ke folder lamanya
UPDATE places p SET folder_id = i.folder_id
FROM ideas i
WHERE p.folder_id IS NULL AND p.room_id = i.room_id AND p.title = i.title AND p.created_at = i.created_at
  AND EXISTS (SELECT 1 FROM list_folders f WHERE f.id = i.folder_id);

-- 3) Kategori bawaan baru (Dining, Sweet Treats, Date Ideas, Cinema, Travel, Other)
UPDATE places SET category = CASE category WHEN 'Snacks' THEN 'Sweet Treats' WHEN 'Movies' THEN 'Cinema' WHEN 'Events' THEN 'Other' ELSE category END
WHERE category IN ('Snacks', 'Movies', 'Events');
UPDATE list_folders SET category = CASE category WHEN 'Snacks' THEN 'Sweet Treats' WHEN 'Movies' THEN 'Cinema' WHEN 'Events' THEN 'Other' ELSE category END
WHERE category IN ('Snacks', 'Movies', 'Events');

-- 4) Pengaturan room (tanggal jadian, foto pasangan, daftar kategori)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS couple_photo_url TEXT;

CREATE TABLE IF NOT EXISTS room_settings (
  room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  anniversary_date DATE,
  couple_photo_url TEXT,
  categories JSONB
);

INSERT INTO room_settings (room_id, anniversary_date, couple_photo_url)
SELECT id, anniversary_date, couple_photo_url FROM rooms
ON CONFLICT (room_id) DO NOTHING;

ALTER TABLE room_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon all" ON room_settings;
CREATE POLICY "anon all" ON room_settings FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'room_settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_settings;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'list_folders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE list_folders;
  END IF;
END $$;
