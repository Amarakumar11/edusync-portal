/**
 * Seed Firebase with initial admin & faculty accounts.
 * 
 * Run with:  node scripts/seedFirebase.mjs
 * 
 * This script:
 * 1. Creates users in Firebase Auth via the REST API
 * 2. Creates their Firestore profiles via the REST API
 * 
 * Safe to re-run — skips already-existing users.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Read .env file ──────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    env[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim();
}

const API_KEY = env.VITE_FIREBASE_API_KEY;
const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID;

// ── Seed data ───────────────────────────────────────────────
const SEED_USERS = [
    // ═══════════════════════  ADMINS  ═══════════════════════
    {
        email: 'hod.cse@edusync.com',
        password: 'Admin@cse123',
        name: 'HOD CSE',
        phone: '+919876543210',
        erpId: 'HOD_CSE',
        role: 'admin',
        department: 'CSE',
    },
    {
        email: 'hod.cse_aiml@edusync.com',
        password: 'Admin@csm123',
        name: 'HOD CSE (AIML)',
        phone: '+919876543211',
        erpId: 'HOD_CSE_AIML',
        role: 'admin',
        department: 'CSE_AIML',
    },
    {
        email: 'hod.cse_aids@edusync.com',
        password: 'Admin@aids123',
        name: 'HOD CSE (AIDS)',
        phone: '+919876543212',
        erpId: 'HOD_CSE_AIDS',
        role: 'admin',
        department: 'CSE_AIDS',
    },
    {
        email: 'hod.cse_ds@edusync.com',
        password: 'Admin@ds123',
        name: 'HOD CSE (DS)',
        phone: '+919876543213',
        erpId: 'HOD_CSE_DS',
        role: 'admin',
        department: 'CSE_DS',
    },
    {
        email: 'hod.ece@edusync.com',
        password: 'Admin@ece123',
        name: 'HOD ECE',
        phone: '+919876543214',
        erpId: 'HOD_ECE',
        role: 'admin',
        department: 'ECE',
    },
    {
        email: 'hod.hs@edusync.com',
        password: 'Admin@hs123',
        name: 'HOD HS',
        phone: '+919876543215',
        erpId: 'HOD_HS',
        role: 'admin',
        department: 'HS',
    },

    // ═══════════════════  FACULTY (samples)  ════════════════
    {
        email: 'faculty1@edusync.com',
        password: 'Faculty@cse123',
        name: 'Dr. Ramesh Kumar',
        phone: '+919876543301',
        erpId: 'ERP001',
        role: 'faculty',
        department: 'CSE',
    },
    {
        email: 'faculty2@edusync.com',
        password: 'Faculty@csm123',
        name: 'Dr. Priya Sharma',
        phone: '+919876543302',
        erpId: 'ERP002',
        role: 'faculty',
        department: 'CSE_AIML',
    },
    {
        email: 'faculty3@edusync.com',
        password: 'Faculty@aids123',
        name: 'Prof. Suresh Reddy',
        phone: '+919876543303',
        erpId: 'ERP003',
        role: 'faculty',
        department: 'CSE_AIDS',
    },
    {
        email: 'faculty4@edusync.com',
        password: 'Faculty@ece123',
        name: 'Dr. Anitha Rao',
        phone: '+919876543304',
        erpId: 'ERP004',
        role: 'faculty',
        department: 'ECE',
    },
];

// ── Firebase REST helpers ────────────────────────────────────

/**
 * Sign up a user via Firebase Auth REST API.
 * Returns { localId, idToken } on success, or null if user already exists.
 */
async function authSignUp(email, password) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json();
    if (data.error) {
        if (data.error.message === 'EMAIL_EXISTS') {
            return null; // user already exists
        }
        throw new Error(`Auth sign-up error: ${data.error.message}`);
    }
    return { localId: data.localId, idToken: data.idToken };
}

/**
 * Sign in a user via Firebase Auth REST API.
 * Returns { localId, idToken }.
 */
async function authSignIn(email, password) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json();
    if (data.error) {
        throw new Error(`Auth sign-in error: ${data.error.message}`);
    }
    return { localId: data.localId, idToken: data.idToken };
}

/**
 * Write a document to Firestore via REST API.
 * Uses the user's idToken for authentication.
 */
async function firestoreSetDoc(collectionPath, docId, fields, idToken) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionPath}/${docId}?key=${API_KEY}`;

    // Convert plain object to Firestore REST format
    const firestoreFields = {};
    for (const [key, value] of Object.entries(fields)) {
        if (typeof value === 'string') {
            firestoreFields[key] = { stringValue: value };
        } else if (typeof value === 'number') {
            firestoreFields[key] = { integerValue: String(value) };
        } else if (typeof value === 'boolean') {
            firestoreFields[key] = { booleanValue: value };
        }
    }

    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ fields: firestoreFields }),
    });

    const data = await res.json();
    if (data.error) {
        throw new Error(`Firestore write error: ${data.error.message} (code: ${data.error.code})`);
    }
    return data;
}

/**
 * Check if a Firestore document exists via REST API.
 */
async function firestoreGetDoc(collectionPath, docId, idToken) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionPath}/${docId}?key=${API_KEY}`;
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${idToken}` },
    });
    if (res.status === 404) return null;
    const data = await res.json();
    if (data.error) return null;
    return data;
}

// ── Seed a single user ──────────────────────────────────────
async function seedUser(userData) {
    const { email, password, name, phone, erpId, role, department } = userData;

    try {
        let uid, idToken;

        // Try creating the user
        const signUpResult = await authSignUp(email, password);
        if (signUpResult) {
            uid = signUpResult.localId;
            idToken = signUpResult.idToken;
            console.log(`  ✅ Created Auth user: ${email} (uid: ${uid})`);
        } else {
            // User exists — sign in to get uid + token
            const signInResult = await authSignIn(email, password);
            uid = signInResult.localId;
            idToken = signInResult.idToken;
            console.log(`  ⚡ Auth user already exists: ${email} (uid: ${uid})`);
        }

        // Check if Firestore profile exists
        const existing = await firestoreGetDoc('users', uid, idToken);
        if (existing && existing.fields) {
            console.log(`  ⚡ Firestore profile already exists for ${email}`);
        } else {
            // Create Firestore profile
            const profile = {
                uid,
                name,
                email,
                phone,
                erpId,
                role,
                department,
                createdAt: new Date().toISOString(),
            };
            await firestoreSetDoc('users', uid, profile, idToken);
            console.log(`  ✅ Created Firestore profile: ${email} → role: ${role}, dept: ${department}`);
        }
    } catch (err) {
        console.error(`  ❌ Failed for ${email}: ${err.message}`);
    }
}

// ── Main ────────────────────────────────────────────────────
async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║      EduSync Portal — Firebase Seeder           ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Project: ${PROJECT_ID}`);
    console.log(`Seeding ${SEED_USERS.length} users...\n`);

    for (const userData of SEED_USERS) {
        await seedUser(userData);
        console.log('');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('  Seed Credentials Summary');
    console.log('  ────────────────────────');
    console.log('');
    console.log('  ADMIN ACCOUNTS:');
    console.log('  ┌──────────────────────────────┬─────────────────┬────────────┐');
    console.log('  │ Email                        │ Password        │ Department │');
    console.log('  ├──────────────────────────────┼─────────────────┼────────────┤');
    for (const u of SEED_USERS.filter(u => u.role === 'admin')) {
        console.log(`  │ ${u.email.padEnd(28)} │ ${u.password.padEnd(15)} │ ${u.department.padEnd(10)} │`);
    }
    console.log('  └──────────────────────────────┴─────────────────┴────────────┘');
    console.log('');
    console.log('  FACULTY ACCOUNTS:');
    console.log('  ┌──────────────────────────────┬─────────────────┬────────────┬─────────┐');
    console.log('  │ Email                        │ Password        │ Department │ ERP ID  │');
    console.log('  ├──────────────────────────────┼─────────────────┼────────────┼─────────┤');
    for (const u of SEED_USERS.filter(u => u.role === 'faculty')) {
        console.log(`  │ ${u.email.padEnd(28)} │ ${u.password.padEnd(15)} │ ${u.department.padEnd(10)} │ ${u.erpId.padEnd(7)} │`);
    }
    console.log('  └──────────────────────────────┴─────────────────┴────────────┴─────────┘');
    console.log('');
    console.log('Done! You can now login at your app.');
    console.log('');
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
