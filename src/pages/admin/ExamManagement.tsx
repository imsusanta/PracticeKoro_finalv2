import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Power, PowerOff, BookOpen, MoreVertical, Calendar, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminLayout from "@/components/admin/AdminLayout";
import { isExamVisibleOnLanding, toggleExamLandingVisibility } from "@/config/landingVisibility";

interface Exam {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

const ExamManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true
  });
  const [landingVisibility, setLandingVisibility] = useState<{ [key: string]: boolean }>({});

  // Refresh landing visibility state
  const refreshLandingVisibility = () => {
    const visibility: { [key: string]: boolean } = {};
    exams.forEach(exam => {
      visibility[exam.id] = isExamVisibleOnLanding(exam.id);
    });
    setLandingVisibility(visibility);
  };

  const handleToggleLandingVisibility = (examId: string, examName: string) => {
    const newValue = toggleExamLandingVisibility(examId);
    setLandingVisibility(prev => ({ ...prev, [examId]: newValue }));
    toast({
      title: newValue ? "Visible on Landing" : "Hidden from Landing",
      description: `"${examName}" ${newValue ? "will now show" : "is now hidden"} on landing page for visitors`,
    });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login");
      return;
    }
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      toast({
        title: "Access Denied",
        description: "You do not have admin privileges",
        variant: "destructive"
      });
      navigate("/admin/login");
      return;
    }
    await loadExams();
    setLoading(false);
  };

  useEffect(() => {
    refreshLandingVisibility();
  }, [exams]);

  const loadExams = async () => {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load exams",
        variant: "destructive"
      });
      return;
    }
    setExams(data || []);
  };

  const handleCreateExam = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("exams").insert({
      name: formData.name,
      description: formData.description || null,
      is_active: formData.is_active,
      created_by: session.user.id
    });

    if (error) {
      toast({ title: "Error", description: "Failed to create exam", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Exam created successfully" });
    setDialogOpen(false);
    setFormData({ name: "", description: "", is_active: true });
    await loadExams();
  };

  const handleUpdateExam = async () => {
    if (!editingExam) return;

    const { error } = await supabase
      .from("exams")
      .update({
        name: formData.name,
        description: formData.description || null,
        is_active: formData.is_active
      })
      .eq("id", editingExam.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update exam", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Exam updated successfully" });
    setDialogOpen(false);
    setEditingExam(null);
    setFormData({ name: "", description: "", is_active: true });
    await loadExams();
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;

    const { error } = await supabase.from("exams").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete exam", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Exam deleted successfully" });
    await loadExams();
  };

  const handleToggleActive = async (exam: Exam) => {
    const { error } = await supabase
      .from("exams")
      .update({ is_active: !exam.is_active })
      .eq("id", exam.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: exam.is_active ? "Exam deactivated" : "Exam activated" });
    await loadExams();
  };

  const openEditDialog = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      description: exam.description || "",
      is_active: exam.is_active
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingExam(null);
    setFormData({ name: "", description: "", is_active: true });
    setDialogOpen(true);
  };

  const CreateButton = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={openCreateDialog}
          size="icon"
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editingExam ? "Edit Exam" : "Create Exam"}</DialogTitle>
          <DialogDescription>
            {editingExam ? "Update exam details" : "Add a new exam category"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Exam Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., UPSC, SSC, Banking"
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description"
              rows={3}
              className="rounded-xl"
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded-lg border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            <Label htmlFor="is_active" className="text-sm cursor-pointer">Active (visible to students)</Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-12 flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button
            onClick={editingExam ? handleUpdateExam : handleCreateExam}
            disabled={!formData.name.trim()}
            className="rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-teal-600 flex-1 sm:flex-none"
          >
            {editingExam ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <AdminLayout title="Exam Management" subtitle="Manage exam categories">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-emerald-600 text-sm">Loading exams...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Exam Management" subtitle="Manage exam categories" headerActions={CreateButton}>
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
            <p className="text-xs text-gray-500">Total Exams</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{exams.filter(e => e.is_active).length}</p>
            <p className="text-xs text-gray-500">Active Exams</p>
          </div>
        </div>

        {/* Exams List - Row Based */}
        {exams.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Exams Yet</h3>
              <p className="text-gray-500 text-sm mb-4">Create your first exam category to get started</p>
              <Button onClick={openCreateDialog} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Exam Name</span>
              <span>Description</span>
              <span>Status</span>
              <span>Created</span>
              <span className="text-center">Actions</span>
            </div>

            <div className="divide-y divide-gray-100">
              {exams.map(exam => (
                <div key={exam.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Desktop Row */}
                  <div className="hidden md:grid md:grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-4 py-3 items-center">
                    {/* Exam Name & Icon */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${exam.is_active
                        ? "bg-gradient-to-br from-emerald-100 to-teal-100"
                        : "bg-gray-100"
                        }`}>
                        <BookOpen className={`w-5 h-5 ${exam.is_active ? "text-emerald-600" : "text-gray-400"}`} />
                      </div>
                      <p className="font-medium text-gray-900 truncate">{exam.name}</p>
                    </div>

                    {/* Description */}
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500 truncate">{exam.description || "—"}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-2 py-0.5 ${exam.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {exam.is_active ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </div>

                    {/* Created Date */}
                    <div className="text-sm text-gray-600">
                      {new Date(exam.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-emerald-50">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl min-w-[180px]">
                          <DropdownMenuItem onClick={() => openEditDialog(exam)} className="gap-2">
                            <Pencil className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(exam)} className="gap-2">
                            {exam.is_active ? (
                              <>
                                <PowerOff className="w-4 h-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleLandingVisibility(exam.id, exam.name)}
                            className={`gap-2 ${landingVisibility[exam.id] ? "text-emerald-600" : ""}`}
                          >
                            {landingVisibility[exam.id] ? (
                              <>
                                <Eye className="w-4 h-4" />
                                On Landing ✓
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4" />
                                Show on Landing
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteExam(exam.id)}
                            className="gap-2 text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Mobile Row */}
                  <div className="md:hidden p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${exam.is_active
                        ? "bg-gradient-to-br from-emerald-100 to-teal-100"
                        : "bg-gray-100"
                        }`}>
                        <BookOpen className={`w-5 h-5 ${exam.is_active ? "text-emerald-600" : "text-gray-400"}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate text-sm">{exam.name}</p>
                          <Badge
                            variant="secondary"
                            className={`text-[9px] px-1.5 py-0 shrink-0 ${exam.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                              }`}
                          >
                            {exam.is_active ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </div>
                        {exam.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{exam.description}</p>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-emerald-50 shrink-0">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl min-w-[180px]">
                          <DropdownMenuItem onClick={() => openEditDialog(exam)} className="gap-2">
                            <Pencil className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(exam)} className="gap-2">
                            {exam.is_active ? (
                              <>
                                <PowerOff className="w-4 h-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleLandingVisibility(exam.id, exam.name)}
                            className={`gap-2 ${landingVisibility[exam.id] ? "text-emerald-600" : ""}`}
                          >
                            {landingVisibility[exam.id] ? (
                              <>
                                <Eye className="w-4 h-4" />
                                On Landing ✓
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4" />
                                Show on Landing
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteExam(exam.id)}
                            className="gap-2 text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default ExamManagement;