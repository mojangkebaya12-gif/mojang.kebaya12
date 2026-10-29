/* =============================================================
   MOJANG.KEBAYA — Halaman Katalog
   Butuh data.js dan main.js dimuat lebih dulu.

   Filter (series, warna, harga, koleksi baru), pencarian, urutan, tampilan.
   Filter tersimpan di alamat halaman, jadi bisa dibagikan, mis.
   katalog.html?series=geulis&warna=pink
   ============================================================= */
(function () {
'use strict';
const { SERIES, FAMILIES, ITEMS, card, bindMissing, pad, esc } = window.MOJANG;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const PRICES = [...new Set(ITEMS.map(i => i.price))].sort((a, b) => a - b);
const SORTS = { series:'Per series', rekomendasi:'Rekomendasi', murah:'Harga terendah', mahal:'Harga tertinggi', az:'Nama A–Z' };
const VIEWS = { grid:'Grid', besar:'Besar', daftar:'Daftar' };

/* ── STATE ⇄ URL ── */
const st = { q:'', series:new Set(), fam:new Set(), price:new Set(), baru:false, sort:'series', view:'grid' };
(function readURL() {
  const p = new URLSearchParams(location.search);
  const list = k => (p.get(k) || '').split(',').filter(Boolean);
  list('series').filter(k => SERIES[k]).forEach(k => st.series.add(k));
  list('warna').filter(k => FAMILIES[k]).forEach(k => st.fam.add(k));
  list('harga').map(Number).filter(n => PRICES.includes(n)).forEach(n => st.price.add(n));
  st.baru = p.get('baru') === '1';
  st.q = p.get('q') || '';
  if (SORTS[p.get('sort')]) st.sort = p.get('sort');
  if (VIEWS[p.get('view')]) st.view = p.get('view');
  else { try { const v = localStorage.getItem('mk-view'); if (VIEWS[v]) st.view = v; } catch (e) {} }
})();
function writeURL() {
  const p = new URLSearchParams();
  if (st.series.size) p.set('series', [...st.series].join(','));
  if (st.fam.size) p.set('warna', [...st.fam].join(','));
  if (st.price.size) p.set('harga', [...st.price].join(','));
  if (st.baru) p.set('baru', '1');
  if (st.q) p.set('q', st.q);
  if (st.sort !== 'series') p.set('sort', st.sort);
  if (st.view !== 'grid') p.set('view', st.view);
  const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
}

/* ── FILTER ── */
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function match(it, skip) {
  if (skip !== 'series' && st.series.size && !st.series.has(it.s)) return false;
  if (skip !== 'fam' && st.fam.size && !st.fam.has(it.fam)) return false;
  if (skip !== 'price' && st.price.size && !st.price.has(it.price)) return false;
  if (skip !== 'baru' && st.baru && !it.isNew) return false;
  if (st.q) {
    const hay = norm(`${it.series} ${it.color} ${FAMILIES[it.fam]} ${it.isNew ? 'baru new' : ''} ${it.price}`);
    if (!norm(st.q).split(/\s+/).every(w => hay.includes(w))) return false;
  }
  return true;
}
function sorted(list) {
  const order = Object.keys(SERIES);
  const by = {
    series: (a, b) => order.indexOf(a.s) - order.indexOf(b.s) || (b.isNew - a.isNew) || a.id - b.id,
    rekomendasi: (a, b) => (b.isNew - a.isNew) || ((a.fav || 99) - (b.fav || 99)) || a.id - b.id,
    murah: (a, b) => a.price - b.price || a.id - b.id,
    mahal: (a, b) => b.price - a.price || a.id - b.id,
    az: (a, b) => a.color.localeCompare(b.color, 'id') || a.series.localeCompare(b.series),
  }[st.sort];
  return [...list].sort(by);
}

/* ── SIDEBAR FILTER (dibangun sekali, angka diperbarui) ── */
const side = $('#filters');
side.innerHTML = `
  <div class="f-grp"><p class="f-h t-xs"><span>01</span>Cari</p>
    <label class="f-search"><input id="fq" type="search" placeholder="Nama warna, series…" autocomplete="off" value="${esc(st.q)}"><span aria-hidden="true">↵</span></label></div>
  <div class="f-grp"><p class="f-h t-xs"><span>02</span>Series</p>
    ${Object.entries(SERIES).map(([k, s]) => `<label class="f-opt"><input type="checkbox" data-f="series" value="${k}"><span class="box"></span><span class="lb">${s.name}</span><span class="ct" data-ct="series:${k}"></span></label>`).join('')}</div>
  <div class="f-grp"><p class="f-h t-xs"><span>03</span>Warna</p>
    <div class="f-sw">${Object.entries(FAMILIES).map(([k, n]) => {
      const hx = ITEMS.find(i => i.fam === k)?.hex || '#ccc';
      return `<label class="f-chip"><input type="checkbox" data-f="fam" value="${k}"><i style="background:${hx}"></i><span class="lb">${n}</span><span class="ct" data-ct="fam:${k}"></span></label>`;
    }).join('')}</div></div>
  <div class="f-grp"><p class="f-h t-xs"><span>04</span>Harga sewa</p>
    ${PRICES.map(p => `<label class="f-opt"><input type="checkbox" data-f="price" value="${p}"><span class="box"></span><span class="lb">Rp ${(p * 1000).toLocaleString('id-ID')}</span><span class="ct" data-ct="price:${p}"></span></label>`).join('')}</div>
  <div class="f-grp"><p class="f-h t-xs"><span>05</span>Lainnya</p>
    <label class="f-opt f-toggle"><input type="checkbox" data-f="baru"><span class="sw-t"></span><span class="lb">Hanya koleksi baru</span><span class="ct" data-ct="baru"></span></label></div>
  <button class="f-reset t-xs" type="button" data-reset>Reset semua filter</button>`;

const sortSel = $('#sortSel');
sortSel.innerHTML = Object.entries(SORTS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
const viewBox = $('#viewBox');
viewBox.innerHTML = Object.entries(VIEWS).map(([k, v]) => `<button type="button" data-view="${k}" aria-pressed="false">${v}</button>`).join('');

function syncControls() {
  $$('input[data-f]', side).forEach(inp => {
    const f = inp.dataset.f;
    inp.checked = f === 'baru' ? st.baru : st[f].has(f === 'price' ? +inp.value : inp.value);
  });
  sortSel.value = st.sort;
  $$('[data-view]', viewBox).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === st.view)));
  $$('.qs-card').forEach(c => c.classList.toggle('on', st.series.has(c.dataset.k)));
}
function updateCounts() {
  const cnt = (skip, test) => ITEMS.filter(it => match(it, skip) && test(it)).length;
  $$('[data-ct]', side).forEach(el => {
    const [f, v] = el.dataset.ct.split(':');
    const n = f === 'series' ? cnt('series', i => i.s === v)
      : f === 'fam' ? cnt('fam', i => i.fam === v)
      : f === 'price' ? cnt('price', i => i.price === +v)
      : cnt('baru', i => i.isNew);
    el.textContent = pad(n);
    el.closest('label').classList.toggle('zero', n === 0 && !el.closest('label').querySelector('input').checked);
  });
}

/* ── RENDER HASIL ── */
const out = $('#results'), countEl = $('#resCount'), chips = $('#activeChips');
function rowHTML(it, no) {
  return `<div class="row" data-id="${it.id}" tabindex="0" role="button" aria-label="Lihat detail ${esc(it.series)} ${esc(it.color)}">
    <span class="r-no">${pad(no)}</span>
    <span class="row-thumb"><img src="${it.img}" alt="" loading="lazy"></span>
    <span class="r-nm">${esc(it.color)}${it.isNew ? ' <em>Baru</em>' : ''}</span>
    <span class="r-se">${esc(it.series)}</span>
    <span class="r-cl"><i class="sw" style="background:${it.hex}"></i>${FAMILIES[it.fam]}</span>
    <span class="r-ld">${it.ld || '—'}</span>
    <span class="r-pr">${it.price}K</span>
    <span class="r-go">Detail +</span>
  </div>`;
}
function groupHead(k, n, i) {
  const s = SERIES[k];
  return `<div class="g-head">
    <span class="g-no t-xs t-mute">${pad(i)}</span>
    <h3>${s.name}</h3>
    <p class="g-meta t-xs">${pad(n)} Warna${s.ld ? ' · ' + s.ld : ''}</p>
    <p class="g-desc">${s.desc}</p>
  </div>`;
}
function render() {
  const list = sorted(ITEMS.filter(it => match(it)));
  countEl.textContent = pad(list.length);
  $('#resCount2').textContent = list.length;
  out.dataset.view = st.view;

  if (!list.length) {
    out.innerHTML = `<div class="empty"><p class="big">Tidak ada kebaya<br>yang cocok.</p><p class="t-xs t-mute">Coba kurangi filter atau ubah kata pencarian.</p><button class="ulink" type="button" data-reset>Reset filter</button></div>`;
  } else if (st.view === 'daftar') {
    out.innerHTML = `<div class="rows"><div class="row row-h t-xs"><span class="r-no">No.</span><span class="row-thumb"></span><span class="r-nm">Warna</span><span class="r-se">Series</span><span class="r-cl">Keluarga</span><span class="r-ld">Ukuran</span><span class="r-pr">Harga</span><span class="r-go"></span></div>${list.map((it, i) => rowHTML(it, i + 1)).join('')}</div>`;
  } else if (st.sort === 'series') {
    let html = '', n = 0;
    Object.keys(SERIES).forEach(k => {
      const g = list.filter(i => i.s === k); if (!g.length) return;
      html += `<section class="group">${groupHead(k, g.length, Object.keys(SERIES).indexOf(k) + 1)}<div class="cards">${g.map(it => card(it, ++n, Math.min(n, 8) * 35)).join('')}</div></section>`;
    });
    out.innerHTML = html;
  } else {
    out.innerHTML = `<div class="cards">${list.map((it, i) => card(it, i + 1, Math.min(i, 8) * 35)).join('')}</div>`;
  }
  bindMissing(out);

  // chip filter aktif
  const act = [];
  st.series.forEach(k => act.push(['series', k, SERIES[k].name]));
  st.fam.forEach(k => act.push(['fam', k, FAMILIES[k]]));
  st.price.forEach(p => act.push(['price', p, p + 'K']));
  if (st.baru) act.push(['baru', '1', 'Baru']);
  if (st.q) act.push(['q', '', `“${st.q}”`]);
  chips.innerHTML = act.map(([f, v, l]) => `<button type="button" class="chip" data-rm="${f}" data-v="${esc(v)}">${esc(l)} <span aria-hidden="true">✕</span></button>`).join('');
  const nAct = act.length;
  $$('[data-fcount]').forEach(el => { el.textContent = nAct ? `(${nAct})` : ''; });

  syncControls(); updateCounts(); writeURL();
}

/* ── EVENT ── */
side.addEventListener('change', e => {
  const inp = e.target.closest('input[data-f]'); if (!inp) return;
  const f = inp.dataset.f;
  if (f === 'baru') st.baru = inp.checked;
  else { const v = f === 'price' ? +inp.value : inp.value; inp.checked ? st[f].add(v) : st[f].delete(v); }
  render();
});
let qT;
$('#fq').addEventListener('input', e => { clearTimeout(qT); qT = setTimeout(() => { st.q = e.target.value.trim(); render(); }, 160); });
sortSel.addEventListener('change', () => { st.sort = sortSel.value; render(); });
viewBox.addEventListener('click', e => {
  const b = e.target.closest('[data-view]'); if (!b) return;
  st.view = b.dataset.view; try { localStorage.setItem('mk-view', st.view); } catch (err) {}
  render();
});
document.addEventListener('click', e => {
  if (e.target.closest('[data-reset]')) {
    st.series.clear(); st.fam.clear(); st.price.clear(); st.baru = false; st.q = ''; $('#fq').value = '';
    render(); return;
  }
  const rm = e.target.closest('[data-rm]');
  if (rm) {
    const f = rm.dataset.rm, v = rm.dataset.v;
    if (f === 'baru') st.baru = false;
    else if (f === 'q') { st.q = ''; $('#fq').value = ''; }
    else st[f].delete(f === 'price' ? +v : v);
    render();
  }
});

/* ── PILIH SERIES CEPAT (strip atas) ── */
const qs = $('#quickSeries');
if (qs) {
  qs.innerHTML = Object.entries(SERIES).map(([k, s], i) => {
    const its = ITEMS.filter(x => x.s === k);
    const cover = (its.find(x => x.fav) || its.find(x => !x.isNew) || its[0]).img;
    const nw = its.filter(x => x.isNew).length;
    return `<button type="button" class="qs-card" data-k="${k}" aria-label="Filter ${s.name}">
      <span class="qs-img"><img src="${cover}" alt="" loading="lazy"></span>
      <span class="qs-meta t-xs"><span>${pad(i + 1)}</span><b>${s.name}</b><span>${pad(its.length)}${nw ? ' · ' + nw + ' baru' : ''}</span></span>
    </button>`;
  }).join('');
  $$('.qs-img img', qs).forEach(img => img.addEventListener('error', () => img.parentElement.classList.add('miss'), { once: true }));
  qs.addEventListener('click', e => {
    const c = e.target.closest('.qs-card'); if (!c) return;
    const k = c.dataset.k;
    st.series.has(k) && st.series.size === 1 ? st.series.clear() : (st.series.clear(), st.series.add(k));
    render();
    $('#hasil').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ── FILTER DI HP (muncul dari bawah) ── */
const shell = $('#filterShell');
const openSheet = o => { shell.classList.toggle('open', o); document.body.classList.toggle('no-scroll', o); $('#filterBtn').setAttribute('aria-expanded', String(o)); };
$('#filterBtn').addEventListener('click', () => openSheet(true));
$$('[data-close-sheet]').forEach(b => b.addEventListener('click', () => openSheet(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && shell.classList.contains('open')) openSheet(false); });
matchMedia('(min-width:1000px)').addEventListener('change', m => { if (m.matches) openSheet(false); });

/* ── sticky bar: tandai saat menempel ── */
const bar = $('#resBar');
if ('IntersectionObserver' in window && bar) {
  const s = document.createElement('div'); s.style.height = '1px'; bar.before(s);
  new IntersectionObserver(([e]) => bar.classList.toggle('stuck', !e.isIntersecting), { rootMargin: '-60px 0px 0px 0px' }).observe(s);
}

render();
})();
