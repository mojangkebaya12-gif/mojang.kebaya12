/* =============================================================
   MOJANG.KEBAYA — Homepage (konten & interaksi)
   Butuh data.js dan main.js dimuat lebih dulu.
   Semua nama, harga, warna, ukuran & foto diambil dari data.js —
   tidak ada data produk yang ditulis ulang di file ini.

   Isi
   1. Alat bantu & foto
   2. Hero (koleksi baru di bingkai potret)
   3. Bingkai series di galeri + chip series
   4. Detail & momen
   5. Titik emas → jendela series / jendela detail kebaya
   6. Koleksi baru, index series, foto customer
   7. Formulir booking → WhatsApp (format pesan sama seperti versi lama)
   8. Header terang/gelap & animasi muncul
   ============================================================= */
(function () {
'use strict';
const M = window.MOJANG;
if (!M) { console.error('Mojang.kebaya: assets/js/main.js belum dimuat.'); return; }
const { KONTAK, SERIES, ITEMS, pad, esc, waLink, openModal, card, bindMissing } = M;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const byKey = k => ITEMS.find(i => i.key === k);
const LOGO = '<svg class="arch-ph" viewBox="222 176 848 942" aria-hidden="true" focusable="false"><use href="#logo-shapes"/></svg>';


/* ── 1. FOTO ────────────────────────────────────────────────
   Foto di galeri memakai data-src. journey.js memuatnya saat kamera
   mendekat (mode 3D); di mode datar semuanya dimuat dengan lazy-load.
   Jika foto belum ada / gagal → bingkai menampilkan warna kebaya + logo.
   Foto di-decode dulu di latar belakang baru ditampilkan (scroll tidak tersendat). */
function watchImg(img) {
  const host = img.closest('.arch, .detail-img');
  if (!host || img.dataset.watch) return;
  img.dataset.watch = '1';
  img.decoding = 'async';
  const ready = () => {
    host.classList.remove('ph');
    const show = () => img.classList.add('ready');
    if (img.decode) img.decode().then(show, show); else show();
  };
  img.addEventListener('error', () => host.classList.add('ph'));
  img.addEventListener('load', ready);
  if (img.getAttribute('src') && img.complete) (img.naturalWidth ? ready() : host.classList.add('ph'));
}
function loadImg(img) {
  if (!img || !img.dataset.src) return;
  watchImg(img);
  img.src = img.dataset.src;
  img.removeAttribute('data-src');
}
function loadAll() {
  $$('#jv img[data-src]').forEach(img => { img.loading = 'lazy'; loadImg(img); });
}
const setSrc = (img, it) => {
  if (!img || !it) return;
  img.dataset.src = it.img;
  const host = img.closest('[data-obj], .frame, .occ, .detail');
  if (host) host.style.setProperty('--c', it.hex);
  watchImg(img);
};


/* ── 2. HERO ───────────────────────────────────────────────── */
const hero = ITEMS.find(i => i.isNew) || ITEMS[0];
const portal = $('#portal');
if (portal && hero) {
  const img = $('#portalImg');
  portal.style.setProperty('--c', hero.hex);
  watchImg(img);
  if (img.getAttribute('src') !== hero.img) img.src = hero.img;
  img.alt = `Kebaya ${hero.series} ${hero.color}${hero.isNew ? ' — koleksi baru' : ''}`;
  $('#portalName').textContent = `${hero.series} — ${hero.color}`;
  $('#portalMeta').textContent = `${hero.isNew ? 'Baru · ' : ''}${hero.price}K`;
  const hot = $('#portalHot');
  hot.dataset.item = hero.id;
  hot.setAttribute('aria-label', `Lihat detail kebaya ${hero.series} ${hero.color}`);
}


/* ── 3. BINGKAI SERIES + CHIP ──────────────────────────────── */
const seriesKeys = Object.keys(SERIES);
const seriesInfo = k => {
  const its = ITEMS.filter(x => x.s === k);
  const prices = its.map(x => x.price);
  return {
    its,
    min: Math.min(...prices),
    max: Math.max(...prices),
    nw: its.filter(x => x.isNew).length,
    cover: its.find(x => x.fav) || its.find(x => !x.isNew) || its[0],
  };
};

const gallery = $('#gallery');
if (gallery) {
  gallery.innerHTML = seriesKeys.map((k, i) => {
    const s = SERIES[k], f = seriesInfo(k);
    if (!f.its.length) return '';
    return `<article class="obj frame reveal-arch" data-obj data-frame="${i}" data-series="${k}" style="--c:${f.cover.hex}">
      <div class="arch"><img data-src="${f.cover.img}" alt="Kebaya ${esc(s.name)} ${esc(f.cover.color)}" decoding="async">${LOGO}</div>
      <div class="frame-cap">
        <span class="no">${pad(i + 1)}</span>
        <span class="nm">${esc(s.name)}</span>
        <span class="meta">${pad(f.its.length)} warna · mulai ${f.min}K${f.nw ? ` · ${f.nw} baru` : ''}</span>
        <span class="sws" aria-hidden="true">${f.its.map(x => `<i style="background:${x.hex}"></i>`).join('')}</span>
      </div>
      <button class="hot" type="button" data-series="${k}" aria-haspopup="dialog"
        aria-label="Series ${esc(s.name)}: ${f.its.length} warna, mulai Rp ${f.min}.000. Lihat warna"><span></span><em class="hot-lbl">Lihat ${f.its.length} warna</em></button>
    </article>`;
  }).join('');
  $$('img', gallery).forEach(watchImg);
}

const chips = $('#seriesChips');
if (chips) {
  chips.innerHTML = seriesKeys.map(k => {
    const f = seriesInfo(k);
    return `<button class="chip" type="button" data-series="${k}" aria-haspopup="dialog" style="--c:${f.cover.hex}"><i></i>${esc(SERIES[k].name)}</button>`;
  }).join('');
}


/* ── 4. DETAIL & MOMEN ─────────────────────────────────────── */
// kebaya yang ditampilkan di bab "Detail" — ganti key di sini (format: series-warna)
const fav = byKey('geulis-rose-gold') || ITEMS[0];
const detail = $('#detail');
if (detail && fav) {
  const img = $('img', detail);
  setSrc(img, fav);
  img.alt = `Detail kebaya ${fav.series} ${fav.color}`;
  $('#detailCap').textContent = `${fav.series} — ${fav.color}`;
  const hot = $('.hot', detail);
  hot.dataset.key = fav.key;
  hot.setAttribute('aria-label', `Lihat detail kebaya ${fav.series} ${fav.color}`);
  const desc = SERIES[fav.s] && SERIES[fav.s].desc;
  if (desc) $('#detailDesc').textContent = `${fav.series}: ${desc} Isi paket sewa:`;
  $('#pkgList').innerHTML = fav.pkg.filter(p => !/^LD\b/.test(p)).map(p => `<li>${esc(p)}</li>`).join('');
}
$$('.occ img[data-key]').forEach(img => setSrc(img, byKey(img.dataset.key)));
$$('.portal, .detail, .occ').forEach(el => el.classList.add('reveal-arch'));


/* ── 5. TITIK EMAS & JENDELA SERIES ────────────────────────── */
const dlg = $('#seriesDialog');
let opener = null;

function openSeries(k, from) {
  const s = SERIES[k];
  if (!s || !dlg) return;
  const f = seriesInfo(k);
  opener = from || document.activeElement;
  $('#sdNo').textContent = `Series ${pad(seriesKeys.indexOf(k) + 1)} / ${pad(seriesKeys.length)}`;
  $('#sdTitle').textContent = s.name;
  $('#sdDesc').textContent = s.desc || '';
  const facts = [
    ['Warna', pad(f.its.length)],
    ['Harga sewa', f.min === f.max ? `${f.min}K` : `${f.min}–${f.max}K`],
    ['Ukuran', s.ld || 'Tanya via WA'],
  ];
  $('#sdFacts').innerHTML = facts.map(([t, v]) => `<div><dt>${t}</dt><dd>${esc(v)}</dd></div>`).join('');
  $('#sdColors').innerHTML = f.its.map(it => `<li><button type="button" data-id="${it.id}">
      <i style="background:${it.hex}"></i><span class="c-nm">${esc(it.color)}</span>
      ${it.isNew ? '<span class="c-tag">Baru</span>' : '<span></span>'}<span class="c-pr">${it.priceTxt}</span>
    </button></li>`).join('');
  $('#sdLink').href = `katalog.html?series=${k}`;
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  $('.sd-close', dlg).focus({ preventScroll: true });
}
function closeSeries() {
  if (!dlg || !dlg.open) return;
  if (typeof dlg.close === 'function') dlg.close(); else { dlg.removeAttribute('open'); afterClose(); }
}
function afterClose() { opener?.focus?.({ preventScroll: true }); }

if (dlg) {
  dlg.addEventListener('close', afterClose);
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('[data-close]')) return closeSeries();
    const b = e.target.closest('button[data-id]');
    if (b) { closeSeries(); openModal(ITEMS[+b.dataset.id]); }
  });
}

document.addEventListener('click', e => {
  const t = e.target.closest('.hot, .chip');
  if (!t) return;
  if (t.dataset.series) openSeries(t.dataset.series, t);
  else if (t.dataset.item) openModal(ITEMS[+t.dataset.item]);
  else if (t.dataset.key) openModal(byKey(t.dataset.key));
});


/* ── 6. KOLEKSI BARU · INDEX SERIES · FOTO CUSTOMER ────────── */
const newCards = $('#newCards');
if (newCards) {
  newCards.innerHTML = ITEMS.filter(i => i.isNew).map((it, n) => card(it, n + 1, n * 120)).join('');
  $$('.look', newCards).forEach(el => el.classList.add('rv'));
  bindMissing(newCards);
}

const idx = $('#idx');
if (idx) {
  idx.insertAdjacentHTML('beforeend', seriesKeys.map((k, i) => {
    const s = SERIES[k], f = seriesInfo(k);
    return `<a class="idx-row" href="katalog.html?series=${k}" data-img="${f.cover.img}">
      <span class="no">${pad(i + 1)}</span><span class="nm">${esc(s.name)}</span>
      <span class="meta m1">${pad(f.its.length)} Warna${f.nw ? ` · ${f.nw} Baru` : ''}</span>
      <span class="meta m2">Mulai ${f.min}K</span>
      <span class="go">Lihat →</span></a>`;
  }).join(''));

  const pv = $('#preview'), pvImg = pv && $('img', pv);
  if (pv && matchMedia('(hover: hover)').matches) {
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const follow = () => {
      cx += (x - cx) * .18; cy += (y - cy) * .18;
      pv.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > .5 ? requestAnimationFrame(follow) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(follow); };
    idx.addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; kick(); });
    $$('.idx-row', idx).forEach(row => row.addEventListener('mouseenter', e => {
      pvImg.src = row.dataset.img;
      if (!pv.classList.contains('on')) { x = cx = e.clientX; y = cy = e.clientY; }
      pv.classList.add('on'); kick();
    }));
    idx.addEventListener('mouseleave', () => pv.classList.remove('on'));
    pvImg.addEventListener('error', () => pv.classList.remove('on'));
  }
}

const gram = $('#gram');
if (gram) {
  const pool = [...ITEMS.filter(i => i.fav).sort((a, b) => a.fav - b.fav), ...ITEMS.filter(i => !i.fav && !i.isNew)];
  const shots = [];
  [0, 1].forEach(n => pool.forEach(it => shots.push({ src: it.photos[n], label: `${it.series} ${it.color}` })));
  gram.innerHTML = shots.slice(0, 15).map(p =>
    `<a href="https://instagram.com/${KONTAK.ig}" target="_blank" rel="noopener"><img src="${p.src}" alt="Customer memakai ${esc(p.label)}" loading="lazy"><span>${esc(p.label)}</span></a>`
  ).join('');
  let left = gram.children.length;
  $$('img', gram).forEach(img => img.addEventListener('error', () => {
    img.parentElement.remove();
    if (--left === 0) $('#customer')?.remove();   // belum ada foto sama sekali → section disembunyikan
  }, { once: true }));
}


/* ── 7. FORMULIR BOOKING → WHATSAPP ────────────────────────── */
const form = $('#bookForm');
const sel = $('#fKebaya');
if (sel) sel.insertAdjacentHTML('beforeend', seriesKeys.map(k =>
  `<optgroup label="${esc(SERIES[k].name)}">${ITEMS.filter(i => i.s === k).map(i => `<option>${esc(SERIES[k].name)} – ${esc(i.color)}</option>`).join('')}</optgroup>`
).join(''));

form?.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(form);
  const tgl = f.get('tanggal')
    ? new Date(f.get('tanggal') + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';
  const msg = [
    'Halo Mojang.kebaya, saya ingin booking kebaya.', '',
    `Nama: ${f.get('nama') || '-'}`,
    `Tanggal acara: ${tgl}`,
    `Kebaya: ${f.get('kebaya') || 'Belum memilih'}`,
    `Acara: ${f.get('acara') || '-'}`,
    `Catatan: ${f.get('catatan') || '-'}`, '',
    'Apakah tersedia?',
  ].join('\n');
  window.open(waLink(msg), '_blank', 'noopener');
});


/* ── 8. HEADER & ANIMASI MUNCUL ────────────────────────────── */
const hdr = $('.hdr');
const journey = $('.journey');
const jv = $('#jv');
const catBtn = $('#catBtn');
let ticking = false;
let jBottom = 0, hdrH = 0;      // posisi disimpan → saat scroll tidak perlu membaca layout (lebih halus)
const measure = () => {
  if (!journey) return;
  jBottom = journey.offsetTop + journey.offsetHeight;
  hdrH = hdr ? hdr.offsetHeight : 0;
};
/* header gelap di atas galeri, terang setelah galeri berakhir (atau saat galeri "fajar") */
const syncHeader = () => {
  ticking = false;
  if (!hdr || !journey) return;
  const y = window.scrollY, vh = window.innerHeight, rootCls = document.documentElement.classList;
  const past = jBottom - y <= hdrH;
  hdr.classList.toggle('on-light', past || !!(jv && jv.classList.contains('is-dawn')));
  // tombol katalog disembunyikan di layar pertama (hero sudah punya tombol sendiri)
  // dan selama galeri 3D berjalan di HP (agar tidak menutupi teks bab)
  const inGallery = (rootCls.contains('is-portrait') || (rootCls.contains('is-3d') && vh < 520)) && jBottom - y > vh * .6;
  catBtn?.classList.toggle('is-away', y < vh * .5 || inGallery);
};
if (hdr && journey) {
  measure();
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); syncHeader(); }).observe(journey);
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(syncHeader); } }, { passive: true });
  window.addEventListener('resize', () => { measure(); syncHeader(); });
  window.addEventListener('load', () => { measure(); syncHeader(); });
  syncHeader();
}

/* hero muncul setelah loader selesai */
const revealHero = () => {
  $$('.hero .split').forEach(el => el.classList.add('in'));
  portal?.classList.add('in');
};
if (window.__mkReady) revealHero(); else document.addEventListener('mk:ready', revealHero, { once: true });

/* elemen yang dibuat oleh file ini (main.js hanya mengamati elemen awal) */
const late = $$('.reveal-arch:not(.portal), .new-cards .rv');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  late.forEach(el => io.observe(el));
} else late.forEach(el => el.classList.add('in'));

/* jika journey.js tidak aktif (gagal dimuat), muat semua foto galeri */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.MKJourney || !window.MKJourney.active()) loadAll();
});

window.MKHome = { loadImg, loadAll, openSeries, closeSeries, syncHeader };
})();
