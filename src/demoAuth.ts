// ⚠️ DEMO MODE: using hardcoded users (NO Firebase, NO backend)
// This file provides authentication using demo credentials stored in demoUsers.ts
// For production, replace with real Firebase Auth calls or backend API calls.

import { DEMO_ADMINS, DEMO_FACULTIES, DemoUser } from './demoUsers';

const STORAGE_KEY = 'edusync_demo_user';

export type UserRole = 'admin' | 'faculty';

export interface StoredUser {
  email: string;
  role: UserRole;
  department: string;
  name: string;
  erpId?: string;
}

/**
 * Login with email and password using demo credentials.
 * Checks against DEMO_ADMINS and DEMO_FACULTIES arrays.
 * On success, stores user in localStorage (without password).
 * On failure, throws an error.
 */
export async function loginWithEmailPassword(email: string, password: string): Promise<StoredUser> {
  // Check admin users
  const adminUser = DEMO_ADMINS.find(u => u.email === email && u.password === password);
  if (adminUser) {
    const stored = storeUser(adminUser);
    return stored;
  }

  // Check faculty users
  const facultyUser = DEMO_FACULTIES.find(u => u.email === email && u.password === password);
  if (facultyUser) {
    const stored = storeUser(facultyUser);
    return stored;
  }

  // No match found
  throw new Error('Invalid email or password');
}

/**
 * Get the current logged-in user from localStorage.
 * Returns null if no user is logged in.
 */
export function getCurrentUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

/**
 * Logout the current user by clearing localStorage.
 */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Store user in localStorage (without password).
 */
function storeUser(user: DemoUser): StoredUser {
  const stored: StoredUser = {
    email: user.email,
    role: user.role,
    department: user.department,
    name: user.name,
    erpId: user.erpId,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  return stored;
}

/**
 * Check if a user is logged in.
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Check if the current user is an admin.
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

/**
 * Check if the current user is faculty.
 */
export function isFaculty(): boolean {
  const user = getCurrentUser();
  return user?.role === 'faculty';
}
