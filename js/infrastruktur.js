/**
 * infrastruktur.js
 * ---------------------------------------------------------------
 * Halaman Data Infrastruktur: tabel + pencarian + filter + sorting,
 * serta form tambah/edit (modal), hapus, export/import.
 * Pengunjung hanya dapat melihat (tanpa tombol ubah).
 * ---------------------------------------------------------------
 */
(function () {
  'use strict';

  const $ = App.$;
  let isAdmin = false;
  let res = null;
  const state = { q: '', jenis: '', kategori: '', status: '', sortKey: 'rank', sortDir: 'asc' };

  // Fungsi pengambil nilai untuk sorting
  const SORTERS = {
    rank: function (r) { return r.rank; },
    nama: function (r) { return r.item.nama.toLowerCase(); },
    jenis: function (r) { return r.item.jenis.toLowerCase(); },
    banjar: function (r) { return r.item.banjar.toLowerCase(); },
    kondisi: function (r) { return Data.rawValue(r.item, 'kondisi'); },
    urgensi: function (r) { return Data.rawValue(r.item, 'urgensi'); },
    terdampak: function (r) { return r.item.terdampak; },
    biaya: function (r) { return r.item.biaya; },
    status: function (r) { return Data.STATUS.indexOf(r.item.status); },
    final: function (r) { return r.final; }
  };
  const DESC_FIRST = { final: 1, terdampak: 1, biaya: 1, kondisi: 1, urgensi: 1 };

  // ---------- Render tabel ----------
  function render() {
    res = App.compute();
    const q = state.q.trim().toLowerCase();
    let rows = res.alt.filter(function (r) {
      const it = r.item;
      if (state.jenis && it.jenis !== state.jenis) return false;
      if (state.kategori && r.kategori !== state.kategori) return false;
      if (state.status && it.status !== state.status) return false;
      if (q && (it.nama + ' ' + it.banjar + ' ' + it.jenis + ' ' + it.id).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    const get = SORTERS[state.sortKey] || SORTERS.rank;
    const dir = state.sortDir === 'desc' ? -1 : 1;
    rows = rows.slice().sort(function (a, b) {
      const x = get(a), y = get(b);
      if (x < y) return -1 * dir;
      if (x > y) return 1 * dir;
      return a.rank - b.rank;
    });

    const tbody = $('#tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="11"><div class="empty">' + App.icon('search', 36) +
        (res.alt.length ? 'Tidak ada data yang cocok dengan pencarian/filter.' : 'Belum ada data usulan. ' + (isAdmin ? 'Klik "Tambah Data" untuk memulai.' : '')) + '</div></td></tr>';
    } else {
      tbody.innerHTML = rows.map(function (r) {
        const it = r.item;
        const acts = '<a class="btn btn-sm btn-icon" href="./detail.html?id=' + encodeURIComponent(it.id) + '" title="Detail" aria-label="Detail ' + App.esc(it.nama) + '">' + App.icon('eye', 18) + '</a>' +
          (isAdmin ? ' <button type="button" class="btn btn-sm btn-icon" data-edit="' + App.esc(it.id) + '" title="Edit" aria-label="Edit ' + App.esc(it.nama) + '">' + App.icon('edit', 18) + '</button>' +
            ' <button type="button" class="btn btn-sm btn-icon" data-del="' + App.esc(it.id) + '" title="Hapus" aria-label="Hapus ' + App.esc(it.nama) + '" style="color:var(--tinggi)">' + App.icon('trash', 18) + '</button>' : '');
        return '<tr>' +
          '<td class="rank">' + r.rank + '</td>' +
          '<td class="name"><a href="./detail.html?id=' + encodeURIComponent(it.id) + '">' + App.esc(it.nama) + '</a>' + (it.isDemo ? '<span class="tag-demo">DEMO</span>' : '') +
          '<div class="sub">' + App.esc(it.id) + '</div></td>' +
          '<td>' + App.esc(it.jenis) + '</td><td>' + App.esc(it.banjar) + '</td>' +
          '<td>' + App.esc(it.kondisi) + '</td><td>' + App.esc(it.urgensi) + '</td>' +
          '<td class="num">' + App.fmtNum(it.terdampak) + '</td>' +
          '<td class="num nowrap">' + App.fmtRp(it.biaya) + '</td>' +
          '<td><span class="badge plain">' + App.esc(it.status) + '</span></td>' +
          '<td class="num"><strong>' + App.fmt3(r.final) + '</strong><div class="sub">' + App.catBadge(r.kategori) + '</div></td>' +
          '<td class="actions">' + acts + '</td></tr>';
      }).join('');
    }
    $('#count-line').textContent = 'Menampilkan ' + rows.length + ' dari ' + res.alt.length + ' data';

    // Penanda arah sort pada header
    App.$$('#tbl th.sortable').forEach(function (th) {
      const active = th.getAttribute('data-key') === state.sortKey;
      if (active) th.setAttribute('aria-sort', state.sortDir === 'desc' ? 'descending' : 'ascending');
      else th.removeAttribute('aria-sort');
    });
    const sortSel = $('#f-sort');
    const val = state.sortKey + ':' + state.sortDir;
    if (App.$$('option', sortSel).some(function (o) { return o.value === val; })) sortSel.value = val;
  }

  // ---------- Form tambah/edit ----------
  let pickMap = null, pickMarker = null;
  let fotoData = '';
  let editingId = null;
  let lastValid = null;
  const OUTSIDE_MSG = 'Titik di luar garis merah (batas Desa Pekutatan) tidak diizinkan.';

  /** Koordinat hanya boleh berada di dalam garis batas desa. */
  function inBoundary(lat, lng, notify) {
    const ok = Data.isInsideBoundary(lat, lng);
    if (!ok && notify) App.toast(OUTSIDE_MSG, 'err');
    return ok;
  }

  function fillSelect(sel, list, withLabel) {
    sel.innerHTML = list.map(function (x) {
      const v = typeof x === 'string' ? x : x.label;
      return '<option value="' + App.esc(v) + '">' + App.esc(v) + '</option>';
    }).join('');
  }

  function setPreview() {
    const img = $('#foto-preview');
    if (fotoData) { img.src = fotoData; img.classList.remove('hidden'); $('#btn-foto-remove').classList.remove('hidden'); }
    else { img.removeAttribute('src'); img.classList.add('hidden'); $('#btn-foto-remove').classList.add('hidden'); }
  }

  function syncMarker(pan) {
    if (!pickMap) return;
    const lat = parseFloat($('#f-lat').value), lng = parseFloat($('#f-lng').value);
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 ||
        !inBoundary(lat, lng, false)) {
      if (pickMarker) { pickMap.removeLayer(pickMarker); pickMarker = null; }
      return;
    }
    lastValid = { lat: lat, lng: lng };
    if (!pickMarker) {
      pickMarker = L.marker([lat, lng], { draggable: true, icon: GIS.markerIcon('pick', '+') }).addTo(pickMap);
      pickMarker.on('dragend', function () {
        const p = pickMarker.getLatLng();
        if (!inBoundary(p.lat, p.lng, true)) {
          const back = lastValid || { lat: Data.MAP_CENTER[0], lng: Data.MAP_CENTER[1] };
          pickMarker.setLatLng([back.lat, back.lng]);
          return;
        }
        $('#f-lat').value = p.lat.toFixed(6); $('#f-lng').value = p.lng.toFixed(6);
        lastValid = { lat: p.lat, lng: p.lng };
      });
    } else {
      pickMarker.setLatLng([lat, lng]);
    }
    if (pan) pickMap.fitBounds(L.latLngBounds(Data.BATAS_DESA), { padding: [20, 20] });
  }

  /** Dipakai saat koordinat diketik manual atau diambil dari GPS. */
  function onCoordChange() {
    const lat = parseFloat($('#f-lat').value), lng = parseFloat($('#f-lng').value);
    if (isFinite(lat) && isFinite(lng)) inBoundary(lat, lng, true);
    syncMarker(true);
  }

  function ensurePickMap() {
    const el = $('#pick-map');
    if (!GIS.leafletReady()) { el.innerHTML = '<div class="empty">Peta tidak dapat dimuat. Isi koordinat secara manual.</div>'; return; }
    if (!pickMap) {
      pickMap = GIS.createMap(el, { lite: true });
      pickMap.on('click', function (e) {
        if (!inBoundary(e.latlng.lat, e.latlng.lng, true)) return;
        $('#f-lat').value = e.latlng.lat.toFixed(6);
        $('#f-lng').value = e.latlng.lng.toFixed(6);
        syncMarker(false);
      });
    }
    setTimeout(function () {
      pickMap.invalidateSize();
      syncMarker(true);
      if (!pickMarker) pickMap.fitBounds(L.latLngBounds(Data.BATAS_DESA), { padding: [20, 20] });
    }, 120);
  }

  function showFormError(list) {
    const box = $('#form-error');
    if (!list.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.innerHTML = App.icon('alert') + '<div><strong>Periksa kembali isian:</strong><p>' + list.map(App.esc).join('<br>') + '</p></div>';
    box.classList.remove('hidden');
    box.scrollIntoView({ block: 'nearest' });
  }

  function openForm(id) {
    editingId = id || null;
    const items = Store.getInfra();
    const it = id ? items.filter(function (x) { return x.id === id; })[0] : null;
    if (id && !it) { App.toast('Data tidak ditemukan.', 'err'); return; }

    $('#form-title').textContent = it ? 'Edit Data Infrastruktur' : 'Tambah Data Infrastruktur';
    $('#f-id').value = it ? it.id : Store.nextId(items);
    $('#f-nama').value = it ? it.nama : '';
    $('#f-jenis').value = it ? it.jenis : Data.JENIS[0];
    $('#f-banjar').value = it ? it.banjar : '';
    $('#f-deskripsi').value = it ? it.deskripsi : '';
    $('#f-kondisi').value = it ? it.kondisi : 'Rusak Sedang';
    $('#f-urgensi').value = it ? it.urgensi : 'Sedang';
    $('#f-terdampak').value = it ? it.terdampak : '';
    $('#f-manfaat').value = it ? it.manfaat : 'Sedang';
    $('#f-biaya').value = it ? it.biaya : '';
    $('#f-lat').value = it ? it.lat : '';
    $('#f-lng').value = it ? it.lng : '';
    lastValid = it && Data.isInsideBoundary(Number(it.lat), Number(it.lng))
      ? { lat: Number(it.lat), lng: Number(it.lng) } : null;
    $('#f-status').value = it ? it.status : 'Usulan';
    $('#f-demo').checked = it ? !!it.isDemo : false;
    $('#f-foto').value = '';
    fotoData = it ? it.foto : '';
    setPreview();
    showFormError([]);
    updateBiayaHint();

    const calc = $('#calc-info');
    if (it) {
      const r = res.byId[it.id];
      $('#calc-title').textContent = 'Nilai AHP saat ini: ' + App.fmt3(r.final) + ' · Ranking #' + r.rank + ' · ' + Data.KATEGORI[r.kategori].label;
      calc.classList.remove('hidden');
    } else {
      calc.classList.add('hidden');
    }

    // Daftar saran banjar
    const banjar = {};
    items.forEach(function (x) { if (x.banjar) banjar[x.banjar] = true; });
    $('#dl-banjar').innerHTML = Object.keys(banjar).sort().map(function (b) { return '<option value="' + App.esc(b) + '">'; }).join('');

    App.openModal($('#modal-form'));
    $('#modal-form .modal-body').scrollTop = 0;
    ensurePickMap();
    setTimeout(function () { $('#f-nama').focus(); }, 150);
  }

  function closeForm() { App.closeModal($('#modal-form')); }

  function updateBiayaHint() {
    const v = parseFloat($('#f-biaya').value);
    $('#biaya-hint').textContent = isFinite(v) && v > 0 ? App.fmtRp(v) : 'Isi angka tanpa titik. Harus lebih dari 0.';
  }

  function validate() {
    const errs = [];
    if (!$('#f-nama').value.trim()) errs.push('Nama infrastruktur wajib diisi.');
    if (!$('#f-banjar').value.trim()) errs.push('Banjar wajib diisi.');
    const t = $('#f-terdampak').value;
    if (t === '' || !(parseFloat(t) >= 0)) errs.push('Jumlah masyarakat terdampak harus berupa angka 0 atau lebih.');
    const b = parseFloat($('#f-biaya').value);
    if (!isFinite(b) || b <= 0) errs.push('Estimasi biaya harus lebih dari 0.');
    const lat = parseFloat($('#f-lat').value), lng = parseFloat($('#f-lng').value);
    if (!isFinite(lat) || lat < -90 || lat > 90) errs.push('Latitude harus berupa angka antara -90 dan 90 (klik peta untuk memilih lokasi).');
    if (!isFinite(lng) || lng < -180 || lng > 180) errs.push('Longitude harus berupa angka antara -180 dan 180.');
    if (isFinite(lat) && isFinite(lng) && !Data.isInsideBoundary(lat, lng)) {
      errs.push('Lokasi harus berada di dalam garis merah batas Desa Pekutatan.');
    }
    return errs;
  }

  function submitForm(e) {
    e.preventDefault();
    const errs = validate();
    showFormError(errs);
    if (errs.length) return;

    const clean = Store.sanitizeItem({
      id: $('#f-id').value,
      nama: $('#f-nama').value, jenis: $('#f-jenis').value, banjar: $('#f-banjar').value,
      deskripsi: $('#f-deskripsi').value, kondisi: $('#f-kondisi').value, urgensi: $('#f-urgensi').value,
      terdampak: $('#f-terdampak').value, manfaat: $('#f-manfaat').value, biaya: $('#f-biaya').value,
      lat: $('#f-lat').value, lng: $('#f-lng').value, foto: fotoData, status: $('#f-status').value,
      isDemo: $('#f-demo').checked
    });
    if (!clean) { showFormError(['Data tidak valid. Periksa nama dan koordinat.']); return; }

    const items = Store.getInfra().slice();
    if (editingId) {
      const idx = items.findIndex(function (x) { return x.id === editingId; });
      if (idx < 0) { showFormError(['Data yang diedit sudah tidak ada.']); return; }
      clean.id = editingId;
      items[idx] = clean;
    } else {
      clean.id = Store.nextId(items);
      items.push(clean);
    }
    if (!Store.saveInfra(items)) {
      showFormError(['Penyimpanan browser penuh. Hapus foto atau data lama, atau gunakan foto berukuran lebih kecil.']);
      return;
    }
    closeForm();
    render();
    App.toast(editingId ? 'Data berhasil diperbarui.' : 'Data berhasil ditambahkan.');
  }

  function deleteItem(id) {
    const items = Store.getInfra();
    const it = items.filter(function (x) { return x.id === id; })[0];
    if (!it) return;
    App.confirm({ title: 'Hapus data', danger: true, okText: 'Hapus', message: 'Hapus "' + it.nama + '"? Tindakan ini tidak dapat dibatalkan dan ranking akan dihitung ulang.' })
      .then(function (ok) {
        if (!ok) return;
        Store.saveInfra(items.filter(function (x) { return x.id !== id; }));
        render();
        App.toast('Data dihapus.');
      });
  }

  // ---------- Inisialisasi ----------
  App.onPage('infrastruktur', function () {
    const session = App.init({ page: 'infrastruktur' });
    if (!session) return;
    isAdmin = session.role === 'admin';
    if (isAdmin) App.$$('.admin-only').forEach(function (el) { el.classList.remove('hidden'); });

    // Opsi filter & form
    $('#f-fjenis').innerHTML = '<option value="">Semua jenis</option>' + Data.JENIS.map(function (j) { return '<option>' + App.esc(j) + '</option>'; }).join('');
    $('#f-fstatus').innerHTML = '<option value="">Semua status</option>' + Data.STATUS.map(function (j) { return '<option>' + App.esc(j) + '</option>'; }).join('');
    fillSelect($('#f-jenis'), Data.JENIS);
    fillSelect($('#f-kondisi'), Data.KONDISI);
    fillSelect($('#f-urgensi'), Data.URGENSI);
    fillSelect($('#f-manfaat'), Data.MANFAAT);
    fillSelect($('#f-status'), Data.STATUS);

    // Pencarian / filter / sorting
    $('#q').addEventListener('input', App.debounce(function (e) { state.q = e.target.value; render(); }, 180));
    $('#f-fjenis').addEventListener('change', function (e) { state.jenis = e.target.value; render(); });
    $('#f-fkat').addEventListener('change', function (e) { state.kategori = e.target.value; render(); });
    $('#f-fstatus').addEventListener('change', function (e) { state.status = e.target.value; render(); });
    $('#f-sort').addEventListener('change', function (e) {
      const p = e.target.value.split(':');
      state.sortKey = p[0]; state.sortDir = p[1]; render();
    });
    App.$$('#tbl th.sortable').forEach(function (th) {
      th.setAttribute('tabindex', '0');
      const act = function () {
        const key = th.getAttribute('data-key');
        if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        else { state.sortKey = key; state.sortDir = DESC_FIRST[key] ? 'desc' : 'asc'; }
        render();
      };
      th.addEventListener('click', act);
      th.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });

    // Aksi baris (delegasi)
    $('#tbody').addEventListener('click', function (e) {
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-del]');
      if (edit && isAdmin) openForm(edit.getAttribute('data-edit'));
      else if (del && isAdmin) deleteItem(del.getAttribute('data-del'));
    });

    if (isAdmin) {
      $('#btn-add').addEventListener('click', function () { openForm(null); });
      $('#btn-export').addEventListener('click', App.exportJSON);
      $('#btn-import').addEventListener('click', function () { App.importJSON(render); });
      $('#form-infra').addEventListener('submit', submitForm);
      App.$$('[data-close]', $('#modal-form')).forEach(function (b) { b.addEventListener('click', closeForm); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !$('#modal-form').classList.contains('hidden') && !document.querySelector('.modal.sm')) closeForm();
      });
      $('#f-biaya').addEventListener('input', updateBiayaHint);
      $('#f-lat').addEventListener('change', onCoordChange);
      $('#f-lng').addEventListener('change', onCoordChange);
      $('#btn-geo').addEventListener('click', function () {
        if (!navigator.geolocation) { App.toast('Browser tidak mendukung geolokasi.', 'err'); return; }
        navigator.geolocation.getCurrentPosition(function (pos) {
          if (!inBoundary(pos.coords.latitude, pos.coords.longitude, true)) return;
          $('#f-lat').value = pos.coords.latitude.toFixed(6);
          $('#f-lng').value = pos.coords.longitude.toFixed(6);
          syncMarker(true);
        }, function () { App.toast('Lokasi tidak dapat diambil. Pilih titik pada peta.', 'err'); }, { enableHighAccuracy: true, timeout: 12000 });
      });
      $('#f-foto').addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        App.imageToDataURL(file, 800, 0.72).then(function (d) { fotoData = d; setPreview(); })
          .catch(function (err) { App.toast(err.message, 'err'); e.target.value = ''; });
      });
      $('#btn-foto-remove').addEventListener('click', function () { fotoData = ''; $('#f-foto').value = ''; setPreview(); });
    }

    render();

    // Dibuka dari halaman detail: ?edit=INF-001
    const editId = App.param('edit');
    if (editId && isAdmin) openForm(editId);
  });
})();
