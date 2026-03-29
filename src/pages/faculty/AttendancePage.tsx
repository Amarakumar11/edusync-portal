import { useState } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function AttendancePage() {
    const { user } = useAuth();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [subject, setSubject] = useState('');
    const [section, setSection] = useState('');
    const [batch, setBatch] = useState('');

    // Dummy students for demonstration
    const [students, setStudents] = useState([
        { id: '1', rollNo: '24B81A0501', name: 'John Doe', present: true },
        { id: '2', rollNo: '24B81A0502', name: 'Jane Smith', present: true },
        { id: '3', rollNo: '24B81A0503', name: 'Alice Johnson', present: true },
        { id: '4', rollNo: '24B81A0504', name: 'Bob Brown', present: true },
        { id: '5', rollNo: '24B81A0505', name: 'Charlie Davis', present: true },
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleAttendance = (id: string) => {
        setStudents(students.map(s => s.id === id ? { ...s, present: !s.present } : s));
    };

    const markAll = (present: boolean) => {
        setStudents(students.map(s => ({ ...s, present })));
    };

    const handleSubmit = async () => {
        if (!subject || !section || !batch) {
            toast.error('Please fill all details before submitting.');
            return;
        }

        setIsSubmitting(true);
        try {
            const attendanceData = {
                facultyId: user?.uid,
                facultyName: user?.name,
                date,
                subject,
                section,
                batch,
                presentCount: students.filter(s => s.present).length,
                totalCount: students.length,
                records: students.map(s => ({ rollNo: s.rollNo, present: s.present })),
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'attendance'), attendanceData);
            toast.success('Attendance recorded successfully!');
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.error('Failed to record attendance');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Attendance Management"
                description="Mark daily attendance for your classes"
            />

            <div className="grid lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1 border-primary/10 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Class Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Batch (e.g. 2024-2028)</Label>
                            <Input placeholder="Enter batch" value={batch} onChange={e => setBatch(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Section</Label>
                            <Select onValueChange={setSection} value={section}>
                                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">Section A</SelectItem>
                                    <SelectItem value="B">Section B</SelectItem>
                                    <SelectItem value="C">Section C</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input placeholder="Enter subject name" value={subject} onChange={e => setSubject(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Student Attendance List</CardTitle>
                        <div className="space-x-2">
                            <Button variant="outline" size="sm" onClick={() => markAll(true)}>Mark All Present</Button>
                            <Button variant="outline" size="sm" onClick={() => markAll(false)}>Mark All Absent</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium border-b">
                                <div className="col-span-3">Roll No</div>
                                <div className="col-span-6">Student Name</div>
                                <div className="col-span-3 text-right pr-4">Status</div>
                            </div>
                            <div className="divide-y max-h-[500px] overflow-y-auto">
                                {students.map((student) => (
                                    <div key={student.id} className="grid grid-cols-12 p-3 items-center hover:bg-muted/30 transition-colors">
                                        <div className="col-span-3 font-medium text-sm">{student.rollNo}</div>
                                        <div className="col-span-6 text-sm">{student.name}</div>
                                        <div className="col-span-3 flex justify-end items-center gap-3">
                                            <span className={`text-xs font-medium ${student.present ? 'text-success' : 'text-destructive'}`}>
                                                {student.present ? 'Present' : 'Absent'}
                                            </span>
                                            <Switch
                                                checked={student.present}
                                                onCheckedChange={() => toggleAttendance(student.id)}
                                                className={student.present ? 'bg-success' : 'bg-destructive'}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end items-center gap-4">
                            <div className="text-sm">
                                Present: <span className="font-bold text-success">{students.filter(s => s.present).length}</span> / {students.length}
                            </div>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Submit Attendance'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default AttendancePage;
