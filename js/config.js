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
    SUPABASE_URL: 'https://YOUR_PROJECT_REF.supabase.co',

    // Project Settings → API → Project API keys → anon public
    SUPABASE_ANON_KEY: 'YOUR_ANON_PUBLIC_KEY',

    // Nama tabel penyimpanan state aplikasi (lihat SQL di README)
    STATE_TABLE: 'spk_state',

    // Email admin yang dibuat di Supabase → Authentication → Users
    ADMIN_EMAIL: 'admin@peku.local'
  };
})(window);
