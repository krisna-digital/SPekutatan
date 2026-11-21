/**
 * gis.js
 * ---------------------------------------------------------------
 * Modul Web GIS berbasis Leaflet + OpenStreetMap (objek global "GIS").
 *  - Fungsi bersama: createMap, markerIcon, popupHtml, addMarkers, legend, kontrol
 *  - Halaman "Peta GIS" (gis.html): filter prioritas & jenis, lokasi saya, reset view
 * Marker memakai divIcon (HTML/CSS) sehingga tidak butuh file gambar marker
 * dan aman di GitHub Pages.
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

  function leafletReady() {
    return typeof root.L !== 'undefined';
  }

  /**
   * Menggambar garis merah batas wilayah Desa Pekutatan.
   * Poligonnya diambil persis dari Data.BATAS_DESA (batas administratif OSM),
   * tanpa fill agar tampil sebagai garis merah seperti pada foto referensi.
   */
  function addBoundary(map) {
    return root.L.polygon(root.Data.BATAS_DESA, {
      color: '#ff0000', weight: 2, opacity: 1,
      fillOpacity: 0, interactive: false
    }).addTo(map);
  }

  /** Membuat peta dasar OpenStreetMap. opts: {lite, interactive, zoomControl} */
  function createMap(el, opts) {
    opts = opts || {};
    const lite = !!opts.lite; // peta kecil: jangan "menyandera" scroll halaman di HP
    const map = root.L.map(el, {
      zoomControl: opts.zoomControl !== false,
      scrollWheelZoom: lite ? false : true,
      dragging: opts.interactive === false ? false : (lite ? !root.L.Browser.mobile : true),
      touchZoom: opts.interactive !== false,
      doubleClickZoom: opts.interactive !== false,
      boxZoom: opts.interactive !== false,
      keyboard: opts.interactive !== false,
      attributionControl: true
    }).setView(root.Data.MAP_CENTER, root.Data.MAP_ZOOM);
    root.L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
    addBoundary(map);
    return map;
  }

  /** Ikon marker berwarna sesuai prioritas, berisi nomor ranking. */
  function markerIcon(kategori, rank) {
    return root.L.divIcon({
      className: 'pin-wrap',
      html: '<div class="pin pin-' + kategori + '"><span>' + App.esc(rank) + '</span></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 36],
      popupAnchor: [0, -34]
    });
  }

  /** Isi popup marker (nama, banjar, jenis, kondisi, urgensi, nilai AHP, ranking). */
  function popupHtml(r, withLink) {
    const it = r.item;
    return '<div class="popup">' +
      '<div class="popup-title">' + App.esc(it.nama) + '</div>' +
      '<div class="popup-sub">' + App.esc(it.banjar) + ' · ' + App.esc(it.jenis) + '</div>' +
      '<dl><dt>Kondisi</dt><dd>' + App.esc(it.kondisi) + '</dd>' +
      '<dt>Urgensi</dt><dd>' + App.esc(it.urgensi) + '</dd>' +
      '<dt>Nilai AHP</dt><dd>' + App.fmt3(r.final) + '</dd>' +
      '<dt>Prioritas</dt><dd>#' + r.rank + ' · ' + App.esc(Data.KATEGORI[r.kategori].short) + '</dd></dl>' +
      (withLink === false ? '' : '<a class="pop-link" href="./detail.html?id=' + encodeURIComponent(it.id) + '">Lihat detail &rarr;</a>') +
      '</div>';
  }

  /**
   * Menambahkan marker semua alternatif ke peta.
   * @returns {{group:L.FeatureGroup, markers:Object}} markers dikunci menurut id
   */
  function addMarkers(map, rows, opts) {
    opts = opts || {};
    const group = root.L.featureGroup();
    const markers = {};
    rows.forEach(function (r) {
      const m = root.L.marker([r.item.lat, r.item.lng], {
        icon: markerIcon(r.kategori, r.rank),
        title: r.item.nama,
        keyboard: true
      });
      m.bindPopup(popupHtml(r, opts.link), { maxWidth: 280 });
      m.addTo(group);
      markers[r.item.id] = m;
    });
    group.addTo(map);
    return { group: group, markers: markers };
  }

  /** Mengepaskan tampilan ke batas desa (garis merah) sekaligus seluruh marker. */
  function fitTo(map, group, count) {
    const bounds = root.L.latLngBounds(root.Data.BATAS_DESA);
    if (count > 0 && group && group.getBounds().isValid()) bounds.extend(group.getBounds());
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
    else map.setView(root.Data.MAP_CENTER, root.Data.MAP_ZOOM);
  }

  function legendControl(position) {
    const c = root.L.control({ position: position || 'bottomleft' });
    c.onAdd = function () {
      const d = root.L.DomUtil.create('div', 'map-legend');
      d.innerHTML = '<div class="lg-title">Prioritas</div>' +
        ['tinggi', 'sedang', 'rendah'].map(function (k) {
          return '<div><i style="background:' + Data.KATEGORI[k].color + '"></i>' + Data.KATEGORI[k].label + '</div>';
        }).join('');
      return d;
    };
    return c;
  }

  /** Tombol kustom pada peta (Reset view, Lokasi saya). */
  function buttonControl(opts) {
    const Ctl = root.L.Control.extend({
      options: { position: opts.position || 'topleft' },
      onAdd: function () {
        const wrap = root.L.DomUtil.create('div', 'leaflet-bar');
        const a = root.L.DomUtil.create('a', 'map-btn', wrap);
        a.href = '#';
        a.title = opts.title;
        a.setAttribute('role', 'button');
        a.setAttribute('aria-label', opts.title);
        a.innerHTML = opts.html;
        root.L.DomEvent.disableClickPropagation(wrap);
        root.L.DomEvent.on(a, 'click', function (e) {
          root.L.DomEvent.preventDefault(e);
          opts.onClick();
        });
        return wrap;
      }
    });
    return new Ctl();
  }

  /** Menampilkan posisi pengguna (GPS) pada peta. */
  function locateMe(map, state) {
    if (!navigator.geolocation) { App.toast('Browser tidak mendukung geolokasi.', 'err'); return; }
    App.toast('Mencari lokasi Anda...');
    navigator.geolocation.getCurrentPosition(function (pos) {
      const ll = [pos.coords.latitude, pos.coords.longitude];
      if (state.me) map.removeLayer(state.me);
      state.me = root.L.layerGroup([
        root.L.circle(ll, { radius: pos.coords.accuracy || 30, color: '#2563eb', weight: 1, fillOpacity: 0.12 }),
        root.L.circleMarker(ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 })
          .bindTooltip('Lokasi Anda')
      ]).addTo(map);
      map.setView(ll, Math.max(map.getZoom(), 16));
    }, function (err) {
      const msg = err && err.code === 1 ? 'Izin lokasi ditolak. Aktifkan izin lokasi pada browser.'
        : 'Lokasi tidak dapat ditentukan.';
      App.toast(msg, 'err');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }

  // ---------- Halaman Peta GIS (gis.html) ----------
  function initPage() {
    const session = App.init({ page: 'gis' });
    if (!session) return;
    const mapEl = App.$('#map');
    if (!leafletReady()) {
      mapEl.innerHTML = '<div class="empty">Pustaka peta (Leaflet) gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.</div>';
      return;
    }

    const res = App.compute();
    const map = createMap(mapEl, { zoomControl: true });
    const state = { me: null, layer: null, markers: {}, cats: { tinggi: true, sedang: true, rendah: true }, jenis: '' };

    legendControl('bottomleft').addTo(map);
    buttonControl({
      title: 'Reset view', html: App.icon('reset', 18),
      onClick: function () { fitTo(map, state.layer.group, state.shown); }
    }).addTo(map);
    buttonControl({
      title: 'Lokasi saya', html: App.icon('locate', 18),
      onClick: function () { locateMe(map, state); }
    }).addTo(map);

    // Pilihan filter jenis
    const jenisSel = App.$('#f-jenis');
    jenisSel.innerHTML = '<option value="">Semua jenis</option>' +
      Data.JENIS.map(function (j) { return '<option>' + App.esc(j) + '</option>'; }).join('');

    function draw(refit) {
      if (state.layer) map.removeLayer(state.layer.group);
      const rows = res.alt.filter(function (r) {
        return state.cats[r.kategori] && (!state.jenis || r.item.jenis === state.jenis);
      });
      state.shown = rows.length;
      state.layer = addMarkers(map, rows);
      state.markers = state.layer.markers;
      App.$('#count-line').textContent =
        'Menampilkan ' + rows.length + ' dari ' + res.alt.length + ' lokasi';
      if (refit) fitTo(map, state.layer.group, rows.length);
    }

    App.$$('.chip-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const k = btn.getAttribute('data-cat');
        state.cats[k] = !state.cats[k];
        btn.setAttribute('aria-pressed', state.cats[k] ? 'true' : 'false');
        draw(true);
      });
    });
    jenisSel.addEventListener('change', function () { state.jenis = jenisSel.value; draw(true); });
    App.$('#btn-reset-filter').addEventListener('click', function () {
      state.cats = { tinggi: true, sedang: true, rendah: true };
      state.jenis = ''; jenisSel.value = '';
      App.$$('.chip-toggle').forEach(function (b) { b.setAttribute('aria-pressed', 'true'); });
      draw(true);
    });

    draw(true);

    // Fokus ke satu lokasi bila dibuka dari halaman detail (?id=INF-001)
    const focusId = App.param('id');
    if (focusId) {
      const id = focusId;
      const mk = state.markers[id];
      if (mk) { map.setView(mk.getLatLng(), 17); mk.openPopup(); }
    }
    setTimeout(function () { map.invalidateSize(); }, 200);
  }

  root.GIS = {
    createMap: createMap, addBoundary: addBoundary, markerIcon: markerIcon, popupHtml: popupHtml,
    addMarkers: addMarkers, fitTo: fitTo, legendControl: legendControl, buttonControl: buttonControl,
    locateMe: locateMe, leafletReady: leafletReady, initPage: initPage
  };

  if (App.isSpa() || (document.body && document.body.getAttribute('data-page') === 'gis')) {
    App.onPage('gis', initPage);
  }
})(window);
