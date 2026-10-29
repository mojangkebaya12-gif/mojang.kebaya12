/* =============================================================
   MOJANG.KEBAYA — Script bersama (homepage & katalog)
   Butuh data.js dimuat lebih dulu.

   Isi:
   1. Alat bantu
   2. Kartu kebaya
   3. Header, menu mobile, animasi judul & scroll, angka otomatis
   4. Jendela detail kebaya (keterangan, cek ketersediaan, foto customer)
   ============================================================= */
(function () {
'use strict';
const D = window.MOJANG_DATA;
if (!D) { console.error('Mojang.kebaya: assets/js/data.js belum dimuat.'); return; }
const { KONTAK, SERIES, ITEMS } = D;


/* ── 1. ALAT BANTU ─────────────────────────────────────────── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const waLink = text => `https://wa.me/${KONTAK.wa}` + (text ? `?text=${encodeURIComponent(text)}` : '');


/* ── 2. KARTU KEBAYA ───────────────────────────────────────── */
function card(it, no, delay = 0) {
  return `<article class="look" data-id="${it.id}" tabindex="0" role="button"
    aria-label="Lihat detail ${esc(it.series)} ${esc(it.color)}" style="animation-delay:${delay}ms">
    <div class="look-img">
      <img src="${it.img}" alt="Kebaya ${esc(it.series)} ${esc(it.color)}" loading="lazy" draggable="false">
      ${it.isNew ? '<span class="tag">Baru</span>' : ''}
      <span class="view">Lihat +</span>
    </div>
    <div class="look-info">
      <span class="no">${pad(no)}</span>
      <span class="nm">${esc(it.color)}<small><i class="sw" style="background:${it.hex}"></i>${esc(it.series)} Series</small></span>
      <span class="pr">${it.price}K</span>
    </div>
  </article>`;
}

/* Foto belum diupload → tampilkan "Foto segera hadir" */
function bindMissing(root) {
  $$('.look-img img, .row-thumb img', root).forEach(img => {
    const host = img.closest('.look, .row');
    const miss = () => host && host.classList.add('miss');
    if (img.complete && img.naturalWidth === 0) miss();
    img.addEventListener('error', miss, { once: true });
  });
}


/* ── 3. UI BERSAMA ─────────────────────────────────────────── */

/* Angka otomatis: data-count="all" | "new" | "series" | "min" */
const COUNTS = {
  all:    () => pad(ITEMS.length),
  new:    () => pad(ITEMS.filter(i => i.isNew).length),
  series: () => pad(Object.keys(SERIES).length),
  min:    () => Math.min(...ITEMS.map(i => i.price)) + 'K',
};
$$('[data-count]').forEach(el => { const f = COUNTS[el.dataset.count]; if (f) el.textContent = f(); });
$$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

/* Header homepage: transparan di atas foto, berlatar burgundy setelah discroll */
const hdr = $('.hdr');
if (hdr && !document.body.classList.contains('page-katalog')) {
  const onScroll = () => hdr.classList.toggle('solid', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* Menu mobile */
const mnav = $('#mnav');
const setMenu = open => {
  if (!mnav) return;
  mnav.classList.toggle('open', open);
  document.body.classList.toggle('no-scroll', open);
  $('#menuBtn')?.setAttribute('aria-expanded', String(open));
};
$('#menuBtn')?.addEventListener('click', () => setMenu(true));
$('#menuClose')?.addEventListener('click', () => setMenu(false));
$$('#mnav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

/* Judul muncul per kata (class="split") */
$$('.split').forEach(el => {
  el.innerHTML = el.innerHTML
    .split(/(<br>|\s+)/)
    .map(w => (w === '<br>' || !w.trim()) ? w : `<span class="w"><span>${w}</span></span>`)
    .join('');
  $$('.w > span', el).forEach((s, i) => { s.style.transitionDelay = (i * 28) + 'ms'; });
});

/* Wordmark besar (hero & footer) dibuat pas selebar layar, apa pun nama & hurufnya */
const fitWordmarks = () => $$('.wordmark').forEach(el => {
  const r = document.createRange();
  for (let i = 0; i < 2; i++) {                       // 2x supaya padding (em) ikut terhitung
    const cs = getComputedStyle(el);
    const room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    r.selectNodeContents(el);
    const used = r.getBoundingClientRect().width;
    if (room > 0 && used > 0) el.style.fontSize = (parseFloat(cs.fontSize) * room / used * .995) + 'px';
  }
});
fitWordmarks();
document.fonts?.ready.then(fitWordmarks);
let fitT;
window.addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fitWordmarks, 120); });

/* Muncul saat discroll (class="rv" dan "split"; hero diatur home.js) */
const toReveal = $$('.rv, .split').filter(el => !el.closest('.hero'));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  toReveal.forEach(el => io.observe(el));
} else {
  toReveal.forEach(el => el.classList.add('in'));
}


/* ── 4. JENDELA DETAIL KEBAYA ──────────────────────────────── */
const ICON_CAL = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18"/><path d="M16 2v4M8 2v4M3 10h18"/></g></svg>';
const ICON_WA  = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

let dm, cm, lastFocus = null;
let photos = [], cur = 0, timer = null;

/* Markup jendela dibuat sekali, saat pertama kali dibuka */
function ensureModal() {
  if (dm) return;
  document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="detailModal" role="dialog" aria-modal="true" aria-labelledby="modalColor">
  <div class="modal-panel">
    <button class="modal-close" id="modalClose" type="button" aria-label="Tutup">Tutup ✕</button>
    <div class="modal-layout">
      <div class="modal-img-side"><img id="modalImg" src="" alt=""></div>
      <div class="modal-info-side">
        <p class="modal-badge" id="modalSeries"></p>
        <h2 class="modal-product-name" id="modalColor"></h2>
        <p class="modal-product-price" id="modalPrice"></p>
        <p class="modal-pkg-label">Paket termasuk</p>
        <ul class="modal-pkg-list" id="modalPkg"></ul>
        <div class="modal-actions">
          <button class="modal-btn-cal" id="btnKalender" type="button">${ICON_CAL}<span id="btnKalenderLabel">Cek Ketersediaan</span></button>
          <a class="modal-btn-wa" id="modalWa" href="#" target="_blank" rel="noopener">${ICON_WA}<span>Booking via WhatsApp</span></a>
        </div>
      </div>
    </div>
    <div class="modal-customer">
      <div class="mc-header"><span>Foto customer</span><span><span id="mcCur">1</span> / <span id="mcTotal">5</span></span></div>
      <div class="mc-viewer-wrap">
        <button class="mc-arrow" id="mcPrev" type="button" aria-label="Foto sebelumnya">←</button>
        <div class="mc-viewer" id="mcViewer">
          <img id="mcMainImg" src="" alt="Foto customer">
          <div class="mc-placeholder" id="mcPlaceholder"><span>Foto belum tersedia</span></div>
        </div>
        <button class="mc-arrow" id="mcNext" type="button" aria-label="Foto berikutnya">→</button>
      </div>
      <div class="mc-thumbs" id="mcThumbs"></div>
    </div>
  </div>
</div>
<div class="modal-overlay" id="calModal" role="dialog" aria-modal="true" aria-label="Ketersediaan tanggal">
  <div class="modal-panel modal-panel-cal">
    <button class="modal-close" id="calClose" type="button" aria-label="Tutup">Tutup ✕</button>
    <h3 class="cal-title">Ketersediaan<br>tanggal</h3>
    <iframe class="cal-frame" id="calFrame" src="" title="Kalender ketersediaan"></iframe>
    <p class="cal-note">Tanggal bertanda BOOKING = tidak tersedia (H-1, hari sewa, H+1).</p>
  </div>
</div>`);
  dm = $('#detailModal');
  cm = $('#calModal');

  $('#modalClose').addEventListener('click', closeModal);
  $('#calClose').addEventListener('click', closeCal);
  dm.addEventListener('click', e => { if (e.target === dm) closeModal(); });
  cm.addEventListener('click', e => { if (e.target === cm) closeCal(); });
  $('#mcPrev').addEventListener('click', () => { go(cur - 1); startAuto(); });
  $('#mcNext').addEventListener('click', () => { go(cur + 1); startAuto(); });
  let tx = 0;   // geser foto di HP
  $('#mcViewer').addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  $('#mcViewer').addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 36) { go(cur + (dx < 0 ? 1 : -1)); startAuto(); }
  }, { passive: true });
  const img = $('#modalImg');
  img.addEventListener('error', () => img.classList.add('broken'));
  img.addEventListener('load', () => img.classList.remove('broken'));
}

function openModal(it) {
  if (!it) return;
  ensureModal();
  lastFocus = document.activeElement;

  const img = $('#modalImg');
  img.classList.remove('broken');
  img.src = it.img;
  img.alt = `Kebaya ${it.series} ${it.color}`;
  $('#modalSeries').textContent = `${it.series} Series`;
  $('#modalColor').textContent = it.color;
  $('#modalPrice').textContent = it.priceTxt;
  $('#modalPkg').innerHTML = it.pkg.map(p => `<li>${esc(p)}</li>`).join('');

  const label = `${it.series} Series – ${it.color}`;
  $('#modalWa').href = waLink(`Halo Mojang.kebaya, saya ingin booking kebaya ${label} (${it.priceTxt}). Apakah tersedia untuk tanggal ...?`);
  $('#btnKalenderLabel').textContent = it.cal ? 'Cek Ketersediaan' : 'Tanya Ketersediaan';
  $('#btnKalender').onclick = () => it.cal
    ? openCal(it.cal)
    : window.open(waLink(`Halo Mojang.kebaya, apakah kebaya ${label} tersedia untuk tanggal ...?`), '_blank', 'noopener');

  buildSlides(it.photos);
  dm.classList.add('open');
  document.body.classList.add('no-scroll');
  dm.querySelector('.modal-panel').scrollTop = 0;
  $('#modalClose').focus({ preventScroll: true });
}

function closeModal() {
  if (!dm || !dm.classList.contains('open')) return;
  stopAuto();
  dm.classList.remove('open');
  document.body.classList.remove('no-scroll');
  lastFocus?.focus?.({ preventScroll: true });
}

/* Kalender Google */
function openCal(calId) {
  $('#calFrame').src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calId)}&ctz=Asia%2FJakarta&mode=MONTH&showTitle=0&showNav=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0`;
  cm.classList.add('open');
  $('#calClose').focus({ preventScroll: true });
}
function closeCal() {
  if (!cm || !cm.classList.contains('open')) return;
  cm.classList.remove('open');
  $('#calFrame').src = '';
  $('#btnKalender')?.focus({ preventScroll: true });
}

/* Foto customer */
function buildSlides(list) {
  photos = list.length ? list.slice(0, 5) : [''];
  cur = 0;
  const thumbs = $('#mcThumbs');
  thumbs.innerHTML = '';
  $('#mcTotal').textContent = photos.length;
  photos.forEach((src, i) => {
    const placeholder = () => {
      const p = document.createElement('div');
      p.className = 'mc-thumb-ph' + (i === cur ? ' active' : '');
      p.textContent = 'Foto ' + (i + 1);
      p.addEventListener('click', () => { go(i); startAuto(); });
      return p;
    };
    if (!src) { thumbs.appendChild(placeholder()); return; }
    const t = document.createElement('img');
    t.className = 'mc-thumb'; t.src = src; t.alt = 'Foto customer ' + (i + 1); t.loading = 'lazy';
    t.addEventListener('click', () => { go(i); startAuto(); });
    t.addEventListener('error', () => t.replaceWith(placeholder()), { once: true });
    thumbs.appendChild(t);
  });
  go(0);
  startAuto();
}
function go(i) {
  cur = (i + photos.length) % photos.length;
  [...$('#mcThumbs').children].forEach((t, k) => t.classList.toggle('active', k === cur));
  $('#mcCur').textContent = cur + 1;
  const main = $('#mcMainImg'), ph = $('#mcPlaceholder'), src = photos[cur];
  if (!src) { main.style.display = 'none'; ph.style.display = 'flex'; return; }
  main.onload  = () => { main.style.display = 'block'; ph.style.display = 'none'; };
  main.onerror = () => { main.style.display = 'none'; ph.style.display = 'flex'; };
  main.src = src;
}
function startAuto() { stopAuto(); if (photos.length > 1) timer = setInterval(() => go(cur + 1), 3600); }
function stopAuto()  { clearInterval(timer); timer = null; }

/* Klik / Enter pada kartu atau baris kebaya → buka detail */
const itemFrom = el => ITEMS[+el.dataset.id];
document.addEventListener('click', e => {
  const el = e.target.closest('.look[data-id], .row[data-id]');
  if (el && !e.target.closest('a')) openModal(itemFrom(el));
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (cm?.classList.contains('open')) closeCal();
    else if (dm?.classList.contains('open')) closeModal();
    else if (mnav?.classList.contains('open')) setMenu(false);
    return;
  }
  const el = e.target.closest?.('.look[data-id], .row[data-id]');
  if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openModal(itemFrom(el)); }
});


/* Dipakai home.js & katalog.js */
window.MOJANG = { ...D, card, bindMissing, pad, esc, waLink, openModal };
})();
