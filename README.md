# 🚀 Akuntansi Indonesia - Backend API

**Status:** ✅ Siap Produksi | 🟢 172 API Endpoints Siap | 🚀 27 Modul Selesai

Backend API untuk Sistem Akuntansi Indonesia yang sesuai dengan standar PSAK (Pernyataan Standar Akuntansi Keuangan).

> **📊 Progress Saat Ini:** 27 modul selesai dengan total 172 endpoint.
## 📋 Daftar Isi

- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Setup Database](#setup-database)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Dokumentasi](#dokumentasi)
- [Struktur Proyek](#struktur-proyek)
- [Fitur Utama](#fitur-utama)
- [Dokumentasi API](#dokumentasi-api)
- [Pengujian (Testing)](#pengujian-testing)

## 🛠 Teknologi yang Digunakan

- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.x
- **Bahasa**: TypeScript 5+
- **Database**: PostgreSQL 16+
- **ORM**: Prisma 5+
- **Autentikasi**: JWT (JSON Web Token)
- **Validasi**: Zod
- **Upload File**: Multer
- **Logging**: Winston
- **Testing**: Jest
- **Kualitas Kode**: ESLint + Prettier

## ✅ Prasyarat

Pastikan Anda sudah menginstall software berikut:

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL >= 16.0
- Git

## 📦 Instalasi

1. **Clone repositori ini:**
```bash
git clone <repository-url>
cd akuntansi-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Buat file environment:**
```bash
cp .env.example .env
```

4. **Edit file `.env`** sesuai konfigurasi Anda (lihat bagian [Konfigurasi](#konfigurasi)).

## ⚙️ Konfigurasi

Update file `.env` dengan pengaturan Anda:

```env
# Aplikasi
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/akuntansi?schema=public"

# JWT (GANTI INI SAAT PRODUCTION!)
JWT_SECRET=rahasia-super-panjang-minimal-32-karakter
JWT_REFRESH_SECRET=rahasia-refresh-super-panjang-minimal-32-karakter
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting (Pembatasan Request)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Keamanan
BCRYPT_ROUNDS=10
```

### 🔒 Catatan Keamanan:

- **JANGAN PERNAH** commit file `.env` ke git.
- Gunakan password JWT yang kuat/acak.
- Ganti password database default saat di production.

## 🗄️ Setup Database

1. **Buat database PostgreSQL:**
```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE akuntansi;

# Keluar
\q
```

2. **Jalankan migrasi Prisma:**
```bash
npx prisma migrate dev
```

3. **Generate Prisma Client:**
```bash
npx prisma generate
```

4. **Seed database (Isi Data Awal):**
```bash
npx prisma db seed
```

Perintah ini akan membuat:
- Perusahaan Demo (PT Demo Akuntansi)
- User Admin (admin@akuntansi.id / admin123)
- Bagan Akun (COA) standar
- Paket langganan UMKM

5. **Buka Prisma Studio (opsional):**
```bash
npx prisma studio
```
Buka http://localhost:5555 untuk melihat data database.

## 🏃 Menjalankan Aplikasi

### Mode Development:
```bash
npm run dev
```
Server berjalan di `http://localhost:5000` dengan fitur auto-reload.

### Mode Production (Build):
```bash
# Compile TypeScript ke JavaScript
npm run build

# Jalankan server production
npm start
```

### Cek Kesehatan (Health Check):
```bash
curl http://localhost:5000/health
```

Respon yang diharapkan:
```json
{
  "status": "OK",
  "timestamp": "2026-01-09T01:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## 📁 Struktur Proyek

```
akuntansi-backend/
├── prisma/
│   ├── schema.prisma          # Skema Database
│   ├── migrations/            # Sejarah Migrasi DB
│   └── seed.ts                # Data Awal (Seed)
├── src/
│   ├── config/                # Konfigurasi Global
│   ├── middleware/            # Middleware Express
│   ├── utils/                 # Fungsi Utilitas
│   ├── types/                 # Definisi Tipe TypeScript
│   ├── controllers/           # Logika Kontroler (27 modul)
│   ├── services/              # Logika Bisnis (27 layanan)
│   ├── validators/            # Validasi Input (Zod)
│   ├── routes/                # Rute API (172 endpoint)
│   ├── app.ts                 # Setup Aplikasi Express
│   └── server.ts              # Entry Point Server
├── tests/                     # File Pengujian
├── logs/                      # File Log Sistem
├── uploads/                   # File Upload User
├── dist/                      # Hasil Compile (JS)
├── API_DOCUMENTATION.md       # Dokumentasi API Lengkap
├── PENJELASAN_MUDAH.md        # Panduan Pemula (Bahasa Indonesia)
├── PENJELASAN_TEKNIS.md       # Penjelasan Kodingan (Bahasa Indonesia)
├── MANUAL_PENGGUNA.md         # Buku Manual User (Bahasa Indonesia)
└── README.md                  # File Ini
```

## ✨ Fitur Utama

Sistem ini adalah solusi Backend Akuntansi Lengkap dengan **172 Endpoint** yang terbagi dalam **27 Modul**.

### 🔹 Modul Inti (Core)
1.  **Authentication** - Login, register, token JWT aman.
2.  **Users** - Manajemen user dengan 15 role berbeda.
3.  **Companies** - Dukungan Multi-Perusahaan & Multi-Cabang.
4.  **Chart of Accounts** - Bagan Akun standar PSAK.
5.  **Transactions** - Mencatat 16 tipe transaksi keuangan.
6.  **Vouchers** - Bukti kas/bank dengan approval workflow.
7.  **Journals** - Sistem pembukuan Double-Entry (Debit/Kredit).
8.  **Customers** - Manajemen pelanggan & laporan piutang.
9.  **Suppliers** - Manajemen pemasok & laporan hutang.
10. **Payments** - Pembayaran hutang/piutang (Tunai, Transfer, Cek, Giro).
11. **Inventory** - Manajemen stok & perhitungan HPP (Average Cost).
12. **Fixed Assets** - Aset tetap & penyusutan otomatis.
13. **Taxes** - Perhitungan Pajak (PPh 21, PPN).
14. **Reports** - Laporan Keuangan (Neraca, Laba Rugi, Arus Kas).
15. **Budgets** - Perencanaan & monitoring anggaran.
16. **Employees** - Data Karyawan.
17. **Contracts** - Kontrak Kerja.
18. **Payrolls** - Penggajian otomatis.
19. **Cost Centers** - Alokasi biaya antar divisi.
20. **Profit Centers** - Analisis profit per unit bisnis.
21. **Approvals** - Workflow persetujuan bertingkat.

### 🔸 Modul Lanjutan (Advanced)
22. **Recurring Transactions** - Jadwal transaksi otomatis (berulang).
23. **Document Management** - Upload & manajemen file bukti.
24. **Audit Trail** - Rekam jejak aktivitas user (Log anti-curang).
25. **Dashboard & Analytics** - Analisis performa bisnis real-time.
26. **Batch Operations** - Proses data massal (Upload Excel, Bulk Post).
27. **Settings** - Konfigurasi sistem dinamis.

## 📚 Dokumentasi API

Lihat [API_DOCUMENTATION.md](API_DOCUMENTATION.md) untuk detail lengkap setiap endpoint.

### Contoh Request

**URL Dasar:** `http://localhost:5000/api/v1`

**Header Wajib:**
```
Authorization: Bearer <token_kamu_disini>
```

**Format Respon Sukses:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Berhasil",
  "meta": { "page": 1, "limit": 10 }
}
```

## 🧪 Pengujian (Testing)

Semua 172 endpoint telah diuji dan lulus 100%. Lihat [FINAL_TEST_REPORT.md](FINAL_TEST_REPORT.md).

```bash
# Jalankan semua test
npm test

# Cek coverage kode
npm run test:coverage
```

## 📝 Script Tersedia

```json
{
  "dev": "Jalankan server development",
  "build": "Build untuk production",
  "start": "Jalankan server production",
  "test": "Jalankan testing",
  "prisma:migrate": "Update struktur database",
  "prisma:seed": "Isi data awal database"
}
```

## 🤝 Berkontribusi

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambah fitur X'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

---

**Dibuat dengan Pusing untuk Akuntansi Indonesia**  
**Status:** ✅ PRODUCTION READY
