import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/landing/Logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Home,
  Calendar,
  FileText,
  History,
  Megaphone,
  CalendarDays,
  Bell,
  GraduationCap,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ClipboardList,
  Users,
  StickyNote,
  Upload,
  BookOpen,
} from 'lucide-react';
import type { UserRole } from '@/types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

interface NavItemType {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  subItems?: { title: string; href: string }[];
}

const facultyNavItems: NavItemType[] = [
  { title: 'Home', href: '/faculty', icon: Home },
  { title: 'My Timetable', href: '/faculty/timetable', icon: Calendar },
  {
    title: 'Apply Leave',
    href: '/faculty/leave',
    icon: FileText,
    subItems: [
      { title: 'Overview', href: '/faculty/leave' },
      { title: 'Apply', href: '/faculty/apply-leave' },
    ]
  },
  { title: 'Leave History', href: '/faculty/leave-history', icon: History },
  { title: 'Announcements', href: '/faculty/announcements', icon: Megaphone },
  { title: 'Events', href: '/faculty/events', icon: CalendarDays },
  { title: 'My Notifications', href: '/faculty/notifications', icon: Bell },
  { title: 'Examination Info', href: '/faculty/exams', icon: GraduationCap },
  { title: 'Profile', href: '/faculty/profile', icon: User },
];

const hodNavItems: NavItemType[] = [
  { title: 'Home', href: '/hod', icon: Home },
  { title: 'My Timetable', href: '/hod/timetable', icon: Calendar },
  { title: 'All Timetables', href: '/hod/all-timetables', icon: Upload },
  { title: 'My Notes', href: '/hod/notes', icon: StickyNote },
  { title: 'Leave Requests', href: '/hod/leave-requests', icon: ClipboardList },
  { title: 'Announcements', href: '/hod/announcements', icon: Megaphone },
  { title: 'Events', href: '/hod/events', icon: CalendarDays },
  { title: 'My Notifications', href: '/hod/notifications', icon: Bell },
  { title: 'Faculty Info', href: '/hod/faculty', icon: Users },
  { title: 'Examination Info', href: '/hod/exams', icon: GraduationCap },
  { title: 'Profile', href: '/hod/profile', icon: User },
];

const principalNavItems: NavItemType[] = [
  { title: 'Home', href: '/principal', icon: Home },
  { title: 'All Timetables', href: '/principal/all-timetables', icon: Calendar },
  { title: 'Faculty & HODs Info', href: '/principal/faculty', icon: Users },
  { title: 'Announcements', href: '/principal/announcements', icon: Megaphone },
  { title: 'Events', href: '/principal/events', icon: CalendarDays },
  { title: 'Examination Info', href: '/principal/exams', icon: GraduationCap },
  { title: 'Leave Requests', href: '/principal/leave-requests', icon: ClipboardList },
  { title: 'Profile', href: '/principal/profile', icon: User },
  { title: 'Classes', href: '/principal/classes', icon: BookOpen },
  { title: 'Settings', href: '/principal/settings', icon: Menu },
];

interface DashboardSidebarProps {
  role: UserRole;
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);

  useEffect(() => {
    if (!user) return;

    let unsubNotifs = () => { };
    let unsubLeaves = () => { };

    // 1. Unread Notifications
    let notifsQuery;
    if (user.role === 'hod') {
      notifsQuery = query(collection(db, 'notifications'), where('toRole', '==', 'hod'), where('toDepartment', '==', user.department));
    } else if (user.role === 'principal') {
      notifsQuery = query(collection(db, 'notifications'), where('toRole', '==', 'principal'));
    } else {
      notifsQuery = query(collection(db, 'notifications'), where('toRole', '==', 'faculty'), where('toEmail', '==', user.email));
    }

    unsubNotifs = onSnapshot(notifsQuery, (snap) => {
      let unread = 0;
      snap.forEach(doc => {
        if (!doc.data().read) unread++;
      });
      setUnreadNotifications(unread);
    });

    // 2. Pending Leave Requests (HOD or Principal)
    if (user.role === 'hod' || user.role === 'principal') {
      const leavesQuery = user.role === 'hod'
        ? query(collection(db, 'leaveRequests'), where('department', '==', user.department), where('status', '==', 'pending_hod'))
        : query(collection(db, 'leaveRequests'), where('status', '==', 'pending_principal'));

      unsubLeaves = onSnapshot(leavesQuery, (snap) => {
        setPendingLeaves(snap.size);
      });
    }

    return () => {
      unsubNotifs();
      unsubLeaves();
    };
  }, [user]);

  const navItems = role === 'principal' ? principalNavItems : (role === 'hod' ? hodNavItems : facultyNavItems);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === `/${role}`) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const getBadgeCount = (title: string, staticBadge?: number) => {
    if (title === 'My Notifications' && unreadNotifications > 0) return unreadNotifications;
    if (title === 'Leave Requests' && pendingLeaves > 0) return pendingLeaves;
    return staticBadge;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Logo variant="light" size="md" />
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold overflow-hidden">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-sidebar-muted truncate">
              {user?.erpId || 'ERP ID'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <div key={item.title}>
              {item.subItems ? (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.title)}
                    className={cn(
                      'sidebar-item w-full justify-between',
                      isActive(item.href) && 'bg-sidebar-accent text-sidebar-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </div>
                    <ChevronDown className={cn(
                      'h-4 w-4 transition-transform',
                      expandedItems.includes(item.title) && 'rotate-180'
                    )} />
                  </button>
                  {expandedItems.includes(item.title) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={({ isActive }) => cn(
                            'block px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                          )}
                        >
                          {subItem.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.href}
                  end={item.href === `/${role}`}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) => cn(
                    'sidebar-item',
                    isActive && 'active'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.title}</span>
                  {getBadgeCount(item.title, item.badge) !== undefined && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                      {getBadgeCount(item.title, item.badge)}
                    </span>
                  )}
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="sidebar-item w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar transition-transform lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </aside>
    </>
  );
}

export default DashboardSidebar;
