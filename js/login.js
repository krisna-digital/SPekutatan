/**
 * login.js
 * ---------------------------------------------------------------
 * Halaman masuk.
 *  - Admin : email + password diverifikasi Supabase Auth. Password di-hash
 *            di server Supabase, bukan di browser dan bukan di LocalStorage.
 *  - Pengunjung : masuk tanpa password (hak lihat saja).
 *  - Lupa password : Supabase mengirim tautan reset ke email admin.
 * ---------------------------------------------------------------
 */
(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };
  // Deteksi lebih awal: supabase-js akan membersihkan token dari URL setelah client dibuat.
  const isRecovery = new URLSearchParams(location.search).get('type') === 'recovery' ||
    /[?&#](?:type=recovery|access_token=)/.test(location.href);

  App.boot(function () {
    const query = new URLSearchParams(location.search);

    // Sudah login? langsung ke dashboard, kecuali baru logout / sedang reset password.
    if (SPKCloud.isAdmin() && !query.has('logout') && !isRecovery) {
      location.replace('./dashboard.html');
      return;
    }

    const paneAdmin = $('pane-admin'), paneUser = $('pane-user');
    const tabAdmin = $('tab-admin'), tabUser = $('tab-user');
    const formLogin = $('form-login'), formRecovery = $('form-recovery');

    function selectTab(which) {
      const admin = which === 'admin';
      tabAdmin.setAttribute('aria-selected', admin ? 'true' : 'false');
      tabUser.setAttribute('aria-selected', admin ? 'false' : 'true');
      paneAdmin.classList.toggle('hidden', !admin);
      paneUser.classList.toggle('hidden', admin);
    }
    tabAdmin.addEventListener('click', function () { selectTab('admin'); });
    tabUser.addEventListener('click', function () { selectTab('user'); });

    function enterVisitor() {
      Store.setSession({ role: 'user', nama: 'Pengunjung', at: Date.now() });
      location.href = './dashboard.html';
    }

    // ---------- Login admin (Supabase Auth) ----------
    formLogin.addEventListener('submit', function (e) {
      e.preventDefault();
      const err = $('login-err');
      err.textContent = '';
      const emailAddr = $('login-email').value.trim();
      const pass = $('login-pass').value;
      if (!emailAddr) { err.textContent = 'Email wajib diisi.'; return; }
      if (!pass) { err.textContent = 'Password wajib diisi.'; return; }
      if (!SPKCloud.configured()) {
        err.textContent = 'Supabase belum dikonfigurasi. Isi URL dan anon key di js/config.js.';
        return;
      }
      const btn = formLogin.querySelector('[type="submit"]');
      btn.disabled = true;
      SPKCloud.signIn(emailAddr, pass).then(function () {
        location.href = './dashboard.html';
      }).catch(function (error) {
        err.textContent = (error && error.message) ? error.message : 'Login gagal. Periksa email dan password.';
        $('login-pass').select();
        btn.disabled = false;
      });
    });

    // ---------- Lupa password ----------
    $('btn-forgot').addEventListener('click', function () {
      const suggested = $('login-email').value.trim() ||
        ((window.SPK_CONFIG && SPK_CONFIG.ADMIN_EMAIL) ? SPK_CONFIG.ADMIN_EMAIL : '');
      const emailAddr = window.prompt('Tautan reset password akan dikirim ke email admin:', suggested);
      if (!emailAddr) return;
      if (!SPKCloud.configured()) { App.toast('Supabase belum dikonfigurasi.', 'err'); return; }
      SPKCloud.resetPassword(emailAddr).then(function (res) {
        if (res && res.error) throw res.error;
        App.toast('Tautan reset password dikirim ke ' + emailAddr + '.');
      }).catch(function (error) {
        App.toast('Gagal mengirim tautan: ' + ((error && error.message) || error), 'err');
      });
    });

    // ---------- Buat password baru dari tautan reset ----------
    if (isRecovery) {
      selectTab('admin');
      formLogin.classList.add('hidden');
      formRecovery.classList.remove('hidden');
      if (!SPKCloud.isAdmin()) {
        $('rec-err').textContent = 'Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.';
        return;
      }
    }

    formRecovery.addEventListener('submit', function (e) {
      e.preventDefault();
      const err = $('rec-err');
      err.textContent = '';
      const p1 = $('rec-pass').value, p2 = $('rec-pass2').value;
      if (p1.length < 6) { err.textContent = 'Password minimal 6 karakter.'; return; }
      if (p1 !== p2) { err.textContent = 'Konfirmasi password tidak sama.'; return; }
      const btn = formRecovery.querySelector('[type="submit"]');
      btn.disabled = true;
      SPKCloud.updatePassword(p1).then(function (res) {
        if (res && res.error) throw res.error;
        history.replaceState(null, '', './index.html');
        location.replace('./dashboard.html');
      }).catch(function (error) {
        err.textContent = 'Gagal menyimpan password: ' + ((error && error.message) || error);
        btn.disabled = false;
      });
    });

    $('btn-visitor').addEventListener('click', enterVisitor);
    if (query.has('logout')) App.toast('Anda telah keluar.');
  });
})();
