// ⚠️ DEMO MODE: Data stored in localStorage, no backend, no Firebase

import { LeaveRequest } from '@/types/leave';

const LEAVE_STORAGE_KEY = 'edusync_leave_requests';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all leave requests from localStorage
 */
export function getAllLeaveRequests(): LeaveRequest[] {
  try {
    const data = localStorage.getItem(LEAVE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading leave requests from localStorage:', error);
    return [];
  }
}

/**
 * Create a new leave request
 */
export function createLeaveRequest(
  facultyEmail: string,
  facultyName: string,
  facultyErpId: string,
  department: string,
  reason: string,
  fromDate: string,
  toDate: string
): LeaveRequest {
  const leaveRequest: LeaveRequest = {
    id: generateId(),
    facultyEmail,
    facultyName,
    facultyErpId,
    department: department as any,
    reason,
    fromDate,
    toDate,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const allRequests = getAllLeaveRequests();
  allRequests.push(leaveRequest);

  try {
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(allRequests));
  } catch (error) {
    console.error('Error saving leave request to localStorage:', error);
  }

  return leaveRequest;
}

/**
 * Get leave requests by department
 */
export function getLeaveRequestsByDepartment(department: string): LeaveRequest[] {
  return getAllLeaveRequests().filter((req) => req.department === department);
}

/**
 * Get leave requests by faculty email
 */
export function getLeaveRequestsByFaculty(email: string): LeaveRequest[] {
  return getAllLeaveRequests().filter((req) => req.facultyEmail === email);
}

/**
 * Update leave request status
 */
export function updateLeaveRequestStatus(
  leaveId: string,
  status: 'approved' | 'rejected'
): LeaveRequest | null {
  const allRequests = getAllLeaveRequests();
  const leaveIndex = allRequests.findIndex((req) => req.id === leaveId);

  if (leaveIndex === -1) {
    return null;
  }

  allRequests[leaveIndex].status = status;

  try {
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(allRequests));
  } catch (error) {
    console.error('Error updating leave request:', error);
  }

  return allRequests[leaveIndex];
}

/**
 * Delete a leave request
 */
export function deleteLeaveRequest(leaveId: string): boolean {
  const allRequests = getAllLeaveRequests();
  const filteredRequests = allRequests.filter((req) => req.id !== leaveId);

  if (filteredRequests.length === allRequests.length) {
    return false; // Not found
  }

  try {
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(filteredRequests));
    return true;
  } catch (error) {
    console.error('Error deleting leave request:', error);
    return false;
  }
}
