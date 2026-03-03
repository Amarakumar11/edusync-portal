// Firebase Firestore-based admin notifications page

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { getHODNotifications, createNotification } from '@/services/notificationService';
import { Notification } from '@/types/leave';
import { Bell, Send, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { toast } from 'sonner';

export function AdminNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);

  // Form state
  const [selectedFacultyEmail, setSelectedFacultyEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadFaculties();
  }, [user]);

  const loadNotifications = async () => {
    if (!user || user.role !== 'hod') return;
    try {
      const notifs = await getHODNotifications(user.department || '');
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
    if (!user || user.role !== 'hod') return;
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'faculty'), where('department', '==', user.department));
      const snap = await getDocs(q);
      setFaculties(snap.docs.map(d => d.data()));
    } catch (error) {
      console.error('Error loading faculties:', error);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFacultyEmail || !message) return;

    setIsSending(true);
    try {
      if (selectedFacultyEmail === 'all') {
        const promises = faculties.map(f => createNotification('faculty', user.department || '', `Message from HOD: ${message}`, f.email));
        await Promise.all(promises);
      } else {
        await createNotification('faculty', user.department || '', `Message from HOD: ${message}`, selectedFacultyEmail);
      }

      toast.success('Notification sent successfully');
      setMessage('');
      setSelectedFacultyEmail('');
      setShowSendForm(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  if (!user || user.role !== 'hod') return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <PageHeader
          title="Notifications"
          description={`Department: ${user.department}`}
        />
        <Button
          onClick={() => setShowSendForm(!showSendForm)}
          variant={showSendForm ? "outline" : "default"}
        >
          {showSendForm ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Send Message</>}
        </Button>
      </div>

      {showSendForm && (
        <DataCard title="Send Message to Faculty" className="bg-muted/30 border-primary/20">
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="faculty">Select Faculty</Label>
              <Select
                value={selectedFacultyEmail}
                onValueChange={setSelectedFacultyEmail}
                disabled={isSending || faculties.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={faculties.length === 0 ? "Loading faculties..." : "Select a faculty member"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Broadcast to All Faculty in Department</SelectItem>
                  {faculties.map((f, idx) => (
                    <SelectItem key={idx} value={f.email}>{f.name} ({f.erpId})</SelectItem>
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
            <Button type="submit" disabled={isSending || !selectedFacultyEmail || !message} className="w-full md:w-auto bg-primary">
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
            <EmptyState
              title="No notifications"
              description="You have no messages yet"
              icon={<Bell className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Card key={notif.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.read && <Badge className="bg-blue-100 text-blue-800">New</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminNotificationsPage;
