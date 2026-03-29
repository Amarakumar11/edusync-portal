import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Clock, BookOpen, PenTool, CheckCircle, XCircle } from 'lucide-react';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ExamDashboardPage() {
    const { user } = useAuth();
    const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
    const [recentPapers, setRecentPapers] = useState<any[]>([]);
    const [stats, setStats] = useState({ schedules: 0, papers: 0, marks: 0 });

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                // Fetch schedules
                const schedulesSnap = await getDocs(query(collection(db, 'exam_schedules'), orderBy('uploadedAt', 'desc'), limit(5)));
                const schedules = schedulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setUpcomingExams(schedules);

                // Fetch recent papers
                const papersQ = user.role === 'hod'
                    ? query(collection(db, 'exam_papers'), where('department', '==', user.department), orderBy('createdAt', 'desc'), limit(5))
                    : query(collection(db, 'exam_papers'), where('createdBy', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
                const papersSnap = await getDocs(papersQ);
                setRecentPapers(papersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                setStats({
                    schedules: schedules.length,
                    papers: papersSnap.docs.length,
                    marks: 12 // Placeholder for demo
                });

            } catch (error) {
                console.error("Error fetching exam dashboard data:", error);
            }
        };

        fetchDashboardData();
    }, [user]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_hod': return <Badge variant="outline" className="text-warning border-warning">Pending HOD Review</Badge>;
            case 'approved': return <Badge variant="outline" className="text-success border-success">Approved</Badge>;
            case 'rejected': return <Badge variant="outline" className="text-destructive border-destructive">Rejected</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Exam Dashboard"
                description="Comprehensive view of examination schedules, question papers, and marks"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                <StatsCard title="Active Schedules" value={stats.schedules} icon={Clock} variant="primary" />
                <StatsCard title="Papers Prepared" value={stats.papers} icon={BookOpen} variant="info" />
                <StatsCard title="Marks Entries" value={stats.marks} icon={PenTool} variant="warning" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Schedules */}
                <DataCard
                    title="Recent Exam Schedules"
                    action={
                        <Link to={`/${user?.role}/exams`}>
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">View All</Button>
                        </Link>
                    }
                >
                    <div className="space-y-4">
                        {upcomingExams.length === 0 ? (
                            <p className="text-muted-foreground py-4 text-center">No recent schedules.</p>
                        ) : upcomingExams.map((exam) => (
                            <div key={exam.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-muted/30">
                                <div>
                                    <h5 className="font-semibold text-sm">{exam.title}</h5>
                                    <p className="text-xs text-muted-foreground">{exam.examType.replace('_', ' ').toUpperCase()} • {new Date(exam.uploadedAt).toLocaleDateString()}</p>
                                </div>
                                <Button size="sm" variant="outline" asChild>
                                    <a href={exam.pdfUrl} target="_blank" rel="noopener noreferrer">Download</a>
                                </Button>
                            </div>
                        ))}
                    </div>
                </DataCard>

                {/* Exam Papers Status */}
                <DataCard
                    title="Question Papers Status"
                    action={
                        <Link to={user?.role === 'hod' ? '/hod/review-exams' : '/faculty/create-exam-paper'}>
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                                {user?.role === 'hod' ? 'Review Papers' : 'Create New'}
                            </Button>
                        </Link>
                    }
                >
                    <div className="space-y-4">
                        {recentPapers.length === 0 ? (
                            <p className="text-muted-foreground py-4 text-center">No question papers found.</p>
                        ) : recentPapers.map((paper) => (
                            <div key={paper.id} className="p-3 border rounded-lg flex justify-between items-start hover:bg-muted/30">
                                <div>
                                    <h5 className="font-semibold text-sm">{paper.subject}</h5>
                                    <p className="text-xs text-muted-foreground">{paper.examType} • {paper.yearSem} • Sec: {paper.section}</p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                        <BookOpen className="w-3 h-3" /> {paper.totalQuestions} Questions
                                        {user?.role === 'hod' && <span className="ml-2">• By: {paper.createdByName}</span>}
                                    </div>
                                </div>
                                <div>
                                    {getStatusBadge(paper.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                </DataCard>
            </div>

            <DataCard
                title="Quick Links"
            >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Link to="/faculty/exams">
                        <Button variant="outline" className="w-full h-24 flex-col gap-2">
                            <Clock className="h-6 w-6 text-primary" />
                            Schedules
                        </Button>
                    </Link>
                    <Link to="/faculty/create-exam-paper">
                        <Button variant="outline" className="w-full h-24 flex-col gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            Create Paper
                        </Button>
                    </Link>
                    <Link to="/faculty/marks">
                        <Button variant="outline" className="w-full h-24 flex-col gap-2">
                            <PenTool className="h-6 w-6 text-primary" />
                            Enter Marks
                        </Button>
                    </Link>
                    <Link to="/faculty/attendance">
                        <Button variant="outline" className="w-full h-24 flex-col gap-2">
                            <CheckCircle className="h-6 w-6 text-primary" />
                            Attendance
                        </Button>
                    </Link>
                </div>
            </DataCard>
        </div>
    );
}

export default ExamDashboardPage;
