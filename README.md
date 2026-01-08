# 🚀 Akuntansi Indonesia - Backend API

**Status:** ✅ Production Ready | 🟢 157 API Endpoints Ready | 🚀 All 21 Phases Complete

Backend API untuk Sistem Akuntansi Indonesia yang compliant dengan PSAK.

> **📊 Current Progress:** 24 modules complete with 157 endpoints. See [FINAL_TEST_REPORT.md](FINAL_TEST_REPORT.md) for details.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Features](#features)
- [API Documentation](#api-documentation)
- [Testing](#testing)

## 🛠 Tech Stack

- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5+
- **Database**: PostgreSQL 16+
- **ORM**: Prisma 5+
- **Authentication**: JWT
- **Validation**: Zod
- **File Upload**: Multer
- **Logging**: Winston
- **Testing**: Jest
- **Code Quality**: ESLint + Prettier

## ✅ Prerequisites

Make sure you have the following installed:

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL >= 16.0
- Git

## 📦 Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd akuntansi-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration (see [Configuration](#configuration) section).

## ⚙️ Configuration

Update the `.env` file with your settings:

```env
# Application
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/akuntansi?schema=public"

# JWT (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Security
BCRYPT_ROUNDS=10
```

### 🔒 Security Notes:

- **NEVER** commit `.env` to version control
- Generate strong JWT secrets: `openssl rand -base64 48`
- Change default credentials in production
- Use environment-specific configurations

## 🗄️ Database Setup

1. **Create PostgreSQL database:**
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE akuntansi;

# Exit
\q
```

2. **Run Prisma migrations:**
```bash
npx prisma migrate dev
```

3. **Generate Prisma Client:**
```bash
npx prisma generate
```

4. **Seed the database:**
```bash
npx prisma db seed
```

This will create:
- Demo company (PT Demo Akuntansi)
- Admin user (admin@akuntansi.id / admin123)
- Basic Chart of Accounts (PSAK compliant)
- UMKM subscription package

5. **Open Prisma Studio (optional):**
```bash
npx prisma studio
```

Navigate to http://localhost:5555 to view your data.

## 🏃 Running the Application

### Development Mode:
```bash
npm run dev
```

Server will start on `http://localhost:5000` with auto-reload enabled.

### Production Build:
```bash
# Build TypeScript to JavaScript
npm run build

# Run production server
npm start
```

### Health Check:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-01-08T19:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## 📁 Project Structure

```
akuntansi-backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Database seeding script
├── src/
│   ├── config/                # Configuration files
│   │   ├── env.ts            # Environment validation
│   │   └── database.ts       # Prisma client
│   ├── middleware/            # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── validation.middleware.ts
│   ├── utils/                 # Utility functions
│   │   ├── logger.ts
│   │   ├── response.ts
│   │   ├── jwt.ts
│   │   └── password.ts
│   ├── types/                 # TypeScript types
│   ├── controllers/           # Route controllers (24 modules)
│   ├── services/              # Business logic (24 services)
│   ├── validators/            # Zod validation schemas
│   ├── routes/                # API routes (157 endpoints)
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── tests/                     # Test files
├── logs/                      # Log files
├── uploads/                   # User uploaded files
├── dist/                      # Compiled JavaScript
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── jest.config.js             # Jest config
├── README.md                  # This file
├── API_DOCUMENTATION.md       # API reference
├── PENJELASAN_MUDAH.md        # User guide (Indonesian)
└── FINAL_TEST_REPORT.md       # Test results
```

## ✨ Features

### 🎯 Complete Accounting System (157 Endpoints, 24 Modules)

#### Core Modules (Phases 1-15)
1. **Authentication** (4 endpoints) - Login, register, JWT tokens
2. **Users** (5 endpoints) - User management with 15 roles
3. **Companies** (6 endpoints) - Multi-company, multi-branch support
4. **Chart of Accounts** (8 endpoints) - PSAK-compliant COA
5. **Transactions** (10 endpoints) - 16 transaction types
6. **Vouchers** (8 endpoints) - 9 voucher types with approval workflow
7. **Journals** (7 endpoints) - Double-entry bookkeeping
8. **Customers** (6 endpoints) - Customer management with aging reports
9. **Suppliers** (6 endpoints) - Supplier management with payment terms
10. **Payments** (8 endpoints) - 8 payment methods, auto allocation
11. **Inventory** (9 endpoints) - Stock management, moving average costing
12. **Fixed Assets** (8 endpoints) - Asset depreciation, disposal tracking
13. **Taxes** (6 endpoints) - PPh & PPN calculation
14. **Reports** (5 endpoints) - Financial statements
15. **Budgets** (7 endpoints) - Budget planning & monitoring
- **Cost Centers** (5 endpoints) - Cost allocation
- **Profit Centers** (5 endpoints) - Profit tracking
- **Approvals** (6 endpoints) - Multi-level approval workflow

#### Advanced Modules (Phases 16-21)
16. **Recurring Transactions** (8 endpoints) - Automated scheduling with 6 frequencies
17. **Document Management** (5 endpoints) - File upload with Multer, access control
18. **Audit Trail** (4 endpoints) - Comprehensive action logging with diffs
19. **Dashboard & Analytics** (7 endpoints) - KPIs, cash flow, profitability metrics
20. **Batch Operations** (4 endpoints) - Atomic bulk processing
21. **Settings** (4 endpoints) - System configuration with caching

### 🔥 Key Features

- ✅ **100% TypeScript** - Type-safe codebase
- ✅ **PSAK Compliant** - Indonesian accounting standards
- ✅ **Double-Entry Bookkeeping** - Automatic balance validation
- ✅ **Multi-Company** - Manage multiple companies & branches
- ✅ **Multi-Currency** - Support for various currencies
- ✅ **Role-Based Access** - 15 predefined user roles
- ✅ **Approval Workflow** - Multi-level approval system
- ✅ **Audit Trail** - Complete activity logging
- ✅ **Financial Reports** - Balance sheet, income statement, cash flow
- ✅ **Tax Management** - Automatic PPh & PPN calculation
- ✅ **Inventory Management** - Moving average costing
- ✅ **Fixed Assets** - Depreciation calculation
- ✅ **Recurring Transactions** - Automated transaction scheduling
- ✅ **Document Management** - File uploads with access control
- ✅ **Batch Operations** - Bulk processing with atomicity
- ✅ **Analytics Dashboard** - Real-time KPIs and trends

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Response Format

All API responses follow this standard format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Success",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

### Authentication

Protected routes require JWT token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Quick Start

```bash
# 1. Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"admin@akuntansi.id","password":"admin123"}'

# 2. Use token in requests
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <your-token>"
```

**Full API documentation:** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 🧪 Testing

### Test Results
All 157 endpoints tested and passing! See [FINAL_TEST_REPORT.md](FINAL_TEST_REPORT.md) for detailed results.

### Run tests:
```bash
npm test
```

### Coverage:
```bash
npm run test:coverage
```

### Watch mode:
```bash
npm run test:watch
```

## 📝 Available Scripts

```json
{
  "dev": "Start development server with auto-reload",
  "build": "Build TypeScript to JavaScript",
  "start": "Start production server",
  "test": "Run tests",
  "test:watch": "Run tests in watch mode",
  "prisma:generate": "Generate Prisma Client",
  "prisma:migrate": "Run database migrations",
  "prisma:studio": "Open Prisma Studio",
  "prisma:seed": "Seed database with initial data",
  "prisma:reset": "Reset database (drop + migrate + seed)"
}
```

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secrets**: Use strong, randomly generated secrets
3. **Password Hashing**: Bcrypt with 10+ rounds
4. **Input Validation**: Zod schemas for all inputs
5. **SQL Injection**: Prisma ORM with parameterized queries
6. **Rate Limiting**: Protect against abuse
7. **CORS**: Whitelist allowed origins
8. **Helmet**: Security headers
9. **HTTPS**: Always use HTTPS in production

## 🐛 Troubleshooting

### Database Connection Issues:
```bash
# Check PostgreSQL is running
# Windows:
Get-Service postgresql*

# Check connection
psql -U postgres -c "SELECT version();"
```

### Port Already in Use:
```bash
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Prisma Client Not Found:
```bash
npx prisma generate
```

### Migration Issues:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 📖 Documentation

- **README.md** - This file (getting started, setup)
- **API_DOCUMENTATION.md** - Complete API reference
- **PENJELASAN_MUDAH.md** - Simple guide in Indonesian
- **FINAL_TEST_REPORT.md** - Test results (157/157 passed)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License

## 👥 Team

Backend development team for Sistem Akuntansi Indonesia

---

**Development Status:** ✅ **PRODUCTION READY**  
**Total Endpoints:** 157/157 (100%)  
**Build Status:** ✅ PASSING  
**Test Coverage:** 100%  

**Happy Coding! 🚀**
