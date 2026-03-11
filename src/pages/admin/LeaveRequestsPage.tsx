// Firebase Firestore-based leave requests page for admin

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import {
  getLeaveRequestsByDepartment,
  getLeaveRequestsByStatus,
  updateLeaveRequestStatus,
  getAllLeaveRequests,
} from '@/services/leaveService';
import { createNotification } from '@/services/notificationService';
import { LeaveRequest } from '@/types/leave';
import { FileText, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { cn } from '@/lib/utils';

export function LeaveRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaveRequests();
  }, [user]);

  const loadLeaveRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let requests: LeaveRequest[] = [];

      if (user.role === 'hod') {
        requests = await getLeaveRequestsByDepartment(user.department);
      } else if (user.role === 'principal') {
        requests = await getAllLeaveRequests();
      }

      setLeaveRequests(
        requests.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveRequest: LeaveRequest) => {
    setProcessingId(leaveRequest.id);

    try {
      const nextStatus = user?.role === 'hod' ? 'pending_principal' : 'approved';
      await updateLeaveRequestStatus(leaveRequest.id, nextStatus);

      // Notify the requester
      const roleName = user?.role === 'hod' ? 'HOD' : 'Principal';
      const statusText = nextStatus.replace('_', ' ');
      const message = user?.role === 'hod'
        ? `Your leave request has been approved by HOD. Status: pending principal`
        : `Your leave request has been approved by Principal. Status: approved`;

      await createNotification(
        'faculty',
        leaveRequest.department,
        message,
        leaveRequest.facultyEmail
      );

      if (user?.role === 'hod') {
        // Notify Principal
        await createNotification(
          'principal',
          'ALL',
          `New leave request approved by ${leaveRequest.department} HOD. Waiting for your final approval.`,
          undefined
        );
      } else if (user?.role === 'principal') {
        // Notify other faculty only on final approval
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'faculty'), where('department', '==', leaveRequest.department));
        const colSnap = await getDocs(q);

        const notificationsPromises = colSnap.docs.map(docSnap => {
          const facultyData = docSnap.data();
          if (facultyData.email !== leaveRequest.facultyEmail) {
            return createNotification(
              'faculty',
              leaveRequest.department,
              `${leaveRequest.facultyName} is on leave. Please check substitution schedule.`,
              facultyData.email
            );
          }
          return Promise.resolve();
        });
        await Promise.all(notificationsPromises);
      }

      toast({
        title: 'Success',
        description: `Leave request approved for ${leaveRequest.facultyName}`,
      });

      await loadLeaveRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve leave request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (leaveRequest: LeaveRequest) => {
    setProcessingId(leaveRequest.id);

    try {
      await updateLeaveRequestStatus(leaveRequest.id, 'rejected');
      const roleName = user?.role === 'hod' ? 'HOD' : 'Principal';
      await createNotification(
        'faculty',
        leaveRequest.department,
        `Your leave request has been rejected by ${roleName}`,
        leaveRequest.facultyEmail
      );

      toast({
        title: 'Success',
        description: `Leave request rejected for ${leaveRequest.facultyName}`,
      });

      await loadLeaveRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject leave request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!user || (user.role !== 'hod' && user.role !== 'principal')) {
    return null;
  }

  const isActionable = (req: LeaveRequest) => {
    if (user.role === 'hod') return req.status === 'pending_hod';
    if (user.role === 'principal') return req.status === 'pending_principal';
    return false;
  };

  const isTracking = (req: LeaveRequest) => {
    if (user.role === 'hod') return req.status === 'pending_principal';
    return false;
  };

  const pendingRequests = leaveRequests.filter(isActionable);
  const trackingRequests = leaveRequests.filter(isTracking);
  const resolvedRequests = leaveRequests.filter((req) => !isActionable(req) && !isTracking(req) && req.status !== 'swaps_pending');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests"
        description={user.role === 'hod' ? `Manage leave requests for ${user.department} Department` : "Manage leave requests across all departments"}
      />

      {/* Actionable Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{user.role === 'principal' ? 'Pending Principal Approval' : 'Actionable Requests'}</span>
            {pendingRequests.length > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800">{pendingRequests.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <EmptyState title="Loading leave requests..." />
          ) : pendingRequests.length === 0 ? (
            <EmptyState
              title="No pending requests"
              description="All leave requests have been processed"
              icon={<FileText className="h-4 w-4" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty Name</TableHead>
                    <TableHead>ERP ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From Date</TableHead>
                    <TableHead>To Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((req) => (
                    <>
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                            >
                              {expandedId === req.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            {req.facultyName}
                          </div>
                        </TableCell>
                        <TableCell>{req.facultyErpId}</TableCell>
                        <TableCell className="capitalize">{req.type}</TableCell>
                        <TableCell>{req.fromDate} {req.fromTime?.split(' - ')[0]}</TableCell>
                        <TableCell>{req.toDate} {req.toTime?.split(' - ')[1]}</TableCell>
                        <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(req)}
                              disabled={processingId === req.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(req)}
                              disabled={processingId === req.id}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === req.id && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={7}>
                            <div className="p-4 space-y-4">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                Class Substitutions (Swaps)
                                <Badge variant="outline">{req.swaps?.length || 0} classes</Badge>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {req.swaps?.map(swap => (
                                  <div key={swap.id} className="text-xs p-3 border rounded-md bg-card">
                                    <div className="flex justify-between mb-1">
                                      <span className="font-bold">{swap.subject}</span>
                                      <span className="text-muted-foreground">{swap.date}</span>
                                    </div>
                                    <div className="text-muted-foreground mb-2">{swap.slot} • Room {swap.room}</div>
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                      <span className="font-medium">Substitute:</span>
                                      {swap.status === 'accepted' ? (
                                        <div className="flex items-center gap-1 text-green-600">
                                          <CheckCircle className="h-3 w-3" />
                                          <span>{swap.acceptedByName}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-amber-500">
                                          <Clock className="h-3 w-3" />
                                          <span>{swap.requestToName || 'Open to All'}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {(!req.swaps || req.swaps.length === 0) && (
                                  <p className="text-muted-foreground italic text-xs">No classes affected by this leave.</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracking Requests (For HOD) */}
      {user.role === 'hod' && trackingRequests.length > 0 && (
        <Card className="border-blue-100 bg-blue-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Clock className="h-5 w-5" />
              <span>Pending Principal Approval</span>
              <Badge variant="outline" className="border-blue-200 text-blue-700">{trackingRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.facultyName}</TableCell>
                      <TableCell className="capitalize">{req.type}</TableCell>
                      <TableCell>{req.fromDate}</TableCell>
                      <TableCell>{req.toDate}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          Waiting for Principal
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolved Requests */}
      {resolvedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resolved Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty Name</TableHead>
                    <TableHead>ERP ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From Date</TableHead>
                    <TableHead>To Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resolvedRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.facultyName}</TableCell>
                      <TableCell>{req.facultyErpId}</TableCell>
                      <TableCell className="capitalize">{req.type}</TableCell>
                      <TableCell>{req.fromDate}</TableCell>
                      <TableCell>{req.toDate}</TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LeaveRequestsPage;
