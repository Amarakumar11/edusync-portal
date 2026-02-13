import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load service account ─────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = resolve(__dirname, '../serviceAccountKey.json');

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
db.settings({ databaseId: 'default' });
const auth = admin.auth();

// ── Seed data ────────────────────────────────────
const SEED_USERS = [
  { email: 'hod.cse@edusync.com', password: 'Admin@cse123', name: 'HOD CSE', phone: '+919876543210', erpId: 'HOD_CSE', role: 'admin', department: 'CSE' },
  { email: 'hod.cse_aiml@edusync.com', password: 'Admin@csm123', name: 'HOD CSE (AIML)', phone: '+919876543211', erpId: 'HOD_CSE_AIML', role: 'admin', department: 'CSE_AIML' },
  { email: 'hod.cse_aids@edusync.com', password: 'Admin@aids123', name: 'HOD CSE (AIDS)', phone: '+919876543212', erpId: 'HOD_CSE_AIDS', role: 'admin', department: 'CSE_AIDS' },
  { email: 'hod.cse_ds@edusync.com', password: 'Admin@ds123', name: 'HOD CSE (DS)', phone: '+919876543213', erpId: 'HOD_CSE_DS', role: 'admin', department: 'CSE_DS' },
  { email: 'hod.ece@edusync.com', password: 'Admin@ece123', name: 'HOD ECE', phone: '+919876543214', erpId: 'HOD_ECE', role: 'admin', department: 'ECE' },
  { email: 'hod.hs@edusync.com', password: 'Admin@hs123', name: 'HOD HS', phone: '+919876543215', erpId: 'HOD_HS', role: 'admin', department: 'HS' },
  { email: 'faculty1@edusync.com', password: 'Faculty@cse123', name: 'Dr. Ramesh Kumar', phone: '+919876543301', erpId: 'ERP001', role: 'faculty', department: 'CSE' },
  { email: 'faculty2@edusync.com', password: 'Faculty@csm123', name: 'Dr. Priya Sharma', phone: '+919876543302', erpId: 'ERP002', role: 'faculty', department: 'CSE_AIML' },
  { email: 'faculty3@edusync.com', password: 'Faculty@aids123', name: 'Prof. Suresh Reddy', phone: '+919876543303', erpId: 'ERP003', role: 'faculty', department: 'CSE_AIDS' },
  { email: 'faculty4@edusync.com', password: 'Faculty@ece123', name: 'Dr. Anitha Rao', phone: '+919876543304', erpId: 'ERP004', role: 'faculty', department: 'ECE' },
];

async function seedUser(user) {
  const { email, password, name, phone, erpId, role, department } = user;
  let uid;

  try {
    // Create or get Auth user
    try {
      const u = await auth.createUser({ email, password });
      uid = u.uid;
      console.log(`✅ Created Auth: ${email}`);
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        const existing = await auth.getUserByEmail(email);
        uid = existing.uid;
        console.log(`⚡ Exists Auth: ${email}`);
      } else throw e;
    }

    // Firestore profile
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();

    if (snap.exists) {
      console.log(`⚡ Firestore exists: ${email}`);
      return;
    }

    await ref.set({
      uid,
      name,
      email,
      phone,
      erpId,
      role,
      department,
      createdAt: new Date(),
    });

    console.log(`✅ Firestore created: ${email}`);
  } catch (err) {
    console.error(`❌ ${email}:`, err.message);
  }
}

async function main() {
  console.log(`Seeding ${SEED_USERS.length} users...\n`);
  for (const u of SEED_USERS) {
    await seedUser(u);
  }
  console.log('\nDone.');
  process.exit(0);
}

main();
