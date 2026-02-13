import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Bell, Calendar, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const pendingLeaves = [
  { id: '1', name: 'Dr. Smith', type: 'Sick Leave', days: 2, date: 'Jan 25-26' },
  { id: '2', name: 'Prof. Johnson', type: 'Casual Leave', days: 1, date: 'Jan 28' },
  { id: '3', name: 'Dr. Williams', type: 'Paid Leave', days: 3, date: 'Feb 1-3' },
];

export function AdminHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Admin'}!`}
        description="Here's your admin dashboard overview"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard title="Total Faculty" value={48} description="Active members" icon={Users} variant="primary" />
        <StatsCard title="Pending Leaves" value={5} description="Awaiting approval" icon={FileText} variant="warning" />
        <StatsCard title="Announcements" value={12} description="This month" icon={Bell} variant="info" />
        <StatsCard title="Upcoming Events" value={3} description="Next 7 days" icon={Calendar} variant="success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <DataCard
          title="Pending Leave Requests"
          action={<Link to="/admin/leave-requests"><Button variant="ghost" size="sm">View All <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>}
        >
          <div className="space-y-3">
            {pendingLeaves.map((leave) => (
              <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-foreground">{leave.name}</p>
                  <p className="text-sm text-muted-foreground">{leave.type} • {leave.date}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0"><XCircle className="h-4 w-4 text-destructive" /></Button>
                  <Button size="sm" className="h-8 w-8 p-0 bg-success hover:bg-success/90"><CheckCircle2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard title="Recent Activity">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-success/10 border-l-4 border-success">
              <p className="text-sm font-medium">Leave approved for Dr. Anderson</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
            <div className="p-3 rounded-lg bg-info/10 border-l-4 border-info">
              <p className="text-sm font-medium">New announcement published</p>
              <p className="text-xs text-muted-foreground">5 hours ago</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 border-l-4 border-warning">
              <p className="text-sm font-medium">Exam schedule uploaded</p>
              <p className="text-xs text-muted-foreground">Yesterday</p>
            </div>
          </div>
        </DataCard>
      </div>
    </div>
  );
}

export default AdminHome;
