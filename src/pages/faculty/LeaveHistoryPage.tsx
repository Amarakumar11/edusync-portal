import { useState } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { format } from 'date-fns';
import type { LeaveStatus, LeaveType } from '@/types';

interface LeaveRecord {
  id: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  createdAt: Date;
}

const mockLeaveHistory: LeaveRecord[] = [
  {
    id: '1',
    type: 'casual',
    startDate: new Date(2024, 0, 15),
    endDate: new Date(2024, 0, 15),
    reason: 'Personal work',
    status: 'approved',
    createdAt: new Date(2024, 0, 10),
  },
  {
    id: '2',
    type: 'sick',
    startDate: new Date(2024, 0, 22),
    endDate: new Date(2024, 0, 23),
    reason: 'Medical appointment',
    status: 'approved',
    createdAt: new Date(2024, 0, 20),
  },
  {
    id: '3',
    type: 'paid',
    startDate: new Date(2024, 1, 5),
    endDate: new Date(2024, 1, 6),
    reason: 'Family function',
    status: 'pending',
    createdAt: new Date(2024, 1, 1),
  },
  {
    id: '4',
    type: 'casual',
    startDate: new Date(2024, 1, 12),
    endDate: new Date(2024, 1, 12),
    reason: 'Personal emergency',
    status: 'rejected',
    createdAt: new Date(2024, 1, 8),
  },
];

const getStatusBadge = (status: LeaveStatus) => {
  switch (status) {
    case 'approved':
      return <Badge className="badge-success">Approved</Badge>;
    case 'rejected':
      return <Badge className="badge-destructive">Rejected</Badge>;
    case 'pending':
      return <Badge className="badge-warning">Pending</Badge>;
  }
};

const getTypeBadge = (type: LeaveType) => {
  switch (type) {
    case 'casual':
      return <Badge variant="outline" className="border-destructive/50 text-destructive">Casual</Badge>;
    case 'paid':
      return <Badge variant="outline" className="border-warning/50 text-warning">Paid</Badge>;
    case 'sick':
      return <Badge variant="outline" className="border-info/50 text-info">Sick</Badge>;
  }
};

export function LeaveHistoryPage() {
  const [filter, setFilter] = useState<'all' | LeaveStatus>('all');
  const [monthFilter, setMonthFilter] = useState<string>('current');

  const filteredHistory = mockLeaveHistory.filter(leave => {
    if (filter !== 'all' && leave.status !== filter) return false;
    
    const now = new Date();
    if (monthFilter === 'current') {
      return leave.createdAt.getMonth() === now.getMonth() &&
             leave.createdAt.getFullYear() === now.getFullYear();
    } else if (monthFilter === 'previous') {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return leave.createdAt.getMonth() === prevMonth &&
             leave.createdAt.getFullYear() === prevYear;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Leave History"
        description="View your past leave applications"
      >
        <div className="flex items-center gap-3">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">This Month</SelectItem>
              <SelectItem value="previous">Last Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[130px]">
              <Filter className="mr-2 h-4 w-4" />
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
      </PageHeader>

      <DataCard title="Leave Records" contentClassName="p-0">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No leave records found for the selected period.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="hidden sm:table-cell">Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Applied On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((leave) => (
                <TableRow key={leave.id} className="table-row-hover">
                  <TableCell>{getTypeBadge(leave.type)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(leave.startDate, 'MMM d')}
                      {leave.startDate.getTime() !== leave.endDate.getTime() && (
                        <> - {format(leave.endDate, 'MMM d')}</>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                    {leave.reason}
                  </TableCell>
                  <TableCell>{getStatusBadge(leave.status)}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {format(leave.createdAt, 'PPP')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>
    </div>
  );
}

export default LeaveHistoryPage;
