import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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
import { FacultyProfile } from '@/types/auth'; // Ensure this exists or just use any/User type

export function FacultyInfoPage() {
    const { user } = useAuth();
    const [facultyList, setFacultyList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFaculty = async () => {
            if (!user || user.role !== 'hod') return;
            try {
                const usersRef = collection(db, 'users');
                const q = query(
                    usersRef,
                    where('role', '==', 'faculty'),
                    where('department', '==', user.department)
                );
                const snapshot = await getDocs(q);
                const fetched = snapshot.docs.map(doc => ({
                    uid: doc.id,
                    ...doc.data()
                }));

                // Sort by name
                fetched.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                setFacultyList(fetched);
            } catch (error) {
                console.error('Error fetching faculty:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFaculty();
    }, [user]);

    if (!user || user.role !== 'hod') return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Faculty Information"
                description={`View all registered faculty members in ${user.department} Department`}
            />

            <DataCard title={`Registered Faculty (${facultyList.length})`}>
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
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone Number</TableHead>
                                    <TableHead>Joined At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {facultyList.map(faculty => (
                                    <TableRow key={faculty.uid} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">{faculty.name}</TableCell>
                                        <TableCell>{faculty.erpId || 'N/A'}</TableCell>
                                        <TableCell>{faculty.email}</TableCell>
                                        <TableCell>{faculty.phone || 'N/A'}</TableCell>
                                        <TableCell>
                                            {faculty.createdAt
                                                ? new Date(faculty.createdAt).toLocaleDateString()
                                                : 'Unknown'}
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
