import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Upload, Trash2, FolderOpen, Download } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { toast } from 'sonner';

interface DeptDoc {
    id: string;
    title: string;
    category: string;
    url: string;
    uploadedBy: string;
    uploadedAt: any;
}

export function DepartmentDocsPage() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<DeptDoc[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Upload state
    const [showUpload, setShowUpload] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Accreditation');
    const [isUploading, setIsUploading] = useState(false);

    const fetchDocuments = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const q = query(
                collection(db, 'department_docs'),
                where('department', '==', user.department),
                orderBy('uploadedAt', 'desc')
            );
            const snap = await getDocs(q);
            setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as DeptDoc)));
        } catch (error) {
            console.error("Error fetching documents:", error);
            // toast.error("Failed to load documents");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
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
            const response = await fetch(`${baseUrl}/api/upload/dept-docs`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();

            await addDoc(collection(db, 'department_docs'), {
                title,
                category,
                url: data.url,
                department: user.department,
                uploadedBy: user.name,
                uploadedAt: serverTimestamp()
            });

            toast.success("Document uploaded successfully");
            setFile(null);
            setTitle('');
            setShowUpload(false);
            fetchDocuments();
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload document");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await deleteDoc(doc(db, 'department_docs', id));
            toast.success("Document deleted");
            setDocuments(documents.filter(d => d.id !== id));
        } catch (error) {
            toast.error("Failed to delete document");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <PageHeader
                    title="Department Documents"
                    description={`Manage official documents and files for ${user?.department || 'your'} department`}
                />
                <Button onClick={() => setShowUpload(!showUpload)}>
                    {showUpload ? 'Cancel' : <><Upload className="w-4 h-4 mr-2" /> Upload Document</>}
                </Button>
            </div>

            {showUpload && (
                <DataCard title="Upload New Document" className="bg-muted/30 border-primary/20">
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Document Title</Label>
                                <Input placeholder="e.g. NBA Compliance Report 2024" value={title} onChange={e => setTitle(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Accreditation">Accreditation (NBA/NAAC)</SelectItem>
                                        <SelectItem value="Board of Studies">Board of Studies</SelectItem>
                                        <SelectItem value="Syllabus Copies">Syllabus Copies</SelectItem>
                                        <SelectItem value="Department Circulars">Department Circulars</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>File</Label>
                                <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} required />
                            </div>
                        </div>
                        <Button type="submit" disabled={isUploading || !file || !title}>
                            {isUploading ? 'Uploading...' : 'Upload File'}
                        </Button>
                    </form>
                </DataCard>
            )}

            <DataCard title={`Files in ${user?.department || 'Department'}`}>
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading documents...</div>
                ) : documents.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                        <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
                        <p>No documents uploaded yet in this department.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {documents.map((doc) => (
                            <div key={doc.id} className="border p-4 rounded-lg hover:border-primary/50 transition-colors flex flex-col justify-between group">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm truncate" title={doc.title}>{doc.title}</h4>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                {doc.category}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">Uploaded by {doc.uploadedBy}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="outline" asChild>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4 mr-2" /> Download</a>
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(doc.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DataCard>
        </div>
    );
}

export default DepartmentDocsPage;
