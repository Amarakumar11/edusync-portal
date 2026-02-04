import { useState } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const leaveBalance = {
  casual: 8,
  paid: 12,
  sick: 5,
  total: 25,
};

// Mock leave data for calendar
const leaveData = [
  { date: new Date(2024, 0, 15), type: 'casual' },
  { date: new Date(2024, 0, 22), type: 'sick' },
  { date: new Date(2024, 0, 23), type: 'sick' },
  { date: new Date(2024, 1, 5), type: 'paid' },
  { date: new Date(2024, 1, 6), type: 'paid' },
];

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
  const [currentDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getLeaveForDate = (day: number) => {
    return leaveData.find(leave => 
      leave.date.getFullYear() === viewYear &&
      leave.date.getMonth() === viewMonth &&
      leave.date.getDate() === day
    );
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Leave Management"
        description="Track and manage your leave balance"
      >
        <Link to="/faculty/leave/apply">
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
