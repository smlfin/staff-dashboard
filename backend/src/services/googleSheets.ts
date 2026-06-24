import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

interface EmployeeData {
  employeeCode: string;
  employeeName: string;
  branch: string;
  designation: string;
}

class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;
  private sheetName: string = 'Sheet1'; // Change if your sheet has different name
  private cache: Map<string, EmployeeData> = new Map();
  private cacheTimestamp: number = 0;
  private cacheDuration: number = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID || '1Za1CrlzzXpQjB3yZHjL2ZpRkjXgkVmLHH_LtXJq9K5o';
    this.sheets = google.sheets('v4');
  }

  /**
   * Get all employees from Google Sheet (with caching)
   */
  async getAllEmployees(): Promise<EmployeeData[]> {
    // Check cache validity
    const now = Date.now();
    if (this.cache.size > 0 && now - this.cacheTimestamp < this.cacheDuration) {
      console.log('📦 Returning cached employee data');
      return Array.from(this.cache.values());
    }

    try {
      console.log('🔄 Fetching employees from Google Sheet...');
      
      // Using public Google Sheet (no authentication needed)
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}?key=${process.env.GOOGLE_SHEETS_API_KEY}`
      );

      if (!response.ok) {
        console.error('❌ Failed to fetch from Google Sheets:', response.statusText);
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];

      // Clear cache
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
        if (!row[employeeCodeIndex]) continue; // Skip empty rows

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

  /**
   * Find employee by code
   */
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

  /**
   * Clear cache (useful for manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp = 0;
    console.log('🗑️ Employee cache cleared');
  }
}

// Singleton instance
export const googleSheetsService = new GoogleSheetsService();