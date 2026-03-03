import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase';
import { toast } from 'sonner';
import { FileUp, File, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AllTimetablesPage() {
    const { user } = useAuth();
    const [timetables, setTimetables] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');

    const fetchTimetables = async () => {
        try {
            const q = query(collection(db, 'timetable_pdfs'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setTimetables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error fetching timetables:', error);
            toast.error('Failed to load timetables');
        }
    };

    useEffect(() => {
        fetchTimetables();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title || !user) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `timetables/${Date.now()}_${file.name}`);
            const uploadResult = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(uploadResult.ref);

            await addDoc(collection(db, 'timetable_pdfs'), {
                title,
                url,
                uploadedBy: user.name,
                createdAt: new Date().toISOString(),
                fileName: file.name,
                storagePath: storageRef.fullPath
            });

            toast.success('Timetable uploaded successfully');
            setFile(null);
            setTitle('');
            fetchTimetables();
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload timetable');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string, path: string) => {
        try {
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);
            await deleteDoc(doc(db, 'timetable_pdfs', id));
            toast.success('Timetable deleted');
            fetchTimetables();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete timetable');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="All Timetables"
                description="Manage and view timetable PDFs for all departments"
            />

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <DataCard title="Upload Timetable">
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. CSE-A Fall 2026"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file">PDF File</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                    disabled={isUploading}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={!file || !title || isUploading}>
                                {isUploading ? 'Uploading...' : 'Upload'}
                                {!isUploading && <FileUp className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>
                    </DataCard>
                </div>

                <div className="md:col-span-2">
                    <DataCard title="Uploaded Timetables">
                        {timetables.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <File className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                No timetables uploaded yet
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {timetables.map(tt => (
                                    <div key={tt.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <File className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-foreground">{tt.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Uploaded by {tt.uploadedBy} on {new Date(tt.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={tt.url} target="_blank" rel="noopener noreferrer">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(tt.id, tt.storagePath)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </DataCard>
                </div>
            </div>
        </div>
    );
}

export default AllTimetablesPage;
