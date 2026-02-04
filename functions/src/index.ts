import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

const ALLOWED_DEPARTMENTS = new Set(['CSE','CSE_AIML','CSE_AIDS','CSE_DS','ECE','HS']);

type CallerContext = functions.https.CallableContext;

function assertAdmin(context: CallerContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const token = context.auth.token as any;
  if (token?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only users with admin role can call this function.');
  }
}

function validateDepartment(department: string) {
  if (!department || typeof department !== 'string' || !ALLOWED_DEPARTMENTS.has(department)) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid department. Must be one of: ${Array.from(ALLOWED_DEPARTMENTS).join(', ')}`);
  }
}

// createAdmin(email, password, department)
export const createAdmin = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const email = data?.email as string | undefined;
  const password = data?.password as string | undefined;
  const department = data?.department as string | undefined;

  if (!email || !password || !department) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: email, password, department');
  }
  validateDepartment(department);

  try {
    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      // update password if provided
      await auth.updateUser(userRecord.uid, { password });
    } catch (err: any) {
      if (err.code && err.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({ email, password });
      } else {
        throw err;
      }
    }

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin', department });

    // Update Firestore user doc
    await db.collection('users').doc(userRecord.uid).set({
      name: data?.name || null,
      email,
      role: 'admin',
      department
    }, { merge: true });

    return { success: true, uid: userRecord.uid };
  } catch (err: any) {
    console.error('createAdmin error', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to create admin');
  }
});

// createFaculty(email, password, department, name, erpId)
export const createFaculty = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const email = data?.email as string | undefined;
  const password = data?.password as string | undefined;
  const department = data?.department as string | undefined;
  const name = data?.name as string | undefined;
  const erpId = data?.erpId as string | undefined;

  if (!email || !password || !department || !name || !erpId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: email, password, department, name, erpId');
  }
  validateDepartment(department);

  try {
    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      await auth.updateUser(userRecord.uid, { password, displayName: name });
    } catch (err: any) {
      if (err.code && err.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({ email, password, displayName: name });
      } else {
        throw err;
      }
    }

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role: 'faculty', department });

    // Create or update Firestore user doc
    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      role: 'faculty',
      department,
      erpId,
      approved: false
    }, { merge: true });

    return { success: true, uid: userRecord.uid };
  } catch (err: any) {
    console.error('createFaculty error', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to create faculty');
  }
});

// approveFaculty(uid, department)
export const approveFaculty = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const uid = data?.uid as string | undefined;
  const department = data?.department as string | undefined;

  if (!uid || !department) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: uid, department');
  }
  validateDepartment(department);

  try {
    const userRecord = await auth.getUser(uid);
    // Update claims to ensure faculty role and department
    await auth.setCustomUserClaims(uid, { role: 'faculty', department });

    // Update Firestore user doc
    await db.collection('users').doc(uid).set({
      role: 'faculty',
      department,
      approved: true
    }, { merge: true });

    return { success: true, uid };
  } catch (err: any) {
    console.error('approveFaculty error', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to approve faculty');
  }
});
