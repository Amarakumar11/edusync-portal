// ⚠️ DEMO MODE: Data stored in localStorage, no backend, no Firebase

export type Department = 'CSE' | 'CSE_AIML' | 'CSE_AIDS' | 'CSE_DS' | 'ECE' | 'HS';

export interface LeaveRequest {
  id: string;
  facultyEmail: string;
  facultyName: string;
  facultyErpId: string;
  department: Department;
  reason: string;
  fromDate: string;
  toDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Notification {
  id: string;
  toRole: 'admin' | 'faculty';
  toDepartment: Department;
  toEmail?: string; // optional for faculty-specific
  message: string;
  createdAt: string;
  read: boolean;
}
