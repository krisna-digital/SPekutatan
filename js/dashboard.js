/**
 * dashboard.js
 * ---------------------------------------------------------------
 * Halaman Dashboard: kartu ringkasan, grafik distribusi prioritas,
 * grafik jumlah per jenis, peta ringkas, dan 5 prioritas teratas.
 * Semua angka berasal dari hasil perhitungan AHP (App.compute).
 * ---------------------------------------------------------------
 */
(function () {
  'use strict';

  App.onPage('dashboard', function () {
    const session = App.init({ page: 'dashboard' });
    if (!session) return;

    const res = App.compute();
    const count = { tinggi: 0, sedang: 0, rendah: 0 };
    res.alt.forEach(function (r) { count[r.kategori]++; });

    App.$('#st-total').textContent = res.alt.length;
    App.$('#st-tinggi').textContent = count.tinggi;
    App.$('#st-sedang').textContent = count.sedang;
    App.$('#st-rendah').textContent = count.rendah;

    // Status konsistensi AHP (ringkas)
    const c = res.criteria;
    const chip = App.$('#cr-chip');
    const link = session.role === 'admin' ? './ahp.html' : null;
    const label = '<span class="badge ' + (c.consistent ? 'rendah' : 'tinggi') + '">CR ' + App.fmt3(c.CR) + ' · ' + (c.consistent ? 'Konsisten' : 'Tidak Konsisten') + '</span>';
    chip.innerHTML = link ? '<a href="' + link + '" style="text-decoration:none" title="Lihat proses AHP">' + label + '</a>' : label;

    // 5 teratas
    const body = App.$('#top-body');
    if (!res.alt.length) {
      body.innerHTML = '<tr><td colspan="4"><div class="empty">Belum ada data usulan.</div></td></tr>';
    } else {
      body.innerHTML = res.alt.slice(0, 5).map(function (r) {
        return '<tr><td class="rank">' + r.rank + '</td>' +
          '<td class="name"><a href="./detail.html?id=' + encodeURIComponent(r.item.id) + '">' + App.esc(r.item.nama) + '</a>' +
          '<div class="sub">' + App.esc(r.item.banjar) + ' · ' + App.esc(r.item.jenis) + '</div></td>' +
          '<td class="num">' + App.fmt3(r.final) + '</td><td>' + App.catBadge(r.kategori) + '</td></tr>';
      }).join('');
    }

    // Peta ringkas
    const mapEl = App.$('#dash-map');
    if (GIS.leafletReady()) {
      const map = GIS.createMap(mapEl, { lite: true });
      const layer = GIS.addMarkers(map, res.alt);
      GIS.legendControl('bottomleft').addTo(map);
      GIS.fitTo(map, layer.group, res.alt.length);
      setTimeout(function () { map.invalidateSize(); GIS.fitTo(map, layer.group, res.alt.length); }, 250);
    } else {
      mapEl.innerHTML = '<div class="empty">Pustaka peta gagal dimuat. Periksa koneksi internet.</div>';
    }

    // Grafik
    if (typeof Chart === 'undefined') {
      ['chart-dist', 'chart-jenis'].forEach(function (id) {
        const box = App.$('#' + id).parentNode;
        box.innerHTML = '<div class="empty">Pustaka grafik gagal dimuat. Periksa koneksi internet.</div>';
      });
      return;
    }
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.color = '#475569';

    new Chart(App.$('#chart-dist'), {
      type: 'doughnut',
      data: {
        labels: ['Prioritas Tinggi', 'Prioritas Sedang', 'Prioritas Rendah'],
        datasets: [{
          data: [count.tinggi, count.sedang, count.rendah],
          backgroundColor: [Data.KATEGORI.tinggi.color, Data.KATEGORI.sedang.color, Data.KATEGORI.rendah.color],
          borderColor: '#fff', borderWidth: 3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } }
      }
    });

    const perJenis = Data.JENIS.map(function (j) {
      return res.alt.filter(function (r) { return r.item.jenis === j; }).length;
    });
    new Chart(App.$('#chart-jenis'), {
      type: 'bar',
      data: {
        labels: Data.JENIS,
        datasets: [{ label: 'Jumlah usulan', data: perJenis, backgroundColor: '#0f766e', borderRadius: 6, maxBarThickness: 38 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#eef2f6' } },
          x: { grid: { display: false }, ticks: { maxRotation: 40, minRotation: 0 } }
        }
      }
    });
  });
})();
