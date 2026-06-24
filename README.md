# Staff Performance Dashboard - Complete Solution

A **production-ready, enterprise-grade full-stack web application** for managing branch staff performance, tracking customer engagement, and generating business intelligence dashboards.

## 🎯 Overview

This solution provides:

✅ **Secure User Authentication** - Registration & Login with Employee Code as User ID  
✅ **Role-Based Access Control** - Row-level security ensuring users see only their own data  
✅ **Interactive MIS Dashboard** - Real-time analytics with 4 interactive Recharts  
✅ **Data Management** - View, paginate, and export records in CSV/Excel format  
✅ **Audit Logging** - Full compliance tracking of all user actions  
✅ **Responsive Design** - Mobile-friendly, works on all devices  
✅ **Production Ready** - Docker, CI/CD, security best practices  
✅ **Type Safe** - Full TypeScript across frontend and backend  

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS (styling)
- Recharts (interactive charts)
- TanStack Query (data fetching)
- Zustand (state management)
- Vite (build tool)

**Backend:**
- Node.js + Express
- PostgreSQL (or SQLite for dev)
- Prisma ORM
- JWT Authentication
- bcryptjs (password hashing)

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Railway/Vercel (deployment)

---

## 📁 Project Structure

```
staff-dashboard/
│
├── 📄 Documentation (5 files)
│   ├── FILE_INDEX.md                    ← START HERE
│   ├── TECH_STACK_ARCHITECTURE.md       (Architecture decisions)
│   ├── IMPLEMENTATION_SUMMARY.md        (Project overview)
│   ├── SETUP_GUIDE.md                   (Step-by-step setup)
│   └── API_DOCUMENTATION.md             (Complete API reference)
│
├── 📦 Backend (7 files)
│   ├── backend-server.ts                (Main app, all routes)
│   ├── backend-package.json             (Dependencies)
│   ├── prisma.schema                    (Database schema)
│   ├── backend-tsconfig.json            (TypeScript config)
│   ├── backend-.env.example             (Environment template)
│   ├── Dockerfile.backend               (Docker image)
│   └── docker-compose.yml               (Local dev environment)
│
├── 💻 Frontend (12 files)
│   ├── Core Application
│   │   ├── frontend-App.tsx             (React Router setup)
│   │   ├── vite.config.ts               (Vite config)
│   │   └── frontend-package.json        (Dependencies)
│   │
│   ├── Pages (5 files)
│   │   ├── frontend-LoginPage.tsx
│   │   ├── frontend-RegisterPage.tsx
│   │   ├── frontend-DashboardPage.tsx   (Main dashboard)
│   │   ├── frontend-RecordsPage.tsx
│   │   └── frontend-ProfilePage.tsx
│   │
│   ├── Components (3 files)
│   │   ├── frontend-Layout.tsx          (Navigation)
│   │   └── frontend-PrivateRoute.tsx    (Route protection)
│   │
│   ├── State & API (2 files)
│   │   ├── frontend-authStore.ts        (Zustand store)
│   │   └── frontend-apiClient.ts        (Axios client)
│   │
│   └── frontend-.env.example            (Environment template)
│
└── 🔄 DevOps (1 file)
    └── .github-workflows-ci.yml         (GitHub Actions)

Total: 27 files, ~3000 lines of code
```

---

## 🚀 Quick Start (10 Minutes)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or use SQLite for dev)
- npm or yarn

### 1. Backend Setup

```bash
mkdir staff-dashboard && cd staff-dashboard

# Backend
mkdir backend && cd backend
npm install  # Use frontend-package.json contents

# Create .env
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:password@localhost:5432/staff_dashboard"
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this
REFRESH_TOKEN_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:3000
EOF

# Setup database
npx prisma migrate dev --name init

# Start backend
npm run dev
```

**Backend running on:** http://localhost:5000

### 2. Frontend Setup

```bash
cd ../frontend
npm install  # Use frontend-package.json contents

# Create .env.local
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:5000
EOF

# Start frontend
npm run dev
```

**Frontend running on:** http://localhost:3000

### 3. Create First User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeCode": "1055",
    "email": "test@test.com",
    "password": "Test@123456!",
    "firstName": "Test",
    "lastName": "User",
    "branch": "Thodupuzha",
    "designation": "Manager"
  }'
```

### 4. Login to Application

Visit **http://localhost:3000/login**
- Employee Code: `1055`
- Password: `Test@123456!`

---

## 📚 Documentation Files

### Start Here 👇

| File | Read Time | Purpose |
|------|-----------|---------|
| **FILE_INDEX.md** | 5 min | Complete file guide and quick reference |
| **SETUP_GUIDE.md** | 10 min | Step-by-step development setup |
| **TECH_STACK_ARCHITECTURE.md** | 15 min | Tech stack explanation & decisions |
| **API_DOCUMENTATION.md** | 20 min | Complete API reference with examples |
| **IMPLEMENTATION_SUMMARY.md** | 10 min | Project overview & deployment checklist |

---

## 🔐 Security Features

### Authentication & Authorization
- ✅ JWT-based stateless authentication
- ✅ Secure password hashing (bcryptjs)
- ✅ Refresh token rotation
- ✅ HTTP-only secure cookies
- ✅ Token expiry (15 min access, 7 days refresh)

### Data Protection
- ✅ Row-level security (users see only their data)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ XSS prevention (React escaping + CSP headers)
- ✅ CSRF protection (SameSite cookies)
- ✅ Rate limiting (auth endpoints)

### Compliance & Monitoring
- ✅ Audit logging (login, logout, exports)
- ✅ IP address tracking
- ✅ User agent logging
- ✅ Action timestamps
- ✅ Compliance-ready

---

## 📊 Dashboard Features

### Key Performance Indicators (KPIs)
```
Total Records      │ All records created
Last 30 Days       │ Activities in last month
Calls              │ Phone calls made
Visits             │ In-person visits
New Leads          │ New prospects identified
Warm Prospects     │ Engaged, likely to convert
Hot Prospects      │ Very interested, high priority
Conversion Rate    │ New leads / Total records %
```

### Analytics Dashboards

**1. Activity Breakdown (Bar Chart)**
- Visits vs Calls vs New Leads

**2. Customer Type Distribution (Pie Chart)**
- New vs Existing customers

**3. Lead Source Distribution (Horizontal Bar)**
- Relatives, Friends, Customers, Others

**4. Activity Timeline (Line Chart)**
- Daily activity trend over time

---

## 💾 Data Management

### View Records
- Paginated table view (20 records per page)
- Sortable columns
- Status color indicators
- Follow-up date tracking

### Export Options
- **CSV Export** - Compatible with Excel, Google Sheets
- **Excel Export** - Formatted .xlsx files
- Includes all user records
- Logged in audit trail

---

## 🔄 Authentication Flow

```
┌─────────────────────────────────┐
│   User Registration             │
│   (Employee Code + Password)    │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│   Password Hashed (bcryptjs)    │
│   Stored in Database            │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│   User Login                    │
│   (Employee Code + Password)    │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│   JWT Tokens Issued             │
│   Access: 15 min expiry         │
│   Refresh: 7 days (HTTP-only)   │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│   Protected API Requests        │
│   Bearer Token in Header        │
│   Row-Level Security Applied    │
└─────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Core Tables
1. **Users** - Staff accounts & credentials
2. **StaffRecords** - Performance data (row-level secured)
3. **RefreshTokens** - Session management
4. **AuditLogs** - Compliance & monitoring

---

## 🌐 API Endpoints

### Public Routes (No Auth)
```
POST   /api/auth/register      Register new user
POST   /api/auth/login         Login, get tokens
POST   /api/auth/refresh       Refresh access token
```

### Protected Routes (Requires Auth)
```
GET    /api/profile            User profile info
GET    /api/dashboard/summary  KPI metrics
GET    /api/dashboard/analytics Chart data
GET    /api/records            Personal records (paginated)
GET    /api/records/export     Download CSV/Excel
POST   /api/auth/logout        Logout user
```

**Full documentation:** See `API_DOCUMENTATION.md`

---

## 🧪 Testing the System

### Test Registration
```bash
# Successfully register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeCode":"1055",
    "email":"test@test.com",
    "password":"Test@123456!",
    "firstName":"Test",
    "lastName":"User",
    "branch":"Thodupuzha",
    "designation":"Manager"
  }'

# Should fail - duplicate employee code
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeCode":"1055",
    "email":"different@test.com",
    "password":"Test@123456!",
    "firstName":"Another",
    "lastName":"User",
    "branch":"Thodupuzha",
    "designation":"Manager"
  }'
```

### Test Row-Level Security
```bash
# Login as User A
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employeeCode":"1055","password":"Test@123456!"}'
# Returns accessToken_A

# Get User A's records
curl -X GET http://localhost:5000/api/records \
  -H "Authorization: Bearer accessToken_A"
# Returns: Only user 1055's records

# Login as User B
# ... (same for different employee code)

# Try to get User B's records with User A's token
curl -X GET http://localhost:5000/api/records \
  -H "Authorization: Bearer accessToken_A"
# Still returns: Only user 1055's records (secure!)
```

---

## 🚀 Deployment

### Local Development
```bash
# Using Docker Compose
docker-compose up

# Starts PostgreSQL, Backend, and Frontend automatically
```

### Production Deployment

**Backend (Railway):**
```bash
railway login
railway init
railway variable set JWT_SECRET="your-secret"
railway up
```

**Frontend (Vercel):**
```bash
vercel
vercel env add VITE_API_URL https://your-backend-url.com
```

---

## 📋 Pre-Deployment Checklist

- [ ] Change `JWT_SECRET` to strong random string
- [ ] Change `REFRESH_TOKEN_SECRET` to strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS only
- [ ] Configure CORS for your domain
- [ ] Set strong database password
- [ ] Enable SSL for database
- [ ] Setup error logging (Sentry)
- [ ] Configure database backups
- [ ] Setup monitoring/alerts
- [ ] Load test the application
- [ ] Security audit (OWASP)
- [ ] Create deployment runbook

---

## 📊 Sample Data Import

To import your Google Sheet data:

1. **Export as CSV** from Google Sheets
2. **Create seed script** in `backend/prisma/seed.ts`
3. **Run:** `npx ts-node prisma/seed.ts`

Example:
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  const fileContent = fs.readFileSync('./data/staff_records.csv', 'utf-8');
  const records = csv.parse(fileContent, { columns: true });
  
  for (const record of records) {
    await prisma.staffRecord.create({ data: record });
  }
}

main().finally(() => prisma.$disconnect());
```

---

## 🆘 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Or use SQLite for development
DATABASE_URL="file:./dev.db" npm run dev
```

### Port 5000 Already in Use
```bash
# Kill the process
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
```

### CORS Errors
```bash
# Ensure FRONTEND_URL in .env matches frontend URL
FRONTEND_URL=http://localhost:3000 npm run dev
```

### Login Issues
```bash
# Check access token (15 min expiry)
# Check JWT_SECRET in .env
# Verify credentials
```

---

## 📚 Key Files to Know

| File | Lines | Purpose |
|------|-------|---------|
| `backend-server.ts` | ~600 | Express server, all routes |
| `frontend-DashboardPage.tsx` | ~300 | Main dashboard with charts |
| `prisma.schema` | ~150 | Database schema |
| `frontend-apiClient.ts` | ~100 | API communication |
| `frontend-authStore.ts` | ~80 | Auth state management |

---

## 🎓 Learning Resources

### Documentation
- **Express.js**: https://expressjs.com
- **React**: https://react.dev
- **Prisma**: https://prisma.io
- **Tailwind CSS**: https://tailwindcss.com
- **JWT**: https://jwt.io

### In This Project
- TECH_STACK_ARCHITECTURE.md - Why we chose this stack
- SETUP_GUIDE.md - How to set it up
- API_DOCUMENTATION.md - How to use the API
- IMPLEMENTATION_SUMMARY.md - How it all works

---

## 🤝 Support

### Getting Help
1. Check documentation files in this repo
2. Review error messages carefully
3. Check backend logs (`npm run dev` output)
4. Use browser DevTools Network tab
5. Check database with `npx prisma studio`

### Common Issues
- **Port in use?** → Kill process or change PORT in .env
- **DB connection error?** → Check PostgreSQL is running
- **CORS errors?** → Verify FRONTEND_URL in .env
- **JWT errors?** → Check secrets in .env

---

## 📄 Project Statistics

- **Total Files**: 27
- **Backend Code**: ~800 lines (excluding packages)
- **Frontend Code**: ~1500 lines (excluding packages)
- **Documentation**: ~2000 lines
- **Database Tables**: 4
- **API Endpoints**: 9
- **Dashboard Charts**: 4
- **Security Features**: 10+

---

## 🎯 What's Next?

1. **Read** `FILE_INDEX.md` for file overview
2. **Follow** `SETUP_GUIDE.md` for step-by-step setup
3. **Test** login and dashboard locally
4. **Import** your Google Sheet data
5. **Customize** branding and styling
6. **Deploy** to production

---

## 📄 License

This project is provided as-is for internal use.

---

## 🙋 Questions?

- **Setup issues?** → Check SETUP_GUIDE.md
- **Code questions?** → Check FILE_INDEX.md
- **API questions?** → Check API_DOCUMENTATION.md
- **Architecture questions?** → Check TECH_STACK_ARCHITECTURE.md

---

**Ready to build? Start with FILE_INDEX.md!** 🚀

---

*Last Updated: January 2024 | Version: 1.0.0 | Complete & Production-Ready*
