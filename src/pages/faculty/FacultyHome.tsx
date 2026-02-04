import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar, 
  FileText, 
  Bell,
  ArrowRight,
  MapPin,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data for next class
const nextClass = {
  subject: 'Data Structures',
  time: '10:00 AM - 11:00 AM',
  room: 'Room 301',
  section: 'CSE-A',
};

// Mock announcements
const recentAnnouncements = [
  { id: '1', title: 'Faculty Meeting Tomorrow', time: '2 hours ago', priority: 'high' as const },
  { id: '2', title: 'Mid-term Exam Schedule Released', time: '5 hours ago', priority: 'medium' as const },
  { id: '3', title: 'Holiday on Friday', time: '1 day ago', priority: 'low' as const },
];

// Leave balance
const leaveBalance = {
  casual: 8,
  paid: 12,
  sick: 5,
  total: 25,
  used: 7,
};

export function FacultyHome() {
  const { user } = useAuth();

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title={`${greeting}, ${user?.username?.split(' ')[0] || 'Professor'}!`}
        description="Here's what's happening today"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title="Next Class"
          value={nextClass.subject}
          description={nextClass.time}
          icon={Clock}
          variant="primary"
        />
        <StatsCard
          title="Total Leaves"
          value={leaveBalance.total}
          description={`${leaveBalance.used} used this year`}
          icon={Calendar}
          variant="info"
        />
        <StatsCard
          title="Pending Requests"
          value={2}
          description="Leave applications"
          icon={FileText}
          variant="warning"
        />
        <StatsCard
          title="Notifications"
          value={5}
          description="3 unread messages"
          icon={Bell}
          variant="success"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Class Card */}
        <DataCard 
          title="Today's Schedule" 
          className="lg:col-span-2"
          action={
            <Link to="/faculty/timetable">
              <Button variant="ghost" size="sm">
                View Timetable
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          }
        >
          <div className="space-y-4">
            {/* Current/Next Class */}
            <div className="relative p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground">Now/Next</Badge>
              </div>
              <h4 className="font-semibold text-lg text-foreground mb-2">{nextClass.subject}</h4>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {nextClass.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {nextClass.room}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {nextClass.section}
                </span>
              </div>
            </div>

            {/* Other classes */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h5 className="font-medium text-foreground mb-1">Operating Systems</h5>
                <p className="text-sm text-muted-foreground">11:00 AM - 12:00 PM • Room 302</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h5 className="font-medium text-foreground mb-1">Database Systems</h5>
                <p className="text-sm text-muted-foreground">2:00 PM - 3:00 PM • Lab 201</p>
              </div>
            </div>
          </div>
        </DataCard>

        {/* Leave Balance Card */}
        <DataCard 
          title="Leave Balance"
          action={
            <Link to="/faculty/leave/apply">
              <Button variant="outline" size="sm">Apply Leave</Button>
            </Link>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
              <span className="text-sm font-medium">Casual Leave</span>
              <span className="font-semibold text-success">{leaveBalance.casual} days</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
              <span className="text-sm font-medium">Paid Leave</span>
              <span className="font-semibold text-warning">{leaveBalance.paid} days</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-info/5 border border-info/20">
              <span className="text-sm font-medium">Sick Leave</span>
              <span className="font-semibold text-info">{leaveBalance.sick} days</span>
            </div>
          </div>
        </DataCard>
      </div>

      {/* Announcements */}
      <DataCard 
        title="Recent Announcements"
        action={
          <Link to="/faculty/announcements">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        }
      >
        <div className="space-y-3">
          {recentAnnouncements.map((announcement) => (
            <div 
              key={announcement.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  announcement.priority === 'high' ? 'bg-destructive' :
                  announcement.priority === 'medium' ? 'bg-warning' : 'bg-muted-foreground'
                }`} />
                <span className="font-medium text-foreground">{announcement.title}</span>
              </div>
              <span className="text-sm text-muted-foreground">{announcement.time}</span>
            </div>
          ))}
        </div>
      </DataCard>
    </div>
  );
}

export default FacultyHome;
