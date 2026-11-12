# Mojang.Kebaya — panduan website

Website statis (HTML + CSS + JavaScript, tanpa build). Setiap push ke branch
`main` di GitHub otomatis tayang di https://mojangkebaya.vercel.app lewat Vercel.

## Isi folder
| File / folder | Fungsi |
|---|---|
| `index.html` | Beranda: foto pembuka + judul, cerita, series, foto customer, booking cepat, info sewa & syarat |
| `katalog.html` | Katalog: semua kebaya, filter series & warna, urutan harga, detail kebaya, cek tanggal, booking |
| `kebaya/*.html` | Satu halaman per kebaya (untuk Google & dibagikan di WhatsApp). **Dibuat otomatis** |
| `panduan/*.html` | Artikel panduan (harga & cara booking, tips warna) + daftar artikel. **Dibuat otomatis** dari `tools/panduan.mjs` |
| `404.html`, `sitemap.xml`, `robots.txt` | Halaman "tidak ditemukan" & data untuk Google. **Dibuat otomatis** |
| `assets/js/data.js` | **Semua data**: kontak, series, kebaya & harga, ulasan, kalender ketersediaan |
| `assets/js/site.js` | Logika katalog, detail, menu, link WhatsApp, statistik klik |
| `assets/css/site.css` | Semua tampilan |
| `tools/buat-halaman.mjs` | Pembuat halaman otomatis (lihat di bawah) |
| `vercel.json` | Pengaturan Vercel: cache foto, header keamanan, favicon |
| `image/` | Foto: `editorial/` (beranda; versi HP di `editorial/m/`), `kebaya/` (+ `thumb/`), `customer/`, `cutout/`, `logo/` |

## Mengubah kebaya, harga, foto atau ulasan
> Setelah mengubah `site.css` atau `site.js` juga jalankan `node tools/buat-halaman.mjs`,
> supaya tanda versi (`?v=…`) di semua halaman ikut berubah dan browser memuat file terbaru.

1. Ubah `assets/js/data.js` (petunjuk lengkap ada di dalam file itu).
2. Jalankan sekali di folder ini: `node tools/buat-halaman.mjs`
   → halaman `kebaya/`, sitemap, 404 dan daftar katalog untuk Google ikut diperbarui.
3. Commit & push (mis. lewat GitHub Desktop → **Push origin**).

## Artikel panduan
Isi artikel ada di `tools/panduan.mjs` (harga, warna & ukuran di dalamnya diambil otomatis
dari `data.js`). Untuk menambah artikel, salin satu blok artikel di file itu, ubah isinya,
lalu jalankan `node tools/buat-halaman.mjs`. Artikel baru otomatis masuk daftar panduan & sitemap.

## Foto
- Foto kebaya: JPG lebar ±1200px, ±250 KB. Foto katalog (`thumb/`): lebar ±640px.
- Foto beranda: simpan versi besar di `image/editorial/` dan versi HP (lebar 800px)
  di `image/editorial/m/` dengan nama sama. Contoh (Mac):
  `sips -s format jpeg -s formatOptions 50 --resampleWidth 800 image/editorial/foto.jpg --out image/editorial/m/foto.jpg`
- Foto di-cache browser 1 hari. Jika mengganti foto dengan nama yang sama, pengunjung
  lama bisa melihat foto lama sampai 1 hari; untuk perubahan langsung, pakai nama file baru.
- Foto series yang belum tayang disimpan di luar website: `../foto-belum-tayang/`.

## Statistik pengunjung
Kode Vercel Web Analytics sudah terpasang. Aktifkan sekali di dashboard Vercel:
proyek → **Analytics** → **Enable**. Klik WhatsApp & booking dicatat sebagai event
(event khusus butuh paket Vercel Pro; jumlah pengunjung tetap tercatat di paket gratis).

## Privasi
- Kalender ketersediaan (Google Calendar) bisa dilihat siapa saja, **termasuk judul,
  catatan dan lokasi acara**: tulis judul cukup "Dipesan", jangan nama, nomor WA atau
  alamat customer di bagian mana pun.
- Ulasan di `data.js` harus ulasan asli, dengan izin customer.

## Domain sendiri
Jika nanti memakai domain sendiri (mis. mojangkebaya.com), tambahkan di Vercel →
Settings → Domains, lalu ganti alamat `mojangkebaya.vercel.app` di `index.html`,
`katalog.html` dan `tools/buat-halaman.mjs` (konstanta `SITE`), dan jalankan pembuat halaman lagi.
