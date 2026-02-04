import { useState } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Send, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  senderName: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const mockReceivedNotifications: Notification[] = [
  {
    id: '1',
    senderName: 'Admin',
    message: 'Your leave request for January 15th has been approved.',
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: '2',
    senderName: 'Dr. Smith',
    message: 'Please share the lab manual for Database Systems.',
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: '3',
    senderName: 'Admin',
    message: 'Prof. Johnson is on leave today. Please take classes as per timetable.',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

const mockSentNotifications: Notification[] = [
  {
    id: '1',
    senderName: 'Dr. Smith',
    message: 'Lab manual has been shared. Please check your email.',
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

const recipients = [
  { id: 'admin', name: 'Admin' },
  { id: 'faculty-1', name: 'Dr. Smith' },
  { id: 'faculty-2', name: 'Prof. Johnson' },
  { id: 'faculty-3', name: 'Dr. Williams' },
  { id: 'all', name: 'All Faculty' },
];

export function NotificationsPage() {
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [received, setReceived] = useState(mockReceivedNotifications);
  const [sent, setSent] = useState(mockSentNotifications);

  const unreadCount = received.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setReceived(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleSend = () => {
    if (!newMessage.trim() || !selectedRecipient) return;

    const recipient = recipients.find(r => r.id === selectedRecipient);
    const newNotification: Notification = {
      id: Date.now().toString(),
      senderName: recipient?.name || 'Unknown',
      message: newMessage,
      read: true,
      createdAt: new Date(),
    };

    setSent(prev => [newNotification, ...prev]);
    setNewMessage('');
    setSelectedRecipient('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Notifications"
        description="View and send notifications"
      />

      <Tabs defaultValue="received" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="received" className="relative">
            Received
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground h-5 min-w-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="send">Send</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <DataCard title="Received Notifications" contentClassName="p-0">
            {received.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {received.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {notification.senderName}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DataCard>
        </TabsContent>

        <TabsContent value="send">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Send Form */}
            <DataCard title="Send Notification">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient</label>
                  <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.map(recipient => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          {recipient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
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
