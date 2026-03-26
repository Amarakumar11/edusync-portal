import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { CheckCircle, XCircle, FileText, User, CalendarDays, BookOpen, Clock } from 'lucide-react';
import type { ExamPaper } from '@/types';

export function HODExamPapersPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [papers, setPapers] = useState<ExamPaper[]>([]);

    const fetchPendingPapers = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Create query for pending papers in the HOD's department
            const deptQuery = query(
                collection(db, 'exam_papers'),
                where('status', '==', 'pending_hod'),
                where('department', '==', user.department)
            );
            const snapshot = await getDocs(deptQuery);
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ExamPaper[];

            // Sort in JS if missing index on createdAt
            fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setPapers(fetched);
        } catch (error) {
            console.error('Error fetching exam papers:', error);
            toast.error('Failed to load pending exam papers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingPapers();
    }, [user]);

    const handleAction = async (id: string, action: 'approved' | 'rejected') => {
        try {
            if (!user) return;
            await updateDoc(doc(db, 'exam_papers', id), {
                status: action,
                approvedBy: user.name,
                updatedAt: new Date().toISOString()
            });
            toast.success(`Exam paper ${action} successfully.`);
            fetchPendingPapers();
        } catch (error) {
            console.error('Error updating paper status:', error);
            toast.error(`Failed to ${action} paper.`);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <PageHeader
                title="Review Exam Papers"
                description="Review and approve examination papers submitted by faculty in your department."
            />

            <DataCard title="Pending Approvals" contentClassName="p-0">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground">Loading papers...</div>
                ) : papers.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
                        <p>No pending exam papers to approve.</p>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {papers.map((paper) => (
                            <AccordionItem value={paper.id} key={paper.id} className="border-b px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full pr-4 gap-4">
                                        <div className="flex items-start gap-4 text-left">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-foreground text-lg">
                                                    {paper.subject} <span className="text-muted-foreground text-sm font-normal">({paper.examType})</span>
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1"><User className="h-4 w-4" /> {paper.createdByName}</span>
                                                    <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> Sec: {paper.section}</span>
                                                    <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {paper.batch}</span>
                                                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(paper.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 whitespace-nowrap">
                                            Pending Approval
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6">
                                    <div className="bg-muted/30 rounded-lg p-4 space-y-6">
                                        <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm bg-background p-4 rounded-md border">
                                            <div><strong className="text-muted-foreground">Year/Sem:</strong> {paper.yearSem}</div>
                                            <div><strong className="text-muted-foreground">Total Qs:</strong> {paper.totalQuestions}</div>
                                            <div><strong className="text-muted-foreground">Objective:</strong> {paper.totalObjective}</div>
                                            <div><strong className="text-muted-foreground">Descriptive:</strong> {paper.totalDescriptive}</div>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Questions</h5>
                                            <div className="space-y-4">
                                                {paper.questions.map((q, idx) => (
                                                    <div key={idx} className="bg-background border rounded-lg p-4">
                                                        <div className="flex items-start gap-3">
                                                            <span className="font-bold text-primary min-w-[30px]">Q{q.qnNumber}.</span>
                                                            <div className="flex-1 space-y-3">
                                                                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{q.text}</p>
                                                                <div className="flex gap-4">
                                                                    <Badge variant="secondary" className="font-mono text-xs">CO: {q.co}</Badge>
                                                                    <Badge variant="secondary" className="font-mono text-xs">BTL: {q.btl}</Badge>
                                                                    <Badge variant="outline" className="font-mono text-xs font-semibold">{q.marks} Marks</Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                                            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleAction(paper.id, 'rejected')}>
                                                <XCircle className="h-4 w-4 mr-2" /> Reject
                                            </Button>
                                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(paper.id, 'approved')}>
                                                <CheckCircle className="h-4 w-4 mr-2" /> Approve Paper
                                            </Button>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </DataCard>
        </div>
    );
}

export default HODExamPapersPage;
