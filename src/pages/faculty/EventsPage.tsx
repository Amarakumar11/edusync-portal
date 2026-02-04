import { useState } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, MapPin, Clock, ExternalLink, FileText } from 'lucide-react';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import type { EventStatus } from '@/types';

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  venue: string;
  link?: string;
  pdfUrl?: string;
}

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Annual Sports Day',
    description: 'Join us for the annual sports day celebration with various competitions and events.',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    time: '9:00 AM',
    venue: 'Main Ground',
  },
  {
    id: '2',
    title: 'Technical Symposium',
    description: 'A two-day technical symposium featuring workshops, hackathons, and guest lectures.',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    time: '10:00 AM',
    venue: 'Main Auditorium',
    link: 'https://example.com/symposium',
  },
  {
    id: '3',
    title: 'Faculty Development Program',
    description: 'Training session on modern teaching methodologies and digital tools.',
    date: new Date(),
    time: '2:00 PM',
    venue: 'Seminar Hall',
  },
  {
    id: '4',
    title: 'Guest Lecture Series',
    description: 'Distinguished lecture by industry experts on emerging technologies.',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    time: '11:00 AM',
    venue: 'Conference Hall',
    pdfUrl: '/events/guest-lecture.pdf',
  },
  {
    id: '5',
    title: 'Research Seminar',
    description: 'Presentation of faculty research papers and collaborative discussions.',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    time: '3:00 PM',
    venue: 'Research Center',
  },
];

const getEventStatus = (date: Date): EventStatus => {
  if (isToday(date)) return 'current';
  if (isAfter(date, new Date())) return 'upcoming';
  return 'past';
};

const EventCard = ({ event }: { event: Event }) => {
  const status = getEventStatus(event.date);
  
  return (
    <div className="p-4 rounded-xl border border-border bg-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h4 className="font-display font-semibold text-foreground">{event.title}</h4>
        {status === 'current' && (
          <Badge className="bg-success text-success-foreground">Today</Badge>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {event.description}
      </p>
      
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          {format(event.date, 'MMM d, yyyy')}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {event.time}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {event.venue}
        </span>
      </div>
      
      {(event.link || event.pdfUrl) && (
        <div className="flex gap-2">
          {event.link && (
            <Button variant="outline" size="sm" asChild>
              <a href={event.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Learn More
              </a>
            </Button>
          )}
          {event.pdfUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={event.pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-4 w-4" />
                View PDF
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export function EventsPage() {
  const upcomingEvents = mockEvents.filter(e => getEventStatus(e.date) === 'upcoming');
  const currentEvents = mockEvents.filter(e => getEventStatus(e.date) === 'current');
  const pastEvents = mockEvents.filter(e => getEventStatus(e.date) === 'past');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Events"
        description="Stay updated with college events"
      />

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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <p>No past events.</p>
              </div>
            </DataCard>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EventsPage;
