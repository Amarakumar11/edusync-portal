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
const auth = admin.auth();

// ── Seed data ────────────────────────────────────
const SEED_USERS = [
  { email: 'principal@edusync.com', password: 'Admin@prin123', name: 'Principal', phone: '+919999999999', erpId: 'PRINCIPAL', role: 'principal', department: 'ALL' },
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
