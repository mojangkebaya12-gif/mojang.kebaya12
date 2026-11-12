#!/usr/bin/env node
/* =============================================================
   MOJANG.KEBAYA — PEMBUAT HALAMAN OTOMATIS
   Jalankan setiap kali assets/js/data.js diubah:

       node tools/buat-halaman.mjs

   Yang dibuat / diperbarui:
     kebaya/<nama>.html  satu halaman per kebaya (judul, foto & harga sendiri,
                         supaya muncul di Google dan rapi saat dibagikan di WA)
     404.html            halaman "tidak ditemukan"
     sitemap.xml         daftar halaman untuk Google
     robots.txt          menunjuk ke sitemap
     katalog.html        daftar kebaya statis (untuk Google & tanpa JavaScript)
                         di antara penanda AUTO:GRID dan AUTO:ITEMLIST
     ?v=… pada link      tanda versi CSS/JS di semua halaman, supaya browser
                         selalu memuat file terbaru (jalankan juga setelah
                         mengubah site.css atau site.js)

   Header, menu & footer disalin dari katalog.html, jadi cukup ubah di sana.
   Jika nanti memakai domain sendiri, ganti SITE di bawah.
   ============================================================= */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SITE = 'https://mojangkebaya.vercel.app';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const wr = (f, txt) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), txt); };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const abs = p => `${SITE}/${p}`;

/* ── Data kebaya ── */
const ctx = { window: {} };
vm.runInNewContext(rd('assets/js/data.js'), ctx);
const { KONTAK, SERIES, ITEMS } = ctx.window.MOJANG_DATA;
const minPrice = Math.min(...ITEMS.map(i => i.price));

/* ── 0. Tanda versi (?v=…) pada link CSS/JS: berubah otomatis setiap isi file berubah,
        jadi browser tidak memakai salinan lama ── */
const ASSETS = ['assets/css/site.css', 'assets/js/site.js', 'assets/js/data.js'];
const V = Object.fromEntries(ASSETS.map(a => [a, crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, a))).digest('hex').slice(0, 8)]));
const stamp = html => ASSETS.reduce((h, a) => h.replace(new RegExp(`(${a.replace(/\./g, '\\.')})(\\?v=[0-9a-f]+)?"`, 'g'), `$1?v=${V[a]}"`), html);
for (const f of ['index.html', 'katalog.html']) wr(f, stamp(rd(f)));

/* ── Bagian bersama, disalin dari katalog.html ── */
const katalog = rd('katalog.html');
const between = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error(`Penanda tidak ditemukan: ${a} … ${b}`); return s.slice(i, j); };
const headShared = between(katalog, '  <link rel="preconnect"', '  <!-- AUTO:ITEMLIST');   // huruf, CSS, ikon, statistik
const svgIcons = between(katalog, '<svg width="0"', '<a class="skip"');
const topAndMenu = between(katalog, '<p class="topbar">', '<main>');
const footAndFab = between(katalog, '<footer class="foot">', '<!-- DETAIL KEBAYA -->');

// ubah link relatif (index.html, image/…, assets/…) agar benar dari folder lain
const fixLinks = (html, prefix) => html.replace(/\b(href|src)="(?!https?:|#|\/|mailto:|tel:|data:)([^"]+)"/g, (_, a, u) => `${a}="${prefix}${u}"`);
const chrome = prefix => ({
  head: fixLinks(headShared, prefix),
  top: fixLinks(topAndMenu, prefix).replace(' aria-current="page"', ''),
  foot: fixLinks(footAndFab, prefix),
  scripts: stamp(`<script src="${prefix}assets/js/data.js"></script>\n<script src="${prefix}assets/js/site.js"></script>`),
});

function page({ prefix, title, desc, canonical, image, type = 'website', robots = '', jsonld = [], main }) {
  const c = chrome(prefix);
  return `<!DOCTYPE html>
<html lang="id" data-root="${prefix}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
${canonical ? `  <link rel="canonical" href="${canonical}">\n` : ''}${robots ? `  <meta name="robots" content="${robots}">\n` : ''}  <meta name="theme-color" content="#FFFFFF">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Mojang.Kebaya">
  <meta property="og:locale" content="id_ID">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
${canonical ? `  <meta property="og:url" content="${canonical}">\n` : ''}  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">

${c.head}${jsonld.map(j => `  <script type="application/ld+json">\n${JSON.stringify(j, null, 2)}\n  </script>\n`).join('')}</head>
<body class="page-sub">
<!-- Dibuat otomatis oleh tools/buat-halaman.mjs dari assets/js/data.js — jangan diedit langsung. -->

${svgIcons}<a class="skip" href="#konten">Langsung ke konten</a>

${c.top}<main id="konten">
${main}
</main>

${c.foot}
${c.scripts}
</body>
</html>
`;
}

/* ── 1. Halaman tiap kebaya ── */
fs.rmSync(path.join(ROOT, 'kebaya'), { recursive: true, force: true });
for (const i of ITEMS) {
  const url = abs(`kebaya/${i.key}.html`);
  const ser = SERIES[i.s];
  const ld = i.ld || 'ukuran LD bisa ditanyakan via WhatsApp';
  const desc = `Sewa kebaya full payet ${i.name} di Sukabumi: ${i.priceTxt} untuk 3 hari, ${ld}. Free laundry & resize, ambil di Sukabumi atau kirim ke seluruh Pulau Jawa.`;
  const photos = [...i.photos, ...i.cust];
  const sibs = ITEMS.filter(x => x.s === i.s);
  const msg = `Halo Mojang.Kebaya, saya mau booking kebaya:\nKebaya: ${i.name} (${i.priceTxt})\nTanggal acara: ...\nNama: ...\nAmbil di Sukabumi / kirim ke: ...\n\nLink: ${url}`;

  const main = `  <nav class="crumbs" aria-label="Lokasi halaman"><a href="../index.html">Beranda</a> / <a href="../katalog.html">Katalog</a> / <a href="../katalog.html?series=${i.s}">${esc(i.series)}</a> / <span aria-current="page">${esc(i.color)}</span></nav>
  <article class="kb">
    <div class="kb-photos" tabindex="0" aria-label="Foto kebaya ${esc(i.name)}">
${photos.map((src, n) => `      <img src="../${src}" alt="${n < i.photos.length ? `Kebaya ${esc(i.name)} foto ${n + 1}` : `Customer memakai kebaya ${esc(i.name)}`}" ${n ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">`).join('\n')}
    </div>
    <div class="kb-info">
      <p class="caps muted">Series ${esc(i.series)}${i.isNew ? ' · Baru' : ''}</p>
      <h1>Sewa Kebaya ${esc(i.name)}</h1>
      <p class="d-price">${i.priceTxt} <small>/ sewa 3 hari</small></p>
      <p class="d-ld">${i.ld ? `Ukuran ${esc(i.ld)} · bisa resize gratis` : 'Tanya ukuran LD via WhatsApp · bisa resize gratis'}</p>
      <p class="kb-desc">${esc(ser.desc)} Sudah satu paket lengkap, sudah dicuci, dan ukurannya disesuaikan gratis. Ambil di Sukabumi atau kami kirim ke seluruh Pulau Jawa.</p>
      <div class="kb-cta">
        <a class="btn btn-dark js-wa" data-where="halaman kebaya" data-msg="${encodeURIComponent(msg)}" href="https://wa.me/${KONTAK.wa}" target="_blank" rel="noopener">Booking via WhatsApp</a>
        <a class="ulink" href="../katalog.html?k=${i.key}">Cek tanggal tersedia</a>
      </div>
      <p class="label">Isi paket</p>
      <ul class="kb-pkg">
${[i.ld, ...i.pkg].filter(Boolean).map(p => `        <li>${esc(p)}</li>`).join('\n')}
      </ul>
${sibs.length > 1 ? `      <p class="label">Warna lain series ${esc(i.series)}</p>
      <div class="kb-sibs">
${sibs.map(x => `        <a href="${x.key}.html"${x.key === i.key ? ' aria-current="page"' : ''}><i style="background:${x.hex}"></i>${esc(x.color)}</a>`).join('\n')}
      </div>` : ''}
    </div>
  </article>`;

  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'Product',
      name: `Kebaya ${i.name}`, image: photos.slice(0, 5).map(abs), description: desc,
      brand: { '@type': 'Brand', name: 'Mojang.Kebaya' }, category: 'Sewa kebaya',
      offers: { '@type': 'Offer', url, priceCurrency: 'IDR', price: i.price * 1000, availability: 'https://schema.org/InStock',
                seller: { '@type': 'Organization', name: 'Mojang.Kebaya' } },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [['Beranda', `${SITE}/`], ['Katalog', abs('katalog.html')], [i.name, url]]
        .map(([name, item], n) => ({ '@type': 'ListItem', position: n + 1, name, item })),
    },
  ];
  wr(`kebaya/${i.key}.html`, page({ prefix: '../', title: `Sewa Kebaya ${i.name} – Mojang.Kebaya Sukabumi`, desc, canonical: url, image: abs(i.photos[0]), type: 'product', jsonld, main }));
}

/* ── 2. Halaman 404 (dipakai Vercel untuk alamat yang tidak ada) ── */
wr('404.html', page({
  prefix: '/', title: 'Halaman tidak ditemukan – Mojang.Kebaya', robots: 'noindex',
  desc: 'Halaman yang Anda cari tidak ditemukan. Lihat katalog sewa kebaya Mojang.Kebaya.',
  image: abs('image/editorial/hero-navy.jpg'),
  main: `  <section class="notfound">
    <p class="caps muted">404</p>
    <h1>Halaman tidak ditemukan</h1>
    <p>Mungkin link-nya sudah berubah. Silakan lihat katalog atau kembali ke beranda.</p>
    <div class="hero-actions">
      <a class="hero-btn" href="/katalog.html">Lihat katalog</a>
      <a class="hero-link" href="/index.html">Ke beranda</a>
    </div>
  </section>`,
}));

/* ── 3. sitemap.xml & robots.txt ── */
const today = new Date().toISOString().slice(0, 10);
const urls = [`${SITE}/`, abs('katalog.html'), ...ITEMS.map(i => abs(`kebaya/${i.key}.html`))];
wr('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
wr('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

/* ── 4. Daftar statis di katalog.html (Google & tanpa JavaScript) ── */
const grid = ITEMS.map(i => `      <li class="card"><a class="card-btn" href="kebaya/${i.key}.html"><span class="card-img"><img class="main" src="${i.thumb}" alt="Kebaya ${esc(i.name)}" loading="lazy"></span><span class="card-row"><span class="card-name">${esc(i.name)}</span><span class="card-price">${i.priceTxt}</span></span></a></li>`).join('\n');
const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Katalog sewa kebaya Mojang.Kebaya',
  itemListElement: ITEMS.map((i, n) => ({ '@type': 'ListItem', position: n + 1, name: `Kebaya ${i.name}`, url: abs(`kebaya/${i.key}.html`) })) };
let kat = katalog
  .replace(/(<!-- AUTO:GRID[\s\S]*?-->)[\s\S]*?(\s*<!-- \/AUTO:GRID -->)/, `$1\n${grid}$2`)
  .replace(/(<!-- AUTO:ITEMLIST[\s\S]*?-->)[\s\S]*?(\s*<!-- \/AUTO:ITEMLIST -->)/, `$1\n  <script type="application/ld+json">\n${JSON.stringify(itemList, null, 2)}\n  </script>$2`);
if (kat === katalog && !katalog.includes('kebaya/')) throw new Error('Penanda AUTO di katalog.html tidak ditemukan');
wr('katalog.html', kat);

console.log(`Selesai: ${ITEMS.length} halaman kebaya, 404.html, sitemap.xml (${urls.length} alamat), robots.txt, katalog.html diperbarui. Harga mulai Rp${minPrice}rb.`);
