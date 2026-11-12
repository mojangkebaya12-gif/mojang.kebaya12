/* =============================================================
   MOJANG.KEBAYA — KATALOG, DETAIL & WHATSAPP
   Data produk ada di data.js; file ini tidak perlu diubah.
   Dipakai di index.html (beranda) dan katalog.html (katalog + detail).
   Setiap bagian hanya berjalan jika elemennya ada di halaman.
   ============================================================= */
(function () {
'use strict';

const { KONTAK, SERIES, FAMILIES, ITEMS } = window.MOJANG_DATA;
const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const waLink = msg => `https://wa.me/${KONTAK.wa}?text=${encodeURIComponent(msg)}`;
const hideBroken = img => { img.onerror = () => img.closest('[data-photo]')?.remove(); };
const minPrice = Math.min(...ITEMS.map(i => i.price));
const rb = p => `${p}rb`;
const scrollToEl = el => (window.MOJANG_SCROLL ? window.MOJANG_SCROLL(el) : el.scrollIntoView({ behavior: 'smooth' }));

const grid = $('#grid');     // ada di katalog.html
const sheet = $('#sheet');   // ada di katalog.html
const KATALOG = 'katalog.html';
const baseTitle = document.title;

const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
const todayISO = today.toISOString().slice(0, 10);
const fmtDate = v => v ? new Date(v + 'T00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '...';

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
  document.title = `${i.name} – Sewa Kebaya Mojang.kebaya`;
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

  $('#dBook').addEventListener('submit', e => {
    e.preventDefault();
    if (!current) return;
    const msg = `Halo Mojang.kebaya, saya mau booking kebaya:\n` +
      `Kebaya: ${current.name} (${current.priceTxt})\n` +
      `Tanggal acara: ${fmtDate(dDate.value)}\n` +
      `Acara: ${$('#dEvent').value}\n` +
      `Nama: ...\nAmbil di Sukabumi / kirim ke: ...\n\n` +
      `Link: ${location.origin}${location.pathname}?k=${current.key}`;
    window.open(waLink(msg), '_blank', 'noopener');
  });

  $('#dCalBtn').addEventListener('click', () => {
    if (!current) return;
    if (!current.cal) {
      window.open(waLink(`Halo Mojang.kebaya, apakah ${current.name} tersedia tanggal ${fmtDate(dDate.value)}?`), '_blank', 'noopener');
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
  window.open(waLink(`Halo Mojang.kebaya, saya mau booking kebaya.${t ? `\n${t}` : ''}`), '_blank', 'noopener');
});

/* ── Cek ongkir luar kota → WhatsApp (beranda) ── */
if ($('#shipForm')) {
  $('#sKebaya').innerHTML += ITEMS.map(i => `<option>${esc(i.name)}</option>`).join('');
  $('#sDate').min = todayISO;
  $('#shipForm').addEventListener('submit', e => {
    e.preventDefault();
    const msg = `Halo Mojang.kebaya, saya mau sewa kebaya untuk dikirim ke luar kota.\n` +
      `Kota tujuan: ${$('#sCity').value.trim()}\n` +
      `Tanggal acara: ${fmtDate($('#sDate').value)}\n` +
      `Kebaya: ${$('#sKebaya').value || 'belum memilih'}\n` +
      `Mohon info estimasi ongkirnya. Terima kasih.`;
    window.open(waLink(msg), '_blank', 'noopener');
  });
}

/* ── Angka di hero ── */
if ($('#statCount')) $('#statCount').textContent = ITEMS.length;
if ($('#statSeries')) $('#statSeries').textContent = seriesInfo.length;
if ($('#statMin')) $('#statMin').textContent = minPrice;

/* ── Link WhatsApp, Instagram, TikTok & Google Maps ── */
document.querySelectorAll('.js-wa').forEach(a => {
  const msg = a.dataset.msg ? decodeURIComponent(a.dataset.msg) : 'Halo Mojang.kebaya, saya mau tanya sewa kebaya.';
  a.href = waLink(msg);
});
document.querySelectorAll('.js-ig').forEach(a => { a.href = `https://instagram.com/${KONTAK.ig}`; });
document.querySelectorAll('.js-tt').forEach(a => { a.href = `https://www.tiktok.com/@${KONTAK.tiktok}`; });
document.querySelectorAll('.js-maps').forEach(a => { if (KONTAK.maps) a.href = KONTAK.maps; });
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
