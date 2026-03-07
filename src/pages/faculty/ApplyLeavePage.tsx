import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { createLeaveRequest, getLeaveRequestsByFaculty } from '@/services/leaveService';
import { createNotification } from '@/services/notificationService';
import { LeaveRequest } from '@/types/leave';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export function ApplyLeavePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);

  const [formData, setFormData] = useState({
    type: 'casual' as 'casual' | 'paid' | 'sick',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  // Calculate balances (Assuming basic quota: Casual: 15, Paid: 12, Sick: 5)
  const [balances, setBalances] = useState({ casual: 15, paid: 12, sick: 5 });

  useEffect(() => {
    if (user?.email) {
      const fetchLeaveData = async () => {
        let quotas = { casual: 15, paid: 12, sick: 5 };
        try {
          const docRef = doc(db, 'settings', 'college');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().leaveQuotas) {
            quotas = docSnap.data().leaveQuotas;
          }
        } catch (error) {
          console.error("Error fetching leave quotas", error);
        }

        getLeaveRequestsByFaculty(user.email).then(reqs => {
          setLeaveHistory(reqs);
          // Calculate used leaves
          let usedCasual = 0, usedPaid = 0, usedSick = 0;
          reqs.forEach(r => {
            if (r.status === 'approved') {
              const days = Math.floor((new Date(r.toDate).getTime() - new Date(r.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
              if (r.type === 'casual') usedCasual += days;
              if (r.type === 'paid') usedPaid += days;
              if (r.type === 'sick') usedSick += days;
            }
          });
          setBalances({
            casual: Math.max(0, quotas.casual - usedCasual),
            paid: Math.max(0, quotas.paid - usedPaid),
            sick: Math.max(0, quotas.sick - usedSick)
          });
          setFetchingHistory(false);
        });
      };
      fetchLeaveData();
    }
  }, [user]);

  if (!user || user.role !== 'faculty') return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fromDate || !formData.toDate || !formData.reason.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    if (new Date(formData.fromDate) > new Date(formData.toDate)) {
      toast({ title: 'Error', description: 'From date must be before to date', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      await createLeaveRequest(
        user.email,
        user.name,
        user.erpId || 'N/A',
        user.department || '',
        formData.type,
        formData.reason,
        formData.fromDate,
        formData.toDate
      );

      await createNotification(
        'hod',
        user.department || '',
        `New leave request from ${user.name} (${user.erpId || 'N/A'}) from ${formData.fromDate} to ${formData.toDate}`
      );

      toast({ title: 'Success', description: 'Leave request sent to HOD' });

      setFormData({ type: 'casual', fromDate: '', toDate: '', reason: '' });
      setTimeout(() => navigate('/faculty/leave-history'), 1500);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit leave request', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getDayModifiers = () => {
    const modifiers: Record<string, Date[]> = {
      casual: [],
      paid: [],
      sick: []
    };

    leaveHistory.filter(req => req.status === 'approved').forEach(req => {
      const start = parseISO(req.fromDate);
      const end = parseISO(req.toDate);
      const dates = [];
      let currentDate = new Date(start);
      while (currentDate <= end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      if (req.type === 'casual') modifiers.casual.push(...dates);
      else if (req.type === 'paid') modifiers.paid.push(...dates);
      else if (req.type === 'sick') modifiers.sick.push(...dates);
    });
    return modifiers;
  };

  const modifiers = getDayModifiers();
  const modifiersStyles = {
    casual: { color: 'white', backgroundColor: '#ef4444' }, // red
    paid: { color: 'black', backgroundColor: '#eab308' }, // yellow
    sick: { color: 'white', backgroundColor: '#3b82f6' } // blue
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Apply for Leave"
        description="Submit your leave request and view available balance"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balances</CardTitle>
            </CardHeader>
            <CardContent>
              {fetchingHistory ? (
                <div className="text-center text-sm text-muted-foreground">Calculating balances...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg border border-border bg-red-500/10">
                    <span className="font-medium text-red-600 dark:text-red-400">Casual Leave</span>
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">{balances.casual}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg border border-border bg-yellow-500/10">
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">Paid Leave</span>
                    <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{balances.paid}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg border border-border bg-blue-500/10">
                    <span className="font-medium text-blue-600 dark:text-blue-400">Sick Leave</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{balances.sick}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-0 pb-4">
              <Calendar
                mode="single"
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-md border-0 pointer-events-none"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Leave Request Form</CardTitle>
              <CardDescription>
                Department: <span className="font-semibold">{user.department}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Leave Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={val => setFormData(prev => ({ ...prev, type: val as any }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                      <SelectItem value="paid">Paid Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">From Date *</Label>
                    <Input
                      id="fromDate" name="fromDate" type="date"
                      value={formData.fromDate} onChange={handleChange} required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toDate">To Date *</Label>
                    <Input
                      id="toDate" name="toDate" type="date"
                      value={formData.toDate} onChange={handleChange} required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Leave *</Label>
                  <Textarea
                    id="reason" name="reason" placeholder="Provide details about your leave request..."
                    value={formData.reason} onChange={handleChange} rows={5} required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/faculty')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ApplyLeavePage;
