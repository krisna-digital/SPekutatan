/**
 * config.js
 * ---------------------------------------------------------------
 * Konfigurasi Supabase. File ini ikut di-deploy ke GitHub Pages dan
 * sengaja berisi ANON KEY (bukan service_role key).
 *
 * Anon key aman dipakai di browser_selama Row Level Security (RLS)
 * aktif di Supabase. Jangan pernah memasukkan service_role key di sini.
 *
 * Cara isi: lihat bagian "Konfigurasi Supabase" di README.md.
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  root.SPK_CONFIG = {
    // Project Settings → API → Project URL
    SUPABASE_URL: 'https://lmmrwhrnbgivczxazofd.supabase.co',

    // Project Settings → API → Project API keys → anon public
    SUPABASE_ANON_KEY: 'sb_publishable_w0GEylvfdAs5B37-5fikzw_G84RZ8NG',

    // Nama tabel penyimpanan state aplikasi (lihat SQL di README)
    STATE_TABLE: 'spk_state',

    // Email admin yang dibuat di Supabase → Authentication → Users.
    // Boleh lebih dari satu. ADMIN_EMAIL dipakai sebagai default di form reset password.
    ADMIN_EMAIL: 'admin@pekutatan.co.id',
    ADMIN_EMAILS: [
      'admin@pekutatan.co.id',
      'krisnadiskominfo@gmail.com'
    ],

    // Media latar cover. Taruh foto/video di assets/images/.
    // Boleh cover.jpg/png/webp atau cover.mp4/webm/ogg.
    COVER_IMAGE: './assets/images/cover.webp',

    // Foto slideshow di halaman awal. Taruh file di folder assets/images/
    // dengan nama slide-01.jpg ... slide-08.jpg (boleh jpg/png/webp).
    // File yang belum ada otomatis dilewati. Bisa juga memakai teks sendiri:
    // { src: './assets/images/jalan-desa.jpg', text: 'Jalan Desa Pekutatan' }
    SLIDES: [
      './assets/images/slide-01.jpeg',
      './assets/images/slide-02.jpeg',
      './assets/images/slide-03.jpeg',
      './assets/images/slide-04.jpeg',
      './assets/images/slide-05.jpeg',
      './assets/images/slide-06.jpeg',
      './assets/images/slide-07.jpeg',
      './assets/images/slide-08.jpeg'
    ]
  };
})(window);
