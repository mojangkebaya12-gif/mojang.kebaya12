/* =============================================================
   MOJANG.KEBAYA — KATALOG, DETAIL & WHATSAPP
   Data produk ada di data.js; file ini tidak perlu diubah.
   Dipakai di index.html (beranda), katalog.html (katalog + detail), halaman
   kebaya/ & panduan/, dan verifikasi.html (verifikasi lokasi sewa luar kota).
   Setiap bagian hanya berjalan jika elemennya ada di halaman.
   ============================================================= */
(function () {
'use strict';

const { KONTAK, SERIES, FAMILIES, ITEMS, ULASAN = [], FORM_BOOKING } = window.MOJANG_DATA;
const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const waLink = msg => `https://wa.me/${KONTAK.wa}?text=${encodeURIComponent(msg)}`;
const hideBroken = img => { img.onerror = () => img.closest('[data-photo]')?.remove(); };
const minPrice = Math.min(...ITEMS.map(i => i.price));
const rb = p => `${p}rb`;
const scrollToEl = el => (window.MOJANG_SCROLL ? window.MOJANG_SCROLL(el) : el.scrollIntoView({ behavior: 'smooth' }));

const grid = $('#grid');     // ada di katalog.html
const sheet = $('#sheet');   // ada di katalog.html
// halaman di subfolder (kebaya/…, 404) memberi tahu letak akar situs lewat <html data-root="../">
const ROOT = document.documentElement.dataset.root || '';
const KATALOG = ROOT + 'katalog.html';
const pageUrl = key => new URL(`${ROOT}kebaya/${key}.html`, location.href).href;   // halaman khusus tiap kebaya

/* ── Statistik: catat klik penting (Vercel Analytics / Google Analytics bila terpasang) ── */
function track(name, data) {
  try {
    if (window.va) window.va('event', { name, data });
    if (window.gtag) window.gtag('event', name, data);
  } catch (e) { /* statistik tidak boleh mengganggu halaman */ }
}
const baseTitle = document.title;

const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
const todayISO = today.toISOString().slice(0, 10);
const fmtDate = v => v ? new Date(v + 'T00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '...';

/* ── Lokasi HP penyewa luar kota (verifikasi.html, booking "Kirim ke luar kota" di katalog,
      cek ongkir di beranda) ──
   Lokasi dideteksi otomatis sekali saat penyewa mulai mengisi form, dan hanya jika penyewa
   mengizinkan di browser. Tidak disimpan di website: hanya ikut di pesan WhatsApp. */
const LOKASI_MAKS_UMUR = 15 * 60 * 1000;   // lokasi lebih lama dari 15 menit diambil ulang
const LOKASI_KURANG = 500;                // akurasi di atas ±500 m dianggap kurang tepat (GPS mati)
const mapsUrl = p => `https://www.google.com/maps/search/?api=1&query=${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
const jarak = m => m < 1000 ? `±${Math.round(m)} m` : `±${(m / 1000).toFixed(1).replace('.', ',')} km`;
const jam = t => new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
const LOKASI_GAGAL = {   // [pesan untuk penyewa, alasan singkat untuk pesan WhatsApp]
  0: ['Browser ini tidak bisa membagikan lokasi. Buka link ini di Chrome atau Safari.', 'browser tidak mendukung'],
  1: ['Izin lokasi ditolak. Buka pengaturan browser → Izin situs → Lokasi → Izinkan untuk situs ini, lalu coba lagi.', 'izin ditolak'],
  2: ['Lokasi tidak terbaca. Nyalakan GPS / Lokasi di HP, lalu coba lagi.', 'GPS mati / tidak terbaca'],
  3: ['Terlalu lama mencari lokasi. Pastikan GPS menyala (lebih cepat di dekat jendela), lalu coba lagi.', 'terlalu lama'],
};
function ambilLokasi(ok, fail) {
  if (!('geolocation' in navigator) || !window.isSecureContext) { fail(0); return; }
  navigator.geolocation.getCurrentPosition(
    p => ok({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, time: Date.now() }),
    e => fail(LOKASI_GAGAL[e.code] ? e.code : 2),
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
}
/* Deteksi lokasi untuk satu form. Status (dan tombol "Coba lagi" bila gagal) tampil di statusEl.
   L.otomatis(form): mulai mendeteksi begitu penyewa pertama kali menyentuh/mengisi form.
   L.segar(): lokasi ada dan belum lebih dari 15 menit. */
function lokasiForm(statusEl, teks = {}) {
  const L = { pos: null, gagal: null, mencari: false };
  const ulang = label => ` <button type="button" class="ulink" data-lokasi>${label}</button>`;
  L.set = (html, cls = '') => { statusEl.innerHTML = html; statusEl.className = 'vf-status' + (cls ? ' ' + cls : ''); };
  L.segar = () => !!L.pos && Date.now() - L.pos.time <= LOKASI_MAKS_UMUR;
  L.cari = () => {
    if (L.mencari) return;
    L.mencari = true; L.pos = null; L.gagal = null;
    L.set('Mendeteksi lokasi… Pilih <b>Izinkan</b> jika browser meminta izin lokasi.');
    ambilLokasi(p => {
      L.mencari = false; L.pos = p;
      if (p.acc > LOKASI_KURANG) L.set(`Lokasi kurang tepat (${jarak(p.acc)}). Nyalakan GPS di HP, lalu${ulang('deteksi ulang')}`, 'warn');
      else L.set(`✓ Lokasi terdeteksi (${jarak(p.acc)}) · <a href="${mapsUrl(p)}" target="_blank" rel="noopener">lihat di peta</a>${teks.ok ? `<br>${teks.ok}` : ''}`, 'ok');
      teks.selesai?.();
    }, code => {
      L.mencari = false; L.gagal = code;
      if (teks.diamGagal) L.set('');   // tanpa pesan ke penyewa; alasannya tetap ikut tercatat
      else L.set(`${LOKASI_GAGAL[code][0]}${ulang('Coba lagi')}${teks.gagal ? `<br>${teks.gagal}` : ''}`, 'warn');
      teks.selesai?.();
    });
  };
  L.otomatis = form => {
    const mulai = () => { if (!L.pos && !L.mencari && L.gagal === null) L.cari(); };
    ['focusin', 'pointerdown', 'input'].forEach(ev => form.addEventListener(ev, mulai, { once: true }));
  };
  statusEl.addEventListener('click', e => { if (e.target.closest('[data-lokasi]')) L.cari(); });
  return L;
}

/* ── Kartu produk: foto asli kebaya, berganti ke foto customer saat disentuh ── */
function cardHTML(i, eager) {
  const sibs = ITEMS.filter(x => x.s === i.s);
  const alt = i.cust[0] || (i.photos[1] ? i.photos[1].replace('image/kebaya/', 'image/kebaya/thumb/') : '');
  return `<li class="card">
    <button class="card-btn" type="button" data-key="${i.key}" aria-label="Lihat detail ${esc(i.name)}, ${i.priceTxt}">
      <span class="card-img">
        <img class="main" src="${i.thumb}" alt="Kebaya ${esc(i.name)}" ${eager ? '' : 'loading="lazy"'} decoding="async">
        ${alt ? `<img class="alt" src="${alt}" alt="" loading="lazy" decoding="async">` : ''}
        ${i.isNew ? '<span class="card-flag">Baru</span>' : i.price === minPrice ? '<span class="card-flag deal">Harga terbaik</span>' : ''}
      </span>
      <span class="card-row"><span class="card-name">${esc(i.name)}</span><span class="card-price">${i.priceTxt}</span></span>
      <span class="card-row sub"><span>${i.ld ? esc(i.ld) : 'Tanya ukuran LD'}</span><span class="card-dots">${sibs.map(x => `<i class="${x.key === i.key ? 'on' : ''}" style="background:${x.hex}"></i>`).join('')}</span></span>
      <span class="card-mat">Full payet · sewa 3 hari</span>
    </button>
  </li>`;
}

/* ── State filter (ikut tersimpan di URL supaya bisa dibagikan) ─
   Tetap mendukung link lama: ?series=aruni  ?warna=nude,pink  ?baru=1 */
const q = new URLSearchParams(location.search);
const state = {
  series: SERIES[q.get('series')] ? q.get('series') : '',
  fam: (q.get('warna') || '').split(',').filter(f => FAMILIES[f]),
  baru: q.get('baru') === '1',
  sort: ['new', 'low', 'high'].includes(q.get('urut')) ? q.get('urut') : 'new',
};

function syncUrl(extra) {
  const p = new URLSearchParams();
  if (state.series) p.set('series', state.series);
  if (state.fam.length) p.set('warna', state.fam.join(','));
  if (state.baru) p.set('baru', '1');
  if (state.sort !== 'new') p.set('urut', state.sort);
  if (extra) p.set('k', extra);
  const s = p.toString();
  return location.pathname + (s ? '?' + s : '') + location.hash;
}

/* ── Filter katalog ── */
function renderFilters() {
  const count = s => ITEMS.filter(i => !s || i.s === s).length;
  const chips = [['', 'Semua'], ['baru', 'Baru'], ...Object.entries(SERIES).map(([k, v]) => [k, (v.unggulan ? '✦ ' : '') + v.name])];
  $('#fSeries').innerHTML = chips.map(([k, label]) => {
    const on = k === 'baru' ? state.baru : (!state.baru && state.series === k);
    const n = k === 'baru' ? ITEMS.filter(i => i.isNew).length : count(k);
    return `<button class="chip" type="button" data-series="${k}" aria-pressed="${on}">${label}<small>${n}</small></button>`;
  }).join('');

  const used = new Set(ITEMS.map(i => i.fam));
  $('#fColor').innerHTML = Object.entries(FAMILIES).filter(([k]) => used.has(k)).map(([k, [label, hex]]) =>
    `<button class="sw" type="button" data-fam="${k}" aria-pressed="${state.fam.includes(k)}"><i style="background:${hex}"></i>${label}</button>`
  ).join('');
  $('#fSort').value = state.sort;
}

function filtered() {
  const list = ITEMS.filter(i =>
    (!state.baru || i.isNew) &&
    (!state.series || i.s === state.series) &&
    (!state.fam.length || state.fam.includes(i.fam)));
  const top = i => SERIES[i.s].unggulan ? 1 : 0;   // series unggulan (Geulis) selalu paling awal
  const by = { new: (a, b) => (top(b) - top(a)) || (b.isNew - a.isNew) || a.order - b.order,
               low: (a, b) => a.price - b.price || a.order - b.order,
               high: (a, b) => b.price - a.price || a.order - b.order };
  return list.sort(by[state.sort]);
}

function renderGrid() {
  const list = filtered();
  grid.innerHTML = list.map((i, n) => cardHTML(i, n < 4)).join('');

  const label = state.baru ? 'kebaya baru'
    : state.series ? `kebaya series ${SERIES[state.series].name}` : 'kebaya';
  $('#result').innerHTML = `Menampilkan <b>${list.length}</b> ${label}` +
    (state.fam.length ? ` · warna ${state.fam.map(f => FAMILIES[f][0].toLowerCase()).join(', ')}` : '');
  $('#empty').hidden = list.length > 0;
}

function update() {
  if (!grid) return;
  renderFilters();
  renderGrid();
  history.replaceState(history.state, '', syncUrl(history.state?.k));
}

if (grid) {
  $('#fSeries').addEventListener('click', e => {
    const b = e.target.closest('[data-series]'); if (!b) return;
    const k = b.dataset.series;
    state.baru = k === 'baru';
    state.series = k === 'baru' ? '' : k;
    update();
  });
  $('#fColor').addEventListener('click', e => {
    const b = e.target.closest('[data-fam]'); if (!b) return;
    const f = b.dataset.fam;
    state.fam = state.fam.includes(f) ? state.fam.filter(x => x !== f) : [...state.fam, f];
    update();
  });
  $('#fSort').addEventListener('change', e => { state.sort = e.target.value; update(); });
  $('#reset').addEventListener('click', () => { Object.assign(state, { series: '', fam: [], baru: false }); update(); });
}

/* ── Detail kebaya (katalog.html) ── */
let current = null;

function openDetail(key, push = true) {
  if (!sheet) return;
  const i = ITEMS.find(x => x.key === key); if (!i) return;
  current = i;
  const ser = SERIES[i.s];

  $('#dSeries').textContent = `Series ${i.series}`;
  $('#dName').textContent = i.color;
  $('#dPrice').textContent = i.priceTxt;
  $('#dLd').textContent = i.ld ? `Ukuran ${i.ld} · bisa resize gratis` : 'Tanya ukuran LD via WhatsApp · bisa resize gratis';
  $('#dDesc').textContent = ser.desc;

  const photos = [...i.photos, ...i.cust];
  $('#dSlides').innerHTML = photos.map((src, n) =>
    `<img data-photo src="${src}" alt="${esc(i.name)} foto ${n + 1}" ${n ? 'loading="lazy"' : ''} decoding="async">`).join('');
  $('#dThumbs').innerHTML = photos.length > 1 ? photos.map((src, n) =>
    `<button data-photo type="button" data-n="${n}" aria-label="Foto ${n + 1}" aria-current="${n === 0}"><img src="${src.replace('image/kebaya/', 'image/kebaya/thumb/')}" alt="" loading="lazy"></button>`).join('') : '';
  $('#dThumbs').hidden = photos.length < 2;
  sheet.querySelectorAll('[data-photo] img, img[data-photo]').forEach(hideBroken);
  $('#dSlides').scrollLeft = 0;

  const sibs = ITEMS.filter(x => x.s === i.s);
  $('#dColorsWrap').hidden = sibs.length < 2;
  $('#dColors').innerHTML = sibs.map(x =>
    `<button class="sw" type="button" data-key="${x.key}" aria-current="${x.key === i.key}"><i style="background:${x.hex}"></i>${esc(x.color)}</button>`).join('');

  $('#dPkg').innerHTML = [i.ld, ...i.pkg].filter(Boolean).map(p => `<li>${esc(p)}</li>`).join('');

  $('#dCustWrap').hidden = !i.cust.length;
  $('#dCust').innerHTML = i.cust.map((src, n) =>
    `<img data-photo src="${src}" alt="Customer memakai ${esc(i.name)}" loading="lazy" data-n="${i.photos.length + n}">`).join('');

  $('#dCal').hidden = true;
  $('#dCalFrame').removeAttribute('src');
  $('#dCalBtn').textContent = i.cal ? 'Cek ketersediaan' : 'Tanya ketersediaan';

  if (!sheet.open) {
    sheet.showModal();
    document.body.classList.add('lock');
  }
  sheet.scrollTop = 0;
  document.title = `${i.name} – Sewa Kebaya Mojang.Kebaya`;
  if (push) history.pushState({ k: i.key }, '', syncUrl(i.key));
  else history.replaceState({ k: i.key }, '', syncUrl(i.key));
}

function closeDetail() {
  if (!sheet || !sheet.open) return;
  sheet.close();
}

if (sheet) {
  sheet.addEventListener('close', () => {
    document.body.classList.remove('lock');
    document.title = baseTitle;
    current = null;
    if (history.state?.k) history.back();
    // cadangan: jika browser melewati langkah "back", bersihkan ?k= dari URL
    setTimeout(() => {
      if (!sheet.open && new URLSearchParams(location.search).has('k')) history.replaceState(null, '', syncUrl());
    }, 400);
  });
  window.addEventListener('popstate', e => {
    if (e.state?.k) openDetail(e.state.k, false);
    else if (sheet.open) { history.replaceState(null, '', syncUrl()); sheet.close(); }
  });
  $('#dClose').addEventListener('click', closeDetail);
  sheet.addEventListener('click', e => { if (e.target === sheet) closeDetail(); });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-key]');
    if (b) { openDetail(b.dataset.key, !sheet.open); }
  });

  /* Galeri foto: thumbnail ↔ geser */
  const slides = $('#dSlides');
  const goTo = n => slides.scrollTo({ left: n * slides.clientWidth, behavior: 'smooth' });
  $('#dThumbs').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) goTo(+b.dataset.n); });
  $('#dCust').addEventListener('click', e => {
    const img = e.target.closest('img[data-n]'); if (!img) return;
    const all = [...slides.querySelectorAll('img')];
    const idx = all.findIndex(x => x.getAttribute('src') === img.getAttribute('src'));
    sheet.scrollTo({ top: 0, behavior: 'smooth' });
    if (idx > -1) goTo(idx);
  });
  slides.addEventListener('scroll', () => {
    const n = Math.round(slides.scrollLeft / slides.clientWidth);
    $('#dThumbs').querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', k === n));
  }, { passive: true });
  slides.addEventListener('keydown', e => {
    const n = Math.round(slides.scrollLeft / slides.clientWidth);
    if (e.key === 'ArrowRight') goTo(n + 1);
    if (e.key === 'ArrowLeft') goTo(Math.max(0, n - 1));
  });

  /* Booking & kalender */
  const dDate = $('#dDate');
  dDate.min = todayISO;

  /* Pengambilan: begitu "Kirim ke luar kota" dipilih, lokasi HP terdeteksi otomatis,
     lalu link Google Maps-nya ikut di pesan booking WhatsApp. */
  const dBook = $('#dBook'), dLoc = $('#dLoc'), dCity = $('#dCity');
  const kirimLuarKota = () => dBook.querySelector('[name="dShip"]:checked')?.value === 'kirim';
  // jika ditolak/gagal: tidak ada pesan, booking tetap terkirim dengan baris "Lokasi HP: belum dibagikan (…)"
  const dL = lokasiForm($('#dLocStatus'), { ok: 'Lokasi ikut terkirim bersama booking.', diamGagal: true });
  dBook.addEventListener('change', e => {
    if (e.target.name !== 'dShip') return;
    const kirim = kirimLuarKota();
    dLoc.hidden = !kirim;
    dCity.disabled = !kirim;
    if (kirim && !dL.pos && dL.gagal === null) dL.cari();
  });

  dBook.addEventListener('submit', e => {
    e.preventDefault();
    if (!current) return;
    const kirim = kirimLuarKota();
    if (kirim && (dL.mencari || (dL.pos && !dL.segar()))) {   // masih mendeteksi, atau lokasi sudah lama: deteksi ulang
      dL.cari();
      dL.set('Lokasi sedang dideteksi… Tekan “Booking via WhatsApp” lagi setelah lokasi terdeteksi.', 'warn');
      return;
    }
    const dPos = dL.pos;
    const lokasi = dPos
      ? `Lokasi HP: ${mapsUrl(dPos)}\nAkurasi lokasi: ${jarak(dPos.acc)}, ${jam(dPos.time)}\n`
      : `Lokasi HP: belum dibagikan (${LOKASI_GAGAL[dL.gagal ?? 2][1]})\n`;
    const msg = `Halo Mojang.Kebaya, saya mau booking kebaya:\n` +
      `Kebaya: ${current.name} (${current.priceTxt})\n` +
      `Tanggal acara: ${fmtDate(dDate.value)}\n` +
      `Acara: ${$('#dEvent').value}\n` +
      (kirim ? `Kirim ke: ${dCity.value.trim()}\n${lokasi}` : `Pengambilan: ambil di Sukabumi\n`) +
      `Nama: ...\n` +
      (kirim ? `Alamat lengkap: ...\n` : '') +
      (kirim && dPos ? `\nSaya setuju lokasi ini dipakai Mojang.Kebaya untuk keamanan sewa.\n` : '') +
      `\nLink: ${pageUrl(current.key)}`;
    track('Booking WhatsApp', { kebaya: current.name, dari: 'detail', pengambilan: kirim ? (dPos ? 'luar kota + lokasi' : 'luar kota tanpa lokasi') : 'Sukabumi' });
    window.open(waLink(msg), '_blank', 'noopener');
  });

  $('#dCalBtn').addEventListener('click', () => {
    if (!current) return;
    if (!current.cal) {
      window.open(waLink(`Halo Mojang.Kebaya, apakah ${current.name} tersedia tanggal ${fmtDate(dDate.value)}?`), '_blank', 'noopener');
      return;
    }
    const box = $('#dCal');
    box.hidden = !box.hidden;
    if (!box.hidden) {
      $('#dCalFrame').src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(current.cal)}&ctz=Asia%2FJakarta&mode=MONTH&showTitle=0&showNav=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0`;
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

/* ── Series: daftar di menu & footer (link ke katalog.html?series=…) ── */
const seriesInfo = Object.entries(SERIES).map(([k, ser], n) => {
  const list = ITEMS.filter(i => i.s === k);
  const cover = list.find(i => i.isNew) || list[0];
  return { k, ser, n, list, cover, min: Math.min(...list.map(i => i.price)) };
}).filter(x => x.list.length);

if ($('#footSeries')) $('#footSeries').innerHTML = seriesInfo.map(({ k, ser }) =>
  `<li><a href="${KATALOG}?series=${k}" data-go-series="${k}">${esc(ser.name)}</a></li>`).join('');

// di katalog.html: saring di tempat tanpa memuat ulang; di beranda: pindah ke katalog.html
document.addEventListener('click', e => {
  const b = e.target.closest('[data-go-series]'); if (!b || !grid) return;
  e.preventDefault();
  Object.assign(state, { series: b.dataset.goSeries, fam: [], baru: false });
  update();
  scrollToEl($('#katalog'));
});

/* ── Menu garis tiga ── */
const drawer = $('#drawer');
const menuBtn = $('#menuBtn');
$('#drawerSeries').innerHTML = seriesInfo.map(({ k, ser, list, min }) => `
  <li><a href="${KATALOG}?series=${k}" data-go-series="${k}" data-close>
    <span class="ds-name">${ser.unggulan ? '✦ ' : ''}${esc(ser.name)}</span>
    <span class="ds-dots">${list.map(i => `<i style="background:${i.hex}"></i>`).join('')}</span>
    <small>${list.length} warna · mulai ${rb(min)}</small>
  </a></li>`).join('');

function setMenu(open) {
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', !open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  document.body.classList.toggle('lock', open || !!sheet?.open);
  if (open) drawer.querySelector('.drawer-panel').focus();
}
menuBtn.addEventListener('click', () => setMenu(!drawer.classList.contains('open')));
drawer.addEventListener('click', e => { if (e.target.closest('[data-close]')) setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) setMenu(false); });

/* ── Tautan yang membuka bagian info tertentu ── */
document.addEventListener('click', e => {
  const a = e.target.closest('[data-open]'); if (!a) return;
  const d = document.getElementById('acc-' + a.dataset.open);
  if (d) { d.open = true; e.preventDefault(); setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }
});
// datang dari halaman lain dengan #acc-… atau #syarat: buka bagian itu
const hashTarget = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
if (hashTarget && hashTarget.tagName === 'DETAILS') {
  hashTarget.open = true;
  setTimeout(() => hashTarget.scrollIntoView({ block: 'start', behavior: 'instant' }), 60);
}

/* ── Booking cepat (beranda) ── */
if ($('#quickForm')) $('#quickForm').addEventListener('submit', e => {
  e.preventDefault();
  const t = $('#quickText').value.trim();
  track('Booking WhatsApp', { dari: 'booking cepat' });
  window.open(waLink(`Halo Mojang.Kebaya, saya mau booking kebaya.${t ? `\n${t}` : ''}`), '_blank', 'noopener');
});

/* ── Cek ongkir luar kota → WhatsApp (beranda) ──
   Lokasi HP terdeteksi otomatis saat penyewa mulai mengisi form (tidak wajib untuk tanya ongkir). */
if ($('#shipForm')) {
  const ship = $('#shipForm');
  $('#sKebaya').innerHTML += ITEMS.map(i => `<option>${esc(i.name)}</option>`).join('');
  $('#sDate').min = todayISO;
  const sL = lokasiForm($('#sLocStatus'), { ok: 'Lokasi ikut terkirim untuk menghitung ongkir.', gagal: 'Tetap bisa tanya ongkir tanpa lokasi.' });
  sL.otomatis(ship);
  ship.addEventListener('submit', e => {
    e.preventDefault();
    if (sL.mencari || (sL.pos && !sL.segar())) {
      sL.cari();
      sL.set('Lokasi sedang dideteksi… Tekan “Tanya ongkir via WhatsApp” lagi setelah lokasi terdeteksi.', 'warn');
      return;
    }
    const msg = `Halo Mojang.Kebaya, saya mau sewa kebaya untuk dikirim ke luar kota.\n` +
      `Kota tujuan: ${$('#sCity').value.trim()}\n` +
      (sL.pos ? `Lokasi HP: ${mapsUrl(sL.pos)}\nAkurasi lokasi: ${jarak(sL.pos.acc)}, ${jam(sL.pos.time)}\n` : '') +
      `Tanggal acara: ${fmtDate($('#sDate').value)}\n` +
      `Kebaya: ${$('#sKebaya').value || 'belum memilih'}\n` +
      `Mohon info estimasi ongkirnya. Terima kasih.`;
    track('Tanya ongkir WhatsApp', { kota: $('#sCity').value.trim(), lokasi: sL.pos ? 'ada' : 'tidak' });
    window.open(waLink(msg), '_blank', 'noopener');
  });
}

/* ── Form booking (booking.html) → Google Form "Booking Mojang.kebaya" ──
   Lokasi HP terdeteksi otomatis saat penyewa mulai mengisi nama/nomor WA, dicatat ke Google Form
   "Log Lokasi Booking" (data.js → FORM_BOOKING.log), lalu form booking terbuka dengan nama & nomor WA
   (dan kebaya/tanggal dari link, mis. booking.html?k=aruni-navy&t=2026-11-21) sudah terisi.
   Jika lokasi gagal/ditolak, tidak ada pesan untuk penyewa: booking tetap lanjut dan alasannya
   ikut tercatat di log. */
if ($('#bookForm') && FORM_BOOKING) {
  const form = $('#bookForm'), err = $('#bErr');
  const L = lokasiForm($('#bStatus'), {
    ok: 'Lokasi tercatat untuk keamanan sewa.',
    diamGagal: true,   // jika ditolak/gagal: tidak ada pesan, booking lanjut, alasan tercatat di log
    selesai: () => { if (err.dataset.tunggu) { err.textContent = ''; delete err.dataset.tunggu; } },
  });
  L.otomatis(form);
  const q = new URLSearchParams(location.search);
  const item = ITEMS.find(i => i.key === q.get('k'));
  const tgl = /^\d{4}-\d{2}-\d{2}$/.test(q.get('t') || '') ? q.get('t') : '';
  if (item || tgl) $('#bPilihan').textContent = [item && `Kebaya: ${item.name}`, tgl && `Tanggal acara: ${fmtDate(tgl)}`].filter(Boolean).join(' · ');

  // kirim ke Google Form tanpa membuka halamannya (tetap terkirim walau halaman langsung berpindah)
  const kirimLog = data => {
    const body = new URLSearchParams(data);
    try { if (navigator.sendBeacon && navigator.sendBeacon(FORM_BOOKING.log.url, body)) return; } catch (e) { /* lanjut ke fetch */ }
    fetch(FORM_BOOKING.log.url, { method: 'POST', mode: 'no-cors', body, keepalive: true }).catch(() => {});
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    err.textContent = ''; delete err.dataset.tunggu;
    const digit = $('#bWa').value.replace(/\D/g, '').length;
    $('#bWa').setCustomValidity(digit >= 9 && digit <= 15 ? '' : 'Nomor WhatsApp tidak valid');
    if (!form.checkValidity()) {
      const bad = form.querySelector('input:invalid');
      err.textContent = bad.id === 'bAgree' ? 'Centang persetujuan dulu.' : bad.id === 'bWa' ? 'Isi nomor WhatsApp yang benar, contoh 081234567890.' : 'Isi nama lengkap sesuai KTP.';
      bad.focus();
      return;
    }
    // lokasi masih dideteksi, belum pernah dideteksi, atau sudah lebih dari 15 menit: tunggu dulu
    if (L.mencari || (!L.segar() && L.gagal === null)) {
      L.cari();
      err.textContent = 'Lokasi sedang dideteksi. Tekan “Lanjut ke form booking” lagi setelah lokasinya muncul.';
      err.dataset.tunggu = '1';
      return;
    }
    const nama = $('#bName').value.trim(), wa = $('#bWa').value.trim();
    const p = L.pos;
    const g = FORM_BOOKING.log;
    kirimLog({
      [g.nama]: nama,
      [g.wa]: wa,
      [g.lokasi]: p ? mapsUrl(p) : `belum dibagikan (${LOKASI_GAGAL[L.gagal ?? 2][1]})`,
      [g.akurasi]: p ? `${jarak(p.acc)}, ${jam(p.time)}` : '-',
      [g.ket]: ['Halaman booking', item && `Kebaya: ${item.name}`, tgl && `Tanggal acara: ${tgl}`].filter(Boolean).join(' · '),
    });
    track('Lanjut form booking', { lokasi: p ? 'ada' : 'tidak' });
    const f = FORM_BOOKING.isi;
    const isi = new URLSearchParams({ usp: 'pp_url', [f.nama]: nama, [f.wa]: wa });
    if (item) isi.set(f.kebaya, item.name);
    if (tgl) isi.set(f.tanggal, tgl);
    setTimeout(() => { location.href = `${FORM_BOOKING.url}?${isi}`; }, 150);   // beri waktu log terkirim
  });
}

/* ── Verifikasi lokasi sewa luar kota → WhatsApp (verifikasi.html) ──
   Lokasi terdeteksi otomatis sekali saat penyewa mulai mengisi form (setelah diizinkan di browser).
   Tidak disimpan di website. Link dari admin bisa mengisi otomatis:
   verifikasi.html?langkah=2&k=aruni-navy&t=2026-11-21 */
if ($('#locForm')) {
  const form = $('#locForm'), err = $('#vErr');
  const NAMA_LANGKAH = { 1: 'Booking (verifikasi alamat)', 2: 'Paket diterima', 3: 'Paket dikirim kembali' };
  const L = lokasiForm($('#vStatus'), { selesai: () => { if (err.dataset.tunggu) { err.textContent = ''; delete err.dataset.tunggu; } } });
  L.otomatis(form);

  const langkah = () => form.querySelector('[name="langkah"]:checked').value;
  // kolom khusus langkah tertentu (alamat = 1, resi = 3): disembunyikan & dinonaktifkan di langkah lain
  const syncLangkah = () => form.querySelectorAll('[data-langkah]').forEach(box => {
    const on = box.dataset.langkah === langkah();
    box.hidden = !on;
    box.querySelectorAll('input, textarea').forEach(f => { f.disabled = !on; });
  });

  // isi otomatis dari link admin
  const q = new URLSearchParams(location.search);
  const r = form.querySelector(`[name="langkah"][value="${q.get('langkah')}"]`);
  if (r) r.checked = true;
  if (ITEMS.some(i => i.key === q.get('k'))) $('#vKebaya').value = q.get('k');
  if (/^\d{4}-\d{2}-\d{2}$/.test(q.get('t') || '')) $('#vDate').value = q.get('t');
  syncLangkah();
  form.addEventListener('change', e => { if (e.target.name === 'langkah') { syncLangkah(); err.textContent = ''; } });

  form.addEventListener('submit', e => {
    e.preventDefault();
    err.textContent = ''; delete err.dataset.tunggu;
    if (!form.checkValidity()) {
      const bad = form.querySelector('input:invalid, select:invalid, textarea:invalid');
      err.textContent = bad.id === 'vAgree' ? 'Centang persetujuan lokasi dulu.' : 'Lengkapi kolom yang masih kosong.';
      bad.focus();
      return;
    }
    if (!L.segar()) {   // belum terdeteksi, gagal, atau sudah lebih dari 15 menit: deteksi (ulang)
      L.cari();
      err.textContent = L.mencari ? 'Lokasi sedang dideteksi. Tekan “Kirim ke WhatsApp” lagi setelah tanda ✓ muncul.' : 'Lokasi belum terdeteksi. Ikuti petunjuk di atas, lalu coba lagi.';
      if (L.mencari) err.dataset.tunggu = '1';   // dihapus otomatis setelah deteksi selesai
      return;
    }
    const pos = L.pos;
    const n = langkah();
    const kebaya = ITEMS.find(i => i.key === $('#vKebaya').value);
    const msg = `Halo Mojang.Kebaya, ini verifikasi lokasi sewa luar kota.\n` +
      `Langkah: ${n}. ${NAMA_LANGKAH[n]}\n` +
      `Nama: ${$('#vName').value.trim()}\n` +
      `Kebaya: ${kebaya.name}\n` +
      `Tanggal acara: ${fmtDate($('#vDate').value)}\n` +
      (n === '1' ? `Alamat kirim: ${$('#vAddr').value.trim().replace(/\s*\n\s*/g, ', ')}\n` : '') +
      (n === '3' ? `Kurir & resi: ${$('#vResi').value.trim()}\n` : '') +
      `Lokasi HP: ${mapsUrl(pos)}\n` +
      `Akurasi: ${jarak(pos.acc)}, diambil ${jam(pos.time)}\n\n` +
      `Saya setuju lokasi ini dipakai Mojang.Kebaya untuk keamanan sewa.` +
      (n === '1' ? `\nFoto KTP asli saya kirim di chat ini.` : '');
    track('Verifikasi lokasi WhatsApp', { langkah: n });
    window.open(waLink(msg), '_blank', 'noopener');
  });
}

/* ── Cek sewa luar kota, khusus admin (cek-luar-kota.html) ──
   1) link verifikasi + pesan WA untuk penyewa, 2) membaca pesan WA penyewa yang ditempel
   (lokasi, akurasi, jarak antarlangkah, ketepatan waktu kirim kembali, kecocokan data),
   3) daftar cek sebelum kirim. Semua dihitung di browser ini; isian hanya disimpan di
   sessionStorage tab ini (hilang saat tab ditutup) dan tidak dikirim ke mana pun. */
if ($('#ckForm')) {
  const JAUH_KM = 25;                         // jarak antarlangkah di atas ini perlu ditanyakan
  const SIMPAN = 'mojang-cek-luar-kota';
  const NAMA = { 1: 'Booking', 2: 'Paket diterima', 3: 'Kirim kembali' };
  const cKebaya = $('#cKebaya'), cDate = $('#cDate'), cWa = $('#cWa');
  const links = $('#ckLinks'), hint = $('#ckHint'), out = $('#ckOut'), go = $('#ckGo');
  const boxes = [...document.querySelectorAll('#ckMsgs textarea')];
  const fields = [...document.querySelectorAll('[data-simpan]')];
  const checks = [...document.querySelectorAll('[data-cek]')];
  const kirimChecks = [...document.querySelector('.ck-todo').querySelectorAll('[data-cek]')];

  /* tanggal & jarak */
  const WIB = 7 * 3600e3;
  const BULAN = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
  const bulanKe = s => { const k = s.slice(0, 3).toLowerCase(); return k === 'agt' ? 7 : BULAN.indexOf(k); };
  const isoDari = (d, m, y) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const tambahHari = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const isoWIB = t => new Date(t + WIB).toISOString().slice(0, 10);
  const labelH = (iso, acara) => { const n = Math.round((Date.parse(iso) - Date.parse(acara)) / 864e5); return n ? `H${n > 0 ? '+' : ''}${n}` : 'H (hari acara)'; };
  const km = (a, b) => {
    const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    return 12742 * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2));
  };
  const fmtKm = k => k < 1 ? `${Math.round(k * 1000)} m` : `${k.toFixed(1).replace('.', ',')} km`;
  const lama = ms => { const j = Math.ceil(ms / 3600e3); return j < 24 ? `±${j} jam` : `±${Math.floor(j / 24)} hari${j % 24 ? ` ${j % 24} jam` : ''}`; };

  /* baca pesan WA dari verifikasi.html atau booking "Kirim ke luar kota" di katalog */
  function bacaPesan(txt) {
    const baris = re => ((txt.match(re) || [])[1] || '').trim();
    const isi = v => (/^(\.{2,}|…|belum memilih)$/i.test(v) ? '' : v);   // "Nama: ..." = belum diisi
    const p = {
      langkah: baris(/^\s*Langkah:\s*(\d)/mi) || (/booking kebaya/i.test(txt) ? '1' : ''),
      nama: isi(baris(/^\s*Nama:\s*(.+)$/mi)),
      kebaya: isi(baris(/^\s*Kebaya:\s*(.+)$/mi).replace(/\s*\(.*\)\s*$/, '')),
      alamat: isi(baris(/^\s*Alamat (?:kirim|lengkap):\s*(.+)$/mi)),
      kota: isi(baris(/^\s*(?:Kirim ke|Kota tujuan):\s*(.+)$/mi)),
      resi: isi(baris(/^\s*Kurir & resi:\s*(.+)$/mi)),
      lokasi: baris(/^\s*Lokasi HP:\s*(.+)$/mi),
      ambilSendiri: /^\s*Pengambilan:\s*ambil di Sukabumi/mi.test(txt),
    };
    const ev = baris(/^\s*Tanggal acara:\s*(.+)$/mi).match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
    if (ev && bulanKe(ev[2]) >= 0) p.acara = isoDari(+ev[1], bulanKe(ev[2]), ev[3]);
    const q = p.lokasi.match(/query=(-?\d{1,2}(?:\.\d+)?)(?:,|%2C)\s*(-?\d{1,3}(?:\.\d+)?)/i);
    if (q) p.pos = { lat: +q[1], lng: +q[2] };
    const ak = baris(/^\s*Akurasi(?: lokasi)?:\s*(.+)$/mi);
    const a = ak.match(/±\s*([\d.,]+)\s*(km|m)\b/i);
    if (a) p.acc = parseFloat(a[1].replace(',', '.')) * (a[2].toLowerCase() === 'km' ? 1000 : 1);
    const w = ak.match(/(\d{1,2})\s+([a-z]{3,})\s+(\d{4}),?\s+(\d{1,2})[.:](\d{2})/i);
    if (w && bulanKe(w[2]) >= 0) p.waktu = Date.UTC(+w[3], bulanKe(w[2]), +w[1], +w[4], +w[5]) - WIB;
    return p;
  }

  /* 1 · link verifikasi + pesan WA untuk penyewa */
  const PESAN = {
    1: (k, t, u) => `Halo Kak, terima kasih sudah booking kebaya ${k} untuk ${t}. Untuk keamanan sewa luar kota, mohon isi verifikasi lokasi lewat link ini (nyalakan GPS lalu pilih Izinkan), kemudian kirim foto KTP asli di chat ini ya:\n${u}`,
    2: (k, t, u) => `Halo Kak, paket kebaya ${k} sudah sampai? Mohon bagikan lokasi saat paket diterima lewat link ini ya:\n${u}`,
    3: (k, t, u) => `Halo Kak, terima kasih sudah memakai kebaya ${k}. Batas kirim kembali hari ini pukul 12.00 WIB, kebaya tidak perlu dicuci. Setelah paket diserahkan ke kurir, mohon bagikan lokasi + nomor resi lewat link ini ya:\n${u}`,
  };
  const KAPAN = {
    1: () => 'Setelah DP masuk, jika pesan booking belum berisi lokasi HP.',
    2: t => `H-1 · ${fmtDate(tambahHari(t, -1))}, saat paket sampai.`,
    3: t => `H+1 · ${fmtDate(tambahHari(t, 1))}, sebelum 12.00 WIB.`,
  };
  const nomorWa = v => { let d = v.replace(/\D/g, ''); if (d.startsWith('0')) d = '62' + d.slice(1); else if (d.startsWith('8')) d = '62' + d; return d.length >= 10 ? d : ''; };
  function buatLink() {
    const it = ITEMS.find(i => i.key === cKebaya.value), t = cDate.value;
    links.hidden = !(it && t);
    hint.hidden = !links.hidden;
    if (links.hidden) return;
    const wa = nomorWa(cWa.value);
    links.innerHTML = ['1', '2', '3'].map(n => {
      const u = new URL(`${ROOT}verifikasi.html?langkah=${n}&k=${it.key}&t=${t}`, location.href).href;
      const msg = PESAN[n](it.name, fmtDate(t), u);
      return `<li><b>Langkah ${n} · ${NAMA[n]}</b>${KAPAN[n](t)}<span class="ck-btns">` +
        `<a class="ulink" href="https://wa.me/${wa}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Kirim lewat WhatsApp${wa ? '' : ' (pilih kontak)'}</a>` +
        `<button class="ulink" type="button" data-salin="${esc(msg)}">Salin pesan</button></span></li>`;
    }).join('');
  }
  const salinLama = t => {
    const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;top:0;opacity:0';
    document.body.append(ta); ta.select(); let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { /* tidak didukung */ }
    ta.remove(); return ok;
  };
  links.addEventListener('click', e => {
    const b = e.target.closest('[data-salin]'); if (!b) return;
    const tanda = ok => { b.textContent = ok ? 'Tersalin ✓' : 'Gagal menyalin'; setTimeout(() => { b.textContent = 'Salin pesan'; }, 2000); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(b.dataset.salin).then(() => tanda(true), () => tanda(salinLama(b.dataset.salin)));
    else tanda(salinLama(b.dataset.salin));
  });

  /* 2 · cek pesan penyewa */
  function cek() {
    const P = {};
    boxes.forEach(b => { if (b.value.trim()) P[b.dataset.step] = bacaPesan(b.value); });
    // data sewa diisi otomatis dari pesan penyewa, selama admin tidak mengisinya sendiri
    const pertama = P[1] || P[2] || P[3];
    const isiOtomatis = (el, v) => { if (el.value && !el.dataset.auto) return; el.value = v || ''; if (v) el.dataset.auto = '1'; else delete el.dataset.auto; };
    isiOtomatis(cKebaya, pertama && ITEMS.find(i => i.name.toLowerCase() === pertama.kebaya.toLowerCase())?.key);
    isiOtomatis(cDate, pertama && pertama.acara);
    buatLink();

    const acara = cDate.value, rows = [];
    const r = (cls, html) => rows.push([cls, html]);
    const jarakDari = (a, b, dari) => { const d = km(a, b); r(d > JAUH_KM ? 'warn' : 'ok', `Jarak dari ${dari}: ${fmtKm(d)}${d > JAUH_KM ? '. Jauh: tanyakan dulu ke penyewa sebelum lanjut.' : ''}`); };
    for (const n of ['1', '2', '3']) {
      const p = P[n]; if (!p) continue;
      rows.push(['step', `Langkah ${n} · ${NAMA[n]}`]);
      if (p.langkah && p.langkah !== n) r('warn', `Ini pesan langkah ${p.langkah}, bukan langkah ${n}. Pindahkan ke kotak yang benar.`);
      if (p.pos) {
        const kurang = p.acc > LOKASI_KURANG;
        const waktu = p.waktu ? `${jam(p.waktu)}${acara ? ` (${labelH(isoWIB(p.waktu), acara)})` : ''}` : 'waktu tidak terbaca';
        r(kurang ? 'warn' : 'ok', `Lokasi: <a href="${mapsUrl(p.pos)}" target="_blank" rel="noopener">buka peta</a> · akurasi ${p.acc != null ? jarak(p.acc) : 'tidak terbaca'} · ${waktu}` +
          (kurang ? '<br>Akurasi rendah: GPS kemungkinan mati. Minta penyewa menyalakan GPS lalu kirim ulang.' : ''));
      } else if (p.ambilSendiri) {
        r('info', 'Penyewa memilih ambil di Sukabumi: verifikasi lokasi tidak perlu.');
      } else {
        r('bad', p.lokasi ? `Lokasi ${esc(p.lokasi)}. Kirim link langkah ${n} ke penyewa.` : 'Tidak ada link lokasi di pesan ini. Pastikan yang ditempel adalah pesan dari halaman verifikasi.');
      }
      if (n === '1' && !p.ambilSendiri) {
        if (p.alamat) r('info', `Alamat kirim: ${esc(p.alamat)}. Buka peta: lokasi harus di kota yang sama.`);
        else r('warn', p.kota ? `Baru kota tujuan (${esc(p.kota)}). Minta alamat lengkap; lokasi di peta harus di kota yang sama.` : 'Alamat kirim belum ada. Minta alamat lengkap.');
        r(p.nama ? 'info' : 'warn', p.nama ? `Nama: <b>${esc(p.nama)}</b>. Cocokkan dengan foto KTP asli.` : 'Nama belum diisi. Minta nama lengkap sesuai KTP + foto KTP asli.');
      }
      if (n === '2' && P[1]?.pos && p.pos) jarakDari(P[1].pos, p.pos, 'lokasi booking (langkah 1)');
      if (n === '3') {
        r(p.resi ? 'info' : 'bad', p.resi ? `Kurir &amp; resi: <b>${esc(p.resi)}</b>. Cek di aplikasi atau situs kurir.` : 'Nomor resi belum ada. Minta foto resi.');
        const asal = P[2]?.pos ? [P[2].pos, 'lokasi paket diterima (langkah 2)'] : P[1]?.pos ? [P[1].pos, 'lokasi booking (langkah 1)'] : null;
        if (asal && p.pos) jarakDari(asal[0], p.pos, asal[1]);
        if (acara && p.waktu) {
          const hari = tambahHari(acara, 1), lewat = p.waktu - Date.parse(`${hari}T12:00:00+07:00`);
          r(lewat > 0 ? 'warn' : 'ok', lewat > 0
            ? `Terlambat ${lama(lewat)} dari batas ${fmtDate(hari)} pukul 12.00 WIB. Denda sesuai lama keterlambatan.`
            : `Dikirim tepat waktu (batas ${fmtDate(hari)} pukul 12.00 WIB).`);
        }
      }
    }
    const isiP = Object.entries(P);
    if (isiP.length) {
      rows.push(['step', 'Kecocokan data']);
      const sama = (label, ambil, acuan) => {
        const nilai = isiP.map(([n, p]) => [`langkah ${n}`, ambil(p)]).filter(([, v]) => v);
        if (acuan) nilai.unshift(['data sewa', acuan]);
        if (nilai.length < 2) return;
        const beda = new Set(nilai.map(([, v]) => v.toLowerCase().replace(/\s+/g, ' '))).size > 1;
        r(beda ? 'warn' : 'ok', beda ? `${label} berbeda: ${nilai.map(([d, v]) => `${esc(v)} (${d})`).join(' · ')}` : `${label} sama: ${esc(nilai[0][1])}`);
      };
      const it = ITEMS.find(i => i.key === cKebaya.value);
      sama('Nama', p => p.nama);
      sama('Kebaya', p => p.kebaya, it && it.name);
      sama('Tanggal acara', p => p.acara && fmtDate(p.acara), acara && fmtDate(acara));
      if (rows[rows.length - 1][0] === 'step') rows.pop();
    }
    const perlu = rows.filter(([c]) => c === 'warn' || c === 'bad').length;
    out.innerHTML = !rows.length ? '' :
      `<p class="ck-sum ${perlu ? 'warn' : 'ok'}">${perlu ? `${perlu} hal perlu dicek (tanda ! dan ✕).` : '✓ Semua cek otomatis aman. Tetap cocokkan nama dengan foto KTP.'}</p>` +
      `<ul class="ck-out">${rows.map(([c, t]) => c === 'step' ? `<li class="ck-step">${t}</li>` : `<li class="${c}">${t}</li>`).join('')}</ul>`;
  }

  /* 3 · daftar cek sebelum kirim */
  const updGo = () => {
    const sisa = kirimChecks.filter(c => !c.checked).length;
    go.className = 'vf-status' + (sisa ? ' warn' : ' ok');
    go.textContent = sisa ? `${sisa} dari ${kirimChecks.length} belum dicentang: kebaya belum boleh dikirim.` : '✓ Semua tercentang: kebaya boleh dikirim.';
  };

  /* simpan isian di tab ini saja */
  const simpan = () => { try { sessionStorage.setItem(SIMPAN, JSON.stringify({ f: fields.map(f => f.value), a: fields.map(f => !!f.dataset.auto), c: checks.map(c => c.checked) })); } catch (e) { /* mode privat */ } };
  try {
    const s = JSON.parse(sessionStorage.getItem(SIMPAN) || 'null');
    if (s) {
      s.f.forEach((v, n) => { if (fields[n]) { fields[n].value = v; if (s.a?.[n]) fields[n].dataset.auto = '1'; } });
      s.c.forEach((v, n) => { if (checks[n]) checks[n].checked = v; });
    }
  } catch (e) { /* mode privat */ }
  const segarkan = () => { cek(); updGo(); simpan(); };
  ['input', 'change'].forEach(ev => $('#konten').addEventListener(ev, e => {
    if (!e.target.matches('[data-simpan], [data-cek]')) return;
    if (e.target === cKebaya || e.target === cDate) delete e.target.dataset.auto;   // diisi admin sendiri
    segarkan();
  }));
  $('#ckReset').addEventListener('click', () => {
    if (!confirm('Kosongkan semua isian di halaman ini?')) return;
    fields.forEach(f => { f.value = ''; delete f.dataset.auto; });
    checks.forEach(c => { c.checked = false; });
    try { sessionStorage.removeItem(SIMPAN); } catch (e) { /* mode privat */ }
    segarkan();
  });
  segarkan();
}

/* ── Angka di hero ── */
if ($('#statCount')) $('#statCount').textContent = ITEMS.length;
if ($('#statSeries')) $('#statSeries').textContent = seriesInfo.length;
if ($('#statMin')) $('#statMin').textContent = minPrice;

/* ── Link WhatsApp, Instagram, TikTok & Google Maps ── */
document.querySelectorAll('.js-wa').forEach(a => {
  const msg = a.dataset.msg ? decodeURIComponent(a.dataset.msg) : 'Halo Mojang.Kebaya, saya mau tanya sewa kebaya.';
  a.href = waLink(msg);
});
document.querySelectorAll('.js-ig').forEach(a => { a.href = `https://instagram.com/${KONTAK.ig}`; });
document.querySelectorAll('.js-tt').forEach(a => { a.href = `https://www.tiktok.com/@${KONTAK.tiktok}`; });
document.querySelectorAll('.js-maps').forEach(a => { if (KONTAK.maps) a.href = KONTAK.maps; });
document.querySelectorAll('.js-review').forEach(a => {
  if (KONTAK.ulasan) a.href = KONTAK.ulasan;
  a.addEventListener('click', () => track('Klik tulis ulasan', { halaman: location.pathname }));
});
// catat setiap klik ke WhatsApp (tombol mana & di halaman apa)
document.addEventListener('click', e => {
  const a = e.target.closest('.js-wa'); if (!a) return;
  track('Klik WhatsApp', { tombol: a.dataset.where || (a.classList.contains('fab') ? 'tombol melayang' : 'link'), halaman: location.pathname });
});

/* ── Ulasan customer (isi di data.js → ULASAN; bagian ini tersembunyi selama masih kosong) ── */
const reviewsBox = $('#reviews');
if (reviewsBox && ULASAN.length) {
  reviewsBox.innerHTML = ULASAN.map(u => `<figure class="review">
    <p class="review-stars" aria-label="${u.bintang || 5} dari 5 bintang">${'★'.repeat(u.bintang || 5)}</p>
    <blockquote>${esc(u.teks)}</blockquote>
    <figcaption>${esc(u.nama)}${u.kota ? ` · ${esc(u.kota)}` : ''}${u.kebaya ? ` · ${esc(u.kebaya)}` : ''}</figcaption>
  </figure>`).join('');
  reviewsBox.hidden = false;
}
if ($('#syarat')) $('#footTerms').addEventListener('click', () => { $('#syarat').open = true; });

$('#year').textContent = new Date().getFullYear();

/* ── Angka menghitung naik di hero ── */
const reduceAll = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('[data-count]').forEach(el => {
  const end = +el.textContent;
  el.dataset.end = end;
  if (reduceAll || !end) return;
  // memakai timer biasa (bukan requestAnimationFrame) supaya angka akhir selalu tercapai
  const t0 = Date.now() + 700, dur = 1200;
  el.textContent = '0';
  const tick = () => {
    const p = Math.min(1, Math.max(0, (Date.now() - t0) / dur));
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
    if (p < 1) setTimeout(tick, 30);
  };
  setTimeout(tick, 700);
});

/* ── Header & garis progres baca ── */
const topBar = $('#top'), prog = $('#progress');
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  if (prog) prog.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  topBar.classList.toggle('scrolled', scrollY > 20);
}
onScroll();
addEventListener('scroll', onScroll, { passive: true });

/* ── Pengaman animasi: jika jam animasi browser tidak berjalan
   (tab di latar belakang, mode hemat daya, perekam layar), tampilkan semua konten langsung ── */
const t0anim = document.timeline ? document.timeline.currentTime : null;
setTimeout(() => {
  if (document.timeline && document.timeline.currentTime - t0anim < 300) {
    document.documentElement.classList.remove('anim');
    document.querySelectorAll('[data-count]').forEach(el => { el.textContent = el.dataset.end; });
  }
}, 1800);

/* ── Animasi muncul saat digulir ── */
function revealCheck() {
  document.querySelectorAll('.reveal:not(.in), .mask:not(.in)').forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight * .92) el.classList.add('in');
  });
}
revealCheck();
addEventListener('scroll', revealCheck, { passive: true });
addEventListener('resize', revealCheck);
addEventListener('load', revealCheck);

if ('IntersectionObserver' in window) {
  // tombol Chat melayang disembunyikan saat ajakan & footer terlihat (tombolnya sudah ada di sana)
  const fab = $('.fab');
  const seen = new Set();
  const fo = new IntersectionObserver(entries => {
    entries.forEach(en => en.isIntersecting ? seen.add(en.target) : seen.delete(en.target));
    fab.classList.toggle('hide', seen.size > 0);
  });
  document.querySelectorAll('.cta, .foot').forEach(el => fo.observe(el));
}

/* ── Foto pembuka di HP/tablet: titik penanda foto yang sedang tampil ── */
const heroTrack = $('#heroTrack'), heroDots = $('#heroDots');
if (heroTrack && heroDots) {
  const dots = [...heroDots.children];
  const syncDots = () => {
    const n = Math.round(heroTrack.scrollLeft / Math.max(1, heroTrack.clientWidth));
    dots.forEach((d, k) => d.classList.toggle('on', k === n));
  };
  heroTrack.addEventListener('scroll', syncDots, { passive: true });
  addEventListener('resize', syncDots);

  /* Geser otomatis tiap 4,5 detik (hanya HP/tablet). Berhenti saat disentuh/digeser lalu
     lanjut 6 detik kemudian; berhenti saat bagian ini tidak terlihat, tab di latar belakang,
     atau pengunjung mematikan animasi di perangkatnya. */
  const narrow = matchMedia('(max-width: 899px)');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  let timer = null, resumeTimer = null, inView = true;
  const stopAuto = () => { clearInterval(timer); timer = null; };
  const nextSlide = () => {
    const count = heroTrack.children.length, w = heroTrack.clientWidth;
    const n = Math.round(heroTrack.scrollLeft / Math.max(1, w));
    heroTrack.scrollTo({ left: ((n + 1) % count) * w, behavior: 'smooth' });
  };
  const startAuto = () => {
    stopAuto();
    if (narrow.matches && !calm.matches && inView && !document.hidden) timer = setInterval(nextSlide, 4500);
  };
  const userActive = () => { stopAuto(); clearTimeout(resumeTimer); resumeTimer = setTimeout(startAuto, 6000); };
  ['touchstart', 'pointerdown', 'wheel', 'keydown'].forEach(ev => heroTrack.addEventListener(ev, userActive, { passive: true }));
  document.addEventListener('visibilitychange', startAuto);
  if (narrow.addEventListener) narrow.addEventListener('change', startAuto);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; startAuto(); }, { threshold: 0.4 }).observe(heroTrack);
  }
  startAuto();
}

/* ── Tombol melayang "Lihat katalog" (beranda): menyingkir sementara saat akan
   menutupi tulisan di foto (Koleksi Baru, Series …), sembunyi saat footer terlihat ── */
const floatCta = $('#floatCta');
if (floatCta) {
  const foot = $('.foot');
  const caps = [...document.querySelectorAll('.hero-cap')];
  const checkFloat = () => {
    const p = floatCta.getBoundingClientRect(), pad = 12;
    const coversCaption = caps.some(c => {
      const r = c.getBoundingClientRect();
      return r.bottom > p.top - pad && r.top < p.bottom + pad && r.right > p.left - pad && r.left < p.right + pad;
    });
    const atFoot = foot && foot.getBoundingClientRect().top < innerHeight - 40;
    floatCta.classList.toggle('hide', coversCaption || !!atFoot);
  };
  checkFloat();
  setTimeout(checkFloat, 0);   // cek ulang setelah katalog selesai digambar (bagian "Mulai" di bawah)
  addEventListener('load', checkFloat);
  addEventListener('scroll', checkFloat, { passive: true });
  addEventListener('resize', checkFloat);
}

/* ── Mulai ── */
update();
const startKey = q.get('k');
if (sheet && startKey && ITEMS.some(i => i.key === startKey)) {
  history.replaceState(null, '', syncUrl());
  openDetail(startKey, true);
}
})();
