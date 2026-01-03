import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";

interface Exam {
  id: string;
  name: string;
}

interface GeneratedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string;
}

const AIQuestionGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    exam_id: "",
    subject: "",
    topic: "",
    count: 5,
    language: "English",
    systemPrompt: "",
  });

  useEffect(() => {
    const initPage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      // Run role check and data loading in parallel
      const [roleResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle(),
        loadExams()
      ]);

      if (!roleResult.data) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges",
          variant: "destructive",
        });
        navigate("/admin/login");
        return;
      }

      setLoading(false);
    };
    initPage();
  }, [navigate, toast]);

  const loadExams = async () => {
    const { data } = await supabase
      .from("exams")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    if (data) setExams(data);
  };

  const handleGenerate = async () => {
    if (!formData.subject && !formData.topic) {
      toast({
        title: "Error",
        description: "Please enter at least a Subject or Topic to generate questions",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setGeneratedQuestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: {
          subject: formData.subject,
          topic: formData.topic,
          count: formData.count,
          language: formData.language,
          systemPrompt: formData.systemPrompt || undefined,
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        setGenerating(false);
        return;
      }

      const questions = data.questions;
      setGeneratedQuestions(questions);
      setSelectedQuestions(questions.map((_: any, index: number) => index));

      toast({
        title: "Success",
        description: `Generated ${questions.length} questions successfully`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    }

    setGenerating(false);
  };

  const handleSave = async () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one question to save",
        variant: "destructive",
      });
      return;
    }

    const saveExamId = formData.exam_id;
    const saveSubject = formData.subject;
    const saveTopic = formData.topic;

    if (!saveExamId && !saveSubject && !saveTopic) {
      toast({
        title: "Error",
        description: "Please provide at least one of: Exam Category, Subject, or Topic",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setSaving(true);

    const selectedQuestionsData = selectedQuestions.map(index => generatedQuestions[index]);
    const questionsToInsert = selectedQuestionsData.map(q => ({
      exam_id: saveExamId || null,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      subject: saveSubject || null,
      topic: saveTopic || null,
      explanation: q.explanation || null,
      created_by: session.user.id,
    }));

    const { error } = await supabase.from("questions").insert(questionsToInsert);

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save questions",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Saved ${selectedQuestions.length} questions to question bank`,
    });

    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    setFormData({
      exam_id: "",
      subject: "",
      topic: "",
      count: 5,
      language: "English",
      systemPrompt: "",
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(generatedQuestions.map((_, index) => index));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleToggleQuestion = (index: number) => {
    setSelectedQuestions(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  if (loading) {
    return (
      <AdminLayout title="AI Question Generator" subtitle="Generate questions with AI">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-emerald-700 font-medium">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="AI Question Generator" subtitle="Generate questions with AI">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Generate Questions with AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <h4 className="text-sm font-semibold mb-2 text-emerald-800">💡 How to Generate Quality Questions:</h4>
              <ul className="text-xs text-emerald-700 space-y-1 list-disc list-inside">
                <li>Be specific with Subject and Topic (e.g., "Biology" + "Cell Structure")</li>
                <li>Choose appropriate language for your target audience</li>
                <li>Start with fewer questions (5-10) to review quality before generating more</li>
                <li>All generated questions include detailed explanations and short notes</li>
                <li>Review and select an Exam Category before saving to Question Bank</li>
              </ul>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Subject <span className="text-gray-400 text-xs">(Req. Subj OR Topic)</span>
                  </Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., History, Science"
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Topic <span className="text-gray-400 text-xs">(Req. Subj OR Topic)</span>
                  </Label>
                  <Input
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., Indian Independence"
                    className="rounded-xl h-12"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Language</Label>
                <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bengali">Bengali</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Number of Questions</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.count}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setFormData({ ...formData, count: Math.min(Math.max(value, 1), 50) });
                  }}
                  placeholder="Enter number (1-50)"
                  className="rounded-xl"
                />
                <p className="text-xs text-gray-400 mt-1">Enter any number between 1 and 50</p>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  System Prompt <span className="text-gray-400 text-xs">(Optional - Custom Instructions)</span>
                </Label>
                <Textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  placeholder="e.g., Focus on competitive exam patterns, include numerical problems, make questions tricky with close options, use real-world examples..."
                  className="rounded-xl min-h-[80px] mt-1"
                  rows={3}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Provide additional instructions to guide AI in generating better quality questions
                </p>
              </div>

              <Button onClick={handleGenerate} disabled={generating} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                <Sparkles className="w-4 h-4 mr-2" />
                {generating ? "Generating..." : "Generate Questions"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {generatedQuestions.length > 0 && (
          <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Generated Questions ({generatedQuestions.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedQuestions.length === generatedQuestions.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select All ({selectedQuestions.length}/{generatedQuestions.length})
                  </Label>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border">
                  <p className="text-sm mb-3 font-medium">
                    Save to: (choose at least one)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Exam Category <span className="text-gray-400 text-xs">(Opt.)</span></Label>
                      <Select value={formData.exam_id} onValueChange={(value) => setFormData({ ...formData, exam_id: value })}>
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Select exam" />
                        </SelectTrigger>
                        <SelectContent>
                          {exams.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id}>
                              {exam.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Subject <span className="text-gray-400 text-xs">(Opt.)</span></Label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g., History"
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Topic <span className="text-gray-400 text-xs">(Opt.)</span></Label>
                      <Input
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        placeholder="e.g., Independence"
                        className="rounded-xl h-12"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={saving || selectedQuestions.length === 0} className="mt-4 w-full md:w-auto rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : `Save Selected Questions (${selectedQuestions.length})`}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {generatedQuestions.map((q, index) => (
                  <Card key={index} className={`p-4 rounded-xl ${selectedQuestions.includes(index) ? 'border-emerald-500 bg-emerald-50/50' : ''}`}>
                    <div className="flex gap-2 mb-2 items-center">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(index)}
                        onChange={() => handleToggleQuestion(index)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Badge className="bg-emerald-100 text-emerald-700">Q{index + 1}</Badge>
                      <Badge variant="secondary">Answer: {q.correct_answer}</Badge>
                    </div>
                    <p className="font-medium mb-2">{q.question_text}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className={q.correct_answer === "A" ? "text-emerald-600 font-medium" : ""}>
                        A. {q.option_a}
                      </div>
                      <div className={q.correct_answer === "B" ? "text-emerald-600 font-medium" : ""}>
                        B. {q.option_b}
                      </div>
                      <div className={q.correct_answer === "C" ? "text-emerald-600 font-medium" : ""}>
                        C. {q.option_c}
                      </div>
                      <div className={q.correct_answer === "D" ? "text-emerald-600 font-medium" : ""}>
                        D. {q.option_d}
                      </div>
                    </div>
                    {q.explanation && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl border">
                        <span className="font-semibold text-sm">Short Notes:</span>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{q.explanation}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AIQuestionGenerator;

