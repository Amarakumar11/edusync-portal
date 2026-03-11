# EduSync Portal

EduSync is a comprehensive college management portal built with React, Vite, and Firebase. It features a sophisticated leave management system, substitution coordination, and real-time notifications for both Faculty and HOD/Principal roles.

## Prerequisites
* **Node.js**: v18 or higher
* **Bun**: (Recommended) Fast JavaScript overall toolbox

## Installation
```bash
bun install
```

## Setup Firebase
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password, Phone)
3. Enable Firestore Database
4. Enable Firebase Storage (for PDFs)
5. Copy your Firebase config to a `.env.local` file in the root directory:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

## Running the Project
```bash
bun run dev
```
This will start the local development server at `http://localhost:8080`.

## Key Features
* **Dynamic Leave Management**: Admins can configure leave types and quotas.
* **Substitution System**: Faculty can coordinate class swaps during leave applications.
* **Real-time Notifications**: Instant alerts for leave approvals, rejections, and swap requests.
* **Role-based Access**: Specific portals for Faculty, HOD, and Principal.
* **Document Management**: Upload and view Timetables, Exam Schedules, and Event Brochures.

## Technologies Used
* **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, Radix UI
* **Backend**: Firebase Firestore, Firebase Authentication, Firebase Storage
* **Form Logic**: React Hook Form, Zod
* **Data Fetching**: TanStack React Query
