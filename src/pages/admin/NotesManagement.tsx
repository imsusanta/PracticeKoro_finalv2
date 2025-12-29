import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { NotebookPen, Plus, Trash2, MoreVertical, Search, Edit, Eye, FolderOpen, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminLayout from "@/components/admin/AdminLayout";

interface Note {
  id: string;
  title: string;
  content: string | null;
  exam_id: string;
  topic_id: string | null;
  subject_id: string | null;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  exam_id: string;
}

interface Topic {
  id: string;
  subject_id: string;
  name: string;
}

const NotesManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    subject_id: "",
    topic_id: "",
  });

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { applyFilters(); }, [searchQuery, filterSubject, filterTopic, notes]);
  useEffect(() => {
    if (formData.subject_id) {
      setFilteredTopics(topics.filter(t => t.subject_id === formData.subject_id));
    } else {
      setFilteredTopics([]);
    }
  }, [formData.subject_id, topics]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/admin/login"); return; }

    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      toast({ title: "Access Denied", description: "No admin privileges", variant: "destructive" });
      navigate("/admin/login");
      return;
    }

    await Promise.all([loadSubjects(), loadTopics(), loadNotes()]);
    setLoading(false);
  };

  const loadSubjects = async () => {
    const { data } = await supabase.from("subjects").select("id, name, exam_id").order("name");
    if (data) setSubjects(data);
  };

  const loadTopics = async () => {
    const { data } = await supabase.from("topics").select("id, subject_id, name").order("name");
    if (data) setTopics(data);
  };

  const loadNotes = async () => {
    const { data, error } = await supabase
      .from("pdfs")
      .select("id, title, content, exam_id, topic_id, subject_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load notes", variant: "destructive" });
      return;
    }
    setNotes((data || []) as Note[]);
  };

  const applyFilters = () => {
    let filtered = [...notes];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q)));
    }
    if (filterSubject !== "all") {
      filtered = filtered.filter(n => n.subject_id === filterSubject);
    }
    if (filterTopic !== "all") {
      filtered = filtered.filter(n => n.topic_id === filterTopic);
    }
    setFilteredNotes(filtered);
  };

  const openCreateDialog = () => {
    setEditingNote(null);
    setFormData({ title: "", content: "", subject_id: "", topic_id: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content || "",
      subject_id: note.subject_id || "",
      topic_id: note.topic_id || "",
    });
    setDialogOpen(true);
  };

  const openViewDialog = (note: Note) => {
    setViewingNote(note);
    setViewDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.subject_id || !formData.topic_id) {
      toast({ title: "Error", description: "Title, Subject and Topic are required", variant: "destructive" });
      return;
    }

    const selectedSubjectRow = subjects.find((s) => s.id === formData.subject_id);
    if (!selectedSubjectRow?.exam_id) {
      toast({ title: "Error", description: "Selected subject must be linked to an exam", variant: "destructive" });
      return;
    }

    setSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSaving(false);
      return;
    }

    const payload = {
      title: formData.title,
      content: formData.content || null,
      subject_id: formData.subject_id,
      topic_id: formData.topic_id,
      exam_id: selectedSubjectRow.exam_id,
    };

    if (editingNote) {
      const { error } = await supabase.from("pdfs").update(payload).eq("id", editingNote.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update", variant: "destructive" });
        setSaving(false);
        return;
      }
      toast({ title: "Success", description: "Note updated" });
    } else {
      const { error } = await supabase.from("pdfs").insert([
        {
          ...payload,
          uploaded_by: session.user.id,
          file_path: null,
          file_size: null,
        },
      ]);

      if (error) {
        toast({ title: "Error", description: "Failed to create", variant: "destructive" });
        setSaving(false);
        return;
      }
      toast({ title: "Success", description: "Note created" });
    }

    setSaving(false);
    setDialogOpen(false);
    await loadNotes();
  };

  const handleDelete = async (note: Note) => {
    if (!confirm(`Delete "${note.title}"?`)) return;
    const { error } = await supabase.from("pdfs").delete().eq("id", note.id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Note deleted" });
    await loadNotes();
  };

  const getSubjectName = (subjectId: string | null) => subjects.find(s => s.id === subjectId)?.name || "-";
  const getTopicName = (topicId: string | null) => topics.find(t => t.id === topicId)?.name || "-";

  const CreateButton = (
    <Button onClick={openCreateDialog} size="icon" className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 border border-white/20">
      <Plus className="w-5 h-5" />
    </Button>
  );

  if (loading) {
    return (
      <AdminLayout title="Notes Management" subtitle="Manage study notes by subject & topic">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Notes Management" subtitle="Manage study notes by subject & topic" headerActions={CreateButton}>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            className="pl-10 h-10 rounded-xl"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-full md:w-40 h-10 rounded-xl">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTopic} onValueChange={setFilterTopic}>
          <SelectTrigger className="w-full md:w-40 h-10 rounded-xl">
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {topics.filter(t => filterSubject === "all" || t.subject_id === filterSubject).map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white rounded-2xl">
          <CardContent className="p-8 text-center">
            <NotebookPen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No Notes Found</h3>
            <p className="text-sm text-gray-500 mb-4">Create your first note</p>
            <Button onClick={openCreateDialog} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Create Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map(note => (
            <Card key={note.id} className="border-0 shadow-md bg-white rounded-2xl hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shrink-0">
                    <NotebookPen className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{note.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">
                        <FolderOpen className="w-3 h-3 mr-1" />
                        {getSubjectName(note.subject_id)}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-700">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {getTopicName(note.topic_id)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-9 h-9">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => openViewDialog(note)}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(note)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(note)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[440px] max-h-[650px] overflow-y-auto mx-4 rounded-2xl border-white/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "Create Note"}</DialogTitle>
            <DialogDescription>
              {editingNote ? "Update note content" : "Add a new study note"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={formData.subject_id} onValueChange={v => setFormData({ ...formData, subject_id: v, topic_id: "" })}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Topic *</Label>
                <Select value={formData.topic_id} onValueChange={v => setFormData({ ...formData, topic_id: v })} disabled={!formData.subject_id}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select topic" /></SelectTrigger>
                  <SelectContent>
                    {filteredTopics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Note title"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="Note content..."
                rows={8}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
              {saving ? "Saving..." : editingNote ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[440px] max-h-[650px] overflow-y-auto mx-4 rounded-2xl border-white/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>{viewingNote?.title}</DialogTitle>
            <DialogDescription className="flex gap-2 mt-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                {getSubjectName(viewingNote?.subject_id || null)}
              </Badge>
              <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                {getTopicName(viewingNote?.topic_id || null)}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 rounded-xl p-4 mt-2 max-h-[50vh] overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap select-none">
              {viewingNote?.content || "No content"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default NotesManagement;
