import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Trash2, Power } from 'lucide-react';
import { db } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface Department {
    id: string;
    name: string;
}

interface Room {
    id: string;
    departmentId: string;
}

interface ClassData {
    id: string;
    name: string; // e.g. "IV II CSM B"
    departmentId: string;
    roomId: string;
    isActive: boolean;
}

export function ClassesManagerPage() {
    const { user } = useAuth();

    // Data state
    const [departments, setDepartments] = useState<Department[]>([]);
    const [allRooms, setAllRooms] = useState<Room[]>([]);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
    const [newClassName, setNewClassName] = useState('');
    const [newClassDept, setNewClassDept] = useState('');
    const [newClassRoom, setNewClassRoom] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch settings (Departments & Rooms)
            let depts = [
                { id: 'CSE', name: 'Computer Science and Engineering' },
                { id: 'ECE', name: 'Electronics and Communication' },
                { id: 'HS', name: 'Humanities and Sciences' }
            ];
            let rms = [
                { id: '301', departmentId: 'ALL' },
                { id: '302', departmentId: 'ALL' },
                { id: '101', departmentId: 'CSE' },
                { id: '102', departmentId: 'CSE' },
                { id: '201', departmentId: 'ECE' }
            ];

            const settingsRef = doc(db, 'settings', 'college');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
                const data = settingsSnap.data();
                if (data.departments) depts = data.departments;
                if (data.rooms) rms = data.rooms;
            }
            setDepartments(depts);
            setAllRooms(rms);

            // 2. Fetch all classes
            const classesRef = collection(db, 'classes');
            const classesSnap = await getDocs(classesRef);
            const fetchedClasses = classesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ClassData[];

            // Sort classes alphabetically by name
            fetchedClasses.sort((a, b) => a.name.localeCompare(b.name));
            setClasses(fetchedClasses);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName || !newClassDept) return;

        setIsAdding(true);
        try {
            // Check if class already exists
            if (classes.some(c => c.name.toLowerCase() === newClassName.toLowerCase() && c.departmentId === newClassDept)) {
                toast.error('This class already exists in the selected department.');
                setIsAdding(false);
                return;
            }

            const newId = `class_${Date.now()}`;
            const newClass: ClassData = {
                id: newId,
                name: newClassName.toUpperCase(),
                departmentId: newClassDept,
                roomId: newClassRoom || 'Unassigned',
                isActive: true
            };

            await setDoc(doc(db, 'classes', newId), newClass);

            setClasses(prev => [...prev, newClass].sort((a, b) => a.name.localeCompare(b.name)));
            toast.success('Class created successfully!');

            // Reset form
            setNewClassName('');
            setNewClassRoom('');
        } catch (error) {
            console.error('Error creating class:', error);
            toast.error('Failed to create class.');
        } finally {
            setIsAdding(false);
        }
    };

    const toggleClassStatus = async (id: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'classes', id), { isActive: !currentStatus });
            setClasses(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
            toast.success(`Class marked as ${!currentStatus ? 'Active' : 'Inactive'}`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status.');
        }
    };

    const deleteClass = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this class?')) return;

        try {
            await deleteDoc(doc(db, 'classes', id));
            setClasses(prev => prev.filter(c => c.id !== id));
            toast.success('Class deleted successfully.');
        } catch (error) {
            console.error('Error deleting class:', error);
            toast.error('Failed to delete class.');
        }
    };

    // Get available rooms for a selected department (including common rooms 'ALL')
    const getAvailableRooms = (deptId: string) => {
        if (!deptId) return [];
        return allRooms.filter(r => r.departmentId === deptId || r.departmentId === 'ALL');
    };

    // Filter classes by selected department tab
    const displayedClasses = selectedDeptFilter === 'ALL'
        ? classes
        : classes.filter(c => c.departmentId === selectedDeptFilter);

    if (!user || user.role !== 'principal') return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Classes Management"
                description="Organize batches and sections for academic years"
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Create Class Form */}
                <Card className="border-border lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" /> Add New Class
                        </CardTitle>
                        <CardDescription>Create a new section or batch.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="py-4 text-center text-muted-foreground text-sm">Loading data...</div>
                        ) : departments.length === 0 ? (
                            <div className="py-4 text-center text-amber-500 text-sm">
                                Please add Departments in Settings first.
                            </div>
                        ) : (
                            <form onSubmit={handleCreateClass} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Department <span className="text-destructive">*</span></Label>
                                    <Select value={newClassDept} onValueChange={setNewClassDept} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id} value={dept.id}>{dept.id} ({dept.name})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Class Name <span className="text-destructive">*</span></Label>
                                    <Input
                                        placeholder="e.g. IV II CSM B"
                                        value={newClassName}
                                        onChange={e => setNewClassName(e.target.value)}
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground">Format recommendation: [Year] [Semester] [Branch] [Section]</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Default Room (Optional)</Label>
                                    <Select value={newClassRoom} onValueChange={setNewClassRoom} disabled={!newClassDept}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={!newClassDept ? "Select Dept First" : "Select Room"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Unassigned">Leave Unassigned</SelectItem>
                                            {getAvailableRooms(newClassDept).map(room => (
                                                <SelectItem key={room.id} value={room.id}>{room.id}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button type="submit" disabled={isAdding || !newClassDept || !newClassName} className="w-full">
                                    {isAdding ? 'Creating...' : 'Create Class'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Classes List */}
                <Card className="border-border lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" /> Active & Inactive Classes
                            </CardTitle>
                            <CardDescription>Toggle visibility of classes for internal scheduling.</CardDescription>
                        </div>

                        {!isLoading && departments.length > 0 && (
                            <Select value={selectedDeptFilter} onValueChange={setSelectedDeptFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Departments</SelectItem>
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id} value={dept.id}>{dept.id}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="py-12 text-center text-muted-foreground">Loading classes...</div>
                        ) : classes.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>No classes created yet.</p>
                                <p className="text-sm">Use the form to add the first class.</p>
                            </div>
                        ) : displayedClasses.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No classes found for the selected department.
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-4 py-3">Class Name</th>
                                            <th className="px-4 py-3">Department</th>
                                            <th className="px-4 py-3">Room</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {displayedClasses.map((cls) => (
                                            <tr key={cls.id} className={`hover:bg-muted/50 transition-colors ${!cls.isActive && 'bg-muted/20 opacity-75'}`}>
                                                <td className="px-4 py-3 font-medium text-foreground">{cls.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                                        {cls.departmentId}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{cls.roomId}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Switch
                                                            checked={cls.isActive}
                                                            onCheckedChange={() => toggleClassStatus(cls.id, cls.isActive)}
                                                        />
                                                        <span className={`text-xs font-medium ${cls.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                                            {cls.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteClass(cls.id)}
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

export default ClassesManagerPage;
