import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FolderOpen, BookOpen, ChevronRight, MoreVertical } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";

interface Exam {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    exam_id: string;
    name: string;
    description: string | null;
    icon?: string;
    color?: string;
    is_active?: boolean;
    created_at?: string;
}

interface Topic {
    id: string;
    subject_id: string;
    name: string;
    description: string | null;
    order_index?: number;
    is_active?: boolean;
    created_at?: string;
}

const SubjectManagement = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<Exam[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    // Dialog states
    const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
    const [topicDialogOpen, setTopicDialogOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

    // Form data
    const [subjectForm, setSubjectForm] = useState({ exam_id: "", name: "", description: "" });
    const [topicForm, setTopicForm] = useState({ name: "", description: "" });

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { navigate("/admin/login"); return; }

        const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle();

        if (!roleData) {
            await supabase.auth.signOut();
            toast({ title: "Access Denied", description: "You do not have admin privileges", variant: "destructive" });
            navigate("/admin/login");
            return;
        }

        await Promise.all([loadExams(), loadSubjects()]);
        setLoading(false);
    };

    const loadExams = async () => {
        const { data, error } = await supabase
            .from("exams")
            .select("id, name")
            .eq("is_active", true)
            .order("name");

        if (error) {
            toast({ title: "Error", description: "Failed to load exams", variant: "destructive" });
            return;
        }
        setExams(data || []);
    };

    const loadSubjects = async () => {
        const { data, error } = await supabase
            .from("subjects")
            .select("id, exam_id, name, description")
            .order("name");

        if (error) {
            toast({ title: "Error", description: "Failed to load subjects", variant: "destructive" });
            return;
        }
        setSubjects(data || []);
    };

    const loadTopics = async (subjectId: string) => {
        const { data, error } = await supabase
            .from("topics")
            .select("id, subject_id, name, description")
            .eq("subject_id", subjectId)
            .order("created_at");

        if (error) {
            toast({ title: "Error", description: "Failed to load topics", variant: "destructive" });
            return;
        }
        setTopics(data || []);
    };

    const selectSubject = async (subject: Subject) => {
        setSelectedSubject(subject);
        await loadTopics(subject.id);
    };

    // Subject CRUD
    const openCreateSubject = () => {
        setEditingSubject(null);
        setSubjectForm({ exam_id: "", name: "", description: "" });
        setSubjectDialogOpen(true);
    };

    const openEditSubject = (subject: Subject) => {
        setEditingSubject(subject);
        setSubjectForm({ exam_id: subject.exam_id, name: subject.name, description: subject.description || "" });
        setSubjectDialogOpen(true);
    };

    const handleSaveSubject = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        if (!subjectForm.name.trim() || !subjectForm.exam_id) {
            toast({ title: "Error", description: "Exam and subject name are required", variant: "destructive" });
            return;
        }

        if (editingSubject) {
            const { error } = await supabase
                .from("subjects")
                .update({
                    exam_id: subjectForm.exam_id,
                    name: subjectForm.name,
                    description: subjectForm.description || null,
                })
                .eq("id", editingSubject.id);

            if (error) {
                toast({ title: "Error", description: "Failed to update subject", variant: "destructive" });
                return;
            }
            toast({ title: "Success", description: "Subject updated" });
        } else {
            const { error } = await supabase
                .from("subjects")
                .insert([
                    {
                        exam_id: subjectForm.exam_id,
                        name: subjectForm.name,
                        description: subjectForm.description || null,
                        created_by: session.user.id,
                    },
                ]);

            if (error) {
                toast({ title: "Error", description: "Failed to create subject", variant: "destructive" });
                return;
            }
            toast({ title: "Success", description: "Subject created" });
        }

        setSubjectDialogOpen(false);
        await loadSubjects();
    };

    const handleDeleteSubject = async (subject: Subject) => {
        if (!confirm(`Delete "${subject.name}"? This will also delete all topics and notes under it.`)) return;

        const { error } = await supabase.from("subjects").delete().eq("id", subject.id);
        if (error) {
            toast({ title: "Error", description: "Failed to delete subject", variant: "destructive" });
            return;
        }

        toast({ title: "Success", description: "Subject deleted" });
        if (selectedSubject?.id === subject.id) {
            setSelectedSubject(null);
            setTopics([]);
        }
        await loadSubjects();
    };

    // Topic CRUD
    const openCreateTopic = () => {
        if (!selectedSubject) return;
        setEditingTopic(null);
        setTopicForm({ name: "", description: "" });
        setTopicDialogOpen(true);
    };

    const openEditTopic = (topic: Topic) => {
        setEditingTopic(topic);
        setTopicForm({ name: topic.name, description: topic.description || "" });
        setTopicDialogOpen(true);
    };

    const handleSaveTopic = async () => {
        if (!selectedSubject) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        if (editingTopic) {
            const { error } = await supabase
                .from("topics")
                .update({ name: topicForm.name, description: topicForm.description || null })
                .eq("id", editingTopic.id);

            if (error) {
                toast({ title: "Error", description: "Failed to update topic", variant: "destructive" });
                return;
            }
            toast({ title: "Success", description: "Topic updated" });
        } else {
            const { error } = await supabase
                .from("topics")
                .insert([
                    {
                        subject_id: selectedSubject.id,
                        name: topicForm.name,
                        description: topicForm.description || null,
                        created_by: session.user.id,
                    },
                ]);

            if (error) {
                toast({ title: "Error", description: "Failed to create topic", variant: "destructive" });
                return;
            }
            toast({ title: "Success", description: "Topic created" });
        }

        setTopicDialogOpen(false);
        await loadTopics(selectedSubject.id);
    };

    const handleDeleteTopic = async (topic: Topic) => {
        if (!confirm(`Delete topic "${topic.name}"?`)) return;

        const { error } = await supabase.from("topics").delete().eq("id", topic.id);
        if (error) {
            toast({ title: "Error", description: "Failed to delete topic", variant: "destructive" });
            return;
        }

        toast({ title: "Success", description: "Topic deleted" });
        if (selectedSubject) await loadTopics(selectedSubject.id);
    };

    const CreateSubjectButton = (
        <Button onClick={openCreateSubject} size="icon" className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 border border-white/20">
            <Plus className="w-5 h-5" />
        </Button>
    );

    if (loading) {
        return (
            <AdminLayout title="Subject & Topics" subtitle="Manage subjects and topics for notes">
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Subject & Topics" subtitle="Manage subjects and topics for notes" headerActions={CreateSubjectButton}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subjects List */}
                <Card className="border-0 bg-white rounded-2xl">
                    <CardContent className="p-4">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-emerald-600" />
                            Subjects ({subjects.length})
                        </h3>

                        {subjects.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm">No subjects yet</p>
                                <Button onClick={openCreateSubject} size="sm" className="mt-3 rounded-xl">
                                    <Plus className="w-4 h-4 mr-1" /> Add Subject
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {subjects.map(subject => (
                                    <div
                                        key={subject.id}
                                        onClick={() => selectSubject(subject)}
                                        className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${selectedSubject?.id === subject.id
                                            ? "bg-emerald-50 border-2 border-emerald-500"
                                            : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                                <BookOpen className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{subject.name}</p>
                                                {subject.description && (
                                                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{subject.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="w-8 h-8">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditSubject(subject); }}>
                                                        <Pencil className="w-4 h-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject); }} className="text-red-600">
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Topics List */}
                <Card className="border-0 bg-white rounded-2xl">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-violet-600" />
                                Topics {selectedSubject && `(${topics.length})`}
                            </h3>
                            {selectedSubject && (
                                <Button onClick={openCreateTopic} size="sm" className="rounded-xl h-8">
                                    <Plus className="w-4 h-4 mr-1" /> Add Topic
                                </Button>
                            )}
                        </div>

                        {!selectedSubject ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm">Select a subject to view topics</p>
                            </div>
                        ) : topics.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm">No topics in {selectedSubject.name}</p>
                                <Button onClick={openCreateTopic} size="sm" className="mt-3 rounded-xl">
                                    <Plus className="w-4 h-4 mr-1" /> Add Topic
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {topics.map((topic, idx) => (
                                    <div key={topic.id} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="secondary" className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-100 text-violet-600 text-xs">
                                                {idx + 1}
                                            </Badge>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{topic.name}</p>
                                                {topic.description && (
                                                    <p className="text-xs text-gray-500 truncate max-w-[180px]">{topic.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-8 h-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl">
                                                <DropdownMenuItem onClick={() => openEditTopic(topic)}>
                                                    <Pencil className="w-4 h-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDeleteTopic(topic)} className="text-red-600">
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Subject Dialog */}
            <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingSubject ? "Edit Subject" : "Create Subject"}</DialogTitle>
                        <DialogDescription>
                            {editingSubject ? "Update subject details" : "Add a new subject for notes"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Exam *</Label>
                            <Select value={subjectForm.exam_id} onValueChange={(v) => setSubjectForm({ ...subjectForm, exam_id: v })}>
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder="Select exam" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map((e) => (
                                        <SelectItem key={e.id} value={e.id}>
                                            {e.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Subject Name *</Label>
                            <Input
                                value={subjectForm.name}
                                onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                placeholder="e.g., Physics, Chemistry"
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={subjectForm.description}
                                onChange={e => setSubjectForm({ ...subjectForm, description: e.target.value })}
                                placeholder="Brief description"
                                rows={2}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSubjectDialogOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleSaveSubject} disabled={!subjectForm.name.trim() || !subjectForm.exam_id} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
                            {editingSubject ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Topic Dialog */}
            <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingTopic ? "Edit Topic" : "Create Topic"}</DialogTitle>
                        <DialogDescription>
                            {selectedSubject && `${editingTopic ? "Update" : "Add"} topic in ${selectedSubject.name}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Topic Name *</Label>
                            <Input
                                value={topicForm.name}
                                onChange={e => setTopicForm({ ...topicForm, name: e.target.value })}
                                placeholder="e.g., Heat, Light, Mechanics"
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={topicForm.description}
                                onChange={e => setTopicForm({ ...topicForm, description: e.target.value })}
                                placeholder="Brief description"
                                rows={2}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setTopicDialogOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleSaveTopic} disabled={!topicForm.name.trim()} className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600">
                            {editingTopic ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default SubjectManagement;
