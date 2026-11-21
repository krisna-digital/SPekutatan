/**
 * ahp.js
 * ---------------------------------------------------------------
 * Mesin perhitungan Analytical Hierarchy Process (AHP).
 * File ini murni perhitungan (tanpa DOM) sehingga mudah dipahami
 * dan diuji. Semua angka dihitung di sini, tidak ada nilai hard-code.
 *
 * Alur:
 *  1. calcCriteria()      -> bobot kriteria + uji konsistensi (CI, CR)
 *  2. calcAlternatives()  -> nilai akhir tiap alternatif = Σ (bobot × nilai)
 *  3. run()               -> gabungan 1 + 2, siap dipakai halaman
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  // Random Index (RI) menurut Saaty, berdasarkan ordo matriks (n)
  const RI_TABLE = { 1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49 };
  const CR_LIMIT = 0.10;

  function sum(arr) {
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i];
    return s;
  }

  /**
   * Menghitung seluruh tahapan AHP untuk satu matriks perbandingan berpasangan.
   * @param {number[][]} matrix matriks n x n (a[j][i] = 1 / a[i][j])
   */
  function calcCriteria(matrix) {
    const n = matrix.length;

    // Tahap 1: jumlah tiap kolom matriks perbandingan berpasangan
    const colSums = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) colSums[j] += matrix[i][j];
    }

    // Tahap 2: normalisasi (tiap elemen dibagi jumlah kolomnya)
    const normalized = matrix.map(function (row) {
      return row.map(function (v, j) { return v / colSums[j]; });
    });

    // Tahap 3: bobot = rata-rata tiap baris matriks ternormalisasi
    const rowSums = normalized.map(sum);
    const weights = rowSums.map(function (s) { return s / n; });

    // Tahap 4: priority vector = vektor bobot (jumlahnya = 1)
    const priorityVector = weights.slice();

    // Tahap 5: weighted sum vector = matriks asli × priority vector
    const wsv = matrix.map(function (row) {
      let acc = 0;
      for (let j = 0; j < n; j++) acc += row[j] * priorityVector[j];
      return acc;
    });
    const lambdaVec = wsv.map(function (v, i) { return v / priorityVector[i]; });

    // Tahap 6: λmax = rata-rata (WSV_i / w_i)
    const lambdaMax = sum(lambdaVec) / n;

    // Tahap 7: Consistency Index  CI = (λmax - n) / (n - 1)
    let CI = n > 1 ? (lambdaMax - n) / (n - 1) : 0;
    if (CI < 0 && CI > -1e-12) CI = 0; // koreksi galat pembulatan

    // Tahap 8: Consistency Ratio  CR = CI / RI
    const RI = RI_TABLE[n] !== undefined ? RI_TABLE[n] : RI_TABLE[10];
    const CR = RI > 0 ? CI / RI : 0;

    return {
      n: n, colSums: colSums, normalized: normalized, rowSums: rowSums,
      weights: weights, priorityVector: priorityVector,
      wsv: wsv, lambdaVec: lambdaVec, lambdaMax: lambdaMax,
      CI: CI, RI: RI, CR: CR, consistent: CR <= CR_LIMIT + 1e-12, crLimit: CR_LIMIT
    };
  }

  /**
   * Kategori prioritas berdasarkan peringkat (dibagi tiga bagian sama besar):
   * sepertiga teratas = tinggi, sepertiga terbawah = rendah, sisanya sedang.
   */
  function categoryFor(rank, total) {
    if (total <= 0) return 'sedang';
    if (total === 1) return 'tinggi';
    if (total === 2) return rank === 1 ? 'tinggi' : 'rendah';
    const k = Math.max(1, Math.round(total / 3));
    if (rank <= k) return 'tinggi';
    if (rank > total - k) return 'rendah';
    return 'sedang';
  }

  /**
   * Menghitung nilai akhir semua alternatif.
   *  - Kriteria benefit : nilai lokal = x / Σx
   *  - Kriteria cost    : nilai lokal = (1/x) / Σ(1/x)   (semakin kecil semakin baik)
   *  - Nilai akhir      : Σ (bobot kriteria × nilai lokal)
   * Nilai lokal tiap kriteria berjumlah 1, sehingga nilai akhir seluruh
   * alternatif juga berjumlah 1.
   *
   * @param {Object[]} items     daftar usulan
   * @param {Object[]} criteria  definisi kriteria ({field, tipe, ...})
   * @param {number[]} weights   bobot kriteria dari calcCriteria()
   * @param {Function} rawFn     (item, field) => nilai mentah numerik
   */
  function calcAlternatives(items, criteria, weights, rawFn) {
    const n = items.length;
    const m = criteria.length;
    const raw = items.map(function (it) {
      return criteria.map(function (c) { return rawFn(it, c.field); });
    });

    const basis = []; // nilai dasar sebelum dinormalisasi (tergantung benefit/cost)
    const colTotals = Array(m).fill(0);
    const local = items.map(function () { return Array(m).fill(0); });

    for (let j = 0; j < m; j++) {
      const isCost = criteria[j].tipe === 'cost';
      const col = raw.map(function (r) { return r[j]; });
      let floorValue = 1;
      if (isCost) {
        const positives = col.filter(function (v) { return v > 0; });
        if (positives.length) floorValue = Math.min.apply(null, positives);
      }
      const b = col.map(function (v) {
        if (isCost) return 1 / (v > 0 ? v : floorValue);
        return v > 0 ? v : 0;
      });
      basis.push(b);
      colTotals[j] = sum(b);
      for (let i = 0; i < n; i++) {
        local[i][j] = colTotals[j] > 0 ? b[i] / colTotals[j] : 1 / n;
      }
    }

    const rows = items.map(function (item, i) {
      const contrib = local[i].map(function (v, j) { return v * weights[j]; });
      return { item: item, raw: raw[i], local: local[i], contrib: contrib, final: sum(contrib) };
    });

    // Urutkan dari nilai terbesar; nilai identik mendapat peringkat sama
    rows.sort(function (a, b) {
      if (Math.abs(b.final - a.final) > 1e-12) return b.final - a.final;
      return String(a.item.nama).localeCompare(String(b.item.nama), 'id');
    });
    rows.forEach(function (r, idx) {
      if (idx > 0 && Math.abs(r.final - rows[idx - 1].final) < 1e-12) r.rank = rows[idx - 1].rank;
      else r.rank = idx + 1;
      r.kategori = categoryFor(r.rank, n);
    });

    return { rows: rows, colTotals: colTotals };
  }

  /**
   * Menjalankan seluruh proses AHP.
   * @param {Object[]} items
   * @param {{kriteria:Object[], matrix:number[][]}} state
   * @param {Function} rawFn
   */
  function run(items, state, rawFn) {
    const criteria = calcCriteria(state.matrix);
    const alt = calcAlternatives(items, state.kriteria, criteria.weights, rawFn);
    const byId = {};
    alt.rows.forEach(function (r) { byId[r.item.id] = r; });
    return { criteria: criteria, defs: state.kriteria, alt: alt.rows, colTotals: alt.colTotals, byId: byId };
  }

  // ---------- Bantuan skala Saaty ----------
  /** Daftar nilai skala Saaty: 9,8,...,2,1,1/2,...,1/9 */
  function saatyValues() {
    const out = [];
    for (let v = 9; v >= 2; v--) out.push(v);
    out.push(1);
    for (let v = 2; v <= 9; v++) out.push(1 / v);
    return out;
  }

  /** Label teks dari sebuah nilai Saaty (mis. 0.3333 -> "1/3") */
  function saatyLabel(v) {
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    const inv = 1 / v;
    if (Math.abs(inv - Math.round(inv)) < 1e-9) return '1/' + Math.round(inv);
    return v.toFixed(3);
  }

  /** Cek matriks valid: persegi, angka positif, diagonal 1, reciprocal */
  function isValidMatrix(m) {
    if (!Array.isArray(m) || m.length < 2) return false;
    const n = m.length;
    for (let i = 0; i < n; i++) {
      if (!Array.isArray(m[i]) || m[i].length !== n) return false;
      for (let j = 0; j < n; j++) {
        const v = m[i][j];
        if (typeof v !== 'number' || !isFinite(v) || v <= 0) return false;
      }
      if (Math.abs(m[i][i] - 1) > 1e-9) return false;
    }
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(m[i][j] * m[j][i] - 1) > 1e-6) return false;
      }
    }
    return true;
  }

  const api = {
    RI_TABLE: RI_TABLE, CR_LIMIT: CR_LIMIT,
    calcCriteria: calcCriteria, calcAlternatives: calcAlternatives, run: run,
    categoryFor: categoryFor, saatyValues: saatyValues, saatyLabel: saatyLabel, isValidMatrix: isValidMatrix
  };

  root.AHP = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
