/* =============================================================
   MOJANG.KEBAYA — Loader (animasi logo)
   Dimuat di <head> TANPA defer supaya kelas <html> sudah terpasang
   sebelum halaman tampil (tidak ada kedipan).

   - Kunjungan pertama per sesi : logo "digambar" garis emas → terisi → tirai naik.
   - Kunjungan berikutnya / reduced-motion : loader dilewati.
   - Tidak pernah menahan halaman lebih dari MAX ms.
   - Memicu event  'mk:ready'  di document saat halaman siap ditampilkan.
   ============================================================= */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var seen = false;
  try { seen = sessionStorage.getItem('mk-seen') === '1'; sessionStorage.setItem('mk-seen', '1'); } catch (e) {}

  var skip = seen || reduce;
  if (skip) root.classList.add('ld-skip');

  var MIN = skip ? 0 : 1700;   // lama minimum animasi logo (ms) — cukup untuk 1x gambar
  var MAX = 3200;              // batas atas: halaman SELALU terbuka setelah ini
  var t0 = Date.now();
  var done = false;

  function ready() {
    window.__mkReady = true;
    var ev;
    try { ev = new CustomEvent('mk:ready'); } catch (e) { ev = document.createEvent('Event'); ev.initEvent('mk:ready', false, false); }
    document.dispatchEvent(ev);
  }

  function finish() {
    if (done) return;
    done = true;
    var wait = Math.max(0, MIN - (Date.now() - t0));
    setTimeout(function () {
      root.classList.add('ld-out');
      ready();
      setTimeout(function () {
        var l = document.getElementById('loader');
        if (l && l.parentNode) l.parentNode.removeChild(l);
      }, 1100);
    }, wait);
  }

  if (skip) {
    // tidak perlu menunggu gambar — cukup sampai HTML terbaca
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', finish);
    else finish();
  } else {
    // tunggu foto utama + font, tapi tidak lebih dari MAX
    window.addEventListener('load', finish);
    setTimeout(finish, MAX);
  }

  /* ── Pengaman (dari versi lama): jika file JS lain gagal dimuat,
        halaman tetap tampil & penyebabnya ditulis di console. ── */
  setTimeout(function () {
    var hilang = !window.MOJANG_DATA ? 'assets/js/data.js'
               : !window.MOJANG ? 'assets/js/main.js'
               : (document.getElementById('jv') && !window.MKHome) ? 'assets/js/home-experience.js'
               : (document.getElementById('results') && !document.querySelector('#results > *')) ? 'assets/js/katalog.js' : '';
    if (!hilang) return;
    finish();
    root.classList.add('ld-out', 'mk-safe');
    var els = document.querySelectorAll('.rv, .split');
    for (var i = 0; i < els.length; i++) els[i].classList.add('in');
    console.error('Mojang.kebaya: file ' + hilang + ' tidak ditemukan atau error.');
    if (location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      var bar = document.createElement('div');
      bar.className = 'dev-warn';
      bar.textContent = 'File ' + hilang + ' tidak ditemukan. Periksa folder assets/js/ (hanya terlihat di komputer).';
      document.body.appendChild(bar);
    }
  }, 4000);
})();
