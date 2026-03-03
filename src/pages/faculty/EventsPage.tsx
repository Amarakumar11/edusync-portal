import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, MapPin, Clock, ExternalLink, FileText, Plus, FileUp, Send } from 'lucide-react';
import { format, isAfter, isToday, parseISO } from 'date-fns';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { EventStatus } from '@/types';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  time: string;
  venue: string;
  link?: string;
  pdfUrl?: string;
  createdBy: string;
  department: string;
}

const getEventStatus = (dateString: string): EventStatus => {
  const date = new Date(dateString);
  if (isToday(date)) return 'current';
  if (isAfter(date, new Date())) return 'upcoming';
  return 'past';
};

const EventCard = ({ event }: { event: Event }) => {
  const status = getEventStatus(event.date);

  return (
    <div className="p-4 rounded-xl border border-border bg-card hover:shadow-card-hover transition-shadow flex flex-col h-full">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h4 className="font-display font-semibold text-foreground line-clamp-2">{event.title}</h4>
        {status === 'current' && (
          <Badge className="bg-success text-success-foreground shrink-0">Today</Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
        {event.description}
      </p>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary/60" />
          <span className="truncate">{format(new Date(event.date), 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-primary/60" />
          <span className="truncate">{event.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-primary/60" />
          <span className="truncate">{event.venue}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border">
        {event.link && (
          <Button variant="outline" size="sm" asChild className="flex-1">
            <a href={event.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Link
            </a>
          </Button>
        )}
        {event.pdfUrl && (
          <Button variant="outline" size="sm" asChild className="flex-1 border-primary/20 text-primary hover:bg-primary/10">
            <a href={event.pdfUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

export function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'events'), orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      // Optionally filter by department if needed
      // const filtered = fetched.filter(e => e.department === user?.department || e.department === 'All');
      setEvents(fetched);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date || !time || !venue || !user) return;

    setIsPublishing(true);
    let pdfUrl = '';
    try {
      if (file) {
        const storageRef = ref(storage, `events/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        pdfUrl = await getDownloadURL(uploadResult.ref);
      }

      await addDoc(collection(db, 'events'), {
        title,
        description,
        date,
        time,
        venue,
        link: link || null,
        pdfUrl: pdfUrl || null,
        createdBy: user.name,
        department: user.department || 'All',
        createdAt: new Date().toISOString()
      });

      toast.success('Event published successfully');
      setShowPublishForm(false);
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setVenue('');
      setLink('');
      setFile(null);
      fetchEvents();
    } catch (error) {
      console.error('Error publishing event:', error);
      toast.error('Failed to publish event');
    } finally {
      setIsPublishing(false);
    }
  };

  const upcomingEvents = events.filter(e => getEventStatus(e.date) === 'upcoming');
  const currentEvents = events.filter(e => getEventStatus(e.date) === 'current');
  const pastEvents = events.filter(e => getEventStatus(e.date) === 'past');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <PageHeader
          title="Events"
          description="Stay updated with college events"
        />
        {user?.role === 'hod' && (
          <Button
            onClick={() => setShowPublishForm(!showPublishForm)}
            variant={showPublishForm ? "outline" : "default"}
          >
            {showPublishForm ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Create Event</>}
          </Button>
        )}
      </div>

      {showPublishForm && user?.role === 'hod' && (
        <DataCard title="Create New Event" className="bg-muted/30 border-primary/20">
          <form onSubmit={handlePublish} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title" placeholder="e.g. Technical Symposium" required
                  value={title} onChange={e => setTitle(e.target.value)} disabled={isPublishing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue" placeholder="e.g. Main Auditorium" required
                  value={venue} onChange={e => setVenue(e.target.value)} disabled={isPublishing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date" type="date" required
                  value={date} onChange={e => setDate(e.target.value)} disabled={isPublishing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time" type="time" required
                  value={time} onChange={e => setTime(e.target.value)} disabled={isPublishing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Registration Link (Optional)</Label>
                <Input
                  id="link" type="url" placeholder="https://..."
                  value={link} onChange={e => setLink(e.target.value)} disabled={isPublishing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Event PDF/Brochure (Optional)</Label>
                <Input
                  id="file" type="file" accept=".pdf"
                  onChange={e => setFile(e.target.files?.[0] || null)} disabled={isPublishing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description" placeholder="Describe the event..." required className="min-h-[100px]"
                value={description} onChange={e => setDescription(e.target.value)} disabled={isPublishing}
              />
            </div>

            <Button type="submit" disabled={isPublishing} className="w-full md:w-auto bg-primary hover:bg-primary/90">
              {isPublishing ? 'Creating...' : <><Send className="mr-2 h-4 w-4" /> Publish Event</>}
            </Button>
          </form>
        </DataCard>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading events...</div>
      ) : (
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="current">
              Current {currentEvents.length > 0 && `(${currentEvents.length})`}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming {upcomingEvents.length > 0 && `(${upcomingEvents.length})`}
            </TabsTrigger>
            <TabsTrigger value="past">
              Past {pastEvents.length > 0 && `(${pastEvents.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            {currentEvents.length === 0 ? (
              <DataCard title="">
                <div className="py-12 text-center text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events happening today.</p>
                </div>
              </DataCard>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-wrap">
                {currentEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingEvents.length === 0 ? (
              <DataCard title="">
                <div className="py-12 text-center text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events.</p>
                </div>
              </DataCard>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-wrap">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastEvents.length === 0 ? (
              <DataCard title="">
                <div className="py-12 text-center text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No past events recorded.</p>
                </div>
              </DataCard>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-wrap">
                {pastEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default EventsPage;
