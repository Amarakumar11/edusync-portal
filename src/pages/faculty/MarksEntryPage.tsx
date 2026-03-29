import { useState } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function MarksEntryPage() {
    const { user } = useAuth();
    const [examId, setExamId] = useState('');
    const [subject, setSubject] = useState('');
    const [section, setSection] = useState('');
    const [maxMarks, setMaxMarks] = useState('100');

    // Dummy students for demonstration
    const [students, setStudents] = useState([
        { id: '1', rollNo: '24B81A0501', name: 'John Doe', marks: '' },
        { id: '2', rollNo: '24B81A0502', name: 'Jane Smith', marks: '' },
        { id: '3', rollNo: '24B81A0503', name: 'Alice Johnson', marks: '' },
        { id: '4', rollNo: '24B81A0504', name: 'Bob Brown', marks: '' },
        { id: '5', rollNo: '24B81A0505', name: 'Charlie Davis', marks: '' },
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateMarks = (id: string, marks: string) => {
        setStudents(students.map(s => s.id === id ? { ...s, marks } : s));
    };

    const handleSubmit = async () => {
        if (!subject || !section || !examId || !maxMarks) {
            toast.error('Please fill all details before submitting.');
            return;
        }

        setIsSubmitting(true);
        try {
            const marksData = {
                facultyId: user?.uid,
                facultyName: user?.name,
                examId,
                subject,
                section,
                maxMarks: Number(maxMarks),
                records: students.map(s => ({ rollNo: s.rollNo, marks: Number(s.marks) || 0 })),
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'exam_marks'), marksData);
            toast.success('Marks recorded successfully!');
        } catch (error) {
            console.error('Error saving marks:', error);
            toast.error('Failed to record marks');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Marks Entry"
                description="Enter marks for students across different examinations"
            />

            <div className="grid lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1 border-primary/10 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Exam Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Examination Name</Label>
                            <Input placeholder="e.g. Mid-1, Internal Lab" value={examId} onChange={e => setExamId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input placeholder="Enter subject name" value={subject} onChange={e => setSubject(e.target.value)} />
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
                            <Label>Maximum Marks</Label>
                            <Input type="number" placeholder="100" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-primary/10">
                    <CardHeader>
                        <CardTitle className="text-lg">Students Marks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium border-b">
                                <div className="col-span-4">Roll No</div>
                                <div className="col-span-5">Student Name</div>
                                <div className="col-span-3 text-right">Marks (/{maxMarks})</div>
                            </div>
                            <div className="divide-y max-h-[500px] overflow-y-auto w-full">
                                {students.map((student) => (
                                    <div key={student.id} className="grid grid-cols-12 p-3 items-center hover:bg-muted/30 transition-colors">
                                        <div className="col-span-4 font-medium text-sm">{student.rollNo}</div>
                                        <div className="col-span-5 text-sm">{student.name}</div>
                                        <div className="col-span-3 flex justify-end">
                                            <Input
                                                type="number"
                                                className="w-24 text-right"
                                                placeholder="0"
                                                min="0"
                                                max={maxMarks}
                                                value={student.marks}
                                                onChange={(e) => updateMarks(student.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Submit Marks'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default MarksEntryPage;
