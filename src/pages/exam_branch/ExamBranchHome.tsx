import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Printer, FileText, CheckCircle, Search, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { ExamPaper } from '@/types';

export function ExamBranchHome() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [papers, setPapers] = useState<ExamPaper[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchApprovedPapers = async () => {
            try {
                const q = query(
                    collection(db, 'exam_papers'),
                    where('status', '==', 'approved')
                );
                const snapshot = await getDocs(q);
                const fetched = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as ExamPaper[];

                // Sort
                fetched.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
                setPapers(fetched);
            } catch (error) {
                console.error('Error fetching approved exam papers:', error);
                toast.error('Failed to load approved exam papers.');
            } finally {
                setLoading(false);
            }
        };

        fetchApprovedPapers();
    }, []);

    const filteredPapers = papers.filter(p =>
        p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.batch.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <PageHeader
                title="Exam Branch Dashboard"
                description="View approved examination papers ready for printing."
            />

            <div className="flex items-center gap-4 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by subject, dept, batch..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <DataCard title="Approved Papers" contentClassName="p-0">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground">Loading approved papers...</div>
                ) : filteredPapers.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
                        <p>No approved papers available at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filteredPapers.map((paper) => (
                            <div
                                key={paper.id}
                                className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mt-1">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-semibold text-foreground text-lg truncate">
                                                {paper.subject} <span className="text-muted-foreground text-sm font-normal">({paper.examType})</span>
                                            </h4>
                                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 whitespace-nowrap">
                                                Approved
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">Dept:</span> {paper.department}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">Batch:</span> {paper.batch}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">Yr/Sem:</span> {paper.yearSem}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">Set:</span> {paper.section || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-border">
                                    <Button
                                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                                        onClick={() => window.open(`/exam_branch/print/${paper.id}`, '_blank')}
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print & Format
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DataCard>
        </div>
    );
}

export default ExamBranchHome;
