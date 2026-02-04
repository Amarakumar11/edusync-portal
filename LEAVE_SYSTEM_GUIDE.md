// ⚠️ DEMO MODE: Department-wise Leave Request & Notification System
// This is a fully functional demo-mode implementation with localStorage persistence

# 🎯 Leave Request & Notification System - Implementation Guide

## Overview
A complete department-wise leave request and notification system for EduSync. Features:
- **Faculty**: Apply for leave, receive notifications
- **Admin (HOD)**: Review and approve/reject leave requests, view department notifications
- **Department-specific filtering**: Admins only see their department's requests
- **Persistence**: All data stored in localStorage (no backend required)

---

## 📁 File Structure

### Data Models & Types
- `src/types/leave.ts` - LeaveRequest and Notification TypeScript interfaces

### Services (localStorage operations)
- `src/services/leaveService.ts` - Leave request CRUD operations
- `src/services/notificationService.ts` - Notification management

### UI Components (Reusable)
- `src/components/dashboard/StatusBadge.tsx` - Status badge (pending/approved/rejected)
- `src/components/dashboard/EmptyState.tsx` - Empty state component

### Faculty Pages
- `src/pages/faculty/ApplyLeavePage.tsx` - Leave request form
- `src/pages/faculty/NotificationsPage.tsx` - Receive notifications from HOD

### Admin Pages
- `src/pages/admin/LeaveRequestsPage.tsx` - Manage department leave requests
- `src/pages/admin/NotificationsPage.tsx` - View department notifications

### Routes (in App.tsx)
```
Faculty:
  /faculty/apply-leave      → Leave request form
  /faculty/notifications    → Notifications from HOD

Admin:
  /admin/leave-requests     → Manage leave requests (department-filtered)
  /admin/notifications      → Department notifications
```

---

## 🔄 Data Flow Diagram

### Faculty Apply Leave Flow
```
Faculty fills form (dates, reason)
       ↓
Creates LeaveRequest (status: pending)
       ↓
Creates Notification for HOD
       ↓
Saves both to localStorage
       ↓
Shows success toast → Redirects to leave-history
```

### Admin Approve/Reject Flow
```
Admin views pending requests (department-filtered)
       ↓
Admin clicks Approve/Reject button
       ↓
Updates LeaveRequest status
       ↓
Creates Notification for Faculty (approval/rejection)
       ↓
Updates localStorage
       ↓
Shows success toast
```

---

## 📊 Data Models

### LeaveRequest
```typescript
interface LeaveRequest {
  id: string;                      // Unique ID
  facultyEmail: string;            // Faculty email
  facultyName: string;             // Faculty name
  facultyErpId: string;            // Faculty ERP ID
  department: Department;          // CSE | CSE_AIML | CSE_AIDS | CSE_DS | ECE | HS
  reason: string;                  // Leave reason
  fromDate: string;                // YYYY-MM-DD format
  toDate: string;                  // YYYY-MM-DD format
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;               // ISO timestamp
}
```

### Notification
```typescript
interface Notification {
  id: string;                      // Unique ID
  toRole: 'admin' | 'faculty';     // Target role
  toDepartment: Department;        // Target department
  toEmail?: string;                // Faculty email (for faculty-specific notifs)
  message: string;                 // Notification message
  createdAt: string;               // ISO timestamp
  read: boolean;                   // Read status
}
```

---

## 🛠️ Service Functions

### Leave Service (`src/services/leaveService.ts`)

#### Create Leave Request
```typescript
createLeaveRequest(
  facultyEmail: string,
  facultyName: string,
  facultyErpId: string,
  department: string,
  reason: string,
  fromDate: string,
  toDate: string
): LeaveRequest
```

#### Get Leave Requests by Department
```typescript
getLeaveRequestsByDepartment(department: string): LeaveRequest[]
```

#### Update Status
```typescript
updateLeaveRequestStatus(leaveId: string, status: 'approved' | 'rejected'): LeaveRequest | null
```

### Notification Service (`src/services/notificationService.ts`)

#### Create Notification
```typescript
createNotification(
  toRole: 'admin' | 'faculty',
  toDepartment: string,
  message: string,
  toEmail?: string
): Notification
```

#### Get Faculty Notifications
```typescript
getFacultyNotifications(email: string): Notification[]
```

#### Get Admin Notifications
```typescript
getAdminNotifications(department: string): Notification[]
```

#### Mark as Read
```typescript
markNotificationAsRead(notificationId: string): Notification | null
```

---

## 🧪 Test Scenarios

### Scenario 1: CSE Faculty Apply → CSE HOD Approve
```
1. Login as faculty1@edusync.com (Faculty@123) → Department: CSE
2. Go to /faculty/apply-leave
3. Fill form: fromDate=2026-02-10, toDate=2026-02-15, reason="Medical"
4. Submit → Toast: "Leave request sent to HOD"
5. Login as hod.cse@edusync.com (Admin@cse) → /admin/leave-requests
6. See "Faculty One (ERP001)" with pending status
7. Click "Approve"
8. Toast: "Leave request approved for Faculty One"
9. Notification created and sent
10. Login back as faculty1@edusync.com → /faculty/notifications
11. See: "Your leave request has been approved by HOD (CSE)"
```

### Scenario 2: CSE Faculty → ECE HOD Should NOT See It
```
1. Login as faculty1@edusync.com (CSE) → Apply leave
2. Login as hod.ece@edusync.com (ECE Admin) → /admin/leave-requests
3. See: "No pending requests" (CSE requests not visible)
4. Login as hod.cse@edusync.com (CSE Admin)
5. See: Faculty's CSE request (department-filtered)
```

### Scenario 3: Multiple Departments
```
1. faculty1@edusync.com (CSE) applies leave
2. faculty2@edusync.com (CSE_AIML) applies leave
3. hod.cse@edusync.com sees only CSE requests
4. hod.cse_aiml@edusync.com sees only CSE_AIML requests
```

### Scenario 4: Rejection Flow
```
1. CSE Faculty applies leave
2. CSE HOD rejects it
3. Status changes to "rejected"
4. Notification: "Your leave request has been rejected by HOD (CSE)"
5. Faculty sees rejected status in notifications
```

---

## 🎨 UI Features

### Status Badges
- **Pending**: Yellow background
- **Approved**: Green background
- **Rejected**: Red background

### Leave Requests Table (Admin)
Columns: Faculty Name | ERP ID | From Date | To Date | Reason | Actions
- Shows ONLY pending requests first
- Approve/Reject buttons for pending only
- Resolved requests shown in separate section

### Notifications UI
- Card-based layout
- "New" badge for unread
- "Mark as read" button for unread notifications
- Empty state when no notifications
- Sorted by newest first

---

## 📝 localStorage Keys

```typescript
LEAVE_STORAGE_KEY = 'edusync_leave_requests'      // Array<LeaveRequest>
NOTIFICATION_STORAGE_KEY = 'edusync_notifications' // Array<Notification>
```

To clear all data (debug):
```javascript
localStorage.removeItem('edusync_leave_requests');
localStorage.removeItem('edusync_notifications');
```

---

## 🔐 Route Protection

All routes are protected by role:
```typescript
// Faculty routes - Only accessible with role: 'faculty'
/faculty/apply-leave
/faculty/notifications

// Admin routes - Only accessible with role: 'admin'
/admin/leave-requests
/admin/notifications
```

Accessing wrong route → Redirects to login

---

## ✨ Key Features

✅ **Department-Specific Filtering**: Admins only see their department's data
✅ **Real-time Status Updates**: Approve/reject immediately reflected
✅ **Notification System**: Automatic notifications on actions
✅ **TypeScript Throughout**: Full type safety
✅ **Persistent Storage**: localStorage keeps data across sessions
✅ **Clean UI**: Reusable components (StatusBadge, EmptyState)
✅ **Input Validation**: Date validation, required fields
✅ **Error Handling**: Toast notifications for errors
✅ **Empty States**: User-friendly messages when no data

---

## 🚀 Future Enhancements

- Export leave requests to PDF/CSV
- Email notifications (when backend ready)
- Bulk actions (approve multiple)
- Leave balance tracking
- Recurring leave patterns
- Calendar view for leave dates
- Comments on rejections
- Admin dashboard analytics

---

## ⚠️ Demo Mode Notes

- No backend/Firebase integration
- All data persists only in browser localStorage
- Shared localStorage across tabs (real-time sync not implemented)
- No server-side validation
- No email notifications

---

## 🔍 Troubleshooting

### Leave requests not showing?
- Check localStorage: `localStorage.getItem('edusync_leave_requests')`
- Ensure logged in as correct department
- Clear browser cache and refresh

### Notifications not appearing?
- Check: `localStorage.getItem('edusync_notifications')`
- Ensure correct user email when filtering faculty notifications

### Build errors?
- Run: `npm install` to ensure dependencies
- Clear: `rm -rf node_modules && npm install` (if issues persist)

---

## 📞 Demo Credentials

### CSE Department
- **HOD**: hod.cse@edusync.com / Admin@cse
- **Faculty 1**: faculty1@edusync.com / Faculty@123 (ERP001)
- **Faculty 7**: faculty7@edusync.com / Faculty@123 (ERP007)

### ECE Department
- **HOD**: hod.ece@edusync.com / Admin@ece
- **Faculty 5**: faculty5@edusync.com / Faculty@123 (ERP005)

[See DEMO_MODE_QUICKSTART.md for complete credentials list]

---

## 📄 Files Modified

**Created**:
- `src/types/leave.ts`
- `src/services/leaveService.ts`
- `src/services/notificationService.ts`
- `src/components/dashboard/StatusBadge.tsx`
- `src/components/dashboard/EmptyState.tsx`
- `src/pages/admin/LeaveRequestsPage.tsx`
- `src/pages/admin/NotificationsPage.tsx`

**Updated**:
- `src/pages/faculty/ApplyLeavePage.tsx`
- `src/pages/faculty/NotificationsPage.tsx`
- `src/App.tsx` (added routes)

---

## ✅ Build Status

✓ 2059 modules transformed
✓ Generated dist/ with minified assets
✓ No TypeScript errors
✓ Ready for testing
