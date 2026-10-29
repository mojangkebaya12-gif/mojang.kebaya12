/* =============================================================
   MOJANG.KEBAYA — DATA
   Satu-satunya file yang perlu diubah untuk menambah / mengubah kebaya,
   harga, atau kalender ketersediaan. Homepage & katalog ikut berubah.
   ============================================================= */
(function () {
'use strict';

/* ── KONTAK ─────────────────────────────────────────────────── */
const KONTAK = {
  wa: '628985555506',           // nomor WhatsApp 0898 5555 506 (format 62…)
  ig: 'mojang.kebaya',
};

/* ── SERIES ─────────────────────────────────────────────────────
   Urutan di sini = urutan tampil di website.
   ld     : ukuran Lingkar Dada (kosongkan jika belum ada)
   veil   : jenis veil di paket
   desc   : satu kalimat di halaman katalog
   folder : nama folder foto di image/ — masih memakai nama lama
            (edita, calla, …) supaya foto yang sudah ada tetap tampil.
            Jika folder & file foto diganti ke nama baru, ubah di sini. */
const SERIES = {
  aruni:   { name: 'Aruni',   folder: 'edita',  ld: 'LD 98 max 105', veil: 'Veil/Ceruti Lepas Pasang', desc: 'Siluet klasik dengan payet rapat dan veil/ceruti lepas pasang.' },
  kinasih: { name: 'Kinasih', folder: 'calla',  ld: 'LD 98 max 105', veil: 'Veil/Ceruti Lepas Pasang', desc: 'Palet kalem — grey, ice blue dan maroon — cocok untuk wisuda dan lamaran.' },
  niskala: { name: 'Niskala', folder: 'shreya', ld: '',              veil: 'Veil Lepas Pasang',        desc: 'Detail payet berlapis dalam warna ice blue yang lembut.' },
  puspa:   { name: 'Puspa',   folder: 'aurora', ld: '',              veil: 'Veil Lepas Pasang',        desc: 'Satu warna mahogany yang dalam dan berkarakter.' },
  geulis:  { name: 'Geulis',  folder: 'alanya', ld: 'LD 94 max 98',  veil: 'Veil Lepas Pasang',        desc: 'Series terlengkap — dari baby pink dan butter yellow hingga burgundy.' },
};

/* ── KELUARGA WARNA (filter "Warna" di katalog) ─────────────── */
const FAMILIES = {
  pink: 'Pink', nude: 'Nude & Cream', merah: 'Merah & Burgundy', biru: 'Biru',
  hijau: 'Hijau', kuning: 'Kuning', netral: 'Coklat & Abu',
};

/* ── KEBAYA ─────────────────────────────────────────────────────
   Satu baris = satu kebaya:
   ['series', 'Nama Warna', harga (ribu), '#kodeWarna', 'keluarga', { opsi }]

   opsi (boleh dikosongkan):
     new: true    → label "Baru" + tampil di "Koleksi Baru"
     fav: 1..n    → urutan di "Foto customer" homepage
     foto: '…'    → jika nama file foto tidak mengikuti aturan di bawah,
                    tulis '<folder>/<nama-file>' tanpa .png
     ld: '…'      → jika ukuran LD kebaya ini berbeda dari series-nya

   Nama file foto mengikuti nama warna (huruf kecil, spasi → "-"):
     Foto produk  : image/<folder>/<folder>-<warna>.png
                    contoh: image/alanya/alanya-rose-gold.png
     Foto customer: image/foto-customer/<folder>-<warna>/1.jpeg … 5.jpeg */
const KEBAYA = [
  ['geulis',  'Burgundy',      400, '#6B1E2B', 'merah',  { new: true }],
  ['aruni',   'Blush Pink',    350, '#E7B7BC', 'pink',   { new: true, foto: 'edita/edita-blush-pink-2' }],
  ['aruni',   'Creamy Nude',   350, '#E3CDB5', 'nude',   { fav: 1 }],
  ['aruni',   'Navy',          350, '#1F2A4A', 'biru'],
  ['aruni',   'Nude Pink',     350, '#DDB3A7', 'pink'],
  ['aruni',   'Emerald',       350, '#11605E', 'hijau',  { foto: 'edita/edita-emerald-blue' }],
  ['kinasih', 'Grey',          350, '#9A9A98', 'netral'],
  ['kinasih', 'Ice Blue',      350, '#B9D3E2', 'biru'],
  ['kinasih', 'Maroon',        350, '#5E1A22', 'merah'],
  ['niskala', 'Ice Blue',      350, '#BED6E4', 'biru'],
  ['puspa',   'Mahogany',      350, '#5A2A1E', 'netral'],
  ['geulis',  'Baby Pink',     390, '#F2C6D0', 'pink',   { foto: 'elysian/elysian-baby-pink' }],
  ['geulis',  'Rose Gold',     400, '#C99A86', 'nude'],
  ['geulis',  'Butter Yellow', 390, '#EFD98F', 'kuning'],
  ['geulis',  'Creamy Nude',   390, '#E6D2BC', 'nude'],
];

/* ── KALENDER KETERSEDIAAN (Google Calendar) ───────────────────
   Kunci = '<nama series> <nama warna>' huruf kecil, sama seperti di
   Apps Script, mis. 'geulis rose gold'.
   Jika kebaya tidak ada di sini, tombolnya otomatis menjadi
   "Tanya Ketersediaan" via WhatsApp. */
const CALENDAR_MAP = {
  'aruni blush pink': '6e46ad371724c45469cc35261f26bbfc57c13120536a99dcef831d439eaabd94@group.calendar.google.com',
  'aruni creamy nude': '9127ebbeeabe2a326848dd7ac5db701e083a6c43bf02776a4093efe6bb9104d7@group.calendar.google.com',
  'aruni emerald': '64dc8a353782dd26f15cf78c5baa0e955c02dbfa28aa9d8123079db8d907035d@group.calendar.google.com',
  'aruni navy': '4867235079ccf5d557cca2e4c6fd60bf339627bcfb1e654038ed9fef662caa18@group.calendar.google.com',
  'aruni nude pink': '3f3250015daeb2306cbeb16593c2c91ca0fa2a07576d6d1c86b226e96e99378e@group.calendar.google.com',
  'geulis burgundy': 'b330923b75df8d76b7e42c52842d7100d5457fdbb9bd586d12f5dab74fec6258@group.calendar.google.com',
  'geulis butter yellow': '3b8eb3f1bab1495cc921ad55fdfb9350c12fe40d2456c03c17b6ca8ee24d4146@group.calendar.google.com',
  'geulis creamy nude': '844c6988d6141031340146ed9d30142488d8e3d1e90368538e4f04f1b2699fda@group.calendar.google.com',
  'geulis rose gold': '677eb611519f09b06c639e135799903ca199e496af593c82ad1419da128e4cbf@group.calendar.google.com',
  'geulis baby pink': '570512bb2115325a1dcb2a39256c90ed67a3f18629ee4062a1ad993875391c06@group.calendar.google.com',
  'kinasih grey': 'b18afcc8837b72f35ed1c63690bdcec11eb429f246b9cf3e2171ee82b0e372fc@group.calendar.google.com',
  'kinasih ice blue': 'b6446a4b2e2953ce145897c3b6f87896748c4693f9c70a4820f418f571839ca8@group.calendar.google.com',
  'kinasih maroon': 'ac5552d818239d791b4211fa2ac24d8dfc1ce8f5a400d725d8e158493847ad56@group.calendar.google.com',
  'niskala ice blue': '00347b17b153a11d0d5308d72c7c0fdba9157340ab8ab6816a33a51f6ad0bfd6@group.calendar.google.com',
  'puspa mahogany': 'aca64fe3a5bd9df634a601ed471c1cecadd81b726796b7093ea0c396c77159bf@group.calendar.google.com',
};


/* ── (tidak perlu diubah) menyusun data lengkap tiap kebaya ─── */
const slugify = t => t.toLowerCase().replace(/[()]/g, '').trim().replace(/\s+/g, '-');
const calKey  = t => t.toLowerCase().replace(/\s+/g, ' ').trim();

const ITEMS = KEBAYA.map(([s, color, price, hex, fam, o = {}], id) => {
  const ser = SERIES[s];
  const folder = ser.folder || s;
  const foto = o.foto || `${folder}/${folder}-${slugify(color)}`;   // mis. 'alanya/alanya-rose-gold'
  const file = foto.split('/').pop();
  const ld = o.ld || ser.ld;
  return {
    id, s, color, price, hex, fam, ld,
    key: `${s}-${slugify(color)}`,
    series: ser.name,
    isNew: !!o.new,
    fav: o.fav || 0,
    priceTxt: 'Rp ' + (price * 1000).toLocaleString('id-ID'),
    img: `image/${foto}.png`,
    photos: [1, 2, 3, 4, 5].map(n => `image/foto-customer/${file}/${n}.jpeg`),
    pkg: [ld, 'Kebaya Full Payet', 'Rok Songket', 'Hijab', 'Manset', 'Long torso', 'Ciput Tile', ser.veil, 'Free laundry', 'Free Resize'].filter(Boolean),
    cal: CALENDAR_MAP[calKey(`${ser.name} ${color}`)] || '',
  };
});

/* Pengingat di console browser jika ada kunci kalender yang tidak cocok dengan kebaya mana pun */
const unused = Object.keys(CALENDAR_MAP).filter(k => !ITEMS.some(i => calKey(`${i.series} ${i.color}`) === k));
if (unused.length) console.warn('Mojang.kebaya: kalender tanpa kebaya →', unused.join(', '));

window.MOJANG_DATA = { KONTAK, SERIES, FAMILIES, ITEMS };
})();
