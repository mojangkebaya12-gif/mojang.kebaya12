/* =============================================================
   MOJANG.KEBAYA — KATALOG, DETAIL & WHATSAPP
   Data produk ada di data.js; file ini tidak perlu diubah.
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
// foto kedua yang muncul saat kursor diarahkan ke kartu (desktop)
const altPhoto = i => i.photos[1] ? i.photos[1].replace('image/kebaya/', 'image/kebaya/thumb/') : (i.cust[0] || '');

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

/* ── Filter ── */
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
  $('#grid').innerHTML = list.map((i, n) => `
    <li class="card">
      <button class="card-btn" type="button" data-key="${i.key}" aria-label="Lihat detail ${esc(i.name)}, ${i.priceTxt}">
        <div class="card-img">
          <img src="${i.thumb}" alt="Kebaya ${esc(i.name)}" width="480" height="640" ${n > 3 ? 'loading="lazy"' : ''} decoding="async">
          ${altPhoto(i) ? `<img class="alt" src="${altPhoto(i)}" alt="" loading="lazy" decoding="async">` : ''}
          ${i.isNew ? '<span class="badge">Baru</span>' : i.price === minPrice ? '<span class="badge deal">Hemat</span>' : ''}
          ${i.photos.length + i.cust.length > 1 ? `<span class="count">${i.photos.length + i.cust.length} foto</span>` : ''}
          <span class="card-view">Lihat detail</span>
        </div>
        <div class="card-meta">
          <div class="card-series"><i style="background:${i.hex}"></i>${SERIES[i.s].unggulan ? '✦ ' : ''}${esc(i.series)}</div>
          <div class="card-name">${esc(i.color)}</div>
          <div class="card-price">${i.priceTxt} <small>/ 3 hari</small></div>
          ${i.ld ? `<div class="card-ld">${esc(i.ld)}</div>` : ''}
        </div>
      </button>
    </li>`).join('');

  const label = state.baru ? 'kebaya baru'
    : state.series ? `kebaya series ${SERIES[state.series].name}` : 'kebaya';
  $('#result').innerHTML = `Menampilkan <b>${list.length}</b> ${label}` +
    (state.fam.length ? ` · warna ${state.fam.map(f => FAMILIES[f][0].toLowerCase()).join(', ')}` : '');
  $('#empty').hidden = list.length > 0;
}

function update() {
  renderFilters();
  renderGrid();
  history.replaceState(history.state, '', syncUrl(history.state?.k));
}

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

/* ── Detail kebaya ── */
const sheet = $('#sheet');
let current = null;

function openDetail(key, push = true) {
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
  if (!sheet.open) return;
  sheet.close();
}
sheet.addEventListener('close', () => {
  document.body.classList.remove('lock');
  document.title = 'Katalog Sewa Kebaya Sukabumi – Mojang.kebaya';
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
function goTo(n) { slides.scrollTo({ left: n * slides.clientWidth, behavior: 'smooth' }); }
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
const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
dDate.min = today.toISOString().slice(0, 10);
const fmtDate = v => v ? new Date(v + 'T00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '...';

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

/* ── Foto customer di halaman utama ── */
const reelItems = ITEMS.filter(i => i.cust.length).flatMap(i => i.cust.slice(0, 2).map(src => ({ i, src })));
$('#reel').innerHTML = reelItems.map(({ i, src }) => `
  <li data-photo><button type="button" data-key="${i.key}">
    <span class="r-img"><img src="${src}" alt="Customer memakai ${esc(i.name)}" loading="lazy" decoding="async" width="260" height="347"></span>
    <span class="r-name">${esc(i.name)}</span>
  </button></li>`).join('');
$('#reel').querySelectorAll('img').forEach(hideBroken);

/* ── Series: kartu di halaman utama & daftar di footer ── */
const seriesInfo = Object.entries(SERIES).map(([k, ser], n) => {
  const list = ITEMS.filter(i => i.s === k);
  const cover = list.find(i => i.isNew) || list[0];
  return { k, ser, n, list, cover, min: Math.min(...list.map(i => i.price)) };
}).filter(x => x.list.length);

$('#seriesList').innerHTML = seriesInfo.map(({ k, ser, n, list, cover, min }) => `
  <li class="reveal${ser.unggulan ? ' is-top' : ''}"><button type="button" data-go-series="${k}" aria-label="Lihat series ${esc(ser.name)}">
    <span class="s-img"><img src="${cover.thumb}" alt="" loading="lazy" decoding="async">${ser.unggulan ? '<span class="badge">✦ Unggulan</span>' : ''}</span>
    <span class="s-no">0${n + 1}</span>
    <span class="s-name">${esc(ser.name)}</span>
    <span class="s-meta">${list.length} warna · mulai ${rb(min)}</span>
    <span class="s-dots">${list.map(i => `<i style="background:${i.hex}"></i>`).join('')}</span>
  </button></li>`).join('');
$('#footSeries').innerHTML = seriesInfo.map(({ k, ser }) =>
  `<li><a href="?series=${k}#katalog" data-go-series="${k}">${esc(ser.name)}</a></li>`).join('');

document.addEventListener('click', e => {
  const b = e.target.closest('[data-go-series]'); if (!b) return;
  e.preventDefault();
  Object.assign(state, { series: b.dataset.goSeries, fam: [], baru: false });
  update();
  $('#katalog').scrollIntoView({ behavior: 'smooth' });
});

/* ── Menu garis tiga ── */
const drawer = $('#drawer');
const menuBtn = $('#menuBtn');
$('#drawerSeries').innerHTML = seriesInfo.map(({ k, ser, list, min }) => `
  <li><a href="?series=${k}#katalog" data-go-series="${k}" data-close>
    <span class="ds-name">${ser.unggulan ? '✦ ' : ''}${esc(ser.name)}</span>
    <span class="ds-dots">${list.map(i => `<i style="background:${i.hex}"></i>`).join('')}</span>
    <small>${list.length} warna · mulai ${rb(min)}</small>
  </a></li>`).join('');

function setMenu(open) {
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', !open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  document.body.classList.toggle('lock', open || sheet.open);
  if (open) drawer.querySelector('.drawer-panel').focus();
}
menuBtn.addEventListener('click', () => setMenu(!drawer.classList.contains('open')));
drawer.addEventListener('click', e => { if (e.target.closest('[data-close]')) setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) setMenu(false); });

/* ── Hero: bingkai utama berganti kebaya otomatis ──
   Urutan: kebaya "Baru" dulu, lalu semua warna series unggulan, lalu HERO_PICKS. */
const topItems = ITEMS.filter(i => SERIES[i.s].unggulan);
const HERO_PICKS = ['aruni-emerald', 'kinasih-maroon'];
const heroItems = [...new Set([
  ...ITEMS.filter(i => i.isNew), ...topItems,
  ...HERO_PICKS.map(k => ITEMS.find(i => i.key === k)).filter(Boolean),
])];
const hSlides = $('#heroSlides');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let hIdx = 0, hTimer;

hSlides.innerHTML = heroItems.map((i, n) =>
  `<img ${n ? 'data-src' : 'src'}="${i.photos[0]}" alt="Kebaya ${esc(i.name)}" class="${n ? '' : 'on'}" decoding="async">`).join('');
$('#heroDots').innerHTML = heroItems.map((i, n) =>
  `<button type="button" role="tab" data-hero="${n}" aria-label="${esc(i.name)}" aria-selected="${n === 0}"></button>`).join('');

const loadSlide = n => {
  const img = hSlides.children[n];
  if (img && img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
};
function showHero(n) {
  hIdx = (n + heroItems.length) % heroItems.length;
  const i = heroItems[hIdx];
  const next = heroItems[(hIdx + 1) % heroItems.length];
  loadSlide(hIdx);
  loadSlide((hIdx + 1) % heroItems.length);
  [...hSlides.children].forEach((img, k) => img.classList.toggle('on', k === hIdx));
  $('#heroMain').dataset.key = i.key;
  $('#heroMain').setAttribute('aria-label', `Lihat detail ${i.name}`);
  $('#heroTag').textContent = i.isNew ? 'Baru' : `Series ${i.series}`;
  $('#heroName').textContent = i.name;
  $('#heroPrice').textContent = i.priceTxt;
  $('#heroNextImg').src = next.thumb;
  $('#heroDots').querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-selected', k === hIdx));
}
function playHero() {
  clearInterval(hTimer);
  if (!reduceMotion) hTimer = setInterval(() => showHero(hIdx + 1), 5000);
}
$('#heroNext').addEventListener('click', () => { showHero(hIdx + 1); playHero(); });
$('#heroDots').addEventListener('click', e => {
  const b = e.target.closest('[data-hero]'); if (b) { showHero(+b.dataset.hero); playHero(); }
});
$('.hero-media').addEventListener('mouseenter', () => clearInterval(hTimer));
$('.hero-media').addEventListener('mouseleave', playHero);
window.addEventListener('load', () => { loadSlide(1); playHero(); });

/* ── Cek ongkir luar kota → WhatsApp ── */
$('#sKebaya').innerHTML += ITEMS.map(i => `<option>${esc(i.name)}</option>`).join('');
$('#sDate').min = dDate.min;
$('#shipForm').addEventListener('submit', e => {
  e.preventDefault();
  const msg = `Halo Mojang.kebaya, saya mau sewa kebaya untuk dikirim ke luar kota.\n` +
    `Kota tujuan: ${$('#sCity').value.trim()}\n` +
    `Tanggal acara: ${fmtDate($('#sDate').value)}\n` +
    `Kebaya: ${$('#sKebaya').value || 'belum memilih'}\n` +
    `Mohon info estimasi ongkirnya. Terima kasih.`;
  window.open(waLink(msg), '_blank', 'noopener');
});

/* ── Angka di hero ── */
$('#statCount').textContent = ITEMS.length;
$('#statSeries').textContent = seriesInfo.length;
$('#statMin').textContent = rb(minPrice);

/* ── Link WhatsApp, Instagram & TikTok ── */
document.querySelectorAll('.js-wa').forEach(a => {
  const msg = a.dataset.msg ? decodeURIComponent(a.dataset.msg) : 'Halo Mojang.kebaya, saya mau tanya sewa kebaya.';
  a.href = waLink(msg);
});
document.querySelectorAll('.js-ig').forEach(a => { a.href = `https://instagram.com/${KONTAK.ig}`; });
document.querySelectorAll('.js-tt').forEach(a => { a.href = `https://www.tiktok.com/@${KONTAK.tiktok}`; });
$('#footTerms').addEventListener('click', () => { $('#syarat').open = true; });

$('#year').textContent = new Date().getFullYear();

/* ── Animasi muncul saat digulir ── */
function revealCheck() {
  document.querySelectorAll('.reveal:not(.in)').forEach(el => {
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

/* ── Mulai ── */
update();
const startKey = q.get('k');
if (startKey && ITEMS.some(i => i.key === startKey)) {
  history.replaceState(null, '', syncUrl());
  openDetail(startKey, true);
}
})();
