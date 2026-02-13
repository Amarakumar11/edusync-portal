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
  updateLeaveRequestStatus,
} from '@/services/leaveService';
import { createNotification } from '@/services/notificationService';
import { LeaveRequest } from '@/types/leave';
import { FileText } from 'lucide-react';

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
    if (!user || user.role !== 'admin') {
      return;
    }

    try {
      const requests = await getLeaveRequestsByDepartment(user.department);
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
      await updateLeaveRequestStatus(leaveRequest.id, 'approved');
      await createNotification(
        'faculty',
        leaveRequest.department,
        `Your leave request has been approved by HOD (${user?.department})`,
        leaveRequest.facultyEmail
      );

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
      await createNotification(
        'faculty',
        leaveRequest.department,
        `Your leave request has been rejected by HOD (${user?.department})`,
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

  if (!user || user.role !== 'admin') {
    return null;
  }

  const pendingRequests = leaveRequests.filter((req) => req.status === 'pending');
  const resolvedRequests = leaveRequests.filter((req) => req.status !== 'pending');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests"
        description={`Manage leave requests for ${user.department} Department`}
      />

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Pending Requests</span>
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
                    <TableHead>From Date</TableHead>
                    <TableHead>To Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.facultyName}</TableCell>
                      <TableCell>{req.facultyErpId}</TableCell>
                      <TableCell>{req.fromDate}</TableCell>
                      <TableCell>{req.toDate}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
