import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Plus, Pencil, Trash2, Power, PowerOff, MoreVertical, Clock, Target, Search, Eye, EyeOff, Bell, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminLayout from "@/components/admin/AdminLayout";
import { isTestVisibleOnLanding, toggleTestLandingVisibility } from "@/config/landingVisibility";
import { addNotification, sendBrowserNotification } from "@/config/notifications";

interface MockTest {
  id: string;
  title: string;
  description: string | null;
  test_type: string;
  duration_minutes: number;
  passing_marks: number;
  total_marks: number;
  is_published: boolean;
  exam_id: string;
  exams?: { name: string };
  created_at: string;
}

interface Exam {
  id: string;
  name: string;
}

interface Question {
  id: string;
  question_text: string;
  subject: string | null;
  topic: string | null;
}

const MockTestCreation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  // Filters for tests list
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [testFilterExam, setTestFilterExam] = useState<string>("all");
  const [testFilterStatus, setTestFilterStatus] = useState<string>("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    exam_id: "",
    test_type: "full_mock",
    duration_minutes: 60,
    passing_marks: 40,
    marks_per_question: 1
  });
  const [landingVisibility, setLandingVisibility] = useState<{ [key: string]: boolean }>({});

  // Refresh landing visibility state
  const refreshLandingVisibility = () => {
    const visibility: { [key: string]: boolean } = {};
    tests.forEach(test => {
      visibility[test.id] = isTestVisibleOnLanding(test.id);
    });
    setLandingVisibility(visibility);
  };

  const handleToggleLandingVisibility = (testId: string, testTitle: string) => {
    const newValue = toggleTestLandingVisibility(testId);
    setLandingVisibility(prev => ({ ...prev, [testId]: newValue }));
    toast({
      title: newValue ? "Visible on Landing" : "Hidden from Landing",
      description: `"${testTitle}" ${newValue ? "will now show" : "is now hidden"} on landing page for visitors`,
    });
  };

  const handleSendNotification = async (test: MockTest) => {
    // Add to in-app notifications
    addNotification({
      title: "🆕 New Mock Test Available!",
      message: `${test.title} is now available. Duration: ${test.duration_minutes} mins, Total Marks: ${test.total_marks}. Start practicing now!`,
      testId: test.id,
      testTitle: test.title,
      type: "new_test",
    });

    // Try to send browser notification (works if admin has given permission)
    await sendBrowserNotification(
      "New Mock Test Available!",
      `${test.title} - ${test.duration_minutes} mins, ${test.total_marks} marks`
    );

    toast({
      title: "✅ Notification Sent!",
      description: `Notification for "${test.title}" has been sent to all students.`,
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
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      await supabase.auth.signOut();
      toast({ title: "Access Denied", description: "You do not have admin privileges", variant: "destructive" });
      navigate("/admin/login");
      return;
    }
    await loadExams();
    await loadTests();
    setLoading(false);
  };

  useEffect(() => {
    refreshLandingVisibility();
  }, [tests]);

  const loadExams = async () => {
    const { data } = await supabase.from("exams").select("id, name").eq("is_active", true).order("name");
    if (data) setExams(data);
  };

  const loadTests = async () => {
    const { data, error } = await supabase.from("mock_tests").select("*, exams(name)").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: "Failed to load tests", variant: "destructive" });
      return;
    }
    setTests(data || []);
  };

  const loadQuestions = async (examId: string) => {
    const { data } = await supabase.from("questions").select("id, question_text, subject, topic").eq("exam_id", examId).order("created_at", { ascending: false });
    if (data) setQuestions(data);
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = !searchQuery || q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === "all" || q.subject === filterSubject;
    const matchesTopic = filterTopic === "all" || q.topic === filterTopic;
    return matchesSearch && matchesSubject && matchesTopic;
  });

  const subjects = Array.from(new Set(questions.map(q => q.subject).filter(Boolean)));
  const topics = Array.from(new Set(questions.map(q => q.topic).filter(Boolean)));

  // Filter tests list
  const filteredTests = tests.filter(test => {
    const matchesSearch = !testSearchQuery ||
      test.title.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
      (test.description || "").toLowerCase().includes(testSearchQuery.toLowerCase());
    const matchesExam = testFilterExam === "all" || test.exam_id === testFilterExam;
    const matchesStatus = testFilterStatus === "all" ||
      (testFilterStatus === "published" && test.is_published) ||
      (testFilterStatus === "draft" && !test.is_published);
    return matchesSearch && matchesExam && matchesStatus;
  });

  const handleCreateTest = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const totalMarks = selectedQuestions.length * formData.marks_per_question;
    const { data, error } = await supabase.from("mock_tests").insert([{
      title: formData.title,
      description: formData.description || null,
      exam_id: formData.exam_id,
      test_type: formData.test_type as "full_mock" | "topic_wise",
      duration_minutes: formData.duration_minutes,
      passing_marks: formData.passing_marks,
      total_marks: totalMarks,
      is_published: false,
      created_by: session.user.id
    }]).select().single();

    if (error || !data) {
      toast({ title: "Error", description: "Failed to create test", variant: "destructive" });
      return;
    }

    const testQuestions = selectedQuestions.map((questionId, index) => ({
      test_id: data.id,
      question_id: questionId,
      question_order: index + 1,
      marks: formData.marks_per_question
    }));

    const { error: questionsError } = await supabase.from("test_questions").insert(testQuestions);
    if (questionsError) {
      toast({ title: "Error", description: "Failed to add questions to test", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Test created successfully" });
    setDialogOpen(false);
    setQuestionDialogOpen(false);
    setFormData({ title: "", description: "", exam_id: "", test_type: "full_mock", duration_minutes: 60, passing_marks: 40, marks_per_question: 1 });
    setSelectedQuestions([]);
    await loadTests();
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    const { error } = await supabase.from("mock_tests").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete test", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Test deleted successfully" });
    await loadTests();
  };

  const handleTogglePublish = async (test: MockTest) => {
    const { error } = await supabase.from("mock_tests").update({ is_published: !test.is_published }).eq("id", test.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update test", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: test.is_published ? "Test unpublished" : "Test published" });
    await loadTests();
  };

  const openCreateDialog = () => {
    setEditingTest(null);
    setFormData({ title: "", description: "", exam_id: "", test_type: "full_mock", duration_minutes: 60, passing_marks: 40, marks_per_question: 1 });
    setSelectedQuestions([]);
    setDialogOpen(true);
  };

  const proceedToQuestionSelection = async () => {
    if (!formData.exam_id) {
      toast({ title: "Error", description: "Please select an exam", variant: "destructive" });
      return;
    }
    await loadQuestions(formData.exam_id);
    setSearchQuery("");
    setFilterSubject("all");
    setFilterTopic("all");
    setDialogOpen(false);
    setQuestionDialogOpen(true);
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]);
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
    }
  };

  const openEditDialog = (test: MockTest) => {
    setEditingTest(test);
    setFormData({
      title: test.title,
      description: test.description || "",
      exam_id: test.exam_id,
      test_type: test.test_type,
      duration_minutes: test.duration_minutes,
      passing_marks: test.passing_marks,
      marks_per_question: 1
    });
    setDialogOpen(true);
  };

  const handleUpdateTest = async () => {
    if (!editingTest) return;
    const { error } = await supabase.from("mock_tests").update({
      title: formData.title,
      description: formData.description || null,
      test_type: formData.test_type as "full_mock" | "topic_wise",
      duration_minutes: formData.duration_minutes,
      passing_marks: formData.passing_marks
    }).eq("id", editingTest.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update test", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Test updated successfully" });
    setDialogOpen(false);
    setEditingTest(null);
    await loadTests();
  };

  const CreateButton = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={openCreateDialog}
          size="icon"
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border border-white/20"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[500px] max-h-[650px] overflow-y-auto mx-4 rounded-2xl border-white/40 shadow-xl">
        <DialogHeader>
          <DialogTitle>{editingTest ? "Edit Test" : "Create New Test"}</DialogTitle>
          <DialogDescription>{editingTest ? "Update test details" : "Fill in test details"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., UPSC Mock Test 1" className="h-12 rounded-xl mt-1" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="rounded-xl mt-1" />
          </div>
          <div className="space-y-2">
            <Label>Exam Category *</Label>
            <Select value={formData.exam_id} onValueChange={value => setFormData({ ...formData, exam_id: value })}>
              <SelectTrigger className="h-12 rounded-xl mt-1">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Test Type *</Label>
            <Select value={formData.test_type} onValueChange={value => setFormData({ ...formData, test_type: value })}>
              <SelectTrigger className="h-12 rounded-xl mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_mock">Full Mock Test</SelectItem>
                <SelectItem value="topic_wise">Topic-wise Test</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (min) *</Label>
              <Input type="number" value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl mt-1" />
            </div>
            <div className="space-y-2">
              <Label>Passing Marks *</Label>
              <Input type="number" value={formData.passing_marks} onChange={e => setFormData({ ...formData, passing_marks: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl mt-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Marks per Question *</Label>
            <Input type="number" value={formData.marks_per_question} onChange={e => setFormData({ ...formData, marks_per_question: parseInt(e.target.value) || 1 })} className="h-12 rounded-xl mt-1" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingTest(null); }} className="rounded-xl h-12 flex-1 sm:flex-none">Cancel</Button>
          {editingTest ? (
            <Button onClick={handleUpdateTest} disabled={!formData.title} className="rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-teal-600 flex-1 sm:flex-none">Update Test</Button>
          ) : (
            <Button onClick={proceedToQuestionSelection} disabled={!formData.title || !formData.exam_id} className="rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-teal-600 flex-1 sm:flex-none">Next: Select Que.</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <AdminLayout title="Mock Test Creation" subtitle="Manage mock tests">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-emerald-600 text-sm">Loading tests...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Mock Test Creation" subtitle={`${tests.length} tests`} headerActions={CreateButton}>
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-4">
          <button
            onClick={() => setTestFilterStatus("all")}
            className={`flex-1 min-w-[120px] bg-white rounded-2xl p-4 border shadow-sm transition-all ${testFilterStatus === "all" ? "border-emerald-500 ring-2 ring-emerald-200" : "border-gray-100 hover:border-emerald-200"}`}
          >
            <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Tests</p>
          </button>
          <button
            onClick={() => setTestFilterStatus("published")}
            className={`flex-1 min-w-[120px] bg-white rounded-2xl p-4 border shadow-sm transition-all ${testFilterStatus === "published" ? "border-emerald-500 ring-2 ring-emerald-200" : "border-gray-100 hover:border-emerald-200"}`}
          >
            <p className="text-2xl font-bold text-emerald-600">{tests.filter(t => t.is_published).length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Published</p>
          </button>
          <button
            onClick={() => setTestFilterStatus("draft")}
            className={`flex-1 min-w-[120px] bg-white rounded-2xl p-4 border shadow-sm transition-all ${testFilterStatus === "draft" ? "border-amber-500 ring-2 ring-amber-200" : "border-gray-100 hover:border-amber-200"}`}
          >
            <p className="text-2xl font-bold text-amber-600">{tests.filter(t => !t.is_published).length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Drafts</p>
          </button>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3">
          <div className="flex-1 lg:min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tests..."
              value={testSearchQuery}
              onChange={e => setTestSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-white border-gray-200"
            />
          </div>
          <Select value={testFilterExam} onValueChange={setTestFilterExam}>
            <SelectTrigger className="h-12 rounded-xl bg-white lg:w-[180px]">
              <SelectValue placeholder="All Exams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              {exams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tests List - Row Based */}
        {tests.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <BarChart className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Tests Yet</h3>
              <p className="text-gray-500 text-sm mb-4">Create your first mock test</p>
              <Button onClick={openCreateDialog} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            </CardContent>
          </Card>
        ) : filteredTests.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Tests Found</h3>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={() => { setTestSearchQuery(""); setTestFilterExam("all"); setTestFilterStatus("all"); }} className="rounded-xl">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Test Name</span>
              <span>Exam</span>
              <span>Duration</span>
              <span>Marks</span>
              <span>Status</span>
              <span className="text-center">Actions</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredTests.map(test => (
                <div key={test.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Desktop Row */}
                  <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-4 py-3 items-center">
                    {/* Test Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${test.is_published
                        ? "bg-gradient-to-br from-emerald-100 to-teal-100"
                        : "bg-gray-100"
                        }`}>
                        <BarChart className={`w-5 h-5 ${test.is_published ? "text-emerald-600" : "text-gray-400"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{test.title}</p>
                        {test.description && <p className="text-xs text-gray-500 truncate">{test.description}</p>}
                      </div>
                    </div>

                    {/* Exam */}
                    <div>
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-gray-100">
                        {test.exams?.name || "—"}
                      </Badge>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {test.duration_minutes} min
                    </div>

                    {/* Marks */}
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Target className="w-3.5 h-3.5 text-gray-400" />
                      {test.total_marks} ({test.passing_marks} pass)
                    </div>

                    {/* Status */}
                    <div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-2 py-0.5 ${test.is_published
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                          }`}
                      >
                        {test.is_published ? "PUBLISHED" : "DRAFT"}
                      </Badge>
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
                          <DropdownMenuItem onClick={() => openEditDialog(test)} className="gap-2">
                            <Pencil className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(test)} className="gap-2">
                            {test.is_published ? (
                              <>
                                <PowerOff className="w-4 h-4" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleLandingVisibility(test.id, test.title)}
                            className={`gap-2 ${landingVisibility[test.id] ? "text-emerald-600" : ""}`}
                          >
                            {landingVisibility[test.id] ? (
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
                          <DropdownMenuItem
                            onClick={() => handleSendNotification(test)}
                            className="gap-2 text-blue-600"
                          >
                            <Bell className="w-4 h-4" />
                            Send Notification
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteTest(test.id)} className="gap-2 text-red-600 focus:text-red-600">
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${test.is_published
                        ? "bg-gradient-to-br from-emerald-100 to-teal-100"
                        : "bg-gray-100"
                        }`}>
                        <BarChart className={`w-5 h-5 ${test.is_published ? "text-emerald-600" : "text-gray-400"}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate text-sm">{test.title}</p>
                          <Badge
                            variant="secondary"
                            className={`text-[9px] px-1.5 py-0 shrink-0 ${test.is_published
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                              }`}
                          >
                            {test.is_published ? "PUB" : "DRAFT"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <span>{test.exams?.name}</span>
                          <span>•</span>
                          <span>{test.duration_minutes}min</span>
                          <span>•</span>
                          <span>{test.total_marks}marks</span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-emerald-50 shrink-0">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl min-w-[180px]">
                          <DropdownMenuItem onClick={() => openEditDialog(test)} className="gap-2">
                            <Pencil className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(test)} className="gap-2">
                            {test.is_published ? (
                              <>
                                <PowerOff className="w-4 h-4" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleLandingVisibility(test.id, test.title)}
                            className={`gap-2 ${landingVisibility[test.id] ? "text-emerald-600" : ""}`}
                          >
                            {landingVisibility[test.id] ? (
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
                          <DropdownMenuItem
                            onClick={() => handleSendNotification(test)}
                            className="gap-2 text-blue-600"
                          >
                            <Bell className="w-4 h-4" />
                            Send Notification
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteTest(test.id)} className="gap-2 text-red-600 focus:text-red-600">
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

      {/* Question Selection Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-[500px] max-h-[650px] overflow-y-auto mx-4 rounded-2xl border-white/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>Select Questions ({selectedQuestions.length})</DialogTitle>
            <DialogDescription>Choose questions for this test</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search questions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-10 rounded-xl" />
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => <SelectItem key={subject} value={subject || ""}>{subject}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterTopic} onValueChange={setFilterTopic}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics.map(topic => <SelectItem key={topic} value={topic || ""}>{topic}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filteredQuestions.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl mb-3">
              <Checkbox checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0} onCheckedChange={handleSelectAll} id="select-all-q" />
              <Label htmlFor="select-all-q" className="text-sm font-medium cursor-pointer">Select All ({filteredQuestions.length})</Label>
              {selectedQuestions.length > 0 && (
                <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700">{selectedQuestions.length} selected</Badge>
              )}
            </div>
          )}

          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {filteredQuestions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {questions.length === 0 ? "No questions available for this exam. Add questions first." : "No questions match your filters."}
              </p>
            ) : filteredQuestions.map((question, index) => {
              const qId = `q-${question.id}`;
              const isSelected = selectedQuestions.includes(question.id);
              return (
                <div
                  key={question.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? "border-emerald-300 bg-emerald-50" : "border-gray-100 hover:bg-gray-50"}`}
                  onClick={() => toggleQuestionSelection(question.id)}
                >
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleQuestionSelection(question.id)} className="mt-0.5" id={qId} />
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-400">Q{index + 1}</span>
                      {question.subject && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{question.subject}</Badge>}
                      {question.topic && <Badge variant="outline" className="text-[9px] px-1.5 py-0">{question.topic}</Badge>}
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{question.question_text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => { setQuestionDialogOpen(false); setDialogOpen(true); }} className="rounded-xl h-12 flex-1 sm:flex-none">Back</Button>
            <Button onClick={handleCreateTest} disabled={selectedQuestions.length === 0} className="rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-teal-600 flex-1 sm:flex-none">
              <span className="truncate">Create ({selectedQuestions.length} Qs)</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default MockTestCreation;