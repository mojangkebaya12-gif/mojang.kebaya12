/* =============================================================
   MOJANG.KEBAYA — DATA
   Satu-satunya file yang perlu diubah untuk menambah / mengubah kebaya,
   harga, foto, atau kalender ketersediaan.
   ============================================================= */
(function () {
'use strict';

/* ── KONTAK ─────────────────────────────────────────────────── */
const KONTAK = {
  wa: '628985555506',           // WhatsApp 0898 5555 506 (format 62…)
  waTxt: '0898 5555 506',
  ig: 'mojang.kebaya',
};

/* ── SERIES ─────────────────────────────────────────────────────
   Urutan di sini = urutan tombol filter di katalog.
   ld   : ukuran Lingkar Dada (kosongkan jika belum ada)
   veil : jenis veil di paket
   desc : satu kalimat penjelasan series */
const SERIES = {
  aruni:   { name: 'Aruni',   ld: 'LD 98 max 105', veil: 'Veil/Ceruti Lepas Pasang', desc: 'Siluet klasik dengan payet rapat dan veil/ceruti lepas pasang.' },
  kinasih: { name: 'Kinasih', ld: 'LD 98 max 105', veil: 'Veil/Ceruti Lepas Pasang', desc: 'Palet kalem: grey, ice blue dan maroon. Cocok untuk wisuda dan lamaran.' },
  niskala: { name: 'Niskala', ld: '',              veil: 'Veil Lepas Pasang',        desc: 'Detail payet berlapis dalam warna ice blue yang lembut.' },
  puspa:   { name: 'Puspa',   ld: '',              veil: 'Veil Lepas Pasang',        desc: 'Satu warna mahogany yang dalam dan berkarakter.' },
  geulis:  { name: 'Geulis',  ld: 'LD 94 max 98',  veil: 'Veil Lepas Pasang',        desc: 'Series terlengkap, dari baby pink dan butter yellow hingga burgundy.' },
};

/* ── KELUARGA WARNA (filter "Warna") ────────────────────────── */
const FAMILIES = {
  pink: ['Pink', '#EBB9C2'], nude: ['Nude & Cream', '#E5D0B9'], merah: ['Merah', '#6B1E2B'],
  biru: ['Biru', '#9DBFD6'], hijau: ['Hijau', '#11605E'], kuning: ['Kuning', '#EFD98F'],
  netral: ['Coklat & Abu', '#8E7A70'],
};

/* ── KEBAYA ─────────────────────────────────────────────────────
   Satu baris = satu kebaya:
   ['series', 'Nama Warna', harga (ribu), '#kodeWarna', 'keluarga', { opsi }]

   opsi (boleh dikosongkan):
     new: true  → label "Baru", tampil paling atas
     extra: n   → jumlah foto tambahan di detail
     cust: n    → jumlah foto customer
     ld: '…'    → jika ukuran LD kebaya ini berbeda dari series-nya

   Nama file foto = <series>-<warna> (huruf kecil, spasi → "-"):
     Foto utama     : image/kebaya/geulis-rose-gold.jpg
     Foto katalog   : image/kebaya/thumb/geulis-rose-gold.jpg   (lebar ±640px)
     Foto tambahan  : image/kebaya/geulis-rose-gold-2.jpg, -3.jpg, …
     Foto customer  : image/customer/geulis-rose-gold-1.jpg, -2.jpg, …
   Kompres foto ke JPG lebar ±1200px (±250 KB) supaya cepat di HP. */
const KEBAYA = [
  ['geulis',  'Burgundy',      400, '#6B1E2B', 'merah',  { new: true, extra: 3 }],
  ['aruni',   'Blush Pink',    350, '#E7B7BC', 'pink',   { new: true, extra: 3 }],
  ['aruni',   'Creamy Nude',   350, '#E3CDB5', 'nude',   { extra: 4, cust: 7 }],
  ['aruni',   'Navy',          350, '#1F2A4A', 'biru',   { extra: 2, cust: 4 }],
  ['aruni',   'Nude Pink',     350, '#DDB3A7', 'pink',   { extra: 4, cust: 5 }],
  ['aruni',   'Emerald',       350, '#11605E', 'hijau',  { extra: 3 }],
  ['kinasih', 'Grey',          350, '#9A9A98', 'netral', { cust: 5 }],
  ['kinasih', 'Ice Blue',      350, '#B9D3E2', 'biru',   { cust: 4 }],
  ['kinasih', 'Maroon',        350, '#5E1A22', 'merah',  { cust: 4 }],
  ['niskala', 'Ice Blue',      350, '#BED6E4', 'biru',   { extra: 1, cust: 4 }],
  ['puspa',   'Mahogany',      350, '#5A2A1E', 'netral', { cust: 5 }],
  ['geulis',  'Baby Pink',     390, '#F2C6D0', 'pink',   { extra: 1, cust: 6 }],
  ['geulis',  'Rose Gold',     400, '#C99A86', 'nude',   { extra: 3 }],
  ['geulis',  'Butter Yellow', 390, '#EFD98F', 'kuning', { extra: 1, cust: 1 }],
  ['geulis',  'Creamy Nude',   390, '#E6D2BC', 'nude',   { extra: 1 }],
];

/* ── KALENDER KETERSEDIAAN (Google Calendar) ───────────────────
   Kunci = '<series> <warna>' huruf kecil, mis. 'geulis rose gold'.
   Jika kebaya tidak ada di sini, tombolnya menjadi "Tanya Ketersediaan". */
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
const range = n => Array.from({ length: n }, (_, i) => i);

const ITEMS = KEBAYA.map(([s, color, price, hex, fam, o = {}], order) => {
  const ser = SERIES[s];
  const key = `${s}-${slugify(color)}`;
  const ld = o.ld || ser.ld;
  return {
    order, s, color, price, hex, fam, ld, key,
    series: ser.name,
    name: `${ser.name} ${color}`,
    isNew: !!o.new,
    priceTxt: 'Rp ' + (price * 1000).toLocaleString('id-ID'),
    thumb: `image/kebaya/thumb/${key}.jpg`,
    photos: [`image/kebaya/${key}.jpg`, ...range(o.extra || 0).map(i => `image/kebaya/${key}-${i + 2}.jpg`)],
    cust: range(o.cust || 0).map(i => `image/customer/${key}-${i + 1}.jpg`),
    pkg: ['Kebaya Full Payet', 'Rok Songket', 'Hijab', 'Manset', 'Long Torso', 'Ciput Tile', ser.veil, 'Free Laundry', 'Free Resize'],
    cal: CALENDAR_MAP[`${ser.name} ${color}`.toLowerCase()] || '',
  };
});

window.MOJANG_DATA = { KONTAK, SERIES, FAMILIES, ITEMS };
})();
