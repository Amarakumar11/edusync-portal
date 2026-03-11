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
import { LeaveRequest, LeaveSwap } from '@/types/leave';
import { format, parseISO } from 'date-fns';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { Clock4, CheckCircle2, ShieldAlert, Send, ArrowRight, BookOpen, Users, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ApplyLeavePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any>(null);
  const [swaps, setSwaps] = useState<LeaveSwap[]>([]);

  const [formData, setFormData] = useState({
    type: 'casual' as 'casual' | 'paid' | 'sick',
    fromDate: '',
    fromTime: '',
    toDate: '',
    toTime: '',
    durationInDays: '1',
    reason: '',
  });

  const [timings, setTimings] = useState<any[]>([]);
  const quickDurations = ['0.5', '1', '1.5', '2', '3'];

  // Calculate balances
  const [balances, setBalances] = useState({ casual: 15, paid: 12, sick: 5 });

  useEffect(() => {
    if (user?.email) {
      const fetchLeaveData = async () => {
        let quotas = { casual: 15, paid: 12, sick: 5 };
        try {
          const docRef = doc(db, 'settings', 'college');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.leaveQuotas) quotas = data.leaveQuotas;
            if (data.timings) {
              // Sort timings by start time
              const sortedTimings = [...data.timings].sort((a, b) => {
                const [aStart] = a.timeRange.split(' - ');
                const [bStart] = b.timeRange.split(' - ');
                return aStart.localeCompare(bStart);
              });
              setTimings(sortedTimings);

              // Set defaults if currently empty
              setFormData(prev => ({
                ...prev,
                fromTime: prev.fromTime || sortedTimings[0]?.timeRange || '',
                toTime: prev.toTime || sortedTimings[sortedTimings.length - 1]?.timeRange || ''
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching leave quotas", error);
        }

        getLeaveRequestsByFaculty(user.email).then(reqs => {
          setLeaveHistory(reqs);
          let usedCasual = 0, usedPaid = 0, usedSick = 0;
          reqs.forEach(r => {
            if (r.status === 'approved') {
              const days = r.durationInDays || 1;
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

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'faculty'));
        const snap = await getDocs(q);
        setFacultyList(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((f: any) => f.email !== user?.email));

        if (user?.uid) {
          const tDoc = await getDoc(doc(db, 'timetables', user.uid));
          if (tDoc.exists() && tDoc.data().schedule) {
            setTimetable(tDoc.data().schedule);
          }
        }
      } catch (err) {
        console.error("Error fetching global data for leave apply", err);
      }
    };
    fetchGlobalData();
  }, [user]);

  useEffect(() => {
    if (formData.fromDate && formData.toDate && timetable) {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);
      if (end < start) {
        setSwaps([]);
        return;
      }

      // Convert fromTime and toTime to comparable numbers (e.g. "9:30" -> 9.5)
      const timeToNum = (timeStr: string) => {
        if (!timeStr) return 0;
        const [time] = timeStr.split(' - '); // get start time of the slot
        const [hours, minutes] = time.split(':').map(Number);
        return hours + (minutes / 60);
      };

      const fromTimeNum = timeToNum(formData.fromTime);
      const toTimeNum = formData.toTime ? timeToNum(formData.toTime.split(' - ')[1] + ' - ') : 24; // get end time of the slot

      const generatedSwaps: LeaveSwap[] = [];
      let currentDate = new Date(start);

      while (currentDate <= end) {
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        const isFirstDay = currentDate.getTime() === start.getTime();
        const isLastDay = currentDate.getTime() === end.getTime();

        if (timetable[dayName]) {
          for (const [slot, entry] of Object.entries(timetable[dayName])) {
            if (entry && (entry as any).subject) {

              // Time filtering
              const slotTimeNum = timeToNum(slot);

              let includeSlot = true;
              if (isFirstDay && slotTimeNum < fromTimeNum) {
                includeSlot = false;
              }
              if (isLastDay && slotTimeNum >= toTimeNum) {
                includeSlot = false;
              }

              if (includeSlot) {
                const e = entry as any;
                generatedSwaps.push({
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  date: currentDate.toISOString().split('T')[0],
                  day: dayName,
                  slot,
                  subject: e.subject,
                  section: e.section,
                  room: e.room,
                  requestToEmail: null,
                  requestToName: null,
                  status: 'pending',
                  acceptedByEmail: null,
                  acceptedByName: null
                });
              }
            }
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setSwaps(prev => {
        return generatedSwaps.map(newSwap => {
          const existing = prev.find(p => p.date === newSwap.date && p.slot === newSwap.slot);
          return existing ? existing : newSwap;
        });
      });
    } else {
      setSwaps([]);
    }
  }, [formData.fromDate, formData.toDate, formData.fromTime, formData.toTime, timetable]);

  if (!user || user.role !== 'faculty') return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const setFormatDuration = (val: string) => {
    setFormData(prev => ({ ...prev, durationInDays: val }));
  };

  const handleSwapAssign = (swapId: string, facultyEmail: string) => {
    setSwaps(prev => prev.map(s => {
      if (s.id === swapId) {
        if (facultyEmail === 'any') {
          return { ...s, requestToEmail: null, requestToName: null };
        }
        const fac = facultyList.find(f => f.email === facultyEmail);
        return { ...s, requestToEmail: facultyEmail, requestToName: fac?.name || null };
      }
      return s;
    }));
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

    const durationNum = parseFloat(formData.durationInDays);
    if (isNaN(durationNum) || durationNum <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid duration', variant: 'destructive' });
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
        formData.toDate,
        durationNum,
        swaps,
        formData.fromTime,
        formData.toTime
      );

      for (const swap of swaps) {
        if (swap.requestToEmail) {
          await createNotification(
            'faculty',
            user.department || '',
            `Swap request from ${user.name} for ${swap.subject} on ${swap.date} (${swap.slot})`,
            swap.requestToEmail
          );
        } else {
          await createNotification(
            'faculty',
            user.department || '',
            `Open swap available from ${user.name} for ${swap.subject} on ${swap.date} (${swap.slot})`
          );
        }
      }

      if (swaps.length === 0) {
        await createNotification(
          'hod',
          user.department || '',
          `New leave request from ${user.name} no classes missed, from ${formData.fromDate} to ${formData.toDate}`
        );
      }

      toast({ title: 'Success', description: 'Leave request submitted beautifully!' });
      setTimeout(() => navigate('/faculty/leave-history'), 1500);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit leave request', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="bg-primary/10 text-primary p-2 rounded-xl">
              <Clock4 className="w-8 h-8" />
            </span>
            Apply for Leave
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Submit your leave request and easily coordinate class substitutions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-red-500 to-rose-600 border-0 shadow-lg shadow-red-500/20 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-20"><ShieldAlert className="w-24 h-24" /></div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-red-100 font-medium text-lg">Casual Leave</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-bold">{fetchingHistory ? '-' : balances.casual}</div>
            <p className="text-red-200 mt-1 text-sm">Days Available</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-400 to-orange-500 border-0 shadow-lg shadow-amber-500/20 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Clock4 className="w-24 h-24" /></div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-amber-100 font-medium text-lg">Paid Leave</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-bold">{fetchingHistory ? '-' : balances.paid}</div>
            <p className="text-amber-200 mt-1 text-sm">Days Available</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-0 shadow-lg shadow-blue-500/20 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-20"><CheckCircle2 className="w-24 h-24" /></div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-blue-100 font-medium text-lg">Sick Leave</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-bold">{fetchingHistory ? '-' : balances.sick}</div>
            <p className="text-blue-200 mt-1 text-sm">Days Available</p>
          </CardContent>
        </Card>
      </div>

      <form id="leave-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-border shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-xl">Leave Details</CardTitle>
                <CardDescription>Specify the type, duration, and dates for your leave.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                <div className="space-y-3">
                  <Label htmlFor="type" className="text-sm font-semibold text-foreground">Leave Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={val => setFormData(prev => ({ ...prev, type: val as any }))}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-12 border-primary/20 bg-muted/30 focus:ring-primary/40 focus:ring-offset-0">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                      <SelectItem value="paid">Paid Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="durationInDays" className="text-sm font-semibold text-foreground">Duration (Days)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {quickDurations.map(dur => (
                      <Button
                        key={dur}
                        type="button"
                        variant={formData.durationInDays === dur ? "default" : "outline"}
                        className={cn("h-8 px-3 text-xs rounded-full transition-all", formData.durationInDays === dur ? "shadow-md" : "border-border/50")}
                        onClick={() => setFormatDuration(dur)}
                      >
                        {dur} Day{dur !== '1' ? 's' : ''}
                      </Button>
                    ))}
                  </div>
                  <div className="relative">
                    <Input
                      id="durationInDays" name="durationInDays" type="number" step="0.5" min="0.5" max="365"
                      placeholder="e.g. 3.5"
                      className="pl-4 h-12 text-lg font-medium border-primary/20 bg-muted/30 transition-all focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                      value={formData.durationInDays} onChange={handleChange} required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="fromDate" className="text-sm font-semibold text-foreground">From Date</Label>
                    <Input
                      id="fromDate" name="fromDate" type="date"
                      className="h-12 border-primary/20 bg-muted/30 focus-visible:ring-primary/40"
                      value={formData.fromDate} onChange={handleChange} required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="fromTime" className="text-sm font-semibold text-foreground">Start Time</Label>
                    <Select
                      value={formData.fromTime}
                      onValueChange={val => setFormData(prev => ({ ...prev, fromTime: val }))}
                    >
                      <SelectTrigger className="h-12 border-primary/20 bg-muted/30 focus:ring-primary/40 focus:ring-offset-0">
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timings.map(t => (
                          <SelectItem key={`from-${t.id}`} value={t.timeRange}>{t.timeRange.split(' - ')[0]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="toDate" className="text-sm font-semibold text-foreground">To Date</Label>
                    <Input
                      id="toDate" name="toDate" type="date"
                      className="h-12 border-primary/20 bg-muted/30 focus-visible:ring-primary/40"
                      value={formData.toDate} onChange={handleChange} required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="toTime" className="text-sm font-semibold text-foreground">End Time</Label>
                    <Select
                      value={formData.toTime}
                      onValueChange={val => setFormData(prev => ({ ...prev, toTime: val }))}
                    >
                      <SelectTrigger className="h-12 border-primary/20 bg-muted/30 focus:ring-primary/40 focus:ring-offset-0">
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timings.map(t => (
                          <SelectItem key={`to-${t.id}`} value={t.timeRange}>{t.timeRange.split(' - ')[1]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <Card className="border-border shadow-sm h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">Reason & Justification</CardTitle>
                <CardDescription>Provide details about your leave request.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Textarea
                  id="reason" name="reason" placeholder="I am applying for leave because..."
                  className="flex-1 min-h-[220px] resize-none border-primary/20 bg-muted/30 p-4 text-base focus-visible:ring-primary/40 focus-visible:ring-offset-0 transition-all"
                  value={formData.reason} onChange={handleChange} required
                />
              </CardContent>
            </Card>
          </div>
        </div>
        {
          formData.fromDate && formData.toDate && swaps.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3 mb-6 mt-4">
                <span className="bg-blue-500/10 text-blue-600 p-2 rounded-xl">
                  <Users className="w-6 h-6" />
                </span>
                Substitution Management
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {swaps.map((swap, index) => (
                  <div key={swap.id}
                    className="group relative bg-card border border-border hover:border-primary/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/80 group-hover:bg-primary transition-colors"></div>

                    <div className="flex justify-between items-start mb-3 pl-2">
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-semibold">
                        {swap.date}
                      </Badge>
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock4 className="w-3 h-3" /> {swap.slot}
                      </span>
                    </div>

                    <div className="pl-2 mb-5 flex-1">
                      <h4 className="font-bold text-lg text-foreground line-clamp-1">{swap.subject}</h4>
                      <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Section {swap.section} • Room {swap.room}
                      </p>
                    </div>

                    <div className="pl-2 mt-auto">
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Assign Substitute</Label>
                      <div className="bg-muted/50 rounded-xl p-1.5 border border-border/50 transition-colors focus-within:border-primary/50 focus-within:bg-card">
                        <Select
                          value={swap.requestToEmail || 'any'}
                          onValueChange={(val) => handleSwapAssign(swap.id, val)}
                        >
                          <SelectTrigger className="h-10 border-0 bg-transparent shadow-none focus:ring-0">
                            <SelectValue placeholder="Select Faculty" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="any" className="font-semibold text-primary">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                  <Users className="w-3 h-3" />
                                </div>
                                Open to Anyone
                              </div>
                            </SelectItem>
                            <div className="my-1 border-t border-border" />
                            {facultyList.map(fac => {
                              const initials = fac.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                              return (
                                <SelectItem key={fac.email} value={fac.email}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-muted-foreground/20 text-foreground flex items-center justify-center text-[10px] font-bold">
                                      {initials}
                                    </div>
                                    <span className="truncate">{fac.name} <span className="text-muted-foreground font-normal">({fac.department})</span></span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        <div className="flex items-center justify-end gap-4 pt-6 mt-8 border-t border-border">
          <Button type="button" variant="ghost" className="px-6" onClick={() => navigate('/faculty')}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-primary/20 h-12 px-8 text-base rounded-full"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
            ) : (
              <><Send className="w-5 h-5 mr-2" /> Submit Application</>
            )}
          </Button>
        </div>
      </form >
    </div >
  );
}

export default ApplyLeavePage;
