FOTO UNTUK COVER & SLIDESHOW HALAMAN AWAL
==========================================

Halaman awal (index.html) adalah satu halaman berurutan:
cover -> slideshow foto -> dashboard dan menu aplikasi.
Navbar tidak terlihat di cover; navbar muncul setelah halaman
digulir melewati cover. Tidak ada sidebar.

1. FOTO LATAR COVER
-------------------
Taruh satu foto latar dengan nama:

    cover.jpeg

Foto ini akan dipakai sebagai background seluruh halaman awal.
Di atasnya otomatis ada overlay hijau dengan opacity 50%.
Bisa juga JPG/PNG/WEBP; jika nama beda, ubah COVER_IMAGE di js/config.js.

Disarankan: foto landscape lebar, minimal 1600 px, komposisi kosong di
tengah/kiri agar judul dan tombol tetap mudah dibaca.

Untuk cover, MP4 juga didukung. Simpan sebagai cover.mp4 atau ubah COVER_IMAGE
ke nama file MP4 yang diinginkan di js/config.js. Video akan diputar otomatis,
diam (muted), berulang, dan mengisi layar penuh.


2. FOTO SLIDESHOW (pengganti foto bupati pada contoh)
-----------------------------------------------------
Taruh foto dengan nama sebagai berikut:

    slide-01.jpeg
    slide-02.jpeg
    slide-03.jpeg
    slide-04.jpeg
    slide-05.jpeg
    slide-06.jpeg
    slide-07.jpeg
    slide-08.jpeg

- File yang belum ada otomatis dilewati, jadi boleh ditaruh bertahap.
- Urutan slideshow mengikuti nomor nama file.
- Disarankan ukuran 4:3 atau 16:9, lebar minimal 1000 px.
- Bila ingin nama/keterangan lain, ubah daftar SLIDES di js/config.js:

    SLIDES: [
      { src: './assets/images/jalan-desa.jpg', text: 'Jalan Desa Pekutatan' },
      { src: './assets/images/jembatan.jpg', text: 'Jembatan Desa Pekutatan' }
    ]


3. BELUM ADA FOTO?
------------------
Sebelum file ditaruh:
- latar memakai warna hijau polos dengan overlay 50%;
- slideshow memakai 3 slide placeholder bawaan aplikasi.

Jadi halaman awal tetap terlihat rapi walau foto belum tersedia.
