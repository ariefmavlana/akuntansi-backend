# 📚 API Documentation - Backend Akuntansi Indonesia

**Base URL:** `http://localhost:5000/api/v1`  
**Version:** 1.0.0  
**Last Updated:** 7 Januari 2026

---

## 🔐 Authentication

All endpoints (except `/auth/register` and `/auth/login`) require authentication via JWT Bearer token.

**Header Format:**
```
Authorization: Bearer <your_access_token>
```

---

## 📋 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [User Management](#user-management-endpoints)
3. [Company Management](#company-management-endpoints)
4. [Chart of Accounts](#chart-of-accounts-endpoints)
5. [Transactions](#transaction-endpoints)
6. [Error Codes](#error-codes)
7. [Response Format](#response-format)

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "username": "string (required)",
  "email": "string (required, email format)",
  "password": "string (required, min 8 chars, must contain uppercase, lowercase, number)",
  "namaLengkap": "string (required)",
  "perusahaanId": "string (required, cuid)",
  "cabangId": "string (optional, cuid)",
  "telepon": "string (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxx...",
      "username": "testuser",
      "email": "test@example.com",
      "namaLengkap": "Test User",
      "role": "STAFF",
      "isAktif": true
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  },
  "message": "Registrasi berhasil"
}
```

### 2. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "emailOrUsername": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  },
  "message": "Login berhasil"
}
```

### 3. Refresh Token
**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

### 4. Get Current User
**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "username": "admin",
    "email": "admin@akuntansi.id",
    "namaLengkap": "Administrator",
    "role": "SUPERADMIN",
    "perusahaan": {
      "id": "clxxx...",
      "kode": "DEMO",
      "nama": "PT Demo Akuntansi"
    },
    "cabang": null
  },
  "message": "Data user berhasil diambil"
}
```

### 5. Change Password
**POST** `/auth/change-password`

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 8 chars)"
}
```

### 6. Logout
**POST** `/auth/logout`

---

## User Management Endpoints

### 1. List Users
**GET** `/users`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional)
- `role` (optional)
- `isAktif` (optional, boolean)
- `perusahaanId` (optional)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "username": "user1",
      "email": "user1@example.com",
      "namaLengkap": "User One",
      "role": "STAFF",
      "isAktif": true,
      "createdAt": "2026-01-07T10:00:00Z"
    }
  ],
  "message": "Data user berhasil diambil",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 2. Get User by ID
**GET** `/users/:id`

### 3. Update User
**PUT** `/users/:id`

**Request Body:**
```json
{
  "namaLengkap": "string (optional)",
  "telepon": "string (optional)",
  "foto": "string (optional, URL)"
}
```

### 4. Update User Role
**PUT** `/users/:id/role`

**Access:** ADMIN, SUPERADMIN

**Request Body:**
```json
{
  "role": "ACCOUNTANT" // enum: SUPERADMIN, ADMIN, MANAGER, STAFF, etc.
}
```

### 5. Activate/Deactivate User
**PUT** `/users/:id/activate`  
**PUT** `/users/:id/deactivate`

### 6. Delete User
**DELETE** `/users/:id`

---

## Company Management Endpoints

### 1. Create Company
**POST** `/companies`

**Access:** SUPERADMIN only

**Request Body:**
```json
{
  "kode": "string (required, 2-10 chars, uppercase + numbers)",
  "nama": "string (required)",
  "namaLengkap": "string (optional)",
  "bentukUsaha": "string (optional)",
  "bidangUsaha": "string (optional)",
  "alamat": "string (optional)",
  "kota": "string (optional)",
  "provinsi": "string (optional)",
  "telepon": "string (optional)",
  "email": "string (optional, email format)",
  "npwp": "string (optional, format: XX.XXX.XXX.X-XXX.XXX)",
  "mataUangUtama": "string (default: IDR)",
  "tahunBuku": "number (default: 12)"
}
```

### 2. List Companies
**GET** `/companies`

**Query Parameters:**
- `page`, `limit`
- `search`
- `bentukUsaha`
- `kota`, `provinsi`

### 3. Get Company
**GET** `/companies/:id`

**Response includes:**
- Parent company (if any)
- Child companies
- Branches
- User count, COA count, Transaction count

### 4. Update Company
**PUT** `/companies/:id`

**Access:** SUPERADMIN or own company ADMIN

### 5. Delete Company
**DELETE** `/companies/:id`

**Access:** SUPERADMIN only

### Branch Endpoints

**POST** `/companies/branches` - Create branch  
**GET** `/companies/branches` - List branches  
**GET** `/companies/branches/:id` - Get branch  
**PUT** `/companies/branches/:id` - Update branch  
**DELETE** `/companies/branches/:id` - Delete branch

---

## Chart of Accounts Endpoints

### 1. Create Account
**POST** `/coa`

**Access:** ACCOUNTANT, SENIOR_ACCOUNTANT, ADMIN, SUPERADMIN

**Request Body:**
```json
{
  "perusahaanId": "string (required)",
  "kodeAkun": "string (required, e.g., '1-1000')",
  "namaAkun": "string (required)",
  "tipe": "ASET | LIABILITAS | EKUITAS | PENDAPATAN | BEBAN",
  "kategoriAset": "ASET_LANCAR | ASET_TETAP | ... (if tipe=ASET)",
  "level": "number (default: 1)",
  "parentId": "string (optional)",
  "normalBalance": "DEBIT | KREDIT (default: DEBIT)",
  "isHeader": "boolean (default: false)",
  "isActive": "boolean (default: true)",
  "allowManualEntry": "boolean (default: true)",
  "saldoAwal": "number (default: 0)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "kodeAkun": "1-1000",
    "namaAkun": "Kas",
    "tipe": "ASET",
    "kategoriAset": "ASET_LANCAR",
    "level": 1,
    "normalBalance": "DEBIT",
    "isHeader": false,
    "isActive": true,
    "saldoBerjalan": 0
  },
  "message": "Akun berhasil dibuat"
}
```

### 2. List Accounts
**GET** `/coa`

**Query Parameters:**
- `page`, `limit`
- `search`
- `tipe` (ASET, LIABILITAS, etc.)
- `kategoriAset`, `kategoriLiabilitas`, `kategoriEkuitas`
- `parentId`
- `level`
- `isHeader`, `isActive`
- `normalBalance`

### 3. Get Account Hierarchy
**GET** `/coa/hierarchy`

**Query Parameters:**
- `perusahaanId` (required)
- `tipe` (optional)
- `includeInactive` (optional, default: false)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "kodeAkun": "1-0000",
      "namaAkun": "ASET",
      "isHeader": true,
      "children": [
        {
          "id": "clyyy...",
          "kodeAkun": "1-1000",
          "namaAkun": "Kas",
          "isHeader": false,
          "children": []
        }
      ]
    }
  ]
}
```

### 4. Get Account
**GET** `/coa/:id`

### 5. Update Account
**PUT** `/coa/:id`

### 6. Update Account Balance
**PUT** `/coa/:id/balance`

**Request Body:**
```json
{
  "saldoAwal": "number (optional)",
  "saldoAwalDebit": "number (optional)",
  "saldoAwalKredit": "number (optional)"
}
```

### 7. Delete Account
**DELETE** `/coa/:id`

**Note:** Cannot delete if:
- Has child accounts
- Has transactions

---

## Transaction Endpoints

### 1. Create Transaction
**POST** `/transactions`

**Access:** STAFF, ACCOUNTANT, SENIOR_ACCOUNTANT, ADMIN, SUPERADMIN

**Request Body:**
```json
{
  "perusahaanId": "string (required)",
  "cabangId": "string (optional)",
  "periodeId": "string (required)",
  "tipe": "PENJUALAN | PEMBELIAN | BIAYA | ... (required)",
  "nomorTransaksi": "string (optional, auto-generated)",
  "tanggal": "datetime (required)",
  "tanggalJatuhTempo": "datetime (optional)",
  "pelangganId": "string (optional)",
  "supplierId": "string (optional)",
  "deskripsi": "string (required)",
  "subtotal": "number (required)",
  "diskon": "number (default: 0)",
  "jumlahPajak": "number (default: 0)",
  "total": "number (required)",
  "mataUang": "string (default: IDR)",
  "kurs": "number (default: 1)",
  "detail": [
    {
      "urutan": "number (required)",
      "akunId": "string (required)",
      "deskripsi": "string (optional)",
      "kuantitas": "number (default: 1)",
      "hargaSatuan": "number (default: 0)",
      "diskon": "number (default: 0)",
      "subtotal": "number (required)"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "nomorTransaksi": "PEN/202601/0001",
    "tanggal": "2026-01-07T12:00:00Z",
    "tipe": "PENJUALAN",
    "total": 1110000,
    "statusPembayaran": "BELUM_DIBAYAR",
    "isPosted": false,
    "detail": [/* transaction details */]
  },
  "message": "Transaksi berhasil dibuat"
}
```

### 2. List Transactions
**GET** `/transactions`

**Query Parameters:**
- `page`, `limit`
- `perusahaanId`, `cabangId`, `periodeId`
- `tipe`
- `statusPembayaran` (BELUM_DIBAYAR, DIBAYAR_SEBAGIAN, LUNAS)
- `pelangganId`, `supplierId`
- `search`
- `tanggalMulai`, `tanggalAkhir`
- `isPosted`

### 3. Get Transaction
**GET** `/transactions/:id`

**Response includes:**
- Transaction details
- Line items with account info
- Customer/Supplier info
- Payments
- Voucher (if any)
- Created by user info

### 4. Update Transaction
**PUT** `/transactions/:id`

**Access:** ACCOUNTANT, SENIOR_ACCOUNTANT, ADMIN, SUPERADMIN

**Note:** Can only update if transaction is NOT posted

**Request Body:** (all fields optional)
```json
{
  "tanggal": "datetime",
  "deskripsi": "string",
  "detail": [/* new detail array */]
}
```

### 5. Post Transaction
**POST** `/transactions/:id/post`

**Access:** ACCOUNTANT, SENIOR_ACCOUNTANT, ADMIN, SUPERADMIN

**Request Body:**
```json
{
  "tanggalPosting": "datetime (optional, default: now)"
}
```

**Effect:**
- Sets `isPosted = true`
- Sets `postedAt` and `postedBy`
- TODO: Creates journal entries

### 6. Void Transaction
**POST** `/transactions/:id/void`

**Access:** ACCOUNTANT, SENIOR_ACCOUNTANT, ADMIN, SUPERADMIN

**Request Body:**
```json
{
  "alasan": "string (required)"
}
```

**Effect:**
- Sets `isVoid = true`
- Sets `voidAt`, `voidBy`, `voidReason`
- TODO: Creates reversal journal entries

### 7. Delete Transaction
**DELETE** `/transactions/:id`

**Access:** ACCOUNTANT, SENIOR_ACCOUNTANT, ADMIN, SUPERADMIN

**Note:** Can only delete if transaction is NOT posted

### 8. Add Payment
**POST** `/transactions/:id/payments`

**Access:** CASHIER, ACCOUNTANT, SENIOR_ACCOUNTANT, ADMIN, SUPERADMIN

**Request Body:**
```json
{
  "nomorPembayaran": "string (optional, auto-generated)",
  "tanggal": "datetime (required)",
  "tipePembayaran": "TUNAI | TRANSFER_BANK | CEK | GIRO | ... (required)",
  "jumlah": "number (required)",
  "bankRekeningId": "string (optional)",
  "nomorReferensi": "string (optional)",
  "keterangan": "string (optional)"
}
```

**Effect:**
- Creates payment record
- Updates transaction `totalDibayar` and `sisaPembayaran`
- Updates `statusPembayaran` (BELUM_DIBAYAR → DIBAYAR_SEBAGIAN → LUNAS)

---

## Error Codes

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email sudah terdaftar",
    "details": {
      "field": "email",
      "value": "test@example.com"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication failed
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ERROR` - Resource already exists
- `BUSINESS_LOGIC_ERROR` - Business rule violation

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful",
  "meta": { /* pagination or additional info */ }
}
```

### Pagination Meta

```json
{
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## Rate Limiting

**Default Limits:**
- Window: 15 minutes
- Max Requests: 100 per window

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704628800
```

---

## Testing with cURL

### Get Access Token
```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"admin@akuntansi.id","password":"admin123"}'

# Save the accessToken from response
export TOKEN="your_access_token_here"
```

### Use Token in Requests
```bash
# Get current user
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# List companies
curl http://localhost:5000/api/v1/companies \
  -H "Authorization: Bearer $TOKEN"
```

---

## Postman Collection

Import this base configuration:

```json
{
  "info": {
    "name": "Akuntansi Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api/v1"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

Set `{{token}}` after login and use `{{baseUrl}}` for all requests.

---

**Last Updated:** 7 Januari 2026, 20:35 WIB  
**API Version:** 1.0.0  
**Documentation Version:** 1.0.0
