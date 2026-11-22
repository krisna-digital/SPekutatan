/**
 * storage.js
 * ---------------------------------------------------------------
 * Lapisan penyimpanan data SPK Pekutatan.
 *
 * - Sumber data utama: Supabase (tabel `spk_state`, satu baris JSONB)
 * - Salinan lokal (LocalStorage) dipakai untuk tampilan cepat & cadangan
 * - Realtime: perubahan admin di perangkat mana pun langsung diterima
 *   pengunjung lewat event `spk:data`
 * - Autentikasi admin sepenuhnya ditangani Supabase Auth (SPKCloud)
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const KEYS = {
    state: 'spk_pkt_state_v2',
    infra: 'spk_pkt_infrastruktur',     // legacy (migrasi)
    criteria: 'spk_pkt_kriteria',       // legacy (migrasi)
    meta: 'spk_pkt_meta',               // legacy (migrasi)
    session: 'spk_pkt_session'          // sesi pengunjung
  };
  const APP_ID = 'SPK-PEKUTATAN';
  const FORMAT_VERSION = 2;

  const memory = {};
  const memorySession = {};
  let state = null;
  let readyPromise = null;

  function readRaw(storageName, mem, key) {
    try {
      const s = root[storageName];
      const v = s ? s.getItem(key) : null;
      return v === undefined ? null : v;
    } catch (e) {
      return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null;
    }
  }

  function writeRaw(storageName, mem, key, value) {
    try {
      root[storageName].setItem(key, value);
      return true;
    } catch (e) {
      mem[key] = value;
      return storageName === 'sessionStorage';
    }
  }

  function removeRaw(storageName, mem, key) {
    try { root[storageName].removeItem(key); } catch (e) { /* abaikan */ }
    delete mem[key];
  }

  function readJSON(key, fallback) {
    const raw = readRaw('localStorage', memory, key);
    if (raw === null) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  function writeJSON(key, value) { return writeRaw('localStorage', memory, key, JSON.stringify(value)); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ---------- Validasi ----------
  function validCriteriaState(s) {
    if (!s || !Array.isArray(s.kriteria) || !root.AHP.isValidMatrix(s.matrix)) return false;
    if (s.kriteria.length !== s.matrix.length) return false;
    return s.kriteria.every(function (c) {
      return c && typeof c.nama === 'string' && c.nama.trim() &&
        (c.tipe === 'benefit' || c.tipe === 'cost') &&
        ['kondisi', 'urgensi', 'terdampak', 'manfaat', 'biaya'].indexOf(c.field) >= 0;
    });
  }

  function validState(s) {
    return !!(s && Array.isArray(s.infrastruktur) && validCriteriaState(s.kriteria) &&
      s.meta && typeof s.meta === 'object');
  }

  function defaultState() {
    return {
      infrastruktur: root.Data.demoData(),
      kriteria: root.Data.defaultCriteriaState(),
      meta: Object.assign({}, root.Data.DEFAULT_META)
    };
  }

  /**
   * Membersihkan/menyesuaikan state. `migrasi=true` mengganti data demo lama
   * yang koordinatnya berada di luar garis merah dengan demo baru.
   */
  function normalizeState(s, migrasi) {
    const out = {
      infrastruktur: Array.isArray(s.infrastruktur) ? s.infrastruktur.slice() : [],
      kriteria: validCriteriaState(s.kriteria) ? clone(s.kriteria) : root.Data.defaultCriteriaState(),
      meta: Object.assign({}, root.Data.DEFAULT_META, s.meta && typeof s.meta === 'object' ? s.meta : {})
    };
    if (migrasi !== false) {
      const demoLama = out.infrastruktur.some(function (it) {
        return it && it.isDemo && !root.Data.isInsideBoundary(Number(it.lat), Number(it.lng));
      });
      if (demoLama) {
        const kept = out.infrastruktur.filter(function (it) { return !(it && it.isDemo); });
        const used = {};
        kept.forEach(function (it) { if (it && it.id) used[it.id] = true; });
        const demo = root.Data.demoData().map(function (it) {
          if (!used[it.id]) { used[it.id] = true; return it; }
          let n = 1, id;
          do { id = 'DMO-' + String(n++).padStart(3, '0'); } while (used[id]);
          used[id] = true; it.id = id; return it;
        });
        out.infrastruktur = demo.concat(kept);
      }
    }
    return out;
  }

  function loadLocalState() {
    const saved = readJSON(KEYS.state, null);
    if (validState(saved)) return normalizeState(saved, true);

    // Migrasi dari format lama (localStorage per-keys).
    const infra = readJSON(KEYS.infra, null);
    const kriteria = readJSON(KEYS.criteria, null);
    const meta = readJSON(KEYS.meta, null);
    const merged = {
      infrastruktur: Array.isArray(infra) ? infra : root.Data.demoData(),
      kriteria: validCriteriaState(kriteria) ? kriteria : root.Data.defaultCriteriaState(),
      meta: Object.assign({}, root.Data.DEFAULT_META, meta && typeof meta === 'object' ? meta : {})
    };
    return normalizeState(merged, true);
  }

  function persistLocal() {
    writeJSON(KEYS.state, state);
    // Mirror legacy keys agar export/cadangan lama tetap terbaca.
    writeJSON(KEYS.infra, state.infrastruktur);
    writeJSON(KEYS.criteria, state.kriteria);
    writeJSON(KEYS.meta, state.meta);
  }

  function push() {
    persistLocal();
    if (!root.SPKCloud || !root.SPKCloud.isAdmin()) return;
    root.SPKCloud.pushState(state).catch(function (err) {
      console.warn('Gagal menyimpan ke Supabase:', err);
      if (root.App && root.App.toast) root.App.toast('Gagal menyimpan ke Supabase: ' + (err.message || err), 'err');
    });
  }

  function applyRemote(remote, notify) {
    if (!validState(remote)) return false;
    state = normalizeState(remote, false); // remote adalah sumber kebenaran
    persistLocal();
    if (notify !== false) root.dispatchEvent(new CustomEvent('spk:data'));
    return true;
  }

  /** Dipanggil oleh App.boot. Memuat data cloud sebelum halaman dirender. */
  function ready() {
    if (!readyPromise) {
      if (!state) state = loadLocalState();
      persistLocal();

      // Pasang pengamat auth & realtime lebih awal agar App.boot dapat
      // menunggu sesi Supabase sebelum memutuskan arah halaman.
      let wasAdmin = root.SPKCloud.isAdmin();
      root.SPKCloud.watchAuth(function (admin) {
        const sebelumnya = wasAdmin;
        wasAdmin = admin;
        // Sesi admin berakhir / logout dari perangkat lain / token kedaluwarsa.
        if (sebelumnya && !admin && !/[?&]logout/.test(location.search)) {
          root.dispatchEvent(new CustomEvent('spk:authlost'));
        }
      });
      root.SPKCloud.subscribe(function (remote) { applyRemote(remote, true); });

      const cloud = root.SPKCloud.pullState().then(function (remote) {
        if (remote) applyRemote(remote, false);
        else if (root.SPKCloud.isAdmin()) return root.SPKCloud.pushState(state).catch(function () { return false; });
        return true;
      }).catch(function (err) {
        console.warn('Supabase tidak dapat dijangkau; memakai salinan lokal.', err);
        return false;
      });
      // Jangan biarkan boot menggantung saat jaringan lambat: salinan lokal
      // tetap dipakai, data cloud menyusul lewat realtime saat tersedia.
      const timeout = new Promise(function (resolve) { setTimeout(function () { resolve(false); }, 3000); });
      readyPromise = Promise.race([cloud, timeout]).then(function () { return state; });
    }
    return readyPromise;
  }

  // ---------- Normalisasi satu data infrastruktur ----------
  function labelOf(list, value, fallback) {
    const v = String(value === undefined || value === null ? '' : value).trim().toLowerCase();
    for (let i = 0; i < list.length; i++) {
      const lab = typeof list[i] === 'string' ? list[i] : list[i].label;
      if (lab.toLowerCase() === v) return lab;
    }
    return fallback;
  }

  function sanitizeItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const nama = String(raw.nama || '').trim();
    const lat = Number(raw.lat);
    const lng = Number(raw.lng);
    if (!nama) return null;
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    const D = root.Data;
    // Titik di luar garis merah batas desa tidak boleh ditambahkan.
    if (D && typeof D.isInsideBoundary === 'function' && !D.isInsideBoundary(lat, lng)) return null;
    const foto = typeof raw.foto === 'string' && /^(data:image\/|https?:\/\/|\.\/)/.test(raw.foto) ? raw.foto : '';
    return {
      id: String(raw.id || '').trim(),
      nama: nama.slice(0, 150),
      jenis: labelOf(D.JENIS, raw.jenis, 'Infrastruktur Lainnya'),
      banjar: String(raw.banjar || '').trim().slice(0, 80),
      deskripsi: String(raw.deskripsi || '').trim().slice(0, 1000),
      kondisi: labelOf(D.KONDISI, raw.kondisi, 'Rusak Sedang'),
      urgensi: labelOf(D.URGENSI, raw.urgensi, 'Sedang'),
      terdampak: Math.max(0, Math.round(Number(raw.terdampak) || 0)),
      manfaat: labelOf(D.MANFAAT, raw.manfaat, 'Sedang'),
      biaya: Math.max(0, Math.round(Number(raw.biaya) || 0)),
      lat: lat,
      lng: lng,
      foto: foto,
      status: labelOf(D.STATUS, raw.status, 'Usulan'),
      isDemo: raw.isDemo === true
    };
  }

  function nextId(items) {
    let max = 0;
    items.forEach(function (it) {
      const m = /^INF-(\d+)$/.exec(it.id || '');
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'INF-' + String(max + 1).padStart(3, '0');
  }

  // ---------- API data ----------
  function getInfra() {
    if (!state) state = loadLocalState();
    return state.infrastruktur;
  }
  function saveInfra(items) { getInfra(); state.infrastruktur = items; push(); return true; }

  function getCriteria() {
    if (!state) state = loadLocalState();
    return state.kriteria;
  }
  function saveCriteria(s) { getCriteria(); state.kriteria = clone(s); push(); return true; }

  function getMeta() {
    if (!state) state = loadLocalState();
    return Object.assign({}, root.Data.DEFAULT_META, state.meta || {});
  }
  function saveMeta(m) { getMeta(); state.meta = Object.assign({}, m); push(); return true; }

  function resetDemo() {
    getInfra();
    state.infrastruktur = root.Data.demoData();
    state.kriteria = root.Data.defaultCriteriaState();
    push();
  }
  function clearInfra() { getInfra(); state.infrastruktur = []; push(); }

  function exportAll(hasil) {
    const out = {
      app: APP_ID,
      versi: FORMAT_VERSION,
      diekspor: new Date().toISOString(),
      meta: getMeta(),
      kriteria: getCriteria(),
      infrastruktur: getInfra()
    };
    if (hasil) out.hasil = hasil;
    return out;
  }

  function importAll(obj) {
    if (!obj || typeof obj !== 'object' || obj.app !== APP_ID) {
      return { ok: false, message: 'File bukan hasil export aplikasi SPK Pekutatan.' };
    }
    if (!Array.isArray(obj.infrastruktur)) {
      return { ok: false, message: 'File tidak memuat daftar infrastruktur.' };
    }
    const items = [];
    let skipped = 0;
    obj.infrastruktur.forEach(function (raw) {
      const clean = sanitizeItem(raw);
      if (!clean) { skipped++; return; }
      items.push(clean);
    });
    const used = {};
    items.forEach(function (it) {
      if (it.id && !used[it.id]) used[it.id] = true; else it.id = '';
    });
    items.forEach(function (it) {
      if (!it.id) { it.id = nextId(items); used[it.id] = true; }
    });
    if (!items.length && obj.infrastruktur.length) {
      return { ok: false, message: 'Tidak ada data yang valid pada file (nama atau koordinat tidak sesuai).' };
    }

    const nextKriteria = validCriteriaState(obj.kriteria) ? clone(obj.kriteria) : getCriteria();
    const nextMeta = getMeta();
    if (obj.meta && typeof obj.meta === 'object') {
      Object.keys(root.Data.DEFAULT_META).forEach(function (k) {
        if (typeof obj.meta[k] === 'string') nextMeta[k] = obj.meta[k].slice(0, 200);
      });
    }
    state.infrastruktur = items;
    state.kriteria = nextKriteria;
    state.meta = nextMeta;
    push();
    return { ok: true, message: 'Import berhasil.', count: items.length, skipped: skipped };
  }

  // ---------- Sesi ----------
  // Admin: langsung dari Supabase Auth (cache di SPKCloud).
  // Pengunjung: sesi lokal tanpa password, hanya hak lihat.
  function getSession() {
    if (root.SPKCloud && root.SPKCloud.isAdmin()) {
      return { role: 'admin', nama: root.SPKCloud.email(), at: Date.now() };
    }
    const raw = readRaw('sessionStorage', memorySession, KEYS.session);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw);
      return s && s.role === 'user' ? s : null;
    } catch (e) { return null; }
  }

  function setSession(s) {
    writeRaw('sessionStorage', memorySession, KEYS.session, JSON.stringify(s));
  }
  function clearSession() { removeRaw('sessionStorage', memorySession, KEYS.session); }

  const api = {
    KEYS: KEYS, APP_ID: APP_ID,
    ready: ready, applyRemote: applyRemote,
    getInfra: getInfra, saveInfra: saveInfra, nextId: nextId, sanitizeItem: sanitizeItem,
    getCriteria: getCriteria, saveCriteria: saveCriteria,
    getMeta: getMeta, saveMeta: saveMeta,
    resetDemo: resetDemo, clearInfra: clearInfra,
    exportAll: exportAll, importAll: importAll,
    getSession: getSession, setSession: setSession, clearSession: clearSession
  };

  root.Store = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
