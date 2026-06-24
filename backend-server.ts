// src/server.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Initialize
dotenv.config();
const app: Express = express();
const prisma = new PrismaClient();

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later'
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30 // 30 requests per minute
});

// ============================================================================
// AUTHENTICATION TYPES & UTILITIES
// ============================================================================

interface DecodedToken {
  employeeCode: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  employeeCode?: string;
  user?: any;
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as DecodedToken;
    req.employeeCode = decoded.employeeCode;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ============================================================================
// ROUTES: AUTHENTICATION
// ============================================================================

// Register
app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { employeeCode, email, password, firstName, lastName, branch, designation } = req.body;

    // Validation
    if (!employeeCode || !password || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeCode },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        employeeCode,
        email,
        passwordHash: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        branch: branch || '',
        designation: designation || ''
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        employeeCode,
        action: 'REGISTER',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        employeeCode: user.employeeCode,
        email: user.email
      }
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

    // Find user
    const user = await prisma.user.findUnique({
      where: { employeeCode }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const jwt = require('jsonwebtoken');
    const accessToken = jwt.sign(
      { employeeCode: user.employeeCode },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { employeeCode: user.employeeCode },
      process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
      { expiresIn: '7d' }
    );

    // Save refresh token in DB
    await prisma.refreshToken.create({
      data: {
        employeeCode,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Update last login
    await prisma.user.update({
      where: { employeeCode },
      data: { lastLoginAt: new Date() }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        employeeCode,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Set secure HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
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
        designation: user.designation
      }
    });
  } catch (error: any) {
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

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret'
    ) as DecodedToken;

    // Verify token exists in DB
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Issue new access token
    const newAccessToken = jwt.sign(
      { employeeCode: decoded.employeeCode },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );

    return res.json({ accessToken: newAccessToken });
  } catch (error: any) {
    return res.status(401).json({ error: 'Token refresh failed' });
  }
});

// Logout
app.post('/api/auth/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeCode = req.employeeCode!;
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    // Delete refresh token
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { employeeCode }
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        employeeCode,
        action: 'LOGOUT',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.clearCookie('refreshToken');
    return res.json({ message: 'Logout successful' });
  } catch (error) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================================================
// ROUTES: PROTECTED - DASHBOARD & DATA
// ============================================================================

app.use('/api/dashboard', apiLimiter, authMiddleware);
app.use('/api/records', apiLimiter, authMiddleware);
app.use('/api/profile', apiLimiter, authMiddleware);

// Get User Profile
app.get('/api/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeCode = req.employeeCode!;
    const user = await prisma.user.findUnique({
      where: { employeeCode },
      select: {
        employeeCode: true,
        email: true,
        firstName: true,
        lastName: true,
        branch: true,
        designation: true,
        role: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get Dashboard Summary
app.get('/api/dashboard/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeCode = req.employeeCode!;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Row-level security: only fetch this user's records
    const records = await prisma.staffRecord.findMany({
      where: {
        employeeCode,
        date: { gte: thirtyDaysAgo }
      }
    });

    const totalRecords = await prisma.staffRecord.count({
      where: { employeeCode }
    });

    const visitCount = records.filter(r => r.activityType === 'Visit').length;
    const callCount = records.filter(r => r.activityType === 'Calls').length;
    const newLeadCount = records.filter(r => r.activityType === 'New Lead').length;

    const summary = {
      totalRecords,
      last30Days: records.length,
      visits: visitCount,
      calls: callCount,
      newLeads: newLeadCount,
      warmProspects: records.filter(r => r.profileOfCustomer === 'Warm').length,
      hotProspects: records.filter(r => r.profileOfCustomer === 'Hot').length
    };

    return res.json(summary);
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// Get Analytics Data
app.get('/api/dashboard/analytics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeCode = req.employeeCode!;
    const records = await prisma.staffRecord.findMany({
      where: { employeeCode }
    });

    // Activity breakdown
    const activityBreakdown = [
      { name: 'Visits', value: records.filter(r => r.activityType === 'Visit').length },
      { name: 'Calls', value: records.filter(r => r.activityType === 'Calls').length },
      { name: 'New Leads', value: records.filter(r => r.activityType === 'New Lead').length }
    ];

    // Lead source breakdown
    const leadSourceMap = new Map<string, number>();
    records.forEach(r => {
      leadSourceMap.set(r.leadSource, (leadSourceMap.get(r.leadSource) || 0) + 1);
    });
    const leadSourceBreakdown = Array.from(leadSourceMap).map(([source, count]) => ({
      name: source,
      value: count
    }));

    // Customer type breakdown
    const customerTypeMap = new Map<string, number>();
    records.forEach(r => {
      customerTypeMap.set(r.typeOfCustomer, (customerTypeMap.get(r.typeOfCustomer) || 0) + 1);
    });
    const customerTypeBreakdown = Array.from(customerTypeMap).map(([type, count]) => ({
      name: type,
      value: count
    }));

    // Timeline (activities by date)
    const timelineMap = new Map<string, number>();
    records.forEach(r => {
      const dateStr = r.date.toISOString().split('T')[0];
      timelineMap.set(dateStr, (timelineMap.get(dateStr) || 0) + 1);
    });
    const timeline = Array.from(timelineMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, activities: count }));

    return res.json({
      activityBreakdown,
      leadSourceBreakdown,
      customerTypeBreakdown,
      timeline
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get Personal Records (Paginated)
app.get('/api/records', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeCode = req.employeeCode!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Row-level security
    const [records, total] = await Promise.all([
      prisma.staffRecord.findMany({
        where: { employeeCode },
        orderBy: { date: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.staffRecord.count({
        where: { employeeCode }
      })
    ]);

    return res.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Records fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Export Data (CSV/Excel)
app.get('/api/records/export', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeCode = req.employeeCode!;
    const format = (req.query.format as string) || 'csv';

    // Row-level security
    const records = await prisma.staffRecord.findMany({
      where: { employeeCode },
      orderBy: { date: 'desc' }
    });

    // Log export
    await prisma.auditLog.create({
      data: {
        employeeCode,
        action: `EXPORT_${format.toUpperCase()}`,
        resourceType: 'StaffRecord',
        details: `Exported ${records.length} records`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    if (format === 'csv') {
      // CSV export
      const Papa = require('papaparse');
      const csv = Papa.unparse(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="staff_records_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    } else if (format === 'excel') {
      // Excel export
      const xlsx = require('xlsx');
      const ws = xlsx.utils.json_to_sheet(records);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Records');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="staff_records_${new Date().toISOString().split('T')[0]}.xlsx"`);
      return xlsx.write(wb, { type: 'stream', stream: res });
    }

    return res.status(400).json({ error: 'Invalid export format' });
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Export failed' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================================================
// ERROR HANDLING & SERVER START
// ============================================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 API documentation: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

export default app;
