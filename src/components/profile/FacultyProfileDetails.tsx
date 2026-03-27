import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { GraduationCap, Briefcase, BookOpen, Award, Plus, Trash2 } from 'lucide-react';
import { FacultyUser } from '@/types';

export function FacultyProfileDetails() {
    const { user } = useAuth();
    const facultyUser = user as unknown as FacultyUser;

    const [isSaving, setIsSaving] = useState(false);

    const [qualifications, setQualifications] = useState(facultyUser?.qualifications || []);
    const [subjects, setSubjects] = useState(facultyUser?.subjects || []);
    const [experience, setExperience] = useState(facultyUser?.experience || []);
    const [certificates, setCertificates] = useState(facultyUser?.certificates || []);

    const [newSubject, setNewSubject] = useState('');

    const handleSave = async () => {
        if (!user?.uid) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                qualifications,
                subjects,
                experience,
                certificates
            });
            toast.success('Professional details updated successfully!');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to update professional details.');
        } finally {
            setIsSaving(false);
        }
    };

    const addQualification = () => setQualifications([...qualifications, { degree: '', year: '', university: '' }]);
    const updateQualification = (index: number, field: string, value: string) => {
        const newQuals = [...qualifications];
        newQuals[index] = { ...newQuals[index], [field]: value };
        setQualifications(newQuals);
    };
    const removeQualification = (index: number) => setQualifications(qualifications.filter((_, i) => i !== index));

    const addSubject = () => {
        if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
            setSubjects([...subjects, newSubject.trim()]);
            setNewSubject('');
        }
    };
    const removeSubject = (subject: string) => setSubjects(subjects.filter(s => s !== subject));

    const addExperience = () => setExperience([...experience, { role: '', organization: '', years: 0 }]);
    const updateExperience = (index: number, field: string, value: any) => {
        const newExp = [...experience];
        newExp[index] = { ...newExp[index], [field]: value };
        setExperience(newExp);
    };
    const removeExperience = (index: number) => setExperience(experience.filter((_, i) => i !== index));

    const addCertificate = () => setCertificates([...certificates, { title: '', url: '', date: '' }]);
    const updateCertificate = (index: number, field: string, value: string) => {
        const newCerts = [...certificates];
        newCerts[index] = { ...newCerts[index], [field]: value };
        setCertificates(newCerts);
    };
    const removeCertificate = (index: number) => setCertificates(certificates.filter((_, i) => i !== index));

    if (!user || (user.role !== 'faculty' && user.role !== 'hod')) return null;

    return (
        <div className="space-y-6 mt-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Professional Details</h3>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Qualifications Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" /> Qualifications
                        </CardTitle>
                        <CardDescription>Academic degrees and universities.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {qualifications.map((qual, index) => (
                            <div key={index} className="flex gap-2 items-start border p-3 rounded-md">
                                <div className="space-y-2 flex-1">
                                    <Input placeholder="Degree (e.g., Ph.D, M.Tech)" value={qual.degree} onChange={(e) => updateQualification(index, 'degree', e.target.value)} />
                                    <div className="flex gap-2">
                                        <Input placeholder="Year" className="w-24" value={qual.year} onChange={(e) => updateQualification(index, 'year', e.target.value)} />
                                        <Input placeholder="University" className="flex-1" value={qual.university} onChange={(e) => updateQualification(index, 'university', e.target.value)} />
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeQualification(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addQualification} className="w-full">
                            <Plus className="w-4 h-4 mr-2" /> Add Qualification
                        </Button>
                    </CardContent>
                </Card>

                {/* Experience Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5" /> Experience
                        </CardTitle>
                        <CardDescription>Work history and teaching experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {experience.map((exp, index) => (
                            <div key={index} className="flex gap-2 items-start border p-3 rounded-md">
                                <div className="space-y-2 flex-1">
                                    <Input placeholder="Role / Designation" value={exp.role} onChange={(e) => updateExperience(index, 'role', e.target.value)} />
                                    <div className="flex gap-2">
                                        <Input placeholder="Years" type="number" className="w-24" value={exp.years || ''} onChange={(e) => updateExperience(index, 'years', parseInt(e.target.value) || 0)} />
                                        <Input placeholder="Organization" className="flex-1" value={exp.organization} onChange={(e) => updateExperience(index, 'organization', e.target.value)} />
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeExperience(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addExperience} className="w-full">
                            <Plus className="w-4 h-4 mr-2" /> Add Experience
                        </Button>
                    </CardContent>
                </Card>

                {/* Subjects Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" /> Subjects Taught
                        </CardTitle>
                        <CardDescription>Areas of expertise and subjects handled.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {subjects.map((sub, index) => (
                                <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                    {sub}
                                    <button onClick={() => removeSubject(sub)} className="hover:text-destructive"><XIcon className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="Add a subject..." value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubject()} />
                            <Button onClick={addSubject}>Add</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Certificates Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5" /> Certificates & Events
                        </CardTitle>
                        <CardDescription>Certifications, FDPs, and Workshops.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {certificates.map((cert, index) => (
                            <div key={index} className="flex gap-2 items-start border p-3 rounded-md">
                                <div className="space-y-2 flex-1">
                                    <Input placeholder="Certificate / Event Title" value={cert.title} onChange={(e) => updateCertificate(index, 'title', e.target.value)} />
                                    <div className="flex gap-2">
                                        <Input placeholder="Date (e.g. 2023)" className="w-32" value={cert.date} onChange={(e) => updateCertificate(index, 'date', e.target.value)} />
                                        <Input placeholder="URL or Doc Link (optional)" className="flex-1" value={cert.url} onChange={(e) => updateCertificate(index, 'url', e.target.value)} />
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeCertificate(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addCertificate} className="w-full">
                            <Plus className="w-4 h-4 mr-2" /> Add Certificate
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function XIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}
