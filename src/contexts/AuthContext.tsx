import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserRole, LoginCredentials, SignUpData } from '@/types';

// Predefined admin credentials (in production, this would be in a secure backend)
const ADMIN_CREDENTIALS = {
  username: 'Admin User',
  email: 'admin@edusync.edu',
  phone: '+1234567890',
  erpId: 'ADMIN001',
  password: 'admin123',
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingOTP: boolean;
  pendingUser: User | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOTP: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock faculty database (in production, this would be Firebase)
const mockFacultyDB: Map<string, { user: User; password: string }> = new Map();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    pendingOTP: false,
    pendingUser: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('edusync_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setState(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
          isLoading: false,
        }));
      } catch {
        localStorage.removeItem('edusync_user');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (role === 'admin') {
      if (credentials.erpId === ADMIN_CREDENTIALS.erpId && credentials.password === ADMIN_CREDENTIALS.password) {
        const user: User = {
          id: 'admin-1',
          username: ADMIN_CREDENTIALS.username,
          email: ADMIN_CREDENTIALS.email,
          phone: ADMIN_CREDENTIALS.phone,
          erpId: ADMIN_CREDENTIALS.erpId,
          role: 'admin',
          createdAt: new Date(),
        };
        setState(prev => ({
          ...prev,
          isLoading: false,
          pendingOTP: true,
          pendingUser: user,
        }));
        return { success: true };
      }
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Invalid admin credentials' };
    }

    // Faculty login
    const facultyData = mockFacultyDB.get(credentials.erpId);
    if (facultyData && facultyData.password === credentials.password) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        pendingOTP: true,
        pendingUser: facultyData.user,
      }));
      return { success: true };
    }

    setState(prev => ({ ...prev, isLoading: false }));
    return { success: false, error: 'Invalid ERP ID or password' };
  }, []);

  const signup = useCallback(async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if ERP ID already exists
    if (mockFacultyDB.has(data.erpId)) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'ERP ID already registered' };
    }

    // Create new faculty user
    const newUser: User = {
      id: `faculty-${Date.now()}`,
      username: data.username,
      email: data.email,
      phone: data.phone,
      erpId: data.erpId,
      role: 'faculty',
      createdAt: new Date(),
    };

    mockFacultyDB.set(data.erpId, { user: newUser, password: data.password });

    setState(prev => ({ ...prev, isLoading: false }));
    return { success: true };
  }, []);

  const verifyOTP = useCallback(async (otp: string): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock OTP verification (accept any 6-digit code for demo)
    if (otp.length === 6 && /^\d+$/.test(otp)) {
      if (state.pendingUser) {
        localStorage.setItem('edusync_user', JSON.stringify(state.pendingUser));
        setState(prev => ({
          ...prev,
          user: prev.pendingUser,
          isAuthenticated: true,
          isLoading: false,
          pendingOTP: false,
          pendingUser: null,
        }));
        return { success: true };
      }
    }

    setState(prev => ({ ...prev, isLoading: false }));
    return { success: false, error: 'Invalid OTP. Please try again.' };
  }, [state.pendingUser]);

  const resendOTP = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('edusync_user');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      pendingOTP: false,
      pendingUser: null,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, verifyOTP, resendOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
