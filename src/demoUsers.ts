// ⚠️ THIS IS DEMO ONLY – DO NOT USE IN PRODUCTION
// Demo credentials are hardcoded here for testing purposes.
// These are NOT real users and should NEVER be used in production.
//
// Demo Credentials Table:
// ============================================================
// ADMIN USERS:
// | Email                    | Password     | Department  |
// |--------------------------|--------------|-------------|
// | hod.cse@edusync.com      | Admin@cse    | CSE         |
// | hod.cse_aiml@edusync.com | Admin@csm    | CSE_AIML    |
// | hod.cse_aids@edusync.com | Admin@aids   | CSE_AIDS    |
// | hod.cse_ds@edusync.com   | Admin@ds     | CSE_DS      |
// | hod.ece@edusync.com      | Admin@ece    | ECE         |
// | hod.hs@edusync.com       | Admin@hs     | HS          |
//
// FACULTY USERS:
// | Email                    | Password       | Department  | ERP ID  |
// |--------------------------|----------------|-------------|---------|
// | faculty1@edusync.com     | Faculty@cse    | CSE         | ERP001  |
// | faculty2@edusync.com     | Faculty@csm    | CSE_AIML    | ERP002  |
// | faculty3@edusync.com     | Faculty@aids   | CSE_AIDS    | ERP003  |
// | faculty4@edusync.com     | Faculty@ds     | CSE_DS      | ERP004  |
// | faculty5@edusync.com     | Faculty@ece    | ECE         | ERP005  |
// | faculty6@edusync.com     | Faculty@hs     | HS          | ERP006  |
// | faculty7@edusync.com     | Faculty@cse    | CSE         | ERP007  |
// | faculty8@edusync.com     | Faculty@csm    | CSE_AIML    | ERP008  |
// | faculty9@edusync.com     | Faculty@aids   | CSE_AIDS    | ERP009  |
// | faculty10@edusync.com    | Faculty@ds     | CSE_DS      | ERP010  |
// ============================================================

export type Department = 'CSE' | 'CSE_AIML' | 'CSE_AIDS' | 'CSE_DS' | 'ECE' | 'HS';

export const DEPARTMENTS: Department[] = ['CSE', 'CSE_AIML', 'CSE_AIDS', 'CSE_DS', 'ECE', 'HS'];

export interface DemoUser {
  email: string;
  password: string;
  role: 'admin' | 'faculty';
  department: Department;
  name: string;
  erpId?: string;
}

export const DEMO_ADMINS: DemoUser[] = [
  {
    email: 'hod.cse@edusync.com',
    password: 'Admin@cse',
    role: 'admin',
    department: 'CSE',
    name: 'HOD CSE',
  },
  {
    email: 'hod.cse_aiml@edusync.com',
    password: 'Admin@csm',
    role: 'admin',
    department: 'CSE_AIML',
    name: 'HOD CSE (AIML)',
  },
  {
    email: 'hod.cse_aids@edusync.com',
    password: 'Admin@aids',
    role: 'admin',
    department: 'CSE_AIDS',
    name: 'HOD CSE (AIDS)',
  },
  {
    email: 'hod.cse_ds@edusync.com',
    password: 'Admin@ds',
    role: 'admin',
    department: 'CSE_DS',
    name: 'HOD CSE (DS)',
  },
  {
    email: 'hod.ece@edusync.com',
    password: 'Admin@ece',
    role: 'admin',
    department: 'ECE',
    name: 'HOD ECE',
  },
  {
    email: 'hod.hs@edusync.com',
    password: 'Admin@hs',
    role: 'admin',
    department: 'HS',
    name: 'HOD HS',
  },
];

export const DEMO_FACULTIES: DemoUser[] = [
  {
    email: 'faculty1@edusync.com',
    password: 'Faculty@cse',
    role: 'faculty',
    department: 'CSE',
    name: 'Faculty One',
    erpId: 'ERP001',
  },
  {
    email: 'faculty2@edusync.com',
    password: 'Faculty@csm',
    role: 'faculty',
    department: 'CSE_AIML',
    name: 'Faculty Two',
    erpId: 'ERP002',
  },
  {
    email: 'faculty3@edusync.com',
    password: 'Faculty@aids',
    role: 'faculty',
    department: 'CSE_AIDS',
    name: 'Faculty Three',
    erpId: 'ERP003',
  },
  {
    email: 'faculty4@edusync.com',
    password: 'Faculty@ds',
    role: 'faculty',
    department: 'CSE_DS',
    name: 'Faculty Four',
    erpId: 'ERP004',
  },
  {
    email: 'faculty5@edusync.com',
    password: 'Faculty@ece',
    role: 'faculty',
    department: 'ECE',
    name: 'Faculty Five',
    erpId: 'ERP005',
  },
  {
    email: 'faculty6@edusync.com',
    password: 'Faculty@hs',
    role: 'faculty',
    department: 'HS',
    name: 'Faculty Six',
    erpId: 'ERP006',
  },
  {
    email: 'faculty7@edusync.com',
    password: 'Faculty@cse',
    role: 'faculty',
    department: 'CSE',
    name: 'Faculty Seven',
    erpId: 'ERP007',
  },
  {
    email: 'faculty8@edusync.com',
    password: 'Faculty@csm',
    role: 'faculty',
    department: 'CSE_AIML',
    name: 'Faculty Eight',
    erpId: 'ERP008',
  },
  {
    email: 'faculty9@edusync.com',
    password: 'Faculty@aids',
    role: 'faculty',
    department: 'CSE_AIDS',
    name: 'Faculty Nine',
    erpId: 'ERP009',
  },
  {
    email: 'faculty10@edusync.com',
    password: 'Faculty@ds',
    role: 'faculty',
    department: 'CSE_DS',
    name: 'Faculty Ten',
    erpId: 'ERP010',
  },
];
