# EduSync Cloud Functions

This folder contains Firebase Cloud Functions for managing users (admins and faculties).

## Functions
- createAdmin(email, password, department)
- createFaculty(email, password, department, name, erpId)
- approveFaculty(uid, department)

All functions are HTTPS callable and required the caller to be an authenticated user with custom claim `role: 'admin'`.

## Departments
Allowed values: `CSE`, `CSE_AIML`, `CSE_AIDS`, `CSE_DS`, `ECE`, `HS`.

## Compile & Deploy
1. From `functions/` directory, install deps and build:

   ```bash
   cd functions
   npm install
   npm run build
   ```

2. Deploy functions (from project root):

   ```bash
   firebase deploy --only functions
   ```

## Security
- Do NOT store admin secrets in frontend. Use Callable functions to keep admin logic server-side.
- Set up appropriate IAM and Firestore rules.
