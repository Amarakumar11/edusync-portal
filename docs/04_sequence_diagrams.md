# Sequence Diagrams

These sequence diagrams capture the dynamic behavior and message flow across important system boundaries in EduSync.

## Authentication & OTP Login (Faculty)

```plantuml
@startuml
actor Faculty
boundary "Login/Signup Page" as UI
control "AuthService" as Auth
database "Firebase Auth" as FBAuth
database "Firestore DB" as DB

Faculty -> UI: Enter ERP ID & Profile details
UI -> Auth: Request Create Account
Auth -> DB: Ensure ERP ID is unique
DB --> Auth: Validation OK
Auth -> FBAuth: Register with Phone
FBAuth --> Faculty: Send OTP SMS
Faculty -> UI: Enter OTP Validation
UI -> Auth: Submit OTP
Auth -> FBAuth: Verify OTP
FBAuth --> Auth: Verification Success
Auth -> DB: Create Faculty Record + Profile
DB --> Auth: Record created
Auth --> UI: Login successful
UI --> Faculty: Redirect to Faculty Home Page
@enduml
```

## Leave Application Workflow

```plantuml
@startuml
actor Faculty
boundary "Apply Leave UI" as UI
control "LeaveService" as LService
database "Firestore (Leaves)" as DB
control "NotificationService" as NService
actor Admin

Faculty -> UI: Select Leave Type & Reason
UI -> LService: Submit Leave Request(FacultyID, Type, Reason)
LService -> DB: Save Leave Request (Status: Pending)
DB --> LService: Document Saved
LService -> NService: Send Notification to Admins
NService -> DB: Log Request Notification
UI --> Faculty: "Leave applied successfully"

group Admin Approval Process
  Admin -> UI: View Leave Requests
  UI -> DB: Fetch Pending leaves
  DB --> UI: Return Request
  Admin -> UI: Click "Approve"
  UI -> LService: updateLeaveStatus(RequestID, 'Approved')
  LService -> DB: Update Request Status to Approved
  LService -> NService: Notify requesting Faculty
  LService -> NService: Broadcast: "<FacultyName> is on leave, take their classes" to all faculties
  NService -> DB: Write Notifications
  UI --> Admin: "Leave Approved"
end
@enduml
```

## Announcement Publication Workflow

```plantuml
@startuml
actor Admin
boundary "Announcements UI" as UI
control "NotificationService" as NService
database "Firestore" as DB

Admin -> UI: Enter Announcement Text
UI -> NService: publishAnnouncement(Message)
NService -> DB: Save Announcement globally
DB --> NService: Saved success
NService -> DB: Append announcement trigger to each Faculty Notification Queue (Optional)
UI --> Admin: "Published Successfully"
@enduml
```
