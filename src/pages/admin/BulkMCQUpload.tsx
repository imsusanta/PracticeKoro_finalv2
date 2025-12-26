import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";

interface ParsedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  subject?: string;
  topic?: string;
  explanation?: string;
}

const BulkMCQUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [defaultSubject, setDefaultSubject] = useState("");
  const [defaultTopic, setDefaultTopic] = useState("");

  const exampleFormat = `1. What is the capital of India?
(a) Mumbai
(b) New Delhi
(c) Kolkata
(d) Chennai
Ans:(b) New Delhi
Short Notes: New Delhi is the capital of India and the seat of all three branches of the Government.

2. Who wrote "Romeo and Juliet"?
(a) Charles Dickens
(b) William Shakespeare
(c) Jane Austen
(d) Mark Twain
Ans:(b) William Shakespeare
Short Notes: William Shakespeare wrote Romeo and Juliet around 1594-1596.`;

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
        variant: "destructive",
      });
      navigate("/admin/login");
      return;
    }

    setLoading(false);
  };

  const parseQuestions = () => {
    const questions: ParsedQuestion[] = [];
    const blocks = bulkText.split(/\n\s*\n/);

    for (const block of blocks) {
      if (!block.trim()) continue;

      const lines = block.split('\n').map(l => l.trim()).filter(l => l);

      let question = "";
      let optionA = "";
      let optionB = "";
      let optionC = "";
      let optionD = "";
      let answer = "";
      let subject = "";
      let topic = "";
      let explanation = "";

      for (const line of lines) {
        const questionMatch = line.match(/^\d+\.\s+(.+)$/);
        if (questionMatch) {
          question = questionMatch[1].trim();
        }
        else if (line.match(/^\(a\)/i)) {
          optionA = line.substring(3).trim();
        } else if (line.match(/^\(b\)/i)) {
          optionB = line.substring(3).trim();
        } else if (line.match(/^\(c\)/i)) {
          optionC = line.substring(3).trim();
        } else if (line.match(/^\(d\)/i)) {
          optionD = line.substring(3).trim();
        }
        else if (line.toLowerCase().startsWith("ans:")) {
          const answerText = line.substring(4).trim();
          const answerMatch = answerText.match(/^\(([a-d])\)/i);
          if (answerMatch) {
            answer = answerMatch[1].toUpperCase();
          }
        }
        else if (line.toLowerCase().startsWith("short notes:")) {
          explanation = line.substring(12).trim();
        }
        else if (line.toLowerCase().startsWith("question:")) {
          question = line.substring(9).trim();
        } else if (line.startsWith("A.") || line.startsWith("A)")) {
          optionA = line.substring(2).trim();
        } else if (line.startsWith("B.") || line.startsWith("B)")) {
          optionB = line.substring(2).trim();
        } else if (line.startsWith("C.") || line.startsWith("C)")) {
          optionC = line.substring(2).trim();
        } else if (line.startsWith("D.") || line.startsWith("D)")) {
          optionD = line.substring(2).trim();
        } else if (line.toLowerCase().startsWith("answer:")) {
          const ans = line.substring(7).trim().toUpperCase();
          const match = ans.match(/^\(?([A-D])\)?/);
          if (match) {
            answer = match[1];
          }
        } else if (line.toLowerCase().startsWith("subject:")) {
          subject = line.substring(8).trim();
        } else if (line.toLowerCase().startsWith("topic:")) {
          topic = line.substring(6).trim();
        }
      }

      if (question && optionA && optionB && optionC && optionD && answer) {
        questions.push({
          question_text: question,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          correct_answer: answer,
          subject: subject || defaultSubject || "Non-Category",
          topic: topic || defaultTopic || "Non-Category",
          explanation: explanation || undefined,
        });
      }
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "No valid questions found. Please check the format.",
        variant: "destructive",
      });
      return;
    }

    setParsedQuestions(questions);
    setShowPreview(true);
    toast({
      title: "Success",
      description: `Parsed ${questions.length} questions successfully`,
    });
  };

  const handleSave = async () => {
    if (parsedQuestions.length === 0) {
      toast({
        title: "Error",
        description: "No questions to save",
        variant: "destructive",
      });
      return;
    }

    const { data: availableExams } = await supabase
      .from("exams")
      .select("id")
      .eq("is_active", true)
      .limit(1);

    if (!availableExams || availableExams.length === 0) {
      toast({
        title: "Error",
        description: "No active exams found. Please create an exam first.",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setSaving(true);

    const questionsToInsert = parsedQuestions.map(q => ({
      exam_id: availableExams[0].id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      subject: q.subject || "Non-Category",
      topic: q.topic || "Non-Category",
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
      description: `Successfully added ${parsedQuestions.length} questions to Question Bank`,
    });

    setBulkText("");
    setParsedQuestions([]);
    setShowPreview(false);
    setDefaultSubject("");
    setDefaultTopic("");
  };

  if (loading) {
    return (
      <AdminLayout title="Bulk MCQ Upload" subtitle="Upload multiple questions">
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
    <AdminLayout title="Bulk MCQ Upload" subtitle="Upload multiple questions">
      <div className="flex flex-col gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              Bulk Upload Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Default Subject (Optional)</Label>
                <Input
                  value={defaultSubject}
                  onChange={(e) => setDefaultSubject(e.target.value)}
                  placeholder="e.g., Mathematics"
                  className="h-12 rounded-xl"
                />
                <p className="text-[10px] text-gray-400 mt-1">Will be used if not specified in questions</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Default Topic (Optional)</Label>
                <Input
                  value={defaultTopic}
                  onChange={(e) => setDefaultTopic(e.target.value)}
                  placeholder="e.g., Algebra"
                  className="h-12 rounded-xl"
                />
                <p className="text-[10px] text-gray-400 mt-1">Will be used if not specified in questions</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Paste Questions (Format below)</Label>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Paste your questions here..."
                rows={15}
                className="font-mono text-sm rounded-xl"
              />
            </div>

            <div>
              <Button onClick={parseQuestions} disabled={!bulkText.trim()} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
                <Eye className="w-4 h-4 mr-2" />
                Parse & Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
          <CardHeader>
            <CardTitle>Example Format</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-xl text-sm overflow-x-auto border">
              {exampleFormat}
            </pre>
            <p className="text-sm text-gray-500 mt-2">
              Note: Questions must be numbered (1., 2., etc.). Options must use (a), (b), (c), (d) format.
              Answer line must start with "Ans:" followed by the correct option.
              Short Notes, Subject, and Topic are optional. Separate questions with an empty line.
            </p>
          </CardContent>
        </Card>

        {showPreview && parsedQuestions.length > 0 && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Preview ({parsedQuestions.length} questions)</CardTitle>
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 h-11">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : `Save All ${parsedQuestions.length} Questions`}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {parsedQuestions.map((q, index) => (
                  <Card key={index} className="p-4 rounded-xl">
                    <div className="flex gap-2 mb-2">
                      <Badge className="bg-emerald-100 text-emerald-700">Q{index + 1}</Badge>
                      {q.subject && <Badge variant="secondary">{q.subject}</Badge>}
                      {q.topic && <Badge variant="outline">{q.topic}</Badge>}
                      <Badge className="bg-emerald-600">Answer: {q.correct_answer}</Badge>
                    </div>
                    <p className="font-medium mb-2">{q.question_text}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-2">
                      <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">A. {q.option_a}</div>
                      <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">B. {q.option_b}</div>
                      <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">C. {q.option_c}</div>
                      <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">D. {q.option_d}</div>
                    </div>
                    {q.explanation && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-xl text-sm">
                        <span className="font-semibold">Short Notes: </span>
                        {q.explanation}
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

export default BulkMCQUpload;
