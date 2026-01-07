# 🚀 Quick Start Guide - Backend Akuntansi Indonesia

Panduan cepat untuk memulai development dan testing backend sistem akuntansi.

---

## ⚡ Quick Setup (5 Menit)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Copy environment file
cp .env.example .env

# Edit .env dan sesuaikan DATABASE_URL
# DATABASE_URL="postgresql://user:password@localhost:5432/akuntansi"

# Run migrations
npm run prisma:migrate

# Seed initial data
npm run prisma:seed
```

### 3. Start Development Server
```bash
npm run dev
```

Server akan running di: **http://localhost:5000**

---

## 🧪 Quick Test (2 Menit)

### Test 1: Health Check
```bash
curl http://localhost:5000/health
```

**Expected:** `{"status":"OK"}`

### Test 2: Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "admin@akuntansi.id",
    "password": "admin123"
  }'
```

**Expected:** Response dengan `accessToken` dan `refreshToken`

### Test 3: Get Current User
```bash
# Ganti <TOKEN> dengan accessToken dari Test 2
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

**Expected:** Data user admin

---

## 📝 Default Test Data

Setelah seed, Anda akan memiliki:

### Default User
```
Email: admin@akuntansi.id
Password: admin123
Role: SUPERADMIN
```

### Default Company
```
Kode: DEMO
Nama: PT Demo Akuntansi
```

### Default COA
Pre-populated dengan akun standar Indonesia:
- 1-xxxx: ASET
- 2-xxxx: LIABILITAS
- 3-xxxx: EKUITAS
- 4-xxxx: PENDAPATAN
- 5-xxxx: BEBAN

### Default Period
```
Tahun: 2026
Status: TERBUKA
```

---

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build TypeScript
npm start                # Start production server

# Database
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed data
npm run prisma:studio    # Open Prisma Studio (GUI)
npm run prisma:generate  # Generate Prisma Client

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Run ESLint
npm run format           # Run Prettier
```

---

## 📊 API Endpoints Summary

### Authentication (8 endpoints)
- POST `/auth/register` - Register user
- POST `/auth/login` - Login
- POST `/auth/refresh` - Refresh token
- POST `/auth/logout` - Logout
- GET `/auth/me` - Get current user
- POST `/auth/change-password` - Change password
- POST `/auth/forgot-password` - Request reset
- POST `/auth/reset-password` - Reset password

### Users (7 endpoints)
- GET `/users` - List users
- GET `/users/:id` - Get user
- PUT `/users/:id` - Update user
- PUT `/users/:id/role` - Update role
- PUT `/users/:id/activate` - Activate
- PUT `/users/:id/deactivate` - Deactivate
- DELETE `/users/:id` - Delete user

### Companies (5 endpoints)
- POST `/companies` - Create company
- GET `/companies` - List companies
- GET `/companies/:id` - Get company
- PUT `/companies/:id` - Update company
- DELETE `/companies/:id` - Delete company

### Branches (5 endpoints)
- POST `/companies/branches` - Create branch
- GET `/companies/branches` - List branches
- GET `/companies/branches/:id` - Get branch
- PUT `/companies/branches/:id` - Update branch
- DELETE `/companies/branches/:id` - Delete branch

### Chart of Accounts (7 endpoints)
- POST `/coa` - Create account
- GET `/coa` - List accounts
- GET `/coa/:id` - Get account
- GET `/coa/hierarchy` - Get hierarchy
- PUT `/coa/:id` - Update account
- PUT `/coa/:id/balance` - Update balance
- DELETE `/coa/:id` - Delete account

### Transactions (8 endpoints)
- POST `/transactions` - Create transaction
- GET `/transactions` - List transactions
- GET `/transactions/:id` - Get transaction
- PUT `/transactions/:id` - Update transaction
- POST `/transactions/:id/post` - Post transaction
- POST `/transactions/:id/void` - Void transaction
- DELETE `/transactions/:id` - Delete transaction
- POST `/transactions/:id/payments` - Add payment

**Total: 40 Endpoints**

---

## 🎯 Quick Workflow Example

### 1. Login dan Simpan Token
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"admin@akuntansi.id","password":"admin123"}' \
  | jq -r '.data.tokens.accessToken')

echo "Token: $TOKEN"
```

### 2. Buat Akun Baru
```bash
curl -X POST http://localhost:5000/api/v1/coa \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "perusahaanId": "<COMPANY_ID>",
    "kodeAkun": "1-1100",
    "namaAkun": "Kas Kecil",
    "tipe": "ASET",
    "kategoriAset": "ASET_LANCAR",
    "normalBalance": "DEBIT",
    "saldoAwal": 5000000
  }'
```

### 3. Buat Transaksi
```bash
curl -X POST http://localhost:5000/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "perusahaanId": "<COMPANY_ID>",
    "periodeId": "<PERIOD_ID>",
    "tipe": "BIAYA",
    "tanggal": "2026-01-07T10:00:00Z",
    "deskripsi": "Pembelian ATK",
    "subtotal": 500000,
    "diskon": 0,
    "jumlahPajak": 0,
    "total": 500000,
    "detail": [{
      "urutan": 1,
      "akunId": "<ACCOUNT_ID>",
      "deskripsi": "ATK Kantor",
      "kuantitas": 1,
      "hargaSatuan": 500000,
      "subtotal": 500000
    }]
  }'
```

### 4. Tambah Pembayaran
```bash
curl -X POST http://localhost:5000/api/v1/transactions/<TRANSACTION_ID>/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tanggal": "2026-01-07T10:00:00Z",
    "tipePembayaran": "TUNAI",
    "jumlah": 500000
  }'
```

---

## 🔍 Debugging Tips

### Check Logs
```bash
# Real-time logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log
```

### Prisma Studio
```bash
npm run prisma:studio
```
Buka http://localhost:5555 untuk GUI database

### Check Server Status
```bash
curl http://localhost:5000/health
```

---

## 🐛 Common Issues

### Issue: Database Connection Error
**Solution:**
```bash
# Check PostgreSQL is running
# Update DATABASE_URL in .env
# Run migrations again
npm run prisma:migrate
```

### Issue: Port 5000 Already in Use
**Solution:**
```bash
# Change PORT in .env
PORT=5001

# Or kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### Issue: JWT Token Invalid
**Solution:**
- Token expired (15 minutes default)
- Use refresh token endpoint
- Or login again

---

## 📚 Documentation Links

- **Progress Report:** `PROGRESS.md`
- **API Documentation:** `API_DOCUMENTATION.md`
- **Task List:** `.gemini/brain/.../task.md`
- **Walkthrough:** `.gemini/brain/.../walkthrough.md`

---

## 🎓 Next Steps

1. ✅ Baca `PROGRESS.md` untuk overview lengkap
2. ✅ Baca `API_DOCUMENTATION.md` untuk detail API
3. ✅ Test semua endpoints dengan Postman/cURL
4. ✅ Explore database dengan Prisma Studio
5. ✅ Mulai development Phase 6 (Voucher System)

---

## 💡 Pro Tips

### Use Environment Variables
```bash
# .env.local untuk development
# .env.production untuk production
# Jangan commit .env ke git!
```

### Use Prisma Studio
```bash
npm run prisma:studio
# Best tool untuk explore dan edit data
```

### Use Postman Collection
- Import base URL: `http://localhost:5000/api/v1`
- Save token as environment variable
- Create collections per module

### Enable Debug Logging
```bash
# .env
LOG_LEVEL=debug
```

---

**Happy Coding! 🚀**

Jika ada pertanyaan, check dokumentasi atau contact tim development.
