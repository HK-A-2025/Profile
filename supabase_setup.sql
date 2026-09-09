-- ==========================================================
-- SKEMA SUPABASE UNTUK GALERI & PESAN KELAS HK A 2025
-- Fakultas Syariah — UIN Siber Syekh Nurjati Cirebon
-- ==========================================================

-- 1. Tabel Foto & Video Galeri
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'Kuliah',
  date DATE DEFAULT CURRENT_DATE,
  image_url TEXT NOT NULL,
  caption TEXT,
  media_type VARCHAR(20) DEFAULT 'image',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi aman jika tabel sudah dibuat sebelumnya:
ALTER TABLE public.gallery_photos ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image';

-- 2. Tabel Pesan Anonim (NGL Kelas)
CREATE TABLE IF NOT EXISTS public.anonymous_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_messages ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan Akses (Idempotent: Aman dijalankan berulang)
DROP POLICY IF EXISTS "Public read gallery_photos" ON public.gallery_photos;
CREATE POLICY "Public read gallery_photos" ON public.gallery_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert gallery_photos" ON public.gallery_photos;
CREATE POLICY "Public insert gallery_photos" ON public.gallery_photos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete gallery_photos" ON public.gallery_photos;
CREATE POLICY "Public delete gallery_photos" ON public.gallery_photos FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public insert anonymous_messages" ON public.anonymous_messages;
CREATE POLICY "Public insert anonymous_messages" ON public.anonymous_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read anonymous_messages" ON public.anonymous_messages;
CREATE POLICY "Public read anonymous_messages" ON public.anonymous_messages FOR SELECT USING (true);

-- 5. Storage Bucket untuk File Foto Galeri
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read gallery storage" ON storage.objects;
CREATE POLICY "Public read gallery storage" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Public upload gallery storage" ON storage.objects;
CREATE POLICY "Public upload gallery storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Public delete gallery storage" ON storage.objects;
CREATE POLICY "Public delete gallery storage" ON storage.objects FOR DELETE USING (bucket_id = 'gallery');
