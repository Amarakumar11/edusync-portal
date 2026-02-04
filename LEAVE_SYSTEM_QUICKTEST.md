// ⚠️ DEMO MODE: Data stored in localStorage, no backend, no Firebase

# 🚀 Leave System - Quick Test Guide

## Start Dev Server
```bash
npm run dev
```
Then open http://localhost:5173

---

## Test Scenario 1: Simple Approval Flow (5 min)

### Step 1: Faculty Apply for Leave
1. Go to http://localhost:5173/login/faculty
2. Email: `faculty1@edusync.com`
3. Password: `Faculty@123`
4. Click "Apply for Leave" in navbar
5. Fill form:
   - From Date: **2026-02-10**
   - To Date: **2026-02-12**
   - Reason: **Medical emergency**
6. Click "Submit Request"
7. Should see: ✓ "Leave request sent to HOD"

### Step 2: Admin Reviews Request
1. Open new tab, go to http://localhost:5173/login/admin
2. Email: `hod.cse@edusync.com`
3. Password: `Admin@cse`
4. Click "Leave Requests" in navbar
5. Should see a table with:
   - Faculty Name: **Faculty One**
   - ERP ID: **ERP001**
   - Dates: **2026-02-10 to 2026-02-12**
   - Status: **Pending (Yellow)**
6. Click "Approve"
7. Should see: ✓ "Leave request approved for Faculty One"

### Step 3: Faculty Receives Notification
1. Switch to faculty tab (faculty1@edusync.com logged in)
2. Click "Notifications" in navbar
3. Should see:
   - New badge (blue)
   - Message: "Your leave request has been approved by HOD (CSE)"
4. Click "Mark as read"
5. Badge disappears, notification dims

---

## Test Scenario 2: Rejection Flow (3 min)

### Step 1: Faculty Apply
1. Login as `faculty2@edusync.com` (CSE_AIML) / `Faculty@123`
2. Go to "Apply for Leave"
3. Fill form:
   - From: **2026-03-01**
   - To: **2026-03-03**
   - Reason: **Personal work**
4. Submit

### Step 2: Admin Reject
1. Login as `hod.cse_aiml@edusync.com` / `Admin@csm`
2. Go to "Leave Requests"
3. Find **Faculty Two**'s request
4. Click "Reject"
5. Confirm toast: ✓ "Leave request rejected for Faculty Two"

### Step 3: Faculty Sees Rejection
1. Switch to faculty2 tab
2. Go to "Notifications"
3. See: **"Your leave request has been rejected by HOD (CSE_AIML)"**

---

## Test Scenario 3: Department Isolation (2 min)

### Goal: Verify ECE HOD doesn't see CSE leaves

### Step 1: Create CSE Leave
1. Login as `faculty1@edusync.com` (CSE) / `Faculty@123`
2. Apply for leave (any dates)
3. Logout

### Step 2: Check ECE HOD
1. Login as `hod.ece@edusync.com` / `Admin@ece`
2. Go to "Leave Requests"
3. **Should see**: "No pending requests" (CSE leave NOT visible)
4. This is correct! ✓

### Step 3: Check CSE HOD
1. Logout, login as `hod.cse@edusync.com` / `Admin@cse`
2. Go to "Leave Requests"
3. **Should see**: Faculty One's CSE leave request ✓

---

## Test Scenario 4: Multiple Leaves (3 min)

### Create multiple leaves from different departments
1. Login as `faculty3@edusync.com` (CSE_AIDS) → Apply leave → Logout
2. Login as `faculty4@edusync.com` (CSE_DS) → Apply leave → Logout
3. Login as `faculty5@edusync.com` (ECE) → Apply leave → Logout

### Check CSE HOD sees only CSE leaves
1. Login as `hod.cse@edusync.com`
2. Go to "Leave Requests"
3. Should see **ONLY** leaves from `faculty1` and `faculty7` (both CSE)
4. Should **NOT** see leaves from faculty3, faculty4, faculty5

### Check each department HOD
- `hod.cse_aiml@edusync.com` → sees only faculty2 (CSE_AIML)
- `hod.cse_aids@edusync.com` → sees only faculty3 (CSE_AIDS)
- `hod.cse_ds@edusync.com` → sees only faculty4 (CSE_DS)
- `hod.ece@edusync.com` → sees only faculty5 (ECE)

---

## Test Scenario 5: Check Admin Notifications (2 min)

### Step 1: Faculty applies leave
1. Login as `faculty6@edusync.com` (HS) → Apply leave → Logout

### Step 2: HOD checks notifications
1. Login as `hod.hs@edusync.com` / `Admin@`
2. Go to "Notifications"
3. Should see: **"New leave request from Faculty Six (ERP006) from [dates]"**
4. Notification is from `HS` department
5. Created automatically when faculty submitted

---

## Demo Credentials Quick Reference

### CSE Department
| Role | Email | Password |
|------|-------|----------|
| HOD | hod.cse@edusync.com | Admin@cse |
| Faculty 1 | faculty1@edusync.com | Faculty@123 |
| Faculty 7 | faculty7@edusync.com | Faculty@123 |

### CSE_AIML Department
| Role | Email | Password |
|------|-------|----------|
| HOD | hod.cse_aiml@edusync.com | Admin@csm |
| Faculty 2 | faculty2@edusync.com | Faculty@123 |
| Faculty 8 | faculty8@edusync.com | Faculty@123 |

### CSE_AIDS Department
| Role | Email | Password |
|------|-------|----------|
| HOD | hod.cse_aids@edusync.com | Admin@aids |
| Faculty 3 | faculty3@edusync.com | Faculty@123 |
| Faculty 9 | faculty9@edusync.com | Faculty@123 |

### CSE_DS Department
| Role | Email | Password |
|------|-------|----------|
| HOD | hod.cse_ds@edusync.com | Admin@ds |
| Faculty 4 | faculty4@edusync.com | Faculty@123 |
| Faculty 10 | faculty10@edusync.com | Faculty@123 |

### ECE Department
| Role | Email | Password |
|------|-------|----------|
| HOD | hod.ece@edusync.com | Admin@ece |
| Faculty 5 | faculty5@edusync.com | Faculty@123 |

### HS Department
| Role | Email | Password |
|------|-------|----------|
| HOD | hod.hs@edusync.com | Admin@ |
| Faculty 6 | faculty6@edusync.com | Faculty@123 |

---

## ✨ What to Test

- [x] Faculty can apply for leave
- [x] Leave request stored in localStorage
- [x] HOD sees department-filtered leaves only
- [x] HOD can approve leave
- [x] Faculty gets approval notification
- [x] HOD can reject leave
- [x] Faculty gets rejection notification
- [x] Admin sees notifications of new leave requests
- [x] Status badges show correct colors (pending=yellow, approved=green, rejected=red)
- [x] Empty states show when no data
- [x] Dates validate (from < to)
- [x] Redirects work correctly (/faculty/apply-leave → success → /faculty/leave-history)

---

## 🐛 Debugging

### Check localStorage in browser console
```javascript
// View all leave requests
JSON.parse(localStorage.getItem('edusync_leave_requests'))

// View all notifications
JSON.parse(localStorage.getItem('edusync_notifications'))

// Clear all data (reset everything)
localStorage.clear()
```

### Check Network (should be empty - no API calls)
- Open DevTools → Network tab
- Apply leave → Should see NO fetch/XHR requests ✓
- This is correct (demo mode - no backend)

### Check Console
- Should see NO errors
- Department filters logged for debugging

---

## 📸 Expected UI

### Faculty Apply Leave Page
```
┌─────────────────────────────────────┐
│  Apply for Leave                    │
│  Submit your leave request to HOD   │
├─────────────────────────────────────┤
│  Leave Request Form                 │
│  Department: CSE                    │
├─────────────────────────────────────┤
│ From Date: [2026-02-10]             │
│ To Date: [2026-02-12]               │
│                                     │
│ Reason:                             │
│ [Medical emergency...]              │
│                                     │
│ [Submit Request] [Cancel]           │
└─────────────────────────────────────┘
```

### Admin Leave Requests
```
┌─────────────────────────────────────────┐
│ Leave Requests                          │
│ Manage leave requests for CSE Dept      │
├─────────────────────────────────────────┤
│ Pending Requests (1)                    │
├─────────────────────────────────────────┤
│ Faculty Name │ ERP ID │ Dates │ Reason │
│──────────────────────────────────────────
│ Faculty One  │ ERP001 │ dates │ reason │
│              │        │ [Approve][Reject]
│──────────────────────────────────────────
```

### Notifications
```
┌──────────────────────────────────────┐
│ ⓘ Your leave request has been       │
│   approved by HOD (CSE)         [New]│
│ 5 minutes ago                        │
├──────────────────────────────────────┤
│ [Mark as read]                       │
└──────────────────────────────────────┘
```

---

## 🎯 Success Criteria

✅ **All test scenarios pass** → Leave system ready
✅ **No console errors** → TypeScript correct
✅ **Status updates instantly** → localStorage works
✅ **Department filtering works** → Admins isolated
✅ **Notifications appear** → System integrated
✅ **UI is clean** → Good UX

---

## Need Help?

Check [LEAVE_SYSTEM_GUIDE.md](LEAVE_SYSTEM_GUIDE.md) for detailed API reference
