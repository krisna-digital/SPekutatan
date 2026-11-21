# SPK Prioritas Pembangunan Desa Pekutatan

Sistem Pendukung Keputusan (SPK) Prioritas Pembangunan Infrastruktur Desa Pekutatan berbasis **Web GIS** dengan metode **Analytical Hierarchy Process (AHP)**. Aplikasi ini adalah prototype untuk penelitian skripsi dan di-deploy sebagai website statis di GitHub Pages. Login admin dan penyimpanan data bersama memakai **Supabase**.

> **PENTING:** Seluruh data bawaan adalah **DATA DEMO**, bukan data resmi Desa Pekutatan. Koordinat demo sudah berada di dalam batas desa (garis merah), tetapi tetap merupakan perkiraan. Ganti dengan data hasil survei sebelum dipakai (lihat bagian "Mengganti data demo").

## Teknologi

- HTML5, CSS3, JavaScript vanilla (tanpa framework, tanpa server sendiri)
- [Leaflet.js](https://leafletjs.com/) 1.9.4 + OpenStreetMap (peta)
- [Chart.js](https://www.chartjs.org/) 4.4.1 (grafik)
- Supabase (Auth + tabel JSONB + Realtime) untuk login admin dan data bersama
- LocalStorage (salinan cepat/cadangan di browser)
- Hosting: GitHub Pages

Leaflet dan Chart.js dimuat dari CDN, sehingga perangkat memerlukan koneksi internet untuk peta dan grafik.

## Cara menjalankan

Karena memakai path relatif dan tanpa server, ada dua cara:

1. **Langsung**: buka `index.html` di browser. Semua fitur berjalan, tetapi beberapa browser membatasi fitur lokasi (GPS) pada `file://`.
2. **Server lokal sederhana** (disarankan untuk uji): jalankan `python3 -m http.server` di folder proyek, lalu buka alamat yang ditampilkan.

Tanpa konfigurasi Supabase, aplikasi tetap bisa dibuka memakai salinan data lokal, tetapi login admin tidak aktif dan data tidak tersinkron antarperangkat. Ikuti bagian **Konfigurasi Supabase** di bawah untuk memakai fitur penuh.

## Cara deploy ke GitHub Pages

1. Buat repository baru di GitHub, lalu unggah seluruh isi folder ini ke cabang `main` (file `index.html` harus berada di root repository).
2. Buka **Settings → Pages**.
3. Pada *Build and deployment*, pilih **Deploy from a branch**, cabang `main`, folder `/ (root)`, lalu **Save**.
4. Tunggu beberapa menit. Alamat situs: `https://<username>.github.io/<nama-repo>/`.

Tombol "Lokasi saya" membutuhkan HTTPS, yang otomatis tersedia di GitHub Pages.

## Konfigurasi Supabase (step by step)

Ikuti langkah ini sekali saja. Setelah selesai, admin dapat login dari perangkat mana pun, dan setiap perubahan langsung tampil di pengunjung/perangkat lain.

### 1. Buat project Supabase

1. Buka <https://supabase.com/dashboard> → **New project**.
2. Isi nama project (mis. `spk-pekutatan`), password database, pilih region terdekat (Singapore), lalu **Create new project**. Tunggu statusnya **Active**.

### 2. Buat tabel dan aturan akses

1. Di sidebar, pilih **SQL Editor → New query**.
2. Salin seluruh SQL berikut, lalu klik **Run**:

```sql
create table if not exists public.spk_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.spk_state enable row level security;

drop policy if exists "spk_read" on public.spk_state;
create policy "spk_read" on public.spk_state
  for select to anon, authenticated using (true);

drop policy if exists "spk_admin_write" on public.spk_state;
create policy "spk_admin_write" on public.spk_state
  for all to authenticated
  using (auth.jwt() ->> 'email' = 'admin@peku.local')
  with check (auth.jwt() ->> 'email' = 'admin@peku.local');

-- Aktifkan Realtime. Jika muncul pesan "already member", tidak apa-apa.
do $$
begin
  alter publication supabase_realtime add table public.spk_state;
exception when duplicate_object then null;
end $$;
```

Artinya: **pengunjung (anon) hanya bisa baca**, **hanya email `admin@peku.local` yang bisa menulis**. Password tidak disimpan di tabel ini. Jika Anda memakai email admin lain, ganti dua kemunculan `admin@peku.local` pada SQL di atas **dan** nilai `ADMIN_EMAIL` di `js/config.js` secara bersamaan.

### 3. Buat akun admin

1. **Authentication → Providers → Email** pastikan aktif.
2. **Authentication → Users → Add user → Create new user**.
3. Masukkan email admin (mis. `admin@peku.local`) dan password, centang **Auto Confirm User**, lalu **Create user**.
4. Supabase menyimpan password tersebut dalam bentuk **hash** di server. Jangan pernah menulis password apa pun ke `js/config.js`.

Email dan password inilah yang dipakai di halaman `index.html`.

### 4. Atur alamat redirect (untuk "Lupa password")

1. **Authentication → URL Configuration**.
2. **Site URL** diisi alamat GitHub Pages, mis. `https://username.github.io/spk-pekutatan/`.
3. **Redirect URLs** → tambahkan `https://username.github.io/spk-pekutatan/index.html`.
   Untuk uji lokal juga tambahkan `http://localhost:8000/index.html`.

### 5. Ambil Project URL dan anon key

1. **Project Settings → API**.
2. Salin **Project URL** dan **anon public** key (bagian *Project API keys*).
3. **Jangan** gunakan `service_role` key — key itu hanya untuk server dan tidak boleh masuk ke browser.

### 6. Isi `js/config.js`

Ganti tiga placeholder dengan nilai dari langkah 3 dan 5:

```js
SUPABASE_URL: 'https://abcdefgh.supabase.co',   // Project URL
SUPABASE_ANON_KEY: 'eyJhbGciOi...',               // anon public key
ADMIN_EMAIL: 'admin@peku.local'                   // email admin
```

Biarkan `STATE_TABLE: 'spk_state'` apa adanya.

### 7. Deploy dan uji sinkronisasi

1. Commit & push seluruh folder ke GitHub; GitHub Pages akan otomatis ter-update.
2. Buka situs di dua perangkat: satu sebagai **Admin**, satu sebagai **Pengunjung**.
3. Di perangkat Admin, ubah/simpan data. Di perangkat Pengunjung, dalam beberapa detik muncul notifikasi dan halaman memuat ulang dengan data terbaru.

Jika data pengunjung tidak berubah: pastikan di **Table Editor → spk_state** ada baris dengan `id = main`, periksa console browser untuk error RLS/Realtime, dan pastikan SQL di langkah 2 berhasil dijalankan.

## Struktur folder

```
/
├── index.html          Login
├── dashboard.html      Dashboard
├── infrastruktur.html  Data infrastruktur (CRUD)
├── detail.html         Detail satu usulan
├── gis.html            Peta prioritas (Web GIS)
├── ahp.html            Proses perhitungan AHP (Admin)
├── prioritas.html      Hasil ranking + grafik
├── laporan.html        Laporan cetak/PDF (Admin)
├── pengaturan.html     Identitas, password, data (Admin)
├── css/style.css
├── js/
│   ├── config.js       URL & anon key Supabase (diisi sendiri)
│   ├── supabase.js     Login, tarik/simpan data, Realtime
│   ├── data.js         Konstanta, kriteria bawaan, DATA DEMO
│   ├── storage.js      Sumber data Supabase + salinan LocalStorage, import/export
│   ├── ahp.js          Mesin perhitungan AHP (murni logika)
│   ├── app.js          Helper bersama, sidebar, toast, modal
│   ├── gis.js          Fungsi peta Leaflet + halaman Peta GIS
│   ├── login.js, dashboard.js, infrastruktur.js, detail.js,
│   │   ahp-page.js, prioritas.js, laporan.js, pengaturan.js
└── assets/logo.svg, assets/images/
```

## Cara menggunakan

**Login.** Admin memakai email + password yang dibuat di Supabase (lihat langkah 3 di atas). Password di-hash oleh Supabase, bukan oleh browser, dan berlaku sama di semua perangkat. **Lupa password?** klik tombolnya, lalu buka tautan yang dikirim Supabase untuk membuat password baru. Pengunjung masuk tanpa password dan hanya dapat melihat dashboard, data, peta, dan prioritas.

**Data bersama.** Seluruh usulan, kriteria, dan identitas laporan disimpan di satu baris tabel `spk_state` (JSONB). Salinan di LocalStorage hanya dipakai agar tampilan cepat dan sebagai cadangan saat internet putus. Setiap simpanan Admin langsung dikirim ke Supabase dan diterima pengunjung lewat Realtime.

**Admin dapat:** menambah/mengedit/menghapus usulan, mengubah kriteria dan bobot, melihat proses AHP, mencetak laporan, dan mengatur data.

**Alur kerja:** isi data usulan → atur perbandingan kriteria (menu Perhitungan AHP) → periksa CR → lihat ranking di Prioritas → lihat sebaran di Peta GIS → cetak Laporan.

## Metode AHP

Kriteria bawaan:

| Kode | Kriteria | Arah |
|------|----------|------|
| C1 | Kondisi Infrastruktur | Benefit (makin rusak makin prioritas) |
| C2 | Tingkat Urgensi | Benefit |
| C3 | Jumlah Masyarakat Terdampak | Benefit |
| C4 | Manfaat Pembangunan | Benefit |
| C5 | Estimasi Biaya | **Cost** (makin murah makin prioritas) |

Alasan C5 bertipe cost: anggaran desa terbatas, sehingga usulan berbiaya lebih rendah lebih mudah direalisasikan. Admin dapat mengubahnya menjadi benefit di menu Perhitungan AHP.

Tahapan (semua dihitung di `js/ahp.js` dan ditampilkan di halaman AHP):

1. Matriks perbandingan berpasangan (skala Saaty 1–9, nilai kebalikan terisi otomatis)
2. Normalisasi matriks (elemen ÷ jumlah kolom)
3. Bobot kriteria (rata-rata baris)
4. Priority vector
5. Weighted sum vector
6. λmax
7. Consistency Index: CI = (λmax − n) / (n − 1)
8. Consistency Ratio: CR = CI / RI. **CR ≤ 0,10 → Konsisten**, CR > 0,10 → Tidak Konsisten (peringatan ditampilkan)

**Nilai alternatif.** Kriteria ordinal diberi skor 1–4 (mis. Rusak Berat = 4). Nilai lokal benefit = x ÷ Σx; cost = (1/x) ÷ Σ(1/x). Nilai akhir = Σ (bobot kriteria × nilai lokal), lalu diurutkan dari terbesar. Kategori prioritas dibagi tiga bagian sama besar menurut peringkat (sepertiga teratas = Tinggi, sepertiga terbawah = Rendah, sisanya Sedang).

Catatan: pendekatan ini memakai normalisasi langsung nilai alternatif terhadap tiap kriteria. Bila skripsi Anda memakai perbandingan berpasangan alternatif per kriteria, sesuaikan `calcAlternatives()` di `js/ahp.js`.

## Web GIS

Peta memakai Leaflet + OpenStreetMap. **Garis merah adalah batas administratif Desa Pekutatan** (sumber: OpenStreetMap, 325 titik) dan ditampilkan persis mengikuti foto referensi. Marker diambil dari latitude/longitude data infrastruktur dan diberi warna sesuai hasil AHP (merah = tinggi, kuning = sedang, hijau = rendah), berisi nomor ranking. Klik marker untuk popup (nama, banjar, jenis, kondisi, urgensi, nilai AHP, ranking). Tersedia legenda, zoom, reset view, lokasi saya, serta filter prioritas dan jenis. Pada form data, lokasi dipilih dengan mengklik peta atau menggeser pin.

**Aturan wilayah:** penambahan data maupun titik koordinat (klik peta, geser pin, input manual, GPS, dan import JSON) **hanya diizinkan di dalam garis merah**. Titik di luar batas ditolak. Data demo lama yang berada di luar garis otomatis diganti dengan data demo baru yang seluruhnya berada di dalam batas saat aplikasi dibuka.

## Import / Export data

- **Export**: menu Data Infrastruktur atau Pengaturan → *Export Data* mengunduh file JSON (usulan, kriteria, bobot, identitas).
- **Import**: *Import Data* → pilih file JSON hasil export. Data saat ini diganti, nilai dan ranking dihitung ulang. File yang bukan hasil export aplikasi ditolak.
- Data utama tersimpan di Supabase dan langsung tersinkron ke semua perangkat. Gunakan Export sebagai cadangan tambahan (mis. sebelum import massal).

## Mengganti data demo

Menu **Pengaturan → Kosongkan data usulan**, lalu isi data penelitian lewat **Data Infrastruktur → Tambah Data**. Hilangkan centang "DATA DEMO" pada data asli. Isi juga identitas dan periode laporan di Pengaturan.

Foto dikecilkan otomatis (maks. 800 px) lalu ikut tersimpan sebagai teks di JSONB Supabase (juga dicache di LocalStorage). Gunakan foto seperlunya agar ukuran database tetap ringan.
