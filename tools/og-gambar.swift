// =============================================================
// MOJANG.KEBAYA — GAMBAR PRATINJAU LINK (Open Graph, 1200x630)
// Gambar yang muncul saat link dibagikan di WhatsApp/IG/FB: latar marun,
// bingkai garis emas, logo emas, judul huruf kapital Didot berjarak lebar.
//
// Tata letak:
//   samping : logo besar di kiri, judul dua baris di kanan
//   palet   : logo kecil di atas judul (kiri), 15 contoh warna kebaya (per series) di kanan
//   form    : logo kecil di atas judul (kiri), sketsa form bergaris emas di kanan
//   undangan: semua di tengah seperti kartu undangan: logo di atas, judul miring satu baris,
//             MOJANG.KEBAYA di antara dua garis, keterangan  ← DIPAKAI SEKARANG
//
// Buat ulang (mis. jumlah kebaya, warna atau harga berubah), dari folder proyek:
//   swift tools/og-gambar.swift undangan image/og/booking.jpg "Form" "Booking" "Sewa kebaya · Sukabumi & se-Pulau Jawa"
//   swift tools/og-gambar.swift undangan image/og/katalog.jpg "Katalog" "Kebaya" "15 kebaya full payet · mulai Rp300rb"
//   swift tools/og-gambar.swift undangan image/og/beranda.jpg "Cantik itu Kamu," "Kebayanya Kami." "Sewa kebaya full payet · Sukabumi & se-Pulau Jawa"
//   (tata letak lain: ganti "undangan" dengan form / palet / samping; judul ditulis kapital, mis. "KATALOG" "KEBAYA")
// Warna di tata letak "palet" ada di daftar PALET di bawah (sama dengan data.js).
// Butuh macOS (huruf Didot & Avenir Next bawaan Mac).
// =============================================================
import Foundation
import CoreGraphics
import CoreText
import ImageIO
import UniformTypeIdentifiers

let W: CGFloat = 1200, H: CGFloat = 630
let a = CommandLine.arguments
let mode = a[1], out = a[2], T1 = a[3], T2 = a[4], SUB = a[5]
let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
let PALET: [(String, [Int])] = [
  ("GEULIS", [0x6B1E2B, 0xF2C6D0, 0xC99A86, 0xEFD98F, 0xE6D2BC]),
  ("ARUNI", [0x1F2A4A, 0xE7B7BC, 0xE3CDB5, 0xDDB3A7, 0x11605E]),
  ("KINASIH · NISKALA · PUSPA", [0x9A9A98, 0xB9D3E2, 0x5E1A22, 0xBED6E4, 0x5A2A1E])]

func load(_ p: String) -> CGImage { CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil)!, 0, nil)! }
func hex(_ h: Int, _ al: CGFloat = 1) -> CGColor { CGColor(red: CGFloat((h >> 16) & 255) / 255, green: CGFloat((h >> 8) & 255) / 255, blue: CGFloat(h & 255) / 255, alpha: al) }
let MAROON = hex(0x4A0F1A), IVORY = hex(0xFBEFD3), GOLD = hex(0xE4C08A)
let c = CGContext(data: nil, width: Int(W), height: Int(H), bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
c.interpolationQuality = .high
func R(_ x: CGFloat, _ top: CGFloat, _ w: CGFloat, _ h: CGFloat) -> CGRect { CGRect(x: x, y: H - top - h, width: w, height: h) }
func line(_ s: String, _ font: String, _ size: CGFloat, _ color: CGColor, _ kern: CGFloat) -> (CTLine, CGFloat) {
  let attr = NSAttributedString(string: s, attributes: [
    NSAttributedString.Key(kCTFontAttributeName as String): CTFontCreateWithName(font as CFString, size, nil),
    NSAttributedString.Key(kCTForegroundColorAttributeName as String): color,
    NSAttributedString.Key(kCTKernAttributeName as String): kern])
  let l = CTLineCreateWithAttributedString(attr)
  return (l, CGFloat(CTLineGetTypographicBounds(l, nil, nil, nil)) - kern)   // tanpa jarak setelah huruf terakhir
}
func text(_ s: String, x: CGFloat, baseline top: CGFloat, font: String, size: CGFloat, color: CGColor, kern: CGFloat = 0) {
  let (l, _) = line(s, font, size, color, kern)
  c.textPosition = CGPoint(x: x, y: H - top); CTLineDraw(l, c)
}
/// Judul dua baris Didot kapital, ukuran otomatis supaya baris terpanjang muat di `maxW`.
func title(x: CGFloat, top1: CGFloat, maxW: CGFloat, maxSize: CGFloat) -> CGFloat {
  var size = maxSize
  func widest(_ s: CGFloat) -> CGFloat { max(line(T1, "Didot", s, IVORY, s * 0.09).1, line(T2, "Didot", s, IVORY, s * 0.09).1) }
  while widest(size) > maxW { size -= 1 }
  text(T1, x: x, baseline: top1, font: "Didot", size: size, color: IVORY, kern: size * 0.09)
  text(T2, x: x, baseline: top1 + size * 1.08, font: "Didot", size: size, color: IVORY, kern: size * 0.09)
  return top1 + size * 1.08
}
func diamond(_ cx: CGFloat, _ cy: CGFloat, _ r: CGFloat) {
  let p = CGMutablePath(); p.move(to: CGPoint(x: cx, y: cy + r)); p.addLine(to: CGPoint(x: cx + r, y: cy)); p.addLine(to: CGPoint(x: cx, y: cy - r)); p.addLine(to: CGPoint(x: cx - r, y: cy)); p.closeSubpath()
  c.addPath(p); c.setFillColor(MAROON); c.fillPath(); c.addPath(p); c.setStrokeColor(GOLD); c.setLineWidth(1.4); c.strokePath()
}

// latar marun + cahaya lembut + bingkai emas ganda
c.setFillColor(MAROON); c.fill(CGRect(x: 0, y: 0, width: W, height: H))
let glow = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: [hex(0x6E1D2D, 0.85), hex(0x4A0F1A, 0)] as CFArray, locations: [0, 1])!
c.drawRadialGradient(glow, startCenter: CGPoint(x: 330, y: H / 2), startRadius: 0, endCenter: CGPoint(x: 330, y: H / 2), endRadius: 600, options: [])
c.setStrokeColor(GOLD); c.setLineWidth(1.6); c.stroke(CGRect(x: 30, y: 30, width: W - 60, height: H - 60))
c.setStrokeColor(hex(0xE4C08A, 0.7)); c.setLineWidth(0.8); c.stroke(CGRect(x: 40, y: 40, width: W - 80, height: H - 80))

let logo = load(root.appendingPathComponent("image/logo/mojang-logo-gold.png").path)
let ratio = CGFloat(logo.height) / CGFloat(logo.width)
let EYEBROW = "MOJANG.KEBAYA"

func round(_ r: CGRect, _ rad: CGFloat) -> CGPath { CGPath(roundedRect: r, cornerWidth: rad, cornerHeight: rad, transform: nil) }
let LABEL = hex(0xE4C08A, 0.9)
if mode == "palet" || mode == "form" {
  // kolom kiri: logo kecil di atas, MOJANG.KEBAYA, judul, garis, keterangan
  for y in [CGFloat(35), H - 35] { diamond(W / 2, y, 9) }
  let L: CGFloat = 96
  c.draw(logo, in: R(L, 100, 74, 74 * ratio))
  text(EYEBROW, x: L, baseline: 232, font: "Didot", size: 22, color: GOLD, kern: 7)
  let last = title(x: L - 2, top1: 330, maxW: 470, maxSize: 96)
  c.setFillColor(GOLD); c.fill(R(L, last + 34, 74, 2))
  text(SUB, x: L, baseline: last + 82, font: "AvenirNext-Regular", size: 23, color: hex(0xFBEFD3, 0.82), kern: 0.5)
}
if mode == "undangan" {
  for y in [CGFloat(35), H - 35] { diamond(W / 2, y, 9) }
  let lw: CGFloat = 150
  c.draw(logo, in: R(W / 2 - lw / 2, 78, lw, lw * ratio))
  let t = "\(T1) \(T2)"
  var size: CGFloat = 118
  while line(t, "HoeflerText-Italic", size, IVORY, 0).1 > 1000 { size -= 1 }
  let (_, tw) = line(t, "HoeflerText-Italic", size, IVORY, 0)
  text(t, x: W / 2 - tw / 2, baseline: 392, font: "HoeflerText-Italic", size: size, color: IVORY)
  let (_, mw) = line(EYEBROW, "HoeflerText-Regular", 27, GOLD, 9)
  text(EYEBROW, x: W / 2 - mw / 2, baseline: 460, font: "HoeflerText-Regular", size: 27, color: GOLD, kern: 9)
  c.setFillColor(GOLD); c.fill(R(W / 2 - mw / 2 - 86, 450, 64, 1.4)); c.fill(R(W / 2 + mw / 2 + 22, 450, 64, 1.4))
  let (_, sw) = line(SUB, "AvenirNext-Regular", 25, IVORY, 0.6)
  text(SUB, x: W / 2 - sw / 2, baseline: 520, font: "AvenirNext-Regular", size: 25, color: hex(0xFBEFD3, 0.82), kern: 0.6)
} else if mode == "form" {
  // sketsa form bergaris emas: dua kolom isian, pilihan Sukabumi / Luar kota, tombol lanjut
  let fx: CGFloat = 640, fw: CGFloat = 458
  func label(_ s: String, _ top: CGFloat) { text(s, x: fx, baseline: top - 14, font: "AvenirNext-DemiBold", size: 15, color: LABEL, kern: 3) }
  func outline(_ r: CGRect, _ rad: CGFloat) { c.addPath(round(r, rad)); c.setStrokeColor(GOLD); c.setLineWidth(1.6); c.strokePath() }
  label("NAMA LENGKAP", 150); outline(R(fx, 150, fw, 58), 12)
  label("NOMOR WHATSAPP", 262); outline(R(fx, 262, fw, 58), 12)
  label("PENGAMBILAN", 374)
  let half = (fw - 14) / 2
  outline(R(fx, 374, half, 58), 12)
  c.addPath(round(R(fx + half + 14, 374, half, 58), 12)); c.setFillColor(GOLD); c.fillPath()
  func centered(_ s: String, _ cx: CGFloat, _ top: CGFloat, _ col: CGColor) {
    let (_, w) = line(s, "AvenirNext-DemiBold", 18, col, 2.5); text(s, x: cx - w / 2, baseline: top, font: "AvenirNext-DemiBold", size: 18, color: col, kern: 2.5)
  }
  centered("SUKABUMI", fx + half / 2, 409, IVORY)
  centered("LUAR KOTA", fx + half + 14 + half / 2, 409, MAROON)
  c.addPath(round(R(fx, 458, fw, 62), 31)); c.setFillColor(IVORY); c.fillPath()
  centered("LANJUT KE FORM BOOKING  →", fx + fw / 2, 496, MAROON)
} else if mode == "palet" {
  let gx: CGFloat = 640, r: CGFloat = 34, gap: CGFloat = 96
  for (i, (name, cols)) in PALET.enumerated() {
    let top = 150 + CGFloat(i) * 140
    text(name, x: gx, baseline: top - 14, font: "AvenirNext-DemiBold", size: 15, color: hex(0xE4C08A, 0.9), kern: 3)
    for (j, col) in cols.enumerated() {
      let cx = gx + r + CGFloat(j) * gap, cy = H - top - r
      c.setShadow(offset: CGSize(width: 0, height: -6), blur: 14, color: hex(0x1A0308, 0.6))
      c.setFillColor(hex(col)); c.fillEllipse(in: CGRect(x: cx - r, y: cy - r, width: 2 * r, height: 2 * r))
      c.setShadow(offset: .zero, blur: 0, color: nil)
      c.setStrokeColor(GOLD); c.setLineWidth(1.6); c.strokeEllipse(in: CGRect(x: cx - r - 5, y: cy - r - 5, width: 2 * r + 10, height: 2 * r + 10))
    }
  }
} else {   // samping
  for x in [CGFloat(35), W - 35] { diamond(x, H / 2, 9) }
  let lw: CGFloat = 330
  c.draw(logo, in: R(110, (H - lw * ratio) / 2, lw, lw * ratio))
  c.setFillColor(hex(0xE4C08A, 0.55)); c.fill(R(520, 150, 1.2, H - 300))
  let tx: CGFloat = 586
  text(EYEBROW, x: tx, baseline: 214, font: "Didot", size: 24, color: GOLD, kern: 8)
  let last = title(x: tx - 2, top1: 320, maxW: 520, maxSize: 100)
  c.setFillColor(GOLD); c.fill(R(tx, last + 36, 78, 2))
  text(SUB, x: tx, baseline: last + 86, font: "AvenirNext-Regular", size: 24, color: hex(0xFBEFD3, 0.8), kern: 0.6)
}

let d = CGImageDestinationCreateWithURL(URL(fileURLWithPath: out) as CFURL, UTType.jpeg.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(d, c.makeImage()!, [kCGImageDestinationLossyCompressionQuality: 0.9] as CFDictionary)
CGImageDestinationFinalize(d)
print("ok", mode, out)
