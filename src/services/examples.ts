import { signupWithEmail, loginWithEmail, sendOtp, verifyOtp, logout } from '../services/authService';
import { createFacultyProfile, createLeaveRequest, updateLeaveRequestStatus, sendNotificationToUser, broadcastNotification, onAnnouncementsSnapshot } from '../services/firestoreService';
import { uploadPdf } from '../services/storageService';

// Signup with email
async function exampleSignup() {
  await signupWithEmail('john@edu.com', 'password123', 'John Doe');
}

// Login with email
async function exampleLogin() {
  await loginWithEmail('john@edu.com', 'password123');
}

// Send OTP
async function exampleSendOtp(phone: string, recaptchaVerifier: any) {
  const confirmation = await sendOtp(phone, recaptchaVerifier);
  // Save confirmation for verifyOtp
}

// Verify OTP
async function exampleVerifyOtp(confirmation: any, otp: string) {
  await verifyOtp(confirmation, otp);
}

// Logout
async function exampleLogout() {
  await logout();
}


// Create faculty profile
import { UserRole } from '../types/auth';
async function exampleCreateProfile() {
  const profile = { uid: 'uid123', name: 'John Doe', email: 'john@edu.com', phone: '+911234567890', erpId: 'ERP123', role: 'faculty' as UserRole };
  await createFacultyProfile(profile);
}

// Create leave request
import { LeaveRequest } from '../types/firestore';
async function exampleCreateLeaveRequest() {
  const request: LeaveRequest = { id: '', facultyId: 'uid123', reason: 'Sick', from: '2024-02-01', to: '2024-02-03', status: 'pending', createdAt: Date.now() };
  await createLeaveRequest(request);
}

// Approve/reject leave request
async function exampleApproveLeave(id: string) {
  await updateLeaveRequestStatus(id, 'approved');
}

// Send notification to one user
async function exampleSendNotification() {
  const notification = { id: '', message: 'Test notification', createdAt: Date.now(), read: false };
  await sendNotificationToUser(notification, 'uid123');
}

// Broadcast notification
async function exampleBroadcastNotification() {
  const notification = { id: '', message: 'Broadcast to all', createdAt: Date.now(), read: false };
  await broadcastNotification(notification);
}

// Upload PDF and save URL
async function exampleUploadPdf(file: File) {
  const url = await uploadPdf(file, `notes/${file.name}`);
  // Save url to Firestore as needed
}

// Real-time announcements
function exampleListenAnnouncements() {
  onAnnouncementsSnapshot(data => {
    console.log('Announcements:', data);
  });
}
