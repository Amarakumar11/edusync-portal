import * as admin from "firebase-admin";
import * as path from "path";

// Usage:
// npx ts-node scripts/setInitialAdmin.ts <UID> <DEPARTMENT>

const uid = process.argv[2];
const department = process.argv[3] || "CSE";

if (!uid) {
  console.error("Usage: npx ts-node scripts/setInitialAdmin.ts <UID> <DEPARTMENT>");
  process.exit(1);
}

// Initialize Admin SDK using the JSON key file
admin.initializeApp({
  credential: admin.credential.cert(
    require(path.resolve("../../secrets/serviceAccountKey.json"))
  ),
});

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
