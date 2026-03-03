import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/firebase';

// ---- types ----
export type UserRole = 'hod' | 'faculty';
export type Department = 'CSE' | 'CSE_AIML' | 'CSE_AIDS' | 'CSE_DS' | 'ECE' | 'HS';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  erpId: string;
  role: UserRole;
  department: Department;
  createdAt: string;
  profileImage?: string;
}

interface AuthState {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingUser: AppUser | null;
  pendingOTP: boolean;
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyOTP: (otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOTP: () => Promise<{ success: boolean; error?: string }>;
}

export interface SignUpData {
  username: string;
  email: string;
  phone: string;
  erpId: string;
  password: string;
  department: Department;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(firebaseUser: FirebaseUser): Promise<AppUser | null> {
  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: firebaseUser.uid,
        name: data.name || firebaseUser.displayName || '',
        email: data.email || firebaseUser.email || '',
        phone: data.phone || '',
        erpId: data.erpId || '',
        role: (data.role as UserRole) || 'faculty',
        department: data.department || 'CSE',
        createdAt: data.createdAt || new Date().toISOString(),
        profileImage: data.profileImage,
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    isAuthenticated: false,
    isLoading: true,
    pendingUser: null,
    pendingOTP: false,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser);
        const otpVerified = sessionStorage.getItem('edusync_otp_verified') === 'true';

        if (otpVerified && profile) {
          setState({
            firebaseUser,
            user: profile,
            isAuthenticated: true,
            isLoading: false,
            pendingUser: null,
            pendingOTP: false,
          });
        } else if (profile) {
          setState({
            firebaseUser,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            pendingUser: profile,
            pendingOTP: true,
          });
        } else {
          setState({
            firebaseUser,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            pendingUser: null,
            pendingOTP: false,
          });
        }
      } else {
        sessionStorage.removeItem('edusync_otp_verified');
        setState({
          firebaseUser: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          pendingUser: null,
          pendingOTP: false,
        });
      }
    });
    return () => unsub();
  }, []);

  const login = useCallback(async (identifier: string, password: string, role: UserRole) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      let emailToLogin = identifier;

      if (role === 'faculty') {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('erpId', '==', identifier), where('role', '==', 'faculty'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return { success: false, error: 'Faculty with this ERP ID not found.' };
        }

        const userDoc = querySnapshot.docs[0];
        emailToLogin = userDoc.data().email;
      }

      const cred = await signInWithEmailAndPassword(auth, emailToLogin, password);
      const profile = await fetchUserProfile(cred.user);

      if (!profile) {
        await signOut(auth);
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: 'User profile not found. Please contact admin.' };
      }

      if (profile.role !== role) {
        await signOut(auth);
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: `Unauthorized access. Expected ${role} role.` };
      }

      // Start OTP Flow
      sessionStorage.removeItem('edusync_otp_verified');
      console.log(`Mock OTP sent to ${profile.phone}`);

      setState({
        firebaseUser: cred.user,
        user: null,
        pendingUser: profile,
        pendingOTP: true,
        isAuthenticated: false,
        isLoading: false,
      });
      return { success: true };
    } catch (err: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      const code = err?.code || '';
      let message = 'Login failed. Please try again.';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        message = 'Invalid credentials.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }
      return { success: false, error: message };
    }
  }, []);

  const verifyOTP = useCallback(async (otp: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      // Mock OTP Validation (Accept any 6 digits)
      if (otp.length === 6) {
        sessionStorage.setItem('edusync_otp_verified', 'true');
        setState((prev) => ({
          ...prev,
          user: prev.pendingUser,
          isAuthenticated: true,
          pendingOTP: false,
          pendingUser: null,
          isLoading: false,
        }));
        return { success: true };
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Invalid OTP' };
      }
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Error verifying OTP' };
    }
  }, []);

  const resendOTP = useCallback(async () => {
    try {
      console.log('Mock OTP Resent to pending user phone.');
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to resend OTP' };
    }
  }, []);

  const signup = useCallback(async (data: SignUpData) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('erpId', '==', data.erpId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: 'This ERP ID is already registered.' };
      }

      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.username });
      }

      const profile: AppUser = {
        uid: cred.user.uid,
        name: data.username,
        email: data.email,
        phone: data.phone,
        erpId: data.erpId,
        role: 'faculty',
        department: data.department,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), profile);

      await signOut(auth);

      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (err: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      const code = err?.code || '';
      let message = 'Signup failed. Please try again.';
      if (code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      }
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    sessionStorage.removeItem('edusync_otp_verified');
    setState({
      firebaseUser: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      pendingUser: null,
      pendingOTP: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, verifyOTP, resendOTP }}>
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
