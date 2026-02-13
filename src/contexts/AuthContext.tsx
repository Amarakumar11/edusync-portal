import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';

// ---- types ----
export type UserRole = 'admin' | 'faculty';
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
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
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

/**
 * Fetch the user profile document from Firestore.
 * We first look in `users/{uid}`, which stores role, department, etc.
 */
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
        role: data.role || 'faculty',
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
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser);
        setState({
          firebaseUser,
          user: profile,
          isAuthenticated: !!profile,
          isLoading: false,
        });
      } else {
        setState({
          firebaseUser: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });
    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await fetchUserProfile(cred.user);
      if (!profile) {
        await signOut(auth);
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: 'User profile not found. Please contact admin.' };
      }
      setState({
        firebaseUser: cred.user,
        user: profile,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (err: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      const code = err?.code || '';
      let message = 'Login failed. Please try again.';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }
      return { success: false, error: message };
    }
  }, []);

  const signup = useCallback(async (data: SignUpData) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);

      // Update display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.username });
      }

      // Create Firestore user profile
      const profile: AppUser = {
        uid: cred.user.uid,
        name: data.username,
        email: data.email,
        phone: data.phone,
        erpId: data.erpId,
        role: 'faculty', // Signups are always faculty
        department: data.department,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), profile);

      // Sign out so user can log in themselves (or keep logged in if preferred)
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
    setState({
      firebaseUser: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
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
