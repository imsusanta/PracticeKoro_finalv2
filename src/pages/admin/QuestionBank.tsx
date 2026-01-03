import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileQuestion, Search, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, CheckSquare, Square, MoreVertical, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminLayout from "@/components/admin/AdminLayout";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  subject: string | null;
  topic: string | null;
  exam_id: string;
  exams?: { name: string };
}

interface Exam {
  id: string;
  name: string;
}

const QuestionBank = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterExam, setFilterExam] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    subject: "",
    topic: "",
  });

  const [formData, setFormData] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    subject: "",
    topic: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterExam, filterSubject, filterTopic, questions]);

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
    await loadQuestions();
    setLoading(false);
  };

  const loadExams = async () => {
    const { data } = await supabase.from("exams").select("id, name").eq("is_active", true).order("name");
    if (data) setExams(data);
  };

  const loadQuestions = async () => {
    const { data, error } = await supabase.from("questions").select("*, exams(name)").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: "Failed to load questions", variant: "destructive" });
      return;
    }
    setQuestions(data || []);
  };

  const applyFilters = () => {
    let filtered = [...questions];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((q) =>
        q.question_text.toLowerCase().includes(query) ||
        (q.subject?.toLowerCase() || "").includes(query) ||
        (q.topic?.toLowerCase() || "").includes(query)
      );
    }
    if (filterExam !== "all") {
      filtered = filtered.filter((q) => q.exam_id === filterExam);
    }
    if (filterSubject !== "all") {
      filtered = filtered.filter((q) => q.subject === filterSubject);
    }
    if (filterTopic !== "all") {
      filtered = filtered.filter((q) => q.topic === filterTopic);
    }
    setFilteredQuestions(filtered);
    setCurrentPage(1);
  };

  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      subject: question.subject || "",
      topic: question.topic || "",
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedQuestion) return;
    const { error } = await supabase.from("questions").update({
      question_text: formData.question_text,
      option_a: formData.option_a,
      option_b: formData.option_b,
      option_c: formData.option_c,
      option_d: formData.option_d,
      correct_answer: formData.correct_answer,
      subject: formData.subject || null,
      topic: formData.topic || null,
    }).eq("id", selectedQuestion.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update question", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Question updated successfully" });
    setEditOpen(false);
    setSelectedQuestion(null);
    await loadQuestions();
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", questionId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete question", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Question deleted successfully" });
    await loadQuestions();
  };

  const viewDetails = (question: Question) => {
    setSelectedQuestion(question);
    setDetailsOpen(true);
  };

  const subjects = Array.from(new Set(questions.map(q => q.subject).filter(Boolean)));
  const topics = Array.from(new Set(questions.map(q => q.topic).filter(Boolean)));

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
    }
  };

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleRangeSelect = () => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);
    if (isNaN(start) || isNaN(end) || start < 1 || end > filteredQuestions.length || start > end) {
      toast({ title: "Invalid Range", description: `Enter valid numbers between 1 and ${filteredQuestions.length}`, variant: "destructive" });
      return;
    }
    const rangeIds = filteredQuestions.slice(start - 1, end).map(q => q.id);
    setSelectedQuestions(prev => {
      const newSelection = new Set([...prev, ...rangeIds]);
      return Array.from(newSelection);
    });
    toast({ title: "Range Selected", description: `Selected questions ${start} to ${end}` });
  };

  const clearSelection = () => {
    setSelectedQuestions([]);
    setRangeStart("");
    setRangeEnd("");
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return;

    const { error } = await supabase.from("questions").delete().in("id", selectedQuestions);
    if (error) {
      toast({ title: "Error", description: "Failed to delete questions", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: `Deleted ${selectedQuestions.length} questions` });
    setBulkDeleteOpen(false);
    setSelectedQuestions([]);
    await loadQuestions();
  };

  const handleBulkEdit = async () => {
    if (selectedQuestions.length === 0) return;
    if (!bulkEditData.subject && !bulkEditData.topic) {
      toast({ title: "Error", description: "Enter at least Subject or Topic to update", variant: "destructive" });
      return;
    }

    const updateData: { subject?: string; topic?: string } = {};
    if (bulkEditData.subject) updateData.subject = bulkEditData.subject;
    if (bulkEditData.topic) updateData.topic = bulkEditData.topic;

    const { error } = await supabase.from("questions").update(updateData).in("id", selectedQuestions);
    if (error) {
      toast({ title: "Error", description: "Failed to update questions", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: `Updated ${selectedQuestions.length} questions` });
    setBulkEditOpen(false);
    setBulkEditData({ subject: "", topic: "" });
    setSelectedQuestions([]);
    await loadQuestions();
  };

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  const AddButton = (
    <Button
      onClick={() => navigate("/admin/add-question")}
      size="icon"
      className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border border-white/20"
    >
      <Plus className="w-5 h-5" />
    </Button>
  );

  if (loading) {
    return (
      <AdminLayout title="Question Bank" subtitle="Manage questions">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-emerald-600 text-sm">Loading questions...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Question Bank" subtitle={`${questions.length} questions`} headerActions={AddButton}>
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm min-w-[120px] md:min-w-0">
            <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Questions</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm min-w-[120px] md:min-w-0">
            <p className="text-2xl font-bold text-emerald-600">{subjects.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Subjects</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm min-w-[120px] md:min-w-0">
            <p className="text-2xl font-bold text-teal-600">{exams.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Exams</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3">
          <div className="relative flex-1 lg:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-white border-gray-200"
            />
          </div>
          <div className="grid grid-cols-3 lg:flex gap-2">
            <Select value={filterExam} onValueChange={setFilterExam}>
              <SelectTrigger className="h-12 rounded-xl flex-1 lg:w-[140px]">
                <SelectValue placeholder="Exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="h-12 rounded-xl flex-1 lg:w-[140px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject || ""}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTopic} onValueChange={setFilterTopic}>
              <SelectTrigger className="h-12 rounded-xl flex-1 lg:w-[140px]">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic} value={topic || ""}>{topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selection Tools */}
        {filteredQuestions.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="gap-2 rounded-xl"
              >
                {selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select All ({filteredQuestions.length})
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Range:</span>
                <Input
                  type="number"
                  placeholder="From"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="w-16 h-9 rounded-lg"
                  min="1"
                  max={filteredQuestions.length}
                />
                <span className="text-sm text-gray-500">to</span>
                <Input
                  type="number"
                  placeholder="To"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="w-16 h-9 rounded-lg"
                  min="1"
                  max={filteredQuestions.length}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRangeSelect}
                  disabled={!rangeStart || !rangeEnd}
                  className="rounded-lg"
                >
                  Select Range
                </Button>
              </div>

              {selectedQuestions.length > 0 && (
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    {selectedQuestions.length} selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkEditData({ subject: "", topic: "" });
                      setBulkEditOpen(true);
                    }}
                    className="rounded-lg gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Subject/Topic
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkDeleteOpen(true)}
                    className="rounded-lg gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection} className="text-gray-500">
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Questions List - Row Based */}
        {filteredQuestions.length === 0 ? (
          <Card className="border-0 bg-white rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <FileQuestion className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Questions Found</h3>
              <p className="text-gray-500 text-sm mb-4">
                {searchQuery || filterExam !== "all" || filterSubject !== "all" || filterTopic !== "all"
                  ? "Try adjusting your filters"
                  : "Start by adding questions to your question bank"}
              </p>
              <Button onClick={() => navigate("/admin/add-question")} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-white rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[40px_3fr_1fr_1fr_80px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span></span>
              <span>Question</span>
              <span>Subject/Topic</span>
              <span>Answer</span>
              <span className="text-center">Actions</span>
            </div>

            <div className="divide-y divide-gray-100">
              {currentQuestions.map((question, index) => {
                const isSelected = selectedQuestions.includes(question.id);
                return (
                  <div key={question.id} className={`transition-colors ${isSelected ? "bg-emerald-50" : "hover:bg-gray-50/50"}`}>
                    {/* Desktop Row */}
                    <div className="hidden md:grid md:grid-cols-[40px_3fr_1fr_1fr_80px] gap-4 px-4 py-3 items-start">
                      {/* Checkbox */}
                      <div className="flex items-center pt-0.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectQuestion(question.id)}
                        />
                      </div>

                      {/* Question */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-400">Q{indexOfFirstQuestion + index + 1}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{question.exams?.name || "Unknown"}</Badge>
                        </div>
                        <p className="text-sm text-gray-800 line-clamp-2">{question.question_text}</p>
                      </div>

                      {/* Subject/Topic */}
                      <div className="flex flex-col gap-1">
                        {question.subject && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 w-fit bg-blue-100 text-blue-700">{question.subject}</Badge>
                        )}
                        {question.topic && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 w-fit">{question.topic}</Badge>
                        )}
                      </div>

                      {/* Answer */}
                      <div>
                        <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5">{question.correct_answer}</Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-emerald-50">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl min-w-[160px]">
                            <DropdownMenuItem onClick={() => viewDetails(question)} className="gap-2">
                              <Eye className="w-4 h-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(question)} className="gap-2">
                              <Pencil className="w-4 h-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(question.id)} className="gap-2 text-red-600 focus:text-red-600">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Mobile Row */}
                    <div className="md:hidden p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectQuestion(question.id)}
                          className="mt-1"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-medium text-gray-400">Q{indexOfFirstQuestion + index + 1}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0">{question.exams?.name}</Badge>
                            {question.subject && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700">{question.subject}</Badge>
                            )}
                            <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0">{question.correct_answer}</Badge>
                          </div>
                          <p className="text-sm text-gray-800 line-clamp-2">{question.question_text}</p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-emerald-50 shrink-0">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl min-w-[160px]">
                            <DropdownMenuItem onClick={() => viewDetails(question)} className="gap-2">
                              <Eye className="w-4 h-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(question)} className="gap-2">
                              <Pencil className="w-4 h-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(question.id)} className="gap-2 text-red-600 focus:text-red-600">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Edit Question Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update question details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question Text *</Label>
              <Textarea
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                rows={3}
                className="rounded-xl mt-1"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Option A *</Label>
                <Input value={formData.option_a} onChange={(e) => setFormData({ ...formData, option_a: e.target.value })} className="h-12 rounded-xl mt-1" />
              </div>
              <div className="space-y-2">
                <Label>Option B *</Label>
                <Input value={formData.option_b} onChange={(e) => setFormData({ ...formData, option_b: e.target.value })} className="h-12 rounded-xl mt-1" />
              </div>
              <div className="space-y-2">
                <Label>Option C *</Label>
                <Input value={formData.option_a} onChange={(e) => setFormData({ ...formData, option_c: e.target.value })} className="h-12 rounded-xl mt-1" />
              </div>
              <div className="space-y-2">
                <Label>Option D *</Label>
                <Input value={formData.option_d} onChange={(e) => setFormData({ ...formData, option_d: e.target.value })} className="h-12 rounded-xl mt-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Correct Answer *</Label>
              <Select value={formData.correct_answer} onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}>
                <SelectTrigger className="h-12 rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Mathematics" className="h-12 rounded-xl mt-1" />
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} placeholder="e.g., Algebra" className="h-12 rounded-xl mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl h-12 flex-1 sm:flex-none">Cancel</Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.question_text || !formData.option_a || !formData.option_b || !formData.option_c || !formData.option_d}
              className="rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-teal-600 flex-1 sm:flex-none"
            >
              Update Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500 text-xs">Question</Label>
                <p className="text-sm mt-1">{selectedQuestion.question_text}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-500 text-xs">Options</Label>
                <div className="space-y-1.5">
                  <p className={`text-sm p-2 rounded-lg ${selectedQuestion.correct_answer === "A" ? "bg-emerald-100 text-emerald-700 font-medium" : "bg-gray-50"}`}>
                    A. {selectedQuestion.option_a}
                  </p>
                  <p className={`text-sm p-2 rounded-lg ${selectedQuestion.correct_answer === "B" ? "bg-emerald-100 text-emerald-700 font-medium" : "bg-gray-50"}`}>
                    B. {selectedQuestion.option_b}
                  </p>
                  <p className={`text-sm p-2 rounded-lg ${selectedQuestion.correct_answer === "C" ? "bg-emerald-100 text-emerald-700 font-medium" : "bg-gray-50"}`}>
                    C. {selectedQuestion.option_c}
                  </p>
                  <p className={`text-sm p-2 rounded-lg ${selectedQuestion.correct_answer === "D" ? "bg-emerald-100 text-emerald-700 font-medium" : "bg-gray-50"}`}>
                    D. {selectedQuestion.option_d}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-gray-500 text-xs">Correct Answer</Label>
                  <Badge className="mt-1 bg-emerald-500">{selectedQuestion.correct_answer}</Badge>
                </div>
                {selectedQuestion.subject && (
                  <div>
                    <Label className="text-gray-500 text-xs">Subject</Label>
                    <p className="text-sm mt-1">{selectedQuestion.subject}</p>
                  </div>
                )}
                {selectedQuestion.topic && (
                  <div>
                    <Label className="text-gray-500 text-xs">Topic</Label>
                    <p className="text-sm mt-1">{selectedQuestion.topic}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="rounded-xl">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete {selectedQuestions.length} Questions</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedQuestions.length} selected questions? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} className="rounded-xl">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Subject/Topic Dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subject/Topic</DialogTitle>
            <DialogDescription>
              Update subject and/or topic for {selectedQuestions.length} selected questions. Leave empty to keep existing value.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New Subject</Label>
              <Input
                value={bulkEditData.subject}
                onChange={(e) => setBulkEditData({ ...bulkEditData, subject: e.target.value })}
                placeholder="e.g., Mathematics, History"
                className="h-12 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>New Topic</Label>
              <Input
                value={bulkEditData.topic}
                onChange={(e) => setBulkEditData({ ...bulkEditData, topic: e.target.value })}
                placeholder="e.g., Algebra, Indian Independence"
                className="h-12 rounded-xl mt-1"
              />
            </div>
            <p className="text-xs text-gray-500">Enter at least one field to update</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkEditOpen(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={handleBulkEdit}
              disabled={!bulkEditData.subject && !bulkEditData.topic}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Update {selectedQuestions.length} Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default QuestionBank;
