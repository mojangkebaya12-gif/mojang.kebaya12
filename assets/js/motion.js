/* =============================================================
   MOJANG.KEBAYA — MESIN ANIMASI
   GSAP + ScrollTrigger (animasi mengikuti scroll) dan Lenis (scroll halus).
   Bila pustaka gagal dimuat, pengguna meminta "kurangi gerakan", atau
   jam animasi browser tidak berjalan, semua konten langsung tampil normal.
   ============================================================= */
(function () {
'use strict';

const root = document.documentElement;
const loader = document.getElementById('loader');
const hideLoader = () => { if (loader) loader.style.display = 'none'; };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce || !window.gsap || !window.ScrollTrigger || !root.classList.contains('anim')) { hideLoader(); return; }

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const hidden = [];                                  // elemen yang disembunyikan di awal (untuk pengaman)
const keep = t => { hidden.push(...gsap.utils.toArray(t)); return t; };

/* ── Scroll halus (Lenis) ── */
let lenis = null;
if (window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.MOJANG_SCROLL = el => lenis.scrollTo(el, { offset: -70, duration: 1.4 });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); lenis.scrollTo(0, { duration: 1.6 }); return; }
    const t = document.querySelector(id); if (!t) return;
    e.preventDefault();
    lenis.scrollTo(t, { offset: -70, duration: 1.4 });
  });
  // area yang punya scroll sendiri
  $$('#sheet, .drawer-panel, #hViewport').forEach(el => el.setAttribute('data-lenis-prevent', ''));
  // berhenti saat menu atau detail kebaya terbuka
  new MutationObserver(() => (document.body.classList.contains('lock') ? lenis.stop() : lenis.start()))
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

/* ── Layar pembuka → intro panggung ── */
const heroImg = $('#heroMain img');
let ready = false;
Promise.all([
  document.fonts ? document.fonts.ready : null,
  heroImg && !heroImg.complete ? new Promise(r => { heroImg.onload = heroImg.onerror = r; }) : null,
]).then(() => { ready = true; });
setTimeout(() => { ready = true; }, 4000);

gsap.set('.stage-kebaya', { xPercent: -50, x: 0 });
keep(['.stage-title i', '.stage-kebaya', '.top', '.stage-meta', '.scroll-cue']);
gsap.set('.stage-title i', { yPercent: 110, opacity: 0 });
gsap.set('.stage-kebaya', { y: 140, opacity: 0 });
gsap.set(['.top', '.stage-meta', '.scroll-cue'], { opacity: 0, y: 24 });

function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (loader) {
    tl.to('.loader-in', { opacity: 0, y: -24, duration: .5, ease: 'power2.in' })
      .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '<.1')
      .set(loader, { display: 'none' });
  }
  tl.to('.stage-title i', { yPercent: 0, opacity: 1, duration: 1.7, stagger: .07 }, loader ? '-=.55' : 0)
    .to('.stage-kebaya', { y: 0, opacity: 1, duration: 2 }, '<.15')
    .to('.top', { opacity: 1, y: 0, duration: 1.2 }, '<.5')
    .to(['.stage-meta', '.scroll-cue'], { opacity: 1, y: 0, duration: 1.3, stagger: .12 }, '<.1');
}
if (loader) {
  loader.style.animation = 'none';                 // JavaScript mengambil alih dari animasi cadangan CSS
  const num = $('#loadNum'), c = { v: 0 };
  gsap.to(c, {
    v: 100, duration: 1.8, ease: 'power2.inOut',
    onUpdate: () => { num.textContent = Math.round(c.v); },
    onComplete: () => { const go = () => (ready ? intro() : setTimeout(go, 80)); go(); },
  });
} else intro();

/* ── Panggung: parallax kursor & efek saat digulir ── */
if (fine) {
  const tx = gsap.quickTo('.stage-title span', 'x', { duration: 1.4, ease: 'power3' });
  const kx = gsap.quickTo('.stage-kebaya .cut', 'x', { duration: 1.4, ease: 'power3' });
  const ky = gsap.quickTo('.stage-kebaya .cut', 'y', { duration: 1.4, ease: 'power3' });
  $('#stage').addEventListener('mousemove', e => {
    const dx = e.clientX / innerWidth - .5, dy = e.clientY / innerHeight - .5;
    tx(dx * -40); kx(dx * 22); ky(dy * 12);
  });
}
gsap.timeline({ scrollTrigger: { trigger: '#stage', start: 'top top', end: 'bottom top', scrub: true } })
  .to('.stage-title', { yPercent: 40, opacity: .1, ease: 'none' }, 0)
  .to('.stage-kebaya .cut', { scale: .9, yPercent: -6, ease: 'none' }, 0)
  .to('.spot', { opacity: .2, ease: 'none' }, 0);

/* ── Header: sembunyi saat turun, muncul saat naik ── */
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: self => $('#top').classList.toggle('hidden', self.direction === 1 && self.scroll() > innerHeight * .9 && !document.body.classList.contains('lock')),
});

/* ── Pernyataan: kata menyala satu per satu ── */
const st = $('#statementText');
if (st) {
  st.innerHTML = st.textContent.trim().split(/\s+/).map(w => `<span class="stw">${w}</span>`).join(' ');
  const words = keep(st.querySelectorAll(".stw"));
  gsap.set(words, { opacity: .14 });
  gsap.to(words, {
    opacity: 1, ease: 'none', stagger: .1,
    scrollTrigger: { trigger: st, start: 'top 78%', end: 'bottom 42%', scrub: true },
  });
}
/* angka fakta menghitung naik saat terlihat */
$$('.facts [data-count]').forEach(el => {
  const end = +(el.dataset.end || el.textContent), o = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.fromTo(o, { v: 0 }, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } }),
  });
});

/* ── Koleksi: galeri terkunci & bergeser horizontal (desktop) ── */
const mm = gsap.matchMedia();
mm.add('(min-width: 900px)', () => {
  const view = $('#hViewport'), trackEl = $('#hTrack'), bar = $('#hBar');
  view.appendChild($('.collection-bar'));
  view.style.overflow = 'visible';
  const dist = () => Math.max(0, trackEl.scrollWidth - root.clientWidth);
  const tween = gsap.to(trackEl, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: view, start: 'center center', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
      onUpdate: self => { bar.style.transform = `scaleX(${self.progress})`; },
    },
  });
  $$('.panel-word').forEach(w => gsap.fromTo(w, { xPercent: 18 }, {
    xPercent: -18, ease: 'none',
    scrollTrigger: { trigger: w.closest('.panel'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
  }));
  return () => { view.style.overflow = ''; $('#koleksi').appendChild($('.collection-bar')); };
});

/* ── Muncul saat digulir ── */
const rev = keep($$('[data-r]'));
gsap.set(rev, { opacity: 0, y: 50 });
ScrollTrigger.batch(rev, {
  start: 'top 88%', once: true,
  onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.3, ease: 'expo.out', stagger: .09 }),
});
const cards = keep($$('#grid .card'));
gsap.set(cards, { opacity: 0, y: 70 });
ScrollTrigger.batch(cards, {
  start: 'top 92%', once: true,
  onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out', stagger: .08 }),
});
const routeLis = keep($$('#route li'));
gsap.set(routeLis, { opacity: 0, y: 30 });
ScrollTrigger.create({ trigger: '#route', start: 'top 85%', once: true,
  onEnter: () => gsap.to(routeLis, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .08 }) });

/* foto isi paket terbuka seperti tirai */
const clip = $('[data-clip]');
if (clip) {
  gsap.fromTo(clip, { clipPath: 'inset(22% 14% 22% 14% round 22px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none',
    scrollTrigger: { trigger: clip, start: 'top 90%', end: 'center 55%', scrub: true },
  });
  gsap.fromTo(clip.querySelector('img'), { scale: 1.3 }, {
    scale: 1, ease: 'none', scrollTrigger: { trigger: clip, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}
/* garis langkah cara sewa tergambar */
gsap.fromTo('#howSteps', { '--p': 0 }, {
  '--p': 1, ease: 'none', scrollTrigger: { trigger: '#howSteps', start: 'top 80%', end: 'bottom 55%', scrub: true },
});
/* judul ajakan membesar */
gsap.fromTo('.cta-title', { scale: .86 }, {
  scale: 1, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true },
});
/* logo tulisan footer naik */
gsap.fromTo('.foot-mark', { yPercent: 40 }, {
  yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true },
});

/* ── Kursor emas & tombol magnetis (khusus mouse) ── */
if (fine) {
  root.classList.add('has-cursor');
  const cur = $('#cursor'), dot = cur.querySelector('.cursor-dot'), ring = cur.querySelector('.cursor-ring'), label = $('#cursorLabel');
  const dX = gsap.quickTo(dot, 'x', { duration: .12 }), dY = gsap.quickTo(dot, 'y', { duration: .12 });
  const rX = gsap.quickTo(ring, 'x', { duration: .55, ease: 'power3' }), rY = gsap.quickTo(ring, 'y', { duration: .55, ease: 'power3' });
  addEventListener('mousemove', e => { dX(e.clientX); dY(e.clientY); rX(e.clientX); rY(e.clientY); });
  document.addEventListener('mouseover', e => {
    const v = e.target.closest('[data-cursor]');
    const l = e.target.closest('a, button, summary, select, label, input');
    cur.classList.toggle('is-view', !!v);
    cur.classList.toggle('is-link', !v && !!l);
    if (v) label.textContent = v.dataset.cursor;
  });
  document.addEventListener('mouseleave', () => gsap.to(cur, { opacity: 0, duration: .3 }));
  document.addEventListener('mouseenter', () => gsap.to(cur, { opacity: 1, duration: .3 }));

  $$('.magnetic').forEach(el => {
    const mx = gsap.quickTo(el, 'x', { duration: .8, ease: 'elastic.out(1, .4)' });
    const my = gsap.quickTo(el, 'y', { duration: .8, ease: 'elastic.out(1, .4)' });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .3);
    });
    el.addEventListener('mouseleave', () => { mx(0); my(0); });
  });
}

addEventListener('load', () => ScrollTrigger.refresh());

/* ── Pengaman: jika jam animasi tidak berjalan, tampilkan semua secara normal ── */
setTimeout(() => {
  if (gsap.ticker.frame > 20) return;
  ScrollTrigger.getAll().forEach(t => t.kill(true));
  gsap.killTweensOf(hidden);
  gsap.set(hidden, { clearProps: 'all' });
  root.classList.remove('has-cursor');
  hideLoader();
}, 4500);
})();
