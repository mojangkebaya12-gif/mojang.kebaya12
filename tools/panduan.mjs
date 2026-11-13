/* =============================================================
   MOJANG.KEBAYA — ARTIKEL PANDUAN (folder panduan/)
   Isi artikel ada di sini; halaman HTML-nya dibuat oleh
   tools/buat-halaman.mjs. Harga, warna & ukuran diambil langsung dari
   assets/js/data.js, jadi artikel ikut benar saat harga berubah.

   Menambah artikel: salin satu blok { slug, judul, … } di bawah,
   ubah isinya, lalu jalankan  node tools/buat-halaman.mjs
   ============================================================= */

export function daftarArtikel({ ITEMS, SERIES, FAMILIES, esc }) {
  const rp = n => 'Rp' + (n * 1000).toLocaleString('id-ID');
  const prices = ITEMS.map(i => i.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const link = i => `<a href="../kebaya/${i.key}.html">${esc(i.name)}</a>`;
  const seriesKeys = Object.keys(SERIES);
  const fmtLD = ld => ld.replace(/ max (\d+)/, ' (maks. $1)');   // "LD 94 max 98" → "LD 94 (maks. 98)"

  // tabel harga: satu baris per kebaya, dikelompokkan per series
  const tabelHarga = `<div class="art-table" tabindex="0" role="region" aria-label="Daftar harga sewa kebaya">
      <table>
        <thead><tr><th scope="col">Kebaya</th><th scope="col">Harga / 3 hari</th><th scope="col">Ukuran</th></tr></thead>
        <tbody>
${seriesKeys.flatMap(s => ITEMS.filter(i => i.s === s)).map(i => `          <tr><td>${link(i)}</td><td>${i.priceTxt}</td><td>${esc(i.ld ? fmtLD(i.ld) : 'Tanya via WA')}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>`;

  // warna per keluarga warna, dengan link ke filter katalog
  const perWarna = Object.entries(FAMILIES)
    .map(([k, [nama]]) => [k, nama, ITEMS.filter(i => i.fam === k)])
    .filter(([, , list]) => list.length);
  const daftarWarna = `<ul class="art-colors">
${perWarna.map(([k, nama, list]) => `      <li><a class="art-fam" href="../katalog.html?warna=${k}"><i style="background:${FAMILIES[k][1]}"></i>${esc(nama)}</a> — ${list.map(link).join(', ')}</li>`).join('\n')}
    </ul>`;

  const pkg = ITEMS[0].pkg.filter(p => !/^Free /.test(p));
  const ldSeries = seriesKeys.filter(s => SERIES[s].ld).map(s => `${SERIES[s].name}: ${fmtLD(SERIES[s].ld)}`);

  return [
    {
      slug: 'sewa-kebaya-wisuda-sukabumi',
      judul: 'Sewa Kebaya Wisuda di Sukabumi: Harga, Isi Paket & Cara Booking',
      ringkas: `Daftar harga sewa kebaya wisuda di Sukabumi (${rp(min)}–${rp(max)} untuk 3 hari), isi paket, ukuran, cara booking dan pengiriman ke seluruh Pulau Jawa.`,
      foto: 'image/editorial/wisuda-nude.jpg',
      fotoAlt: 'Wisudawati memakai kebaya warna creamy nude',
      isi: `
    <p class="art-lead">Wisuda cukup sekali, jadi wajar kalau ingin tampil maksimal tanpa harus membeli kebaya baru. Di Mojang.Kebaya, kamu bisa menyewa kebaya full payet lengkap dengan rok songket, hijab dan veil, mulai ${rp(min)} untuk 3 hari. Berikut panduan lengkapnya.</p>

    <h2>Berapa harga sewa kebaya wisuda?</h2>
    <p>Saat ini tersedia ${ITEMS.length} pilihan kebaya dari ${seriesKeys.length} series. Harga sudah termasuk satu paket lengkap untuk masa sewa 3 hari, plus laundry dan resize gratis.</p>
    ${tabelHarga}
    <p class="art-note">Klik nama kebaya untuk melihat foto lengkap, foto customer dan tanggal yang masih kosong.</p>

    <h2>Apa saja isi paketnya?</h2>
    <p>Setiap kebaya disewakan dalam satu paket, jadi kamu tidak perlu mencari rok atau hijab sendiri:</p>
    <ul>
${pkg.map(p => `      <li>${esc(p)}</li>`).join('\n')}
    </ul>
    <p>Kebaya sudah dicuci sebelum dipakai, dan kamu tidak perlu mencucinya setelah acara.</p>

    <h2>Ukuran & resize gratis</h2>
    <p>Ukuran kebaya mengacu pada lingkar dada (LD) — ${ldSeries.join('; ')}. Untuk series lain, tanyakan ukurannya lewat WhatsApp. Kalau ukurannya perlu disesuaikan, resize gratis; konfirmasikan paling lambat 3 hari sebelum tanggal sewa.</p>
    <p>Fitting sangat disarankan: datang langsung ke Sukabumi, atau fitting jarak jauh dengan mengirim foto dan ukuran LD lewat WhatsApp.</p>

    <h2>Cara booking</h2>
    <ol class="art-steps">
      <li><strong>Pilih kebaya & cek tanggal.</strong> Di halaman tiap kebaya ada kalender yang menunjukkan tanggal yang sudah dipesan.</li>
      <li><strong>Hubungi kami lewat WhatsApp</strong> dengan nama kebaya, tanggal acara, dan apakah akan diambil atau dikirim.</li>
      <li><strong>Bayar DP Rp100.000.</strong> Booking terkonfirmasi setelah DP diterima. DP ini menjadi deposit (jaminan) dan dikembalikan setelah kebaya kembali. Rekening resmi tercantum di <a href="../index.html#syarat">syarat & ketentuan</a> — kami tidak pernah meminta transfer ke rekening lain.</li>
      <li><strong>Pelunasan paling lambat H-1</strong> pengambilan: harga sewa dibayar penuh, dengan menyertakan foto KTP asli.</li>
      <li><strong>Ambil H-1 di Sukabumi</strong> atau kebaya dikirim dan tiba H-1. Pakai di hari H, lalu kembalikan H+1 (Sukabumi maks. 16.00 WIB, luar kota maks. 12.00 WIB).</li>
    </ol>

    <h2>Sewa dari luar Sukabumi</h2>
    <p>Kami mengirim ke Banten, DKI Jakarta, Jawa Barat, Jawa Tengah, DI Yogyakarta dan Jawa Timur. Kebaya tiba sehari sebelum acara; ongkos kirim ditanggung penyewa. Fitting dilakukan jarak jauh lewat foto dan ukuran LD, paling lambat H-3.</p>

    <h2>Tips supaya tidak kehabisan</h2>
    <ul>
      <li>Booking begitu jadwal wisuda keluar — tanggal wisuda satu kampus biasanya sama, jadi kebaya favorit cepat terisi.</li>
      <li>Ukur lingkar dada sebelum memilih, lalu bandingkan dengan ukuran LD tiap series.</li>
      <li>Lihat foto customer di halaman kebaya untuk membayangkan tampilannya saat dipakai.</li>
      <li>Bingung memilih warna? Baca <a href="tips-memilih-warna-kebaya-wisuda.html">tips memilih warna kebaya wisuda</a>.</li>
    </ul>`,
    },
    {
      slug: 'tips-memilih-warna-kebaya-wisuda',
      judul: 'Tips Memilih Warna Kebaya Wisuda yang Cocok untuk Kulit, Toga & Foto',
      ringkas: 'Cara memilih warna kebaya wisuda: menyesuaikan warna kulit, toga dan selempang, suasana foto, serta acara setelah wisuda — lengkap dengan pilihan warna kebaya sewa di Sukabumi.',
      foto: 'image/editorial/hero-navy.jpg',
      fotoAlt: 'Kebaya Aruni Navy dipakai saat wisuda',
      isi: `
    <p class="art-lead">Warna kebaya menentukan kesan pertama di foto wisuda yang akan kamu simpan bertahun-tahun. Tidak ada aturan baku, tapi beberapa pertimbangan sederhana ini bisa membantu memilih warna yang paling pas.</p>

    <h2>1. Perhatikan toga dan selempang</h2>
    <p>Toga umumnya berwarna gelap, jadi hampir semua warna kebaya akan terlihat menonjol. Yang perlu diperhatikan justru warna selempang atau samir fakultas: pilih kebaya yang senada atau netral supaya tidak bertabrakan. Warna nude, cream dan abu-abu aman dipadukan dengan hampir semua warna samir.</p>

    <h2>2. Sesuaikan dengan warna kulit</h2>
    <p>Sebagai panduan umum:</p>
    <ul>
      <li><strong>Kulit dengan nada hangat</strong> (urat nadi terlihat kehijauan) biasanya cocok dengan warna hangat seperti nude, creamy, rose gold, butter yellow, maroon dan burgundy.</li>
      <li><strong>Kulit dengan nada dingin</strong> (urat nadi terlihat kebiruan) biasanya cocok dengan ice blue, abu-abu, navy, blush pink dan baby pink.</li>
      <li><strong>Nada netral</strong> umumnya cocok dengan hampir semua warna — tinggal pilih sesuai selera.</li>
    </ul>
    <p>Cara paling pasti tetap mencoba langsung: fitting di Sukabumi, atau lihat foto customer di halaman tiap kebaya.</p>

    <h2>3. Pikirkan suasana foto</h2>
    <p>Warna lembut seperti pink, nude dan butter yellow memberi kesan ringan dan segar, terutama untuk foto di luar ruangan pada siang hari. Warna yang lebih dalam seperti navy, emerald, maroon dan burgundy memberi kesan elegan dan tetap tegas di dalam gedung atau di bawah lampu.</p>

    <h2>4. Satu kebaya untuk lebih dari satu acara</h2>
    <p>Masa sewa 3 hari bisa dimanfaatkan untuk acara lain di sekitar hari wisuda, misalnya makan bersama keluarga atau foto studio. Warna netral seperti creamy nude dan abu-abu paling mudah dipakai di berbagai suasana.</p>

    <h2>Pilihan warna di Mojang.Kebaya</h2>
    <p>Semua kebaya bisa disaring per warna di katalog. Klik nama warna untuk melihat semua pilihannya:</p>
    ${daftarWarna}
    <p>Sudah menemukan warna yang pas? Lihat juga <a href="sewa-kebaya-wisuda-sukabumi.html">harga, isi paket dan cara booking</a>.</p>`,
    },
  ];
}
