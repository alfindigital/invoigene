

# Rombak Konsep: Nota Digital untuk UMKM & Pedagang Kaki Lima

## Masalah Sekarang
Form invoice terlalu rumit untuk pedagang kecil: ada manajemen klien, multi-currency, PPN, diskon per-item, bilingual labels, dll. Pedagang kaki lima butuh input cepat — ketik nama pembeli (opsional), tambah item, langsung cetak/kirim.

## Konsep Baru

### Filosofi: "3 Ketukan = Nota Jadi"
- Tidak ada konsep "klien" yang disimpan — cukup ketik nama pembeli (opsional)
- Item dari katalog bisa ditambah dengan 1 tap
- Default currency IDR only, pajak default none
- Form 1 halaman, scroll minimal

### Perubahan per Halaman

**1. Halaman "Buat Nota" (rombak total InvoiceForm)**
- Layout baru: 1 halaman simpel, bukan banyak Card terpisah
- Bagian atas: Nama Pembeli (1 input, opsional) + No. HP (opsional, untuk WhatsApp)
- Nomor nota auto-generate, tanggal auto hari ini
- **Quick-add items**: Grid tombol dari katalog (tap = langsung masuk, tap lagi = tambah qty). Mirip POS/kasir
- Manual add: input nama item + harga + qty dalam 1 baris compact
- Ringkasan total real-time di bagian bawah (sticky)
- Tombol besar: "Simpan & Kirim WA" dan "Simpan"
- Diskon & pajak tersembunyi di balik toggle "Opsi lanjutan" (collapsed by default)

**2. Dashboard (simplifikasi)**
- Stat cards: Total Nota Hari Ini, Pendapatan Hari Ini, Total Bulan Ini, Belum Dibayar
- Fokus pada ringkasan harian, bukan bulanan
- Tombol besar "Buat Nota Baru"
- Daftar 5 nota terakhir (tetap)

**3. Riwayat (minor update)**
- Ganti label "Klien" → "Pembeli"
- Tetap ada search, filter, sort

**4. Pengaturan (simplifikasi)**
- Profil Usaha: Nama Usaha, Alamat, No HP, Logo — tanpa field email/NPWP/bank (pindah ke "Opsi Lanjutan")
- Katalog Produk jadi fitur utama — karena pedagang jual barang yang sama terus
- Hapus manajemen klien dari settings

**5. Tipe Data (types/invoice.ts)**
- Field `client` disederhanakan: hanya `buyerName` (string) dan `buyerPhone` (string) langsung di Invoice, hapus Client interface dari invoice
- Hapus field: `bilingualLabels`, `paymentTerms`, `footerText` dari required (jadikan opsional di "Opsi Lanjutan")
- Default `taxType` = `'none'`, default `currency` = `'IDR'`
- Pertahankan Client type untuk backward compat tapi tidak wajib

**6. Invoice Preview (update)**
- Layout lebih simpel, cocok untuk struk/nota kecil
- Nama pembeli di atas, bukan "Bill To" formal
- Hapus section bank details kecuali diisi di settings

### Perubahan Teknis
- **`types/invoice.ts`**: Tambah `buyerName`, `buyerPhone` ke Invoice. Client jadi opsional
- **`InvoiceForm.tsx`**: Rombak total — form 1 halaman, quick-add grid, sticky total bar
- **`Dashboard.tsx`**: Update stats ke fokus harian, update dummy data ke konteks pedagang (es teh, nasi goreng, dll)
- **`Settings.tsx`**: Reorder — katalog di atas, profil ringkas, opsi lanjutan collapsed
- **`InvoiceHistory.tsx`**: Update label "Klien" → "Pembeli"
- **`InvoicePreview.tsx`**: Layout nota simpel
- **`useInvoiceStore.ts`**: Tetap sama, minor adjustments
- **`BottomNav.tsx`**: Ganti "Buat" → "Nota Baru" dengan ikon lebih menonjol

### Contoh Flow Pedagang
1. Buka app → tap "Nota Baru"
2. (Opsional) ketik "Pak Budi" di nama pembeli
3. Tap "Nasi Goreng" dari grid katalog → qty 2
4. Tap "Es Teh" → qty 3
5. Lihat total di bawah: Rp 55.000
6. Tap "Simpan & Kirim WA" → selesai

Total waktu: ~10 detik vs sebelumnya ~2 menit.

