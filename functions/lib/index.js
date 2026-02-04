"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveFaculty = exports.createFaculty = exports.createAdmin = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const auth = admin.auth();
const ALLOWED_DEPARTMENTS = new Set(['CSE', 'CSE_AIML', 'CSE_AIDS', 'CSE_DS', 'ECE', 'HS']);
function assertAdmin(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const token = context.auth.token;
    if (token?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only users with admin role can call this function.');
    }
}
function validateDepartment(department) {
    if (!department || typeof department !== 'string' || !ALLOWED_DEPARTMENTS.has(department)) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid department. Must be one of: ${Array.from(ALLOWED_DEPARTMENTS).join(', ')}`);
    }
}
// createAdmin(email, password, department)
exports.createAdmin = functions.https.onCall(async (data, context) => {
    assertAdmin(context);
    const email = data?.email;
    const password = data?.password;
    const department = data?.department;
    if (!email || !password || !department) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: email, password, department');
    }
    validateDepartment(department);
    try {
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
            // update password if provided
            await auth.updateUser(userRecord.uid, { password });
        }
        catch (err) {
            if (err.code && err.code === 'auth/user-not-found') {
                userRecord = await auth.createUser({ email, password });
            }
            else {
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
    }
    catch (err) {
        console.error('createAdmin error', err);
        throw new functions.https.HttpsError('internal', err.message || 'Failed to create admin');
    }
});
// createFaculty(email, password, department, name, erpId)
exports.createFaculty = functions.https.onCall(async (data, context) => {
    assertAdmin(context);
    const email = data?.email;
    const password = data?.password;
    const department = data?.department;
    const name = data?.name;
    const erpId = data?.erpId;
    if (!email || !password || !department || !name || !erpId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: email, password, department, name, erpId');
    }
    validateDepartment(department);
    try {
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
            await auth.updateUser(userRecord.uid, { password, displayName: name });
        }
        catch (err) {
            if (err.code && err.code === 'auth/user-not-found') {
                userRecord = await auth.createUser({ email, password, displayName: name });
            }
            else {
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
    }
    catch (err) {
        console.error('createFaculty error', err);
        throw new functions.https.HttpsError('internal', err.message || 'Failed to create faculty');
    }
});
// approveFaculty(uid, department)
exports.approveFaculty = functions.https.onCall(async (data, context) => {
    assertAdmin(context);
    const uid = data?.uid;
    const department = data?.department;
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
    }
    catch (err) {
        console.error('approveFaculty error', err);
        throw new functions.https.HttpsError('internal', err.message || 'Failed to approve faculty');
    }
});
