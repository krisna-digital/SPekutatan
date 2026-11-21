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

    // Email admin yang dibuat di Supabase → Authentication → Users
    ADMIN_EMAIL: 'admin@pekutatan.co.id'
  };
})(window);
