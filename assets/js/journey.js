/* =============================================================
   MOJANG.KEBAYA — Galeri 3D (scroll-driven)
   Komponen khusus untuk section .journey di index.html.

   Cara kerja
   - Setiap elemen [data-obj] adalah objek di ruang 3D (x, y, z dalam
     satuan vh; z negatif = makin jauh).
   - Sebuah "kamera" (x, y, z, yaw) digerakkan oleh timeline yang
     disinkronkan dengan posisi scroll:
       • GSAP + ScrollTrigger (dari CDN) bila tersedia,
       • mesin scroll bawaan sebagai cadangan bila CDN gagal dimuat.
   - Proyeksi memakai CSS 3D (perspective) — tidak butuh WebGL,
     jadi tidak ada risiko "WebGL tidak didukung".
   - Render hanya terjadi saat scroll/mouse bergerak (on demand);
     debu emas di <canvas> berhenti saat galeri tidak terlihat.
   - Mode 3D aktif di desktop DAN HP. Di layar tegak (HP/tablet portrait)
     dipakai tata letak potret: objek di atas, teks bab di bawah, scroll lebih
     pendek, debu emas lebih sedikit, foto dimuat lebih hemat.
   - Mode datar (bab berurutan) hanya untuk "Kurangi Gerakan"/reduced-motion
     dan perangkat sangat lemah.

   Isi: 1. Pengaturan · 2. Objek & timeline · 3. Render · 4. Mesin scroll
        5. Navigasi bab · 6. Parallax mouse · 7. Debu emas · 8. Mode
   ============================================================= */
(function () {
'use strict';
const jv = document.getElementById('jv');
const journey = jv && jv.closest('.journey');
if (!jv || !journey) return;

const root = document.documentElement;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);   // sama dengan GSAP 'power1.inOut' (kuadrat)
const home = () => window.MKHome || {};


/* ── 1. PENGATURAN ─────────────────────────────────────────── */
const MQ = '(prefers-reduced-motion: no-preference)';
const PERSP = 115;          // jarak mata ke layar, dalam vh
const VH_PER_SECOND = 52;   // panjang scroll (vh) untuk 1 detik timeline — desktop
const VH_PER_SECOND_P = 42; // … layar tegak (HP)
// perangkat sangat lemah tetap memakai mode datar
const LOW_END = !!(navigator.deviceMemory && navigator.deviceMemory <= 1);   // hanya Chrome Android yang melaporkan ini
const isPortrait = () => window.innerWidth < window.innerHeight * .9;
const SCRUB = .9;           // kehalusan kamera (detik) — GSAP scrub, desktop
const SCRUB_P = .5;         // … HP (scroll sentuh sudah punya momentum sendiri)
const TAU = .11, TAU_P = .085;  // kehalusan mesin cadangan (detik), desktop / HP
const CHAPTERS = ['potret', 'galeri', 'koleksi', 'detail', 'momen', 'sewa'];
const HASH_TO_CH = { '#home': 'potret', '#koleksi': 'koleksi', '#momen': 'momen' };

let active = false;
let U = 1;                  // px per vh
let objs = [];
let total = 1;
let segs = [];
let arrive = {};            // nama bab → waktu kamera tiba
let chStart = [];           // waktu bab mulai aktif
let frameTime = [];         // waktu kamera tiba di bingkai ke-i
let gateZ = -1820;
let curCh = -1;
let engine = null;
let lastT = 0;
let portrait = false;
let lastW = 0, lastH = 0;
let snapBox = null;

const cam = { x: 0, y: 0, z: 0, yaw: 0 };
const look = { x: 0, y: 0, tx: 0, ty: 0 };
const chEls = $$('.ch[data-ch]', jv);
const rail = $('#rail');
const railFill = $('#railFill');
const dawnEl = $('.dawn', jv);
let lastDawn = '', lastProg = '', dawnVal = 0;
const railBtns = rail ? $$('button[data-go]', rail) : [];


/* ── 2. OBJEK & TIMELINE ───────────────────────────────────── */
function collect() {
  // lebar lorong mengikuti lebar layar (HP sempit → lorong sempit)
  const vwU = window.innerWidth / ((jv.clientHeight || window.innerHeight) / 100);
  const wx = portrait ? clamp(vwU * .5, 22, 34) : 42;
  objs = $$('[data-obj]', jv).map(el => ({
    el,
    x: +el.dataset.x || 0, y: +el.dataset.y || 0, z: +el.dataset.z || 0, ry: +el.dataset.ry || 0,
    img: el.querySelector('img[data-src]'),
    vis: null, zi: null, opS: '', tf: '',
  }));
  // bingkai series berjajar kiri-kanan seperti lorong galeri
  objs.filter(o => o.el.classList.contains('frame')).forEach(o => {
    const i = +o.el.dataset.frame, left = i % 2 === 0;
    o.x = left ? -wx : wx; o.y = 0; o.z = -240 - i * 170; o.ry = left ? 30 : -30;
  });
  // di HP: dua lengkung Wisuda/Lamaran dirapatkan agar muat di layar sempit
  if (portrait) objs.filter(o => o.el.classList.contains('occ')).forEach(o => { o.x = Math.sign(o.x) * 17; });
}
const find = cls => objs.find(o => o.el.classList.contains(cls));

/* posisi kamera agar objek F terlihat dari jarak D (vh), kamera menoleh `yaw` derajat,
   objek tampil `off` vh ke kanan dari tengah layar (negatif = ke kiri)
   dan `up` vh di atas tengah layar */
function framing(F, yaw, D, off, up = 0) {
  const r = yaw * Math.PI / 180, o = off * D / PERSP;
  return {
    x: F.x - D * Math.sin(r) - o * Math.cos(r),
    y: F.y + up * D / PERSP,
    z: F.z + D * Math.cos(r) - o * Math.sin(r) - PERSP,
    yaw,
  };
}

function build() {
  U = (jv.clientHeight || window.innerHeight) / 100;   // 100svh: stabil saat address bar HP muncul/hilang
  lastW = window.innerWidth; lastH = window.innerHeight;
  const vwU = window.innerWidth / U;              // lebar layar dalam vh
  const frames = objs.filter(o => o.el.classList.contains('frame'));
  const det = find('detail'), occ = find('occ'), gate = find('gate');
  gateZ = gate ? gate.z : -1820;
  const S = [];
  let start;

  if (portrait) {
    /* ── HP / layar tegak: objek di ruang kosong di atas teks bab ──
       Tinggi teks tiap bab diukur langsung, lalu jarak & posisi kamera
       dihitung agar objek (beserta keterangannya) selalu muat di antara
       header dan teks — di HP pendek maupun panjang. */
    const hdrH = (document.querySelector('.hdr') || {}).offsetHeight || 62;
    const band = name => {
      const el = chEls[CHAPTERS.indexOf(name)];
      const topU = (hdrH + 14) / U;
      const botU = 100 - ((el ? el.offsetHeight : 240) + 34) / U;
      return { top: topU, bot: Math.max(topU + 24, botU) };
    };
    // objek w×h (vh) → { D: jarak kamera, up: geser ke atas } agar muat di pita bab
    const place = (name, w, h, share, minD) => {
      const b = band(name), s = Math.min(PERSP / (PERSP * minD), (b.bot - b.top) * .96 / h, share * vwU / w);
      return { D: PERSP / s, up: 50 - (b.top + b.bot) / 2 };
    };
    let k = place('potret', 40, 60, .8, 1.25);
    start = framing({ x: 0, y: 1, z: 0 }, 0, k.D, 0, k.up);
    S.push({ hold: .45 });
    k = band('galeri');
    S.push({ to: { x: 0, y: (50 - (k.top + k.bot) / 2) * 1.6, z: -150, yaw: 0 }, dur: 1.3, ch: 'galeri' });
    S.push({ hold: .25 });
    k = place('koleksi', 34, 59, .78, 1.18);
    frames.forEach((f, i) => {
      S.push({ to: framing(f, f.x < 0 ? -24 : 24, k.D, 0, k.up), dur: i ? .7 : .95, ch: i ? null : 'koleksi', frame: i });
      S.push({ hold: .25 });
    });
    if (det) {
      k = place('detail', 56, 46, .92, 1.1);
      const v = framing(det, 0, k.D, 0, k.up);
      S.push({ to: v, dur: 1.1, ch: 'detail' });
      S.push({ to: { z: v.z - 6 }, dur: .45, lin: true });
    }
    if (occ) {
      k = place('momen', 64, 58, .9, 1.4);
      S.push({ to: framing({ x: 0, y: 0, z: occ.z }, 0, k.D, 0, k.up), dur: 1.1, ch: 'momen' });
      S.push({ hold: .45 });
    }
    k = band('sewa');
    S.push({ to: { x: 0, y: (50 - (k.top + k.bot) / 2) * 1.75, z: gateZ + PERSP * .75, yaw: 0 }, dur: 1, ch: 'sewa' });
    S.push({ hold: .35 });
    S.push({ to: { x: 0, y: 0, z: gateZ - PERSP * .45, yaw: 0 }, dur: 1.05 });
    return finishBuild(S, start, VH_PER_SECOND_P);
  }

  /* ── desktop / layar lebar ── */
  const heroX = clamp(vwU * .2, 14, 40);          // potret di kanan, judul di kiri
  start = { x: -heroX, y: 0, z: 0, yaw: 0 };
  S.push({ hold: .5 });
  S.push({ to: { x: -18, y: -2, z: -150, yaw: -5 }, dur: 1.4, ch: 'galeri' });       // masuk lewat potret
  S.push({ hold: .3 });
  frames.forEach((f, i) => {
    const left = f.x < 0;
    // bingkai selalu tampil di kanan-tengah, teks bab tetap di kiri
    S.push({ to: framing(f, left ? -20 : 20, PERSP * 1.12, Math.min(vwU * .15, 26)), dur: i ? .75 : 1, ch: i ? null : 'koleksi', frame: i });
    S.push({ hold: .22 });
  });
  if (det) {
    const D = PERSP * 1.1, wS = 90 * PERSP / D;                                       // lebar foto detail di layar
    const v = framing(det, 0, D, vwU * .03 - wS / 2);                                 // tepi kanan foto ≈ 53% layar
    S.push({ to: v, dur: 1.15, ch: 'detail' });
    S.push({ to: { z: v.z - 8 }, dur: .5, lin: true });                               // dorongan pelan
  }
  if (occ) {
    S.push({ to: framing({ x: 0, y: 0, z: occ.z }, 0, PERSP * 1.25, Math.min(vwU * .22, 34)), dur: 1.15, ch: 'momen' });
    S.push({ hold: .45 });
  }
  S.push({ to: { x: 0, y: 0, z: gateZ + PERSP * .62, yaw: 0 }, dur: 1, ch: 'sewa' });
  S.push({ hold: .35 });
  S.push({ to: { x: 0, y: 0, z: gateZ - PERSP * .45, yaw: 0 }, dur: 1.05 });          // menembus lingkaran → terang
  return finishBuild(S, start, VH_PER_SECOND);
}

function finishBuild(S, start, vhPerSecond) {
  // waktu & posisi awal tiap segmen
  let t = 0, cur = { ...start };
  arrive = { potret: 0 };
  chStart = [0];
  frameTime = [];
  segs = S.map(s => {
    const dur = s.hold || s.dur;
    const from = { ...cur };
    const to = { ...cur, ...(s.to || {}) };
    const seg = { t0: t, t1: t + dur, dur, from, to, lin: !!s.lin, hold: !!s.hold };
    if (s.ch) { arrive[s.ch] = t + dur; chStart[CHAPTERS.indexOf(s.ch)] = t + dur * .55; }
    if (s.frame != null) frameTime[s.frame] = t + dur;
    t += dur; cur = to;
    return seg;
  });
  total = t;
  journey.style.setProperty('--jh', Math.round(total * vhPerSecond + 100) + 'vh');
  Object.assign(cam, start);
}

/* posisi kamera pada waktu t (dipakai mesin cadangan) */
function sample(t) {
  const s = segs.find(g => t <= g.t1) || segs[segs.length - 1];
  const k = s.hold ? 1 : clamp((t - s.t0) / s.dur);
  const e = s.lin ? k : ease(k);
  for (const p in s.to) cam[p] = s.from[p] + (s.to[p] - s.from[p]) * e;
}


/* ── 3. RENDER ─────────────────────────────────────────────── */
function render(t) {
  if (!active) return;
  lastT = t;
  const P = PERSP * U;
  const yawDeg = cam.yaw + look.x * 1.4;
  const yaw = yawDeg * Math.PI / 180, sin = Math.sin(yaw), cos = Math.cos(yaw);
  const cx = cam.x + look.x * 1.8, cy = cam.y + look.y * 1.2;

  // kabut: di hero ruang galeri masih tertutup, terbuka saat kamera masuk
  const enter = clamp(-cam.z / 140);
  const farEnd = (2.1 + (portrait ? 1.8 : 3.6) * enter) * P, farLen = (.6 + (portrait ? .6 : 1.6) * enter) * P;   // HP: kabut lebih dekat → layar lebih bersih

  for (const o of objs) {
    const dx = (o.x - cx) * U, dy = (o.y - cy) * U, dz = (o.z - cam.z) * U;
    const dist = -(-dx * sin + (dz - P) * cos);                 // jarak dari mata
    let op = 0;
    if (dist > .55 * P) op = clamp((dist - .55 * P) / (.45 * P)) * clamp((farEnd - dist) / farLen);
    const vis = op > .01;
    if (vis !== o.vis) {
      o.vis = vis;
      // tetap bisa difokus keyboard (tidak memakai visibility:hidden) — fokus membawa kamera ke objek
      o.el.style.pointerEvents = vis ? '' : 'none';
      o.el.classList.toggle('is-off', !vis);          // animasi titik emas berhenti saat objek tak terlihat
      if (!vis) { o.el.style.opacity = '0'; o.el.style.transform = 'scale(.001)'; o.opS = '0'; o.tf = ''; }
    }
    if (!vis) continue;
    if (o.img && dist < (portrait ? 6 : 14) * P) { (home().loadImg || (() => {}))(o.img); o.img = null; }
    // tulis ke DOM hanya bila nilainya berubah (lebih ringan di HP)
    const opS = op > .995 ? '1' : op.toFixed(2);
    if (opS !== o.opS) { o.el.style.opacity = opS; o.opS = opS; }
    const tf =
      `perspective(${P.toFixed(1)}px) translate3d(0,0,${P.toFixed(1)}px) rotateY(${yawDeg.toFixed(2)}deg) ` +
      `translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,${(dz - P).toFixed(1)}px) rotateY(${o.ry}deg)`;
    if (tf !== o.tf) { o.el.style.transform = tf; o.tf = tf; }
    const zi = 100000 - Math.round(dist);
    if (zi !== o.zi) { o.el.style.zIndex = zi; o.zi = zi; }
  }

  // bab aktif
  let ci = 0;
  for (let i = 0; i < chStart.length; i++) if (t >= chStart[i]) ci = i;
  if (ci !== curCh) setChapter(ci);

  // terang di akhir (menyambung ke section ivory)
  const dawn = clamp((gateZ + PERSP * .25 - cam.z) / (PERSP * .62));
  // variabel CSS hanya ditulis ke elemen yang memakainya & hanya bila berubah
  // (menulis ke #jv setiap frame membuat seluruh galeri dihitung ulang → patah-patah di HP)
  const dawnS = dawn.toFixed(3);
  if (dawnS !== lastDawn) { lastDawn = dawnS; dawnVal = dawn; dawnEl?.style.setProperty('--dawn', dawnS); rail?.style.setProperty('--dawn', dawnS); }
  const isDawn = dawn > .55;
  if (isDawn !== jv.classList.contains('is-dawn')) { jv.classList.toggle('is-dawn', isDawn); home().syncHeader?.(); }
  const progS = (t / total).toFixed(3);
  if (railFill && progS !== lastProg) { lastProg = progS; railFill.style.transform = (portrait ? 'scaleX(' : 'scaleY(') + progS + ')'; }
  dust.draw();
}

function setChapter(ci) {
  curCh = ci;
  chEls.forEach(el => el.classList.toggle('is-on', +el.dataset.ch === ci));
  railBtns.forEach((b, i) => {
    b.classList.toggle('is-on', i === ci);
    if (i === ci) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
}


/* ── 4. MESIN SCROLL ───────────────────────────────────────── */
function gsapEngine() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });   // address bar HP tidak memicu hitung ulang
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power1.inOut' } });
  segs.forEach(s => {
    if (s.hold) tl.to({}, { duration: s.dur });
    else tl.fromTo(cam, { ...s.from }, { ...s.to, duration: s.dur, ease: s.lin ? 'none' : 'power1.inOut', immediateRender: false });
  });
  tl.eventCallback('onUpdate', () => render(tl.time()));
  const st = ScrollTrigger.create({ trigger: journey, start: 'top top', end: 'bottom bottom', scrub: portrait ? SCRUB_P : SCRUB, animation: tl });
  tl.progress(st.progress);
  render(tl.time());
  return {
    name: 'gsap',
    toY: t => st.start + (st.end - st.start) * (t / total),
    destroy() { st.kill(); tl.kill(); },
  };
}

function nativeEngine() {
  let top = 0, len = 1, target = 0, current = 0, raf = 0, last = 0;
  const measure = () => {
    top = journey.getBoundingClientRect().top + window.scrollY;
    len = Math.max(1, journey.offsetHeight - window.innerHeight);
  };
  const step = now => {
    const dt = Math.min(64, last ? now - last : 16);
    last = now;
    current += (target - current) * (1 - Math.exp(-dt / ((portrait ? TAU_P : TAU) * 1000)));
    if (Math.abs(target - current) * len < .4) current = target;      // < 0,4 px → selesai
    sample(current * total);
    render(current * total);
    raf = current !== target ? requestAnimationFrame(step) : (last = 0, 0);
  };
  const onScroll = () => {
    target = clamp((window.scrollY - top) / len);
    if (!raf) raf = requestAnimationFrame(step);
  };
  measure();
  target = current = clamp((window.scrollY - top) / len);
  sample(current * total); render(current * total);
  window.addEventListener('scroll', onScroll, { passive: true });
  return {
    name: 'native',
    measure,
    toY: t => top + len * (t / total),
    destroy() { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); },
  };
}


/* titik henti scroll di HP: setiap bab & bingkai berhenti di komposisi yang rapi
   (scroll-snap "proximity" — hanya menarik jika jari berhenti di dekatnya) */
function placeSnaps() {
  if (snapBox) { snapBox.remove(); snapBox = null; }
  if (!portrait || !engine) return;
  const top = engine.toY(0), len = engine.toY(total) - top;
  const times = [...new Set([0, ...Object.values(arrive), ...frameTime])].filter(t => t < total - .01).sort((a, b) => a - b);
  snapBox = document.createElement('div');
  snapBox.className = 'snaps';
  snapBox.setAttribute('aria-hidden', 'true');
  snapBox.innerHTML = times.map(t => `<i style="top:${Math.round(len * t / total)}px"></i>`).join('');
  journey.appendChild(snapBox);
}

/* ── 5. NAVIGASI BAB ───────────────────────────────────────── */
function goTime(t, smooth = true) {
  if (!engine) return;
  window.scrollTo({ top: Math.round(engine.toY(t)) + 2, behavior: smooth ? 'smooth' : 'auto' });
}
function go(name, smooth = true) {
  if (!(name in arrive)) return false;
  goTime(arrive[name], smooth);
  return true;
}

document.addEventListener('click', e => {
  if (!active) return;
  const el = e.target.closest('[data-go], a[href^="#"]');
  if (!el) return;
  const name = el.dataset.go || HASH_TO_CH[el.getAttribute('href')];
  if (name && go(name)) e.preventDefault();
});

// keyboard: elemen yang difokus di dalam galeri dibawa ke depan kamera
jv.addEventListener('focusin', e => {
  if (!active || !e.target.matches(':focus-visible')) return;
  const fr = e.target.closest('.frame');
  if (fr) return goTime(frameTime[+fr.dataset.frame] ?? arrive.koleksi);
  const holder = e.target.closest('[data-ch], .portal, .detail, .occ');
  if (!holder || holder.classList.contains('rail')) return;
  const name = holder.dataset.ch != null ? CHAPTERS[+holder.dataset.ch]
    : holder.classList.contains('portal') ? 'potret'
    : holder.classList.contains('detail') ? 'detail' : 'momen';
  if (CHAPTERS.indexOf(name) !== curCh) go(name);
});


/* ── 6. PARALLAX MOUSE (halus, berhenti sendiri) ───────────── */
let lookRaf = 0;
const lookStep = () => {
  look.x += (look.tx - look.x) * .06;
  look.y += (look.ty - look.y) * .06;
  render(lastT);
  lookRaf = Math.abs(look.tx - look.x) + Math.abs(look.ty - look.y) > .002 ? requestAnimationFrame(lookStep) : 0;
};
const onMouse = e => {
  look.tx = (e.clientX / window.innerWidth - .5) * 2;
  look.ty = (e.clientY / window.innerHeight - .5) * 2;
  if (!lookRaf) lookRaf = requestAnimationFrame(lookStep);
};


/* ── 7. DEBU EMAS (canvas 2D ringan) ───────────────────────── */
const dust = (() => {
  const cv = $('#dust');
  const ctx = cv && cv.getContext && cv.getContext('2d');
  let parts = [], w = 0, h = 0, dpr = 1, on = false, visible = false, raf = 0, t0 = 0;
  const seed = () => {
    parts = Array.from({ length: portrait ? 45 : 150 }, () => ({
      x: (Math.random() - .5) * 260, y: (Math.random() - .5) * 120,
      z: 80 - Math.random() * 2100, r: .6 + Math.random() * 1.6,
      s: .4 + Math.random() * .8, ph: Math.random() * Math.PI * 2,
    }));
  };
  const size = () => {
    if (!cv) return;
    dpr = Math.min(portrait ? 1 : 1.5, window.devicePixelRatio || 1);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  };
  function draw(now) {
    if (!ctx || !on) return;
    const time = (now || performance.now()) / 1000;
    const P = PERSP * U;
    const yaw = (cam.yaw + look.x * 1.4) * Math.PI / 180, sin = Math.sin(yaw), cos = Math.cos(yaw);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const fade = 1 - clamp(dawnVal * 1.6);
    if (fade <= 0) return;
    for (const p of parts) {
      const yy = ((p.y - time * p.s * 1.4 + 60) % 120 + 120) % 120 - 60;  // naik perlahan
      const dx = (p.x - cam.x) * U, dy = (yy - cam.y) * U, dz = (p.z - cam.z) * U;
      const xr = dx * cos + (dz - P) * sin, zr = -dx * sin + (dz - P) * cos;
      const dist = -zr;
      if (dist < 40 || dist > 9 * P) continue;
      const k = P / dist;
      const sx = w / 2 + xr * k, sy = h / 2 + dy * k;
      if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;
      const a = clamp(1 - dist / (9 * P)) * (.45 + .35 * Math.sin(time * 1.3 + p.ph)) * fade;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#E8C893';
      ctx.beginPath();
      ctx.arc(sx, sy, Math.min(4, p.r * k * .9), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  let lastDraw = 0;
  const loop = now => {
    if (!portrait || now - lastDraw > 32) { draw(now); lastDraw = now; }   // HP: ±30 fps sudah cukup
    raf = on && visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => { if (on && visible && !raf) raf = requestAnimationFrame(loop); };
  if (cv && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(journey);
  }
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('resize', () => { if (on) size(); });
  return {
    draw: () => { if (!raf) draw(); },
    start() { if (!ctx) return; on = true; seed(); size(); kick(); },
    stop() { on = false; cancelAnimationFrame(raf); raf = 0; if (ctx) ctx.clearRect(0, 0, cv.width, cv.height); },
  };
})();


/* ── 8. MODE 3D / DATAR ────────────────────────────────────── */
function enable() {
  if (active) return;
  active = true;
  portrait = isPortrait();
  root.classList.add('is-3d');
  root.classList.toggle('is-portrait', portrait);
  collect();
  build();
  curCh = -1;
  engine = (window.gsap && window.ScrollTrigger) ? gsapEngine() : nativeEngine();
  if (engine.name === 'native') console.info('Mojang.kebaya: GSAP tidak tersedia — memakai mesin scroll cadangan.');
  if (matchMedia('(hover: hover)').matches) window.addEventListener('mousemove', onMouse, { passive: true });
  dust.start();
  placeSnaps();
  const target = HASH_TO_CH[location.hash];
  if (target && location.hash !== '#home') go(target, false);
}

function disable() {
  if (!active) return;
  engine && engine.destroy();
  engine = null;
  active = false;
  window.removeEventListener('mousemove', onMouse);
  cancelAnimationFrame(lookRaf); lookRaf = 0;
  dust.stop();
  placeSnaps();
  root.classList.remove('is-3d', 'is-portrait');
  journey.style.removeProperty('--jh');
  dawnEl?.style.removeProperty('--dawn'); rail?.style.removeProperty('--dawn');
  if (railFill) railFill.style.removeProperty('transform');
  lastDawn = lastProg = ''; dawnVal = 0;
  jv.classList.remove('is-dawn');
  objs.forEach(o => { ['transform', 'opacity', 'pointer-events', 'z-index'].forEach(k => o.el.style.removeProperty(k)); o.el.classList.remove('is-off'); });
  (home().loadAll || (() => {}))();
  home().syncHeader?.();
}

let rT = 0;
function rebuild() {
  if (!active) return;
  const keep = lastT / total;
  engine.destroy();
  const p = isPortrait();
  if (p !== portrait) { portrait = p; root.classList.toggle('is-portrait', p); collect(); dust.stop(); dust.start(); }
  build();
  engine = (window.gsap && window.ScrollTrigger) ? gsapEngine() : nativeEngine();
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  if (engine.measure) engine.measure();
  placeSnaps();
  sample(keep * total); render(keep * total);
}
function onResize() {
  clearTimeout(rT);
  rT = setTimeout(() => {
    if (!active) return;
    // address bar HP muncul/hilang hanya mengubah tinggi sedikit → abaikan
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 160) return;
    rebuild();
  }, 180);
}
// tinggi teks bab berubah setelah font selesai dimuat → hitung ulang posisi kamera (HP)
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (active && portrait) rebuild(); });

const mq = window.matchMedia(MQ);
const apply = () => (mq.matches && !LOW_END ? enable() : disable());
mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
window.addEventListener('resize', onResize);
apply();

window.MKJourney = { active: () => active, go, engine: () => engine && engine.name, state: () => ({ cam: { ...cam }, t: lastT, total, arrive: { ...arrive } }) };
})();
