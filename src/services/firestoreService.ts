import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  Admin,
  FacultyProfile,
  Timetable,
  LeaveRequest,
  Announcement,
  Event,
  Notification,
  Note,
  ExamSchedule,
} from '../types/firestore';

// Generic CRUD helpers
export async function createDoc<T>(col: string, data: T, id?: string) {
  if (id) {
    await setDoc(doc(db, col, id), data as any);
    return id;
  } else {
    const ref = await addDoc(collection(db, col), data as any);
    return ref.id;
  }
}

export async function readDoc<T>(col: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? (snap.data() as T) : null;
}

export async function updateDocData<T>(col: string, id: string, data: Partial<T>) {
  await updateDoc(doc(db, col, id), data as any);
}

export async function deleteDocData(col: string, id: string) {
  await deleteDoc(doc(db, col, id));
}

export async function readAllDocs<T>(col: string): Promise<T[]> {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map((d) => d.data() as T);
}

export function onCollectionSnapshot<T>(col: string, cb: (data: T[]) => void) {
  return onSnapshot(collection(db, col), (snap: QuerySnapshot<DocumentData>) => {
    cb(snap.docs.map((d) => d.data() as T));
  });
}

// Create faculty profile after signup
export async function createFacultyProfile(profile: FacultyProfile) {
  return createDoc<FacultyProfile>('faculties', profile, profile.uid);
}

// Create leave request
export async function createLeaveRequest(request: LeaveRequest) {
  return createDoc<LeaveRequest>('leaveRequests', request);
}

// Approve/reject leave request
export async function updateLeaveRequestStatus(id: string, status: 'approved' | 'rejected') {
  return updateDocData<LeaveRequest>('leaveRequests', id, { status } as any);
}

// Send notification to one user
export async function sendNotificationToUser(notification: Notification, userId: string) {
  return createDoc<Notification>(`faculties/${userId}/notifications`, notification);
}

// Broadcast notification to all faculties
export async function broadcastNotification(notification: Notification) {
  const faculties = await readAllDocs<FacultyProfile>('faculties');
  await Promise.all(faculties.map((f) => sendNotificationToUser(notification, f.uid)));
}

// Get announcements in real time
export function getAnnouncementsRealtime(cb: (data: Announcement[]) => void) {
  return onCollectionSnapshot<Announcement>('announcements', cb);
}

// Fetch announcements in real time (alias)
export function onAnnouncementsSnapshot(cb: (data: Announcement[]) => void) {
  return onCollectionSnapshot<Announcement>('announcements', cb);
}
