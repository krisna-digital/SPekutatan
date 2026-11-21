/**
 * ahp-page.js
 * ---------------------------------------------------------------
 * Halaman Perhitungan AHP (khusus Admin):
 *  - mengelola kriteria dan matriks perbandingan berpasangan (tersimpan otomatis)
 *  - menampilkan 8 tahap AHP secara transparan + uji konsistensi
 *  - menampilkan perhitungan nilai akhir tiap alternatif
 * Angka dihitung oleh ahp.js; file ini hanya menampilkan.
 * ---------------------------------------------------------------
 */
(function () {
  'use strict';

  const $ = App.$;
  const f3 = App.fmt3, f4 = App.fmt4, esc = App.esc;
  let state = null;   // {kriteria, matrix}
  let SAATY = [];

  // ---------- Pembantu tabel ----------
  function table(head, rows, foot) {
    return '<div class="table-wrap"><table class="table matrix"><thead><tr>' +
      head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody>' + (foot ? '<tfoot><tr>' + foot.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr></tfoot>' : '') + '</table></div>';
  }
  function step(no, title, body, open) {
    return '<details class="step"' + (open === false ? '' : ' open') + '><summary><span class="step-no">' + no + '</span>' + esc(title) + '</summary><div class="step-body">' + body + '</div></details>';
  }
  function kode(i) { return esc(state.kriteria[i].kode); }
  function save(msg) {
    if (!Store.saveCriteria(state)) App.toast('Gagal menyimpan: penyimpanan browser penuh.', 'err');
    else if (msg) App.toast(msg);
  }

  // ---------- Editor kriteria ----------
  function renderCriteriaEditor() {
    $('#crit-editor').innerHTML = state.kriteria.map(function (c, i) {
      return '<div class="crit-edit" data-i="' + i + '">' +
        '<div class="kode">' + esc(c.kode) + '</div>' +
        '<div class="field"><label class="sr-only" for="cn-' + i + '">Nama kriteria ' + esc(c.kode) + '</label>' +
        '<input type="text" id="cn-' + i + '" data-k="nama" maxlength="60" value="' + esc(c.nama) + '"></div>' +
        '<div class="field"><label class="sr-only" for="ct-' + i + '">Arah preferensi ' + esc(c.kode) + '</label>' +
        '<select id="ct-' + i + '" data-k="tipe"><option value="benefit"' + (c.tipe === 'benefit' ? ' selected' : '') + '>Benefit (makin besar makin prioritas)</option>' +
        '<option value="cost"' + (c.tipe === 'cost' ? ' selected' : '') + '>Cost (makin kecil makin prioritas)</option></select></div>' +
        '<div class="field"><label class="sr-only" for="cd-' + i + '">Keterangan ' + esc(c.kode) + '</label>' +
        '<input type="text" id="cd-' + i + '" data-k="deskripsi" maxlength="300" value="' + esc(c.deskripsi || '') + '">' +
        '<span class="hint">Sumber data: ' + esc(Data.FIELD_INFO[c.field] || c.field) + '</span></div></div>';
    }).join('');
  }

  // ---------- Editor matriks ----------
  function sameValue(a, b) { return Math.abs(a - b) < 1e-9; }

  function renderMatrixEditor(focus) {
    const n = state.matrix.length;
    let h = '<table class="table matrix" style="min-width:640px"><thead><tr><th>Kriteria</th>';
    for (let j = 0; j < n; j++) h += '<th title="' + esc(state.kriteria[j].nama) + '">' + kode(j) + '</th>';
    h += '</tr></thead><tbody>';
    for (let i = 0; i < n; i++) {
      h += '<tr><td><strong>' + kode(i) + '</strong> <span class="muted small">' + esc(state.kriteria[i].nama) + '</span></td>';
      for (let j = 0; j < n; j++) {
        const v = state.matrix[i][j];
        if (i === j) h += '<td class="diag">1</td>';
        else if (i < j) {
          let selectedIdx = -1;
          const opts = SAATY.map(function (s, idx) {
            const sel = sameValue(s, v);
            if (sel) selectedIdx = idx;
            return '<option value="' + idx + '"' + (sel ? ' selected' : '') + '>' + AHP.saatyLabel(s) + '</option>';
          });
          if (selectedIdx < 0) opts.unshift('<option value="cur" selected>' + f3(v) + '</option>');
          h += '<td><select data-i="' + i + '" data-j="' + j + '" aria-label="' + esc(state.kriteria[i].kode + ' dibanding ' + state.kriteria[j].kode) + '">' + opts.join('') + '</select></td>';
        } else {
          h += '<td class="recip">' + esc(AHP.saatyLabel(v)) + '</td>';
        }
      }
      h += '</tr>';
    }
    h += '</tbody></table>';
    $('#matrix-editor').innerHTML = h;
    if (focus) {
      const el = document.querySelector('#matrix-editor select[data-i="' + focus.i + '"][data-j="' + focus.j + '"]');
      if (el) el.focus();
    }
  }

  // ---------- Status konsistensi ----------
  function worstPair(c) {
    const w = c.weights, n = c.n;
    let best = null;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dev = Math.abs(Math.log(state.matrix[i][j]) - Math.log(w[i] / w[j]));
        if (!best || dev > best.dev) best = { i: i, j: j, dev: dev, ideal: w[i] / w[j] };
      }
    }
    return best;
  }

  function renderAlert(c) {
    const box = $('#cr-alert');
    if (c.consistent) {
      box.innerHTML = '<div class="alert alert-ok">' + App.icon('check') + '<div><strong>Matriks konsisten</strong><p>CR = ' + f4(c.CR) + ' (≤ 0,10). Bobot kriteria dapat digunakan.</p></div></div>';
      return;
    }
    const wp = worstPair(c);
    box.innerHTML = '<div class="alert alert-danger">' + App.icon('alert') + '<div><strong>Peringatan: matriks TIDAK konsisten</strong>' +
      '<p>CR = ' + f4(c.CR) + ' (lebih dari 0,10). Perbaiki perbandingan berpasangan sebelum hasil ranking digunakan. ' +
      'Pasangan yang paling menyimpang: <strong>' + kode(wp.i) + ' vs ' + kode(wp.j) + '</strong> ' +
      '(nilai saat ini ' + esc(AHP.saatyLabel(state.matrix[wp.i][wp.j])) + ', rasio bobot ≈ ' + wp.ideal.toFixed(2) + ').</p></div></div>';
  }

  // ---------- Tahap 1-8 ----------
  function renderSteps(c) {
    const n = c.n;
    const heads = ['Kriteria'].concat(state.kriteria.map(function (_, j) { return kode(j); }));
    const label = function (i) { return '<strong>' + kode(i) + '</strong>'; };
    const out = [];

    // Tahap 1
    out.push(step(1, 'Matriks Perbandingan Berpasangan',
      '<p class="small muted" style="margin-bottom:0">Matriks input dari bagian 2, beserta jumlah tiap kolom (Σ).</p>' +
      table(heads, state.matrix.map(function (row, i) { return [label(i)].concat(row.map(f3)); }),
        ['<strong>Σ kolom</strong>'].concat(c.colSums.map(function (v) { return '<strong>' + f3(v) + '</strong>'; })))));

    // Tahap 2
    out.push(step(2, 'Normalisasi Matriks',
      '<div class="formula">nilai ternormalisasi = nilai sel ÷ jumlah kolomnya</div>' +
      table(heads, c.normalized.map(function (row, i) { return [label(i)].concat(row.map(f3)); }),
        ['<strong>Σ kolom</strong>'].concat(Array(n).fill('<strong>1.000</strong>')))));

    // Tahap 3
    out.push(step(3, 'Bobot Masing-masing Kriteria',
      '<div class="formula">bobot = jumlah baris matriks ternormalisasi ÷ n &nbsp; (n = ' + n + ')</div>' +
      table(['Kriteria', 'Nama', 'Jumlah baris', 'Bobot (w)', 'Persen'],
        state.kriteria.map(function (k, i) {
          return [label(i), '<span style="text-align:left">' + esc(k.nama) + '</span>', f3(c.rowSums[i]), '<strong>' + f3(c.weights[i]) + '</strong>', (c.weights[i] * 100).toFixed(1) + '%'];
        }),
        ['', '<strong>Total</strong>', '<strong>' + f3(c.rowSums.reduce(function (a, b) { return a + b; }, 0)) + '</strong>', '<strong>1.000</strong>', '<strong>100%</strong>'])));

    // Tahap 4
    const order = c.weights.map(function (w, i) { return { i: i, w: w }; }).sort(function (a, b) { return b.w - a.w; });
    const rankOf = {}; order.forEach(function (o, idx) { rankOf[o.i] = idx + 1; });
    out.push(step(4, 'Priority Vector',
      '<p class="small muted" style="margin-bottom:0">Vektor prioritas = vektor bobot (w). Jumlahnya sama dengan 1.</p>' +
      table(['Kriteria', 'Priority vector (w)', 'Urutan kepentingan', 'Proporsi'],
        state.kriteria.map(function (k, i) {
          return [label(i), '<strong>' + f4(c.priorityVector[i]) + '</strong>', '#' + rankOf[i],
            '<div class="bar" style="min-width:120px"><i style="width:' + (c.priorityVector[i] * 100).toFixed(1) + '%"></i></div>'];
        }))));

    // Tahap 5
    const ex = state.matrix[0].map(function (a, j) { return f3(a) + ' × ' + f3(c.priorityVector[j]); }).join(' + ');
    out.push(step(5, 'Weighted Sum Vector',
      '<div class="formula">WSV = matriks perbandingan × priority vector<br>Contoh ' + kode(0) + ': ' + ex + ' = ' + f4(c.wsv[0]) + '</div>' +
      table(['Kriteria', 'Weighted sum (WSV)', 'Priority vector (w)', 'WSV ÷ w'],
        state.kriteria.map(function (k, i) {
          return [label(i), f4(c.wsv[i]), f4(c.priorityVector[i]), f4(c.lambdaVec[i])];
        }))));

    // Tahap 6
    out.push(step(6, 'Nilai Eigen Maksimum (λmax)',
      '<div class="formula">λmax = rata-rata (WSV ÷ w)<br>λmax = (' + c.lambdaVec.map(f4).join(' + ') + ') ÷ ' + n + ' = <strong>' + f4(c.lambdaMax) + '</strong></div>'));

    // Tahap 7
    out.push(step(7, 'Consistency Index (CI)',
      '<div class="formula">CI = (λmax − n) ÷ (n − 1)<br>CI = (' + f4(c.lambdaMax) + ' − ' + n + ') ÷ ' + (n - 1) + ' = <strong>' + f4(c.CI) + '</strong></div>'));

    // Tahap 8
    const riHead = Object.keys(AHP.RI_TABLE).map(function (k) { return 'n=' + k; });
    const riRow = Object.keys(AHP.RI_TABLE).map(function (k) {
      const v = AHP.RI_TABLE[k].toFixed(2);
      return String(k) === String(n) ? '<strong>' + v + '</strong>' : v;
    });
    out.push(step(8, 'Consistency Ratio (CR) dan Status',
      '<div class="formula">CR = CI ÷ RI<br>CR = ' + f4(c.CI) + ' ÷ ' + c.RI.toFixed(2) + ' (RI untuk n = ' + n + ') = <strong>' + f4(c.CR) + '</strong></div>' +
      '<div class="cr-box">' +
      '<div class="cr-metric"><div class="k">λmax</div><div class="v">' + f4(c.lambdaMax) + '</div></div>' +
      '<div class="cr-metric"><div class="k">CI</div><div class="v">' + f4(c.CI) + '</div></div>' +
      '<div class="cr-metric"><div class="k">RI</div><div class="v">' + c.RI.toFixed(2) + '</div></div>' +
      '<div class="cr-metric"><div class="k">CR</div><div class="v">' + f4(c.CR) + '</div></div>' +
      '<span class="badge ' + (c.consistent ? 'rendah' : 'tinggi') + '" style="font-size:.9rem;padding:6px 14px">' + (c.consistent ? 'CR ≤ 0,10 → Konsisten' : 'CR > 0,10 → Tidak Konsisten') + '</span></div>' +
      '<p class="small muted" style="margin-bottom:6px">Tabel Random Index (RI) Saaty:</p>' +
      table(riHead, [riRow])));

    $('#steps').innerHTML = out.join('');
  }

  // ---------- Perhitungan alternatif ----------
  function renderAlternatives(res) {
    const defs = res.defs, w = res.criteria.weights, m = defs.length;
    const byId = res.alt.slice().sort(function (a, b) { return a.item.id < b.item.id ? -1 : 1; });
    const out = [];

    if (!byId.length) {
      $('#alt-steps').innerHTML = '<div class="card"><div class="empty">Belum ada data usulan. Tambahkan data di menu Data Infrastruktur.</div></div>';
      return;
    }

    const arah = defs.map(function (c, j) {
      return '<tr><td><strong>' + esc(c.kode) + '</strong> ' + esc(c.nama) + '</td><td style="text-align:left">' + esc(Data.FIELD_INFO[c.field]) + '</td>' +
        '<td><span class="badge ' + (c.tipe === 'cost' ? 'sedang' : 'rendah') + '">' + (c.tipe === 'cost' ? 'Cost' : 'Benefit') + '</span></td><td>' + f3(w[j]) + '</td></tr>';
    }).join('');
    out.push(step('A', 'Penilaian Alternatif dan Arah Preferensi',
      '<div class="formula">Benefit: nilai lokal = x ÷ Σx<br>Cost: nilai lokal = (1 ÷ x) ÷ Σ(1 ÷ x)<br>Nilai Akhir = Σ (bobot kriteria × nilai lokal)</div>' +
      '<p class="small muted" style="margin-bottom:0">Nilai lokal tiap kriteria berjumlah 1, sehingga nilai akhir seluruh alternatif juga berjumlah 1. Kriteria bertipe cost dibalik agar biaya lebih kecil menghasilkan nilai lebih besar.</p>' +
      '<div class="table-wrap"><table class="table matrix"><thead><tr><th>Kriteria</th><th>Sumber nilai</th><th>Arah</th><th>Bobot</th></tr></thead><tbody>' + arah + '</tbody></table></div>'));

    out.push(step('B', 'Matriks Keputusan (nilai mentah)',
      '<p class="small muted" style="margin-bottom:0">Nilai skala (1–4) untuk kriteria ordinal, jiwa untuk masyarakat terdampak, dan Rupiah untuk biaya.</p>' +
      table(['Alternatif'].concat(defs.map(function (c) { return esc(c.kode); })),
        byId.map(function (r) {
          return ['<strong>' + esc(r.item.id) + '</strong> <span class="small">' + esc(r.item.nama) + '</span>'].concat(r.raw.map(function (v, j) {
            return defs[j].field === 'biaya' ? App.fmtNum(v) : App.fmtNum(v);
          }));
        }))));

    out.push(step('C', 'Normalisasi (nilai lokal) per Kriteria',
      table(['Alternatif'].concat(defs.map(function (c) { return esc(c.kode); })),
        byId.map(function (r) { return ['<strong>' + esc(r.item.id) + '</strong> <span class="small">' + esc(r.item.nama) + '</span>'].concat(r.local.map(f4)); }),
        ['<strong>Σ</strong>'].concat(defs.map(function (_, j) {
          return '<strong>' + f4(byId.reduce(function (a, r) { return a + r.local[j]; }, 0)) + '</strong>';
        })))));

    out.push(step('D', 'Nilai Akhir dan Ranking',
      '<div class="formula">Nilai Akhir = ' + defs.map(function (c, j) { return f3(w[j]) + '×' + esc(c.kode); }).join(' + ') + '</div>' +
      table(['Rank', 'Alternatif'].concat(defs.map(function (c, j) { return esc(c.kode) + '<div class="sub" style="text-transform:none">×' + f3(w[j]) + '</div>'; })).concat(['Nilai Akhir', 'Prioritas']),
        res.alt.map(function (r) {
          return ['<strong>' + r.rank + '</strong>', '<span class="small">' + esc(r.item.nama) + '</span>']
            .concat(r.contrib.map(f4)).concat(['<strong>' + f4(r.final) + '</strong>', App.catBadge(r.kategori)]);
        }),
        ['', '<strong>Σ semua alternatif</strong>'].concat(defs.map(function (_, j) {
          return f4(res.alt.reduce(function (a, r) { return a + r.contrib[j]; }, 0));
        })).concat(['<strong>' + f4(res.alt.reduce(function (a, r) { return a + r.final; }, 0)) + '</strong>', '']))));

    $('#alt-steps').innerHTML = out.join('');
  }

  // ---------- Render semua ----------
  function renderAll(focus) {
    const res = App.compute();
    renderAlert(res.criteria);
    renderMatrixEditor(focus);
    renderSteps(res.criteria);
    renderAlternatives(res);
  }

  App.boot(function () {
    const session = App.init({ page: 'ahp', adminOnly: true });
    if (!session) return;
    SAATY = AHP.saatyValues();
    state = Store.getCriteria();
    renderCriteriaEditor();
    renderAll();

    // Perubahan kriteria (nama / arah / keterangan)
    $('#crit-editor').addEventListener('change', function (e) {
      const row = e.target.closest('.crit-edit');
      if (!row) return;
      const i = parseInt(row.getAttribute('data-i'), 10);
      const k = e.target.getAttribute('data-k');
      let v = e.target.value;
      if (k === 'nama') {
        v = v.trim();
        if (!v) { e.target.value = state.kriteria[i].nama; App.toast('Nama kriteria tidak boleh kosong.', 'warn'); return; }
      }
      state.kriteria[i][k] = v;
      save('Kriteria disimpan. Ranking dihitung ulang.');
      renderAll();
    });

    // Perubahan nilai perbandingan berpasangan
    $('#matrix-editor').addEventListener('change', function (e) {
      const sel = e.target;
      if (sel.tagName !== 'SELECT') return;
      const i = parseInt(sel.getAttribute('data-i'), 10), j = parseInt(sel.getAttribute('data-j'), 10);
      if (sel.value === 'cur') return;
      const v = SAATY[parseInt(sel.value, 10)];
      if (!v) return;
      state.matrix[i][j] = v;
      state.matrix[j][i] = 1 / v;
      save('Bobot disimpan. Ranking dihitung ulang.');
      renderAll({ i: i, j: j });
    });

    $('#btn-reset').addEventListener('click', function () {
      App.confirm({ title: 'Reset kriteria', danger: true, okText: 'Reset', message: 'Kembalikan nama kriteria, arah preferensi, dan seluruh perbandingan berpasangan ke nilai bawaan?' })
        .then(function (ok) {
          if (!ok) return;
          state = Data.defaultCriteriaState();
          save('Kriteria dikembalikan ke nilai bawaan.');
          renderCriteriaEditor();
          renderAll();
        });
    });
  });
})();
