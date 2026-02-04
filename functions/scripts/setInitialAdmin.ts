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
  const keyPath = path.resolve(__dirname, "../secrets/serviceAccountKey.json");
  if (!fs.existsSync(keyPath)) {
    console.error(`No service account found at ${keyPath} and GOOGLE_APPLICATION_CREDENTIALS is not set.`);
    console.error("Create a service account key in Firebase Console and set GOOGLE_APPLICATION_CREDENTIALS or place the file at functions/secrets/serviceAccountKey.json (never commit it)");
    process.exit(1);
  }
  const serviceAccount = require(keyPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

async function run() {
  try {
    await admin.auth().setCustomUserClaims(uid, { role: "admin", department });

    await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .set({ role: "admin", department }, { merge: true });

    console.log(`✅ Successfully set user ${uid} as admin in department ${department}`);
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Error setting initial admin:", err);
    process.exit(1);
  }
}

run();
