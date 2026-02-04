import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

// Usage:
// npx ts-node scripts/setInitialAdmin.ts <UID> <DEPARTMENT>

const uid = process.argv[2];
const department = (process.argv[3] || "CSE").toUpperCase();

const ALLOWED_DEPARTMENTS = new Set(["CSE", "CSE_AIML", "CSE_AIDS", "CSE_DS", "ECE", "HS"]);

if (!uid) {
  console.error("Usage: npx ts-node scripts/setInitialAdmin.ts <UID> <DEPARTMENT(optional)>");
  console.error("Example: npx ts-node scripts/setInitialAdmin.ts seHpc2KkpJgcj3Uf0b7CspsSF3y2 CSE");
  process.exit(1);
}

if (!ALLOWED_DEPARTMENTS.has(department)) {
  console.error(`Invalid department: ${department}. Must be one of: ${Array.from(ALLOWED_DEPARTMENTS).join(", ")}`);
  process.exit(1);
}

// Initialize Admin SDK
// Prefer GOOGLE_APPLICATION_CREDENTIALS env var; if not set, try to load local secrets/serviceAccountKey.json
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp();
} else {
  // Try common locations: ./secrets/serviceAccountKey.json (from cwd), or relative to this script using __dirname if available
  const cwdKey = path.resolve(process.cwd(), 'secrets/serviceAccountKey.json');
  let keyPath = '';
  if (fs.existsSync(cwdKey)) {
    keyPath = cwdKey;
  } else {
    try {
      // __dirname may be available when running ts-node; if so, check relative path
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const alt = path.resolve(__dirname, '../secrets/serviceAccountKey.json');
      if (fs.existsSync(alt)) {
        keyPath = alt;
      }
    } catch (_) {
      // ignore
    }
  }

  if (!keyPath) {
    console.error(`No service account found at ${cwdKey} and GOOGLE_APPLICATION_CREDENTIALS is not set.`);
    console.error("Create a service account key in Firebase Console and set GOOGLE_APPLICATION_CREDENTIALS or place the file at functions/secrets/serviceAccountKey.json (never commit it)");
    process.exit(1);
  }

  const raw = fs.readFileSync(keyPath, 'utf8');
  let serviceAccount: any;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (e: any) {
    console.error(`Service account JSON at ${keyPath} is invalid:`, e.message || e);
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

async function run() {
  try {
    const userRecord = await admin.auth().getUser(uid).catch(() => null);
    console.log('Target UID:', uid, 'User exists:', !!userRecord);
    console.log('Project ID (admin.app().options.projectId):', admin.app().options.projectId);

    await admin.auth().setCustomUserClaims(uid, { role: "admin", department });
    console.log('Custom claims set. Testing Firestore access...');

    // Test Firestore access by listing collections (non-destructive).
    try {
      const cols = await admin.firestore().listCollections();
      console.log('Firestore accessible. Existing top-level collections:', cols.map(c => c.id));
    } catch (e: any) {
      console.error('Firestore access test failed. This usually means Firestore is not enabled for the project or the service account lacks permissions.');
      console.error('Error from Firestore:', e.message || e);
      throw e;
    }

    await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .set({ role: "admin", department }, { merge: true });

    console.log(`✅ Successfully set user ${uid} as admin in department ${department}`);
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Error setting initial admin:", err);
    // Additional guidance for common errors
    if (err && err.code === 5) {
      console.error('gRPC Code 5 (NOT_FOUND) typically indicates Firestore is not enabled in the Firebase project, or the service account/project ID is mismatched.');
      console.error('Check the service account JSON project_id matches your Firebase project, and ensure Firestore is enabled in the Firebase Console.');
    }
    process.exit(1);
  }
}

run();
