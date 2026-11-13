#!/usr/bin/env node
/* =============================================================
   MOJANG.KEBAYA — PEMBUAT HALAMAN OTOMATIS
   Jalankan setiap kali assets/js/data.js diubah:

       node tools/buat-halaman.mjs

   Yang dibuat / diperbarui:
     kebaya/<nama>.html  satu halaman per kebaya (judul, foto & harga sendiri,
                         supaya muncul di Google dan rapi saat dibagikan di WA)
     404.html            halaman "tidak ditemukan"
     verifikasi.html     verifikasi lokasi penyewa luar kota (tidak masuk Google)
     booking.html        pintu masuk form booking (Google Form) + deteksi lokasi HP
     cek-luar-kota.html  alat admin: link verifikasi & cek balasan penyewa luar kota
     panduan/…           artikel panduan (isi di tools/panduan.mjs) + daftar artikel
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
import { daftarArtikel } from './panduan.mjs';

const SITE = 'https://mojangkebaya.vercel.app';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const wr = (f, txt) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), txt); };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const abs = p => `${SITE}/${p}`;

/* ── Data kebaya ── */
const ctx = { window: {} };
vm.runInNewContext(rd('assets/js/data.js'), ctx);
const { KONTAK, SERIES, FAMILIES, ITEMS } = ctx.window.MOJANG_DATA;
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

/* ── 2b. Artikel panduan (isi di tools/panduan.mjs) ── */
const today = new Date().toISOString().slice(0, 10);
const tglID = d => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const ARTIKEL = daftarArtikel({ ITEMS, SERIES, FAMILIES, esc });
// tanggal terbit disimpan di panduan/tanggal.json supaya tidak berubah setiap kali pembuat halaman dijalankan
const tglFile = 'panduan/tanggal.json';
const TGL = fs.existsSync(path.join(ROOT, tglFile)) ? JSON.parse(rd(tglFile)) : {};
for (const a of ARTIKEL) TGL[a.slug] ||= today;
fs.rmSync(path.join(ROOT, 'panduan'), { recursive: true, force: true });
wr(tglFile, JSON.stringify(TGL, null, 2) + '\n');
const fotoM = src => src.replace('image/editorial/', 'image/editorial/m/');
const imgTag = (src, alt, extra = '') => `<img src="../${src}" srcset="../${fotoM(src)} 800w, ../${src} 1066w" sizes="(min-width: 760px) 720px, 100vw" alt="${esc(alt)}" decoding="async"${extra}>`;
const ctaArtikel = `    <div class="art-cta">
      <a class="btn btn-dark" href="../katalog.html">Lihat katalog</a>
      <a class="btn js-wa" data-where="artikel panduan" href="https://wa.me/${KONTAK.wa}" target="_blank" rel="noopener">Tanya via WhatsApp</a>
    </div>`;

for (const a of ARTIKEL) {
  const url = abs(`panduan/${a.slug}.html`);
  const lain = ARTIKEL.filter(x => x !== a);
  const main = `  <nav class="crumbs" aria-label="Lokasi halaman"><a href="../index.html">Beranda</a> / <a href="index.html">Panduan</a> / <span aria-current="page">${esc(a.judul.split(':')[0])}</span></nav>
  <article class="art">
    <header class="art-head">
      <p class="caps muted">Panduan</p>
      <h1>${esc(a.judul)}</h1>
      <p class="art-meta">Mojang.Kebaya · ${tglID(TGL[a.slug])}</p>
    </header>
    <figure class="art-photo">${imgTag(a.foto, a.fotoAlt, ' fetchpriority="high"')}</figure>
${a.isi}
${ctaArtikel}
${lain.length ? `    <nav class="art-more" aria-label="Artikel lain">
      <p class="label">Baca juga</p>
${lain.map(x => `      <a href="${x.slug}.html">${esc(x.judul)}</a>`).join('\n')}
    </nav>` : ''}
  </article>`;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: a.judul, description: a.ringkas, image: [abs(a.foto)],
      datePublished: TGL[a.slug], dateModified: today, mainEntityOfPage: url,
      author: { '@type': 'Organization', name: 'Mojang.Kebaya', url: `${SITE}/` },
      publisher: { '@type': 'Organization', name: 'Mojang.Kebaya', logo: { '@type': 'ImageObject', url: abs('image/logo/apple-touch-icon.png') } } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [['Beranda', `${SITE}/`], ['Panduan', abs('panduan/index.html')], [a.judul, url]]
        .map(([name, item], n) => ({ '@type': 'ListItem', position: n + 1, name, item })) },
  ];
  wr(`panduan/${a.slug}.html`, page({ prefix: '../', title: `${a.judul} – Mojang.Kebaya`, desc: a.ringkas, canonical: url, image: abs(a.foto), type: 'article', jsonld, main }));
}

wr('panduan/index.html', page({
  prefix: '../', title: 'Panduan Sewa Kebaya – Mojang.Kebaya Sukabumi', canonical: abs('panduan/index.html'),
  desc: 'Panduan sewa kebaya wisuda & lamaran dari Mojang.Kebaya Sukabumi: harga, cara booking, ukuran, dan tips memilih warna kebaya.',
  image: abs(ARTIKEL[0].foto),
  main: `  <nav class="crumbs" aria-label="Lokasi halaman"><a href="../index.html">Beranda</a> / <span aria-current="page">Panduan</span></nav>
  <section class="pg">
    <header class="pg-head">
      <p class="caps muted">Panduan</p>
      <h1>Panduan sewa kebaya</h1>
      <p>Harga, cara booking, ukuran, dan tips memilih kebaya untuk wisuda, lamaran dan hari istimewa.</p>
    </header>
    <ul class="pg-list">
${ARTIKEL.map((a, n) => `      <li class="pg-card"><a href="${a.slug}.html">${imgTag(a.foto, a.fotoAlt, n ? ' loading="lazy"' : '').replace('sizes="(min-width: 760px) 720px, 100vw"', 'sizes="(min-width: 700px) 50vw, 100vw"')}<h2>${esc(a.judul)}</h2><p>${esc(a.ringkas)}</p></a></li>`).join('\n')}
    </ul>
  </section>`,
}));

/* ── 2c. Verifikasi lokasi sewa luar kota (verifikasi.html) ──
        Penyewa luar kota membagikan lokasi HP 3 kali: booking, paket diterima, kirim kembali.
        Lokasi terdeteksi otomatis saat penyewa mulai mengisi form (setelah diizinkan di browser),
        lalu dikirim lewat WhatsApp.
        Tidak masuk sitemap (noindex): link-nya dikirim admin ke penyewa via WhatsApp.
        Logika ada di site.js (bagian "Verifikasi lokasi"). */
const LANGKAH = [
  ['1', 'Booking', 'Setelah DP. Lokasi dicocokkan dengan alamat kirim.'],
  ['2', 'Paket diterima', 'H-1, saat kebaya sampai di rumah Anda.'],
  ['3', 'Kirim kembali', 'H+1 paling lambat 12.00 WIB, di tempat pengiriman, beserta nomor resi.'],
];
wr('verifikasi.html', page({
  prefix: '', title: 'Verifikasi Lokasi Sewa Luar Kota – Mojang.Kebaya', robots: 'noindex',
  desc: 'Verifikasi lokasi penyewa untuk sewa kebaya luar kota Mojang.Kebaya: bagikan lokasi HP saat booking, saat paket diterima dan saat kirim kembali.',
  image: abs('image/editorial/hero-navy.jpg'),
  main: `  <nav class="crumbs" aria-label="Lokasi halaman"><a href="index.html">Beranda</a> / <span aria-current="page">Verifikasi lokasi</span></nav>
  <section class="vf">
    <header class="pg-head">
      <p class="caps muted">Sewa luar kota</p>
      <h1>Verifikasi lokasi penyewa</h1>
      <p>Supaya kebaya yang dikirim ke luar kota tetap aman, penyewa membagikan lokasi HP tiga kali selama masa sewa.</p>
    </header>
    <ol class="vf-steps">
${LANGKAH.map(([n, t, d]) => `      <li><b>${n} · ${t}</b>${d}</li>`).join('\n')}
    </ol>
    <form class="vf-form" id="locForm" novalidate>
      <fieldset class="vf-pick">
        <legend class="label">Langkah sekarang</legend>
${LANGKAH.map(([n, t]) => `        <label><input type="radio" name="langkah" value="${n}"${n === '1' ? ' checked' : ''}><span>${n}. ${t}</span></label>`).join('\n')}
      </fieldset>
      <label class="label" for="vName">Nama lengkap (sesuai KTP)</label>
      <input id="vName" type="text" required autocomplete="name">
      <label class="label" for="vKebaya">Kebaya</label>
      <select id="vKebaya" required>
        <option value="">Pilih kebaya</option>
${ITEMS.map(i => `        <option value="${i.key}">${esc(i.name)}</option>`).join('\n')}
      </select>
      <label class="label" for="vDate">Tanggal acara</label>
      <input id="vDate" type="date" required>
      <div data-langkah="1">
        <label class="label" for="vAddr">Alamat lengkap pengiriman</label>
        <textarea id="vAddr" rows="3" required autocomplete="street-address" placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota"></textarea>
      </div>
      <div data-langkah="3" hidden>
        <label class="label" for="vResi">Kurir &amp; nomor resi</label>
        <input id="vResi" type="text" required placeholder="Contoh: JNE 0123456789">
      </div>
      <div class="vf-loc">
        <p class="vf-status" id="vStatus" role="status" aria-live="polite">Lokasi HP terdeteksi otomatis saat Anda mulai mengisi form. Nyalakan GPS, lalu pilih <b>Izinkan</b> saat browser meminta izin lokasi.</p>
      </div>
      <label class="vf-ok"><input type="checkbox" id="vAgree" required><span>Saya setuju lokasi HP saya dikirim ke Mojang.Kebaya untuk keamanan sewa ini.</span></label>
      <button class="btn btn-dark" type="submit"><svg width="18" height="18" aria-hidden="true"><use href="#i-wa"/></svg>Kirim ke WhatsApp</button>
      <p class="vf-err" id="vErr" role="alert"></p>
    </form>
    <div class="vf-note">
      <p class="caps">Privasi</p>
      <ul>
        <li>Lokasi dideteksi sekali saat Anda mulai mengisi form, dan hanya jika Anda mengizinkannya di browser. Tidak ada pelacakan di latar belakang.</li>
        <li>Website ini tidak menyimpan data Anda. Data hanya terkirim lewat WhatsApp ke Mojang.Kebaya (${esc(KONTAK.waTxt)}).</li>
        <li>Data lokasi hanya dipakai untuk keamanan sewa ini dan dihapus paling lambat 30 hari setelah kebaya kembali.</li>
      </ul>
    </div>
  </section>`,
}));

/* ── 2c-2. Form booking (booking.html) ──
        Pintu masuk ke Google Form booking: lokasi HP terdeteksi otomatis saat penyewa mulai
        mengisi, dicatat ke Google Form "Log Lokasi Booking", lalu form booking terbuka dengan
        nama & nomor WA terisi. Alamat Google Form ada di data.js (FORM_BOOKING).
        Tidak masuk sitemap (noindex): link-nya dibagikan admin. Logika ada di site.js. */
wr('booking.html', page({
  prefix: '', title: 'Form Booking – Mojang.Kebaya', robots: 'noindex',
  desc: 'Form booking kebaya Mojang.Kebaya setelah tanggal dicek dan deposit Rp100.000 ditransfer.',
  image: abs('image/editorial/hero-navy.jpg'),
  main: `  <nav class="crumbs" aria-label="Lokasi halaman"><a href="index.html">Beranda</a> / <span aria-current="page">Form booking</span></nav>
  <section class="vf">
    <header class="pg-head">
      <p class="caps muted">Booking</p>
      <h1>Form booking</h1>
      <p>Isi setelah tanggal sudah dicek lewat WhatsApp dan deposit Rp100.000 sudah ditransfer. Mulai dari nama dan nomor WhatsApp, lalu lanjut ke form booking lengkap.</p>
    </header>
    <form class="vf-form" id="bookForm" novalidate>
      <p class="small muted" id="bPilihan"></p>
      <label class="label" for="bName">Nama lengkap (sesuai KTP)</label>
      <input id="bName" type="text" required autocomplete="name">
      <label class="label" for="bWa">Nomor WhatsApp</label>
      <input id="bWa" type="tel" inputmode="tel" required autocomplete="tel" placeholder="Contoh: 081234567890">
      <div class="vf-loc">
        <p class="vf-status" id="bStatus" role="status" aria-live="polite">Untuk keamanan sewa, lokasi HP terdeteksi otomatis saat Anda mulai mengisi. Nyalakan GPS, lalu pilih <b>Izinkan</b> saat browser meminta izin lokasi.</p>
      </div>
      <label class="vf-ok"><input type="checkbox" id="bAgree" required><span>Saya setuju lokasi HP saya dicatat oleh Mojang.Kebaya untuk keamanan sewa ini.</span></label>
      <button class="btn btn-dark" type="submit">Lanjut ke form booking</button>
      <p class="vf-err" id="bErr" role="alert"></p>
    </form>
    <div class="vf-note">
      <p class="caps">Privasi</p>
      <ul>
        <li>Lokasi dideteksi sekali saat Anda mulai mengisi, dan hanya jika Anda mengizinkannya di browser. Tidak ada pelacakan di latar belakang.</li>
        <li>Nama, nomor WhatsApp dan lokasi tersimpan di formulir Google milik Mojang.Kebaya, hanya untuk keamanan sewa ini, dan dihapus paling lambat 30 hari setelah kebaya kembali.</li>
      </ul>
    </div>
  </section>`,
}));

/* ── 2d. Cek sewa luar kota, khusus admin (cek-luar-kota.html) ──
        Membuat link verifikasi + pesan WA untuk penyewa, membaca balasan WA penyewa
        (lokasi, akurasi, jarak antarlangkah, ketepatan waktu kirim kembali) dan daftar
        cek sebelum kebaya dikirim. Tidak masuk sitemap (noindex) dan tidak ditautkan.
        Isian hanya tersimpan di tab browser admin (sessionStorage), tidak dikirim ke mana pun.
        Logika ada di site.js (bagian "Cek sewa luar kota"). */
const CEK_KIRIM = [
  'DP minimal Rp100.000 sudah masuk. Cek di mutasi rekening, jangan hanya dari foto bukti transfer.',
  'Foto KTP asli sudah diterima, dan nama di KTP sama dengan nama di pesan penyewa.',
  'Lokasi langkah 1 sudah masuk, akurasinya baik, dan berada di kota yang sama dengan alamat kirim.',
  'Pelunasan 100% sudah masuk (cek mutasi) sebelum paket diserahkan ke kurir.',
  'Video packing direkam: kondisi kebaya, veil dan isi paket sampai paket ditutup.',
  'Nomor resi kirim &amp; foto paket disimpan.',
];
const CEK_KEMBALI = [
  'Lokasi langkah 3 &amp; nomor resi sudah masuk; resi dicek di aplikasi atau situs kurir.',
  'Video saat membuka paket kembali direkam; kondisi &amp; kelengkapan kebaya dicek.',
  'Foto KTP &amp; pesan lokasi dihapus paling lambat 30 hari setelah kebaya kembali.',
];
const cekList = (items, from) => items.map((t, n) => `      <li><label class="vf-ok"><input type="checkbox" data-cek="${from + n}"><span>${t}</span></label></li>`).join('\n');
wr('cek-luar-kota.html', page({
  prefix: '', title: 'Cek Sewa Luar Kota (Admin) – Mojang.Kebaya', robots: 'noindex, nofollow',
  desc: 'Alat admin Mojang.Kebaya untuk mengecek verifikasi lokasi penyewa luar kota.',
  image: abs('image/editorial/hero-navy.jpg'),
  main: `  <nav class="crumbs" aria-label="Lokasi halaman"><a href="index.html">Beranda</a> / <span aria-current="page">Cek sewa luar kota</span></nav>
  <section class="vf ck">
    <header class="pg-head">
      <p class="caps muted">Khusus admin</p>
      <h1>Cek sewa luar kota</h1>
      <p>Tempel pesan booking penyewa, kirim link verifikasi, lalu tempel balasannya di sini untuk dicek otomatis. Isian hanya ada di tab browser ini, tidak dikirim ke mana pun, dan hilang saat tab ditutup.</p>
    </header>

    <h2 class="ck-h">1 · Data sewa &amp; link untuk penyewa</h2>
    <form class="vf-form" id="ckForm" novalidate>
      <label class="label" for="cKebaya">Kebaya</label>
      <select id="cKebaya" data-simpan>
        <option value="">Pilih kebaya</option>
${ITEMS.map(i => `        <option value="${i.key}">${esc(i.name)}</option>`).join('\n')}
      </select>
      <label class="label" for="cDate">Tanggal acara</label>
      <input id="cDate" type="date" data-simpan>
      <label class="label" for="cWa">Nomor WhatsApp penyewa (boleh kosong)</label>
      <input id="cWa" type="tel" inputmode="tel" autocomplete="off" placeholder="Contoh: 0812 3456 7890" data-simpan>
    </form>
    <p class="small muted" id="ckHint">Pilih kebaya &amp; tanggal acara, atau tempel pesan booking di bagian 2 supaya terisi otomatis.</p>
    <ol class="ck-links" id="ckLinks" hidden></ol>

    <h2 class="ck-h">2 · Cek pesan penyewa</h2>
    <p class="small muted">Di WhatsApp, tekan lama pesan penyewa → Salin, lalu tempel di kotak langkahnya.</p>
    <form class="vf-form ck-msgs" id="ckMsgs" novalidate>
${LANGKAH.map(([n, t]) => `      <label class="label" for="cM${n}">Langkah ${n} · ${t}${n === '1' ? ' (pesan booking atau verifikasi)' : ''}</label>
      <textarea id="cM${n}" rows="3" data-step="${n}" data-simpan placeholder="Tempel pesan langkah ${n} di sini"></textarea>`).join('\n')}
    </form>
    <div id="ckOut" aria-live="polite"></div>

    <h2 class="ck-h">3 · Sebelum kebaya dikirim</h2>
    <ul class="ck-todo">
${cekList(CEK_KIRIM, 0)}
    </ul>
    <p class="vf-status" id="ckGo" role="status"></p>
    <p class="caps ck-sub">Saat kebaya kembali</p>
    <ul class="ck-todo">
${cekList(CEK_KEMBALI, CEK_KIRIM.length)}
    </ul>
    <p class="ck-reset"><button class="ulink" type="button" id="ckReset">Kosongkan semua isian</button></p>
  </section>`,
}));

/* ── 3. sitemap.xml & robots.txt ── */
const urls = [`${SITE}/`, abs('katalog.html'), ...ITEMS.map(i => abs(`kebaya/${i.key}.html`)), abs('panduan/index.html'), ...ARTIKEL.map(a => abs(`panduan/${a.slug}.html`))];
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

console.log(`Selesai: ${ITEMS.length} halaman kebaya, ${ARTIKEL.length} artikel panduan, 404.html, verifikasi.html, booking.html, cek-luar-kota.html, sitemap.xml (${urls.length} alamat), robots.txt, katalog.html diperbarui. Harga mulai Rp${minPrice}rb.`);
