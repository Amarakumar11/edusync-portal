// ⚠️ DEMO MODE: Data stored in localStorage, no backend, no Firebase

import { Notification } from '@/types/leave';

const NOTIFICATION_STORAGE_KEY = 'edusync_notifications';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all notifications from localStorage
 */
export function getAllNotifications(): Notification[] {
  try {
    const data = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading notifications from localStorage:', error);
    return [];
  }
}

/**
 * Create a new notification
 */
export function createNotification(
  toRole: 'admin' | 'faculty',
  toDepartment: string,
  message: string,
  toEmail?: string
): Notification {
  const notification: Notification = {
    id: generateId(),
    toRole,
    toDepartment: toDepartment as any,
    toEmail,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const allNotifications = getAllNotifications();
  allNotifications.push(notification);

  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(allNotifications));
  } catch (error) {
    console.error('Error saving notification to localStorage:', error);
  }

  return notification;
}

/**
 * Get notifications for faculty
 */
export function getFacultyNotifications(email: string): Notification[] {
  return getAllNotifications().filter(
    (notif) => notif.toRole === 'faculty' && notif.toEmail === email
  );
}

/**
 * Get notifications for admin by department
 */
export function getAdminNotifications(department: string): Notification[] {
  return getAllNotifications().filter(
    (notif) => notif.toRole === 'admin' && notif.toDepartment === department
  );
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId: string): Notification | null {
  const allNotifications = getAllNotifications();
  const notifIndex = allNotifications.findIndex((notif) => notif.id === notificationId);

  if (notifIndex === -1) {
    return null;
  }

  allNotifications[notifIndex].read = true;

  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(allNotifications));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }

  return allNotifications[notifIndex];
}

/**
 * Mark all notifications as read for a user
 */
export function markAllNotificationsAsRead(email: string): void {
  const allNotifications = getAllNotifications();
  const updated = allNotifications.map((notif) => {
    if (notif.toEmail === email && notif.toRole === 'faculty' && !notif.read) {
      return { ...notif, read: true };
    }
    return notif;
  });

  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

/**
 * Delete a notification
 */
export function deleteNotification(notificationId: string): boolean {
  const allNotifications = getAllNotifications();
  const filteredNotifications = allNotifications.filter(
    (notif) => notif.id !== notificationId
  );

  if (filteredNotifications.length === allNotifications.length) {
    return false; // Not found
  }

  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(filteredNotifications));
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}
