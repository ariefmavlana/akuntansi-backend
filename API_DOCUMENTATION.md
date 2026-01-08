# 📚 Dokumentasi API - Backend Akuntansi Indonesia

**Base URL:** `http://localhost:5000/api/v1`  
**Versi:** 1.0.0  
**Total Endpoints:** 172  
**Modul:** 27  
**Status:** ✅ Siap Produksi  
**Terakhir Diupdate:** 9 Januari 2026

---

## 🔐 Autentikasi

Semua endpoint (kecuali `/auth/register` dan `/auth/login`) memerlukan autentikasi menggunakan token JWT Bearer.

**Format Header:**
```
Authorization: Bearer <token_akses_kamu>
```

---

## 📋 Daftar Isi

### Modul Inti (Core)
1. [Autentikasi (Authentication)](#1-autentikasi) - 4 endpoints
2. [Pengguna (Users)](#2-pengguna-users) - 5 endpoints
3. [Perusahaan (Companies)](#3-perusahaan-companies) - 6 endpoints
4. [Bagan Akun (COA)](#4-bagan-akun-coa) - 8 endpoints
5. [Transaksi (Transactions)](#5-transaksi-transactions) - 10 endpoints
6. [Voucher](#6-voucher) - 8 endpoints
7. [Jurnal (Journals)](#7-jurnal-journals) - 7 endpoints
8. [Pelanggan (Customers)](#8-pelanggan-customers) - 6 endpoints
9. [Pemasok (Suppliers)](#9-pemasok-suppliers) - 6 endpoints
10. [Pembayaran (Payments)](#10-pembayaran-payments) - 8 endpoints
11. [Inventaris (Inventory)](#11-inventaris-inventory) - 9 endpoints
12. [Aset Tetap (Fixed Assets)](#12-aset-tetap-fixed-assets) - 8 endpoints
13. [Pajak (Taxes)](#13-pajak-taxes) - 6 endpoints
14. [Laporan (Reports)](#14-laporan-reports) - 5 endpoints
15. [Anggaran (Budgets)](#15-anggaran-budgets) - 7 endpoints
16. [Pusat Biaya (Cost Centers)](#16-pusat-biaya-cost-centers) - 5 endpoints
17. [Pusat Laba (Profit Centers)](#17-pusat-laba-profit-centers) - 5 endpoints
18. [Persetujuan (Approvals)](#18-persetujuan-approvals) - 6 endpoints

### Modul Lanjutan (Advanced)
19. [Transaksi Berulang (Recurring)](#19-transaksi-berulang-recurring) - 8 endpoints
20. [Dokumen (Documents)](#20-dokumen-documents) - 5 endpoints
21. [Jejak Audit (Audit Trail)](#21-jejak-audit-audit-trail) - 4 endpoints
22. [Dashboard](#22-dashboard) - 7 endpoints
23. [Operasi Batch](#23-operasi-batch) - 4 endpoints
24. [Pengaturan (Settings)](#24-pengaturan-settings) - 4 endpoints
25. [Karyawan (Employees)](#25-karyawan-employees) - 5 endpoints
26. [Kontrak (Contracts)](#26-kontrak-contracts) - 5 endpoints
27. [Penggajian (Payrolls)](#27-penggajian-payrolls) - 5 endpoints

---

### Referensi
- [Kode Error](#kode-error)
- [Format Respon](#format-respon)

---

## 1. Autentikasi

### Register User
`POST /auth/register`
Mendaftarkan user baru dan perusahaan baru.

### Login
`POST /auth/login`
Masuk ke aplikasi untuk mendapatkan Token.

### Refresh Token
`POST /auth/refresh`
Perpanjang sesi login.

### Get Current User
`GET /auth/me`
Lihat profil user yang sedang login.

---

## 2. Pengguna (Users)

### List Users
`GET /users`
Lihat daftar semua user.

### Get User Detail
`GET /users/:id`

### Create User
`POST /users` (Admin only)

### Update User
`PUT /users/:id`

### Delete User
`DELETE /users/:id`

---

## 3. Perusahaan (Companies)

### List Companies
`GET /companies`

### Create Company
`POST /companies`

### Get Company Detail
`GET /companies/:id`

### Update Company
`PUT /companies/:id`

### Delete Company
`DELETE /companies/:id`

### Manage Branches
`GET /companies/:id/branches` (Lihat Cabang)

---

## 4. Bagan Akun (COA)

### List Accounts
`GET /coa`
Lihat semua akun akuntansi.

### Create Account
`POST /coa`
Tambah akun baru.

### Get Account Hierarchy
`GET /coa/hierarchy`
Lihat akun dalam bentuk pohon (Induk -> Anak).

---

## 5. Transaksi (Transactions)

### Create Transaction
`POST /transactions`
Catat transaksi baru (Penjualan/Pembelian/Biaya).

### List Transactions
`GET /transactions`
Lihat riwayat transaksi.

### Post Transaction
`POST /transactions/:id/post`
Posting transaksi ke buku besar (Finalisasi).

---

## 19. Transaksi Berulang (Recurring)

### Buat Jadwal
`POST /recurring`
Bikin jadwal tagihan otomatis.

### Lihat Jadwal
`GET /recurring`

### Jalankan Manual
`POST /recurring/:id/process`
Paksa jalankan transaksi sekarang.

---

## 20. Dokumen (Documents)

### Upload Dokumen
`POST /documents`
Upload bukti potong/bon/faktur.

### Download Dokumen
`GET /documents/:id`

---

## 21. Jejak Audit (Audit Trail)

### Lihat Log
`GET /audit`
Cek siapa melakukan apa.

### Lihat Timeline
`GET /audit/timeline/:recordId`
Riwayat perubahan pada satu data spesifik.

---

## 22. Dashboard

### Statistik Keuangan
`GET /dashboard/stats`
Dapat data Profit, Revenue, Expense hari ini.

### Widget
`GET /dashboard/widgets`
Ambil konfigurasi widget user.

---

## 23. Operasi Batch

### Upload Transaksi Massal
`POST /batch/transactions`
Kirim banyak transaksi sekaligus.

### Posting Massal
`POST /batch/post-journals`
Posting semua jurnal dalam satu periode.

---

## 24. Pengaturan (Settings)

### Lihat Pengaturan
`GET /settings`

### Ubah Pengaturan
`PUT /settings/:key`

---

## Kode Error

| Kode | Arti |
|------|------|
| 200 | Sukses |
| 400 | Data input salah (Bad Request) |
| 401 | Belum login (Unauthorized) |
| 403 | Tidak punya izin (Forbidden) |
| 404 | Data tidak ditemukan |
| 500 | Error Server |

## Format Respon

Semua respon API mengikuti standar ini:

**Sukses:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Berhasil",
  "meta": { "page": 1, "limit": 10 }
}
```

**Gagal:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email wajib diisi"
  }
}
```
