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
| `verifikasi.html` | Verifikasi lokasi HP penyewa luar kota (lihat di bawah). **Dibuat otomatis** |
| `booking.html` | Pintu masuk **form booking** (Google Form): deteksi lokasi HP otomatis, lalu membuka Google Form (lihat di bawah). **Dibuat otomatis** |
| `cek-luar-kota.html` | **Khusus admin**: link verifikasi untuk penyewa + cek otomatis balasan penyewa (lihat di bawah). **Dibuat otomatis** |
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

1. Penyewa mengisi nama (sesuai KTP) dan nomor WhatsApp. Begitu mulai mengisi, lokasi HP
   terdeteksi otomatis (browser meminta izin sekali).
2. Saat menekan *Lanjut ke form booking*, nama, nomor WA, link Google Maps, akurasi dan waktu
   tercatat ke Google Form **"Log Lokasi Booking"** (hanya Anda yang melihat hasilnya: buka form itu
   → tab *Responses*, atau *Link to Sheets* supaya jadi spreadsheet).
3. Google Form **"Booking Mojang.kebaya"** terbuka dengan nama & nomor WA sudah terisi. Form ini
   tidak diubah sama sekali.

- Jika lokasi ditolak / GPS mati, booking tetap bisa lanjut; di log tertulis
  `belum dibagikan (izin ditolak)`. Minta verifikasi lokasi lewat WhatsApp sebelum mengirim kebaya.
- Link bisa langsung berisi kebaya & tanggal: `booking.html?k=aruni-navy&t=2026-11-21`
  (kolom Kebaya & Tanggal acara di Google Form ikut terisi).
- Cocokkan log dengan jawaban form booking lewat **nama + nomor WA**.
- Penyewa yang dulu pernah mulai mengisi form booking (dan belum selesai) akan melihat isian lamanya,
  bukan nama yang terisi otomatis. Itu perilaku Google Form.
- Alamat kedua Google Form dan ID pertanyaannya ada di `assets/js/data.js` → `FORM_BOOKING`.
  Jika pertanyaan Nama/Nomor WhatsApp/Kebaya/Tanggal acara di form booking dihapus lalu dibuat ulang,
  ID-nya berubah: buka form → ⋮ → *Get pre-filled link*, isi, salin link, lalu ambil angka `entry.…`.
- Hapus baris log paling lambat 30 hari setelah kebaya kembali (janji di halaman booking).

## Verifikasi lokasi sewa luar kota
Halaman `verifikasi.html` (tidak muncul di Google). Penyewa luar kota membagikan lokasi HP
tiga kali; setiap kali, pesan WhatsApp berisi nama, kebaya, tanggal, link Google Maps dan
akurasi lokasi terkirim ke nomor Mojang.Kebaya.

**Lokasi terdeteksi otomatis saat penyewa mengisi form** (tanpa tombol), setelah penyewa memilih
*Izinkan* di browser:
- **Booking di katalog:** begitu memilih "Kirim ke luar kota". Pesan booking berisi baris
  `Lokasi HP:` (link Google Maps), jadi ini sekaligus langkah 1.
- **Cek ongkir di beranda:** begitu mulai mengisi form. Tidak wajib; tetap bisa tanya ongkir tanpa lokasi.
- **Halaman verifikasi:** begitu mulai mengisi form. Wajib; jika ditolak atau GPS mati, muncul
  petunjuk + tombol "Coba lagi". Lokasi yang lebih dari 15 menit dideteksi ulang otomatis.

Lokasi hanya dideteksi sekali per form (bukan pelacakan terus-menerus).
Link langkah 1 di bawah hanya perlu dikirim jika pesan booking bertuliskan
`Lokasi HP: belum dibagikan`, atau penyewa booking lewat jalur lain (Instagram, chat langsung,
tombol WhatsApp di halaman kebaya).

### Halaman admin: `cek-luar-kota.html`
Buka **https://mojangkebaya.vercel.app/cek-luar-kota.html** di HP (simpan sebagai bookmark;
halaman ini tidak muncul di Google dan tidak ditautkan dari menu).

1. **Tempel pesan booking** penyewa di kotak *Langkah 1* → kebaya & tanggal acara terisi sendiri.
2. **Link untuk penyewa** muncul untuk langkah 1, 2 dan 3, lengkap dengan tanggal kapan dikirim
   (H-1 dan H+1). Isi nomor WA penyewa supaya tombol *Kirim lewat WhatsApp* langsung ke chat-nya,
   atau tekan *Salin pesan*.
3. **Tempel balasan penyewa** di kotak langkahnya. Halaman mengecek otomatis:
   - lokasi ada atau belum, dan akurasinya (di atas ±500 m = GPS mati);
   - jarak antarlangkah (di atas 25 km diberi tanda: tanyakan dulu ke penyewa);
   - kirim kembali tepat waktu atau terlambat berapa jam dari batas H+1 pukul 12.00 WIB;
   - nama, kebaya dan tanggal acara sama di semua pesan; pesan yang salah kotak.
4. **Daftar cek sebelum kirim**: kebaya baru boleh dikirim setelah semua tercentang
   (DP & pelunasan dicek di mutasi rekening, KTP, lokasi, video packing, resi).

Isian hanya tersimpan di tab browser itu, tidak dikirim ke mana pun, dan hilang saat tab
ditutup. Tekan **Kosongkan semua isian** sebelum mengecek penyewa berikutnya.

Link juga bisa dibuat manual (ganti `k` = nama file kebaya di folder `kebaya/`, `t` = tanggal acara):

| Kapan | Link |
|---|---|
| Setelah DP masuk (jika lokasi belum ada) | `https://mojangkebaya.vercel.app/verifikasi.html?langkah=1&k=aruni-navy&t=2026-11-21` |
| H-1, paket sampai | `https://mojangkebaya.vercel.app/verifikasi.html?langkah=2&k=aruni-navy&t=2026-11-21` |
| H+1, kirim kembali | `https://mojangkebaya.vercel.app/verifikasi.html?langkah=3&k=aruni-navy&t=2026-11-21` |

Yang dicek:
- **Langkah 1:** buka link peta. Lokasi harus di kota yang sama dengan alamat kirim, dan nama
  harus sama dengan KTP. Jika jauh berbeda, tanyakan dulu sebelum mengirim kebaya.
- **Langkah 2:** lokasi harus dekat alamat kirim.
- **Langkah 3:** lokasi biasanya di agen kurir; cek nomor resi di situs kurir.
- **Akurasi** di atas ±500 m berarti GPS mati. Minta penyewa menyalakan GPS lalu kirim ulang.
- Lokasi diambil hanya sekali per langkah (bukan pelacakan terus-menerus), dan aplikasi lokasi
  palsu bisa mengakalinya. Jadi tetap cocokkan dengan KTP, alamat dan nomor resi.

Denda keterlambatan tidak dipatok di syarat & ketentuan ("tergantung lama keterlambatan");
halaman admin menampilkan berapa jam keterlambatannya sebagai dasar.

Janji di halaman itu: data lokasi dihapus paling lambat **30 hari** setelah kebaya kembali.
Hapus pesan lokasi di WhatsApp sesuai janji tersebut (UU PDP). Untuk mengubah angkanya, ubah
teks di bagian "2c" pada `tools/buat-halaman.mjs`, lalu jalankan pembuat halaman lagi.

## Privasi
- Kalender ketersediaan (Google Calendar) bisa dilihat siapa saja, **termasuk judul,
  catatan dan lokasi acara**: tulis judul cukup "Dipesan", jangan nama, nomor WA atau
  alamat customer di bagian mana pun.
- Ulasan di `data.js` harus ulasan asli, dengan izin customer.

## Domain sendiri
Jika nanti memakai domain sendiri (mis. mojangkebaya.com), tambahkan di Vercel →
Settings → Domains, lalu ganti alamat `mojangkebaya.vercel.app` di `index.html`,
`katalog.html` dan `tools/buat-halaman.mjs` (konstanta `SITE`), dan jalankan pembuat halaman lagi.
