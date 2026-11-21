/**
 * login.js
 * ---------------------------------------------------------------
 * Pengontrol halaman awal / satu halaman aplikasi.
 *  - Cover → slideshow foto → section aplikasi (navbar muncul setelah cover).
 *  - "Lihat data" membuat sesi pengunjung lalu membuka section Dashboard.
 *  - Login Admin tersedia di navbar, bukan di cover (dikelola di app.js).
 *  - Form ganti password hanya muncul saat tautan reset Supabase dibuka.
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
    const spa = App.isSpa();

    // Tautan lama (mis. detail.html?id=INF-001) dialihkan ke index.html?page=detail&id=...
    const requestedPage = query.get('page') || '';
    const requestParams = {};
    query.forEach(function (v, k) { if (k !== 'page' && k !== 'logout') requestParams[k] = v; });
    function openRequested(fallback) {
      const target = requestedPage || fallback;
      if (target) App.showPage(target, requestParams, { instant: true });
    }

    // Sudah login sebagai admin? langsung buka section yang diminta / dashboard.
    if (SPKCloud.isAdmin() && !query.has('logout') && !isRecovery) {
      openRequested('dashboard');
      return;
    }

    // Kembali ke section terakhir setelah reload karena data realtime berubah.
    let restore = '';
    try { restore = sessionStorage.getItem('spk_reload_page') || ''; sessionStorage.removeItem('spk_reload_page'); } catch (e) { /* abaikan */ }
    if (Store.getSession() && (requestedPage || restore)) {
      openRequested(restore);
      return;
    }

    const formRecovery = $('form-recovery');
    const paneRecovery = $('pane-recovery');
    const landing = $('landing-actions');

    function enterVisitor() {
      Store.setSession({ role: 'user', nama: 'Pengunjung', at: Date.now() });
      if (spa) openRequested('dashboard');
      else location.href = './dashboard.html';
    }

    // ---------- Foto latar cover (overlay hijau 50% diatur di CSS) ----------
    const cover = $('cover');
    const coverSrc = (window.SPK_CONFIG && SPK_CONFIG.COVER_IMAGE) || './assets/images/cover.jpg';
    const coverProbe = new Image();
    coverProbe.onload = function () {
      cover.style.backgroundImage = 'url("' + String(coverSrc).replace(/"/g, '%22') + '")';
    };
    coverProbe.src = coverSrc;

    // ---------- Slideshow foto ----------
    function makePlaceholder(text, from, to) {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + from + '"/><stop offset="1" stop-color="' + to + '"/>' +
        '</linearGradient></defs>' +
        '<rect width="1280" height="720" fill="url(#g)"/>' +
        '<g fill="none" stroke="rgba(255,255,255,.18)" stroke-width="3">' +
        '<circle cx="1030" cy="150" r="190"/><circle cx="1030" cy="150" r="300"/>' +
        '<circle cx="160" cy="660" r="230"/></g>' +
        '<text x="70" y="610" font-family="Arial,sans-serif" font-size="52" font-weight="700" fill="#fff">' +
        App.esc(text) + '</text></svg>';
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    const fallbackSlides = [
      { src: makePlaceholder('Selamat datang di Pekutatan', '#0b4f4a', '#14918a'), text: 'Selamat datang di SPK Desa Pekutatan' },
      { src: makePlaceholder('Pemetaan infrastruktur desa', '#0f766e', '#1e9e8f'), text: 'Pemetaan infrastruktur desa' },
      { src: makePlaceholder('Prioritas berbasis AHP', '#115e59', '#0d9488'), text: 'Perhitungan prioritas dengan metode AHP' }
    ];

    const configured = (window.SPK_CONFIG && SPK_CONFIG.SLIDES) || [];
    const wanted = configured.map(function (s) {
      return typeof s === 'string' ? { src: s, text: '' } : (s && s.src ? s : null);
    }).filter(Boolean);

    let timer = null;
    let step = function () {};

    function renderSlides(slides) {
      const host = $('hero-slides'), track = $('hero-track'), dots = $('slide-dots'), caption = $('slide-caption');
      if (timer) { clearInterval(timer); timer = null; }
      track.innerHTML = '';
      dots.innerHTML = '';

      const nodes = slides.map(function (s, i) {
        const el = document.createElement('div');
        el.className = 'hero-slide' + (i === 0 ? ' active' : '');
        el.setAttribute('role', 'group');
        el.setAttribute('aria-roledescription', 'slide');
        el.setAttribute('aria-label', 'Foto ' + (i + 1) + ' dari ' + slides.length);
        el.style.backgroundImage = 'url("' + String(s.src).replace(/"/g, '%22') + '")';
        track.appendChild(el);
        return el;
      });

      slides.forEach(function (s, i) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Tampilkan foto ' + (i + 1));
        dot.addEventListener('click', function () { go(i); });
        dots.appendChild(dot);
      });

      let current = 0;
      function go(index) {
        current = (index + slides.length) % slides.length;
        nodes.forEach(function (n, j) { n.classList.toggle('active', j === current); });
        Array.prototype.forEach.call(dots.children, function (d, j) { d.classList.toggle('active', j === current); });
        caption.textContent = slides[current].text || 'Foto kegiatan Desa Pekutatan';
        if (timer) clearInterval(timer);
        if (slides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          timer = setInterval(function () {
            if (document.visibilityState !== 'hidden') go(current + 1);
          }, 4500);
        }
      }

      step = function (delta) { go(current + delta); };
      host.classList.toggle('has-many', slides.length > 1);
      go(0);
    }

    renderSlides(fallbackSlides);

    if (wanted.length) {
      Promise.all(wanted.map(function (s) {
        return new Promise(function (resolve) {
          const img = new Image();
          img.onload = function () { resolve(s.src); };
          img.onerror = function () { resolve(null); };
          img.src = s.src;
        });
      })).then(function (results) {
        const photos = [];
        results.forEach(function (src, i) {
          if (src) photos.push({ src: src, text: (wanted[i] || {}).text || '' });
        });
        if (photos.length) renderSlides(photos);
      });
    }

    $('slide-prev').addEventListener('click', function () { step(-1); });
    $('slide-next').addEventListener('click', function () { step(1); });

    // ---------- Buat password baru dari tautan reset ----------
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
        if (spa) App.showPage('dashboard', {}, { instant: true });
        else location.replace('./dashboard.html');
      }).catch(function (error) {
        err.textContent = 'Gagal menyimpan password: ' + ((error && error.message) || error);
        btn.disabled = false;
      });
    });

    // Form reset password HANYA ditampilkan bila halaman dibuka dari tautan email.
    if (isRecovery) {
      landing.classList.add('hidden');
      paneRecovery.classList.remove('hidden');
      if (!SPKCloud.isAdmin()) {
        $('rec-err').textContent = 'Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.';
      }
    }

    $('btn-visitor').addEventListener('click', enterVisitor);
    $('btn-visitor').disabled = false; // data sudah siap setelah App.boot selesai
    if (query.has('logout') && !spa) App.toast('Anda telah keluar.');
  });
})();
