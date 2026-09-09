# Profile & Galeri Resmi HK A 2025
### Fakultas Syariah — UIN Siber Syekh Nurjati Cirebon

🌐 **Live URL**: [https://hk-a-2025.github.io/Profile/](https://hk-a-2025.github.io/Profile/)  
🏛️ **Portal Web Kelas**: [https://kelas-hk-a-uinssc-2025.vercel.app](https://kelas-hk-a-uinssc-2025.vercel.app)  
📸 **Instagram Resmi**: [@chapterofushka](https://instagram.com/chapterofushka)  

---

## ✨ Fitur Website

1. **Bio-Link Elegan & Mobile-First**:
   - Kartu Utama: **Portal Resmi Web Kelas** (Presensi, Jadwal, 11 Mata Kuliah).
   - Akses cepat ke **Instagram Resmi** (`@chapterofushka`).
   - Shortcut ke **Galeri Foto Dokumentasi**.
   - Shortcut ke **Kotak Pesan Anonim (NGL Kelas)**.
   - Shortcut ke **Bank Materi & Repositori Tugas**.

2. **Galeri Dokumentasi Interaktif**:
   - Filter Kategori: *Semua*, *Kuliah*, *Momen Santai*, *Kegiatan Kampus*, *Prestasi*.
   - Modal Lightbox Fullscreen untuk melihat foto resolusi tinggi.
   - Tombol **Unduh Foto (HD)** langsung dari browser.

3. **Panel Admin Pengurus (Upload & Hapus Foto)**:
   - Dilindungi PIN Keamanan: `250825` (bisa diubah di `config.js`).
   - Upload foto kegiatan langsung dari galeri HP atau laptop.
   - Hapus foto kapan saja dengan 1 klik.

4. **Kotak Pesan Anonim (NGL)**:
   - Mahasiswa dapat mengirim aspirasi, kritik, dan saran tanpa nama.
   - Admin yang login dapat melihat daftar pesan yang masuk.

---

## ⚙️ Panduan Menghubungkan ke Supabase (Cloud Sync)

Web ini sudah **langsung berjalan** menggunakan penyimpanan lokal. Jika Anda ingin foto tersimpan di cloud Supabase dan tersinkronisasi di semua HP teman sekelas:

1. Buat project baru di [supabase.com](https://supabase.com).
2. Masuk ke menu **SQL Editor**, buka file `supabase_setup.sql` di repository ini, salin seluruh kodenya lalu klik **Run**.
3. Masuk ke **Project Settings -> API**, salin:
   - **Project URL**
   - **anon / public key**
4. Buka file `config.js`, tempelkan ke bagian:
   ```javascript
   supabase: {
     url: "https://your-project.supabase.co",
     anonKey: "your-anon-key-here",
     bucketName: "gallery",
   }
   ```
5. Commit dan push ke GitHub. Selesai! Foto akan otomatis tersimpan di Supabase Storage.