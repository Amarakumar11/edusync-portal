// User roles
type UserRole = 'admin' | 'faculty';

export interface FacultyProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  erpId: string;
  role: UserRole;
}

export interface Admin {
  uid: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface Timetable {
  id: string;
  facultyId: string;
  data: any; // Replace with your timetable structure
  createdAt: number;
}

export interface LeaveRequest {
  id: string;
  facultyId: string;
  reason: string;
  from: string;
  to: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  pdfUrl?: string;
}

export interface Notification {
  id: string;
  message: string;
  createdAt: number;
  read: boolean;
}

export interface Note {
  id: string;
  facultyId: string;
  content: string;
  createdAt: number;
}

export interface ExamSchedule {
  id: string;
  title: string;
  date: string;
  pdfUrl: string;
}
