import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, Save, FileUp, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const timeSlots = [
  '9:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 1:00',
  '2:00 - 3:00',
  '3:00 - 4:00',
  '4:00 - 5:00',
];

interface TimetableEntry {
  id: string;
  subject: string;
  section: string;
  room: string;
}

type TimetableData = {
  [day: string]: {
    [slot: string]: TimetableEntry | null;
  };
};

// Initialize empty timetable
const initTimetable = (): TimetableData => {
  const data: TimetableData = {};
  days.forEach(day => {
    data[day] = {};
    timeSlots.forEach(slot => {
      data[day][slot] = null;
    });
  });
  return data;
};

export function TimetablePage() {
  const { user } = useAuth();
  const { uid: targetUid } = useParams();
  const [timetable, setTimetable] = useState<TimetableData>(initTimetable());
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: string; slot: string } | null>(null);
  const [formData, setFormData] = useState({ subject: '', section: '', room: '' });
  const [hasChanges, setHasChanges] = useState(false);

  // Class Timetable PDF Upload States
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);
  const [classesList, setClassesList] = useState<{ id: string, name: string, departmentId: string }[]>([]);
  const [classTimetables, setClassTimetables] = useState<ClassTimetable[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const effectiveUid = targetUid || user?.uid;
  const isReadOnly = user?.role === 'principal' || (targetUid && user?.role === 'faculty'); // Faculty can only view others if we allow it, but let's restrict to Principal read-only, and HOD edit.
  // Actually, Principal is always read-only for timetables, and 'faculty' cannot view others currently, so we'll just disable editing for Principal.
  const canEdit = user?.role === 'hod' || (user?.role === 'faculty' && !targetUid);

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!effectiveUid) return;
      try {
        const docRef = doc(db, 'timetables', effectiveUid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().schedule) {
          setTimetable(docSnap.data().schedule);
        } else {
          setTimetable(initTimetable());
        }
      } catch (error) {
        console.error('Error fetching timetable:', error);
        toast.error('Failed to load timetable');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchGlobalData = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'college');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().departments) {
          setDepartments(settingsSnap.data().departments);
        }

        const { collection, getDocs } = await import('firebase/firestore');
        // Fetch classes
        const classesSnap = await getDocs(collection(db, 'classes'));
        setClassesList(classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));

        // Fetch uploaded class timetables
        const ctSnap = await getDocs(collection(db, 'class_timetables'));
        setClassTimetables(ctSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClassTimetable)));
      } catch (err) {
        console.error('Error fetching global data:', err);
      }
    };

    fetchTimetable();
    fetchGlobalData();
  }, [user, effectiveUid]);

  const handleCellClick = (day: string, slot: string) => {
    if (!canEdit) return; // Prevent clicking if read-only

    setSelectedCell({ day, slot });
    const existing = timetable[day][slot];
    if (existing) {
      setFormData({ subject: existing.subject, section: existing.section, room: existing.room });
    } else {
      setFormData({ subject: '', section: '', room: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSaveEntry = () => {
    if (!selectedCell || !formData.subject) return;

    const newTimetable = { ...timetable };
    newTimetable[selectedCell.day][selectedCell.slot] = {
      id: Date.now().toString(),
      ...formData,
    };
    setTimetable(newTimetable);
    setHasChanges(true);
    setIsDialogOpen(false);
  };

  const handleDeleteEntry = () => {
    if (!selectedCell) return;

    const newTimetable = { ...timetable };
    newTimetable[selectedCell.day][selectedCell.slot] = null;
    setTimetable(newTimetable);
    setHasChanges(true);
    setIsDialogOpen(false);
  };

  const handleSaveAll = async () => {
    if (!effectiveUid || !canEdit) return;
    try {
      await setDoc(doc(db, 'timetables', effectiveUid), {
        schedule: timetable,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setHasChanges(false);
      toast.success('Timetable saved successfully');
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast.error('Failed to save timetable');
    }
  };

  const handleUploadTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !selectedDept || !selectedClass || !user) return;

    setIsUploadingPdf(true);
    try {
      const cls = classesList.find(c => c.id === selectedClass);
      if (!cls) throw new Error("Class not found");

      const formData = new FormData();
      formData.append('file', pdfFile);
      const serverPort = 3001;
      const baseUrl = window.location.hostname === 'localhost' ? `http://localhost:${serverPort}` : '';
      const response = await fetch(`${baseUrl}/api/upload/timetables`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload PDF');
      const data = await response.json();
      const url = data.url;

      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'class_timetables'), {
        departmentId: selectedDept,
        classId: selectedClass,
        className: cls.name,
        pdfUrl: url,
        storagePath: url,
        uploadedBy: user.name,
        uploadedAt: new Date().toISOString()
      });

      toast.success('Class timetable uploaded successfully');
      setPdfFile(null);
      setSelectedDept('');
      setSelectedClass('');
      setShowUploadForm(false);

      const { getDocs } = await import('firebase/firestore');
      const ctSnap = await getDocs(collection(db, 'class_timetables'));
      setClassTimetables(ctSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload timetable');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleDeleteTimetable = async (id: string, path: string) => {
    if (!window.confirm('Delete this class timetable?')) return;
    try {
      if (path && !path.startsWith('/uploads/')) {
        const fileRef = ref(storage, path);
        await deleteObject(fileRef);
      }
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'class_timetables', id));
      toast.success('Timetable deleted');
      setClassTimetables(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete timetable');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={targetUid ? "Faculty Timetable" : "My Timetable"}
        description={targetUid ? "View and manage faculty schedule" : "Manage your class schedule"}
      >
        <div className="flex gap-2">
          {!targetUid && (user?.role === 'hod' || user?.role === 'principal') && (
            <Button
              onClick={() => setShowUploadForm(!showUploadForm)}
              variant={showUploadForm ? "outline" : "secondary"}
            >
              {showUploadForm ? 'Cancel' : <><FileUp className="mr-2 h-4 w-4" /> Upload PDF</>}
            </Button>
          )}
          {hasChanges && (
            <Button onClick={handleSaveAll} className="bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
        </div>
      </PageHeader>

      {showUploadForm && !targetUid && (user?.role === 'hod' || user?.role === 'principal') && (
        <DataCard title="Upload Class Timetable (PDF)" className="bg-muted/30 border-primary/20">
          <form onSubmit={handleUploadTimetable} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dept">Department</Label>
                <Select value={selectedDept} onValueChange={setSelectedDept} disabled={isUploadingPdf}>
                  <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cls">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass} disabled={isUploadingPdf || !selectedDept}>
                  <SelectTrigger><SelectValue placeholder={selectedDept ? "Select Class" : "Select Dept First"} /></SelectTrigger>
                  <SelectContent>
                    {classesList.filter(c => c.departmentId === selectedDept).map(c =>
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf">Timetable PDF</Label>
                <Input
                  id="pdf" type="file" accept=".pdf"
                  onChange={e => setPdfFile(e.target.files?.[0] || null)} disabled={isUploadingPdf} required
                />
              </div>
            </div>
            <Button type="submit" disabled={isUploadingPdf || !selectedDept || !selectedClass || !pdfFile} className="bg-primary">
              <FileUp className="mr-2 h-4 w-4" />
              {isUploadingPdf ? 'Uploading...' : 'Upload Timetable'}
            </Button>
          </form>
        </DataCard>
      )}

      {!targetUid && classTimetables.length > 0 && (
        <DataCard title="Class Timetables (PDF)">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classTimetables.map(ct => (
              <div key={ct.id} className="p-4 rounded-lg border flex items-start gap-3 bg-card">
                <div className="p-2 rounded-md bg-primary/10 text-primary mt-0.5">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{ct.className}</h4>
                  <p className="text-xs text-muted-foreground">{ct.departmentId} • {new Date(ct.uploadedAt).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm" asChild className="h-7 text-xs flex-1">
                      <a href={ct.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-3 w-3" /> Download
                      </a>
                    </Button>
                    {(user?.role === 'hod' || user?.role === 'principal') && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTimetable(ct.id, ct.storagePath)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      )}

      <DataCard title="Weekly Schedule" contentClassName="p-0 overflow-x-auto">
        <div className="min-w-[800px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left font-semibold text-muted-foreground w-28">Time</th>
                {days.map(day => (
                  <th key={day} className="p-4 text-left font-semibold text-foreground">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, slotIndex) => (
                <tr
                  key={slot}
                  className={cn(
                    'border-b border-border',
                    slot === '12:00 - 1:00' && 'bg-muted/30'
                  )}
                >
                  <td className="p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                    {slot}
                    {slot === '12:00 - 1:00' && (
                      <Badge variant="outline" className="ml-2">Lunch</Badge>
                    )}
                  </td>
                  {days.map(day => {
                    const entry = timetable[day][slot];
                    return (
                      <td key={`${day} -${slot} `} className="p-2">
                        {slot === '12:00 - 1:00' ? (
                          <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">
                            Break
                          </div>
                        ) : entry ? (
                          <button
                            onClick={() => handleCellClick(day, slot)}
                            className="w-full h-20 p-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-left group"
                          >
                            <div className="font-medium text-sm text-foreground line-clamp-1">
                              {entry.subject}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {entry.section} • {entry.room}
                            </div>
                            {canEdit && <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCellClick(day, slot)}
                            className={cn(
                              "w-full h-20 rounded-lg border-2 border-dashed border-border transition-colors flex items-center justify-center group",
                              canEdit ? "hover:border-primary/50 hover:bg-muted/30 cursor-pointer" : "cursor-default"
                            )}
                          >
                            {canEdit && <Plus className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {timetable[selectedCell?.day || '']?.[selectedCell?.slot || '']
                ? 'Edit Class'
                : 'Add Class'}
            </DialogTitle>
            <DialogDescription>
              {selectedCell?.day} • {selectedCell?.slot}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter subject name"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={formData.section}
                onValueChange={(value) => setFormData(prev => ({ ...prev, section: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSE-A">CSE-A</SelectItem>
                  <SelectItem value="CSE-B">CSE-B</SelectItem>
                  <SelectItem value="CSE-C">CSE-C</SelectItem>
                  <SelectItem value="ECE-A">ECE-A</SelectItem>
                  <SelectItem value="ECE-B">ECE-B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Input
                id="room"
                placeholder="Room number or Lab"
                value={formData.room}
                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {timetable[selectedCell?.day || '']?.[selectedCell?.slot || ''] && (
              <Button variant="destructive" onClick={handleDeleteEntry}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <Button onClick={handleSaveEntry} disabled={!formData.subject}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TimetablePage;
