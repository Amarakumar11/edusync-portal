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
import { Megaphone, Plus, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdBy: string;
  department: string;
  createdAt: string;
}

export function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Publish form state
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchAnnouncements = async () => {
    if (!user) return;
    try {
      // Fetch all announcements ordered by time, then filter in memory to avoid index requirements
      const q = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      let fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];

      // Filter by department
      if (user.role === 'hod' || user.role === 'faculty') {
        fetched = fetched.filter(a => a.department === user.department || a.department === 'All');
      }

      setAnnouncements(fetched);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [user]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || !user) return;

    setIsPublishing(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        message,
        priority,
        createdBy: user.name,
        department: user.department || 'All',
        createdAt: new Date().toISOString()
      });
      toast.success('Announcement published');
      setTitle('');
      setMessage('');
      setPriority('medium');
      setShowPublishForm(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Failed to publish announcement');
    } finally {
      setIsPublishing(false);
    }
  };

  const getPriorityBadge = (p: 'low' | 'medium' | 'high') => {
    switch (p) {
      case 'high':
        return <Badge variant="destructive">Important</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Notice</Badge>;
      case 'low':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <PageHeader
          title="Announcements"
          description="Stay updated with the latest announcements"
        />
        {user?.role === 'hod' && (
          <Button
            onClick={() => setShowPublishForm(!showPublishForm)}
            variant={showPublishForm ? "outline" : "default"}
          >
            {showPublishForm ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Publish New</>}
          </Button>
        )}
      </div>

      {showPublishForm && user?.role === 'hod' && (
        <DataCard title="Publish Announcement" className="bg-muted/30 border-primary/20">
          <form onSubmit={handlePublish} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Announcement Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={isPublishing}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(val: any) => setPriority(val)}
                  disabled={isPublishing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Info)</SelectItem>
                    <SelectItem value="medium">Medium (Notice)</SelectItem>
                    <SelectItem value="high">High (Important)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type the announcement details here..."
                className="min-h-[100px]"
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={isPublishing}
                required
              />
            </div>
            <Button type="submit" disabled={isPublishing || !title || !message} className="w-full md:w-auto bg-primary hover:bg-primary/90">
              <Send className="mr-2 h-4 w-4" />
              {isPublishing ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </form>
        </DataCard>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <DataCard title="No Announcements">
            <div className="py-12 text-center text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No announcements at the moment.</p>
            </div>
          </DataCard>
        ) : (
          announcements.map((announcement) => (
            <DataCard
              key={announcement.id}
              className="hover:shadow-card-hover transition-shadow"
              contentClassName="p-5"
            >
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3 w-full">
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${announcement.priority === 'high' ? 'bg-destructive' :
                        announcement.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                        {announcement.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {announcement.message}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 self-start mt-2 sm:mt-0">
                    {getPriorityBadge(announcement.priority)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 mt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground/70">{announcement.createdBy}</span>
                    <span>•</span>
                    <span>{announcement.department} Dept</span>
                  </div>
                  <span>{formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </DataCard>
          ))
        )}
      </div>
    </div>
  );
}

export default AnnouncementsPage;
