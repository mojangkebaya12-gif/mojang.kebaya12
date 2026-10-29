# Mojang.kebaya — paket lengkap (tinggal pasang)

## Cara pasang (±2 menit)
1. Ekstrak zip ini ke folder proyek website (folder yang berisi `index.html`). Timpa semua file yang ditanya.
2. Salin foto kebaya Anda ke folder `image/` — daftar nama file yang dibaca website ada di `image/BACA-FOTO.txt`.
3. Commit & push ke GitHub → Vercel deploy otomatis. Tidak ada build step, tidak perlu install apa pun.

Coba dulu di komputer: buka `index.html` langsung di browser (klik 2x), atau jalankan `npx serve` di folder proyek.

## Isi paket
| File | Fungsi |
|---|---|
| `index.html` | Homepage: galeri 3D yang bergerak mengikuti scroll |
| `katalog.html` | Katalog: filter series, warna, harga, pencarian, urutan, tampilan |
| `assets/css/loader.css` | Animasi loading logo (garis emas digambar → terisi) |
| `assets/css/experience.css` | Tampilan bersama: warna, huruf, header, footer, bingkai, galeri, jendela detail |
| `assets/css/katalog.css` | Tampilan khusus katalog |
| `assets/js/loader.js` | Logika loader (1x per sesi, maks 3,2 detik) |
| `assets/js/data.js` | **Semua data produk** — harga, warna, ukuran, kalender. Satu-satunya file yang perlu diubah untuk produk |
| `assets/js/main.js` | Jendela detail, kalender ketersediaan, link WhatsApp |
| `assets/js/katalog.js` | Logika filter katalog |
| `assets/js/home-experience.js` | Isi homepage: bingkai series, titik emas, koleksi baru, foto customer, formulir WA |
| `assets/js/journey.js` | Kamera 3D (GSAP ScrollTrigger + mesin cadangan bila CDN gagal) |
| `image/logo/` | Logo vektor + favicon |
| `image/BACA-FOTO.txt` | Daftar nama foto yang dibutuhkan |

`data.js`, `main.js` dan `katalog.js` identik dengan versi live (dicek per karakter).
File lama `assets/css/style.css` dan `assets/js/home.js` tidak dipakai lagi — boleh dihapus.

## Mengubah tampilan
- Sudut bingkai foto: `--fr` di bagian atas `experience.css` (18px desktop, 14px HP). `0px` = kotak tajam.
- Warna: token `--ivory`, `--espresso`, `--burgundy`, `--rose`, `--champagne`, `--gold` di `experience.css`.
- Panjang scroll galeri: `VH_PER_SECOND` (desktop) dan `VH_PER_SECOND_P` (HP) di `journey.js`.
- Titik henti scroll di HP: hapus baris `scroll-snap-type` di `experience.css` jika tidak diinginkan.
- Foto hero = kebaya pertama bertanda `new: true` di `data.js`. Jika berganti, ubah juga `<link rel="preload">` di `index.html`.

## Perilaku
- Desktop & HP: kamera 3D (CSS perspective, tanpa WebGL) — Potret → Galeri → Koleksi → Detail → Momen → Sewa.
- HP: objek ditempatkan otomatis di ruang kosong di atas teks bab (diukur per HP), scroll berhenti halus di tiap bab.
- "Kurangi Gerakan" aktif / tanpa JS / HP sangat lemah: bab tampil berurutan dengan transisi foto ringan.
- Foto yang belum ada → bingkai menampilkan warna kebaya + logo ("Foto segera hadir").
- Booking tetap lewat WhatsApp 0898 5555 506 dengan format pesan yang sama seperti sebelumnya.
