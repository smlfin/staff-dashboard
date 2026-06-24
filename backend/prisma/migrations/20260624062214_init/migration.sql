-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmployeeDirectory" (
    "employeeCode" TEXT NOT NULL PRIMARY KEY,
    "employeeName" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StaffRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL,
    "date" DATETIME NOT NULL,
    "branchName" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "typeOfCustomer" TEXT NOT NULL,
    "leadSource" TEXT NOT NULL,
    "howContacted" TEXT,
    "prospectName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT,
    "profession" TEXT,
    "dob" TEXT,
    "productInterested" TEXT NOT NULL,
    "remarks" TEXT,
    "nextFollowUpDate" DATETIME,
    "relationWithStaff" TEXT,
    "profileOfCustomer" TEXT,
    "averageMonthlyIncome" TEXT,
    "familyDetailsWife" TEXT,
    "familyDetailsJobWife" TEXT,
    "familyDetailsChildren" TEXT,
    "familyDetailsChildrenDetails" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_employeeCode_fkey" FOREIGN KEY ("employeeCode") REFERENCES "User" ("employeeCode") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_employeeCode_fkey" FOREIGN KEY ("employeeCode") REFERENCES "User" ("employeeCode") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_employeeCode_idx" ON "User"("employeeCode");

-- CreateIndex
CREATE INDEX "User_branch_idx" ON "User"("branch");

-- CreateIndex
CREATE INDEX "StaffRecord_employeeCode_idx" ON "StaffRecord"("employeeCode");

-- CreateIndex
CREATE INDEX "StaffRecord_date_idx" ON "StaffRecord"("date");

-- CreateIndex
CREATE INDEX "StaffRecord_branchName_idx" ON "StaffRecord"("branchName");

-- CreateIndex
CREATE INDEX "StaffRecord_activityType_idx" ON "StaffRecord"("activityType");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_employeeCode_idx" ON "RefreshToken"("employeeCode");

-- CreateIndex
CREATE INDEX "AuditLog_employeeCode_idx" ON "AuditLog"("employeeCode");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
