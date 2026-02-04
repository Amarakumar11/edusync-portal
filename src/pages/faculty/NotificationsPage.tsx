// ⚠️ DEMO MODE: Data stored in localStorage, no backend, no Firebase

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/demoAuth';
import { getFacultyNotifications, markNotificationAsRead } from '@/services/notificationService';
import { Notification } from '@/types/leave';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function NotificationsPage() {
  const user = getCurrentUser();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    if (!user || user.role !== 'faculty') {
      return;
    }

    const notifs = getFacultyNotifications(user.email);
    setNotifications(notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    loadNotifications();
    toast({
      description: 'Marked as read',
    });
  };

  if (!user || user.role !== 'faculty') {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Your messages and updates"
      />

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState title="Loading notifications..." />
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState title="No notifications" description="You have no messages yet" icon={<Bell className="h-4 w-4" />} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Card key={notif.id} className={notif.read ? 'opacity-75' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold">{notif.toDepartment} Department</span>
                      {!notif.read && <Badge className="bg-blue-100 text-blue-800">New</Badge>}
                    </div>
                    <p className="text-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
                  />
                </div>

                <Button 
                  onClick={handleSend}
                  disabled={!newMessage.trim() || !selectedRecipient}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </Button>
              </div>
            </DataCard>

            {/* Sent History */}
            <DataCard title="Sent Notifications" contentClassName="p-0">
              {sent.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sent notifications.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sent.map((notification) => (
                    <div key={notification.id} className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground">To:</span>
                        <span className="font-medium text-foreground">
                          {notification.senderName}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </DataCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default NotificationsPage;
