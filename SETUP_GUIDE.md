# Staff Performance Dashboard - Setup & Deployment Guide

## 📋 Prerequisites

- Node.js 18+ (Download from nodejs.org)
- PostgreSQL 14+ (or SQLite for development)
- Git
- npm or yarn

## 🚀 Quick Start (Local Development)

### Step 1: Clone & Setup Backend

```bash
# Create project directory
mkdir staff-dashboard && cd staff-dashboard

# Create backend folder
mkdir backend && cd backend

# Copy package.json from backend-package.json
npm install

# Create .env file
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/staff_dashboard"
# For SQLite in development: DATABASE_URL="file:./dev.db"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-refresh-secret-key-change-this

# CORS
FRONTEND_URL=http://localhost:3000
EOF

# Initialize Prisma
npx prisma init

# Run database migrations
npx prisma migrate dev --name init

# Start backend
npm run dev
```

### Step 2: Setup Frontend

```bash
# In another terminal, from project root
cd frontend
npm create vite@latest . -- --template react-ts
npm install

# Copy environment variables
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:5000
EOF

# Install dependencies from frontend-package.json
npm install

# Create directory structure
mkdir -p src/{pages,components,store,utils}

# Copy component files (LoginPage, DashboardPage, etc.)
# Copy store files (authStore.ts)
# Copy utils files (apiClient.ts)

# Start frontend
npm run dev
```

### Step 3: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

## 📊 Import Your Google Sheet Data

### Option 1: Manual CSV Import

```bash
# Export your Google Sheet as CSV
# Place file in backend/data/staff_records.csv

# Create seed script (backend/prisma/seed.ts):
```

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  const fileContent = fs.readFileSync('./data/staff_records.csv', 'utf-8');
  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  for (const record of records) {
    await prisma.staffRecord.create({
      data: {
        timestamp: new Date(record['Timestamp']),
        date: new Date(record['Date']),
        branchName: record['Branch Name'],
        employeeCode: record['Employee Code'],
        employeeName: record['Employee Name'],
        designation: record['Designation'],
        activityType: record['Activity Type'],
        typeOfCustomer: record['Type of Customer'],
        leadSource: record['Lead Source'],
        prospectName: record['Prospect Name'],
        phoneNumber: record['Phone Numebr(Whatsapp)'],
        address: record['Address'],
        profession: record['Profession'],
        dob: record['DOB/WD'],
        productInterested: record['Prodcut Interested'],
        remarks: record['Remarks'],
        nextFollowUpDate: record['Next Follow-up Date'] ? new Date(record['Next Follow-up Date']) : null,
        relationWithStaff: record['Relation With Staff'],
        profileOfCustomer: record['Profile of Customer']
      }
    });
  }

  console.log('✅ Data imported successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

```bash
# Run seed
npx ts-node prisma/seed.ts
```

### Option 2: Via API Endpoint

Create an admin endpoint to bulk import:

```typescript
// src/routes/admin.ts
app.post('/api/admin/import', adminAuth, async (req, res) => {
  const { records } = req.body; // Array of records

  const created = await prisma.staffRecord.createMany({
    data: records
  });

  res.json({ imported: created.count });
});
```

## 🔒 Security Checklist

- [ ] Change `JWT_SECRET` and `REFRESH_TOKEN_SECRET` to strong random strings
- [ ] Set `NODE_ENV=production` in production
- [ ] Use HTTPS only in production
- [ ] Enable CORS for your domain only
- [ ] Use strong database passwords
- [ ] Enable SSL for database connections
- [ ] Set rate limiting appropriately
- [ ] Regular security audits
- [ ] Keep dependencies updated

## 🌐 Deployment

### Deploy Backend to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize Railway project
railway init

# Set environment variables
railway variable set JWT_SECRET="your-strong-secret"
railway variable set REFRESH_TOKEN_SECRET="your-refresh-secret"
railway variable set DATABASE_URL="your-postgres-url"
railway variable set FRONTEND_URL="https://your-frontend-url.com"

# Deploy
railway up

# Get production URL
railway open
```

### Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable
vercel env add VITE_API_URL https://your-backend-url.com
```

### Deploy Both to Docker

```dockerfile
# Dockerfile.backend
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

```bash
# Build and push
docker build -t staff-dashboard-backend -f Dockerfile.backend .
docker tag staff-dashboard-backend your-registry/staff-dashboard:latest
docker push your-registry/staff-dashboard:latest

# Run
docker run -e DATABASE_URL="..." -e JWT_SECRET="..." -p 5000:5000 your-registry/staff-dashboard:latest
```

## 📝 First User Setup

### Create Initial Admin User (via API)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeCode": "ADMIN001",
    "email": "admin@company.com",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "User",
    "branch": "Corporate Office",
    "designation": "Administrator"
  }'
```

### Create Staff Accounts

Replace `ADMIN001` with each employee's actual employee code from your Google Sheet.

## 🧪 Testing

### Test Login Flow

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeCode": "1055",
    "email": "ullas@company.com",
    "password": "TestPassword123!",
    "firstName": "Ullas",
    "lastName": "A N",
    "branch": "Thodupuzha",
    "designation": "Manager"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employeeCode": "1055", "password": "TestPassword123!"}'

# Get Dashboard (use returned accessToken)
curl -X GET http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Data Export

```bash
# Export as CSV
curl -X GET "http://localhost:5000/api/records/export?format=csv" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  > records.csv

# Export as Excel
curl -X GET "http://localhost:5000/api/records/export?format=excel" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  > records.xlsx
```

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Or use SQLite for development
DATABASE_URL="file:./dev.db" npm run dev
```

### JWT Token Errors

```bash
# Verify secret is set correctly in .env
echo $JWT_SECRET

# Check token expiry (15 minutes for access token)
```

### CORS Errors

```bash
# Ensure FRONTEND_URL matches your frontend URL
# Check browser console for exact error
# Verify credentials: true in axios config
```

### Port Already in Use

```bash
# Change port in .env
PORT=5001

# Or kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |

### Protected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| GET | `/api/dashboard/summary` | KPI summary |
| GET | `/api/dashboard/analytics` | Analytics data for charts |
| GET | `/api/records?page=1&limit=20` | Paginated personal records |
| GET | `/api/records/export?format=csv\|excel` | Export personal data |

## 🔄 Maintenance

### Regular Tasks

- Monitor error logs daily
- Review user access patterns weekly
- Back up database monthly
- Update dependencies quarterly
- Security audit annually

### Database Backup

```bash
# PostgreSQL backup
pg_dump -U username database_name > backup.sql

# Restore
psql -U username database_name < backup.sql

# SQLite backup
cp dev.db dev.db.backup
```

## 📞 Support

For issues, check:
1. Browser console for errors
2. Backend logs: `npm run dev` output
3. Database connection: `npx prisma db push`
4. Environment variables: `.env` file

## 📄 License

This project is provided as-is for internal use.

---

**Need Help?** Run `npm run dev` and check both frontend (localhost:3000) and backend (localhost:5000) consoles for detailed error messages.
