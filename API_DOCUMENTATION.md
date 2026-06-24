# Staff Dashboard - API Documentation

## Base URL

```
Development: http://localhost:5000
Production: https://api.yourdomain.com
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <ACCESS_TOKEN>
```

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message here",
  "details": "Additional details (optional)"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `409` - Conflict (e.g., user already exists)
- `500` - Internal Server Error

---

## 🔓 Public Endpoints (No Auth Required)

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "employeeCode": "1055",
  "email": "ullas@company.com",
  "password": "SecurePassword123!",
  "firstName": "Ullas",
  "lastName": "A N",
  "branch": "Thodupuzha",
  "designation": "Manager"
}
```

**Validation Rules:**
- `employeeCode`: Required, unique, alphanumeric
- `email`: Required, unique, valid email format
- `password`: Required, min 8 chars, must contain uppercase, lowercase, and numbers
- `firstName`: Required, min 2 chars
- `lastName`: Required, min 2 chars
- `branch`: Required
- `designation`: Required

**Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "clm1h2x3k4l5m6n7o8p9q0r1s",
    "employeeCode": "1055",
    "email": "ullas@company.com"
  }
}
```

**Error Response (400/409):**
```json
{
  "error": "User already exists"
}
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "employeeCode": "1055",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "employeeCode": "1055",
    "email": "ullas@company.com",
    "firstName": "Ullas",
    "lastName": "A N",
    "branch": "Thodupuzha",
    "designation": "Manager"
  }
}
```

**Notes:**
- Access token expires in 15 minutes
- Refresh token sent in HTTP-only secure cookie
- Store access token in memory (not localStorage for security)

---

### 3. Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // optional, auto from cookie
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401):**
```json
{
  "error": "Invalid or expired refresh token"
}
```

---

## 🔐 Protected Endpoints (Auth Required)

All following endpoints require:
```
Authorization: Bearer <ACCESS_TOKEN>
```

### 4. Get User Profile

**Endpoint:** `GET /api/profile`

**Response (200):**
```json
{
  "employeeCode": "1055",
  "email": "ullas@company.com",
  "firstName": "Ullas",
  "lastName": "A N",
  "branch": "Thodupuzha",
  "designation": "Manager",
  "role": "staff",
  "lastLoginAt": "2024-01-15T10:30:00Z"
}
```

---

### 5. Get Dashboard Summary

**Endpoint:** `GET /api/dashboard/summary`

**Query Parameters:** None

**Response (200):**
```json
{
  "totalRecords": 127,
  "last30Days": 28,
  "visits": 15,
  "calls": 8,
  "newLeads": 5,
  "warmProspects": 12,
  "hotProspects": 3
}
```

**Notes:**
- Returns aggregated metrics for logged-in user only
- `totalRecords`: All records created by this user
- `last30Days`: Records created in last 30 days
- Prospect counts are from records in the system

---

### 6. Get Analytics Data

**Endpoint:** `GET /api/dashboard/analytics`

**Response (200):**
```json
{
  "activityBreakdown": [
    { "name": "Visits", "value": 45 },
    { "name": "Calls", "value": 28 },
    { "name": "New Leads", "value": 15 }
  ],
  "customerTypeBreakdown": [
    { "name": "New", "value": 40 },
    { "name": "Existing", "value": 48 }
  ],
  "leadSourceBreakdown": [
    { "name": "Relatives", "value": 25 },
    { "name": "Friends", "value": 18 },
    { "name": "Customers", "value": 32 },
    { "name": "Others", "value": 13 }
  ],
  "timeline": [
    { "date": "2024-01-01", "activities": 5 },
    { "date": "2024-01-02", "activities": 8 },
    { "date": "2024-01-03", "activities": 3 }
  ]
}
```

---

### 7. Get Personal Records (Paginated)

**Endpoint:** `GET /api/records`

**Query Parameters:**
```
page: int (default: 1)
limit: int (default: 20, max: 100)
```

**Example:**
```
GET /api/records?page=1&limit=20
```

**Response (200):**
```json
{
  "records": [
    {
      "id": "clm1h2x3k4l5m6n7o8p9q0r1s",
      "timestamp": "2024-01-15T10:30:00Z",
      "date": "2024-01-15T00:00:00Z",
      "branchName": "Thodupuzha",
      "employeeCode": "1055",
      "employeeName": "Ullas A N",
      "designation": "Manager",
      "activityType": "Visit",
      "typeOfCustomer": "New",
      "leadSource": "Relatives",
      "prospectName": "John Doe",
      "phoneNumber": "+919876543210",
      "address": "123 Main St, City",
      "profession": "Engineer",
      "dob": "1990-01-15",
      "productInterested": "RD",
      "remarks": "Interested in RD scheme",
      "nextFollowUpDate": "2024-02-15T00:00:00Z",
      "relationWithStaff": "Relative",
      "profileOfCustomer": "Warm",
      "averageMonthlyIncome": "50000-75000",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 127,
    "pages": 7
  }
}
```

**Row-Level Security:**
- Users see only their own records (filtered by employeeCode)
- Cannot view other users' data even with valid token

---

### 8. Export Data

**Endpoint:** `GET /api/records/export`

**Query Parameters:**
```
format: csv | excel (required)
```

**Examples:**
```
GET /api/records/export?format=csv
GET /api/records/export?format=excel
```

**Response (200):**
- `CSV`: `text/csv` - Downloads `staff_records_YYYY-MM-DD.csv`
- `EXCEL`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` - Downloads `staff_records_YYYY-MM-DD.xlsx`

**Notes:**
- Contains all user's records (all pages)
- Exports are logged in audit trail
- Data is sorted by date (newest first)

---

### 9. Logout

**Endpoint:** `POST /api/auth/logout`

**Request Body:** (Empty)

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

**Notes:**
- Invalidates all refresh tokens for the user
- Clears HTTP-only cookie on frontend
- User must log in again to access protected endpoints

---

## 📊 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/register` | 5 req | 15 min |
| `/api/auth/login` | 5 req | 15 min |
| Other protected routes | 30 req | 1 min |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1642254900
```

**When limit exceeded (429):**
```json
{
  "error": "Too many requests, please try again later"
}
```

---

## 🔍 Field Definitions

### Activity Type
- `Visit` - In-person visit to prospect
- `Calls` - Phone call to prospect
- `New Lead` - New prospect identified
- `Reference` - Referral-based follow-up

### Type of Customer
- `New` - First-time prospect
- `Existing` - Current/returning customer

### Lead Source
- `Relatives` - Family referral
- `Friends` - Friend referral
- `Customers` - Existing customer referral
- `Others` - Other sources

### Profile of Customer
- `Warm` - Interested, likely to convert
- `Hot` - Very interested, conversion expected
- `Cold` - Showing little interest

### Products
- `RD` - Recurring Deposit
- `FD` - Fixed Deposit
- `Sangeeth FD` - Sangeeth Fixed Deposit
- `Sub Debt` - Subordinate Debt
- `NCD` - Non-Convertible Debenture

---

## 🚀 Usage Examples

### cURL Examples

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeCode":"1055",
    "email":"ullas@company.com",
    "password":"SecurePassword123!",
    "firstName":"Ullas",
    "lastName":"A N",
    "branch":"Thodupuzha",
    "designation":"Manager"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employeeCode":"1055","password":"SecurePassword123!"}'
```

**Get Dashboard Summary:**
```bash
curl -X GET http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Export CSV:**
```bash
curl -X GET "http://localhost:5000/api/records/export?format=csv" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o records.csv
```

---

## 📝 Audit Logging

All protected actions are logged:

- `LOGIN` - User login
- `LOGOUT` - User logout
- `EXPORT_CSV` - CSV export
- `EXPORT_EXCEL` - Excel export
- `VIEW_DASHBOARD` - Dashboard access

Logs include:
- Timestamp
- User (employeeCode)
- Action
- IP address
- User agent

---

## 🔐 Security Notes

1. **Tokens:** Access tokens expire in 15 minutes. Use refresh token to get new access token.
2. **HTTPS:** Always use HTTPS in production.
3. **CORS:** Frontend origin must be whitelisted in backend.
4. **Passwords:** Never send passwords in URL or log responses.
5. **Sensitive Data:** Personal information is protected by row-level security.
6. **Rate Limiting:** Brute force attacks are mitigated by auth rate limits.

---

## Support

For issues or questions about the API:
1. Check error messages and HTTP status codes
2. Review API logs: `npm run dev` output
3. Verify credentials and tokens
4. Check network requests in browser DevTools
