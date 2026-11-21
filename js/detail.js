/**
 * detail.js
 * ---------------------------------------------------------------
 * Halaman detail satu usulan (detail.html?id=INF-001):
 * foto, informasi lengkap, nilai AHP + kontribusi tiap kriteria, dan peta lokasi.
 * ---------------------------------------------------------------
 */
(function () {
  'use strict';

  App.onPage('detail', function () {
    const session = App.init({ page: 'infrastruktur' });
    if (!session) return;
    const root = App.$('#d-root');
    const id = App.param('id');
    const res = App.compute();
    const r = res.byId[id];

    if (!r) {
      App.$('#d-title').textContent = 'Data tidak ditemukan';
      root.innerHTML = '<div class="card"><div class="empty">' + App.icon('search', 36) +
        'Usulan dengan ID "' + App.esc(id) + '" tidak ditemukan. Mungkin sudah dihapus.<br><br>' +
        '<a class="btn btn-primary" href="./infrastruktur.html">Kembali ke Data Infrastruktur</a></div></div>';
      return;
    }

    const it = r.item;
    document.title = it.nama + ' · SPK Pekutatan';
    App.$('#d-title').innerHTML = App.esc(it.nama) + (it.isDemo ? '<span class="tag-demo">DATA DEMO</span>' : '');
    App.$('#d-map-link').href = './gis.html?id=' + encodeURIComponent(it.id);
    if (session.role === 'admin') {
      const ed = App.$('#d-edit');
      ed.href = './infrastruktur.html?edit=' + encodeURIComponent(it.id);
      ed.classList.remove('hidden');
    }

    const foto = it.foto || App.placeholderFoto(it.jenis);
    const w = res.criteria.weights;

    // Kontribusi tiap kriteria terhadap nilai akhir
    const contrib = res.defs.map(function (c, j) {
      const share = r.final > 0 ? (r.contrib[j] / r.final) * 100 : 0;
      return '<div class="contrib"><div><strong>' + App.esc(c.kode) + '</strong> ' + App.esc(c.nama) +
        '<div class="small muted">bobot ' + App.fmt3(w[j]) + ' × nilai ' + App.fmt3(r.local[j]) + '</div></div>' +
        '<div class="num"><strong>' + App.fmt4(r.contrib[j]) + '</strong></div>' +
        '<div class="bar" role="img" aria-label="Kontribusi ' + share.toFixed(0) + ' persen"><i style="width:' + share.toFixed(1) + '%"></i></div></div>';
    }).join('');

    root.innerHTML =
      '<div class="detail-grid">' +
        '<div class="stack">' +
          '<div class="card" style="overflow:hidden"><img class="detail-photo" src="' + App.esc(foto) + '" alt="Foto ' + App.esc(it.nama) + '">' +
            '<div class="card-body"><p style="margin:0">' + (it.deskripsi ? App.esc(it.deskripsi) : '<span class="muted">Belum ada deskripsi.</span>') + '</p></div></div>' +
          '<div class="card"><div class="card-head"><h2>Informasi Pembangunan</h2></div><div class="card-body"><dl class="dl">' +
            '<dt>ID</dt><dd>' + App.esc(it.id) + '</dd>' +
            '<dt>Jenis</dt><dd>' + App.esc(it.jenis) + '</dd>' +
            '<dt>Banjar</dt><dd>' + App.esc(it.banjar) + '</dd>' +
            '<dt>Lokasi</dt><dd>' + it.lat.toFixed(6) + ', ' + it.lng.toFixed(6) + '</dd>' +
            '<dt>Kondisi</dt><dd>' + App.esc(it.kondisi) + '</dd>' +
            '<dt>Tingkat urgensi</dt><dd>' + App.esc(it.urgensi) + '</dd>' +
            '<dt>Masyarakat terdampak</dt><dd>' + App.fmtNum(it.terdampak) + ' jiwa</dd>' +
            '<dt>Manfaat</dt><dd>' + App.esc(it.manfaat) + '</dd>' +
            '<dt>Estimasi biaya</dt><dd>' + App.fmtRp(it.biaya) + '</dd>' +
            '<dt>Status</dt><dd>' + App.esc(it.status) + '</dd>' +
          '</dl></div></div>' +
        '</div>' +
        '<div class="stack">' +
          '<div class="card"><div class="card-body">' +
            '<div class="muted small" style="font-weight:700">NILAI AHP</div>' +
            '<div class="score-big">' + App.fmt3(r.final) + '</div>' +
            '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="badge plain" style="font-size:.85rem">Ranking #' + r.rank + ' dari ' + res.alt.length + '</span>' + App.catBadge(r.kategori) + '</div>' +
          '</div></div>' +
          '<div class="card"><div class="card-head"><h2>Kontribusi Kriteria</h2></div><div class="card-body">' + contrib + '</div></div>' +
          '<div class="card"><div class="card-head"><h2>Peta Lokasi</h2></div><div class="card-body"><div id="d-map" class="map mini-map" aria-label="Peta lokasi"></div></div></div>' +
        '</div>' +
      '</div>';

    const mapEl = App.$('#d-map');
    if (GIS.leafletReady()) {
      const map = GIS.createMap(mapEl, { lite: true });
      map.setView([it.lat, it.lng], 16);
      L.marker([it.lat, it.lng], { icon: GIS.markerIcon(r.kategori, r.rank), title: it.nama })
        .addTo(map).bindPopup(GIS.popupHtml(r, false));
      GIS.legendControl('bottomleft').addTo(map);
      setTimeout(function () { map.invalidateSize(); map.setView([it.lat, it.lng], 16); }, 250);
    } else {
      mapEl.innerHTML = '<div class="empty">Pustaka peta gagal dimuat. Periksa koneksi internet.</div>';
    }
  });
})();
