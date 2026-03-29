import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Printer, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import type { ExamPaper } from '@/types';

// Mock drive for logos
const LOGO_DRIVE = [
    { id: 'header_1', name: 'Standard College Header', url: '/mrce_header.png' },
    { id: 'header_2', name: 'CSE (AI & ML) Header', url: '/mrce_aiml_header.png' },
];

export function PrintExamPaperPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [paper, setPaper] = useState<ExamPaper | null>(null);

    // Print Configuration State
    const [headerImage, setHeaderImage] = useState(LOGO_DRIVE[0].url);
    const [examDate, setExamDate] = useState('');
    const [examTime, setExamTime] = useState('10:00 AM - 12:00 PM');
    const [maxMarks, setMaxMarks] = useState('30');

    useEffect(() => {
        const fetchPaper = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'exam_papers', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as ExamPaper;
                    setPaper(data);
                } else {
                    toast.error('Exam paper not found');
                    navigate('/exam_branch');
                }
            } catch (error) {
                console.error('Error fetching paper:', error);
                toast.error('Failed to load exam paper details.');
            } finally {
                setLoading(false);
            }
        };
        fetchPaper();
    }, [id, navigate]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading paper...</div>;
    if (!paper) return null;

    return (
        <div className="min-h-screen bg-muted/20 pb-12 print:bg-white print:p-0">
            {/* Controls Section (Hidden in Print) */}
            <div className="print:hidden sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm mb-8 px-4 sm:px-8 py-4">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-lg font-bold">Print Configuration</h2>
                            <p className="text-sm text-muted-foreground">Adjust the logos and details before printing.</p>
                        </div>
                    </div>
                    <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-white shadow-sm w-full md:w-auto">
                        <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
                    </Button>
                </div>

                <div className="max-w-5xl mx-auto mt-6 flex flex-wrap gap-4">
                    <div className="space-y-2 flex-grow min-w-[250px]">
                        <Label className="text-xs">Header Image (Landscape)</Label>
                        <Select value={headerImage} onValueChange={setHeaderImage}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {LOGO_DRIVE.map(l => (
                                    <SelectItem key={l.id} value={l.url}>{l.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Exam Date</Label>
                        <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Exam Time</Label>
                        <Input value={examTime} onChange={e => setExamTime(e.target.value)} placeholder="e.g. 10 AM - 12 PM" className="h-9" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Max Marks</Label>
                        <Input value={maxMarks} onChange={e => setMaxMarks(e.target.value)} className="h-9" />
                    </div>
                </div>
            </div>

            {/* Printable Area (A4 Layout) */}
            <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-[20mm] print:p-0 shadow-lg print:shadow-none border border-border print:border-none">

                {/* Landscape Header Image */}
                <div className="w-full sm:h-40 border-b-2 border-black flex items-center justify-center mb-6 overflow-hidden">
                    {headerImage ? (
                        <img src={headerImage} alt="Header" className="w-full object-cover" />
                    ) : (
                        <div className="text-gray-400">Header Image Area</div>
                    )}
                </div>

                {/* Exam Title */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold uppercase underline">{paper.examType} Examination</h3>
                </div>

                {/* Metadata Details specific to requested format */}
                <div className="flex justify-between text-[15px] font-bold mb-6 px-2">
                    <div className="space-y-2">
                        <div>Dept: {paper.department}</div>
                        <div>Batch: {paper.batch}</div>
                    </div>
                    <div className="space-y-2 text-right">
                        <div>Yr/Sem: {paper.yearSem}</div>
                        <div>Set: {paper.section}</div>
                    </div>
                </div>

                {/* Additional Exam details if needed */}
                <div className="flex justify-between text-sm font-semibold mb-6 border-b border-black pb-2 px-2">
                    <div>Subject: {paper.subject}</div>
                    <div>Max Marks: {maxMarks}</div>
                    <div>Time: {examTime} ({examDate ? new Date(examDate).toLocaleDateString() : '..............'})</div>
                </div>

                {/* Questions Grid */}
                <table className="w-full border-collapse border border-black text-sm text-left">
                    <thead>
                        <tr className="bg-gray-100 print:bg-gray-100">
                            <th className="border border-black p-2 w-12 text-center text-black">S.No.</th>
                            <th className="border border-black p-2 text-black">Question Text</th>
                            <th className="border border-black p-2 w-12 text-center text-black">CO</th>
                            <th className="border border-black p-2 w-12 text-center text-black">BTL</th>
                            <th className="border border-black p-2 w-16 text-center text-black">Marks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paper.questions.map((q, idx) => (
                            <tr key={idx} className="break-inside-avoid">
                                <td className="border border-black p-2 text-center font-bold text-black align-top">{q.qnNumber}</td>
                                <td className="border border-black p-2 text-black align-top whitespace-pre-wrap">{q.text}</td>
                                <td className="border border-black p-2 text-center text-black align-top font-mono">{q.co}</td>
                                <td className="border border-black p-2 text-center text-black align-top font-mono">{q.btl}</td>
                                <td className="border border-black p-2 text-center text-black align-top font-bold">{q.marks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer info (Signature lines) */}
                <div className="mt-24 w-full flex justify-between text-sm font-bold opacity-80">
                    <div className="text-center">
                        <div className="border-t border-black w-40 pt-1">Course Invigilator</div>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-black w-40 pt-1">Head of Department</div>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-black w-40 pt-1">Principal / COE</div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default PrintExamPaperPage;
