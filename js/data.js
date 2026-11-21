/**
 * data.js
 * ---------------------------------------------------------------
 * Konstanta aplikasi, skala penilaian, kriteria bawaan, dan DATA DEMO.
 *
 * PENTING: Semua data usulan di file ini adalah DATA DEMO untuk
 * keperluan demonstrasi prototype. BUKAN data resmi Desa Pekutatan.
 * Koordinat hanya perkiraan di sekitar wilayah desa dan harus diganti
 * dengan hasil survei/penelitian yang sebenarnya.
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  // ---------- Daftar pilihan (enumerasi) ----------
  const JENIS = [
    'Jalan',
    'Jembatan',
    'Drainase',
    'Irigasi',
    'Fasilitas Umum',
    'Penerangan Jalan',
    'Infrastruktur Lainnya'
  ];

  // Skala ordinal 1-4 (semakin besar skor = semakin tinggi kebutuhan/manfaat)
  const KONDISI = [
    { label: 'Baik', skor: 1 },
    { label: 'Rusak Ringan', skor: 2 },
    { label: 'Rusak Sedang', skor: 3 },
    { label: 'Rusak Berat', skor: 4 }
  ];
  const URGENSI = [
    { label: 'Rendah', skor: 1 },
    { label: 'Sedang', skor: 2 },
    { label: 'Tinggi', skor: 3 },
    { label: 'Sangat Tinggi', skor: 4 }
  ];
  const MANFAAT = [
    { label: 'Kecil', skor: 1 },
    { label: 'Sedang', skor: 2 },
    { label: 'Besar', skor: 3 },
    { label: 'Sangat Besar', skor: 4 }
  ];
  const STATUS = ['Usulan', 'Disetujui', 'Dalam Pengerjaan', 'Selesai'];

  // Kategori prioritas
  const KATEGORI = {
    tinggi: { key: 'tinggi', label: 'Prioritas Tinggi', short: 'Tinggi', color: '#dc2626' },
    sedang: { key: 'sedang', label: 'Prioritas Sedang', short: 'Sedang', color: '#f59e0b' },
    rendah: { key: 'rendah', label: 'Prioritas Rendah', short: 'Rendah', color: '#16a34a' }
  };

  // ---------- Identitas desa & pengaturan laporan (bawaan) ----------
  const DEFAULT_META = {
    desa: 'Desa Pekutatan',
    kecamatan: 'Kecamatan Pekutatan',
    kabupaten: 'Kabupaten Jembrana',
    provinsi: 'Provinsi Bali',
    periode: 'Tahun Anggaran ' + new Date().getFullYear(),
    penyusun: ''
  };

  // Titik tengah peta mengikuti batas wilayah Desa Pekutatan.
  const MAP_CENTER = [-8.4222, 114.8409];
  const MAP_ZOOM = 14;

  // Batas wilayah Desa Pekutatan (sumber: OpenStreetMap, batas administratif desa).
  // Garis merah pada peta mengikuti persis poligon ini. Format: [latitude, longitude].
  const BATAS_DESA = [
    [-8.424832, 114.814745], [-8.424866, 114.815058], [-8.424987, 114.815525], [-8.425096, 114.815678],
    [-8.425313, 114.815819], [-8.425726, 114.816125], [-8.426233, 114.816539], [-8.426813, 114.816893],
    [-8.427501, 114.817246], [-8.427853, 114.817312], [-8.427947, 114.817311], [-8.428001, 114.817351],
    [-8.428178, 114.817417], [-8.428531, 114.817403], [-8.428956, 114.817427], [-8.429399, 114.817388],
    [-8.429581, 114.817308], [-8.429732, 114.817156], [-8.430011, 114.816826], [-8.430154, 114.816697],
    [-8.430373, 114.816602], [-8.430549, 114.816559], [-8.431135, 114.816535], [-8.431449, 114.816588],
    [-8.431587, 114.816673], [-8.431610, 114.816821], [-8.431539, 114.817097], [-8.431487, 114.817402],
    [-8.431406, 114.817487], [-8.431130, 114.817559], [-8.431054, 114.817611], [-8.431096, 114.817763],
    [-8.431339, 114.818072], [-8.431434, 114.818272], [-8.431401, 114.818453], [-8.431253, 114.818682],
    [-8.431168, 114.818977], [-8.431230, 114.819557], [-8.431330, 114.820062], [-8.431435, 114.820364],
    [-8.431689, 114.820770], [-8.432129, 114.821278], [-8.432634, 114.821752], [-8.433460, 114.822573],
    [-8.434169, 114.824083], [-8.434465, 114.824430], [-8.434651, 114.824705], [-8.434772, 114.825014],
    [-8.434946, 114.826248], [-8.435127, 114.827103], [-8.435119, 114.828295], [-8.435130, 114.829464],
    [-8.435187, 114.830789], [-8.435227, 114.832588], [-8.435346, 114.834927], [-8.435772, 114.836628],
    [-8.435974, 114.837655], [-8.436035, 114.838143], [-8.436555, 114.840033], [-8.436831, 114.841220],
    [-8.436892, 114.841595], [-8.437231, 114.843039], [-8.437801, 114.844911], [-8.438347, 114.847109],
    [-8.438672, 114.848290], [-8.438868, 114.849068], [-8.438831, 114.849296], [-8.438809, 114.849319],
    [-8.438816, 114.849407], [-8.438884, 114.849635], [-8.438936, 114.849758], [-8.438458, 114.849960],
    [-8.438130, 114.850176], [-8.437967, 114.850471], [-8.437969, 114.850860], [-8.438123, 114.851442],
    [-8.439161, 114.852860], [-8.439723, 114.853678], [-8.439768, 114.853979], [-8.439662, 114.854261],
    [-8.439556, 114.854434], [-8.439320, 114.854543], [-8.438870, 114.854632], [-8.437904, 114.854637],
    [-8.437132, 114.854685], [-8.436660, 114.854774], [-8.436189, 114.854927], [-8.435910, 114.855080],
    [-8.435698, 114.855470], [-8.435595, 114.856290], [-8.435578, 114.857111], [-8.435516, 114.857586],
    [-8.435325, 114.857846], [-8.435089, 114.857933], [-8.434917, 114.857891], [-8.434700, 114.857526],
    [-8.434483, 114.857030], [-8.434394, 114.856513], [-8.434348, 114.855930], [-8.434390, 114.855736],
    [-8.434454, 114.855628], [-8.434667, 114.855411], [-8.434880, 114.855129], [-8.434987, 114.854956],
    [-8.434942, 114.854610], [-8.434812, 114.854460], [-8.434468, 114.854268], [-8.434038, 114.854119],
    [-8.433780, 114.854142], [-8.433545, 114.854273], [-8.433331, 114.854425], [-8.433160, 114.854448],
    [-8.432641, 114.854248], [-8.432286, 114.853627], [-8.431964, 114.852894], [-8.431918, 114.852853],
    [-8.431436, 114.852836], [-8.431039, 114.853001], [-8.430767, 114.853040], [-8.430640, 114.853123],
    [-8.430404, 114.853676], [-8.430140, 114.854100], [-8.429972, 114.854298], [-8.429789, 114.854407],
    [-8.429250, 114.854426], [-8.429112, 114.854450], [-8.429014, 114.854536], [-8.428919, 114.854795],
    [-8.428904, 114.854970], [-8.428969, 114.855136], [-8.429656, 114.855665], [-8.429734, 114.855782],
    [-8.429426, 114.856492], [-8.428910, 114.857124], [-8.428753, 114.857392], [-8.428661, 114.857735],
    [-8.428614, 114.858113], [-8.428666, 114.858409], [-8.428746, 114.858704], [-8.428740, 114.858909],
    [-8.428590, 114.859265], [-8.428477, 114.859493], [-8.428552, 114.860147], [-8.428441, 114.860264],
    [-8.428309, 114.860315], [-8.428182, 114.860291], [-8.427713, 114.860079], [-8.427248, 114.859967],
    [-8.426642, 114.859913], [-8.426068, 114.859882], [-8.425954, 114.859892], [-8.425845, 114.860011],
    [-8.425780, 114.860137], [-8.425783, 114.860816], [-8.425753, 114.861013], [-8.425672, 114.861138],
    [-8.425559, 114.861190], [-8.424943, 114.861082], [-8.424819, 114.861107], [-8.424683, 114.861216],
    [-8.424269, 114.862187], [-8.424152, 114.862417], [-8.424064, 114.862506], [-8.423858, 114.862531],
    [-8.423426, 114.862483], [-8.423222, 114.862492], [-8.423019, 114.862575], [-8.422838, 114.862740],
    [-8.422801, 114.862850], [-8.422831, 114.862975], [-8.422942, 114.863098], [-8.423898, 114.863214],
    [-8.424118, 114.863309], [-8.424225, 114.863403], [-8.424312, 114.863662], [-8.424330, 114.863841],
    [-8.424257, 114.864008], [-8.423761, 114.864484], [-8.423618, 114.864653], [-8.423417, 114.864849],
    [-8.422968, 114.865148], [-8.422479, 114.865388], [-8.421565, 114.865805], [-8.420613, 114.866372],
    [-8.420257, 114.866518], [-8.419868, 114.866623], [-8.419277, 114.866679], [-8.418253, 114.866650],
    [-8.418029, 114.866725], [-8.417588, 114.867028], [-8.417343, 114.866073], [-8.417337, 114.865552],
    [-8.417621, 114.864392], [-8.417834, 114.863319], [-8.418017, 114.862740], [-8.417888, 114.861338],
    [-8.417658, 114.860517], [-8.417327, 114.859769], [-8.416870, 114.859030], [-8.415610, 114.857400],
    [-8.414869, 114.856523], [-8.414464, 114.855697], [-8.414097, 114.855124], [-8.413689, 114.854694],
    [-8.412355, 114.853796], [-8.411115, 114.853164], [-8.410656, 114.852801], [-8.410085, 114.851859],
    [-8.409799, 114.851031], [-8.409577, 114.850141], [-8.409506, 114.849198], [-8.409372, 114.848530],
    [-8.409163, 114.848149], [-8.408642, 114.847722], [-8.408169, 114.847391], [-8.407805, 114.847194],
    [-8.407452, 114.846815], [-8.406845, 114.845571], [-8.406424, 114.844896], [-8.405922, 114.844244],
    [-8.405585, 114.843845], [-8.404613, 114.843072], [-8.404416, 114.842458], [-8.404205, 114.841888],
    [-8.403781, 114.841332], [-8.403249, 114.840843], [-8.402831, 114.840569], [-8.402707, 114.840296],
    [-8.402762, 114.839815], [-8.402952, 114.839512], [-8.402994, 114.838923], [-8.403262, 114.838515],
    [-8.403272, 114.837535], [-8.403478, 114.837035], [-8.403478, 114.836790], [-8.403400, 114.836381],
    [-8.403285, 114.835977], [-8.402999, 114.835399], [-8.402685, 114.834689], [-8.402597, 114.834229],
    [-8.402512, 114.833631], [-8.402648, 114.833554], [-8.402785, 114.833563], [-8.402901, 114.833630],
    [-8.403042, 114.833777], [-8.403298, 114.834135], [-8.403704, 114.834657], [-8.403857, 114.834733],
    [-8.403964, 114.834704], [-8.404127, 114.834594], [-8.404318, 114.834390], [-8.405242, 114.833324],
    [-8.406003, 114.832506], [-8.406148, 114.832225], [-8.406239, 114.831920], [-8.406234, 114.830830],
    [-8.406341, 114.830511], [-8.406589, 114.830000], [-8.407213, 114.828906], [-8.407400, 114.828729],
    [-8.407622, 114.828614], [-8.407834, 114.828579], [-8.408053, 114.828625], [-8.408405, 114.828804],
    [-8.408721, 114.828942], [-8.408964, 114.828979], [-8.409127, 114.828924], [-8.409298, 114.828786],
    [-8.409444, 114.828591], [-8.409497, 114.828415], [-8.409513, 114.828151], [-8.409510, 114.827060],
    [-8.409329, 114.826505], [-8.409139, 114.826213], [-8.408311, 114.825506], [-8.408192, 114.825313],
    [-8.408142, 114.825107], [-8.408157, 114.824885], [-8.408245, 114.824583], [-8.408402, 114.824290],
    [-8.408638, 114.824026], [-8.408804, 114.823930], [-8.408967, 114.823912], [-8.409164, 114.823972],
    [-8.409709, 114.824218], [-8.409730, 114.824282], [-8.409796, 114.824391], [-8.409949, 114.824561],
    [-8.410386, 114.825644], [-8.410553, 114.825892], [-8.410757, 114.826032], [-8.411002, 114.826147],
    [-8.411247, 114.826201], [-8.411450, 114.826156], [-8.411794, 114.826025], [-8.411978, 114.825885],
    [-8.412635, 114.824783], [-8.412955, 114.824171], [-8.413118, 114.823748], [-8.413507, 114.822239],
    [-8.413882, 114.821247], [-8.414105, 114.821035], [-8.414347, 114.820905], [-8.414622, 114.820834],
    [-8.414967, 114.820844], [-8.415896, 114.820952], [-8.416275, 114.820915], [-8.416772, 114.820755],
    [-8.416971, 114.820560], [-8.417323, 114.820089], [-8.417945, 114.819317], [-8.418224, 114.819087],
    [-8.418468, 114.818976], [-8.418698, 114.818948], [-8.419721, 114.818936], [-8.421341, 114.819125],
    [-8.421811, 114.819077], [-8.421996, 114.819016], [-8.422490, 114.818601], [-8.422720, 114.818358],
    [-8.422956, 114.817903], [-8.423185, 114.817024], [-8.423522, 114.816336], [-8.424409, 114.815149],
    [-8.424832, 114.814745]
  ];

  /** Menguji apakah suatu titik (lat, lng) berada di dalam garis batas desa. */
  function isInsideBoundary(lat, lng) {
    if (!isFinite(lat) || !isFinite(lng)) return false;
    let inside = false;
    for (let i = 0, j = BATAS_DESA.length - 1; i < BATAS_DESA.length; j = i++) {
      const yi = BATAS_DESA[i][0], xi = BATAS_DESA[i][1];
      const yj = BATAS_DESA[j][0], xj = BATAS_DESA[j][1];
      if ((yi > lat) !== (yj > lat) &&
          lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }


  // ---------- Kriteria bawaan ----------
  // field  : nama properti pada data infrastruktur yang dinilai
  // tipe   : 'benefit' (semakin besar semakin diprioritaskan)
  //          'cost'    (semakin kecil semakin diprioritaskan)
  const DEFAULT_CRITERIA = [
    {
      kode: 'C1', field: 'kondisi', tipe: 'benefit',
      nama: 'Kondisi Infrastruktur',
      deskripsi: 'Semakin buruk kondisi, semakin tinggi prioritas.'
    },
    {
      kode: 'C2', field: 'urgensi', tipe: 'benefit',
      nama: 'Tingkat Urgensi',
      deskripsi: 'Semakin urgent, semakin tinggi prioritas.'
    },
    {
      kode: 'C3', field: 'terdampak', tipe: 'benefit',
      nama: 'Jumlah Masyarakat Terdampak',
      deskripsi: 'Semakin banyak masyarakat terdampak, semakin tinggi prioritas.'
    },
    {
      kode: 'C4', field: 'manfaat', tipe: 'benefit',
      nama: 'Manfaat Pembangunan',
      deskripsi: 'Semakin besar manfaat, semakin tinggi prioritas.'
    },
    {
      kode: 'C5', field: 'biaya', tipe: 'cost',
      nama: 'Estimasi Biaya',
      deskripsi: 'Arah preferensi COST: semakin kecil biaya, semakin tinggi nilai. ' +
        'Dengan anggaran desa yang terbatas, usulan berbiaya rendah lebih mudah direalisasikan lebih dulu.'
    }
  ];

  // Matriks perbandingan berpasangan bawaan (skala Saaty 1-9).
  // Baris i dibanding kolom j. Bagian bawah diagonal = kebalikan (reciprocal).
  // Urutan: C1 Kondisi, C2 Urgensi, C3 Terdampak, C4 Manfaat, C5 Biaya
  const DEFAULT_PAIRWISE_UPPER = [
    // C2  C3  C4  C5   (nilai C1 terhadap ...)
    [1, 2, 3, 5],   // C1 vs C2, C3, C4, C5
    [2, 3, 4],      // C2 vs C3, C4, C5
    [1, 3],         // C3 vs C4, C5
    [2]             // C4 vs C5
  ];

  function buildMatrixFromUpper(upper, n) {
    const m = Array.from({ length: n }, () => Array(n).fill(1));
    for (let i = 0; i < n - 1; i++) {
      for (let k = 0; k < upper[i].length; k++) {
        const j = i + 1 + k;
        m[i][j] = upper[i][k];
        m[j][i] = 1 / upper[i][k];
      }
    }
    return m;
  }

  function defaultCriteriaState() {
    return {
      kriteria: DEFAULT_CRITERIA.map(function (c) { return Object.assign({}, c); }),
      matrix: buildMatrixFromUpper(DEFAULT_PAIRWISE_UPPER, DEFAULT_CRITERIA.length)
    };
  }

  // ---------- Konversi nilai data -> angka untuk AHP ----------
  function skorOf(list, label) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].label === label) return list[i].skor;
    }
    return 0;
  }

  /**
   * Nilai mentah sebuah usulan untuk satu kriteria (berdasarkan field-nya).
   * Ordinal -> skor 1-4, numerik -> angka apa adanya.
   */
  function rawValue(item, field) {
    switch (field) {
      case 'kondisi': return skorOf(KONDISI, item.kondisi);
      case 'urgensi': return skorOf(URGENSI, item.urgensi);
      case 'manfaat': return skorOf(MANFAAT, item.manfaat);
      case 'terdampak': return Math.max(0, Number(item.terdampak) || 0);
      case 'biaya': return Math.max(0, Number(item.biaya) || 0);
      default: return 0;
    }
  }

  // Keterangan sumber data tiap kriteria (untuk ditampilkan di halaman AHP)
  const FIELD_INFO = {
    kondisi: 'Kondisi (skala 1-4: Baik=1 ... Rusak Berat=4)',
    urgensi: 'Urgensi (skala 1-4: Rendah=1 ... Sangat Tinggi=4)',
    terdampak: 'Jumlah masyarakat terdampak (jiwa)',
    manfaat: 'Manfaat (skala 1-4: Kecil=1 ... Sangat Besar=4)',
    biaya: 'Estimasi biaya (Rupiah)'
  };

  // ---------- DATA DEMO ----------
  // Koordinat contoh, semuanya berada DI DALAM batas garis merah Desa Pekutatan.
  // Bukan hasil survei; ganti dengan data penelitian sebelum dipakai.
  const DEMO_DATA = [
    {
      id: 'INF-001', nama: 'Pembangunan Jalan Pekutatan', jenis: 'Jalan', banjar: 'Pekutatan',
      deskripsi: 'Jalan lingkungan sepanjang kurang lebih 1,2 km berlubang dan sulit dilalui saat musim hujan.',
      kondisi: 'Rusak Berat', urgensi: 'Sangat Tinggi', terdampak: 850, manfaat: 'Sangat Besar',
      biaya: 450000000, lat: -8.424120, lng: 114.843501, status: 'Usulan'
    },
    {
      id: 'INF-002', nama: 'Perbaikan Drainase Sagah', jenis: 'Drainase', banjar: 'Sagah',
      deskripsi: 'Saluran drainase tersumbat dan sering meluap ke permukiman saat hujan lebat.',
      kondisi: 'Rusak Sedang', urgensi: 'Tinggi', terdampak: 620, manfaat: 'Besar',
      biaya: 180000000, lat: -8.428591, lng: 114.819973, status: 'Usulan'
    },
    {
      id: 'INF-003', nama: 'Rehabilitasi Jembatan Yehleb', jenis: 'Jembatan', banjar: 'Yehleb',
      deskripsi: 'Jembatan penghubung antarbanjar mengalami keretakan pada pilar dan lantai jembatan.',
      kondisi: 'Rusak Berat', urgensi: 'Sangat Tinggi', terdampak: 1200, manfaat: 'Sangat Besar',
      biaya: 750000000, lat: -8.406983, lng: 114.835658, status: 'Usulan'
    },
    {
      id: 'INF-004', nama: 'Pembangunan Jalan Swastika', jenis: 'Jalan', banjar: 'Swastika',
      deskripsi: 'Pembangunan jalan akses menuju area permukiman baru dan lahan pertanian.',
      kondisi: 'Rusak Sedang', urgensi: 'Sedang', terdampak: 430, manfaat: 'Sedang',
      biaya: 320000000, lat: -8.419650, lng: 114.859186, status: 'Usulan'
    },
    {
      id: 'INF-005', nama: 'Perbaikan Saluran Irigasi Subak', jenis: 'Irigasi', banjar: 'Pekutatan',
      deskripsi: 'Saluran irigasi subak bocor dan menyempit sehingga distribusi air ke sawah tidak merata.',
      kondisi: 'Rusak Sedang', urgensi: 'Tinggi', terdampak: 380, manfaat: 'Besar',
      biaya: 150000000, lat: -8.419650, lng: 114.830430, status: 'Disetujui'
    },
    {
      id: 'INF-006', nama: 'Penerangan Jalan Utama Desa', jenis: 'Penerangan Jalan', banjar: 'Pekutatan',
      deskripsi: 'Sebagian lampu jalan utama desa mati sehingga rawan di malam hari.',
      kondisi: 'Rusak Ringan', urgensi: 'Sedang', terdampak: 900, manfaat: 'Besar',
      biaya: 95000000, lat: -8.433062, lng: 114.831737, status: 'Usulan'
    },
    {
      id: 'INF-007', nama: 'Rehabilitasi Balai Banjar Pangyangan', jenis: 'Fasilitas Umum', banjar: 'Pangyangan',
      deskripsi: 'Atap dan dinding balai banjar mengalami kebocoran dan pelapukan.',
      kondisi: 'Rusak Ringan', urgensi: 'Rendah', terdampak: 300, manfaat: 'Sedang',
      biaya: 210000000, lat: -8.433062, lng: 114.850036, status: 'Usulan'
    },
    {
      id: 'INF-008', nama: 'Pembangunan Talud Sungai', jenis: 'Infrastruktur Lainnya', banjar: 'Pekutatan',
      deskripsi: 'Tebing sungai rawan longsor dan mengancam rumah warga di bantaran sungai.',
      kondisi: 'Rusak Berat', urgensi: 'Tinggi', terdampak: 540, manfaat: 'Besar',
      biaya: 380000000, lat: -8.410708, lng: 114.846115, status: 'Usulan'
    },
    {
      id: 'INF-009', nama: 'Pengaspalan Jalan Lingkungan Sagah', jenis: 'Jalan', banjar: 'Sagah',
      deskripsi: 'Jalan lingkungan masih berupa makadam dan berdebu pada musim kemarau.',
      kondisi: 'Rusak Ringan', urgensi: 'Sedang', terdampak: 260, manfaat: 'Sedang',
      biaya: 140000000, lat: -8.415179, lng: 114.852650, status: 'Usulan'
    },
    {
      id: 'INF-010', nama: 'Pembangunan Drainase Pasar Desa', jenis: 'Drainase', banjar: 'Pekutatan',
      deskripsi: 'Area pasar desa belum memiliki saluran pembuangan air sehingga becek dan tergenang.',
      kondisi: 'Rusak Sedang', urgensi: 'Sedang', terdampak: 700, manfaat: 'Besar',
      biaya: 260000000, lat: -8.433062, lng: 114.839579, status: 'Usulan'
    },
    {
      id: 'INF-011', nama: 'Pemasangan Lampu Jalan Yehleb', jenis: 'Penerangan Jalan', banjar: 'Yehleb',
      deskripsi: 'Ruas jalan di Yehleb belum memiliki lampu penerangan.',
      kondisi: 'Rusak Sedang', urgensi: 'Rendah', terdampak: 210, manfaat: 'Kecil',
      biaya: 60000000, lat: -8.419650, lng: 114.822587, status: 'Usulan'
    },
    {
      id: 'INF-012', nama: 'Perbaikan Jembatan Penghubung Subak', jenis: 'Jembatan', banjar: 'Pekutatan',
      deskripsi: 'Jembatan kecil menuju area subak mengalami pelapukan pada balok kayu penopang.',
      kondisi: 'Rusak Sedang', urgensi: 'Sedang', terdampak: 150, manfaat: 'Sedang',
      biaya: 220000000, lat: -8.424120, lng: 114.835658, status: 'Usulan'
    }
  ];

  function demoData() {
    return DEMO_DATA.map(function (d) { return Object.assign({ foto: '', isDemo: true }, d); });
  }

  const api = {
    JENIS: JENIS, KONDISI: KONDISI, URGENSI: URGENSI, MANFAAT: MANFAAT, STATUS: STATUS,
    KATEGORI: KATEGORI, DEFAULT_META: DEFAULT_META, MAP_CENTER: MAP_CENTER, MAP_ZOOM: MAP_ZOOM,
    BATAS_DESA: BATAS_DESA, isInsideBoundary: isInsideBoundary,
    DEFAULT_CRITERIA: DEFAULT_CRITERIA, FIELD_INFO: FIELD_INFO,
    defaultCriteriaState: defaultCriteriaState, buildMatrixFromUpper: buildMatrixFromUpper,
    rawValue: rawValue, skorOf: skorOf, demoData: demoData
  };

  root.Data = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
