import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { ExamQuestion, ExamPaper } from '@/types';

export function CreateExamPaperPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [batch, setBatch] = useState('2024-2028');
    const [department, setDepartment] = useState(user?.department || 'CSE');
    const [yearSem, setYearSem] = useState('II-I');
    const [section, setSection] = useState('A');
    const [subject, setSubject] = useState('');
    const [examType, setExamType] = useState('Mid 1');
    const [totalQuestions, setTotalQuestions] = useState(10);
    const [totalObjective, setTotalObjective] = useState(5);
    const [totalDescriptive, setTotalDescriptive] = useState(5);

    const [departmentsList, setDepartmentsList] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const docRef = doc(db, 'settings', 'college');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().departments) {
                    setDepartmentsList(docSnap.data().departments);
                }
            } catch (error) {
                console.error('Error fetching departments:', error);
            }
        };
        fetchDepartments();
    }, []);

    const [questions, setQuestions] = useState<ExamQuestion[]>([
        { qnNumber: 1, text: '', co: 'CO1', btl: 'L1', marks: 1 }
    ]);

    const addQuestion = () => {
        setQuestions([...questions, {
            qnNumber: questions.length + 1,
            text: '',
            co: 'CO1',
            btl: 'L1',
            marks: 1
        }]);
    };

    const updateQuestion = (index: number, field: keyof ExamQuestion, value: string | number) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        // Re-number
        const renumbered = newQuestions.map((q, i) => ({ ...q, qnNumber: i + 1 }));
        setQuestions(renumbered);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (questions.some(q => !q.text.trim())) {
            toast.error("Please fill out all question texts.");
            return;
        }

        setIsSubmitting(true);
        try {
            const paperData: Omit<ExamPaper, 'id'> = {
                batch,
                department,
                yearSem,
                section,
                subject,
                examType,
                totalQuestions,
                totalObjective,
                totalDescriptive,
                questions,
                status: 'pending_hod',
                createdBy: user.id || user.uid,
                createdByName: user.name,
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'exam_papers'), paperData);
            toast.success('Exam paper submitted for HOD approval successfully!');
            navigate('/faculty/exams');
        } catch (error) {
            console.error('Error submitting exam paper:', error);
            toast.error('Failed to submit exam paper.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <PageHeader
                title="Create Exam Paper"
                description="Draft a new examination paper and submit for HOD approval"
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <DataCard title="Header Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Batch</Label>
                            <Input value={batch} onChange={e => setBatch(e.target.value)} placeholder="e.g. 2024-2028" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select value={department} onValueChange={setDepartment}>
                                <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                                <SelectContent>
                                    {departmentsList.length > 0 ? (
                                        departmentsList.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>{dept.name} ({dept.id})</SelectItem>
                                        ))
                                    ) : (
                                        <>
                                            <SelectItem value="CSE">CSE</SelectItem>
                                            <SelectItem value="ECE">ECE</SelectItem>
                                            <SelectItem value="IT">IT</SelectItem>
                                            <SelectItem value="MECH">MECH</SelectItem>
                                            <SelectItem value="CIVIL">CIVIL</SelectItem>
                                            <SelectItem value="EEE">EEE</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Year / Sem</Label>
                            <Input value={yearSem} onChange={e => setYearSem(e.target.value)} placeholder="e.g. II-I" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Section / Set</Label>
                            <Input value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. A" />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. DBMS" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Exam Type</Label>
                            <Select value={examType} onValueChange={setExamType}>
                                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Mid 1">Mid 1</SelectItem>
                                    <SelectItem value="Mid 2">Mid 2</SelectItem>
                                    <SelectItem value="PPT">PPT</SelectItem>
                                    <SelectItem value="Assignment">Assignment</SelectItem>
                                    <SelectItem value="Semester">Semester</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Total Questions</Label>
                            <Input type="number" min="0" value={totalQuestions} onChange={e => setTotalQuestions(Number(e.target.value))} required />
                        </div>
                        <div className="space-y-2">
                            <Label>No. of Objective Qns</Label>
                            <Input type="number" min="0" value={totalObjective} onChange={e => setTotalObjective(Number(e.target.value))} required />
                        </div>
                        <div className="space-y-2">
                            <Label>No. of Descriptive Qns</Label>
                            <Input type="number" min="0" value={totalDescriptive} onChange={e => setTotalDescriptive(Number(e.target.value))} required />
                        </div>
                    </div>
                </DataCard>

                <DataCard title="Questions" action={
                    <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                        <Plus className="h-4 w-4 mr-2" /> Add Question
                    </Button>
                }>
                    <div className="space-y-4">
                        {questions.map((q, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-card/50">
                                <div className="flex-shrink-0 pt-2 font-bold text-muted-foreground w-8">
                                    Q{q.qnNumber}.
                                </div>
                                <div className="flex-grow space-y-4">
                                    <Textarea
                                        placeholder="Enter question text..."
                                        value={q.text}
                                        onChange={e => updateQuestion(index, 'text', e.target.value)}
                                        className="min-h-[80px]"
                                        required
                                    />
                                    <div className="flex flex-wrap gap-4">
                                        <div className="w-24">
                                            <Label className="text-xs mb-1 block">CO</Label>
                                            <Select value={q.co} onValueChange={val => updateQuestion(index, 'co', val)}>
                                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6'].map(co => (
                                                        <SelectItem key={co} value={co}>{co}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-xs mb-1 block">BTL</Label>
                                            <Select value={q.btl} onValueChange={val => updateQuestion(index, 'btl', val)}>
                                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {['L1', 'L2', 'L3', 'L4', 'L5', 'L6'].map(l => (
                                                        <SelectItem key={l} value={l}>{l}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-xs mb-1 block">Marks</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={q.marks}
                                                onChange={e => updateQuestion(index, 'marks', Number(e.target.value))}
                                                className="h-8"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 pt-2">
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeQuestion(index)} disabled={questions.length === 1}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </DataCard>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/faculty/exams')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            'Submitting...'
                        ) : (
                            <><Send className="mr-2 h-4 w-4" /> Submit for Approval</>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default CreateExamPaperPage;
