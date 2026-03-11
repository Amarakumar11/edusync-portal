import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Building2, DoorOpen, Plus, Trash2, Save } from 'lucide-react';
import { db } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface Department {
    id: string; // e.g., 'CSE', 'ECE'
    name: string; // e.g., 'Computer Science'
}

interface Room {
    id: string; // e.g., 'Room 101'
    departmentId: string; // e.g., 'CSE'
}

interface TimingSlot {
    id: string;
    timeRange: string; // e.g., '9:00 - 10:00'
}

interface LeaveQuota {
    id: string;   // e.g., 'casual'
    label: string; // e.g., 'Casual Leave'
    days: number;
}

interface CollegeSettings {
    departments: Department[];
    rooms: Room[];
    timings: TimingSlot[];
    leaveQuotas: LeaveQuota[];
}

const DEFAULT_SETTINGS: CollegeSettings = {
    departments: [
        { id: 'CSE', name: 'Computer Science and Engineering' },
        { id: 'ECE', name: 'Electronics and Communication' },
        { id: 'HS', name: 'Humanities and Sciences' }
    ],
    rooms: [],
    timings: [
        { id: 't1', timeRange: '9:00 - 10:00' },
        { id: 't2', timeRange: '10:00 - 11:00' },
        { id: 't3', timeRange: '11:00 - 12:00' },
        { id: 't4', timeRange: '12:00 - 1:00' },
        { id: 't5', timeRange: '2:00 - 3:00' },
        { id: 't6', timeRange: '3:00 - 4:00' },
        { id: 't7', timeRange: '4:00 - 5:00' },
    ],
    leaveQuotas: [
        { id: 'casual', label: 'Casual Leave', days: 12 },
        { id: 'vacation', label: 'Vacation Leave', days: 28 },
        { id: 'medical', label: 'Medical Leave', days: 15 },
        { id: 'on-duty', label: 'On-Duty', days: 0 },
        { id: 'sick', label: 'Sick Leave', days: 5 },
        { id: 'paid', label: 'Paid Leave', days: 12 }
    ]
};

export function CollegeSettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<CollegeSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Draft inputs
    const [newDeptId, setNewDeptId] = useState('');
    const [newDeptName, setNewDeptName] = useState('');
    const [newRoomId, setNewRoomId] = useState('');
    const [newRoomDeptId, setNewRoomDeptId] = useState('');
    const [newTimingRange, setNewTimingRange] = useState('');
    const [newLeaveLabel, setNewLeaveLabel] = useState('');
    const [newLeaveDays, setNewLeaveDays] = useState('0');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'college');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    let finalLeaveQuotas = data.leaveQuotas || DEFAULT_SETTINGS.leaveQuotas;

                    // Handle transition from object to array
                    if (finalLeaveQuotas && !Array.isArray(finalLeaveQuotas) && typeof finalLeaveQuotas === 'object') {
                        finalLeaveQuotas = Object.entries(finalLeaveQuotas).map(([key, val]) => ({
                            id: key,
                            label: key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' ') + ' Leave',
                            days: Number(val)
                        }));
                    }

                    setSettings({
                        departments: data.departments || DEFAULT_SETTINGS.departments,
                        rooms: data.rooms || [],
                        timings: data.timings || DEFAULT_SETTINGS.timings,
                        leaveQuotas: finalLeaveQuotas
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                toast.error('Failed to load college settings.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!user || user.role !== 'principal') return;
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'college'), settings);
            toast.success('College settings saved successfully!');
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    // Departments
    const addDepartment = () => {
        if (!newDeptId || !newDeptName) return;
        if (settings.departments.find(d => d.id === newDeptId.toUpperCase())) {
            toast.error('Department ID already exists');
            return;
        }
        setSettings(prev => ({
            ...prev,
            departments: [...prev.departments, { id: newDeptId.toUpperCase(), name: newDeptName }]
        }));
        setNewDeptId('');
        setNewDeptName('');
        setHasChanges(true);
    };

    const removeDepartment = (id: string) => {
        setSettings(prev => ({
            ...prev,
            departments: prev.departments.filter(d => d.id !== id),
            // Optionally cascade delete rooms here
            rooms: prev.rooms.filter(r => r.departmentId !== id)
        }));
        setHasChanges(true);
    };

    // Rooms
    const addRoom = () => {
        if (!newRoomId || !newRoomDeptId) return;
        if (settings.rooms.find(r => r.id === newRoomId)) {
            toast.error('Room already exists');
            return;
        }
        setSettings(prev => ({
            ...prev,
            rooms: [...prev.rooms, { id: newRoomId, departmentId: newRoomDeptId }]
        }));
        setNewRoomId('');
        setHasChanges(true);
    };

    const removeRoom = (id: string) => {
        setSettings(prev => ({ ...prev, rooms: prev.rooms.filter(r => r.id !== id) }));
        setHasChanges(true);
    };

    // Timings
    const addTiming = () => {
        if (!newTimingRange) return;
        setSettings(prev => ({
            ...prev,
            timings: [...prev.timings, { id: `t${Date.now()}`, timeRange: newTimingRange }]
        }));
        setNewTimingRange('');
        setHasChanges(true);
    };

    const removeTiming = (id: string) => {
        setSettings(prev => ({ ...prev, timings: prev.timings.filter(t => t.id !== id) }));
        setHasChanges(true);
    };

    // Leave Quotas
    const addLeaveQuota = () => {
        if (!newLeaveLabel) return;
        const id = newLeaveLabel.toLowerCase().replace(/\s+/g, '-');
        if (settings.leaveQuotas.find(q => q.id === id)) {
            toast.error('Leave type already exists');
            return;
        }
        setSettings(prev => ({
            ...prev,
            leaveQuotas: [...prev.leaveQuotas, { id, label: newLeaveLabel, days: parseInt(newLeaveDays) || 0 }]
        }));
        setNewLeaveLabel('');
        setNewLeaveDays('0');
        setHasChanges(true);
    };

    const removeLeaveQuota = (id: string) => {
        setSettings(prev => ({ ...prev, leaveQuotas: prev.leaveQuotas.filter(q => q.id !== id) }));
        setHasChanges(true);
    };

    const updateLeaveQuota = (id: string, days: number) => {
        setSettings(prev => ({
            ...prev,
            leaveQuotas: prev.leaveQuotas.map(q => q.id === id ? { ...q, days } : q)
        }));
        setHasChanges(true);
    };

    if (!user || user.role !== 'principal') return null;
    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="College Settings"
                description="Manage departments, rooms, and daily timings"
            >
                <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="bg-primary hover:bg-primary/90">
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save All Changes'}
                </Button>
            </PageHeader>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-border lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DoorOpen className="h-5 w-5" /> Leave Quotas
                        </CardTitle>
                        <CardDescription>Manage dynamic leave types and annual quotas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Input
                                    placeholder="Leave Name (e.g. Research Leave)"
                                    value={newLeaveLabel}
                                    onChange={e => setNewLeaveLabel(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Days"
                                        className="w-24"
                                        value={newLeaveDays}
                                        onChange={e => setNewLeaveDays(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addLeaveQuota()}
                                    />
                                    <Button variant="secondary" onClick={addLeaveQuota} className="flex-1"><Plus className="h-4 w-4 mr-2" /> Add</Button>
                                </div>
                            </div>
                            <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2 mt-4">
                                {settings.leaveQuotas.map(quota => (
                                    <li key={quota.id} className="space-y-2 p-3 bg-muted/50 rounded-md border border-border/50 transition-all">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm">{quota.label}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeLeaveQuota(quota.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-[10px] uppercase opacity-60">Days:</Label>
                                            <Input
                                                type="number"
                                                className="h-8 text-xs bg-background"
                                                value={quota.days}
                                                onChange={(e) => updateLeaveQuota(quota.id, parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Timings Configuration */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" /> Daily Timings
                        </CardTitle>
                        <CardDescription>Configure the standard periods for the college.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. 9:00 - 10:00"
                                    value={newTimingRange}
                                    onChange={e => setNewTimingRange(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addTiming()}
                                />
                                <Button variant="secondary" onClick={addTiming}><Plus className="h-4 w-4" /></Button>
                            </div>
                            <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {settings.timings.map(timing => (
                                    <li key={timing.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm border border-border/50">
                                        <span>{timing.timeRange}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeTiming(timing.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </li>
                                ))}
                                {settings.timings.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No timings configured.</p>}
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Departments Configuration */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" /> Departments
                        </CardTitle>
                        <CardDescription>Manage college departments and codes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Input
                                    placeholder="Code (e.g. CSE)"
                                    value={newDeptId}
                                    onChange={e => setNewDeptId(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Full Name"
                                        value={newDeptName}
                                        onChange={e => setNewDeptName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addDepartment()}
                                    />
                                    <Button variant="secondary" onClick={addDepartment}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {settings.departments.map(dept => (
                                    <li key={dept.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm border border-border/50">
                                        <div>
                                            <span className="font-semibold">{dept.id}</span>
                                            <span className="text-muted-foreground ml-2">{dept.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeDepartment(dept.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Rooms Configuration */}
                <Card className="border-border md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DoorOpen className="h-5 w-5" /> Rooms
                        </CardTitle>
                        <CardDescription>Assign classrooms/labs to departments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Input
                                    placeholder="Room Number/Name"
                                    value={newRoomId}
                                    onChange={e => setNewRoomId(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newRoomDeptId}
                                        onChange={e => setNewRoomDeptId(e.target.value)}
                                    >
                                        <option value="" disabled>Select Department</option>
                                        <option value="ALL">All/Common</option>
                                        {settings.departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.id}</option>
                                        ))}
                                    </select>
                                    <Button variant="secondary" onClick={addRoom}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {settings.rooms.map(room => (
                                    <li key={room.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm border border-border/50">
                                        <div>
                                            <span className="font-semibold">{room.id}</span>
                                            <span className="text-muted-foreground ml-2 text-xs">({room.departmentId})</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeRoom(room.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </li>
                                ))}
                                {settings.rooms.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No rooms added yet.</p>}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default CollegeSettingsPage;
