# Use Case Diagrams

The following Use Case diagrams outline the interactions between the primary actors (Admin and Faculty) and the EduSync system.

## Faculty Portal Use Case Diagram

```plantuml
@startuml
skinparam actorStyle hollow
left to right direction

actor Faculty as F
rectangle "EduSync System" {
  usecase "Login / Sign Up via OTP" as UC1
  usecase "View Home (Next Class/Leaves)" as UC2
  usecase "Manage Timetable (Add/Delete/Save)" as UC3
  usecase "Apply for Leave (Sick, Casual, Paid)" as UC4
  usecase "View Leave History" as UC5
  usecase "View Announcements" as UC6
  usecase "View Events (Past/Upcoming)" as UC7
  usecase "Manage Notifications (Send/Receive)" as UC8
  usecase "View Examination Info (PDFs)" as UC9
  usecase "Manage Profile" as UC10
}

F --> UC1
F --> UC2
F --> UC3
F --> UC4
F --> UC5
F --> UC6
F --> UC7
F --> UC8
F --> UC9
F --> UC10

@enduml
```

## Admin Portal Use Case Diagram

```plantuml
@startuml
skinparam actorStyle hollow
left to right direction

actor Admin as A
rectangle "EduSync System" {
  usecase "Login via predefined credentials & OTP" as UC_A1
  usecase "View Home (Next Class, Notifs)" as UC_A2
  usecase "Manage My Timetable" as UC_A3
  usecase "Upload All Timetables (PDF)" as UC_A4
  usecase "Use Notepad (My Notes)" as UC_A5
  usecase "Approve/Reject Leave Requests" as UC_A6
  usecase "Publish Announcements" as UC_A7
  usecase "Manage Events (Upload Links/PDFs)" as UC_A8
  usecase "Manage Notifications (Send/Receive)" as UC_A9
  usecase "View Faculty Info" as UC_A10
  usecase "Upload Examination PDFs" as UC_A11
}

A --> UC_A1
A --> UC_A2
A --> UC_A3
A --> UC_A4
A --> UC_A5
A --> UC_A6
A --> UC_A7
A --> UC_A8
A --> UC_A9
A --> UC_A10
A --> UC_A11

@enduml
```
