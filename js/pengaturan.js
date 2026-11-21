/**
 * pengaturan.js
 * ---------------------------------------------------------------
 * Halaman Pengaturan (khusus Admin): identitas laporan, ganti password,
 * export/import data, pulihkan demo, dan kosongkan data usulan.
 * ---------------------------------------------------------------
 */
(function () {
  'use strict';

  const $ = App.$;

  App.onPage('pengaturan', function () {
    const session = App.init({ page: 'pengaturan', adminOnly: true, noDemoBanner: true });
    if (!session) return;

    // ---------- Identitas ----------
    function fillMeta() {
      const m = Store.getMeta();
      $('#m-desa').value = m.desa; $('#m-kec').value = m.kecamatan; $('#m-kab').value = m.kabupaten;
      $('#m-prov').value = m.provinsi; $('#m-periode').value = m.periode; $('#m-penyusun').value = m.penyusun;
    }
    fillMeta();
    $('#form-meta').addEventListener('submit', function (e) {
      e.preventDefault();
      const m = {
        desa: $('#m-desa').value.trim(), kecamatan: $('#m-kec').value.trim(), kabupaten: $('#m-kab').value.trim(),
        provinsi: $('#m-prov').value.trim(), periode: $('#m-periode').value.trim(), penyusun: $('#m-penyusun').value.trim()
      };
      if (!m.desa) { App.toast('Nama desa tidak boleh kosong.', 'warn'); return; }
      Store.saveMeta(m);
      App.toast('Identitas disimpan.');
    });

    // ---------- Ganti password (Supabase Auth) ----------
    $('#form-pass').addEventListener('submit', function (e) {
      e.preventDefault();
      const err = $('#p-err');
      err.textContent = '';
      const oldP = $('#p-old').value, n1 = $('#p-new').value, n2 = $('#p-new2').value;
      if (!oldP) { err.textContent = 'Password saat ini wajib diisi.'; return; }
      if (n1.length < 6) { err.textContent = 'Password baru minimal 6 karakter.'; return; }
      if (n1 !== n2) { err.textContent = 'Konfirmasi password baru tidak sama.'; return; }
      if (!SPKCloud.configured()) { err.textContent = 'Supabase belum dikonfigurasi.'; return; }
      const btn = $('#form-pass').querySelector('[type="submit"]');
      btn.disabled = true;
      // Supabase meminta login ulang dengan password lama sebelum update password.
      SPKCloud.reauthenticate(oldP).then(function () {
        return SPKCloud.updatePassword(n1);
      }).then(function (res) {
        if (res && res.error) throw res.error;
        $('#form-pass').reset();
        App.toast('Password berhasil diganti.');
      }).catch(function (error) {
        err.textContent = 'Gagal mengganti password: ' + ((error && error.message) || error);
      }).then(function () { btn.disabled = false; });
    });

    // ---------- Data ----------
    $('#btn-export').addEventListener('click', App.exportJSON);
    $('#btn-import').addEventListener('click', function () { App.importJSON(fillMeta); });
    $('#btn-demo').addEventListener('click', function () {
      App.confirm({ title: 'Pulihkan data demo', danger: true, okText: 'Pulihkan', message: 'Seluruh data usulan dan kriteria akan diganti dengan data demo bawaan. Lanjutkan?' })
        .then(function (ok) { if (ok) { Store.resetDemo(); App.toast('Data demo dipulihkan.'); } });
    });
    $('#btn-clear').addEventListener('click', function () {
      App.confirm({ title: 'Kosongkan data usulan', danger: true, okText: 'Kosongkan', message: 'Semua data usulan akan dihapus. Disarankan Export dulu sebagai cadangan. Lanjutkan?' })
        .then(function (ok) { if (ok) { Store.clearInfra(); App.toast('Seluruh data usulan dihapus.'); } });
    });
  });
})();
