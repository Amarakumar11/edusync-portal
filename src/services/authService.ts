import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

// Signup with Email/Password
export async function signupWithEmail(email: string, password: string, displayName?: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (auth.currentUser && displayName) {
    await updateProfile(auth.currentUser, { displayName });
  }
  return userCredential;
}

// Login with Email/Password
export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Placeholder: Send OTP (implement as needed)
export async function sendOtp(phone: string, appVerifier: any) {
  // Implement with Firebase Phone Auth if needed
  return Promise.resolve('otp-sent');
}

// Placeholder: Verify OTP (implement as needed)
export async function verifyOtp(confirmationResult: any, otp: string) {
  // Implement with Firebase Phone Auth if needed
  return Promise.resolve('otp-verified');
}

export async function logout() {
  return signOut(auth);
}
