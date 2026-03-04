import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { collection, query, where, getDocs, orderBy, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase';

export function FacultyInfoPage() {
    const { user } = useAuth();
    const [facultyList, setFacultyList] = useState<any[]>([]);
    const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
    const [isAddingUser, setIsAddingUser] = useState(false);

    const [newStaff, setNewStaff] = useState({
        name: '', email: '', phone: '', erpId: '', role: 'faculty', department: 'CSE'
    });

    const fetchFaculty = useCallback(async () => {
        if (!user || (user.role !== 'hod' && user.role !== 'principal')) return;
        try {
            const usersRef = collection(db, 'users');
            let q;
            if (user.role === 'principal') {
                q = query(usersRef, where('role', 'in', ['faculty', 'hod']));
            } else {
                q = query(
                    usersRef,
                    where('role', '==', 'faculty'),
                    where('department', '==', user.department)
                );
            }
            const snapshot = await getDocs(q);
            const fetched = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...(doc.data() as any)
            }));

            // Sort by name
            fetched.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            setFacultyList(fetched);
        } catch (error) {
            console.error('Error fetching faculty:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchFaculty();
    }, [fetchFaculty]);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const settingsRef = doc(db, 'settings', 'college');
                const settingsSnap = await getDoc(settingsRef);
                let depts = [
                    { id: 'CSE', name: 'Computer Science and Engineering' },
                    { id: 'ECE', name: 'Electronics and Communication' },
                    { id: 'HS', name: 'Humanities and Sciences' }
                ]; // default fallback

                if (settingsSnap.exists() && settingsSnap.data().departments) {
                    depts = settingsSnap.data().departments;
                }

                setDepartments(depts);
                if (depts.length > 0) {
                    setNewStaff(prev => ({ ...prev, department: depts[0].id }));
                }
            } catch (error) {
                console.error('Error fetching global depts:', error);
            }
        };
        fetchDepts();
    }, []);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingUser(true);
        try {
            // Secondary Firebase app to prevent logging out the Principal
            const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
            const secondaryAuth = getAuth(secondaryApp);

            const presetPassword = 'Password@123'; // Default password for newly created staff

            const cred = await createUserWithEmailAndPassword(secondaryAuth, newStaff.email, presetPassword);
            await updateProfile(cred.user, { displayName: newStaff.name });

            const profile = {
                uid: cred.user.uid,
                ...newStaff,
                createdAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'users', cred.user.uid), profile);

            toast.success(`${newStaff.role.toUpperCase()} added successfully! Default Password: ${presetPassword}`);
            setIsAddStaffOpen(false);
            setNewStaff({ name: '', email: '', phone: '', erpId: '', role: 'faculty', department: 'CSE' });
            fetchFaculty();
        } catch (error: any) {
            console.error('Error adding staff:', error);
            toast.error(error.message || 'Failed to add staff');
        } finally {
            setIsAddingUser(false);
        }
    };

    if (!user || (user.role !== 'hod' && user.role !== 'principal')) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title={user.role === 'principal' ? "All Staff Information" : "Faculty Information"}
                    description={user.role === 'principal' ? "View all registered faculty and HODs across the institution" : `View all registered faculty members in ${user.department} Department`}
                />

                {user.role === 'principal' && (
                    <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                        <DialogTrigger asChild>
                            <Button className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                                <Users className="mr-2 h-4 w-4" /> Add Staff Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Staff Member</DialogTitle>
                                <DialogDescription>
                                    Create a new account for an HOD or Faculty. The default password will be <strong>Password@123</strong>.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddStaff} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input required value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="e.g. John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input required type="email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="email@edusync.com" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>ERP ID</Label>
                                        <Input required value={newStaff.erpId} onChange={e => setNewStaff({ ...newStaff, erpId: e.target.value })} placeholder="e.g. ERP123" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} placeholder="+91..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={newStaff.role} onValueChange={v => setNewStaff({ ...newStaff, role: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="faculty">Faculty</SelectItem>
                                                <SelectItem value="hod">HOD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Select value={newStaff.department} onValueChange={v => setNewStaff({ ...newStaff, department: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                                            <SelectContent>
                                                {departments.length > 0 ? (
                                                    departments.map(dept => (
                                                        <SelectItem key={dept.id} value={dept.id}>
                                                            {dept.id}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="CSE">CSE</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter className="mt-6">
                                    <Button type="button" variant="outline" onClick={() => setIsAddStaffOpen(false)} disabled={isAddingUser}>Cancel</Button>
                                    <Button type="submit" disabled={isAddingUser} className="bg-primary">{isAddingUser ? 'Adding...' : 'Add Staff Member'}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <DataCard title={`Registered Staff (${facultyList.length})`}>
                {loading ? (
                    <div className="py-12 text-center text-muted-foreground">Loading faculty data...</div>
                ) : facultyList.length === 0 ? (
                    <EmptyState
                        title="No faculty found"
                        description="No faculty members are registered in your department yet."
                        icon={<Users className="h-6 w-6" />}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>ERP ID</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone Number</TableHead>
                                    <TableHead>Joined At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {facultyList.map(faculty => (
                                    <TableRow key={faculty.uid} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">{faculty.name}</TableCell>
                                        <TableCell>{faculty.erpId || 'N/A'}</TableCell>
                                        <TableCell className="capitalize">{faculty.role}</TableCell>
                                        <TableCell>{faculty.department || 'N/A'}</TableCell>
                                        <TableCell>{faculty.email}</TableCell>
                                        <TableCell>{faculty.phone || 'N/A'}</TableCell>
                                        <TableCell>
                                            {faculty.createdAt
                                                ? new Date(faculty.createdAt).toLocaleDateString()
                                                : 'Unknown'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to={`/${user.role}/faculty/${faculty.uid}/timetable`}>
                                                    View Timetable
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </DataCard>
        </div>
    );
}

export default FacultyInfoPage;
