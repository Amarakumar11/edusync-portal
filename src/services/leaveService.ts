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
  type: 'casual' | 'paid' | 'sick',
  reason: string,
  fromDate: string,
  toDate: string,
  durationInDays: number,
  swaps: any[],
  fromTime?: string,
  toTime?: string
): Promise<LeaveRequest> {
  const initialStatus = swaps.length > 0 ? 'swaps_pending' : 'pending_hod';

  const leaveData = {
    facultyEmail,
    facultyName,
    facultyErpId,
    department,
    type,
    reason,
    fromDate,
    toDate,
    fromTime,
    toTime,
    durationInDays,
    swaps,
    status: initialStatus as 'swaps_pending' | 'pending_hod',
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
      where('department', '==', department)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as LeaveRequest[];
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      where('facultyEmail', '==', email)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as LeaveRequest[];
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching leave requests by faculty:', error);
    return [];
  }
}

export async function updateLeaveRequestStatus(
  leaveId: string,
  status: 'swaps_pending' | 'pending_hod' | 'pending_principal' | 'approved' | 'rejected' | 'cancelled'
): Promise<void> {
  const docRef = doc(db, LEAVE_COLLECTION, leaveId);
  await updateDoc(docRef, { status });
}

/**
 * Accept a swap request within a leave request
 */
export async function acceptLeaveSwap(
  leaveId: string,
  swapId: string,
  acceptorEmail: string,
  acceptorName: string,
  currentSwaps: any[]
): Promise<void> {
  const updatedSwaps = currentSwaps.map(swap => {
    if (swap.id === swapId) {
      return {
        ...swap,
        status: 'accepted',
        acceptedByEmail: acceptorEmail,
        acceptedByName: acceptorName
      };
    }
    return swap;
  });

  // Check if all swaps are now accepted
  const allAccepted = updatedSwaps.every(s => s.status === 'accepted');
  const updates: any = { swaps: updatedSwaps };

  if (allAccepted) {
    updates.status = 'pending_hod';
  }

  const docRef = doc(db, LEAVE_COLLECTION, leaveId);
  await updateDoc(docRef, updates);
}

/**
 * Cancel a swap request (if the requested faculty rejects it)
 */
export async function rejectLeaveSwap(
  leaveId: string,
  swapId: string,
  currentSwaps: any[]
): Promise<void> {
  const updatedSwaps = currentSwaps.map(swap => {
    if (swap.id === swapId) {
      return {
        ...swap,
        status: 'rejected',
      };
    }
    return swap;
  });

  const docRef = doc(db, LEAVE_COLLECTION, leaveId);
  await updateDoc(docRef, { swaps: updatedSwaps });
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
    where('department', '==', department)
  );
  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as LeaveRequest[];
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    where('facultyEmail', '==', email)
  );
  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as LeaveRequest[];
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(requests);
  });
}
