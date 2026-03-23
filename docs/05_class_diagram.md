# Class Diagram

The following structural diagram presents the schema and relationships of the primary entities within the EduSync Firebase Database (Firestore).

## EduSync Entity Relationship (ER) & Class Diagram

```plantuml
@startuml
skinparam classAttributeIconSize 0

class User {
  +uid: String
  +email: String
  +phoneNumber: String
  +role: Enum {ADMIN, FACULTY}
  +createdAt: Timestamp
}

class FacultyProfile {
  +facultyId: String
  +username: String
  +erpId: String
  +department: String
  +status: String
  +leaveBalance: LeaveBalance
}

class LeaveBalance {
  +casual: Integer
  +sick: Integer
  +paid: Integer
}

class LeaveRequest {
  +requestId: String
  +facultyId: String
  +facultyName: String
  +type: Enum {sick, casual, paid}
  +reason: String
  +status: Enum {Pending, Approved, Rejected}
  +appliedOn: Timestamp
}

class Timetable {
  +facultyId: String
  +slots: List<TimetableSlot>
  +updatedAt: Timestamp
}

class TimetableSlot {
  +day: String
  +timeInfo: String
  +subject: String
  +section: String
}

class Notification {
  +notificationId: String
  +senderId: String
  +recipientId: String
  +message: String
  +timestamp: Timestamp
  +isRead: Boolean
}

class Event {
  +eventId: String
  +title: String
  +description: String
  +date: Timestamp
  +pdfUrl: String
  +category: Enum {upcoming, present, past}
}

class Announcement {
  +id: String
  +message: String
  +publishedBy: String
  +timestamp: Timestamp
}

class ExaminationInfo {
  +infoId: String
  +type: Enum {mids, lab-internals, semester, placements}
  +pdfUrl: String
  +uploadedAt: Timestamp
}

User "1" *-- "1" FacultyProfile : has
FacultyProfile "1" *-- "1" LeaveBalance : contains
User "1" o-- "*" LeaveRequest : creates
User "1" o-- "1" Timetable : owns
Timetable "1" *-- "*" TimetableSlot : contains
User "1" o-- "*" Notification : sends/receives
Admin --> Event : uploads
Admin --> Announcement : publishes
Admin --> ExaminationInfo : uploads
@enduml
```
