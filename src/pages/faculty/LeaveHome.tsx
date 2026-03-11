import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLeaveRequestsByFaculty } from '@/services/leaveService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, CheckCircle2, XCircle, Clock, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { acceptLeaveSwap, rejectLeaveSwap } from '@/services/leaveService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Badge } from '@/components/ui/badge';

// Removed static leaveBalance

// Replaced mock leave data with state

const getLeaveColor = (type: string) => {
  switch (type) {
    case 'casual': return 'bg-destructive';
    case 'sick': return 'bg-info';
    case 'paid': return 'bg-warning';
    default: return 'bg-success';
  }
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export function LeaveHome() {
  const { user } = useAuth();
  const [currentDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());

  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<Record<string, number>>({});
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [pendingSwaps, setPendingSwaps] = useState<{ leave: any, swap: any }[]>([]);
  const [acceptedSwaps, setAcceptedSwaps] = useState<{ leave: any, swap: any }[]>([]);

  const fetchSwaps = async () => {
    if (!user?.email || !user?.department) return;
    try {
      const q = query(
        collection(db, 'leaveRequests'),
        where('status', 'in', ['swaps_pending', 'pending_hod', 'pending_principal', 'approved'])
      );
      const snap = await getDocs(q);
      const pendingList: any[] = [];
      const acceptedList: any[] = [];

      snap.docs.forEach(d => {
        const leave = { id: d.id, ...d.data() } as any;

        leave.swaps?.forEach((swap: any) => {
          if (swap.status === 'pending' && (!swap.requestToEmail || swap.requestToEmail === user.email) && leave.facultyEmail !== user.email) {
            pendingList.push({ leave, swap });
          }
          if (swap.status === 'accepted' && swap.acceptedByEmail === user.email) {
            acceptedList.push({ leave, swap });
          }
        });
      });
      setPendingSwaps(pendingList);
      setAcceptedSwaps(acceptedList.sort((a, b) => new Date(a.swap.date).getTime() - new Date(b.swap.date).getTime()));
    } catch (err) {
      console.error("Error fetching swaps", err);
    }
  };

  useEffect(() => {
    fetchSwaps();
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      const fetchLeaveData = async () => {
        let quotas: any[] = [
          { id: 'casual', label: 'Casual Leave', days: 12 },
          { id: 'paid', label: 'Paid Leave', days: 12 },
          { id: 'sick', label: 'Sick Leave', days: 5 }
        ];
        try {
          const docRef = doc(db, 'settings', 'college');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.leaveQuotas) {
              const rawQuotas = data.leaveQuotas;
              if (Array.isArray(rawQuotas)) {
                quotas = rawQuotas;
              } else if (typeof rawQuotas === 'object') {
                quotas = Object.entries(rawQuotas).map(([key, val]) => ({
                  id: key,
                  label: key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' ') + ' Leave',
                  days: Number(val)
                }));
              }
              setLeaveTypes(quotas);
            }
          }
        } catch (error) {
          console.error("Error fetching leave quotas", error);
        }

        getLeaveRequestsByFaculty(user.email).then(reqs => {
          setLeaveHistory(reqs);
          const used: Record<string, number> = {};

          reqs.forEach(r => {
            if (r.status === 'approved') {
              const days = Math.floor((new Date(r.toDate).getTime() - new Date(r.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
              used[r.type] = (used[r.type] || 0) + days;
            }
          });

          const newBalances: Record<string, number> = {};
          quotas.forEach((q: any) => {
            if (q.days > 0) {
              newBalances[q.id] = Math.max(0, q.days - (used[q.id] || 0));
            } else {
              newBalances[q.id] = used[q.id] || 0;
            }
          });

          setLeaveBalance(newBalances);
        });
      };
      fetchLeaveData();
    }
  }, [user]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getLeaveForDate = (day: number) => {
    return leaveHistory.find((leave: any) => {
      if (leave.status !== 'approved') return false;
      const start = new Date(leave.fromDate);
      const end = new Date(leave.toDate);
      const checkDate = new Date(viewYear, viewMonth, day);
      return checkDate >= start && checkDate <= end;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(viewYear - 1);
      } else {
        setViewMonth(viewMonth - 1);
      }
    } else {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(viewYear + 1);
      } else {
        setViewMonth(viewMonth + 1);
      }
    }
  };

  const handleAcceptSwap = async (leaveId: string, swapId: string, currentSwaps: any[], leave: any) => {
    if (!user) return;
    try {
      await acceptLeaveSwap(leaveId, swapId, user.email, user.name, currentSwaps, leave);
      fetchSwaps(); // Refresh
    } catch (err) {
      console.error("Error accepting swap", err);
    }
  };

  const handleRejectSwap = async (leaveId: string, swapId: string, currentSwaps: any[]) => {
    try {
      await rejectLeaveSwap(leaveId, swapId, currentSwaps);
      fetchSwaps(); // Refresh
    } catch (err) {
      console.error("Error rejecting swap", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Leave Management"
        description="Track and manage your leave balance"
      >
        <Link to="/faculty/apply-leave">
          <Button className="bg-primary hover:bg-primary/90">
            <FileText className="mr-2 h-4 w-4" />
            Apply Leave
          </Button>
        </Link>
      </PageHeader>

      {/* Leave Balance Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {leaveTypes.slice(0, 3).map((type, idx) => {
          const variants = ['success', 'info', 'primary', 'warning', 'info'] as const;
          const icons = [CheckCircle2, XCircle, FileText, Calendar, Clock];

          return (
            <StatsCard
              key={type.id}
              title={type.label}
              value={leaveBalance[type.id] ?? 0}
              description={type.days > 0 ? "Days remaining" : "Days taken"}
              icon={icons[idx % icons.length]}
              variant={variants[idx % variants.length]}
            />
          );
        })}
        {leaveTypes.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-4 italic">No stats available.</p>
        )}
      </div>

      {/* Swap Management Sections */}
      {(pendingSwaps.length > 0 || acceptedSwaps.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {pendingSwaps.length > 0 && (
            <DataCard title="Pending Swap Requests">
              <div className="grid gap-4">
                {pendingSwaps.map(({ leave, swap }) => (
                  <div key={swap.id} className="p-4 border rounded-xl bg-card transition-all hover:border-primary/50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20">
                          {swap.date} • {swap.day}
                        </Badge>
                        <h4 className="font-bold text-lg">{swap.subject}</h4>
                        <p className="text-sm text-muted-foreground">Requested by <span className="text-foreground font-medium">{leave.facultyName}</span></p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5 bg-muted/50 p-2 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-primary" /> {swap.slot}
                      </div>
                      <div className="flex items-center gap-1.5 bg-muted/50 p-2 rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> Room {swap.room}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-success hover:bg-success/90" onClick={() => handleAcceptSwap(leave.id, swap.id, leave.swaps, leave)}>
                        <Check className="mr-2 h-4 w-4" /> Accept
                      </Button>
                      {swap.requestToEmail && (
                        <Button size="sm" variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleRejectSwap(leave.id, swap.id, leave.swaps)}>
                          <X className="mr-2 h-4 w-4" /> Reject
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>
          )}

          {acceptedSwaps.length > 0 && (
            <DataCard title="Classes I'm Covering">
              <div className="grid gap-4">
                {acceptedSwaps.map(({ leave, swap }) => (
                  <div key={swap.id} className="p-4 border rounded-xl bg-green-50/30 border-green-200/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{swap.acceptedByName}</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {swap.date}
                        </Badge>
                        <h4 className="font-bold text-lg">{swap.subject}</h4>
                        <p className="text-sm text-muted-foreground italic">Covering for {leave.facultyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-green-800">
                      <span>Time: {swap.slot}</span>
                      <span>Room: {swap.room}</span>
                      <span>Section: {swap.section}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>
          )}
        </div>
      )}

      {/* My Leave Requests Section */}
      <DataCard title="My Leave Applications">
        {leaveHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No leave applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveHistory.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="capitalize font-medium">{leave.type}</TableCell>
                    <TableCell>{leave.fromDate}</TableCell>
                    <TableCell>{leave.toDate}</TableCell>
                    <TableCell>{leave.durationInDays} days</TableCell>
                    <TableCell>
                      <StatusBadge status={leave.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataCard>

      {/* Calendar View */}
      <DataCard
        title="Leave Calendar"
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-destructive"></span>
              <span>Casual</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-warning"></span>
              <span>Paid</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-info"></span>
              <span>Sick</span>
            </div>
          </div>
        }
      >
        <div className="max-w-md mx-auto">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
              ←
            </Button>
            <h3 className="font-semibold text-foreground">
              {monthNames[viewMonth]} {viewYear}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
              →
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Empty cells for days before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const leave = getLeaveForDate(day);
              const isToday = day === currentDate.getDate() &&
                viewMonth === currentDate.getMonth() &&
                viewYear === currentDate.getFullYear();

              return (
                <div
                  key={day}
                  className={cn(
                    'aspect-square p-1 flex items-center justify-center rounded-lg text-sm transition-colors',
                    isToday && 'ring-2 ring-primary',
                    leave ? getLeaveColor(leave.type) + ' text-white' : 'hover:bg-muted'
                  )}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </DataCard>
    </div>
  );
}

export default LeaveHome;
