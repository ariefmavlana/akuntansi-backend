# 🚀 Akuntansi Indonesia - Backend API

Backend API untuk Sistem Akuntansi Indonesia yang compliant dengan PSAK.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Development Workflow](#development-workflow)

## 🛠 Tech Stack

- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5+
- **Database**: PostgreSQL 16+
- **ORM**: Prisma 5+
- **Authentication**: JWT
- **Validation**: Zod
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
DATABASE_URL="postgresql://username:password@localhost:5432/akuntansi_dev?schema=public"

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
CREATE DATABASE akun_tansi;

# Exit
\q
```

2. **Run Prisma migrations:**
```bash
npm run prisma:migrate
```

3. **Generate Prisma Client:**
```bash
npm run prisma:generate
```

4. **Seed the database (optional):**
```bash
npm run prisma:seed
```

This will create:
- Demo company (PT Demo Akuntansi)
- Admin user (admin@akuntansi.id / admin123)
- Basic Chart of Accounts (PSAK compliant)
- UMKM subscription package

5. **Open Prisma Studio (optional):**
```bash
npm run prisma:studio
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
  "timestamp": "2026-01-07T10:00:00.000Z",
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
│   │   └── index.ts
│   ├── controllers/           # Route controllers (TODO)
│   ├── services/              # Business logic (TODO)
│   ├── routes/                # API routes (TODO)
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── tests/                     # Test files
├── logs/                      # Log files
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── jest.config.js             # Jest config
└── README.md                  # This file
```

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

## 🧪 Testing

### Run all tests:
```bash
npm test
```

### Run tests with coverage:
```bash
npm run test:coverage
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Coverage Report:
Coverage reports are generated in `coverage/` directory.

## 👨‍💻 Development Workflow

### 1. Create a new feature branch:
```bash
git checkout -b feature/your-feature-name
```

### 2. Make your changes

### 3. Run linting:
```bash
npm run lint
```

### 4. Fix linting issues:
```bash
npm run lint:fix
```

### 5. Format code:
```bash
npm run format
```

### 6. Run tests:
```bash
npm test
```

### 7. Commit your changes:
```bash
git add .
git commit -m "feat: add new feature"
```

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 8. Push and create Pull Request:
```bash
git push origin feature/your-feature-name
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

## 📝 Available Scripts

```json
{
  "dev": "Start development server with auto-reload",
  "build": "Build TypeScript to JavaScript",
  "start": "Start production server",
  "test": "Run tests",
  "test:watch": "Run tests in watch mode",
  "lint": "Check code for linting errors",
  "lint:fix": "Fix linting errors automatically",
  "format": "Format code with Prettier",
  "prisma:generate": "Generate Prisma Client",
  "prisma:migrate": "Run database migrations",
  "prisma:studio": "Open Prisma Studio",
  "prisma:seed": "Seed database with initial data",
  "prisma:reset": "Reset database (drop + migrate + seed)"
}
```

## 🐛 Troubleshooting

### Database Connection Issues:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -c "SELECT version();"
```

### Port Already in Use:
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 <PID>
```

### Prisma Client Not Found:
```bash
npm run prisma:generate
```

### Migration Issues:
```bash
# Reset database (WARNING: deletes all data)
npm run prisma:reset
```

## 📖 Next Steps

1. **Implement Authentication Module**
   - Register endpoint
   - Login endpoint
   - Refresh token endpoint
   - Logout endpoint

2. **Implement Core Accounting**
   - Chart of Accounts CRUD
   - Transaction management
   - Voucher system
   - Journal posting

3. **Implement Reporting**
   - Balance Sheet
   - Income Statement
   - Cash Flow Statement

4. **Add Tests**
   - Unit tests
   - Integration tests
   - E2E tests

5. **Setup CI/CD**
   - GitHub Actions
   - Automated testing
   - Automated deployment

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

**Happy Coding! 🚀**
