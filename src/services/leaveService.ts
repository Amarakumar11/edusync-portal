// Firebase Firestore-based leave service

import { db } from '@/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { LeaveRequest } from '@/types/leave';

const LEAVE_COLLECTION = 'leaveRequests';

/**
 * Create a new leave request in Firestore
 */
export async function createLeaveRequest(
  facultyEmail: string,
  facultyName: string,
  facultyErpId: string,
  department: string,
  reason: string,
  fromDate: string,
  toDate: string
): Promise<LeaveRequest> {
  const leaveData = {
    facultyEmail,
    facultyName,
    facultyErpId,
    department,
    reason,
    fromDate,
    toDate,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, LEAVE_COLLECTION), leaveData);

  return {
    id: docRef.id,
    ...leaveData,
  } as LeaveRequest;
}

/**
 * Get all leave requests from Firestore
 */
export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const snap = await getDocs(
      query(collection(db, LEAVE_COLLECTION), orderBy('createdAt', 'desc'))
    );
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as LeaveRequest[];
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return [];
  }
}

/**
 * Get leave requests by department
 */
export async function getLeaveRequestsByDepartment(department: string): Promise<LeaveRequest[]> {
  try {
    const q = query(
      collection(db, LEAVE_COLLECTION),
      where('department', '==', department),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as LeaveRequest[];
  } catch (error) {
    console.error('Error fetching leave requests by department:', error);
    return [];
  }
}

/**
 * Get leave requests by faculty email
 */
export async function getLeaveRequestsByFaculty(email: string): Promise<LeaveRequest[]> {
  try {
    const q = query(
      collection(db, LEAVE_COLLECTION),
      where('facultyEmail', '==', email),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as LeaveRequest[];
  } catch (error) {
    console.error('Error fetching leave requests by faculty:', error);
    return [];
  }
}

/**
 * Update leave request status (approve/reject)
 */
export async function updateLeaveRequestStatus(
  leaveId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const docRef = doc(db, LEAVE_COLLECTION, leaveId);
  await updateDoc(docRef, { status });
}

/**
 * Delete a leave request
 */
export async function deleteLeaveRequest(leaveId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, LEAVE_COLLECTION, leaveId));
    return true;
  } catch (error) {
    console.error('Error deleting leave request:', error);
    return false;
  }
}

/**
 * Listen to leave requests by department in real-time
 */
export function onLeaveRequestsByDepartment(
  department: string,
  callback: (requests: LeaveRequest[]) => void
): Unsubscribe {
  const q = query(
    collection(db, LEAVE_COLLECTION),
    where('department', '==', department),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as LeaveRequest[];
    callback(requests);
  });
}

/**
 * Listen to leave requests by faculty email in real-time
 */
export function onLeaveRequestsByFaculty(
  email: string,
  callback: (requests: LeaveRequest[]) => void
): Unsubscribe {
  const q = query(
    collection(db, LEAVE_COLLECTION),
    where('facultyEmail', '==', email),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as LeaveRequest[];
    callback(requests);
  });
}
