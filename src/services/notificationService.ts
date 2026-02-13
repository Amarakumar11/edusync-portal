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
  toRole: 'admin' | 'faculty',
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

/**
 * Get notifications for a faculty member by email
 */
export async function getFacultyNotifications(email: string): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, NOTIFICATION_COLLECTION),
      where('toRole', '==', 'faculty'),
      where('toEmail', '==', email),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as unknown as Notification[];
  } catch (error) {
    console.error('Error fetching faculty notifications:', error);
    return [];
  }
}

/**
 * Get notifications for admin by department
 */
export async function getAdminNotifications(department: string): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, NOTIFICATION_COLLECTION),
      where('toRole', '==', 'admin'),
      where('toDepartment', '==', department),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as unknown as Notification[];
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
 * Listen for admin notifications in real-time
 */
export function onAdminNotifications(
  department: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, NOTIFICATION_COLLECTION),
    where('toRole', '==', 'admin'),
    where('toDepartment', '==', department),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as unknown as Notification[];
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
    where('toEmail', '==', email),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as unknown as Notification[];
    callback(notifs);
  });
}
