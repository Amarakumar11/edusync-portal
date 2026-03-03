import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
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
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
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
  const [timetable, setTimetable] = useState<TimetableData>(initTimetable());
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: string; slot: string } | null>(null);
  const [formData, setFormData] = useState({ subject: '', section: '', room: '' });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, 'timetables', user.uid);
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
    fetchTimetable();
  }, [user]);

  const handleCellClick = (day: string, slot: string) => {
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
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, 'timetables', user.uid), {
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Timetable"
        description="Manage your class schedule"
      >
        {hasChanges && (
          <Button onClick={handleSaveAll} className="bg-primary hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        )}
      </PageHeader>

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
                      <td key={`${day}-${slot}`} className="p-2">
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
                            <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCellClick(day, slot)}
                            className="w-full h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors flex items-center justify-center group"
                          >
                            <Plus className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
