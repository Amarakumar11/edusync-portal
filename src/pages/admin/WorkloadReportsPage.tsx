import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';

interface WorkloadData {
    facultyId: string;
    name: string;
    designation: string;
    department: string;
    totalClasses: number;
}

export function WorkloadReportsPage() {
    const { user } = useAuth();
    const [workloads, setWorkloads] = useState<WorkloadData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWorkloads = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // Fetch all faculty in the HOD's department
                const facultyQuery = query(collection(db, 'users'));
                const facultySnap = await getDocs(facultyQuery);

                let facultyList: any[] = [];
                facultySnap.forEach(doc => {
                    const data = doc.data();
                    if (data.role === 'faculty' && data.department === user.department) {
                        facultyList.push({ id: doc.id, ...data });
                    }
                });

                // Fetch their timetables
                const workData: WorkloadData[] = [];
                for (const faculty of facultyList) {
                    const ttSnap = await getDocs(query(collection(db, 'timetable'))); // Note: we can map the ids but getDocs for simplistic filtering
                    let weeklyWorkload = 0;

                    // Check if timetable exists for this uid
                    const ttDoc = ttSnap.docs.find(d => d.id === faculty.uid);
                    if (ttDoc) {
                        const data = ttDoc.data().schedule;
                        const workDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        for (const d of workDays) {
                            if (data[d]) {
                                weeklyWorkload += data[d].filter((c: any) => c.subject && c.subject.trim() !== '').length;
                            }
                        }
                    }

                    workData.push({
                        facultyId: faculty.uid,
                        name: faculty.name,
                        designation: faculty.designation || 'Faculty',
                        department: faculty.department,
                        totalClasses: weeklyWorkload
                    });
                }

                setWorkloads(workData.sort((a, b) => b.totalClasses - a.totalClasses));
            } catch (error) {
                console.error('Error fetching workloads:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkloads();
    }, [user]);

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Faculty Workload Reports"
                description="Overview of teaching hours and class assignments for your department"
            />

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Faculty Name</TableHead>
                                <TableHead>Designation</TableHead>
                                <TableHead className="text-right">Weekly Workload (Hours/Classes)</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : workloads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No faculty found in this department
                                    </TableCell>
                                </TableRow>
                            ) : (
                                workloads.map((data) => (
                                    <TableRow key={data.facultyId}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            {data.name}
                                        </TableCell>
                                        <TableCell>{data.designation}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {data.totalClasses} hrs
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {data.totalClasses < 12 ? (
                                                <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs">Underloaded</span>
                                            ) : data.totalClasses > 20 ? (
                                                <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs">Overloaded</span>
                                            ) : (
                                                <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">Optimal</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default WorkloadReportsPage;
