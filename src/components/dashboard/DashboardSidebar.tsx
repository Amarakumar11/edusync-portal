import { useState } from 'react';
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
} from 'lucide-react';
import type { UserRole } from '@/types';

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
      { title: 'Apply', href: '/faculty/leave/apply' },
    ]
  },
  { title: 'Leave History', href: '/faculty/leave-history', icon: History },
  { title: 'Announcements', href: '/faculty/announcements', icon: Megaphone },
  { title: 'Events', href: '/faculty/events', icon: CalendarDays },
  { title: 'My Notifications', href: '/faculty/notifications', icon: Bell, badge: 3 },
  { title: 'Examination Info', href: '/faculty/exams', icon: GraduationCap },
  { title: 'Profile', href: '/faculty/profile', icon: User },
];

const adminNavItems: NavItemType[] = [
  { title: 'Home', href: '/admin', icon: Home },
  { title: 'My Timetable', href: '/admin/timetable', icon: Calendar },
  { title: 'All Timetables', href: '/admin/all-timetables', icon: Upload },
  { title: 'My Notes', href: '/admin/notes', icon: StickyNote },
  { title: 'Leave Requests', href: '/admin/leave-requests', icon: ClipboardList, badge: 5 },
  { title: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { title: 'Events', href: '/admin/events', icon: CalendarDays },
  { title: 'My Notifications', href: '/admin/notifications', icon: Bell, badge: 2 },
  { title: 'Faculty Info', href: '/admin/faculty', icon: Users },
  { title: 'Examination Info', href: '/admin/exams', icon: GraduationCap },
];

interface DashboardSidebarProps {
  role: UserRole;
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const navItems = role === 'admin' ? adminNavItems : facultyNavItems;

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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Logo variant="light" size="md" />
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold">
            {user?.username?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.username || 'User'}
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
                  {item.badge && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                      {item.badge}
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
