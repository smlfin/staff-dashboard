# Staff Performance Dashboard - Complete File Index

## 📦 Project Overview

A **production-ready, secure full-stack web application** for branch staff to manage performance metrics, view dashboards, and export data with strict row-level security.

**Key Features:**
- ✅ User Registration & Login (Employee Code as ID)
- ✅ Secure JWT Authentication
- ✅ Row-Level Data Security
- ✅ Interactive MIS Dashboard with Charts
- ✅ Data Export (CSV & Excel)
- ✅ Responsive Mobile-First Design
- ✅ Audit Logging for Compliance
- ✅ Production-Ready Deployment

---

## 📁 File Organization

### Architecture & Planning Documents

| File | Purpose |
|------|---------|
| **TECH_STACK_ARCHITECTURE.md** | Complete tech stack explanation, architecture decisions, security approach |
| **IMPLEMENTATION_SUMMARY.md** | Project overview, schema, workflows, deployment checklist |
| **SETUP_GUIDE.md** | Step-by-step development setup, data import, deployment instructions |
| **API_DOCUMENTATION.md** | Complete API reference with examples and field definitions |
| **README.md** (to create) | Project introduction and quick start |

---

### Backend Files

#### Configuration
| File | Purpose |
|------|---------|
| **backend-package.json** | Backend dependencies and scripts |
| **backend-tsconfig.json** | TypeScript configuration |
| **backend-.env.example** | Environment variables template |
| **prisma.schema** | Database schema with all models |
| **Dockerfile.backend** | Docker containerization |

#### Core Application
| File | Purpose |
|------|---------|
| **backend-server.ts** | Express server, all routes, middleware, authentication logic |

**Contents of backend-server.ts:**
- CORS & security headers setup
- Rate limiting configuration
- Authentication middleware
- Routes:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `GET /api/profile`
  - `GET /api/dashboard/summary`
  - `GET /api/dashboard/analytics`
  - `GET /api/records` (paginated)
  - `GET /api/records/export`

---

### Frontend Files

#### Configuration
| File | Purpose |
|------|---------|
| **frontend-package.json** | Frontend dependencies and scripts |
| **frontend-.env.example** | Environment variables template |
| **vite.config.ts** | Vite bundler configuration |

#### Core Application
| File | Purpose |
|------|---------|
| **frontend-App.tsx** | React Router setup, route definitions, QueryClient |

#### Pages
| File | Purpose |
|------|---------|
| **frontend-LoginPage.tsx** | Login form with validation and error handling |
| **frontend-RegisterPage.tsx** | Registration form with comprehensive validation |
| **frontend-DashboardPage.tsx** | Main dashboard with KPI cards, 4 interactive charts, export buttons |
| **frontend-RecordsPage.tsx** | Data table with pagination, sorting, filtering, export |
| **frontend-ProfilePage.tsx** | User profile display, account info, login history |

#### Components
| File | Purpose |
|------|---------|
| **frontend-Layout.tsx** | Navigation sidebar, mobile responsive menu, logout |
| **frontend-PrivateRoute.tsx** | Route protection component, redirects to login |

#### State Management & API
| File | Purpose |
|------|---------|
| **frontend-authStore.ts** | Zustand store for auth state, token management |
| **frontend-apiClient.ts** | Axios instance with JWT interceptors, token refresh logic |

---

### DevOps & Deployment

| File | Purpose |
|------|---------|
| **docker-compose.yml** | Local development with PostgreSQL, backend, frontend |
| **.github-workflows-ci.yml** | GitHub Actions CI/CD pipeline for testing and deployment |

---

## 🚀 Quick Start

### 1. Backend Setup (5 minutes)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with database URL
npx prisma migrate dev --name init
npm run dev
```

### 2. Frontend Setup (5 minutes)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### 3. Access Application

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/api/health

### 4. Create First User

```bash
# Via API
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

# Then login at http://localhost:3000/login
```

---

## 📊 Database Schema

### Users Table
```sql
- employeeCode (unique, primary key)
- email (unique)
- passwordHash (bcrypted)
- firstName, lastName
- branch, designation, role
- lastLoginAt, createdAt, updatedAt
```

### StaffRecords Table (Row-level secured)
```sql
- id (primary key)
- employeeCode (indexed, used for filtering)
- date, timestamp
- branchName, activityType
- prospectName, phoneNumber
- productInterested, profileOfCustomer
- nextFollowUpDate, remarks
- family & professional details
- createdAt, updatedAt
```

### RefreshTokens Table
```sql
- id (primary key)
- employeeCode (foreign key)
- token (unique)
- expiresAt
```

### AuditLogs Table
```sql
- id (primary key)
- employeeCode (foreign key)
- action (LOGIN, EXPORT_CSV, etc.)
- ipAddress, userAgent
- createdAt
```

---

## 🔐 Security Architecture

### Authentication Flow
```
User Registration
    ↓
Password hashed (bcryptjs 10+ rounds)
    ↓
Store in database
    ↓
Login validation
    ↓
Issue JWT tokens (Access + Refresh)
    ↓
Access token: 15 min expiry
Refresh token: 7 days, HTTP-only cookie
    ↓
Protected requests use Bearer token
    ↓
Middleware verifies JWT
    ↓
Row-level security: WHERE employeeCode = current_user
```

### Row-Level Security
Every query on `StaffRecords` table includes:
```sql
WHERE employeeCode = ? -- logged-in user
```

Users cannot:
- View other users' records
- Access data via direct IDs
- Bypass security via token manipulation
- Export others' data

---

## 📈 Dashboard Analytics

### KPI Cards
- Total Records (all time)
- Activities (last 30 days)
- Calls made
- Visits made
- New leads generated
- Warm prospects
- Hot prospects
- Conversion rate %

### Charts (Recharts)
1. **Activity Breakdown** - Bar chart (Visits, Calls, New Leads)
2. **Customer Type** - Pie chart (New vs Existing)
3. **Lead Source** - Horizontal bar (Relatives, Friends, Customers, Others)
4. **Timeline** - Line chart (Daily activity trend)

---

## 🔄 API Endpoints Summary

### Authentication (Public)
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login, get tokens
POST   /api/auth/refresh       - Refresh access token
```

### Protected Routes
```
GET    /api/profile            - User profile info
GET    /api/dashboard/summary  - KPI metrics
GET    /api/dashboard/analytics - Chart data
GET    /api/records            - Personal records (paginated)
GET    /api/records/export     - Download CSV/Excel
POST   /api/auth/logout        - Logout user
```

---

## 🧪 Testing Checklist

- [ ] Register new user with valid credentials
- [ ] Register fails with duplicate employee code
- [ ] Login with valid credentials returns tokens
- [ ] Login fails with invalid password
- [ ] Access token allows API calls for 15 minutes
- [ ] Refresh token extends session
- [ ] User A cannot view User B's records
- [ ] Dashboard shows correct metrics
- [ ] Charts render with data
- [ ] CSV export downloads correctly
- [ ] Excel export downloads correctly
- [ ] Logout clears tokens
- [ ] Protected routes redirect to login when not authenticated

---

## 🚀 Deployment Steps

### Local Development
```bash
# Using Docker Compose (easiest)
docker-compose up

# Or manual setup
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Production Deployment

**Option 1: Railway (Easiest)**
```bash
# Backend
railway up

# Frontend
vercel
```

**Option 2: Docker + Cloud**
```bash
# Build images
docker build -t backend ./backend
docker build -t frontend ./frontend

# Push to registry
docker tag backend myregistry/backend:latest
docker tag frontend myregistry/frontend:latest
docker push myregistry/backend:latest
docker push myregistry/frontend:latest

# Deploy to cloud (ECS, Kubernetes, etc.)
```

---

## 📋 Pre-Deployment Checklist

- [ ] Change JWT_SECRET to random string (32+ chars)
- [ ] Change REFRESH_TOKEN_SECRET to random string
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS only
- [ ] Configure CORS for production domain
- [ ] Set strong database password
- [ ] Enable SSL for database connection
- [ ] Set up error logging (Sentry/LogRocket)
- [ ] Configure backups (daily)
- [ ] Set up monitoring/alerts
- [ ] Load test the application
- [ ] Security audit (OWASP Top 10)
- [ ] Create deployment runbook
- [ ] Set up CI/CD pipeline

---

## 🔄 Continuous Integration

GitHub Actions CI/CD pipeline (`.github-workflows-ci.yml`):
- Backend tests on push/PR
- Frontend tests on push/PR
- Type checking (TypeScript)
- Docker image builds
- Security scanning (Trivy)
- Dependency vulnerability checks

---

## 📚 Additional Resources

### Documentation
- **TECH_STACK_ARCHITECTURE.md** - Architecture decisions
- **SETUP_GUIDE.md** - Step-by-step setup
- **API_DOCUMENTATION.md** - API reference
- **IMPLEMENTATION_SUMMARY.md** - Project overview

### Tools & Libraries
- **Express.js** - Backend framework
- **React 18** - Frontend framework
- **PostgreSQL** - Database
- **Prisma** - ORM
- **JWT** - Authentication
- **Recharts** - Charts
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **TanStack Query** - Data fetching

### External Documentation
- https://expressjs.com - Express.js docs
- https://react.dev - React documentation
- https://www.prisma.io - Prisma ORM
- https://tailwindcss.com - Tailwind CSS
- https://recharts.org - Recharts library
- https://jwt.io - JWT tokens

---

## 🆘 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Or use SQLite for development
DATABASE_URL="file:./dev.db" npm run dev
```

### Port Already in Use
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
PORT=5001 npm run dev
```

### CORS Errors
```bash
# Ensure FRONTEND_URL matches frontend URL in .env
FRONTEND_URL=http://localhost:3000 npm run dev
```

### JWT Errors
```bash
# Verify secrets are set in .env
echo $JWT_SECRET

# Check token hasn't expired (15 min for access token)
```

---

## 📞 Getting Help

1. **Check error messages** - Read console output carefully
2. **Check documentation** - Review relevant .md files
3. **Check logs** - Look at backend `npm run dev` output
4. **Check network** - Use browser DevTools Network tab
5. **Check database** - Use `npx prisma studio`

---

## 📄 License

This project is provided as-is for internal use.

---

## 📊 Project Statistics

- **Total Files**: 30+
- **Backend LOC**: ~600 (server.ts) + schema + config
- **Frontend LOC**: ~1200 (5 pages + components + store)
- **Database Tables**: 4 (Users, StaffRecords, RefreshTokens, AuditLogs)
- **API Endpoints**: 9 (3 public, 6 protected)
- **Dashboard Charts**: 4 interactive Recharts
- **Security Features**: 10+ (JWT, bcrypt, CORS, rate limiting, etc.)

---

## 🎯 Next Steps

1. ✅ **Review** the architecture (TECH_STACK_ARCHITECTURE.md)
2. ✅ **Setup** development environment (SETUP_GUIDE.md)
3. ✅ **Run** the application locally
4. ✅ **Test** registration and login flow
5. ✅ **Import** your Google Sheet data
6. ✅ **Customize** styling and branding
7. ✅ **Deploy** to production

---

**Ready to start building? Begin with SETUP_GUIDE.md!** 🚀

Last Updated: January 2024
Version: 1.0.0
