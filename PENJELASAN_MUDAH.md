# 🎓 Penjelasan Mudah: Backend Akuntansi (12 Phase)

**Untuk:** Pemula yang baru belajar  
**Gaya:** Kayak jelasin ke bayi 👶  
**Tujuan:** Paham semua fitur tanpa pusing!

---

## 🏗️ Gambaran Besar: Apa Sih Ini?

Bayangin kamu punya **toko** atau **perusahaan**. Kamu butuh:
1. 📝 Catat semua uang masuk & keluar
2. 👥 Atur siapa aja yang boleh akses
3. 📊 Lihat laporan keuangan
4. 💰 Kelola hutang & piutang
5. 📦 Atur stok barang
6. 🏢 Catat aset perusahaan
7. 💸 Hitung pajak

Nah, **backend ini** adalah **otak** yang ngatur semua itu! 🧠

---

## Phase 1: Authentication (Login/Logout) 🔐

### Analogi Sederhana:
Kayak **satpam di pintu masuk**. Cuma yang punya kartu ID boleh masuk!

### Yang Bisa Dilakukan:
1. **Register** - Bikin akun baru (kayak daftar jadi member)
2. **Login** - Masuk pake username & password
3. **Logout** - Keluar dari sistem
4. **Ganti Password** - Ubah password kalau lupa
5. **Refresh Token** - Perpanjang sesi login otomatis

### Kenapa Penting?
Biar gak sembarang orang bisa lihat data keuangan perusahaan!

### Contoh Praktis:
```
Kamu: "Halo, saya mau masuk"
Sistem: "Username & password dong!"
Kamu: "Ini: admin@akuntansi.id / admin123"
Sistem: "OK, ini kartu akses kamu (token)!"
```

**Total Fitur:** 8 endpoint

---

## Phase 2: User Management (Kelola Pengguna) 👥

### Analogi Sederhana:
Kayak **HRD** yang ngatur karyawan. Siapa jadi admin, siapa jadi kasir, dll.

### Yang Bisa Dilakukan:
1. **Tambah User Baru** - Rekrut karyawan baru
2. **Lihat Daftar User** - Cek semua karyawan
3. **Update Data User** - Ubah info karyawan
4. **Ganti Role** - Promosi/demosi jabatan
5. **Aktifkan/Nonaktifkan** - Suspend karyawan
6. **Hapus User** - PHK karyawan

### 15 Role Tersedia:
- **SUPERADMIN** - Bos besar, bisa apa aja
- **ADMIN** - Manajer, hampir bisa semua
- **ACCOUNTANT** - Akuntan, urus pembukuan
- **CASHIER** - Kasir, terima/bayar uang
- **SALES** - Sales, cuma bisa bikin invoice
- dll...

### Contoh Praktis:
```
Boss: "Tambahin Budi jadi kasir"
Sistem: "OK, Budi sekarang bisa terima pembayaran"
Boss: "Tapi dia gak boleh lihat laporan keuangan ya"
Sistem: "Siap, Budi cuma bisa akses kasir aja"
```

**Total Fitur:** 7 endpoint

---

## Phase 3: Company Management (Kelola Perusahaan) 🏢

### Analogi Sederhana:
Kayak **bikin kantor cabang**. Satu perusahaan bisa punya banyak cabang!

### Yang Bisa Dilakukan:
1. **Bikin Perusahaan Baru** - Daftar perusahaan
2. **Bikin Cabang** - Buka cabang Jakarta, Surabaya, dll
3. **Atur Periode Akuntansi** - Buka/tutup periode (bulan/tahun)
4. **Update Info Perusahaan** - Ganti alamat, telp, dll

### Fitur Keren:
- **Multi-Company:** Bisa kelola 10 perusahaan sekaligus!
- **Multi-Branch:** Tiap perusahaan bisa punya banyak cabang
- **Periode Akuntansi:** Tutup buku per bulan/tahun

### Contoh Praktis:
```
Kamu: "Bikin PT Maju Jaya"
Sistem: "OK, kode: MAJU"
Kamu: "Buka cabang di Jakarta & Surabaya"
Sistem: "Siap, 2 cabang sudah aktif"
Kamu: "Tutup buku Desember 2025"
Sistem: "Periode Desember ditutup, gak bisa edit lagi"
```

**Total Fitur:** 10 endpoint

---

## Phase 4: Chart of Accounts (Daftar Akun) 📊

### Analogi Sederhana:
Kayak **daftar kategori** di dompet digital. Ada kategori "Makanan", "Transport", "Gaji", dll.

### Yang Bisa Dilakukan:
1. **Bikin Akun Baru** - Tambah kategori baru
2. **Lihat Hierarki** - Lihat struktur pohon akun
3. **Update Akun** - Ubah nama/kode akun
4. **Aktifkan/Nonaktifkan** - Matikan akun yang gak dipake

### 5 Tipe Akun Utama:
1. **ASET** - Harta (Kas, Bank, Piutang, Gedung)
2. **LIABILITAS** - Hutang (Hutang Usaha, Hutang Bank)
3. **EKUITAS** - Modal (Modal Pemilik, Laba Ditahan)
4. **PENDAPATAN** - Pemasukan (Penjualan, Jasa)
5. **BEBAN** - Pengeluaran (Gaji, Listrik, Sewa)

### Contoh Praktis:
```
Akun: 1-1-1-1 (Kas)
      ├── 1-1-1-1-1 (Kas Kecil)
      └── 1-1-1-1-2 (Kas Besar)

Akun: 4-1-1 (Pendapatan Penjualan)
      ├── 4-1-1-1 (Penjualan Produk A)
      └── 4-1-1-2 (Penjualan Produk B)
```

**Total Fitur:** 7 endpoint

---

## Phase 5: Transaction Management (Transaksi) 💳

### Analogi Sederhana:
Kayak **nota belanja**. Setiap kali ada uang masuk/keluar, bikin nota!

### Yang Bisa Dilakukan:
1. **Bikin Transaksi** - Catat penjualan, pembelian, biaya
2. **Lihat Transaksi** - Cek semua nota
3. **Update Transaksi** - Edit nota (kalau masih draft)
4. **Post ke Jurnal** - Posting ke pembukuan resmi
5. **Void Transaksi** - Batalkan transaksi
6. **Tambah Pembayaran** - Catat pembayaran cicilan

### 16 Tipe Transaksi:
- **PENJUALAN** - Jual barang/jasa
- **PEMBELIAN** - Beli barang/jasa
- **BIAYA** - Bayar listrik, gaji, dll
- **GAJI** - Bayar gaji karyawan
- **PEMBAYARAN_HUTANG** - Bayar hutang
- **PENERIMAAN_PIUTANG** - Terima piutang
- dll...

### Contoh Praktis:
```
Transaksi: PENJUALAN
Nomor: PJ/202601/0001
Tanggal: 8 Jan 2026
Customer: PT ABC
Item: Laptop Dell (10 unit x Rp 10jt) = Rp 100jt
PPN 11%: Rp 11jt
Total: Rp 111jt
Status: BELUM_DIBAYAR
```

**Total Fitur:** 8 endpoint

---

## Phase 6: Voucher System (Bukti Kas/Bank) 🧾

### Analogi Sederhana:
Kayak **kwitansi resmi**. Setiap terima/bayar uang, bikin kwitansi!

### Yang Bisa Dilakukan:
1. **Bikin Voucher** - Bikin bukti kas masuk/keluar
2. **Submit Approval** - Minta persetujuan atasan
3. **Approve/Reject** - Atasan setuju/tolak
4. **Post ke Jurnal** - Catat ke pembukuan
5. **Reverse** - Batalkan voucher yang salah

### 9 Tipe Voucher:
- **KAS_MASUK** - Terima uang tunai
- **KAS_KELUAR** - Bayar uang tunai
- **BANK_MASUK** - Terima transfer
- **BANK_KELUAR** - Bayar via transfer
- **JURNAL_UMUM** - Jurnal manual
- dll...

### Workflow Approval:
```
1. Kasir bikin voucher (DRAFT)
2. Submit ke Manager (MENUNGGU_PERSETUJUAN)
3. Manager approve (DISETUJUI)
4. Akuntan posting (DIPOSTING)
```

### Contoh Praktis:
```
Voucher: KAS/202601/0001
Tipe: KAS_KELUAR
Tanggal: 8 Jan 2026
Deskripsi: Bayar listrik kantor
Jumlah: Rp 2.500.000
Status: DISETUJUI → DIPOSTING
```

**Total Fitur:** 10 endpoint

---

## Phase 7: Journal & Ledger (Buku Besar) 📚

### Analogi Sederhana:
Kayak **buku catatan keuangan**. Semua transaksi dicatat di sini!

### Yang Bisa Dilakukan:
1. **Bikin Jurnal Manual** - Catat jurnal penyesuaian
2. **Lihat General Ledger** - Buku besar per akun
3. **Lihat Trial Balance** - Neraca saldo
4. **Auto Balance Update** - Saldo otomatis update!

### Fitur Keren:
- **Double Entry** - Debit = Kredit (harus balance!)
- **Auto Balance** - Saldo akun otomatis update
- **Running Balance** - Lihat saldo berjalan
- **Period Validation** - Cuma bisa edit periode terbuka

### Contoh Praktis:
```
Jurnal: JU/202601/0001
Tanggal: 8 Jan 2026

Debit:  Beban Listrik     Rp 2.500.000
Kredit: Kas               Rp 2.500.000
        ─────────────────────────────
Total:  Rp 2.500.000      Rp 2.500.000 ✅ BALANCE!

Saldo Kas sebelum: Rp 10.000.000
Saldo Kas sesudah: Rp  7.500.000 (otomatis update!)
```

**Total Fitur:** 6 endpoint

---

## Phase 8: Customer & Supplier (Pelanggan & Pemasok) 👥

### Analogi Sederhana:
Kayak **buku kontak**. Simpan data pelanggan & supplier!

### Yang Bisa Dilakukan:

**Customer (Pelanggan):**
1. **Tambah Customer** - Daftar pelanggan baru
2. **Atur Credit Limit** - Batas hutang pelanggan
3. **Lihat Aging Report** - Hutang yang jatuh tempo
4. **Track Payment Terms** - Tempo pembayaran (30 hari)

**Supplier (Pemasok):**
1. **Tambah Supplier** - Daftar supplier baru
2. **Simpan Bank Info** - Rekening untuk transfer
3. **Lihat Aging Report** - Hutang ke supplier
4. **Track Payment Terms** - Kapan harus bayar

### Aging Report (Umur Piutang/Hutang):
```
Customer: PT ABC
─────────────────────────────
Current (0-30 hari):    Rp  50jt
31-60 hari:             Rp  30jt
61-90 hari:             Rp  20jt
90+ hari (TELAT!):      Rp  10jt ⚠️
─────────────────────────────
Total Piutang:          Rp 110jt
```

### Contoh Praktis:
```
Customer: PT ABC
Kode: CUST-0001
Tipe: PERUSAHAAN
Credit Limit: Rp 100jt
Payment Terms: 30 hari
Status: AKTIF

Supplier: PT XYZ
Kode: SUPP-0001
Bank: BCA 1234567890
Payment Terms: 14 hari
Status: AKTIF
```

**Total Fitur:** 14 endpoint (7 Customer + 7 Supplier)

---

## Phase 9: Payment Management (Pembayaran) 💰

### Analogi Sederhana:
Kayak **catat pembayaran cicilan**. Hutang Rp 100jt, bayar Rp 30jt, sisa Rp 70jt!

### Yang Bisa Dilakukan:
1. **Catat Pembayaran** - Terima/bayar uang
2. **Auto Allocation** - Otomatis kurangi hutang/piutang
3. **Update Status** - Otomatis update status transaksi
4. **Payment Summary** - Ringkasan pembayaran

### 8 Metode Pembayaran:
- **TUNAI** - Cash
- **TRANSFER_BANK** - Transfer
- **CEK** - Cek
- **GIRO** - Giro
- **E_WALLET** - OVO, GoPay, dll
- **KARTU_KREDIT** - Credit card
- **KARTU_DEBIT** - Debit card
- **LAINNYA** - Lain-lain

### Auto Status Update:
```
Transaksi: Rp 100jt
Status: BELUM_DIBAYAR

Bayar Rp 30jt
Status: DIBAYAR_SEBAGIAN (sisa Rp 70jt)

Bayar Rp 70jt
Status: LUNAS ✅
```

### Contoh Praktis:
```
Payment: PAY/202601/0001
Transaksi: PJ/202601/0001 (Rp 100jt)
Metode: TRANSFER_BANK
Jumlah: Rp 30jt
Admin Fee: Rp 6.500

Sisa Hutang: Rp 70jt
Status: DIBAYAR_SEBAGIAN
```

**Total Fitur:** 5 endpoint

---

## Phase 10: Inventory Management (Stok Barang) 📦

### Analogi Sederhana:
Kayak **gudang**. Catat barang masuk, keluar, dan stok tersisa!

### Yang Bisa Dilakukan:
1. **Daftar Barang** - Tambah produk baru
2. **Catat Stok Masuk** - Barang datang dari supplier
3. **Catat Stok Keluar** - Barang terjual
4. **Penyesuaian Stok** - Koreksi stok (rusak, hilang)
5. **Alert Stok Minimal** - Warning kalau stok hampir habis

### 3 Tipe Pergerakan Stok:
- **MASUK** - Barang masuk (beli dari supplier)
- **KELUAR** - Barang keluar (terjual)
- **PENYESUAIAN** - Koreksi stok

### Contoh Praktis:
```
Barang: Laptop Dell
Kode: INV-0001
Harga Beli: Rp 10jt
Harga Jual: Rp 12jt
Stok Minimal: 5 unit

Stok Awal: 10 unit
Masuk: +20 unit → Stok: 30 unit
Keluar: -15 unit → Stok: 15 unit
Penyesuaian: -2 unit (rusak) → Stok: 13 unit ✅
```

**Total Fitur:** 4 endpoint

---

## Phase 11: Fixed Assets (Aset Tetap) 🏢

### Analogi Sederhana:
Kayak **daftar barang mahal** perusahaan. Gedung, mobil, mesin, dll.

### Yang Bisa Dilakukan:
1. **Daftar Aset** - Catat gedung, mobil, mesin
2. **Hitung Penyusutan** - Nilai aset turun tiap tahun
3. **Jual/Buang Aset** - Catat untung/rugi penjualan
4. **Track Book Value** - Nilai buku aset

### 7 Kategori Aset:
- **TANAH** - Tanah (gak nyusut!)
- **BANGUNAN** - Gedung, pabrik
- **KENDARAAN** - Mobil, motor
- **MESIN** - Mesin produksi
- **PERALATAN** - Komputer, AC
- **FURNITURE** - Meja, kursi
- **LAINNYA** - Lain-lain

### Penyusutan (Depreciation):
```
Mobil: Rp 200jt
Umur: 5 tahun
Nilai Residu: Rp 20jt

Penyusutan per tahun:
(Rp 200jt - Rp 20jt) / 5 tahun = Rp 36jt/tahun

Tahun 1: Nilai Buku = Rp 164jt
Tahun 2: Nilai Buku = Rp 128jt
Tahun 3: Nilai Buku = Rp 92jt
...
```

### Contoh Praktis:
```
Aset: Mobil Avanza
Kode: FA-0001
Kategori: KENDARAAN
Tanggal Beli: 1 Jan 2024
Harga: Rp 200jt
Umur: 5 tahun
Penyusutan: Rp 36jt/tahun

Nilai Buku 2026: Rp 128jt

Jual 2026: Rp 150jt
Untung: Rp 22jt ✅
```

**Total Fitur:** 5 endpoint

---

## Phase 12: Tax Management (Pajak) 💸

### Analogi Sederhana:
Kayak **kalkulator pajak**. Hitung PPh & PPN otomatis!

### Yang Bisa Dilakukan:
1. **Hitung PPh 21** - Pajak gaji karyawan
2. **Hitung PPN** - Pajak penjualan (11%)
3. **Laporan Pajak** - Ringkasan pajak per periode

### PPh 21 (Pajak Gaji):
```
Gaji Bruto: Rp 10jt/bulan = Rp 120jt/tahun
Status: Kawin, 2 anak

PTKP (Penghasilan Tidak Kena Pajak):
- TK/0: Rp 54jt
- Kawin: Rp 4,5jt
- 2 Anak: Rp 9jt
Total PTKP: Rp 67,5jt

PKP (Penghasilan Kena Pajak):
Rp 120jt - Rp 67,5jt = Rp 52,5jt

Pajak (5% untuk < Rp 60jt):
Rp 52,5jt x 5% = Rp 2.625.000/tahun
= Rp 218.750/bulan
```

### PPN (Pajak Penjualan):
```
Harga Barang: Rp 100jt
PPN 11%: Rp 11jt
Total: Rp 111jt

Customer bayar: Rp 111jt
Kamu terima: Rp 100jt
Setor ke negara: Rp 11jt
```

### Contoh Praktis:
```
Karyawan: Budi
Gaji: Rp 10jt/bulan
Status: K/2 (Kawin, 2 anak)

PPh 21: Rp 218.750/bulan
Gaji Bersih: Rp 9.781.250

─────────────────────────

Penjualan: Rp 100jt
PPN 11%: Rp 11jt
Total Invoice: Rp 111jt
```

**Total Fitur:** 3 endpoint

---

## 🎯 Kesimpulan: Apa yang Sudah Dibangun?

### Sistem Lengkap dengan 157 Endpoint! 🚀

**Bayangkan:**
1. ✅ Kamu bisa **login** dengan aman
2. ✅ Atur **siapa boleh akses** apa
3. ✅ Kelola **banyak perusahaan & cabang**
4. ✅ Catat **semua transaksi** keuangan
5. ✅ Buat **voucher** dengan approval
6. ✅ Lihat **laporan keuangan** real-time
7. ✅ Kelola **pelanggan & supplier**
8. ✅ Track **pembayaran & hutang**
9. ✅ Atur **stok barang**
10. ✅ Catat **aset perusahaan**
11. ✅ Hitung **pajak** otomatis
12. ✅ **Transaksi berulang** otomatis (Phase 16)
13. ✅ **Upload dokumen** dengan kontrol akses (Phase 17)
14. ✅ **Audit trail** lengkap (Phase 18)
15. ✅ **Dashboard analytics** real-time (Phase 19)
16. ✅ **Batch operations** untuk efisiensi (Phase 20)
17. ✅ **Settings management** fleksibel (Phase 21)

### Semua Otomatis! 🤖
- ✅ Saldo otomatis update
- ✅ Status transaksi otomatis berubah
- ✅ Nomor otomatis generate
- ✅ Penyusutan otomatis hitung
- ✅ Pajak otomatis kalkulasi

### Semua Aman! 🔒
- ✅ Login wajib
- ✅ Role-based access
- ✅ Data terpisah per perusahaan
- ✅ Audit trail lengkap

### Semua Akurat! ✅
- ✅ Double-entry bookkeeping
- ✅ Debit = Kredit
- ✅ Balance otomatis cek
- ✅ Periode akuntansi terkontrol

---

## 🎓 Tips Belajar

### Mulai dari Mana?
1. **Phase 1-2** - Pahami login & user dulu
2. **Phase 3-4** - Belajar company & COA
3. **Phase 5** - Praktek bikin transaksi
4. **Phase 6-7** - Pahami voucher & jurnal
5. **Phase 8-15** - Explore fitur dasar lengkap
6. **Phase 16-21** - Fitur advanced (recurring, docs, audit, analytics, batch, settings)

### Cara Belajar:
1. 📖 Baca penjelasan ini
2. 🧪 Coba API di Postman
3. 💡 Pahami konsep dasarnya
4. 🔄 Praktek berulang-ulang
5. ❓ Tanya kalau bingung

### Jangan Takut!
- Semua dimulai dari nol
- Belajar step by step
- Praktek bikin paham
- Error itu wajar, santai aja!

---

**Dibuat dengan Bismillah untuk pemula**  
**Semoga paham ya mang! 🙏**
**Kalau masih bingung, tanya aja! 💬**
