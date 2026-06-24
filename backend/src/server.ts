import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const app: Express = express();
const prisma = new PrismaClient();

// ============================================================================
// GOOGLE SHEETS SERVICE (Inline for simplicity)
// ============================================================================

interface EmployeeData {
  employeeCode: string;
  employeeName: string;
  branch: string;
  designation: string;
}

class GoogleSheetsService {
  private spreadsheetId: string;
  private cache: Map<string, EmployeeData> = new Map();
  private cacheTimestamp: number = 0;
  private cacheDuration: number = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID || '1Za1CrlzzXpQjB3yZHjL2ZpRkjXgkVmLHH_LtXJq9K5o';
  }

  async getAllEmployees(): Promise<EmployeeData[]> {
    const now = Date.now();
    if (this.cache.size > 0 && now - this.cacheTimestamp < this.cacheDuration) {
      console.log('📦 Using cached employee data');
      return Array.from(this.cache.values());
    }

    try {
      console.log('🔄 Fetching employees from Google Sheet...');
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Sheet1?key=${process.env.GOOGLE_SHEETS_API_KEY}`
      );

      if (!response.ok) {
        console.error('❌ Failed to fetch from Google Sheets:', response.statusText);
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];

      this.cache.clear();

      if (rows.length === 0) {
        console.warn('⚠️ No data found in Google Sheet');
        return [];
      }

      // Parse header row
      const headers = rows[0];
      const employeeCodeIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('employee code') || h.toLowerCase().includes('code')
      );
      const employeeNameIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('employee name') || h.toLowerCase().includes('name')
      );
      const branchIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('branch')
      );
      const designationIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('designation')
      );

      if (employeeCodeIndex === -1 || employeeNameIndex === -1) {
        console.error('❌ Required columns not found in Google Sheet');
        console.log('Available columns:', headers);
        return [];
      }

      // Parse employee rows (skip header)
      const employees: EmployeeData[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[employeeCodeIndex]) continue;

        const employee: EmployeeData = {
          employeeCode: String(row[employeeCodeIndex]).trim(),
          employeeName: String(row[employeeNameIndex]).trim(),
          branch: branchIndex !== -1 ? String(row[branchIndex] || '').trim() : 'N/A',
          designation: designationIndex !== -1 ? String(row[designationIndex] || '').trim() : 'N/A',
        };

        employees.push(employee);
        this.cache.set(employee.employeeCode, employee);
      }

      this.cacheTimestamp = now;
      console.log(`✅ Loaded ${employees.length} employees from Google Sheet`);
      return employees;
    } catch (error) {
      console.error('❌ Error fetching from Google Sheets:', error);
      return [];
    }
  }

  async findEmployeeByCode(employeeCode: string): Promise<EmployeeData | null> {
    const code = String(employeeCode).trim();

    // Check cache first
    if (this.cache.has(code)) {
      console.log(`✅ Found employee in cache: ${code}`);
      return this.cache.get(code) || null;
    }

    // Fetch all employees and cache them
    const employees = await this.getAllEmployees();
    
    const employee = employees.find(e => e.employeeCode === code);
    if (employee) {
      console.log(`✅ Found employee: ${code} - ${employee.employeeName}`);
      return employee;
    }

    console.warn(`⚠️ Employee not found: ${code}`);
    return null;
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp = 0;
    console.log('🗑️ Employee cache cleared');
  }
}

const googleSheetsService = new GoogleSheetsService();

// ============================================================================
// MIDDLEWARE & CONFIGURATION
// ============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
});

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface DecodedToken {
  employeeCode: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  employeeCode?: string;
}

interface EmployeeInfo {
  employeeCode: string;
  employeeName: string;
  branch: string;
  designation: string;
}

function parseEmployeeName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] || '', lastName: '' };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function lookupEmployee(employeeCode: string): Promise<EmployeeInfo | null> {
  const code = String(employeeCode).trim();

  // 1. Check local database (EmployeeDirectory)
  const directoryEntry = await prisma.employeeDirectory.findUnique({
    where: { employeeCode: code },
  });

  if (directoryEntry) {
    console.log(`✅ Found in local directory: ${code}`);
    return {
      employeeCode: directoryEntry.employeeCode,
      employeeName: directoryEntry.employeeName,
      branch: directoryEntry.branch,
      designation: directoryEntry.designation,
    };
  }

  // 2. Check Google Sheet
  const googleEmployee = await googleSheetsService.findEmployeeByCode(code);
  if (googleEmployee) {
    console.log(`✅ Found in Google Sheet: ${code}`);
    
    // Optionally, save to local database for future lookups
    try {
      await prisma.employeeDirectory.create({
        data: {
          employeeCode: googleEmployee.employeeCode,
          employeeName: googleEmployee.employeeName,
          branch: googleEmployee.branch,
          designation: googleEmployee.designation,
        },
      });
      console.log(`✅ Cached employee in local directory: ${code}`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error('❌ Error caching employee:', error);
      }
    }

    return {
      employeeCode: googleEmployee.employeeCode,
      employeeName: googleEmployee.employeeName,
      branch: googleEmployee.branch,
      designation: googleEmployee.designation,
    };
  }

  // 3. Check StaffRecord as fallback
  const record = await prisma.staffRecord.findFirst({
    where: { employeeCode: code },
    orderBy: { date: 'desc' },
  });

  if (record) {
    console.log(`✅ Found in staff records: ${code}`);
    return {
      employeeCode: record.employeeCode,
      employeeName: record.employeeName,
      branch: record.branchName,
      designation: record.designation,
    };
  }

  console.warn(`⚠️ Employee not found: ${code}`);
  return null;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as DecodedToken;
    req.employeeCode = decoded.employeeCode;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ============================================================================
// ROUTES: AUTHENTICATION
// ============================================================================

// Verify Employee (for registration step 1)
app.get('/api/auth/verify-employee/:employeeCode', authLimiter, async (req: Request, res: Response) => {
  try {
    const employeeCode = String(req.params.employeeCode || '').trim();

    if (!employeeCode) {
      return res.status(400).json({ error: 'Employee code is required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { employeeCode } });
    if (existingUser) {
      return res.status(409).json({ error: 'Account already registered. Please login.' });
    }

    const employee = await lookupEmployee(employeeCode);
    if (!employee) {
      return res.status(404).json({ error: 'Employee code not found' });
    }

    return res.json({
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      branch: employee.branch,
      designation: employee.designation,
    });
  } catch (error: any) {
    console.error('Verify employee error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// Register
app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { employeeCode, password } = req.body;
    const code = String(employeeCode || '').trim();

    if (!code || !password) {
      return res.status(400).json({ error: 'Employee code and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await prisma.user.findUnique({ where: { employeeCode: code } });
    if (existingUser) {
      return res.status(409).json({ error: 'Account already registered. Please login.' });
    }

    const employee = await lookupEmployee(code);
    if (!employee) {
      return res.status(404).json({ error: 'Employee code not found' });
    }

    const { firstName, lastName } = parseEmployeeName(employee.employeeName);
    const hashedPassword = await bcrypt.hash(password, 10);
    const email = `${code}@staff.local`;

    const user = await prisma.user.create({
      data: {
        employeeCode: code,
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        branch: employee.branch,
        designation: employee.designation,
      },
    });

    await prisma.auditLog.create({
      data: {
        employeeCode: code,
        action: 'REGISTER',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        employeeCode: user.employeeCode,
        employeeName: employee.employeeName,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login
app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { employeeCode, password } = req.body;

    if (!employeeCode || !password) {
      return res.status(400).json({ error: 'Missing employee code or password' });
    }

    const user = await prisma.user.findUnique({ where: { employeeCode } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { employeeCode: user.employeeCode },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' },
    );

    const refreshToken = jwt.sign(
      { employeeCode: user.employeeCode },
      process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
      { expiresIn: '7d' },
    );

    await prisma.refreshToken.create({
      data: {
        employeeCode,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user.update({
      where: { employeeCode },
      data: { lastLoginAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        employeeCode,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: 'Login successful',
      accessToken,
      user: {
        employeeCode: user.employeeCode,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        branch: user.branch,
        designation: user.designation,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh Token
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
    ) as DecodedToken;

    const dbToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!dbToken || dbToken.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const newAccessToken = jwt.sign(
      { employeeCode: decoded.employeeCode },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' },
    );

    return res.json({ accessToken: newAccessToken });
  } catch {
    return res.status(401).json({ error: 'Token refresh failed' });
  }
});

// Logout
app.post('/api/auth/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeCode = req.employeeCode!;

    await prisma.refreshToken.deleteMany({ where: { employeeCode } });

    await prisma.auditLog.create({
      data: {
        employeeCode,
        action: 'LOGOUT',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.clearCookie('refreshToken');
    return res.json({ message: 'Logout successful' });
  } catch {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================================================
// ROUTES: PROTECTED - PROFILE & DASHBOARD
// ============================================================================

app.get('/api/profile', apiLimiter, authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { employeeCode: req.employeeCode! },
      select: {
        employeeCode: true,
        email: true,
        firstName: true,
        lastName: true,
        branch: true,
        designation: true,
        role: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.get('/api/dashboard/summary', apiLimiter, authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeCode = req.employeeCode!;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const records = await prisma.staffRecord.findMany({
      where: { employeeCode, date: { gte: thirtyDaysAgo } },
    });

    const totalRecords = await prisma.staffRecord.count({ where: { employeeCode } });

    return res.json({
      totalRecords,
      last30Days: records.length,
      visits: records.filter((r) => r.activityType === 'Visit').length,
      calls: records.filter((r) => r.activityType === 'Calls').length,
      newLeads: records.filter((r) => r.activityType === 'New Lead').length,
      warmProspects: records.filter((r) => r.profileOfCustomer === 'Warm').length,
      hotProspects: records.filter((r) => r.profileOfCustomer === 'Hot').length,
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

app.get('/api/dashboard/analytics', apiLimiter, authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeCode = req.employeeCode!;
    const records = await prisma.staffRecord.findMany({ where: { employeeCode } });

    const activityBreakdown = [
      { name: 'Visits', value: records.filter((r) => r.activityType === 'Visit').length },
      { name: 'Calls', value: records.filter((r) => r.activityType === 'Calls').length },
      { name: 'New Leads', value: records.filter((r) => r.activityType === 'New Lead').length },
    ];

    const leadSourceMap = new Map<string, number>();
    records.forEach((r) => leadSourceMap.set(r.leadSource, (leadSourceMap.get(r.leadSource) || 0) + 1));
    const leadSourceBreakdown = Array.from(leadSourceMap).map(([name, value]) => ({ name, value }));

    const customerTypeMap = new Map<string, number>();
    records.forEach((r) => customerTypeMap.set(r.typeOfCustomer, (customerTypeMap.get(r.typeOfCustomer) || 0) + 1));
    const customerTypeBreakdown = Array.from(customerTypeMap).map(([name, value]) => ({ name, value }));

    const timelineMap = new Map<string, number>();
    records.forEach((r) => {
      const dateStr = r.date.toISOString().split('T')[0];
      timelineMap.set(dateStr, (timelineMap.get(dateStr) || 0) + 1);
    });
    const timeline = Array.from(timelineMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, activities]) => ({ date, activities }));

    return res.json({ activityBreakdown, leadSourceBreakdown, customerTypeBreakdown, timeline });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/records', apiLimiter, authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeCode = req.employeeCode!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.staffRecord.findMany({
        where: { employeeCode },
        orderBy: { date: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.staffRecord.count({ where: { employeeCode } }),
    ]);

    return res.json({
      records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Records fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch records' });
  }
});

app.get('/api/records/export', apiLimiter, authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeCode = req.employeeCode!;
    const format = (req.query.format as string) || 'csv';

    const records = await prisma.staffRecord.findMany({
      where: { employeeCode },
      orderBy: { date: 'desc' },
    });

    await prisma.auditLog.create({
      data: {
        employeeCode,
        action: `EXPORT_${format.toUpperCase()}`,
        resourceType: 'StaffRecord',
        details: `Exported ${records.length} records`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    if (format === 'csv') {
      const Papa = require('papaparse');
      const csv = Papa.unparse(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="staff_records_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }

    if (format === 'excel') {
      const xlsx = require('xlsx');
      const ws = xlsx.utils.json_to_sheet(records);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Records');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="staff_records_${new Date().toISOString().split('T')[0]}.xlsx"`);
      return xlsx.write(wb, { type: 'stream', bookType: 'xlsx', stream: res });
    }

    return res.status(400).json({ error: 'Invalid export format' });
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Export failed' });
  }
});

// Admin: Refresh employee cache
app.post('/api/admin/refresh-employee-cache', authLimiter, async (req: Request, res: Response) => {
  try {
    googleSheetsService.clearCache();
    const employees = await googleSheetsService.getAllEmployees();
    
    return res.json({
      message: 'Employee cache refreshed',
      employeeCount: employees.length,
    });
  } catch (error: any) {
    console.error('Cache refresh error:', error);
    return res.status(500).json({ error: 'Failed to refresh cache' });
  }
});

// ============================================================================
// ROUTES: HEALTH CHECK
// ============================================================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================================================
// ERROR HANDLING & SERVER START
// ============================================================================

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 API health: http://localhost:${PORT}/api/health`);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

export default app;