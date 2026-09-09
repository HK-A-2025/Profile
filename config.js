// ==========================================================
// KONFIGURASI WEB PROFILE & GALERI KELAS HK A 2025
// Fakultas Syariah — UIN Siber Syekh Nurjati Cirebon
// ==========================================================

const CONFIG = {
  // 1. Identitas Kelas
  classInfo: {
    name: "Hukum Keluarga A 2025",
    shortName: "HK A 2025",
    handle: "@chapterofushk_1a",
    faculty: "Fakultas Syariah",
    university: "UIN Siber Syekh Nurjati Cirebon",
    year: "Angkatan 2025",
    tagline: "Integritas Hukum, Berkeadaban Siber ⚖️",
    badge: "Kelas A • Semester Genap",
    logoPath: "./logo.png",
  },

  // 2. Tautan Penting
  links: {
    // Portal Resmi Web Kelas
    portal: {
      title: "Portal Resmi Web Kelas",
      subtitle: "Sistem Informasi, Presensi, Jadwal & Materi Kuliah",
      url: "https://kelas-hk-a-uinssc-2025.vercel.app",
      badge: "Utama",
      icon: "globe",
    },
    // Instagram Resmi Kelas
    instagram: {
      title: "Instagram Resmi Kelas",
      subtitle: "@chapterofushk_1a • Dokumentasi & Informasi",
      url: "https://instagram.com/chapterofushk_1a",
      handle: "chapterofushk_1a",
      badge: "Official",
      icon: "instagram",
    },
    // Repositori Tugas & Dokumen
    repository: {
      title: "Arsip Tugas & Makalah",
      subtitle: "Akses folder materi dan tugas kuliah HK A",
      url: "https://kelas-hk-a-uinssc-2025.vercel.app",
      badge: "Drive",
      icon: "folder",
    },
  },

  // 3. Keamanan Admin (Untuk Tambah & Hapus Foto)
  admin: {
    pin: "250825", // PIN Pengurus Kelas
    sessionKey: "hka_admin_auth_session",
  },

  // 4. Kredensial Supabase (Opsional - Jika nanti sudah membuat akun Supabase)
  // Biarkan kosong untuk menggunakan penyimpanan lokal otomatis.
  supabase: {
    url: "https://xjpkfdalokarxmbousvj.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcGtmZGFsb2thcnhtYm91c3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTM3MjksImV4cCI6MjEwMzU2OTcyOX0.ukLS09nUcqYzn9soXrNwngYRfK7hFPnzlH0wkOR69l8",
    bucketName: "gallery",
  },

  // 5. Kategori Galeri Foto
  categories: [
    "Semua",
    "Kuliah",
    "Momen Santai",
    "Kegiatan Kampus",
    "Prestasi",
  ],

  // 6. Foto Awal / Contoh (Ditampilkan sebelum ada foto yang diunggah ke Supabase)
  initialPhotos: [
    {
      id: "demo-1",
      title: "Pembelajaran Perdana Semester Genap",
      category: "Kuliah",
      date: "2025-02-17",
      imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop",
      caption: "Momen perkuliahan interaktif mahasiswa Hukum Keluarga A angkatan 2025.",
    },
    {
      id: "demo-2",
      title: "Diskusi Kelompok Hukum Perdata Islam",
      category: "Kuliah",
      date: "2025-02-24",
      imageUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1200&auto=format&fit=crop",
      caption: "Bedah kasus hukum keluarga kontemporer bersama kelompok belajar.",
    },
    {
      id: "demo-3",
      title: "Kebersamaan Angkatan HK A",
      category: "Momen Santai",
      date: "2025-03-01",
      imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop",
      caption: "Momen silaturahmi mempererat keakraban antar mahasiswa HK A 2025.",
    },
    {
      id: "demo-4",
      title: "Seminar Syariah & Teknologi Kampus Siber",
      category: "Kegiatan Kampus",
      date: "2025-03-05",
      imageUrl: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=1200&auto=format&fit=crop",
      caption: "Mengikuti seminar nasional peradilan agama di era digital.",
    },
  ],
};

// Ekspor ke window agar dapat diakses oleh app.js
window.CONFIG = CONFIG;
