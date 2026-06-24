# Staff Performance Dashboard - Tech Stack & Architecture

## Recommended Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (accessible component library)
- **State Management**: TanStack Query (React Query) + Zustand
- **Charts/Analytics**: Recharts + Apache ECharts
- **Auth Storage**: Secure HTTP-only cookies (via backend) + in-memory state
- **Data Export**: `papaparse` (CSV), `xlsx` (Excel), `jsPDF` (PDF)

### Backend
- **Runtime**: Node.js 18+ with Express.js
- **Database**: PostgreSQL (production) or SQLite (development)
- **ORM**: Prisma (type-safe database access)
- **Authentication**: JWT (access + refresh tokens)
- **Security**: bcryptjs (password hashing), CORS, rate limiting
- **Validation**: Zod + express-validator
- **API**: RESTful with proper error handling

### Deployment
- **Frontend**: Vercel, Netlify, or AWS Amplify
- **Backend**: Railway, Render, Heroku, or AWS EC2
- **Database**: Managed PostgreSQL (Railway, Render, AWS RDS)
- **File Storage**: AWS S3 or local filesystem with cleanup

## Security Architecture

### Authentication Flow
```
1. User Registration: Employee Code (User ID) + Password → bcrypt hash
2. Login: Employee Code + Password → Validate → Issue JWT
3. JWT Tokens:
   - Access Token (15 min expiry) → API requests
   - Refresh Token (7 days, secure HTTP-only) → Refresh access
4. Row-Level Security: All queries filtered by logged-in employee_code
```

### Access Control
- **Row-Level Security (RLS)**: Database queries include `WHERE employee_code = ?`
- **API Guards**: Middleware validates JWT and employee ownership
- **Data Filtering**: No unencrypted employee data exposed in responses
- **Audit Logging**: Track login, data access, exports

## Database Schema Overview

```sql
-- Users Table
Users (employee_code, password_hash, email, name, branch, role, created_at)

-- Staff Performance Data (from your Google Sheet)
StaffRecords (
  id, timestamp, date, branch_name, employee_code,
  activity_type, prospect_name, phone, product_interested,
  status, follow_up_date, ...all other columns
)

-- Session/Audit Logs
AuditLogs (id, employee_code, action, timestamp, ip_address)
```

## API Endpoints (Backend)

### Authentication
- `POST /api/auth/register` → Create user
- `POST /api/auth/login` → Issue tokens
- `POST /api/auth/refresh` → Get new access token
- `POST /api/auth/logout` → Invalidate refresh token

### Protected Routes (Requires Auth)
- `GET /api/dashboard/summary` → KPIs, metrics
- `GET /api/records` → Personal performance records (paginated)
- `GET /api/records/export?format=csv|excel|pdf` → Download data
- `GET /api/dashboard/analytics` → Charts data
- `GET /api/profile` → User profile info

## Security Best Practices Implemented

1. **Password Security**: bcryptjs with salt rounds = 10+
2. **Token Security**: 
   - JWT signed with strong secret
   - Refresh tokens in secure HTTP-only cookies
   - Access tokens in response (used in Authorization header)
3. **CORS**: Restrict to frontend domain only
4. **Rate Limiting**: 15 requests/min for auth endpoints
5. **SQL Injection Prevention**: Parameterized queries (Prisma)
6. **XSS Prevention**: React escaping + CSP headers
7. **CSRF Protection**: SameSite cookie flag
8. **Environment Variables**: Secrets never hardcoded
9. **Audit Logging**: Track all data access and exports
10. **HTTPS Only**: Enforce in production

## Development Workflow

```bash
# Setup
npm install (frontend & backend)
npm run dev (concurrent start)

# Testing
npm run test
npm run test:security

# Deployment
npm run build
docker build ... (optional containerization)
```

## Project Structure

```
staff-dashboard/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth (Login, Register)
│   │   │   ├── Dashboard (Summary, Charts, Table)
│   │   │   └── Layout (Navbar, Sidebar)
│   │   ├── hooks/ (useAuth, useFetch)
│   │   ├── utils/ (api client, auth helpers)
│   │   └── App.tsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/ (auth, dashboard, records)
│   │   ├── middleware/ (auth, validation, errorHandler)
│   │   ├── controllers/ (business logic)
│   │   ├── services/ (db queries, calculations)
│   │   ├── types/ (TypeScript interfaces)
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── docs/
    └── API.md
```

## Key Features

✅ Secure JWT-based authentication
✅ Row-level data security (users see only their data)
✅ Dynamic MIS dashboard with real-time analytics
✅ Multi-format export (CSV, Excel, PDF)
✅ Responsive design (mobile-friendly)
✅ Audit trail for compliance
✅ Rate limiting & input validation
✅ Error handling & logging
✅ TypeScript for type safety
✅ Dark mode ready

## Next Steps

1. Set up Node.js + Express backend
2. Configure PostgreSQL (local or cloud)
3. Build React frontend with authentication
4. Implement row-level security
5. Create dashboard with charts
6. Add export functionality
7. Deploy to cloud
8. Security audit & testing
