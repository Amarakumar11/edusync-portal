export type Department = 'CSE' | 'CSE_AIML' | 'CSE_AIDS' | 'CSE_DS' | 'ECE' | 'HS';

export interface LeaveSwap {
  id: string;
  date: string;
  day: string;
  slot: string;
  subject: string;
  section: string;
  room: string;
  requestToEmail: string | null; // null means 'open to anyone'
  requestToName: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  acceptedByEmail: string | null;
  acceptedByName: string | null;
}

export interface LeaveRequest {
  id: string;
  facultyEmail: string;
  facultyName: string;
  facultyErpId: string;
  department: Department | string;
  type: 'casual' | 'paid' | 'sick';
  reason: string;
  fromDate: string;
  toDate: string;
  fromTime?: string;
  toTime?: string;
  durationInDays: number;
  swaps: LeaveSwap[];
  status: 'swaps_pending' | 'pending_hod' | 'pending_principal' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
}

export interface Notification {
  id: string;
  toRole: 'hod' | 'faculty';
  toDepartment: Department;
  toEmail?: string; // optional for faculty-specific
  message: string;
  createdAt: string;
  read: boolean;
}
