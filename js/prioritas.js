/**
 * prioritas.js
 * ---------------------------------------------------------------
 * Halaman hasil Prioritas Pembangunan:
 * tabel ranking (nilai tiap kriteria, nilai akhir AHP, status prioritas)
 * dengan pencarian, filter, sorting, dan grafik ranking (Chart.js).
 * ---------------------------------------------------------------
 */
(function () {
  'use strict';

  const $ = App.$;
  let res = null;
  let chart = null;
  const state = { q: '', kategori: '', jenis: '', sortKey: 'rank', sortDir: 'asc' };

  const SORTERS = {
    rank: function (r) { return r.rank; },
    nama: function (r) { return r.item.nama.toLowerCase(); },
    jenis: function (r) { return r.item.jenis.toLowerCase(); },
    banjar: function (r) { return r.item.banjar.toLowerCase(); },
    final: function (r) { return r.final; }
  };
  // kolom kriteria C1..Cn: sort berdasarkan nilai lokal
  function sorterFor(key) {
    const m = /^c(\d+)$/.exec(key);
    if (m) { const j = parseInt(m[1], 10); return function (r) { return r.local[j]; }; }
    return SORTERS[key] || SORTERS.rank;
  }

  function renderHead() {
    const w = res.criteria.weights;
    let h = '<tr><th class="sortable" data-key="rank">Rank</th><th class="sortable name" data-key="nama">Nama Infrastruktur</th>' +
      '<th class="sortable" data-key="jenis">Jenis</th><th class="sortable" data-key="banjar">Banjar</th>';
    res.defs.forEach(function (c, j) {
      h += '<th class="sortable num" data-key="c' + j + '" title="' + App.esc(c.nama) + ' (' + (c.tipe === 'cost' ? 'cost' : 'benefit') + ')">' +
        App.esc(c.kode) + '<div class="sub" style="text-transform:none;letter-spacing:0">w=' + App.fmt3(w[j]) + '</div></th>';
    });
    h += '<th class="sortable num" data-key="final">Nilai AHP</th><th>Status Prioritas</th></tr>';
    $('#thead').innerHTML = h;
    App.$$('#tbl th.sortable').forEach(function (th) {
      th.setAttribute('tabindex', '0');
      const act = function () {
        const key = th.getAttribute('data-key');
        if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        else { state.sortKey = key; state.sortDir = (key === 'final' || /^c\d+$/.test(key)) ? 'desc' : 'asc'; }
        renderTable();
      };
      th.addEventListener('click', act);
      th.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    const rows = res.alt.filter(function (r) {
      if (state.kategori && r.kategori !== state.kategori) return false;
      if (state.jenis && r.item.jenis !== state.jenis) return false;
      if (q && (r.item.nama + ' ' + r.item.banjar + ' ' + r.item.jenis).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    const get = sorterFor(state.sortKey);
    const dir = state.sortDir === 'desc' ? -1 : 1;
    return rows.sort(function (a, b) {
      const x = get(a), y = get(b);
      if (x < y) return -1 * dir;
      if (x > y) return 1 * dir;
      return a.rank - b.rank;
    });
  }

  function renderTable() {
    const rows = filtered();
    const tbody = $('#tbody');
    const cols = 6 + res.defs.length;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="' + cols + '"><div class="empty">' + App.icon('search', 36) +
        (res.alt.length ? 'Tidak ada data yang cocok dengan filter.' : 'Belum ada data usulan untuk dihitung.') + '</div></td></tr>';
    } else {
      tbody.innerHTML = rows.map(function (r) {
        const it = r.item;
        let tr = '<tr><td class="rank">' + r.rank + '</td>' +
          '<td class="name"><a href="./detail.html?id=' + encodeURIComponent(it.id) + '">' + App.esc(it.nama) + '</a>' + (it.isDemo ? '<span class="tag-demo">DEMO</span>' : '') + '</td>' +
          '<td>' + App.esc(it.jenis) + '</td><td>' + App.esc(it.banjar) + '</td>';
        r.local.forEach(function (v) { tr += '<td class="num">' + App.fmt3(v) + '</td>'; });
        tr += '<td class="num"><strong>' + App.fmt3(r.final) + '</strong></td><td>' + App.catBadge(r.kategori) + '</td></tr>';
        return tr;
      }).join('');
    }
    $('#count-line').textContent = 'Menampilkan ' + rows.length + ' dari ' + res.alt.length + ' alternatif. Nilai C1–C' + res.defs.length + ' adalah nilai ternormalisasi tiap kriteria (jumlah per kolom = 1).';

    App.$$('#tbl th.sortable').forEach(function (th) {
      if (th.getAttribute('data-key') === state.sortKey) th.setAttribute('aria-sort', state.sortDir === 'desc' ? 'descending' : 'ascending');
      else th.removeAttribute('aria-sort');
    });
    renderChart(rows);
  }

  function renderChart(rows) {
    const box = $('#chart-box');
    if (typeof Chart === 'undefined') { box.innerHTML = '<div class="empty">Pustaka grafik gagal dimuat. Periksa koneksi internet.</div>'; return; }
    // Grafik selalu diurutkan menurut ranking agar mudah dibaca
    const data = rows.slice().sort(function (a, b) { return a.rank - b.rank; });
    box.style.height = Math.max(260, data.length * 34 + 70) + 'px';
    if (chart) chart.destroy();
    chart = new Chart($('#chart-rank'), {
      type: 'bar',
      data: {
        labels: data.map(function (r) { return '#' + r.rank + ' ' + r.item.nama; }),
        datasets: [{
          label: 'Nilai AHP',
          data: data.map(function (r) { return Number(r.final.toFixed(4)); }),
          backgroundColor: data.map(function (r) { return Data.KATEGORI[r.kategori].color; }),
          borderRadius: 5, maxBarThickness: 26
        }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const r = data[ctx.dataIndex];
                return ' Nilai AHP ' + App.fmt3(r.final) + ' · ' + Data.KATEGORI[r.kategori].label;
              }
            }
          }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: '#eef2f6' }, title: { display: true, text: 'Nilai akhir AHP' } },
          y: {
            grid: { display: false },
            ticks: { callback: function (v) { const l = this.getLabelForValue(v); return l.length > 30 ? l.slice(0, 29) + '…' : l; } }
          }
        }
      }
    });
  }

  App.onPage('prioritas', function () {
    const session = App.init({ page: 'prioritas' });
    if (!session) return;
    res = App.compute();
    if (typeof Chart !== 'undefined') {
      Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
      Chart.defaults.color = '#475569';
    }

    const c = res.criteria;
    $('#cr-chip').innerHTML = '<span class="badge ' + (c.consistent ? 'rendah' : 'tinggi') + '">CR ' + App.fmt3(c.CR) + ' · ' + (c.consistent ? 'Konsisten' : 'Tidak Konsisten') + '</span>';

    $('#f-jenis').innerHTML = '<option value="">Semua jenis</option>' + Data.JENIS.map(function (j) { return '<option>' + App.esc(j) + '</option>'; }).join('');
    $('#q').addEventListener('input', App.debounce(function (e) { state.q = e.target.value; renderTable(); }, 180));
    $('#f-kat').addEventListener('change', function (e) { state.kategori = e.target.value; renderTable(); });
    $('#f-jenis').addEventListener('change', function (e) { state.jenis = e.target.value; renderTable(); });
    $('#f-sort').addEventListener('change', function (e) {
      const p = e.target.value.split(':'); state.sortKey = p[0]; state.sortDir = p[1]; renderTable();
    });

    if (!c.consistent) {
      const warn = document.createElement('div');
      warn.className = 'alert alert-danger';
      warn.innerHTML = App.icon('alert') + '<div><strong>Matriks kriteria tidak konsisten (CR &gt; 0,10)</strong><p>Hasil ranking sebaiknya tidak dipakai sebelum perbandingan kriteria diperbaiki' +
        (session.role === 'admin' ? ' di menu <a href="./ahp.html">Perhitungan AHP</a>.' : '. Hubungi admin.') + '</p></div>';
      $('#content').insertBefore(warn, $('#content').querySelector('.card'));
    }

    renderHead();
    renderTable();
  });
})();
