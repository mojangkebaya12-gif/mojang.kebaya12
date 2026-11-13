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
| `booking.html` | Pintu masuk **form booking** (Google Form): deteksi lokasi HP otomatis, lalu membuka Google Form (lihat di bawah). **Dibuat otomatis** |
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

## Form booking + lokasi HP (`booking.html`)
Bagikan **https://mojangkebaya.vercel.app/booking.html** ke penyewa, **menggantikan link Google Form**
booking yang lama (di balasan WhatsApp, bio Instagram, dll.).

1. Penyewa memilih **Ambil di Sukabumi** atau **Dikirim ke luar kota**, lalu mengisi nama (sesuai KTP)
   dan nomor WhatsApp.
2. **Ambil di Sukabumi:** tanpa lokasi (Anda bertemu langsung & melihat KTP), langsung lanjut.
   **Dikirim ke luar kota:** lokasi HP langsung terdeteksi (browser meminta izin sekali) dan **wajib**.
   Saat menekan *Lanjut ke form booking*, nama, nomor WA, link Google Maps, akurasi, waktu, serta
   jenis HP & browser tercatat ke Google Form **"Log Lokasi Booking"**. Hasilnya masuk otomatis ke
   spreadsheet booking **"Contact Information Mojang Kebaya (Responses)"**, tab **"Log Lokasi Luar Kota"**
   (satu baris per penyewa; hanya Anda yang bisa melihatnya).
3. Google Form **"Booking Mojang.kebaya"** terbuka dengan nama, nomor WA & pengambilan sudah terisi.
   Form ini tidak diubah sama sekali.

- **Cek tanggal otomatis.** Penyewa memilih kebaya & tanggal acara di booking.html; website langsung
  mengecek Google Calendar kebaya itu lewat web app Apps Script "Cek ketersediaan tanggal" (hanya
  mengirim tanggal, tanpa nama; alamatnya di `assets/js/data.js` → `FORM_BOOKING.ketersediaan`).
  Aturannya sama dengan script booking: jarak minimal 3 hari (Sukabumi) / 5 hari (luar kota). Kalau
  bentrok, tombol *Lanjut* ditahan dan penyewa ditawari kebaya lain yang kosong. Kalau pengecekan gagal
  (koneksi), penyewa tetap bisa lanjut; script booking tetap mengecek ulang setelah form masuk.
- **Lokasi wajib untuk luar kota.** Jika lokasi ditolak / GPS mati, penyewa **tidak bisa lanjut** ke form booking; ia
  melihat pengingat cara mengizinkan lokasi (sesuai iPhone/Android/aplikasi) + tombol *Coba lagi*.
- Penyewa yang tertahan tercatat **sekali** di log dengan Lokasi HP `DITOLAK, belum bisa lanjut (…)`,
  plus jenis HP & browser di Keterangan (mis. `iPhone · Instagram`). Hubungi penyewa itu lewat WhatsApp:
  minta buka link di Safari/Chrome dan izinkan lokasi, atau kirim lokasi lewat WhatsApp
  (ikon + → Lokasi → Kirim Lokasi Anda Saat Ini).
- Link bisa langsung berisi kebaya & tanggal: `booking.html?k=aruni-navy&t=2026-11-21`
  (kolom Kebaya & Tanggal acara di Google Form ikut terisi).
- Cocokkan log dengan jawaban form booking lewat **nama + nomor WA**.
- Penyewa yang dulu pernah mulai mengisi form booking (dan belum selesai) akan melihat isian lamanya,
  bukan nama yang terisi otomatis. Itu perilaku Google Form.
- Alamat kedua Google Form dan ID pertanyaannya ada di `assets/js/data.js` → `FORM_BOOKING`.
  Jika pertanyaan Nama/Nomor WhatsApp/Kebaya/Tanggal acara di form booking dihapus lalu dibuat ulang,
  ID-nya berubah: buka form → ⋮ → *Get pre-filled link*, isi, salin link, lalu ambil angka `entry.…`.
  Jika teks pilihan *Pengambilan* di Google Form diubah, samakan juga di `FORM_BOOKING.pengambilan`.
- Hapus baris log paling lambat 30 hari setelah kebaya kembali (janji di halaman booking).

## Gambar pratinjau link (WhatsApp, IG, FB)
- Gaya kartu undangan (logo emas, judul miring, bingkai emas di latar marun):
  `image/og/beranda.jpg` (beranda), `image/og/katalog.jpg` (katalog), `image/og/booking.jpg` (form booking).
  Halaman tiap kebaya memakai foto kebayanya sendiri.
- Jika jumlah kebaya atau harga berubah, buat ulang gambar katalog (perintah ada di bagian atas
  `tools/og-gambar.swift`), lalu push.
- WhatsApp menyimpan pratinjau lama di HP. Untuk melihat yang baru, kirim link dengan tambahan
  `?v=2`, `?v=3`, dst., dan tunggu kotak pratinjau muncul sebelum menekan kirim.

## Privasi
- Kalender ketersediaan (Google Calendar) bisa dilihat siapa saja, **termasuk judul,
  catatan dan lokasi acara**: tulis judul cukup "Dipesan", jangan nama, nomor WA atau
  alamat customer di bagian mana pun.
- Ulasan di `data.js` harus ulasan asli, dengan izin customer.

## Domain sendiri
Jika nanti memakai domain sendiri (mis. mojangkebaya.com), tambahkan di Vercel →
Settings → Domains, lalu ganti alamat `mojangkebaya.vercel.app` di `index.html`,
`katalog.html` dan `tools/buat-halaman.mjs` (konstanta `SITE`), dan jalankan pembuat halaman lagi.
