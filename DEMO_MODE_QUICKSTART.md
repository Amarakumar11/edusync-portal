# EduSync Demo Mode - Quick Start Guide

## ⚠️ DEMO MODE ONLY – DO NOT USE IN PRODUCTION

This app is configured to work completely offline using hardcoded demo credentials. No Firebase, no backend, no OTP verification.

---

## Quick Test

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Test Admin Login
- Go to: http://localhost:5173/login/admin
- Email: `hod.cse@edusync.com`
- Password: `Admin@123`
- Click "Login"
- **Expected**: Redirects to `/admin` dashboard

### 3. Test Faculty Login
- Go to: http://localhost:5173/login/faculty
- Email: `faculty1@edusync.com`
- Password: `Faculty@123`
- Click "Login"
- **Expected**: Redirects to `/faculty` dashboard

### 4. Test Route Protection
- Logged in as faculty? Try going to `/admin`
- **Expected**: Redirected back to `/faculty`

- Logged in as admin? Try going to `/faculty`
- **Expected**: Redirected back to `/admin`

- Not logged in? Try accessing `/admin` or `/faculty`
- **Expected**: Redirected to login page

### 5. Test Logout
- Click logout button in the dashboard
- **Expected**: Redirected to login, localStorage cleared

---

## All Demo Credentials

### Admin Users (all password: `Admin@123`)
| Email | Department |
|-------|-----------|
| hod.cse@edusync.com | CSE |
| hod.cse_aiml@edusync.com | CSE_AIML |
| hod.cse_aids@edusync.com | CSE_AIDS |
| hod.cse_ds@edusync.com | CSE_DS |
| hod.ece@edusync.com | ECE |
| hod.hs@edusync.com | HS |

### Faculty Users (all password: `Faculty@123`)
| Email | ERP ID | Department |
|-------|--------|-----------|
| faculty1@edusync.com | ERP001 | CSE |
| faculty2@edusync.com | ERP002 | CSE_AIML |
| faculty3@edusync.com | ERP003 | CSE_AIDS |
| faculty4@edusync.com | ERP004 | CSE_DS |
| faculty5@edusync.com | ERP005 | ECE |
| faculty6@edusync.com | ERP006 | HS |
| faculty7@edusync.com | ERP007 | CSE |
| faculty8@edusync.com | ERP008 | CSE_AIML |
| faculty9@edusync.com | ERP009 | CSE_AIDS |
| faculty10@edusync.com | ERP010 | CSE_DS |

---

## Files Created/Modified

### Created:
- `src/demoUsers.ts` - Demo user credentials
- `src/demoAuth.ts` - Demo auth functions (no Firebase)
- `DEMO_MODE_GUIDE.md` - Detailed setup guide

### Modified:
- `src/pages/auth/LoginPage.tsx` - Uses demo auth instead of Firebase
- `src/components/auth/ProtectedRoute.tsx` - Uses demo auth for route protection

---

## How It Works

1. **Login**: User enters email + password
2. **Validation**: Checked against DEMO_ADMINS or DEMO_FACULTIES arrays
3. **Storage**: User data (without password) stored in browser localStorage
4. **Redirect**: User redirected to `/admin` or `/faculty` based on role
5. **Protection**: Routes check getCurrentUser() from localStorage
6. **Logout**: localStorage cleared, user redirected to login

---

## Switching to Firebase (Later)

When ready for production:

1. Replace `src/demoAuth.ts` with real Firebase Auth calls
2. Update `src/pages/auth/LoginPage.tsx` to use Firebase
3. Update `src/components/auth/ProtectedRoute.tsx` to use Firebase Auth context
4. Delete `src/demoUsers.ts` and `src/demoAuth.ts`
5. Set up Firebase .env variables
6. Deploy

Firebase code (`src/firebase.ts`, `src/services/`) is already in place and ready to use.

---

## Features

✅ Works completely offline
✅ No Firebase required
✅ No backend API required
✅ Email-based login
✅ Role-based routing (admin/faculty)
✅ Route protection (guards)
✅ localStorage persistence
✅ Clean error messages
✅ TypeScript throughout
✅ Demo credentials NOT shown in UI
✅ Easy to switch to Firebase later

---

## Test Scenarios

### Scenario 1: Admin Login Flow
1. Go to /login/admin
2. Enter admin email + password
3. Click login
4. See admin dashboard
5. Click logout
6. Verify redirected to login page

### Scenario 2: Faculty Login Flow
1. Go to /login/faculty
2. Enter faculty email + password
3. Click login
4. See faculty dashboard
5. Check localStorage (DevTools) - should have user data

### Scenario 3: Route Protection
1. Log in as faculty
2. Manually go to /admin
3. Should be redirected to /faculty

### Scenario 4: Wrong Role
1. Go to /login/admin
2. Try to login with a faculty email
3. Should see error: "This account is not an admin account"

---

## Notes

- All data is stored in browser localStorage
- Refreshing the page keeps you logged in (until logout)
- Different browser/tab has separate localStorage
- DevTools > Application > Local Storage to view stored user data
- No network requests to Firebase or backend
- All auth happens synchronously

---

**Ready to test? Run `npm run dev` and go to http://localhost:5173/login/admin!**
