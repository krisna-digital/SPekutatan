/**
 * laporan.js
 * ---------------------------------------------------------------
 * Halaman Laporan Hasil SPK (khusus Admin) yang dapat dicetak / disimpan PDF.
 * Isi: identitas desa, periode, kriteria + bobot, nilai CR, daftar alternatif,
 * ranking prioritas, dan peta lokasi. Gaya cetak ada di bagian @media print.
 * ---------------------------------------------------------------
 */
(function () {
  'use strict';

  const esc = App.esc;

  function row(cells) { return '<tr>' + cells.map(function (c) { return '<td' + (c.cls ? ' class="' + c.cls + '"' : '') + '>' + c.v + '</td>'; }).join('') + '</tr>'; }

  App.boot(function () {
    const session = App.init({ page: 'laporan', adminOnly: true });
    if (!session) return;

    const meta = Store.getMeta();
    const res = App.compute();
    const c = res.criteria;
    const w = c.weights;
    const demoCount = res.alt.filter(function (r) { return r.item.isDemo; }).length;

    const critRows = res.defs.map(function (d, j) {
      return '<tr><td><strong>' + esc(d.kode) + '</strong></td><td>' + esc(d.nama) + '</td><td>' + (d.tipe === 'cost' ? 'Cost' : 'Benefit') + '</td>' +
        '<td class="num">' + App.fmt4(w[j]) + '</td><td class="num">' + (w[j] * 100).toFixed(1) + '%</td></tr>';
    }).join('');

    const altRows = res.alt.map(function (r) {
      const it = r.item;
      return '<tr><td><strong>' + r.rank + '</strong></td><td>' + esc(it.id) + '</td><td>' + esc(it.nama) + (it.isDemo ? ' <span class="tag-demo">DEMO</span>' : '') + '</td>' +
        '<td>' + esc(it.jenis) + '</td><td>' + esc(it.banjar) + '</td>' +
        '<td>' + esc(it.kondisi) + '</td><td>' + esc(it.urgensi) + '</td>' +
        '<td class="num">' + App.fmtNum(it.terdampak) + '</td><td class="num nowrap">' + App.fmtRp(it.biaya) + '</td></tr>';
    }).join('');

    const rankRows = res.alt.map(function (r) {
      return '<tr><td><strong>' + r.rank + '</strong></td><td>' + esc(r.item.nama) + '</td><td>' + esc(r.item.banjar) + '</td>' +
        '<td class="num"><strong>' + App.fmt4(r.final) + '</strong></td><td>' + App.catBadge(r.kategori) + '</td></tr>';
    }).join('');

    const report = document.getElementById('report');
    report.innerHTML =
      (demoCount ? '<div class="watermark-note">Catatan: laporan ini memuat ' + demoCount + ' data DEMO (bukan data resmi Desa Pekutatan). Ganti dengan data penelitian sebelum dipakai sebagai dokumen resmi.</div>' : '') +
      '<header class="report-head"><img src="./assets/logo.svg" alt="" width="62" height="62"><div>' +
        '<div class="t1">' + esc(meta.provinsi) + ' · ' + esc(meta.kabupaten) + '</div>' +
        '<h1>LAPORAN HASIL SISTEM PENDUKUNG KEPUTUSAN</h1>' +
        '<div>Prioritas Pembangunan Infrastruktur ' + esc(meta.desa) + ' (Metode AHP)</div></div></header>' +

      '<section><h2>1. Identitas dan Periode Penilaian</h2><dl class="report-id">' +
        '<dt>Desa</dt><dd>' + esc(meta.desa) + '</dd>' +
        '<dt>Kecamatan</dt><dd>' + esc(meta.kecamatan) + '</dd>' +
        '<dt>Kabupaten</dt><dd>' + esc(meta.kabupaten) + '</dd>' +
        '<dt>Provinsi</dt><dd>' + esc(meta.provinsi) + '</dd>' +
        '<dt>Periode penilaian</dt><dd>' + esc(meta.periode) + '</dd>' +
        '<dt>Tanggal cetak</dt><dd>' + App.fmtDateLong() + '</dd>' +
        '<dt>Jumlah alternatif</dt><dd>' + res.alt.length + ' usulan pembangunan</dd></dl></section>' +

      '<section><h2>2. Kriteria dan Bobot</h2>' +
        '<div class="table-wrap"><table class="table"><thead><tr><th>Kode</th><th>Kriteria</th><th>Arah</th><th class="num">Bobot</th><th class="num">Persen</th></tr></thead><tbody>' + critRows + '</tbody>' +
        '<tfoot><tr><td colspan="3">Total</td><td class="num">' + App.fmt4(w.reduce(function (a, b) { return a + b; }, 0)) + '</td><td class="num">100.0%</td></tr></tfoot></table></div></section>' +

      '<section><h2>3. Uji Konsistensi</h2>' +
        '<div class="table-wrap"><table class="table"><tbody>' +
        '<tr><td>λmax</td><td class="num">' + App.fmt4(c.lambdaMax) + '</td></tr>' +
        '<tr><td>Consistency Index (CI)</td><td class="num">' + App.fmt4(c.CI) + '</td></tr>' +
        '<tr><td>Random Index (RI, n = ' + c.n + ')</td><td class="num">' + c.RI.toFixed(2) + '</td></tr>' +
        '<tr><td><strong>Consistency Ratio (CR)</strong></td><td class="num"><strong>' + App.fmt4(c.CR) + '</strong></td></tr>' +
        '<tr><td>Status</td><td class="num"><strong>' + (c.consistent ? 'KONSISTEN (CR ≤ 0,10)' : 'TIDAK KONSISTEN (CR > 0,10)') + '</strong></td></tr></tbody></table></div>' +
        (c.consistent ? '' : '<p style="color:#991b1b;font-weight:600;margin-top:8px">Peringatan: matriks perbandingan tidak konsisten. Hasil ranking perlu ditinjau ulang.</p>') + '</section>' +

      '<section><h2>4. Daftar Alternatif</h2>' +
        (res.alt.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>ID</th><th>Nama</th><th>Jenis</th><th>Banjar</th><th>Kondisi</th><th>Urgensi</th><th class="num">Terdampak</th><th class="num">Biaya</th></tr></thead><tbody>' + altRows + '</tbody></table></div>' : '<p class="muted">Belum ada data usulan.</p>') + '</section>' +

      '<section><h2>5. Ranking Prioritas Pembangunan</h2>' +
        (res.alt.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Rank</th><th>Infrastruktur</th><th>Banjar</th><th class="num">Nilai AHP</th><th>Prioritas</th></tr></thead><tbody>' + rankRows + '</tbody></table></div>' : '<p class="muted">Belum ada data.</p>') + '</section>' +

      '<section><h2>6. Peta Lokasi Pembangunan</h2><div id="rep-map" class="map report-map" aria-label="Peta lokasi pembangunan"></div>' +
        '<p class="small muted" style="margin-top:6px">Marker diberi nomor sesuai ranking. Merah: prioritas tinggi · Kuning: sedang · Hijau: rendah.</p></section>' +

      '<div class="sign"><div>' + esc(meta.desa) + ', ' + App.fmtDateLong() + '<div>Penyusun,</div><div class="space"></div><strong>' + (esc(meta.penyusun) || '(............................)') + '</strong></div></div>';

    App.fillIcons();

    // Peta pada laporan
    const mapEl = document.getElementById('rep-map');
    if (GIS.leafletReady()) {
      const map = GIS.createMap(mapEl, { lite: true });
      const layer = GIS.addMarkers(map, res.alt, { link: false });
      GIS.legendControl('bottomleft').addTo(map);
      const fit = function () { map.invalidateSize(); GIS.fitTo(map, layer.group, res.alt.length); };
      setTimeout(fit, 250);
      // Saat dialog cetak dibuka, ukuran peta berubah: hitung ulang
      window.addEventListener('beforeprint', fit);
      window.addEventListener('afterprint', function () { setTimeout(fit, 150); });
    } else {
      mapEl.innerHTML = '<div class="empty">Peta tidak dapat dimuat (tidak ada koneksi internet).</div>';
    }

    document.getElementById('btn-print').addEventListener('click', function () {
      // beri waktu peta menyesuaikan ukuran sebelum dialog cetak
      window.dispatchEvent(new Event('beforeprint'));
      setTimeout(function () { window.print(); }, 450);
    });
  });
})();
