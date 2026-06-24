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
  const directoryEntry = await prisma.employeeDirectory.findUnique({
    where: { employeeCode },
  });

  if (directoryEntry) {
    return {
      employeeCode: directoryEntry.employeeCode,
      employeeName: directoryEntry.employeeName,
      branch: directoryEntry.branch,
      designation: directoryEntry.designation,
    };
  }

  const record = await prisma.staffRecord.findFirst({
    where: { employeeCode },
    orderBy: { date: 'desc' },
  });

  if (record) {
    return {
      employeeCode: record.employeeCode,
      employeeName: record.employeeName,
      branch: record.branchName,
      designation: record.designation,
    };
  }

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

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

export default app;
