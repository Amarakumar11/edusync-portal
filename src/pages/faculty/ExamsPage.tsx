import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download, GraduationCap, Calendar, BookOpen, Plus, FileUp, Trash2 } from 'lucide-react';
import type { ExamType } from '@/types';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ExamSchedule {
  id: string;
  title: string;
  examType: ExamType;
  uploadedAt: string;
  pdfUrl: string;
  storagePath: string;
  department: string;
}

const examTypesList = [
  { id: 'mids', name: 'Mid-term Exams', icon: BookOpen, description: 'Mid-semester examinations' },
  { id: 'lab_internals', name: 'Lab Internals', icon: GraduationCap, description: 'Laboratory internal assessments' },
  { id: 'semester', name: 'Semester Exams', icon: Calendar, description: 'End semester examinations' },
  { id: 'placements', name: 'Placements', icon: FileText, description: 'Placement drive schedules' },
];

const getExamTypeBadge = (type: ExamType) => {
  switch (type) {
    case 'mids':
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Mid-term</Badge>;
    case 'lab_internals':
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Lab Internal</Badge>;
    case 'semester':
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Semester</Badge>;
    case 'placements':
      return <Badge className="bg-primary/20 hover:bg-primary/30 text-primary">Placement</Badge>;
    default:
      return <Badge>Exam</Badge>;
  }
};

export function ExamsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);

  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState<ExamType>('mids');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchSchedules = async () => {
    try {
      const q = query(collection(db, 'exam_schedules'), orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      let fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExamSchedule[];

      if (user?.role === 'hod' || user?.role === 'faculty') {
        fetched = fetched.filter(s => s.department === user.department || s.department === 'All');
      }
      setSchedules(fetched);
    } catch (error) {
      console.error('Error fetching exam schedules:', error);
      toast.error('Failed to load exam schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !user) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const serverPort = 3001;
      const baseUrl = window.location.hostname === 'localhost' ? `http://localhost:${serverPort}` : '';
      const response = await fetch(`${baseUrl}/api/upload/exams`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload PDF');
      const data = await response.json();
      const url = data.url;

      await addDoc(collection(db, 'exam_schedules'), {
        title,
        examType,
        pdfUrl: url,
        storagePath: url,
        uploadedBy: user.name,
        department: user.department || 'All',
        uploadedAt: new Date().toISOString()
      });

      toast.success('Exam schedule uploaded successfully');
      setFile(null);
      setTitle('');
      setExamType('mids');
      setShowUploadForm(false);
      fetchSchedules();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload exam schedule');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, path: string) => {
    try {
      if (path && !path.startsWith('/uploads/')) {
        const fileRef = ref(storage, path);
        await deleteObject(fileRef);
      }
      await deleteDoc(doc(db, 'exam_schedules', id));
      toast.success('Exam schedule deleted');
      fetchSchedules();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete schedule');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <PageHeader
          title="Examination Info"
          description="View exam schedules and types"
        />
        {(user?.role === 'hod' || user?.role === 'principal') && (
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            variant={showUploadForm ? "outline" : "default"}
          >
            {showUploadForm ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Upload Schedule</>}
          </Button>
        )}
      </div>

      {showUploadForm && (user?.role === 'hod' || user?.role === 'principal') && (
        <DataCard title="Upload Exam Schedule" className="bg-muted/30 border-primary/20">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Schedule Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Mid-term Exam CSE-A"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={isUploading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examType">Exam Type</Label>
                <Select
                  value={examType}
                  onValueChange={(val: any) => setExamType(val)}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mids">Mid-term Exams</SelectItem>
                    <SelectItem value="lab_internals">Lab Internals</SelectItem>
                    <SelectItem value="semester">Semester Exams</SelectItem>
                    <SelectItem value="placements">Placements</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="file">PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  disabled={isUploading}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isUploading || !title || !file} className="w-full md:w-auto bg-primary hover:bg-primary/90">
              <FileUp className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload Schedule'}
            </Button>
          </form>
        </DataCard>
      )}

      <Tabs defaultValue="schedules" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="schedules">Exam Schedules</TabsTrigger>
          <TabsTrigger value="types">Types of Exams</TabsTrigger>
        </TabsList>

        <TabsContent value="types">
          <div className="grid sm:grid-cols-2 gap-4">
            {examTypesList.map((type) => (
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
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Loading schedules...</div>
            ) : schedules.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No exam schedules available.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mt-1">
                        <FileText className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground line-clamp-2">
                          {schedule.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {getExamTypeBadge(schedule.examType)}
                          <span className="text-xs text-muted-foreground">
                            Uploaded {new Date(schedule.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                        <a href={schedule.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                      {(user?.role === 'hod' || user?.role === 'principal') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(schedule.id, schedule.storagePath)}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
