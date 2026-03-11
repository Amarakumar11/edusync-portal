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

  const [leaveBalance, setLeaveBalance] = useState({ casual: 0, paid: 0, sick: 0, total: 0 });
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [pendingSwaps, setPendingSwaps] = useState<{ leave: any, swap: any }[]>([]);

  const fetchPendingSwaps = async () => {
    if (!user?.email || !user?.department) return;
    try {
      const q = query(
        collection(db, 'leaveRequests'),
        where('department', '==', user.department),
        where('status', '==', 'swaps_pending')
      );
      const snap = await getDocs(q);
      const swapsList: any[] = [];
      snap.docs.forEach(d => {
        const leave = { id: d.id, ...d.data() } as any;
        if (leave.facultyEmail === user.email) return;

        leave.swaps?.forEach((swap: any) => {
          if (swap.status === 'pending' && (!swap.requestToEmail || swap.requestToEmail === user.email)) {
            swapsList.push({ leave, swap });
          }
        });
      });
      setPendingSwaps(swapsList);
    } catch (err) {
      console.error("Error fetching pending swaps", err);
    }
  };

  useEffect(() => {
    fetchPendingSwaps();
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      const fetchLeaveData = async () => {
        let quotas = { casual: 15, paid: 12, sick: 5 };
        try {
          const docRef = doc(db, 'settings', 'college');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().leaveQuotas) {
            quotas = docSnap.data().leaveQuotas;
          }
        } catch (error) {
          console.error("Error fetching leave quotas", error);
        }

        getLeaveRequestsByFaculty(user.email).then(reqs => {
          setLeaveHistory(reqs);
          let usedCasual = 0, usedPaid = 0, usedSick = 0;
          reqs.forEach(r => {
            if (r.status === 'approved') {
              const days = Math.floor((new Date(r.toDate).getTime() - new Date(r.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
              if (r.type === 'casual') usedCasual += days;
              if (r.type === 'paid') usedPaid += days;
              if (r.type === 'sick') usedSick += days;
            }
          });
          setLeaveBalance({
            casual: Math.max(0, quotas.casual - usedCasual),
            paid: Math.max(0, quotas.paid - usedPaid),
            sick: Math.max(0, quotas.sick - usedSick),
            total: quotas.casual + quotas.paid + quotas.sick
          });
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

  const handleAcceptSwap = async (leaveId: string, swapId: string, currentSwaps: any[]) => {
    if (!user) return;
    try {
      await acceptLeaveSwap(leaveId, swapId, user.email, user.name, currentSwaps);
      fetchPendingSwaps(); // Refresh
    } catch (err) {
      console.error("Error accepting swap", err);
    }
  };

  const handleRejectSwap = async (leaveId: string, swapId: string, currentSwaps: any[]) => {
    try {
      await rejectLeaveSwap(leaveId, swapId, currentSwaps);
      fetchPendingSwaps(); // Refresh
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title="Total Leaves"
          value={leaveBalance.total}
          description="Available this year"
          icon={Calendar}
          variant="primary"
        />
        <StatsCard
          title="Casual Leave"
          value={leaveBalance.casual}
          description="Days remaining"
          icon={CheckCircle2}
          variant="success"
        />
        <StatsCard
          title="Paid Leave"
          value={leaveBalance.paid}
          description="Days remaining"
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Sick Leave"
          value={leaveBalance.sick}
          description="Days remaining"
          icon={XCircle}
          variant="info"
        />
      </div>

      {/* Pending Swap Requests */}
      {pendingSwaps.length > 0 && (
        <DataCard title="Pending Swap Requests">
          <div className="grid sm:grid-cols-2 gap-4">
            {pendingSwaps.map(({ leave, swap }) => (
              <div key={swap.id} className="p-4 border rounded-lg bg-card space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-primary">{swap.subject} ({swap.section})</h4>
                    <p className="text-sm text-foreground">{leave.facultyName} is requesting a substitute</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {swap.date} • {swap.day} • {swap.slot} • Room: {swap.room}
                    </p>
                    {!swap.requestToEmail && (
                      <span className="inline-block mt-2 text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">Open to Anyone</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="w-full bg-success hover:bg-success/90" onClick={() => handleAcceptSwap(leave.id, swap.id, leave.swaps)}>
                    <Check className="mr-2 h-4 w-4" /> Accept
                  </Button>
                  {swap.requestToEmail && (
                    <Button size="sm" variant="destructive" className="w-full" onClick={() => handleRejectSwap(leave.id, swap.id, leave.swaps)}>
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      )}

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
