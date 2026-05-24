## Tujuan
Brand **InvoiGene** dipertahankan, tapi identitas visual dirapikan dan UI dirombak agar nyaman dipakai satu tangan di HP.

## 1. Brand & Ikon
- **Nama**: InvoiGene (tetap, sudah konsisten di metadata, domain, sitemap).
- **Logo baru**: ikon kotak rounded gradient Royal Blue (`#1E3A8A → #3B82F6`) dengan glyph nota + checkmark putih di tengah. Diset transparan untuk dipakai di header gelap & terang.
- **Wordmark**: "InvoiGene" pakai Syne SemiBold, tagline "Nota cepat untuk UMKM" pakai Plus Jakarta Sans.
- File yang di-generate:
  - `src/assets/logo.png` (logo penuh untuk header, transparan)
  - `public/favicon.png` (512×512, ganti `favicon.ico` lama)
  - `public/og-image.jpg` (1200×630 untuk share WA/sosmed)

## 2. Konsistensi Font
- **Heading**: Syne (SemiBold/Bold) — dipakai untuk judul halaman, angka besar dashboard, total nota.
- **Body & UI**: Plus Jakarta Sans (400/500/600) — semua teks, label, tombol, tabel.
- **Angka tabular**: `font-variant-numeric: tabular-nums` untuk kolom harga & total.
- Tambah `Syne` ke `index.html` (Google Fonts) dan token `--font-display` / `--font-sans` di `index.css` + util Tailwind `font-display` / `font-sans`.
- Audit semua komponen untuk hapus `font-mono`/`font-serif` liar dan ganti heading ke `font-display`.

## 3. Konsistensi Warna
- Palet Royal Blue dipertahankan, tapi disisir agar tidak ada warna mentah (`text-gray-*`, `bg-white`) di komponen — semua harus pakai token semantik.
- Token yang ditegaskan:
  - `--primary 220 80% 50%` (Royal Blue) + `--primary-foreground` putih.
  - `--brand-deep 222 47% 17%` (`#1E293B`) untuk header gelap.
  - `--brand-soft 214 95% 93%` untuk badge & chip lembut.
  - `--success`, `--warning`, `--danger` ditambahkan biar status nota (lunas/draft/batal) konsisten.
- Tambah gradient utility `bg-gradient-brand` (Royal → Sky) untuk FAB & hero card dashboard.
- Audit & ganti class warna hardcoded di `Dashboard`, `InvoiceForm`, `InvoiceHistory`, `Settings`, `ThermalReceipt` (preview struk tetap monokrom — tidak diubah).

## 4. Rombak UI/UX Mobile (prioritas yang dipilih)

### 4a. Bottom nav + FAB
- `BottomNav` dirombak jadi 5 slot dengan FAB lingkaran di tengah:
  ```text
  [ Home ] [ Riwayat ] [ + ] [ Item ] [ Setting ]
  ```
- FAB = tombol bulat 64px, gradient brand, ikon `Plus`, shadow tebal — langsung buka **Nota Baru**.
- Bottom nav `fixed bottom-0` dengan `safe-area-inset-bottom` (iOS notch), tinggi 64px, ikon + label kecil, indicator aktif berupa pill di belakang ikon.

### 4b. Tombol & input lebih besar
- Set baseline tap target: `min-h-12` (48px) untuk semua tombol & input mobile.
- Variant baru di shadcn `Button`: `size="touch"` (h-12, px-5, text-base) — dipakai default di form Nota.
- `Input`, `Select`, `Textarea`: tinggi 48px, font-size 16px (cegah zoom iOS), padding kiri-kanan 16px.
- Tombol qty di item list: 44×44 dengan jarak antar tombol ≥ 8px.

### 4c. Mode satu tangan
- Header halaman dirampingkan (tinggi 56px), judul kiri, aksi (dark mode, profil) di kanan — tidak ada aksi penting di header.
- **Aksi utama selalu di bawah**, sticky di atas bottom nav:
  - InvoiceForm: bar bawah berisi tombol "Simpan & Preview" full-width (gradient brand).
  - InvoicePreview: bar bawah "Kirim WhatsApp" + "Cetak" sebagai 2 tombol sejajar.
  - InvoiceHistory: FAB tetap untuk buat nota baru, filter chips di atas list (bukan modal atas).
- Konten halaman dapat `pb-32` agar tidak ketutup bar aksi + bottom nav.
- Form Nota Baru: field pelanggan & item disusun vertikal dengan section card, scroll halus, fokus auto ke field berikutnya setelah enter.

### 4d. Sentuhan kecil yang bikin enak
- Animasi tap (`active:scale-95`) pada tombol & kartu.
- Skeleton card di dashboard saat loading data localStorage pertama.
- Toast (sonner) untuk feedback simpan/hapus, posisi `top-center` agar tidak tertutup bar bawah.

## 5. File yang Disentuh
- `index.html` — load Syne, update theme-color jadi `#1E3A8A`.
- `src/index.css` — tambah token brand, font-display, util gradient, safe-area.
- `tailwind.config.ts` — daftarkan `fontFamily.display`, warna brand-deep/soft, success/warning, size `touch`.
- `src/components/ui/button.tsx` — tambah `size: "touch"` & varian `gradient`.
- `src/components/ui/input.tsx` & `textarea.tsx` — naikkan tinggi default di mobile.
- `src/components/BottomNav.tsx` — rombak ke layout 5-slot dengan FAB.
- `src/components/AppSidebar.tsx` — sinkron warna baru (desktop tetap pakai sidebar).
- `src/pages/Index.tsx` — header ramping, padding bawah konten.
- `src/pages/Dashboard.tsx`, `InvoiceForm.tsx`, `InvoiceHistory.tsx`, `Settings.tsx` — pakai token & varian baru, tambah sticky action bar di form & preview.
- `src/components/InvoicePreview.tsx` — sticky action bar bawah.
- `src/assets/logo.png`, `public/favicon.png`, `public/og-image.jpg` — aset baru.

## 6. Yang TIDAK Diubah
- Logika bisnis (perhitungan, localStorage, template, WhatsApp formatter).
- `ThermalReceipt` (layout struk 58/80mm tetap, hanya font heading boleh disisir kalau perlu).
- Bahasa Indonesia, format IDR & tanggal DD/MM/YYYY.
- Sitemap, robots, metadata SEO yang sudah ada.

## Catatan Teknis
- Pakai `env(safe-area-inset-bottom)` di bottom nav & sticky action bar untuk iOS.
- Set `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` di `index.html`.
- Update `mem://style/design-system` setelah implementasi (token baru + size `touch`).