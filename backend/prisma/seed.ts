import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const employees = [
  { employeeCode: '1055', employeeName: 'Ullas A N', branch: 'Thodupuzha', designation: 'Manager' },
  { employeeCode: '4544', employeeName: 'John Doe', branch: 'Chengannur', designation: 'Executive' },
  { employeeCode: '1032', employeeName: 'Jane Smith', branch: 'Perumbavoor', designation: 'Officer' },
];

async function main() {
  for (const emp of employees) {
    await prisma.employeeDirectory.upsert({
      where: { employeeCode: emp.employeeCode },
      update: emp,
      create: emp,
    });
  }

  const sampleRecords = [
    {
      timestamp: new Date('2024-01-15T10:30:00'),
      date: new Date('2024-01-15'),
      branchName: 'Thodupuzha',
      employeeCode: '1055',
      employeeName: 'Ullas A N',
      designation: 'Manager',
      activityType: 'Visit',
      typeOfCustomer: 'New',
      leadSource: 'Relatives',
      prospectName: 'Ravi Kumar',
      phoneNumber: '+919876543210',
      productInterested: 'RD',
      profileOfCustomer: 'Warm',
      nextFollowUpDate: new Date('2024-02-15'),
    },
    {
      timestamp: new Date('2024-01-16T11:00:00'),
      date: new Date('2024-01-16'),
      branchName: 'Thodupuzha',
      employeeCode: '1055',
      employeeName: 'Ullas A N',
      designation: 'Manager',
      activityType: 'Calls',
      typeOfCustomer: 'Existing',
      leadSource: 'Customers',
      prospectName: 'Priya Menon',
      phoneNumber: '+919876543211',
      productInterested: 'FD',
      profileOfCustomer: 'Hot',
    },
    {
      timestamp: new Date('2024-01-17T09:00:00'),
      date: new Date('2024-01-17'),
      branchName: 'Thodupuzha',
      employeeCode: '1055',
      employeeName: 'Ullas A N',
      designation: 'Manager',
      activityType: 'New Lead',
      typeOfCustomer: 'New',
      leadSource: 'Friends',
      prospectName: 'Anil Thomas',
      phoneNumber: '+919876543212',
      productInterested: 'NCD',
      profileOfCustomer: 'Warm',
    },
  ];

  const existing = await prisma.staffRecord.count({ where: { employeeCode: '1055' } });
  if (existing === 0) {
    await prisma.staffRecord.createMany({ data: sampleRecords });
  }

  console.log('Seed completed:', employees.length, 'employees, sample records for 1055');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
