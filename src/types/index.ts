// User Types
export type UserRole = 'admin' | 'faculty';

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  erpId: string;
  role: UserRole;
  createdAt: Date;
  profileImage?: string;
}

export interface AdminUser extends User {
  role: 'admin';
}

export interface FacultyUser extends User {
  role: 'faculty';
  department?: string;
  designation?: string;
}

// Auth Types
export interface LoginCredentials {
  erpId: string;
  password: string;
}

export interface SignUpData {
  username: string;
  email: string;
  phone: string;
  erpId: string;
  password: string;
}

export interface OTPVerification {
  phone: string;
  otp: string;
}

// Leave Types
export type LeaveType = 'casual' | 'paid' | 'sick';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveBalance {
  casual: number;
  paid: number;
  sick: number;
  total: number;
}

export interface LeaveRequest {
  id: string;
  facultyId: string;
  facultyName: string;
  leaveType: LeaveType;
  reason: string;
  startDate: Date;
  endDate: Date;
  status: LeaveStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Timetable Types
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  subject: string;
  section: string;
  room?: string;
}

export interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  slots: TimeSlot[];
}

export interface Timetable {
  id: string;
  userId: string;
  schedule: DaySchedule[];
  createdAt: Date;
  updatedAt: Date;
}

// Announcement Types
export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

// Event Types
export type EventStatus = 'upcoming' | 'current' | 'past';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  venue?: string;
  link?: string;
  pdfUrl?: string;
  status: EventStatus;
  createdBy: string;
  createdAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// Exam Types
export type ExamType = 'mids' | 'lab_internals' | 'semester' | 'placements';

export interface ExamSchedule {
  id: string;
  examType: ExamType;
  title: string;
  pdfUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Notes Types
export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  subItems?: NavItem[];
}
