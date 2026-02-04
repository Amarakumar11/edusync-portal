# EduSync Firebase Integration Setup

## 1. Create Firebase Project
- Go to https://console.firebase.google.com/
- Click "Add project" and follow the steps

## 2. Add Web App
- In your Firebase project, click "Add app" > Web
- Register app, copy config

## 3. Enable Services
- In Firebase Console:
  - Auth: Enable Email/Password and Phone (with reCAPTCHA)
  - Firestore: Create database (production or test mode)
  - Storage: Enable

## 4. Set Environment Variables
Create a `.env` file in your project root:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 5. Add Firestore Security Rules
- Copy `firestore.rules` to Firebase Console > Firestore > Rules

## 6. Install Dependencies
```
npm install firebase
```

## 7. Usage Example in React

```tsx
import { signupFaculty, loginFaculty, sendOtp, verifyOtp, logout } from './services/authService';
import { createFacultyProfile, createLeaveRequest, onAnnouncementsSnapshot } from './services/firestoreService';
import { uploadPdf } from './services/storageService';

// Signup
await signupFaculty({ name, email, phone, erpId, uid: '', role: 'faculty' }, password);

// Login
await loginFaculty(erpId, password);

// Send OTP
const recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier('recaptcha-container');
const confirmation = await sendOtp(phone, recaptchaVerifier);

// Verify OTP
await verifyOtp(confirmation, otp);

// Create faculty profile
await createFacultyProfile(profile);

// Create leave request
await createLeaveRequest(request);

// Listen to announcements
onAnnouncementsSnapshot(data => setAnnouncements(data));

// Upload PDF
const url = await uploadPdf(file, `notes/${file.name}`);
```

---

For any issues, see Firebase docs: https://firebase.google.com/docs/
