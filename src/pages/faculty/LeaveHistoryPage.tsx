import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Filter } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { getLeaveRequestsByFaculty, deleteLeaveRequest, updateLeaveRequestStatus } from '@/services/leaveService';
import { LeaveRequest } from '@/types/leave';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle } from 'lucide-react';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200">Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100/80 border-red-200">Rejected</Badge>;
    case 'cancelled':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100/80 border-gray-200">Cancelled</Badge>;
    case 'swaps_pending':
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100/80 border-purple-200">Pending Swaps</Badge>;
    case 'pending_hod':
    case 'pending_principal':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200">Pending Approval</Badge>;
    default:
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200">Pending</Badge>;
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'casual':
      return <Badge variant="outline" className="border-red-500/50 text-red-600">Casual</Badge>;
    case 'paid':
      return <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">Paid</Badge>;
    case 'sick':
      return <Badge variant="outline" className="border-blue-500/50 text-blue-600">Sick</Badge>;
    default:
      return <Badge variant="outline" className="capitalize">{type}</Badge>;
  }
};

export function LeaveHistoryPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('current');
  const [history, setHistory] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      loadHistoryAndCleanup(user.email);
    }
  }, [user]);

  const loadHistoryAndCleanup = async (email: string) => {
    setLoading(true);
    try {
      const reqs = await getLeaveRequestsByFaculty(email);
      const validReqs: LeaveRequest[] = [];
      const now = new Date();

      // Auto-delete older than 60 days
      for (const req of reqs) {
        if (differenceInDays(now, parseISO(req.createdAt)) > 60) {
          await deleteLeaveRequest(req.id);
        } else {
          validReqs.push(req);
        }
      }

      // sort by descending date
      validReqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setHistory(validReqs);
    } catch (error) {
      console.error('Error fetching leave history', error);
      toast.error('Failed to load leave history');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(leave => {
    if (filter !== 'all' && leave.status !== filter) return false;

    const now = new Date();
    const createdAt = parseISO(leave.createdAt);
    if (monthFilter === 'current') {
      return createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear();
    } else if (monthFilter === 'previous') {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return createdAt.getMonth() === prevMonth &&
        createdAt.getFullYear() === prevYear;
    }
    return true;
  });

  const handleCancelLeave = async (leaveId: string) => {
    if (!window.confirm("Are you sure you want to cancel this leave application? This will also cancel any requested swaps.")) return;
    try {
      await updateLeaveRequestStatus(leaveId, 'cancelled');
      toast.success("Leave request cancelled successfully");
      loadHistoryAndCleanup(user.email!);
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel leave request");
    }
  };

  if (!user || user.role !== 'faculty') return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <PageHeader
          title="Leave History"
          description="View your past leave applications"
        />
        <div className="flex items-center gap-3">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">This Month</SelectItem>
              <SelectItem value="previous">Last Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataCard title="Leave Records" contentClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading leave history...</div>
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            title="No leave records found"
            description="No leave records match the selected filters."
            icon={<Calendar className="h-6 w-6 text-muted-foreground" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="hidden sm:table-cell">Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Applied On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((leave) => {
                  const startDate = parseISO(leave.fromDate);
                  const endDate = parseISO(leave.toDate);
                  return (
                    <TableRow key={leave.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>{getTypeBadge(leave.type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(startDate, 'MMM d, yyyy')}
                          {leave.fromTime && <span className="text-muted-foreground ml-1">({leave.fromTime.split(' - ')[0]})</span>}

                          {startDate.getTime() !== endDate.getTime() ? (
                            <>
                              <div className="my-0.5 text-muted-foreground/50 text-xs">to</div>
                              {format(endDate, 'MMM d, yyyy')}
                              {leave.toTime && <span className="text-muted-foreground ml-1">({leave.toTime.split(' - ')[1]})</span>}
                            </>
                          ) : (
                            leave.fromTime && leave.toTime && (
                              <>
                                <span className="mx-1 text-muted-foreground text-xs">to</span>
                                <span className="text-muted-foreground">({leave.toTime.split(' - ')[1]})</span>
                              </>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-[200px] truncate" title={leave.reason}>
                        {leave.reason}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(leave.status)}
                          {leave.swaps?.some((s: any) => s.status === 'rejected') && (
                            <span className="flex items-center text-xs text-destructive mt-1 font-medium">
                              <AlertCircle className="w-3 h-3 mr-1" /> Swap Rejected
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {format(parseISO(leave.createdAt), 'PPP')}
                      </TableCell>
                      <TableCell className="text-right">
                        {['swaps_pending', 'pending_hod', 'pending_principal', 'pending'].includes(leave.status) && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleCancelLeave(leave.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DataCard>
    </div>
  );
}

export default LeaveHistoryPage;
