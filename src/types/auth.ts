export type UserRole = 'admin' | 'faculty';

export interface FacultyProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  erpId: string;
  role: UserRole;
}
