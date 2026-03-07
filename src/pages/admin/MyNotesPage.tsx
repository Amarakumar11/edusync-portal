import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Trash2, Save, FileText } from 'lucide-react';

interface Note {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
}

export function MyNotesPage() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, [user]);

    const fetchNotes = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, 'notes'),
                where('userId', '==', user.uid),
                orderBy('updatedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const fetchedNotes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Note[];
            setNotes(fetchedNotes);

            if (fetchedNotes.length > 0 && !activeNoteId) {
                setActiveNote(fetchedNotes[0]);
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
            toast.error('Failed to load notes');
        }
    };

    const setActiveNote = (note: Note) => {
        setActiveNoteId(note.id);
        setTitle(note.title);
        setContent(note.content);
    };

    const createNewNote = async () => {
        if (!user) return;
        const newNote = {
            userId: user.uid,
            title: 'Untitled Note',
            content: '',
            updatedAt: new Date().toISOString()
        };

        try {
            const docRef = await addDoc(collection(db, 'notes'), newNote);
            setActiveNoteId(docRef.id);
            setTitle(newNote.title);
            setContent(newNote.content);
            fetchNotes();
            toast.success('Note created');
        } catch (error) {
            console.error('Error creating note:', error);
            toast.error('Failed to create note');
        }
    };

    const saveNote = async () => {
        if (!activeNoteId || !user) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'notes', activeNoteId), {
                title,
                content,
                updatedAt: new Date().toISOString()
            });
            toast.success('Note saved successfully');
            fetchNotes();
        } catch (error) {
            console.error('Error saving note:', error);
            toast.error('Failed to save note');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteNote = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            await deleteDoc(doc(db, 'notes', id));
            if (activeNoteId === id) {
                setActiveNoteId(null);
                setTitle('');
                setContent('');
            }
            toast.success('Note deleted');
            fetchNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error('Failed to delete note');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
            <PageHeader
                title="My Notes"
                description="Keep track of your quick thoughts and official notes"
            />

            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 min-h-0">
                {/* Sidebar for Notes List */}
                <div className="md:col-span-1 flex flex-col gap-4">
                    <Button onClick={createNewNote} className="w-full bg-primary hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> New Note
                    </Button>

                    <DataCard className="flex-1 overflow-hidden" contentClassName="p-2 h-full">
                        <div className="space-y-2 h-full overflow-y-auto">
                            {notes.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No notes found.<br />Create one to get started!
                                </div>
                            ) : (
                                notes.map(note => (
                                    <div
                                        key={note.id}
                                        onClick={() => setActiveNote(note)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors group ${activeNoteId === note.id
                                                ? 'bg-primary/10 border border-primary/20'
                                                : 'hover:bg-muted bg-transparent border border-transparent'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="font-medium text-foreground line-clamp-1 flex-1">
                                                {note.title || 'Untitled Note'}
                                            </div>
                                            <button
                                                onClick={(e) => deleteNote(note.id, e)}
                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {note.content || 'No content...'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DataCard>
                </div>

                {/* Editor Area */}
                <div className="md:col-span-3 h-full">
                    <DataCard className="h-full flex flex-col" contentClassName="flex-1 flex flex-col p-6 gap-4">
                        {activeNoteId ? (
                            <>
                                <div className="flex justify-between items-center gap-4">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Note Title"
                                        className="text-lg font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0"
                                    />
                                    <Button onClick={saveNote} disabled={isSaving} size="sm" className="shrink-0 bg-primary hover:bg-primary/90">
                                        <Save className="mr-2 h-4 w-4" />
                                        {isSaving ? 'Saving...' : 'Save Notes'}
                                    </Button>
                                </div>
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Start writing your notes here..."
                                    className="flex-1 resize-none border-0 focus-visible:ring-0 bg-transparent p-0 text-base"
                                />
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
                                <FileText className="h-16 w-16 mb-4 opacity-20" />
                                <p>Select a note from the sidebar or create a new one</p>
                            </div>
                        )}
                    </DataCard>
                </div>
            </div>
        </div>
    );
}

export default MyNotesPage;
