# Requirements & Installation Specifications

The EduSync system is primarily a web portal, developed as a Single Page Application using **React**, **Vite**, and **TypeScript** built on top of **Firebase** serverless backend. Since you requested step-by-step specifications for installation and a requirements file, here are the details.

## Step-by-Step Installation Guide

### Step 1: Install Prerequisites
1. **Node.js**: Ensure you have Node.js (version 18 or higher) installed on your system. Download it from [Node.js Official Website](https://nodejs.org/).
2. **Package Manager (Bun)**: EduSync relies heavily on `bun`. If you don't have it, install it via:
   ```bash
   npm install -g bun
   ```

### Step 2: Clone the Repository
Clone the repository and open the terminal in the project directory:
```bash
git clone <repository_url> edusync-portal
cd edusync-portal
```

### Step 3: Install Package Dependencies
Instead of traditional `requirements.txt` used for Python backends, modern TS/JS projects keep dependencies inside a `package.json`.
Run the following package install command:
```bash
bun install
```
This will read the `package.json` file and resolve all node modules (React, React Router, Firebase Admin, Tailwind CSS, etc.).

### Step 4: Firebase Configuration (.env file)
The application connects specifically to a Firebase project. You need to provide the environment variables:
1. Copy the `.env.local` template (if available) or create `.env`.
2. Grab the API details from Firebase Web Apps setting console and paste:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### Step 5: Start the Development Server
Since there's a React frontend (Vite) and an optional node backend `server.mjs`, you can run the primary script shown in `package.json`:
```bash
npm run dev
# OR:
bun run dev
```

The portal should now be accessible at `http://localhost:5173`. 
* **Admin Login**: Requires preconfigured credentials in the DB (can be set over Firebase directly).
* **Faculty Login**: Sign-Up enabled, verification relies on Firebase Phone Auth or Email Auth depending on configuration.

## Understanding requirements.txt
The user requested a `requirements.txt`. There is an accompanying `requirements.txt` at the root of the project providing a high-level dependency list (it references `bun install`, `react`, `firebase`, `tailwindcss`). 
For purely Python-bound components such as YOLO (mentioned in your reference context section 7.5.2), make sure the Python `flask` and `ultralytics` tools are provided in the Python module's directory directly if they exist. Based on the file structure gathered, the main application is pure Javascript/TypeScript and does not natively execute YOLO in its web codebase. 
