-- ==========================================================
-- SKEMA SUPABASE UNTUK GALERI & PESAN KELAS HK A 2025
-- Fakultas Syariah — UIN Siber Syekh Nurjati Cirebon
-- ==========================================================
-- Petunjuk:
-- 1. Buka dashboard Supabase Anda -> menu "SQL Editor".
-- 2. Salin dan tempel seluruh teks SQL ini, lalu klik tombol "Run".
-- ==========================================================

-- 1. Tabel Foto Galeri
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'Kuliah',
  date DATE DEFAULT CURRENT_DATE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Pesan Anonim (NGL Kelas)
CREATE TABLE IF NOT EXISTS public.anonymous_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_messages ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan Akses (RLS Policies)
-- Semua orang bisa melihat foto di galeri
CREATE POLICY "Public read gallery_photos" 
  ON public.gallery_photos FOR SELECT USING (true);

-- Pengurus kelas dapat menambah dan menghapus foto
CREATE POLICY "Public insert gallery_photos" 
  ON public.gallery_photos FOR INSERT WITH CHECK (true);

CREATE POLICY "Public delete gallery_photos" 
  ON public.gallery_photos FOR DELETE USING (true);

-- Semua orang bisa mengirim pesan anonim
CREATE POLICY "Public insert anonymous_messages" 
  ON public.anonymous_messages FOR INSERT WITH CHECK (true);

-- Semua orang bisa membaca pesan anonim (atau hanya admin)
CREATE POLICY "Public read anonymous_messages" 
  ON public.anonymous_messages FOR SELECT USING (true);

-- 5. Buat Storage Bucket untuk File Foto Galeri
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Kebijakan Akses Storage Bucket 'gallery'
CREATE POLICY "Public read gallery storage" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'gallery');

CREATE POLICY "Public upload gallery storage" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Public delete gallery storage" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'gallery');
