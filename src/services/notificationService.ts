// Firebase Firestore-based notification service

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
  writeBatch,
} from 'firebase/firestore';
import { Notification } from '@/types/leave';

const NOTIFICATION_COLLECTION = 'notifications';

/**
 * Create a new notification in Firestore
 */
export async function createNotification(
  toRole: 'hod' | 'faculty' | 'principal',
  toDepartment: string,
  message: string,
  toEmail?: string
): Promise<Notification> {
  const notifData = {
    toRole,
    toDepartment: toDepartment,
    toEmail: toEmail || null,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const docRef = await addDoc(collection(db, NOTIFICATION_COLLECTION), notifData);

  return {
    id: docRef.id,
    ...notifData,
  } as unknown as Notification;
}

/**
 * Get all notifications from Firestore
 */
export async function getAllNotifications(): Promise<Notification[]> {
  try {
    const snap = await getDocs(
      query(collection(db, NOTIFICATION_COLLECTION), orderBy('createdAt', 'desc'))
    );
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as unknown as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}


// Define a converter for your Notification type
const notificationConverter = {
  toFirestore: (notification: Notification) => {
    // Exclude the 'id' when writing to Firestore, as it's the document key
    const { id, ...data } = notification;
    return data;
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as Notification; // Safe casting because we know the shape
  }
};

/**
 * Get notifications for a faculty member by email
 */
// Now your queries become type-safe and much cleaner:
export async function getFacultyNotifications(email: string, department?: string): Promise<Notification[]> {
  try {
    const qPersonal = query(
      collection(db, NOTIFICATION_COLLECTION).withConverter(notificationConverter),
      where('toRole', '==', 'faculty'),
      where('toEmail', '==', email)
    );
    const snapPersonal = await getDocs(qPersonal);
    let results = snapPersonal.docs.map(doc => doc.data());

    if (department) {
      const qDept = query(
        collection(db, NOTIFICATION_COLLECTION).withConverter(notificationConverter),
        where('toRole', '==', 'faculty'),
        where('toEmail', '==', null),
        where('toDepartment', '==', department)
      );
      const snapDept = await getDocs(qDept);
      results = [...results, ...snapDept.docs.map(doc => doc.data())];
    }

    // Remove duplicates based on ID and sort
    const uniqueResults = results.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    return uniqueResults.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching faculty notifications:', error);
    return [];
  }
}

/**
 * Get notifications for HOD by department
 */
export async function getHODNotifications(department: string): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, NOTIFICATION_COLLECTION),
      where('toRole', '==', 'hod'),
      where('toDepartment', '==', department)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as unknown as Notification[];
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const docRef = doc(db, NOTIFICATION_COLLECTION, notificationId);
  await updateDoc(docRef, { read: true });
}

/**
 * Mark all notifications as read for a faculty email
 */
export async function markAllNotificationsAsRead(email: string): Promise<void> {
  try {
    const q = query(
      collection(db, NOTIFICATION_COLLECTION),
      where('toRole', '==', 'faculty'),
      where('toEmail', '==', email),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, NOTIFICATION_COLLECTION, notificationId));
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

/**
 * Listen for HOD notifications in real-time
 */
export function onHODNotifications(
  department: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, NOTIFICATION_COLLECTION),
    where('toRole', '==', 'hod'),
    where('toDepartment', '==', department)
  );
  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as unknown as Notification[];
    notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(notifs);
  });
}

/**
 * Listen for faculty notifications in real-time
 */
export function onFacultyNotifications(
  email: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, NOTIFICATION_COLLECTION),
    where('toRole', '==', 'faculty'),
    where('toEmail', '==', email)
  );
  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as unknown as Notification[];
    notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(notifs);
  });
}
