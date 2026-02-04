// ⚠️ DEMO MODE: Department-wise Leave Request System

# 🗂️ Complete File Structure & Dependencies

## Project Structure
```
v:/edusync-portal/
├── src/
│   ├── types/
│   │   ├── index.ts (existing)
│   │   └── leave.ts ⭐ NEW
│   │       ├── Department type
│   │       ├── LeaveRequest interface
│   │       └── Notification interface
│   │
│   ├── services/
│   │   ├── authService.ts (existing)
│   │   ├── firestoreService.ts (existing)
│   │   ├── storageService.ts (existing)
│   │   ├── leaveService.ts ⭐ NEW
│   │   │   ├── createLeaveRequest()
│   │   │   ├── getLeaveRequestsByDepartment()
│   │   │   ├── updateLeaveRequestStatus()
│   │   │   ├── deleteLeaveRequest()
│   │   │   └── getAllLeaveRequests()
│   │   │
│   │   └── notificationService.ts ⭐ NEW
│   │       ├── createNotification()
│   │       ├── getFacultyNotifications()
│   │       ├── getAdminNotifications()
│   │       ├── markNotificationAsRead()
│   │       ├── deleteNotification()
│   │       └── getAllNotifications()
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── PageHeader.tsx (existing)
│   │   │   ├── DashboardLayout.tsx (existing)
│   │   │   ├── DashboardSidebar.tsx (existing)
│   │   │   ├── DataCard.tsx (existing)
│   │   │   ├── StatsCard.tsx (existing)
│   │   │   ├── StatusBadge.tsx ⭐ NEW
│   │   │   │   ├── Props: status ('pending'|'approved'|'rejected')
│   │   │   │   └── Renders colored Badge
│   │   │   │
│   │   │   └── EmptyState.tsx ⭐ NEW
│   │   │       ├── Props: title, description, icon
│   │   │       └── Renders Alert with custom content
│   │   │
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx (existing - updated)
│   │   │
│   │   └── ui/
│   │       ├── badge.tsx (existing)
│   │       ├── button.tsx (existing)
│   │       ├── card.tsx (existing)
│   │       ├── table.tsx (existing)
│   │       ├── textarea.tsx (existing)
│   │       ├── input.tsx (existing)
│   │       └── ... (all other shadcn components)
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx (existing)
│   │   │   ├── SignupPage.tsx (existing)
│   │   │   └── OTPVerificationPage.tsx (existing)
│   │   │
│   │   ├── faculty/
│   │   │   ├── FacultyHome.tsx (existing)
│   │   │   ├── TimetablePage.tsx (existing)
│   │   │   ├── LeaveHome.tsx (existing)
│   │   │   ├── ApplyLeavePage.tsx ⭐ UPDATED
│   │   │   │   ├── Form: fromDate, toDate, reason
│   │   │   │   ├── Calls: createLeaveRequest()
│   │   │   │   ├── Calls: createNotification() for HOD
│   │   │   │   └── Redirects: /faculty/leave-history
│   │   │   │
│   │   │   ├── NotificationsPage.tsx ⭐ UPDATED
│   │   │   │   ├── Loads: getFacultyNotifications()
│   │   │   │   ├── Shows: filtered by email
│   │   │   │   ├── Has: "Mark as read" button
│   │   │   │   └── Sorted: newest first
│   │   │   │
│   │   │   ├── LeaveHistoryPage.tsx (existing)
│   │   │   ├── AnnouncementsPage.tsx (existing)
│   │   │   ├── EventsPage.tsx (existing)
│   │   │   ├── ExamsPage.tsx (existing)
│   │   │   └── ProfilePage.tsx (existing)
│   │   │
│   │   └── admin/
│   │       ├── AdminHome.tsx (existing)
│   │       ├── LeaveRequestsPage.tsx ⭐ NEW
│   │       │   ├── Loads: getLeaveRequestsByDepartment()
│   │       │   ├── Shows: all requests (pending + resolved)
│   │       │   ├── Buttons: Approve, Reject
│   │       │   ├── Creates: notifications for faculty
│   │       │   └── Table: Faculty, ERP, Dates, Reason, Status
│   │       │
│   │       ├── NotificationsPage.tsx ⭐ NEW
│   │       │   ├── Loads: getAdminNotifications()
│   │       │   ├── Shows: department-filtered
│   │       │   ├── Message: new leave requests
│   │       │   └── Sorted: newest first
│   │       │
│   │       └── (other admin pages...)
│   │
│   ├── demoAuth.ts (existing - uses localStorage)
│   ├── demoUsers.ts (existing - hardcoded credentials)
│   ├── App.tsx ⭐ UPDATED
│   │   └── Routes: added /faculty/apply-leave, /admin/leave-requests, etc.
│   │
│   └── main.tsx (existing)
│
├── LEAVE_SYSTEM_GUIDE.md ⭐ NEW - Technical reference
├── LEAVE_SYSTEM_QUICKTEST.md ⭐ NEW - Test scenarios
├── LEAVE_SYSTEM_IMPLEMENTATION.md ⭐ NEW - This overview
├── DEMO_MODE_GUIDE.md (existing)
├── DEMO_MODE_QUICKSTART.md (existing)
└── package.json (existing)
```

---

## 📦 Dependencies Used

### Existing (No new dependencies added!)
- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type safety
- **shadcn/ui** - UI components
  - `badge` - Status badges
  - `button` - Form buttons
  - `card` - Card containers
  - `table` - Leave requests table
  - `textarea` - Reason input
  - `input` - Date inputs
  - `alert` - Empty state
- **react-router-dom** - Routing
- **lucide-react** - Icons
- **date-fns** - Date formatting
- **tailwind-css** - Styling

### localStorage (Built-in browser API)
- No external library needed
- Uses JSON.stringify/parse
- Keys: `edusync_leave_requests`, `edusync_notifications`

---

## 🔗 Service Layer Dependencies

```
ApplyLeavePage.tsx
  ├── imports getCurrentUser() from demoAuth.ts
  ├── imports useToast() from hooks/use-toast.ts
  ├── calls createLeaveRequest() from leaveService.ts
  └── calls createNotification() from notificationService.ts

LeaveRequestsPage.tsx
  ├── imports getCurrentUser() from demoAuth.ts
  ├── imports useToast() from hooks/use-toast.ts
  ├── calls getLeaveRequestsByDepartment() from leaveService.ts
  ├── calls updateLeaveRequestStatus() from leaveService.ts
  └── calls createNotification() from notificationService.ts

AdminNotificationsPage.tsx
  ├── imports getCurrentUser() from demoAuth.ts
  └── calls getAdminNotifications() from notificationService.ts

FacultyNotificationsPage.tsx
  ├── imports getCurrentUser() from demoAuth.ts
  └── calls getFacultyNotifications() from notificationService.ts
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FACULTY SIDE                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ApplyLeavePage.tsx                                         │
│  ├─ Form inputs: fromDate, toDate, reason                 │
│  ├─ Calls: createLeaveRequest() → leaveService.ts        │
│  └─ Calls: createNotification() → notificationService.ts │
│       ↓                                                     │
│  localStorage ['edusync_leave_requests']                  │
│       ↓                                                     │
│  Success Toast + Redirect to LeaveHistoryPage             │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  NotificationsPage.tsx                                     │
│  ├─ Loads: getFacultyNotifications(email)                │
│  │    ├─ Filters: toRole='faculty' AND toEmail=email    │
│  │    └─ Returns: Notification[]                         │
│  │                                                         │
│  └─ Display:                                              │
│     ├─ New badge if read=false                           │
│     ├─ Message + timestamp                               │
│     └─ "Mark as read" button                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                    ADMIN SIDE                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LeaveRequestsPage.tsx                                      │
│  ├─ Load: getLeaveRequestsByDepartment(department)       │
│  │    └─ Filters: department = admin.department         │
│  │                                                        │
│  ├─ Display: Table                                       │
│  │    ├─ Pending requests (with buttons)               │
│  │    └─ Resolved requests (status only)               │
│  │                                                        │
│  ├─ Approve button                                       │
│  │    ├─ Calls: updateLeaveRequestStatus('approved')   │
│  │    ├─ Calls: createNotification() → Faculty         │
│  │    └─ Toast: "Approved"                             │
│  │                                                        │
│  └─ Reject button                                        │
│       ├─ Calls: updateLeaveRequestStatus('rejected')   │
│       ├─ Calls: createNotification() → Faculty         │
│       └─ Toast: "Rejected"                             │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  AdminNotificationsPage.tsx                                │
│  ├─ Load: getAdminNotifications(department)              │
│  │    └─ Filters: toRole='admin' AND dept=admin.dept   │
│  │                                                        │
│  └─ Display: Card list                                   │
│     ├─ Message: "New leave from [Faculty]"             │
│     ├─ Timestamp                                         │
│     └─ New badge                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                  localStorage                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  edusync_leave_requests: [                                 │
│    {                                                        │
│      id, facultyEmail, facultyName, facultyErpId,         │
│      department, reason, fromDate, toDate,                │
│      status ('pending'|'approved'|'rejected'),            │
│      createdAt                                             │
│    }                                                        │
│  ]                                                          │
│                                                              │
│  edusync_notifications: [                                  │
│    {                                                        │
│      id, toRole ('admin'|'faculty'),                      │
│      toDepartment, toEmail (optional),                     │
│      message, createdAt, read (boolean)                   │
│    }                                                        │
│  ]                                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎬 Action Sequence

### Sequence 1: Faculty Apply Leave
```
1. Faculty clicks "Apply for Leave" button
   ↓
2. Navigate to /faculty/apply-leave
   ↓
3. Form renders (ApplyLeavePage.tsx)
   ├─ demoAuth.getCurrentUser() → user object
   ├─ Display: Department = user.department
   └─ Show form fields
   ↓
4. Faculty fills: fromDate, toDate, reason
   ↓
5. Faculty clicks Submit
   ├─ Validate: dates, fields
   ├─ Validate: fromDate < toDate
   └─ If error: show toast + stop
   ↓
6. Call: leaveService.createLeaveRequest()
   ├─ Create LeaveRequest object
   ├─ Set status = 'pending'
   ├─ Get all requests from localStorage
   ├─ Add new request to array
   ├─ Save to localStorage
   └─ Return new request
   ↓
7. Call: notificationService.createNotification()
   ├─ Create Notification object
   ├─ Set toRole = 'admin'
   ├─ Set toDepartment = user.department
   ├─ Get all notifications from localStorage
   ├─ Add new notification to array
   ├─ Save to localStorage
   └─ Return new notification
   ↓
8. Show success toast: "Leave request sent to HOD"
   ↓
9. Reset form fields
   ↓
10. Delay 1.5 seconds
    ↓
11. Navigate to /faculty/leave-history
```

### Sequence 2: Admin Approves Leave
```
1. Admin navigates to /admin/leave-requests
   ↓
2. LeaveRequestsPage.tsx renders
   ├─ demoAuth.getCurrentUser() → admin object
   ├─ Call: leaveService.getLeaveRequestsByDepartment(admin.department)
   │  ├─ Get all requests from localStorage
   │  ├─ Filter: request.department === admin.department
   │  └─ Return filtered array
   ├─ Sort by createdAt (newest first)
   └─ Group: pending requests first, then resolved
   ↓
3. Display table
   ├─ Pending requests with: Faculty Name, ERP, Dates, Reason
   ├─ Action buttons: Approve, Reject
   └─ Resolved requests (no buttons)
   ↓
4. Admin clicks Approve button
   ├─ Set: setProcessingId = leaveRequest.id
   ├─ Disable button (prevent multiple clicks)
   └─ Call: leaveService.updateLeaveRequestStatus(leaveId, 'approved')
      ├─ Get all requests from localStorage
      ├─ Find request by ID
      ├─ Set status = 'approved'
      ├─ Save to localStorage
      └─ Return updated request
   ↓
5. Call: notificationService.createNotification()
   ├─ Create Notification object
   ├─ Set toRole = 'faculty'
   ├─ Set toEmail = leaveRequest.facultyEmail
   ├─ Set message = "Your leave request has been approved by HOD ({department})"
   ├─ Get all notifications from localStorage
   ├─ Add new notification to array
   ├─ Save to localStorage
   └─ Return new notification
   ↓
6. Show success toast: "Leave request approved for [Faculty Name]"
   ↓
7. Reload page: leaveService.getLeaveRequestsByDepartment()
   └─ Approved request moves from pending to resolved section
   ↓
8. Re-enable button
```

### Sequence 3: Faculty Receives Notification
```
1. Faculty navigates to /faculty/notifications
   ↓
2. NotificationsPage.tsx renders
   ├─ demoAuth.getCurrentUser() → faculty object
   ├─ useEffect triggered on mount
   └─ Call: notificationService.getFacultyNotifications(faculty.email)
      ├─ Get all notifications from localStorage
      ├─ Filter: toRole === 'faculty' AND toEmail === email
      ├─ Sort by createdAt (newest first)
      └─ Return filtered array
   ↓
3. Display notifications
   ├─ For each notification:
   │  ├─ Show message
   │  ├─ Show timestamp (formatDistanceToNow)
   │  ├─ Show "New" badge if read === false
   │  └─ Show "Mark as read" button if read === false
   └─ If none: show EmptyState
   ↓
4. Faculty clicks "Mark as read"
   ├─ Call: notificationService.markNotificationAsRead(notificationId)
   │  ├─ Get all notifications from localStorage
   │  ├─ Find notification by ID
   │  ├─ Set read = true
   │  ├─ Save to localStorage
   │  └─ Return updated notification
   ├─ Reload notifications
   └─ Button disappears, notification dims
```

---

## 🔍 Department Filtering Logic

### Admin sees ONLY their department
```typescript
// In LeaveRequestsPage.tsx
const admin = getCurrentUser(); // { role: 'admin', department: 'CSE' }

const requests = getLeaveRequestsByDepartment(admin.department);
// → Filters: request.department === 'CSE'
// → Returns: only CSE leaves
// → CSE_AIML, ECE, HS leaves hidden ✓
```

### Result
```
CSE Admin login → sees: [CSE leave requests]
CSE_AIML Admin login → sees: [CSE_AIML leave requests]
ECE Admin login → sees: [ECE leave requests]
HS Admin login → sees: [HS leave requests]

Cross-department access: ✓ PREVENTED
```

---

## 🎨 UI Component Hierarchy

```
App.tsx
├── Routes
│   ├── Faculty Routes
│   │   └── /faculty/apply-leave
│   │       └── <ApplyLeavePage>
│   │           ├── <PageHeader>
│   │           ├── <Card>
│   │           │   ├── <CardHeader>
│   │           │   ├── <CardContent>
│   │           │   │   └── <Form>
│   │           │   │       ├── <Input> (fromDate)
│   │           │   │       ├── <Input> (toDate)
│   │           │   │       ├── <Textarea> (reason)
│   │           │   │       └── <Button> (Submit)
│   │           │   └── <CardDescription>
│   │           └── (uses leaveService, notificationService)
│   │
│   ├── Faculty Routes
│   │   └── /faculty/notifications
│   │       └── <NotificationsPage>
│   │           ├── <PageHeader>
│   │           └── {notifications.map(n =>
│   │               <Card>
│   │                   ├── Message text
│   │                   ├── <Badge> (if unread)
│   │                   └── <Button> (Mark as read)
│   │               </Card>
│   │            )}
│   │
│   ├── Admin Routes
│   │   └── /admin/leave-requests
│   │       └── <LeaveRequestsPage>
│   │           ├── <PageHeader>
│   │           ├── <Card> (Pending Requests)
│   │           │   └── <Table>
│   │           │       ├── <TableHeader>
│   │           │       ├── <TableBody>
│   │           │       │   └── {requests.map(r =>
│   │           │       │       <TableRow>
│   │           │       │           ├── Faculty Name
│   │           │       │           ├── ERP ID
│   │           │       │           ├── Dates
│   │           │       │           ├── Reason
│   │           │       │           ├── <Button> (Approve)
│   │           │       │           └── <Button> (Reject)
│   │           │       │       </TableRow>
│   │           │       │    )}
│   │           │       └── <StatusBadge> (for resolved)
│   │           └── <Card> (Resolved Requests)
│   │
│   └── Admin Routes
│       └── /admin/notifications
│           └── <AdminNotificationsPage>
│               ├── <PageHeader>
│               └── {notifications.map(n =>
│                   <Card>
│                       ├── <Department label>
│                       ├── Message
│                       ├── Timestamp
│                       └── <Badge> (if unread)
│                   </Card>
│                )}
```

---

## 📋 Import Dependencies Summary

```typescript
// Components use:
- React (useState, useEffect, etc.)
- react-router-dom (useNavigate)
- shadcn/ui components
- lucide-react icons
- date-fns (formatDistanceToNow)
- @/hooks/use-toast
- @/demoAuth (getCurrentUser)
- @/services/leaveService
- @/services/notificationService
- @/types/leave (interfaces)
- @/components/dashboard/* (reusable UI)
```

---

## ✅ Quality Assurance Checklist

- [x] All imports resolve correctly
- [x] No circular dependencies
- [x] TypeScript strict mode compliant
- [x] localStorage keys properly namespaced
- [x] Service functions handle errors
- [x] Components unmount cleanly
- [x] No memory leaks (useEffect cleanup)
- [x] Route protection implemented
- [x] Department filtering verified
- [x] Build produces no errors
- [x] All files follow naming conventions
- [x] Documentation complete

---

**System fully integrated and ready for testing!**
