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
import { createNotification, markAllNotificationsAsRead } from '@/services/notificationService';
import { Notification, Department } from '@/types/leave';
import { Bell, Send, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { toast } from 'sonner';

export function PrincipalNotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSendForm, setShowSendForm] = useState(false);

    // Form state
    const [targetType, setTargetType] = useState<'all' | 'department' | 'faculty'>('all');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedFacultyEmail, setSelectedFacultyEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const [departments, setDepartments] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<any[]>([]);

    useEffect(() => {
        loadNotifications();
        loadMetadata();
    }, [user]);

    const loadNotifications = async () => {
        if (!user || user.role !== 'principal') return;
        try {
            setLoading(true);
            const q = query(collection(db, 'notifications'), where('toRole', '==', 'principal'));
            const snap = await getDocs(q);
            const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));

            setNotifications(
                notifs.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
            );

            // Auto-mark as read
            const unreadCount = notifs.filter(n => !n.read).length;
            if (unreadCount > 0) {
                await markAllNotificationsAsRead('principal', {});
                // Update local state so "New" badges disappear immediately
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMetadata = async () => {
        try {
            const colRef = collection(db, 'users');
            const snap = await getDocs(colRef);
            const allUsers = snap.docs.map(d => d.data());

            const depts = Array.from(new Set(allUsers.filter(u => u.department).map(u => u.department)));
            setDepartments(depts);
            setFaculties(allUsers.filter(u => u.role === 'faculty'));
        } catch (error) {
            console.error('Error loading metadata:', error);
        }
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !message) return;

        setIsSending(true);
        try {
            if (targetType === 'all') {
                // Broadcast to all
                await createNotification('faculty', 'ALL', `Broadcast from Principal: ${message}`);
                await createNotification('hod', 'ALL', `Broadcast from Principal: ${message}`);
            } else if (targetType === 'department') {
                await createNotification('faculty', selectedDepartment, `Message from Principal: ${message}`);
                await createNotification('hod', selectedDepartment, `Message from Principal: ${message}`);
            } else {
                await createNotification('faculty', 'ALL', `Message from Principal: ${message}`, selectedFacultyEmail);
            }

            toast.success('Notification sent successfully');
            setMessage('');
            setShowSendForm(false);
        } catch (error) {
            console.error('Error sending notification:', error);
            toast.error('Failed to send notification');
        } finally {
            setIsSending(false);
        }
    };

    if (!user || user.role !== 'principal') return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <PageHeader
                    title="Principal Notifications"
                    description="Manage college-wide announcements and alerts"
                />
                <Button
                    onClick={() => setShowSendForm(!showSendForm)}
                    variant={showSendForm ? "outline" : "default"}
                >
                    {showSendForm ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> New Announcement</>}
                </Button>
            </div>

            {showSendForm && (
                <DataCard title="Create Announcement" className="bg-muted/30 border-primary/20">
                    <form onSubmit={handleSendNotification} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Everyone (All Faculty & HODs)</SelectItem>
                                        <SelectItem value="department">Specific Department</SelectItem>
                                        <SelectItem value="faculty">Individual Faculty</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {targetType === 'department' && (
                                <div className="space-y-2">
                                    <Label>Select Department</Label>
                                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                        <SelectTrigger><SelectValue placeholder="Chose department" /></SelectTrigger>
                                        <SelectContent>
                                            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {targetType === 'faculty' && (
                                <div className="space-y-2">
                                    <Label>Select Faculty</Label>
                                    <Select value={selectedFacultyEmail} onValueChange={setSelectedFacultyEmail}>
                                        <SelectTrigger><SelectValue placeholder="Choose faculty" /></SelectTrigger>
                                        <SelectContent>
                                            {faculties.map(f => <SelectItem key={f.email} value={f.email}>{f.name} ({f.department})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Type your announcement here..."
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                disabled={isSending}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={isSending || !message} className="w-full md:w-auto bg-primary">
                            <Send className="mr-2 h-4 w-4" />
                            {isSending ? 'Sending...' : 'Send Announcement'}
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
                            description="No messages received yet"
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

export default PrincipalNotificationsPage;
