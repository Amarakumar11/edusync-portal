import { useState, useEffect } from 'react';
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
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { getLeaveRequestsByFaculty } from '@/services/leaveService';

export function FacultyHome() {
  const { user } = useAuth();

  const [leaveBalance, setLeaveBalance] = useState({ casual: 15, paid: 12, sick: 5, total: 32, used: 0 });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [nextClass, setNextClass] = useState<any>(null);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // 1. Leave Balances & Pending Requests
        const leaves = await getLeaveRequestsByFaculty(user.email);
        let used = 0;
        let casual = 15, paid = 12, sick = 5;
        let pending = 0;

        leaves.forEach(r => {
          if (r.status === 'pending') {
            pending++;
          } else if (r.status === 'approved') {
            const days = Math.floor((new Date(r.toDate).getTime() - new Date(r.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
            used += days;
            if (r.type === 'casual') casual -= days;
            if (r.type === 'paid') paid -= days;
            if (r.type === 'sick') sick -= days;
          }
        });
        setLeaveBalance({ casual: Math.max(0, casual), paid: Math.max(0, paid), sick: Math.max(0, sick), total: 32, used });
        setPendingRequestsCount(pending);

        // 2. Unread Notifications
        const notifsQuery = query(collection(db, 'notifications'), where('toEmail', '==', user.email), where('read', '==', false));
        const notifsSnap = await getDocs(notifsQuery);
        setUnreadNotifsCount(notifsSnap.size);

        // 3. Announcements
        const annQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
        const annSnap = await getDocs(annQuery);
        const fetchedAnn = annSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((a: any) => a.department === 'All' || a.department === user.department);
        setRecentAnnouncements(fetchedAnn.slice(0, 3));

        // 4. Next Class from Timetable
        if (user.uid) {
          const ttRef = doc(db, 'timetable', user.uid);
          const ttSnap = await getDoc(ttRef);
          if (ttSnap.exists()) {
            const data = ttSnap.data().schedule;
            const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const todayStr = daysMap[new Date().getDay()];
            const todayClasses = data[todayStr] || [];
            if (todayClasses.length > 0) {
              const firstValid = todayClasses.find((c: any) => c.subject && c.subject.trim() !== '');
              setNextClass(firstValid || null);
            }
          }
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'Professor'}!`}
        description="Here's what's happening today"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title="Next Class"
          value={nextClass ? nextClass.subject : 'No Classes'}
          description={nextClass ? nextClass.time : 'Enjoy your day'}
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
          value={pendingRequestsCount}
          description="Leave applications"
          icon={FileText}
          variant="warning"
        />
        <StatsCard
          title="Notifications"
          value={unreadNotifsCount}
          description={`${unreadNotifsCount} unread messages`}
          icon={Bell}
          variant="success"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Class Card */}
        <DataCard
          title="Today's Schedule Info"
          className="lg:col-span-2 border-primary/10"
          action={
            <Link to="/faculty/timetable">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                View Timetable
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          }
        >
          <div className="space-y-4">
            {nextClass ? (
              <div className="relative p-5 rounded-xl bg-primary/5 border border-primary/20 shadow-sm">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground">Next Scheduled</Badge>
                </div>
                <h4 className="font-semibold text-lg text-foreground mb-3 pr-24">{nextClass.subject}</h4>
                <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="h-4 w-4 text-primary/70" />
                    {nextClass.time}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="h-4 w-4 text-primary/70" />
                    {nextClass.room || 'TBD'}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="h-4 w-4 text-primary/70" />
                    Section: {nextClass.section || 'N/A'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-muted/30 border border-border">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-foreground font-medium">No schedule detected for today</p>
                <p className="text-sm text-muted-foreground mt-1">Make sure your timetable is fully updated.</p>
              </div>
            )}
          </div>
        </DataCard>

        {/* Leave Balance Card */}
        <DataCard
          title="Leave Balance"
          className="border-primary/10"
          action={
            <Link to="/faculty/apply-leave">
              <Button variant="outline" size="sm">Apply Leave</Button>
            </Link>
          }
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
              <span className="text-sm font-medium text-red-800 dark:text-red-300">Casual Leave</span>
              <span className="font-semibold text-red-700 dark:text-red-400">{leaveBalance.casual} days</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30">
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Paid Leave</span>
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">{leaveBalance.paid} days</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Sick Leave</span>
              <span className="font-semibold text-blue-700 dark:text-blue-400">{leaveBalance.sick} days</span>
            </div>
          </div>
        </DataCard>
      </div>

      {/* Announcements */}
      <DataCard
        title="Recent Announcements"
        className="border-primary/10"
        action={
          <Link to="/faculty/announcements">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        }
      >
        <div className="space-y-3">
          {recentAnnouncements.length === 0 ? (
            <p className="text-muted-foreground p-4 text-center">No recent announcements</p>
          ) : (
            recentAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${announcement.priority === 'high' ? 'bg-destructive' :
                    announcement.priority === 'medium' ? 'bg-warning' : 'bg-success'
                    }`} />
                  <span className="font-medium text-foreground">{announcement.title}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </DataCard>
    </div>
  );
}

export default FacultyHome;
