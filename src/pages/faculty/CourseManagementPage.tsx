import { useState } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BookOpen, Calendar, Book, Upload, Download, Trash2 } from 'lucide-react';

export function CourseManagementPage() {
    const [activeTab, setActiveTab] = useState('syllabus');

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Course Management"
                description="Manage syllabus, lesson plans, materials, and assignments for your courses"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 md:w-[600px]">
                    <TabsTrigger value="syllabus"><BookOpen className="w-4 h-4 mr-2" /> Syllabus</TabsTrigger>
                    <TabsTrigger value="lesson-plan"><Calendar className="w-4 h-4 mr-2" /> Lesson Plan</TabsTrigger>
                    <TabsTrigger value="materials"><FileText className="w-4 h-4 mr-2" /> Materials</TabsTrigger>
                    <TabsTrigger value="assignments"><Book className="w-4 h-4 mr-2" /> Assignments</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {/* Syllabus Tab */}
                    <TabsContent value="syllabus" className="space-y-4 m-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Syllabus Tracking</CardTitle>
                                <CardDescription>Track the completion status of course units.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((unit) => (
                                        <div key={unit} className="flex items-center gap-4 border p-4 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm">Unit {unit}</h4>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Input placeholder={`Topic for Unit ${unit}`} className="max-w-[400px]" />
                                                    <Button variant="outline" size="sm">Update Status</Button>
                                                </div>
                                            </div>
                                            <div className="w-32">
                                                <span className="text-xs text-muted-foreground mr-2">Completion:</span>
                                                <span className="font-medium text-sm">{unit === 1 ? '100%' : unit === 2 ? '50%' : '0%'}</span>
                                                <div className="h-2 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: unit === 1 ? '100%' : unit === 2 ? '50%' : '0%' }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Lesson Plan Tab */}
                    <TabsContent value="lesson-plan" className="space-y-4 m-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lesson Planning</CardTitle>
                                <CardDescription>Plan your daily/weekly lectures.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-4 col-span-1 border-r pr-6">
                                        <div className="space-y-2">
                                            <Label>Date / Week</Label>
                                            <Input type="date" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Topic to Cover</Label>
                                            <Input placeholder="e.g. Introduction to React" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Objectives</Label>
                                            <Textarea placeholder="Learning outcomes..." rows={3} />
                                        </div>
                                        <Button className="w-full">Save Plan</Button>
                                    </div>
                                    <div className="col-span-2 space-y-4">
                                        <h4 className="font-medium">Upcoming Plans</h4>
                                        <div className="space-y-3">
                                            <div className="border p-4 rounded-lg flex justify-between items-start hover:bg-muted/20">
                                                <div>
                                                    <p className="font-semibold text-sm">Introduction to React</p>
                                                    <p className="text-xs text-muted-foreground">Today • Week 1</p>
                                                    <p className="text-sm mt-2 text-foreground/80">Cover components, state, and props.</p>
                                                </div>
                                                <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Materials Tab */}
                    <TabsContent value="materials" className="space-y-4 m-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Course Materials</CardTitle>
                                <CardDescription>Upload PPTs, PDFs, and notes for students.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:bg-muted/10 transition-colors cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="font-semibold text-lg">Click or drag files to upload</h3>
                                    <p className="text-sm text-muted-foreground mt-2">Supports PDF, PPTX, DOCX (Max 50MB)</p>
                                </div>
                                <div className="mt-8 space-y-4">
                                    <h4 className="font-medium text-sm">Uploaded Materials</h4>
                                    <div className="border p-3 rounded-md flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-md"><FileText className="w-5 h-5 text-primary" /></div>
                                            <div>
                                                <p className="font-medium text-sm">Lecture_1_Intro.pptx</p>
                                                <p className="text-xs text-muted-foreground">2.4 MB • Uploaded 2 days ago</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost"><Download className="w-4 h-4" /></Button>
                                            <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Assignments Tab */}
                    <TabsContent value="assignments" className="space-y-4 m-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Assignments</CardTitle>
                                <CardDescription>Create assignments and track submissions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6 items-start">
                                    <div className="border rounded-lg p-4 space-y-4">
                                        <h4 className="font-semibold border-b pb-2 mb-4">Create New Assignment</h4>
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input placeholder="Assignment 1" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea placeholder="Task details..." />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Due Date</Label>
                                                <Input type="date" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Max Points</Label>
                                                <Input type="number" defaultValue={10} />
                                            </div>
                                        </div>
                                        <Button className="w-full">Publish Assignment</Button>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold border-b pb-2">Active Assignments</h4>
                                        <div className="border p-4 rounded-lg bg-primary/5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-medium">Assignment 1: React Basics</h5>
                                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Active</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-4">Due: Tomorrow • 10 Points</p>
                                            <div className="flex justify-between items-center mt-4">
                                                <span className="text-sm font-medium">45/60 Submitted</span>
                                                <Button size="sm" variant="outline">View Submissions</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

export default CourseManagementPage;
