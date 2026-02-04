import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Badge } from '@/components/ui/badge';
import { Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdBy: string;
  createdAt: Date;
}

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Faculty Meeting Tomorrow',
    message: 'All faculty members are requested to attend the meeting tomorrow at 10:00 AM in the conference hall. Agenda includes discussion on the upcoming semester schedule and examination patterns.',
    priority: 'high',
    createdBy: 'Admin',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    title: 'Mid-term Exam Schedule Released',
    message: 'The mid-term examination schedule has been finalized. Please check the examination portal for your invigilation duties. Contact the examination cell for any queries.',
    priority: 'medium',
    createdBy: 'Exam Cell',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '3',
    title: 'Holiday Notice - Republic Day',
    message: 'The institution will remain closed on January 26th on account of Republic Day. Regular classes will resume from January 27th.',
    priority: 'low',
    createdBy: 'Admin',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    title: 'Workshop on AI in Education',
    message: 'A two-day workshop on "Artificial Intelligence in Education" will be conducted on February 10-11. Faculty members interested in participating may register through the training portal.',
    priority: 'medium',
    createdBy: 'Training Cell',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
];

const getPriorityBadge = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'high':
      return <Badge className="badge-destructive">Important</Badge>;
    case 'medium':
      return <Badge className="badge-warning">Notice</Badge>;
    case 'low':
      return <Badge className="badge-info">Info</Badge>;
  }
};

export function AnnouncementsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Announcements"
        description="Stay updated with the latest announcements"
      />

      <div className="space-y-4">
        {mockAnnouncements.length === 0 ? (
          <DataCard title="No Announcements">
            <div className="py-12 text-center text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No announcements at the moment.</p>
            </div>
          </DataCard>
        ) : (
          mockAnnouncements.map((announcement) => (
            <DataCard 
              key={announcement.id}
              title=""
              className="hover:shadow-card-hover transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      announcement.priority === 'high' ? 'bg-destructive' :
                      announcement.priority === 'medium' ? 'bg-warning' : 'bg-info'
                    }`} />
                    <h3 className="font-display font-semibold text-lg text-foreground">
                      {announcement.title}
                    </h3>
                  </div>
                  {getPriorityBadge(announcement.priority)}
                </div>
                
                <p className="text-muted-foreground leading-relaxed">
                  {announcement.message}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                  <span>Posted by {announcement.createdBy}</span>
                  <span>{formatDistanceToNow(announcement.createdAt, { addSuffix: true })}</span>
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
