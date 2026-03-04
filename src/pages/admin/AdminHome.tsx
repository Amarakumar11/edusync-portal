import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Bell, Calendar, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { getLeaveRequestsByDepartment, updateLeaveRequestStatus } from '@/services/leaveService';

export function AdminHome() {
  const { user } = useAuth();

  const [totalFaculty, setTotalFaculty] = useState(0);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [pendingLeavesList, setPendingLeavesList] = useState<any[]>([]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  const loadDashboardData = async () => {
    if (!user || (user.role !== 'hod' && user.role !== 'principal')) return;

    try {
      // 1. Total Faculty
      let facultyQ;
      if (user.role === 'principal') {
        facultyQ = query(collection(db, 'users'), where('role', '==', 'faculty'));
      } else {
        facultyQ = query(collection(db, 'users'), where('role', '==', 'faculty'), where('department', '==', user.department));
      }
      const facultySnap = await getDocs(facultyQ);
      setTotalFaculty(facultySnap.size);

      // 2. Announcements Count
      let annQ;
      if (user.role === 'principal') {
        annQ = query(collection(db, 'announcements'));
      } else {
        annQ = query(collection(db, 'announcements'), where('department', 'in', ['All', user.department]));
      }
      const annSnap = await getDocs(annQ);
      setTotalAnnouncements(annSnap.size);

      // 3. Upcoming Events
      const eventsQ = query(collection(db, 'events'));
      const evSnap = await getDocs(eventsQ);
      setUpcomingEvents(evSnap.docs.filter(d => new Date(d.data().date) >= new Date()).length);

      // 4. Pending Leaves (Leave handling mainly for HODs)
      if (user.role === 'hod') {
        const leaves = await getLeaveRequestsByDepartment(user.department || '');
        const pending = leaves.filter(l => l.status === 'pending').slice(0, 5); // top 5
        setPendingLeavesList(pending);
      } else {
        setPendingLeavesList([]); // Principal doesn't approve leaves
      }

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const quickApproveLeave = async (id: string) => {
    try {
      await updateLeaveRequestStatus(id, 'approved');
      loadDashboardData();
    } catch (err) {
      console.error('Error approving', err);
    }
  };

  const quickRejectLeave = async (id: string) => {
    try {
      await updateLeaveRequestStatus(id, 'rejected');
      loadDashboardData();
    } catch (err) {
      console.error('Error rejecting', err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'HOD'}!`}
        description="Here's your department dashboard overview"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard title="Total Faculty" value={totalFaculty} description="Active members in dept" icon={Users} variant="primary" />
        <StatsCard title="Pending Leaves" value={pendingLeavesList.length} description="Awaiting approval" icon={FileText} variant="warning" />
        <StatsCard title="Announcements" value={totalAnnouncements} description="Active announcements" icon={Bell} variant="info" />
        <StatsCard title="Upcoming Events" value={upcomingEvents} description="Scheduled events" icon={Calendar} variant="success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {user.role === 'hod' && (
          <DataCard
            title="Pending Leave Requests"
            className="border-primary/10"
            action={
              <Link to="/hod/leave-requests">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  Manage All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            }
          >
            <div className="space-y-3 pt-2">
              {pendingLeavesList.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-muted/30 border border-border">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success opacity-80" />
                  <p className="text-foreground font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-1">No pending leave requests to review.</p>
                </div>
              ) : (
                pendingLeavesList.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="font-medium text-foreground truncate">{leave.facultyName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs font-normal capitalize bg-transparent">
                          {leave.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={() => quickRejectLeave(leave.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0 bg-success hover:bg-success/90"
                        onClick={() => quickApproveLeave(leave.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DataCard>
        )}

        <DataCard title="Dashboard Links" className="border-primary/10">
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Link to={`/${user?.role}/all-timetables`}>
              <div className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer group flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium text-foreground">Timetables</h4>
                <p className="text-xs text-muted-foreground mt-1">Manage schedules</p>
              </div>
            </Link>

            <Link to={`/${user?.role}/announcements`}>
              <div className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:shadow-sm hover:border-info/20 transition-all cursor-pointer group flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Bell className="h-6 w-6 text-info" />
                </div>
                <h4 className="font-medium text-foreground">Announcements</h4>
                <p className="text-xs text-muted-foreground mt-1">Publish updates</p>
              </div>
            </Link>

            <Link to={`/${user?.role}/faculty`}>
              <div className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:shadow-sm hover:border-warning/20 transition-all cursor-pointer group flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-warning" />
                </div>
                <h4 className="font-medium text-foreground">{user?.role === 'principal' ? 'All Staff Data' : 'Faculty Staff'}</h4>
                <p className="text-xs text-muted-foreground mt-1">View directory</p>
              </div>
            </Link>

            <Link to={`/${user?.role}/exams`}>
              <div className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:shadow-sm hover:border-destructive/20 transition-all cursor-pointer group flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-destructive" />
                </div>
                <h4 className="font-medium text-foreground">Exams</h4>
                <p className="text-xs text-muted-foreground mt-1">Exam schedules</p>
              </div>
            </Link>
          </div>
        </DataCard>
      </div>
    </div>
  );
}

export default AdminHome;
