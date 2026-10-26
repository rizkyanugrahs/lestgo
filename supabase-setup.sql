CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  anniversary_date DATE,
  partner_status VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS list_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES list_folders(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  notes TEXT,
  link TEXT,
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_visited BOOLEAN DEFAULT FALSE,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  place_name VARCHAR(150) NOT NULL,
  photo_url TEXT NOT NULL,
  visit_date DATE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS comfort_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  location_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON list_folders (room_id);
CREATE INDEX ON ideas (room_id, is_visited);
CREATE INDEX ON memories (room_id, visit_date DESC);
CREATE INDEX ON comfort_foods (room_id);

ALTER PUBLICATION supabase_realtime ADD TABLE ideas, memories, list_folders, comfort_foods, rooms;

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE comfort_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon all" ON rooms         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon all" ON list_folders  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon all" ON ideas         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon all" ON memories      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon all" ON comfort_foods FOR ALL TO anon USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT DO NOTHING;
CREATE POLICY "anon upload" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'photos');
CREATE POLICY "anon read"   ON storage.objects FOR SELECT TO anon USING (bucket_id = 'photos');
