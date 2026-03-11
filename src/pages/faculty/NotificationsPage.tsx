import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getFacultyNotifications, markNotificationAsRead, createNotification } from '@/services/notificationService';
import { Notification } from '@/types/leave';
import { Bell, Send, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { toast } from 'sonner';

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);

  // Form state
  const [recipient, setRecipient] = useState<string>(''); // 'hod' or email address
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadFaculties();
  }, [user]);

  const loadNotifications = async () => {
    if (!user || user.role !== 'faculty') return;
    try {
      const notifs = await getFacultyNotifications(user.email, user.department);
      setNotifications(
        notifs.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFaculties = async () => {
    if (!user || user.role !== 'faculty') return;
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'faculty'), where('department', '==', user.department));
      const snap = await getDocs(q);
      setFaculties(snap.docs.map(d => d.data()).filter(f => f.email !== user.email));
    } catch (error) {
      console.error('Error loading faculties:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      await loadNotifications();
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recipient || !message) return;

    setIsSending(true);
    try {
      if (recipient === 'hod') {
        await createNotification(
          'hod',
          user.department || '',
          `From ${user.name}: ${message}`
        );
      } else {
        await createNotification(
          'faculty',
          user.department || '',
          `From ${user.name}: ${message}`,
          recipient
        );
      }

      toast.success('Message sent successfully');
      setMessage('');
      setRecipient('');
      setShowSendForm(false);
      // We don't need to reload notifications because this is an outbox action.
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!user || user.role !== 'faculty') return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <PageHeader
          title="Notifications"
          description="Your messages and updates"
        />
        <Button
          onClick={() => setShowSendForm(!showSendForm)}
          variant={showSendForm ? "outline" : "default"}
        >
          {showSendForm ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Send Message</>}
        </Button>
      </div>

      {showSendForm && (
        <DataCard title="Send Message" className="bg-muted/30 border-primary/20">
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">To</Label>
              <Select
                value={recipient}
                onValueChange={setRecipient}
                disabled={isSending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hod">HOD - {user.department}</SelectItem>
                  {faculties.map((f, idx) => (
                    <SelectItem key={idx} value={f.email}>{f.name} (Faculty)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={isSending}
                required
              />
            </div>
            <Button type="submit" disabled={isSending || !recipient || !message} className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="mr-2 h-4 w-4" />
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </DataCard>
      )}

      {loading ? (
        <Card><CardContent className="pt-6"><EmptyState title="Loading notifications..." /></CardContent></Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState title="No notifications" description="You have no messages yet" icon={<Bell className="h-4 w-4" />} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Card key={notif.id} className={`${notif.read ? 'opacity-70 bg-muted/40' : 'border-l-4 border-l-primary'}`}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-background">{notif.toDepartment} Department</Badge>
                      {!notif.read && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">New Message</Badge>}
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-primary hover:text-primary hover:bg-primary/10"
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

export default NotificationsPage;
