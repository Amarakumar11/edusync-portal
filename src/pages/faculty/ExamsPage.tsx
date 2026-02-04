import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, GraduationCap, Calendar, BookOpen } from 'lucide-react';
import type { ExamType } from '@/types';

interface ExamSchedule {
  id: string;
  title: string;
  examType: ExamType;
  uploadedAt: Date;
  pdfUrl: string;
}

const examTypes = [
  { id: 'mids', name: 'Mid-term Exams', icon: BookOpen, description: 'Mid-semester examinations' },
  { id: 'lab_internals', name: 'Lab Internals', icon: GraduationCap, description: 'Laboratory internal assessments' },
  { id: 'semester', name: 'Semester Exams', icon: Calendar, description: 'End semester examinations' },
  { id: 'placements', name: 'Placements', icon: FileText, description: 'Placement drive schedules' },
];

const mockSchedules: ExamSchedule[] = [
  {
    id: '1',
    title: 'Mid-term Exam Schedule - February 2024',
    examType: 'mids',
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    pdfUrl: '/exams/midterm-feb-2024.pdf',
  },
  {
    id: '2',
    title: 'Lab Internal Schedule - CSE Department',
    examType: 'lab_internals',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    pdfUrl: '/exams/lab-internal-cse.pdf',
  },
  {
    id: '3',
    title: 'Semester End Exam Timetable',
    examType: 'semester',
    uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    pdfUrl: '/exams/semester-end.pdf',
  },
  {
    id: '4',
    title: 'Campus Placement Drive - Tech Companies',
    examType: 'placements',
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    pdfUrl: '/exams/placement-drive.pdf',
  },
];

const getExamTypeBadge = (type: ExamType) => {
  switch (type) {
    case 'mids':
      return <Badge className="badge-info">Mid-term</Badge>;
    case 'lab_internals':
      return <Badge className="badge-success">Lab Internal</Badge>;
    case 'semester':
      return <Badge className="badge-warning">Semester</Badge>;
    case 'placements':
      return <Badge className="bg-primary/10 text-primary">Placement</Badge>;
  }
};

export function ExamsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Examination Info"
        description="View exam schedules and types"
      />

      <Tabs defaultValue="types" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="types">Types of Exams</TabsTrigger>
          <TabsTrigger value="schedules">Exam Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="types">
          <div className="grid sm:grid-cols-2 gap-4">
            {examTypes.map((type) => (
              <DataCard key={type.id} title="" className="hover:shadow-card-hover transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <type.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground mb-1">
                      {type.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              </DataCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedules">
          <DataCard title="Available Schedules" contentClassName="p-0">
            {mockSchedules.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No exam schedules available.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {mockSchedules.map((schedule) => (
                  <div 
                    key={schedule.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {schedule.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {getExamTypeBadge(schedule.examType)}
                          <span className="text-xs text-muted-foreground">
                            Uploaded {schedule.uploadedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={schedule.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </DataCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ExamsPage;
