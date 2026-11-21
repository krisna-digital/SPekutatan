/**
 * supabase.js
 * ---------------------------------------------------------------
 * Lapisan cloud untuk SPK Pekutatan:
 *  - Autentikasi admin memakai Supabase Auth (password di-hash oleh Supabase)
 *  - Seluruh state aplikasi (usulan, kriteria, identitas) disimpan di satu
 *    baris tabel `spk_state` sebagai JSONB
 *  - Realtime subscription membuat perubahan admin langsung tampil di
 *    pengunjung/perangkat lain
 *
 * Objek global: SPKCloud
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const cfg = root.SPK_CONFIG || {};
  let client = null;
  let lastPushAt = '';
  let subscribed = false;
  let adminCache = null;
  const CACHE_KEY = 'spk_cloud_admin';

  function configured() {
    return !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
      cfg.SUPABASE_URL.indexOf('YOUR_PROJECT') < 0 &&
      cfg.SUPABASE_ANON_KEY.indexOf('YOUR_ANON') < 0);
  }

  function getClient() {
    if (!configured()) return null;
    if (!client) {
      if (typeof root.supabase === 'undefined' || !root.supabase.createClient) return null;
      client = root.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return client;
  }

  // ---------- Cache admin (dipakai sinkron oleh Store.getSession) ----------
  function readCache() {
    if (adminCache) return adminCache;
    try {
      const raw = root.localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const v = JSON.parse(raw);
      adminCache = v && v.email ? v : null;
      return adminCache;
    } catch (e) { return null; }
  }

  function writeCache(session) {
    adminCache = session;
    try {
      if (session) root.localStorage.setItem(CACHE_KEY, JSON.stringify(session));
      else root.localStorage.removeItem(CACHE_KEY);
    } catch (e) { /* abaikan */ }
  }

  function isAdmin() { return !!readCache(); }
  function email() { return (readCache() || {}).email || cfg.ADMIN_EMAIL || 'Administrator'; }

  /** Daftar email admin. Bisa lebih dari satu; fallback ke ADMIN_EMAIL bila ADMIN_EMAILS kosong. */
  function adminEmailList() {
    const list = Array.isArray(cfg.ADMIN_EMAILS) && cfg.ADMIN_EMAILS.length
      ? cfg.ADMIN_EMAILS
      : [cfg.ADMIN_EMAIL];
    return list.map(function (s) { return String(s || '').trim().toLowerCase(); }).filter(Boolean);
  }

  /** Hanya email yang terdaftar sebagai admin yang diakui sebagai admin. */
  function isAdminEmail(addr) {
    const list = adminEmailList();
    if (!list.length) return true; // kompatibilitas: konfigurasi kosong = semua email diakui
    return list.indexOf(String(addr || '').trim().toLowerCase()) >= 0;
  }

  let authReadyPromise = Promise.resolve();

  /** Selesai ketika sesi Supabase (termasuk tautan reset password) sudah terbaca. */
  function authReady() { return authReadyPromise; }

  /** Dipanggil sekali saat boot: sinkronkan cache dengan sesi Supabase yang tersimpan. */
  function watchAuth(onChange) {
    const sb = getClient();
    if (!sb) {
      authReadyPromise = Promise.resolve();
      if (onChange) onChange(isAdmin());
      return authReadyPromise;
    }
    authReadyPromise = sb.auth.getSession().then(function (res) {
      const s = res && res.data && res.data.session;
      const addr = s && s.user ? s.user.email : '';
      if (s && isAdminEmail(addr)) writeCache({ email: addr, at: Date.now() });
      else writeCache(null);
      if (onChange) onChange(isAdmin(), s);
      return s;
    }).catch(function () { if (onChange) onChange(isAdmin()); return null; });

    sb.auth.onAuthStateChange(function (event, session) {
      const addr = session && session.user ? session.user.email : '';
      if (session && isAdminEmail(addr)) writeCache({ email: addr, at: Date.now() });
      else writeCache(null);
      if (onChange) onChange(isAdmin(), session);
    });
    return authReadyPromise;
  }

  function signIn(emailAddr, password) {
    const sb = getClient();
    if (!sb) return Promise.reject(new Error('Supabase belum dikonfigurasi. Isi js/config.js terlebih dahulu.'));
    return sb.auth.signInWithPassword({ email: String(emailAddr || '').trim(), password: password })
      .then(function (res) {
        if (res.error) throw res.error;
        const addr = res.data.user && res.data.user.email;
        if (!isAdminEmail(addr)) {
          return sb.auth.signOut().then(function () {
            throw new Error('Email ini tidak memiliki akses admin.');
          });
        }
        writeCache({ email: addr, at: Date.now() });
        return res.data;
      });
  }

  function signOut() {
    writeCache(null);
    const sb = getClient();
    return sb ? sb.auth.signOut().then(function (r) { return r; }).catch(function () { return null; }) : Promise.resolve(null);
  }

  function resetPassword(emailAddr) {
    const sb = getClient();
    if (!sb) return Promise.reject(new Error('Supabase belum dikonfigurasi.'));
    const redirect = new URL('./index.html', root.location.href).href;
    return sb.auth.resetPasswordForEmail(String(emailAddr || '').trim(), { redirectTo: redirect });
  }

  /** Login ulang dengan password lama agar update password diizinkan Supabase. */
  function reauthenticate(password) {
    return signIn(email(), password);
  }

  function updatePassword(newPassword) {
    const sb = getClient();
    if (!sb) return Promise.reject(new Error('Supabase belum dikonfigurasi.'));
    return sb.auth.updateUser({ password: newPassword });
  }

  // ---------- State (JSONB) ----------
  function pullState() {
    const sb = getClient();
    if (!sb) return Promise.resolve(null);
    return sb.from(cfg.STATE_TABLE).select('data, updated_at').eq('id', 'main').maybeSingle()
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data && res.data.data ? res.data.data : null;
      });
  }

  function pushState(state) {
    const sb = getClient();
    if (!sb || !isAdmin()) return Promise.resolve(false);
    lastPushAt = new Date().toISOString();
    return sb.from(cfg.STATE_TABLE).upsert({
      id: 'main', data: state, updated_at: lastPushAt
    }, { onConflict: 'id' }).then(function (res) {
      if (res.error) throw res.error;
      return true;
    });
  }

  /** Dengarkan perubahan dari perangkat lain. onData(state) dipanggil saat ada update. */
  function subscribe(onData) {
    const sb = getClient();
    if (!sb || subscribed) return;
    subscribed = true;
    sb.channel('spk-state-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: cfg.STATE_TABLE
      }, function (payload) {
        const row = payload.new || {};
        // Abaikan echo dari push lokal kita sendiri.
        if (row.updated_at && lastPushAt && row.updated_at === lastPushAt) return;
        if (row.data) onData(row.data);
      })
      .subscribe();
  }

  root.SPKCloud = {
    configured: configured, getClient: getClient,
    isAdmin: isAdmin, email: email, watchAuth: watchAuth, authReady: authReady,
    signIn: signIn, signOut: signOut, resetPassword: resetPassword,
    reauthenticate: reauthenticate, updatePassword: updatePassword,
    pullState: pullState, pushState: pushState, subscribe: subscribe
  };
})(window);
