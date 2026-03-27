export type UserRole = 'hod' | 'faculty' | 'principal' | 'exam_branch';

export interface FacultyProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  erpId: string;
  role: UserRole;
}
