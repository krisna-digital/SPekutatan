/**
 * app.js
 * ---------------------------------------------------------------
 * Fungsi bersama untuk semua halaman (objek global "App"):
 *  - guard login & peran, render sidebar/topbar (hamburger di HP)
 *  - helper format angka, toast, dialog konfirmasi, modal
 *  - perhitungan AHP terpusat (App.compute)
 *  - export/import data JSON
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  // ---------- Ikon (SVG inline, gaya konsisten) ----------
  const ICONS = {
    home: '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    settings: '<path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    upload: '<path d="M12 15V3M7 8l5-5 5 5M4 21h16"/>',
    printer: '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/>',
    locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    alertcircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
    arrowleft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>'
  };

  function icon(name, size) {
    const s = size || 20;
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  // ---------- Navigasi ----------
  const NAV = [
    { id: 'dashboard', href: 'dashboard.html', label: 'Dashboard', icon: 'home' },
    { id: 'infrastruktur', href: 'infrastruktur.html', label: 'Data Infrastruktur', icon: 'database' },
    { id: 'gis', href: 'gis.html', label: 'Peta GIS', icon: 'map' },
    { id: 'ahp', href: 'ahp.html', label: 'Perhitungan AHP', icon: 'calc', admin: true },
    { id: 'prioritas', href: 'prioritas.html', label: 'Prioritas', icon: 'list' },
    { id: 'laporan', href: 'laporan.html', label: 'Laporan', icon: 'file', admin: true },
    { id: 'pengaturan', href: 'pengaturan.html', label: 'Pengaturan', icon: 'settings', admin: true }
  ];
  const PAGE_FILES = NAV.map(function (n) { return n.id; }).concat(['detail']);

  // ---------- Mode satu halaman (cover → slideshow → section aplikasi) ----------
  function isSpa() { return !!document.getElementById('site-navbar'); }
  const pageInitializers = {};
  const sectionTemplates = {};
  let currentPage = null;
  let pageParams = {};
  let spaReady = false;

  /** Daftarkan renderer section. Di halaman lama (non-SPA) langsung dijalankan lewat boot(). */
  function registerPage(id, fn) { pageInitializers[id] = fn; }
  function onPage(id, fn) { if (isSpa()) registerPage(id, fn); else boot(fn); }
  function getParams() { return pageParams; }
  /** Ambil parameter dari tautan section (SPA) atau query string (halaman lama). */
  function getParam(name) {
    const p = (pageParams || {})[name];
    if (p !== undefined) return p;
    const m = new RegExp('[?&]' + name + '=([^&]+)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function cacheTemplates() {
    document.querySelectorAll('.page-section').forEach(function (s) {
      if (s.id.indexOf('page-') === 0) sectionTemplates[s.id.slice(5)] = s.innerHTML;
    });
  }

  // ---------- Helper umum ----------
  function esc(v) {
    return String(v === undefined || v === null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  const rupiahFmt = new Intl.NumberFormat('id-ID');
  function fmtRp(n) { return 'Rp ' + rupiahFmt.format(Math.round(Number(n) || 0)); }
  function fmtNum(n) { return rupiahFmt.format(Number(n) || 0); }
  function fmt3(n) { return (Number(n) || 0).toFixed(3); }
  function fmt4(n) { return (Number(n) || 0).toFixed(4); }
  function fmtDateLong(d) {
    return (d || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function debounce(fn, ms) {
    let t;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms || 200);
    };
  }
  /** Di mode SPA, pencarian tanpa context diutamakan pada section aktif agar ID sama antar section tidak bentrok. */
  function activeSection() {
    return isSpa() && currentPage ? document.getElementById('page-' + currentPage) : null;
  }
  function $(sel, ctx) {
    if (ctx) return ctx.querySelector(sel);
    const section = activeSection();
    const found = section && section.querySelector(sel);
    return found || document.querySelector(sel);
  }
  function $$(sel, ctx) {
    const scope = ctx || activeSection() || document;
    return Array.prototype.slice.call(scope.querySelectorAll(sel));
  }

  function catBadge(key) {
    const k = root.Data.KATEGORI[key] || root.Data.KATEGORI.sedang;
    return '<span class="badge ' + k.key + '">' + esc(k.label) + '</span>';
  }

  // Foto bawaan (SVG) bila usulan belum punya foto
  function placeholderFoto(jenis) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">' +
      '<rect width="640" height="360" fill="#e2e8f0"/>' +
      '<g fill="none" stroke="#94a3b8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="translate(272 110)">' +
      '<path d="M48 120s48-42 48-82a48 48 0 1 0-96 0c0 40 48 82 48 82z"/><circle cx="48" cy="38" r="16"/></g>' +
      '<text x="320" y="300" font-family="Arial,sans-serif" font-size="22" fill="#64748b" text-anchor="middle">' +
      esc(jenis || 'Infrastruktur') + ' · belum ada foto</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  /** Mengecilkan foto (maks 800px, JPEG) agar muat di LocalStorage. */
  function imageToDataURL(file, maxSize, quality) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('File harus berupa gambar.')); return; }
      const reader = new FileReader();
      reader.onerror = function () { reject(new Error('Gagal membaca file.')); };
      reader.onload = function () {
        const img = new Image();
        img.onerror = function () { reject(new Error('Gambar tidak dapat dibuka.')); };
        img.onload = function () {
          const max = maxSize || 800;
          const ratio = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.round(img.width * ratio), h = Math.round(img.height * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality || 0.72));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- Toast & dialog ----------
  function toast(message, type) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'err' ? ' err' : type === 'warn' ? ' warn' : '');
    el.textContent = message;
    box.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3600);
  }

  /** Dialog konfirmasi bergaya modal. Mengembalikan Promise<boolean>. */
  function confirmDialog(opts) {
    return new Promise(function (resolve) {
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML =
        '<div class="modal sm" role="alertdialog" aria-modal="true" aria-labelledby="cf-title">' +
        '<div class="modal-head"><h3 id="cf-title">' + esc(opts.title || 'Konfirmasi') + '</h3></div>' +
        '<div class="modal-body"><p style="margin:0">' + esc(opts.message || '') + '</p></div>' +
        '<div class="modal-foot"><button type="button" class="btn" data-r="0">Batal</button>' +
        '<button type="button" class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-r="1">' + esc(opts.okText || 'Ya, lanjutkan') + '</button></div></div>';
      document.body.appendChild(wrap);
      document.body.classList.add('modal-open');
      const done = function (val) {
        document.removeEventListener('keydown', onKey);
        document.body.removeChild(wrap);
        if (!document.querySelector('.modal-backdrop:not(.hidden)')) document.body.classList.remove('modal-open');
        resolve(val);
      };
      const onKey = function (e) { if (e.key === 'Escape') done(false); };
      document.addEventListener('keydown', onKey);
      wrap.addEventListener('click', function (e) {
        const r = e.target.getAttribute && e.target.getAttribute('data-r');
        if (r !== null && r !== undefined) done(r === '1');
        else if (e.target === wrap) done(false);
      });
      const ok = wrap.querySelector('[data-r="1"]');
      if (ok) ok.focus();
    });
  }

  function openModal(el) {
    el.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }
  function closeModal(el) {
    el.classList.add('hidden');
    if (!document.querySelector('.modal-backdrop:not(.hidden)')) document.body.classList.remove('modal-open');
  }

  /** Modal login admin (dipakai pengunjung lewat tombol di navbar). */
  function openAdminLogin() {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML =
      '<div class="modal sm" role="dialog" aria-modal="true" aria-labelledby="admin-login-title">' +
      '<div class="modal-head"><h3 id="admin-login-title">Login Admin</h3>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="admin-login-close" aria-label="Tutup">' + icon('x', 18) + '</button></div>' +
      '<form id="form-admin-login" autocomplete="on" novalidate>' +
      '<div class="modal-body">' +
      '<p class="muted" style="margin:0 0 16px">Masuk dengan akun admin Supabase untuk mengelola data.</p>' +
      '<div class="field"><label for="admin-email">Email admin</label>' +
      '<input type="email" id="admin-email" autocomplete="username" placeholder="Masukkan Email" required></div>' +
      '<div class="field"><label for="admin-pass">Password</label>' +
      '<input type="password" id="admin-pass" autocomplete="current-password" required></div>' +
      '<div class="err" id="admin-login-err" role="alert"></div>' +
      '</div>' +
      '<div class="modal-foot" style="justify-content:space-between;flex-wrap:wrap">' +
      '<button type="button" class="btn btn-ghost btn-sm" id="admin-forgot">Lupa password?</button>' +
      '<span style="display:flex;gap:10px">' +
      '<button type="button" class="btn" id="admin-login-cancel">Batal</button>' +
      '<button type="submit" class="btn btn-primary">Masuk</button></span>' +
      '</div></form></div>';
    document.body.appendChild(wrap);
    document.body.classList.add('modal-open');

    function close() {
      document.removeEventListener('keydown', onKey);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      if (!document.querySelector('.modal-backdrop:not(.hidden)')) document.body.classList.remove('modal-open');
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    document.addEventListener('keydown', onKey);
    $('#admin-login-close', wrap).addEventListener('click', close);
    $('#admin-login-cancel', wrap).addEventListener('click', close);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });

    $('#admin-forgot', wrap).addEventListener('click', function () {
      const suggested = $('#admin-email', wrap).value.trim() ||
        ((root.SPK_CONFIG && root.SPK_CONFIG.ADMIN_EMAIL) ? root.SPK_CONFIG.ADMIN_EMAIL : '');
      const emailAddr = root.prompt('Tautan reset password akan dikirim ke email admin:', suggested);
      if (!emailAddr) return;
      if (!root.SPKCloud || !root.SPKCloud.configured()) { toast('Supabase belum dikonfigurasi.', 'err'); return; }
      root.SPKCloud.resetPassword(emailAddr).then(function (res) {
        if (res && res.error) throw res.error;
        toast('Tautan reset password dikirim ke ' + emailAddr + '.');
      }).catch(function (error) {
        toast('Gagal mengirim tautan: ' + ((error && error.message) || error), 'err');
      });
    });

    const form = $('#form-admin-login', wrap);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const err = $('#admin-login-err', wrap);
      err.textContent = '';
      const emailAddr = $('#admin-email', wrap).value.trim();
      const pass = $('#admin-pass', wrap).value;
      if (!emailAddr) { err.textContent = 'Email wajib diisi.'; return; }
      if (!pass) { err.textContent = 'Password wajib diisi.'; return; }
      if (!root.SPKCloud || !root.SPKCloud.configured()) {
        err.textContent = 'Supabase belum dikonfigurasi. Isi URL dan anon key di js/config.js.';
        return;
      }
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      root.SPKCloud.signIn(emailAddr, pass).then(function () {
        close();
        if (isSpa()) {
          renderNavbar(root.Store.getSession());
          if (currentPage) showPage(currentPage, pageParams, { scroll: false });
          toast('Login admin berhasil.');
        } else {
          location.reload();
        }
      }).catch(function (error) {
        err.textContent = (error && error.message) ? error.message : 'Login gagal. Periksa email dan password.';
        $('#admin-pass', wrap).select();
        btn.disabled = false;
      });
    });

    setTimeout(function () { $('#admin-email', wrap).focus(); }, 0);
  }

  // ---------- Navbar (menggantikan sidebar di mode satu halaman) ----------
  /** Buka/tutup panel menu hamburger (hanya dipakai di layar kecil). */
  function setNavMenu(open) {
    const bar = document.getElementById('site-navbar');
    if (!bar) return;
    bar.classList.toggle('menu-open', !!open);
    const btn = document.getElementById('nav-toggle');
    if (!btn) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    btn.innerHTML = icon(open ? 'x' : 'menu', 22);
  }

  function renderNavbar(session) {
    const bar = document.getElementById('site-navbar');
    if (!bar) return;
    const isAdmin = !!(session && session.role === 'admin');
    const links = NAV.filter(function (n) { return !n.admin || isAdmin; }).map(function (n) {
      return '<button type="button" class="nav-link' + (n.id === currentPage ? ' active' : '') + '" data-page="' + n.id + '">' +
        icon(n.icon, 18) + '<span>' + esc(n.label) + '</span></button>';
    }).join('');
    bar.innerHTML =
      '<div class="nav-inner">' +
      '<button type="button" class="nav-brand" id="nav-top" aria-label="Kembali ke cover">' +
      '<img src="./assets/logo.webp" alt="" width="34" height="34">' +
      '<span><strong>SPK PEKUTATAN</strong><small>Prioritas Pembangunan Desa</small></span></button>' +
      '<nav class="nav-links" id="site-nav-links" aria-label="Menu utama">' + links + '</nav>' +
      '<div class="nav-actions">' +
      (session ? '<span class="badge ' + (isAdmin ? 'info' : 'plain') + ' nav-role">' + (isAdmin ? 'Admin' : 'Pengunjung') + '</span>' : '') +
      (isAdmin
        ? '<button type="button" class="btn btn-sm" id="nav-logout">' + icon('logout', 16) + '<span>Logout</span></button>'
        : '<button type="button" class="btn btn-sm btn-primary" id="nav-admin-login">' + icon('login', 16) + '<span>Login Admin</span></button>') +
      '</div>' +
      '<button type="button" class="hamburger nav-toggle" id="nav-toggle" aria-label="Buka menu" aria-controls="site-nav-links" aria-expanded="false">' + icon('menu', 22) + '</button>' +
      '</div>';

    // Pasang langsung pada tombol agar tap di HP tidak bergantung pada event delegation.
    const toggle = document.getElementById('nav-toggle');
    if (toggle) toggle.addEventListener('click', function () {
      setNavMenu(!bar.classList.contains('menu-open'));
    });

    bar.onclick = function (e) {
      const link = e.target.closest ? e.target.closest('.nav-link') : null;
      if (link) { setNavMenu(false); showPage(link.getAttribute('data-page')); return; }
      if (e.target.closest && e.target.closest('#nav-top')) { setNavMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (e.target.closest && e.target.closest('#nav-admin-login')) { setNavMenu(false); openAdminLogin(); return; }
      if (e.target.closest && e.target.closest('#nav-logout')) { setNavMenu(false); logout(); }
    };

    setNavMenu(false);
  }

  /** Tampilkan satu section aplikasi dan sembunyikan yang lain. */
  function showPage(page, params, opts) {
    if (!isSpa()) {
      const q = params && params.id ? '?id=' + encodeURIComponent(params.id) : '';
      location.href = './' + page + '.html' + q;
      return;
    }
    opts = opts || {};
    const node = document.getElementById('page-' + page);
    if (!node || PAGE_FILES.indexOf(page) < 0) return;
    // Data bersifat publik: pengunjung tanpa sesi tetap boleh melihat semua section.
    const session = root.Store.getSession() || { role: 'user', nama: 'Pengunjung' };
    const navItem = NAV.filter(function (n) { return n.id === page; })[0];

    if (navItem && navItem.admin && session.role !== 'admin') {
      toast('Halaman tersebut hanya untuk Admin.', 'warn');
      return;
    }

    currentPage = page;
    pageParams = params || {};
    document.querySelectorAll('.page-section').forEach(function (s) { s.classList.toggle('active', s === node); });
    // Kembalikan DOM section ke template agar listener lama tidak menumpuk dan data segar.
    if (typeof sectionTemplates[page] === 'string') node.innerHTML = sectionTemplates[page];
    renderNavbar(session);
    document.title = (navItem ? navItem.label : 'Detail Infrastruktur') + ' · SPK Pekutatan';
    try {
      if (pageInitializers[page]) pageInitializers[page]();
    } catch (err) {
      console.error('Gagal menampilkan section ' + page, err);
    }
    try { sessionStorage.setItem('spk_page', page); } catch (e) { /* abaikan */ }
    document.body.classList.remove('booting');

    if (opts.scroll !== false) {
      const target = document.getElementById('app-body');
      window.scrollTo({
        top: Math.max(0, target.offsetTop + 2),
        behavior: opts.instant ? 'auto' : 'smooth'
      });
    }
  }

  /** Alihkan tautan *.html lama ke section di halaman yang sama. */
  function setupLinkRouting() {
    document.addEventListener('click', function (e) {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const m = /^\.\/([\w-]+)\.html(?:\?(.*))?$/.exec(a.getAttribute('href') || '');
      if (!m || PAGE_FILES.indexOf(m[1]) < 0) return;
      e.preventDefault();
      const params = {};
      (m[2] || '').split('&').filter(Boolean).forEach(function (kv) {
        const i = kv.indexOf('=');
        const k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i));
        params[k] = i < 0 ? '' : decodeURIComponent(kv.slice(i + 1));
      });
      showPage(m[1], params);
    });
  }

  /** Navbar tersembunyi di cover, muncul sticky setelah cover terlewat. */
  function setupNavbarReveal() {
    const bar = document.getElementById('site-navbar');
    const cover = document.getElementById('cover');
    if (!bar || !cover) return;

    let ticking = false;
    function update() {
      ticking = false;
      // Tepat di bawah cover navbar mulai tampil (termasuk saat halaman di-refresh
      // pada posisi scroll tertentu).
      const batas = Math.max(0, cover.offsetTop + cover.offsetHeight - 4);
      const show = window.scrollY >= batas;
      bar.classList.toggle('visible', show);
      document.body.classList.toggle('nav-visible', show);
      if (!show) setNavMenu(false);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      root.requestAnimationFrame(update);
    }
    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('resize', onScroll, { passive: true });
    update();

    // Tutup panel hamburger saat klik di luar navbar atau menekan Escape.
    document.addEventListener('click', function (e) {
      if (!bar.classList.contains('menu-open')) return;
      if (e.target.closest && e.target.closest('#site-navbar')) return;
      setNavMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && bar.classList.contains('menu-open')) setNavMenu(false);
    });

    // Kembali ke layout desktop: tutup panel dan kembalikan ikon hamburger.
    const mq = root.matchMedia ? root.matchMedia('(max-width: 900px)') : null;
    if (mq) {
      const onMode = function () { if (!mq.matches) setNavMenu(false); };
      if (mq.addEventListener) mq.addEventListener('change', onMode);
      else if (mq.addListener) mq.addListener(onMode);
    }
  }

  /** Footer: tahun otomatis, tautan cepat, dan tombol kembali ke atas. */
  function setupFooter() {
    const year = document.getElementById('footer-year');
    if (year) year.textContent = String(new Date().getFullYear());
    const top = document.getElementById('footer-to-top');
    if (top) top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setNavMenu(false);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.footer-links [data-page]'), function (b) {
      b.addEventListener('click', function () { showPage(b.getAttribute('data-page')); });
    });
  }

  function startSpa() {
    if (spaReady || !isSpa()) return;
    spaReady = true;
    cacheTemplates();
    setupNavbarReveal();
    setupLinkRouting();
    setupFooter();
    renderNavbar(root.Store.getSession());

    // Section Dashboard langsung aktif sejak awal. Halamannya tetap berada di
    // cover, jadi pengguna yang menggulir tanpa menekan "Lihat data" tetap
    // melihat data, sedangkan tombol "Lihat data" hanya menggulir ke Dashboard.
    if (!currentPage) showPage('dashboard', {}, { scroll: false });
  }

  // ---------- Perhitungan AHP terpusat ----------
  function compute() {
    return root.AHP.run(root.Store.getInfra(), root.Store.getCriteria(), root.Data.rawValue);
  }

  // ---------- Shell: sidebar + topbar ----------
  function renderShell(session, pageId) {
    const side = document.getElementById('sidebar');
    const top = document.getElementById('topbar');
    const isAdmin = session.role === 'admin';

    if (side) {
      const items = NAV.filter(function (n) { return !n.admin || isAdmin; }).map(function (n) {
        return '<a href="' + n.href + '"' + (n.id === pageId ? ' class="active" aria-current="page"' : '') + '>' + icon(n.icon) + '<span>' + esc(n.label) + '</span></a>';
      }).join('');
      // Pengunjung melihat "Login Admin" di sidebar; Admin melihat "Logout".
      const footButton = isAdmin
        ? '<button type="button" id="btn-logout">' + icon('logout') + '<span>Logout</span></button>'
        : '<button type="button" id="btn-admin-login">' + icon('login') + '<span>Login Admin</span></button>';
      side.innerHTML =
        '<div class="sidebar-brand"><img src="./assets/logo.webp" alt="Logo" width="40" height="40">' +
        '<div><div class="brand-title">SPK PRIORITAS PEMBANGUNAN</div><div class="brand-sub">Desa Pekutatan</div></div></div>' +
        '<nav class="nav" aria-label="Menu utama"><div class="nav-label">Menu</div>' + items + '</nav>' +
        '<div class="sidebar-foot"><div class="user-card"><div class="avatar">' + (isAdmin ? 'A' : 'P') + '</div>' +
        '<div><div class="user-name">' + esc(session.nama) + '</div><div class="user-role">' + (isAdmin ? 'Admin' : 'Pengunjung') + '</div></div></div>' +
        '<nav class="nav" style="padding:0">' + footButton + '</nav></div>';
    }
    if (top) {
      const current = NAV.filter(function (n) { return n.id === pageId; })[0];
      top.innerHTML =
        '<button type="button" class="hamburger" id="btn-menu" aria-label="Buka menu" aria-controls="sidebar" aria-expanded="false">' + icon('menu', 22) + '</button>' +
        '<div class="topbar-title">' + esc(current ? current.label : 'SPK Prioritas Pembangunan') + '</div>' +
        '<span class="badge ' + (isAdmin ? 'info' : 'plain') + '">' + (isAdmin ? 'Admin' : 'Pengunjung') + '</span>';
    }

    const scrim = document.getElementById('scrim');
    const menuBtn = document.getElementById('btn-menu');
    function setMenu(open) {
      if (side) side.classList.toggle('open', open);
      if (scrim) scrim.classList.toggle('show', open);
      if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(!side.classList.contains('open')); });
    if (scrim) scrim.addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    if (side) side.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) setMenu(false); });

    const out = document.getElementById('btn-logout');
    if (out) out.addEventListener('click', logout);
    const adminLogin = document.getElementById('btn-admin-login');
    if (adminLogin) adminLogin.addEventListener('click', openAdminLogin);
  }

  function logout() {
    root.Store.clearSession();
    const done = function () {
      if (isSpa()) {
        currentPage = null;
        try {
          sessionStorage.removeItem('spk_page');
          sessionStorage.removeItem('spk_reload_page');
        } catch (e) { /* abaikan */ }
        renderNavbar(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast('Anda telah keluar.');
        return;
      }
      location.href = './index.html?logout=1';
    };
    if (!root.SPKCloud || !root.SPKCloud.signOut) { done(); return; }
    // Tunggu sesi Supabase benar-benar terhapus sebelum pindah halaman,
    // dengan batas waktu agar logout tidak menggantung saat internet mati.
    const guard = new Promise(function (resolve) { setTimeout(resolve, 2000); });
    Promise.race([root.SPKCloud.signOut(), guard]).then(done).catch(done);
  }

  /** Banner pengingat bahwa data masih DATA DEMO. */
  function demoBanner() {
    const items = root.Store.getInfra();
    const n = items.filter(function (i) { return i.isDemo; }).length;
    const host = document.getElementById('content');
    if (!host || !n) return;
    const isAdmin = (root.Store.getSession() || {}).role === 'admin';
    const div = document.createElement('div');
    div.className = 'alert alert-warn no-print';
    div.innerHTML = icon('alert') + '<div><strong>DATA DEMO</strong><p>Terdapat ' + n + ' data contoh (bukan data resmi Desa Pekutatan). ' +
      (isAdmin ? 'Ganti dengan data penelitian melalui menu <a href="./infrastruktur.html">Data Infrastruktur</a>.' : 'Data ini hanya untuk demonstrasi.') + '</p></div>';
    host.insertBefore(div, host.firstChild);
  }

  /** Mengisi elemen <span data-ic="nama" data-size="20"> dengan ikon SVG. */
  function fillIcons(ctx) {
    $$('[data-ic]', ctx).forEach(function (el) {
      el.innerHTML = icon(el.getAttribute('data-ic'), parseInt(el.getAttribute('data-size'), 10) || 20);
      el.style.display = 'inline-flex';
    });
  }

  /**
   * Inisialisasi halaman terproteksi.
   * @param {{page:string, adminOnly?:boolean, noDemoBanner?:boolean}} opts
   * @returns {Object|null} sesi pengguna, atau null bila dialihkan
   */
  function init(opts) {
    // Sesi tidak lagi diperlukan untuk membaca data. Defaultnya adalah pengunjung.
    const session = root.Store.getSession() || { role: 'user', nama: 'Pengunjung', at: Date.now() };
    const spa = isSpa();
    if (opts.adminOnly && session.role !== 'admin') {
      if (spa) { toast('Halaman tersebut hanya untuk Admin.', 'warn'); return null; }
      root.Store.setSession(session);
      location.replace('./dashboard.html?akses=ditolak');
      return null;
    }
    if (!spa) renderShell(session, opts.page);
    fillIcons();
    document.body.classList.remove('booting');
    if (!opts.noDemoBanner && !spa) demoBanner();
    if (!spa && /[?&]akses=ditolak/.test(location.search)) {
      toast('Halaman tersebut hanya untuk Admin.', 'warn');
    }
    return session;
  }

  // ---------- Export / Import ----------
  function exportJSON() {
    const res = compute();
    const hasil = res.alt.map(function (r) {
      return { id: r.item.id, nama: r.item.nama, nilaiAHP: Number(r.final.toFixed(6)), ranking: r.rank, prioritas: root.Data.KATEGORI[r.kategori].label };
    });
    const obj = root.Store.exportAll(hasil);
    const stamp = new Date().toISOString().slice(0, 10);
    download('spk-pekutatan-' + stamp + '.json', JSON.stringify(obj, null, 2), 'application/json');
    toast('Data berhasil diekspor.');
  }

  /** Membuka pemilih file JSON, lalu mengimpornya setelah konfirmasi. */
  function importJSON(onDone) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json,.json';
    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onerror = function () { toast('Gagal membaca file.', 'err'); };
      reader.onload = function () {
        let obj;
        try { obj = JSON.parse(reader.result); } catch (e) { toast('File bukan JSON yang valid.', 'err'); return; }
        confirmDialog({
          title: 'Import data', danger: true, okText: 'Ganti data',
          message: 'Seluruh data usulan, kriteria, dan pengaturan saat ini akan DIGANTI dengan isi file "' + file.name + '". Lanjutkan?'
        }).then(function (ok) {
          if (!ok) return;
          const r = root.Store.importAll(obj);
          if (!r.ok) { toast(r.message, 'err'); return; }
          toast('Import berhasil: ' + r.count + ' data' + (r.skipped ? ' (' + r.skipped + ' baris dilewati)' : '') + '.');
          if (onDone) onDone();
        });
      };
      reader.readAsText(file);
    });
    input.click();
  }

  // ---------- Sinkronisasi realtime & boot ----------
  function isLoginPage() { return !isSpa() && !!document.querySelector('.login-page'); }

  root.addEventListener('spk:data', function () {
    if (isSpa() && currentPage) {
      // Simpan section aktif agar setelah reload pengguna kembali ke tempat semula.
      try { sessionStorage.setItem('spk_reload_page', currentPage); } catch (e) { /* abaikan */ }
    }
    if (isLoginPage()) return;
    toast('Data diperbarui oleh Admin. Memuat ulang…', 'warn');
    if (document.body.classList.contains('modal-open')) {
      // Jangan menimpa formulir yang sedang diedit; tunggu sampai ditutup.
      const check = setInterval(function () {
        if (!document.body.classList.contains('modal-open')) {
          clearInterval(check);
          location.reload();
        }
      }, 400);
      return;
    }
    setTimeout(function () { location.reload(); }, 1200);
  });

  root.addEventListener('spk:authlost', function () {
    if (isLoginPage()) return;
    toast('Sesi admin berakhir. Silakan masuk kembali.', 'warn');
    if (isSpa()) {
      setTimeout(function () {
        try { sessionStorage.removeItem('spk_page'); } catch (e) { /* abaikan */ }
        logout();
      }, 1200);
      return;
    }
    setTimeout(function () { location.href = './index.html?logout=1'; }, 1200);
  });

  /**
   * Inisialisasi halaman setelah DOM siap DAN data/sesi cloud terbaca.
   * Semua halaman memakai ini menggantikan DOMContentLoaded langsung.
   */
  function boot(fn) {
    function start() {
      let tasks;
      try {
        tasks = [root.Store.ready()];
        if (root.SPKCloud && root.SPKCloud.authReady) {
          tasks.push(Promise.race([
            root.SPKCloud.authReady(),
            new Promise(function (resolve) { setTimeout(resolve, 1500); })
          ]));
        }
      } catch (err) {
        console.error('Gagal menyiapkan data:', err);
        startSpa();
        document.body.classList.remove('booting');
        fn();
        return;
      }
      const finish = function () {
        startSpa();
        document.body.classList.remove('booting');
        fn();
      };
      Promise.all(tasks).then(finish, function (err) {
        console.error('Gagal menyiapkan data:', err);
        finish();
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }

  root.App = {
    boot: boot, isSpa: isSpa, startSpa: startSpa,
    onPage: onPage, registerPage: registerPage, showPage: showPage, getParams: getParams, param: getParam,
    renderNavbar: renderNavbar,
    icon: icon, esc: esc, fmtRp: fmtRp, fmtNum: fmtNum, fmt3: fmt3, fmt4: fmt4, fmtDateLong: fmtDateLong,
    debounce: debounce, $: $, $$: $$, catBadge: catBadge, placeholderFoto: placeholderFoto,
    download: download, imageToDataURL: imageToDataURL,
    toast: toast, confirm: confirmDialog, openModal: openModal, closeModal: closeModal,
    compute: compute, init: init, fillIcons: fillIcons, logout: logout, exportJSON: exportJSON, importJSON: importJSON
  };
})(window);
