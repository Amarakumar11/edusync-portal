# EduSync Project Structure

This document outlines the complete file structure of the EduSync project and provides high-level information about its components.

## Complete File Structure

```text
.
├── bun.lockb
├── components.json
├── dist/
├── edusync-57bc1-firebase-adminsdk-fbsvc-44ab64da82.json
├── .env
├── .env.local
├── eslint.config.js
├── FIREBASE_SETUP.md
├── firestore.rules
├── functions/
│   ├── lib/
│   │   └── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   ├── scripts/
│   │   └── setInitialAdmin.ts
│   ├── src/
│   │   └── index.ts
│   └── tsconfig.json
├── index.html
├── LEAVE_SYSTEM_ARCHITECTURE.md
├── LEAVE_SYSTEM_GUIDE.md
├── LEAVE_SYSTEM_IMPLEMENTATION.md
├── LEAVE_SYSTEM_QUICKTEST.md
├── package.json
├── package-lock.json
├── postcss.config.js
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   ├── robots.txt
│   └── uploads/
│       ├── all-timetables/
│       ├── exams/
│       ├── misc/
│       └── profiles/
├── README_LEAVE_SYSTEM.md
├── README.md
├── requirements.txt
├── scripts/
│   └── seedFirebase.mjs
├── server.mjs
├── serviceAccountKey.json
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── landing/
│   │   ├── NavLink.tsx
│   │   └── ui/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── firebase.ts
│   ├── hooks/
│   ├── index.css
│   ├── lib/
│   │   └── utils.ts
│   ├── main.tsx
│   ├── pages/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── faculty/
│   │   ├── shared/
│   │   ├── Index.tsx
│   │   ├── LandingPage.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   ├── authService.ts
│   │   ├── firestoreService.ts
│   │   ├── leaveService.ts
│   │   ├── notificationService.ts
│   │   └── storageService.ts
│   ├── test/
│   ├── types/
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   ├── index.ts
│   │   └── leave.ts
│   └── vite-env.d.ts
├── START_HERE_LEAVE_SYSTEM.md
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

## Project Overview

EduSync is a comprehensive portal designed for managing educational institution workflows. It consists of multiple modules tailored for completely different roles, primarily Admin and Faculty.

### Key Technologies
- **Frontend Framework**: React 18 with TypeScript and Vite.
- **Routing**: React Router DOM (v6).
- **Styling**: Tailwind CSS + Shadcn UI (Radix UI components).
- **Backend & Database**: Firebase (Authentication, Firestore Database, Storage, Functions).
- **Package Manager**: Bun (with mostly standard Node.js scripts).

### Core Features
- **Authentication**: Role-based access (Admin/Faculty) with OTP validation based on predefined credentials.
- **Dashboard functionality**: Different dashboards for admins and faculties showing tailored notifications, leave stats, next classes, and announcements.
- **Timetable Management**: Admin-uploaded documents and personalized user-editable timetables.
- **Leave Management**: Granular tracking for multiple leave types (Sick, Casual, Paid), visual calendar representations, request/approval workflows.
- **Announcements & Notifications**: Broadcasting features allowing Admins to inform faculties, and faculty-to-admin message boards.
- **Events & Exams**: Document management features for uploading, viewing, and classifying ongoing/past events or examination schedules.

This documentation serves as the base architectural reference for the system.
