import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Bookmark,
  Save,
  ArrowLeft,
  Send,
  Timer,
  ListChecks,
  Zap,
  Home,
  Lock,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast as sonnerToast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  difficulty: string | null;
}

interface TestQuestion {
  id: string;
  question_id: string;
  marks: number;
  question_order: number;
  questions: Question;
}

interface MockTest {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
}

const TakeTest = () => {
  const navigate = useNavigate();
  const { testId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<MockTest | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [fiveMinuteWarningShown, setFiveMinuteWarningShown] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<Date>(new Date());

  // Anti-cheating security
  const {
    tabViolations,
    fullscreenViolations,
    isFullscreen,
    enterFullscreen
  } = useExamSecurity({
    onTabSwitch: violations => console.log('Tab violations:', violations),
    onFullscreenExit: violations => console.log('Fullscreen violations:', violations),
    maxTabViolations: 3,
    maxFullscreenViolations: 3,
    onMaxViolations: () => handleAutoSubmit()
  });

  useEffect(() => {
    loadTest();
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [testId]);

  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        if (prev === 300 && !fiveMinuteWarningShown) {
          setFiveMinuteWarningShown(true);
          sonnerToast.warning("⏰ 5 minutes remaining!", {
            description: "Review your answers and submit soon.",
            duration: 10000
          });
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, fiveMinuteWarningShown]);

  useEffect(() => {
    if (!test || !testId) return;
    autoSaveTimerRef.current = setInterval(() => autoSaveAnswers(), 30000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [answers, markedForReview, test, testId]);

  const loadTest = async () => {
    if (!testId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }



    // Check approval status
    const { data: approvalData } = await supabase.from("approval_status").select("status").eq("user_id", session.user.id).single();
    if (approvalData?.status === "payment_locked") {
      setApprovalStatus("payment_locked");
      setLoading(false);
      return;
    }

    const { data: activeAttempt } = await supabase.from("test_attempts").select("id").eq("test_id", testId).eq("user_id", session.user.id).eq("is_active", true).maybeSingle();
    if (activeAttempt) {
      toast({ title: "Test Already in Progress", description: "Complete or abandon your active attempt first.", variant: "destructive" });
      navigate("/student/exams");
      return;
    }

    const { data: testData, error: testError } = await supabase.from("mock_tests").select("*").eq("id", testId).single();
    if (testError || !testData) {
      toast({ title: "Error", description: "Test not found", variant: "destructive" });
      navigate("/student/exams");
      return;
    }

    const { data: questionsData, error: questionsError } = await supabase.from("test_questions").select(`*, questions (*)`).eq("test_id", testId).order("question_order");
    if (questionsError) {
      toast({ title: "Error", description: "Failed to load questions", variant: "destructive" });
      return;
    }

    let processedQuestions = questionsData as any[];
    if (testData.shuffle_questions) {
      processedQuestions = [...processedQuestions].sort(() => Math.random() - 0.5);
    }

    if (testData.shuffle_options) {
      processedQuestions = processedQuestions.map(tq => {
        const options = ['A', 'B', 'C', 'D'];
        const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
        const mapping: { [key: string]: string } = {};
        options.forEach((opt, idx) => { mapping[opt] = shuffledOptions[idx]; });
        const newQuestion = { ...tq.questions };
        const tempOptions: { [key: string]: string } = {
          A: tq.questions.option_a, B: tq.questions.option_b,
          C: tq.questions.option_c, D: tq.questions.option_d
        };
        shuffledOptions.forEach((newOpt, idx) => {
          newQuestion[`option_${newOpt.toLowerCase()}`] = tempOptions[options[idx]];
        });
        newQuestion.correct_answer = mapping[tq.questions.correct_answer];
        return { ...tq, questions: newQuestion };
      });
    }

    const { data: existingTimer } = await supabase.from("test_timers").select("*").eq("test_id", testId).eq("user_id", session.user.id).maybeSingle();
    let initialTime: number;
    let startDateTime: Date;

    if (existingTimer) {
      const endsAt = new Date(existingTimer.ends_at);
      initialTime = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
      startDateTime = new Date(existingTimer.started_at);
      const { data: savedAnswers } = await supabase.from("test_answer_drafts").select("*").eq("test_id", testId).eq("user_id", session.user.id);
      if (savedAnswers) {
        const answersMap: { [key: string]: string } = {};
        const reviewSet = new Set<string>();
        savedAnswers.forEach(ans => {
          if (ans.selected_answer) answersMap[ans.question_id] = ans.selected_answer;
          if (ans.marked_for_review) reviewSet.add(ans.question_id);
        });
        setAnswers(answersMap);
        setMarkedForReview(reviewSet);
      }
      sonnerToast.success("Test resumed", { description: "Your progress has been restored." });
    } else {
      initialTime = testData.duration_minutes * 60;
      startDateTime = new Date();
      const endsAt = new Date(startDateTime.getTime() + initialTime * 1000);
      await supabase.from("test_timers").insert({
        test_id: testId, user_id: session.user.id,
        started_at: startDateTime.toISOString(), duration_minutes: testData.duration_minutes,
        ends_at: endsAt.toISOString()
      });
    }

    setTest(testData);
    setQuestions(processedQuestions);
    setTimeRemaining(initialTime);
    setStartTime(startDateTime);
    setLoading(false);
  };

  const autoSaveAnswers = async () => {
    if (!testId || autoSaving) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setAutoSaving(true);
    try {
      const drafts = questions.map(q => ({
        test_id: testId, user_id: session.user.id, question_id: q.question_id,
        selected_answer: answers[q.question_id] || null,
        marked_for_review: markedForReview.has(q.question_id),
        last_saved_at: new Date().toISOString()
      }));
      const { error } = await supabase.from("test_answer_drafts").upsert(drafts, { onConflict: "test_id,user_id,question_id" });
      if (!error) {
        lastSaveRef.current = new Date();
        sonnerToast.success("Progress saved", { duration: 2000 });
      }
    } catch (error) {
      console.error("Auto-save error:", error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleAutoSubmit = () => {
    sonnerToast.error("⏰ Time's Up!", { description: "Submitting your test automatically...", duration: 5000 });
    handleSubmitTest();
  };

  const handleSubmitTest = async () => {
    if (!test || !testId || !startTime) return;
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const answeredQuestions = Object.keys(answers).filter(qId => answers[qId]);
    const unansweredCount = questions.length - answeredQuestions.length;
    let correctCount = 0, wrongCount = 0, totalScore = 0;
    const answerRecords: any[] = [];

    questions.forEach(tq => {
      const selectedAnswer = answers[tq.question_id];
      const isCorrect = selectedAnswer === tq.questions.correct_answer;
      const marksObtained = isCorrect ? tq.marks : 0;
      if (selectedAnswer) {
        isCorrect ? correctCount++ : wrongCount++;
      }
      totalScore += marksObtained;
      answerRecords.push({
        question_id: tq.question_id, selected_answer: selectedAnswer || null,
        is_correct: isCorrect, marks_obtained: marksObtained
      });
    });

    const percentage = Math.round((totalScore / test.total_marks) * 100);
    const passed = totalScore >= test.passing_marks;
    const timeTakenSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);

    const { data: attemptData, error: attemptError } = await supabase.from("test_attempts").insert({
      test_id: testId, user_id: session.user.id, score: totalScore,
      total_marks: test.total_marks, percentage, passed,
      started_at: startTime.toISOString(), completed_at: new Date().toISOString(),
      time_taken_seconds: timeTakenSeconds, unanswered_count: unansweredCount,
      correct_count: correctCount, wrong_count: wrongCount, is_active: false,
      tab_violations: tabViolations, fullscreen_violations: fullscreenViolations
    }).select().single();

    if (attemptError) {
      toast({ title: "Error", description: "Failed to submit test", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    await supabase.from("test_answers").insert(answerRecords.map(ans => ({ ...ans, attempt_id: attemptData.id })));
    await supabase.from("test_answer_drafts").delete().eq("test_id", testId).eq("user_id", session.user.id);
    await supabase.from("test_timers").delete().eq("test_id", testId).eq("user_id", session.user.id);

    sonnerToast.success("Test Submitted!", { description: `You scored ${totalScore}/${test.total_marks} (${percentage}%)` });
    navigate(`/student/test-review/${attemptData.id}`);
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      newSet.has(questionId) ? newSet.delete(questionId) : newSet.add(questionId);
      return newSet;
    });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl text-center max-w-sm w-full border border-white/50"
        >
          <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-display">Preparing Your Test</h2>
          <p className="text-slate-500 mb-6">Loading questions...</p>
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <Button onClick={enterFullscreen} className="mt-6 w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl h-14 font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all">
            Enter Fullscreen Mode
          </Button>
        </motion.div>
      </div>
    );

  }

  // Show Payment Lock Screen
  if (approvalStatus === "payment_locked") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 font-display">Account Locked</h1>
            <p className="text-rose-100 font-medium">Payment Required</p>
          </div>

          <div className="p-8 flex flex-col gap-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-slate-600 leading-relaxed">
                Your account access has been temporarily restricted due to pending payment. Please complete your payment to restore full access to all features.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full py-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 group transition-all"
                onClick={() => window.open("https://wa.me/919547771118?text=Hi, my account is locked due to payment. I want to make the payment.", "_blank")}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium opacity-90">Contact Admin</span>
                    <span className="text-base font-bold">Pay via WhatsApp</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                variant="outline"
                className="w-full py-6 rounded-2xl border-2 hover:bg-slate-50 text-slate-600"
                onClick={() => navigate("/")}
              >
                <Home className="w-4 h-4 mr-2" /> Return Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-[28px] p-8 shadow-xl text-center border border-slate-100">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-slate-800 text-lg mb-4 font-display font-bold">No questions found</p>
          <Button onClick={() => navigate("/student/exams")} className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-indigo-500/25">
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion?.questions) {
    return null;
  }

  const answeredCount = Object.keys(answers).filter(qId => answers[qId]).length;
  const unansweredCount = questions.length - answeredCount;
  const timeWarning = timeRemaining < 300;
  const timeCritical = timeRemaining < 60;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/30 flex flex-col">
      {/* Ultra Compact Header - Fixed Height */}
      <header className={`shrink-0 transition-all duration-300 ${timeCritical
        ? 'bg-gradient-to-r from-rose-500 to-rose-600'
        : timeWarning
          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
          : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600'
        } shadow-lg`}>
        <div className="px-3 py-2 safe-area-top">
          <div className="flex items-center justify-between">
            {/* Back Button - Compact */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/student/exams")}
              className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </motion.button>

            {/* Question Counter */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-sm font-bold">
                Q {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>

            {/* Timer - Compact */}
            <motion.div
              animate={timeCritical ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5, repeat: timeCritical ? Infinity : 0 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${timeCritical
                ? 'bg-white text-rose-600'
                : 'bg-white/20 text-white'
                }`}
            >
              <Timer className="w-4 h-4" />
              <span className="text-sm font-bold font-mono">{formatTime(timeRemaining)}</span>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSubmitDialog(true)}
              className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg"
            >
              <Send className="w-4 h-4 text-indigo-600" />
            </motion.button>
          </div>

          {/* Compact Progress Bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <span className="text-white text-[10px] font-bold">{answeredCount}/{questions.length}</span>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable with bottom padding for nav */}
      <main className="flex-1 overflow-y-auto px-3 py-2 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Question Card - Compact but readable */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col flex-1 min-h-0">
              {/* Question Header - Ultra Compact */}
              <div className="shrink-0 px-3 py-2 bg-slate-50/80 border-b border-slate-100 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[10px] font-bold px-2 py-0.5">
                      {currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}
                    </Badge>
                    {currentQuestion.questions.difficulty && (
                      <Badge className={`border-0 text-[10px] font-bold px-2 py-0.5 ${currentQuestion.questions.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' :
                        currentQuestion.questions.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                        {currentQuestion.questions.difficulty}
                      </Badge>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleMarkForReview(currentQuestion.question_id)}
                    className={`p-1.5 rounded-lg transition-all ${markedForReview.has(currentQuestion.question_id)
                      ? 'bg-amber-100 text-amber-600'
                      : 'text-slate-400'
                      }`}
                  >
                    <Bookmark className={`w-4 h-4 ${markedForReview.has(currentQuestion.question_id) ? 'fill-current' : ''}`} />
                  </motion.button>
                </div>
              </div>

              {/* Question Text - Compact, scrollable if very long */}
              <div className="shrink-0 px-3 py-2 border-b border-slate-100 max-h-[18vh] overflow-y-auto">
                <p className="text-slate-900 text-[14px] leading-snug font-medium">
                  {currentQuestion.questions.question_text}
                </p>
              </div>

              {/* Options - Ultra Compact for Small Screens */}
              <div className="flex-1 p-2 overflow-y-auto">
                <RadioGroup
                  value={answers[currentQuestion.question_id] || ""}
                  onValueChange={value => setAnswers({ ...answers, [currentQuestion.question_id]: value })}
                  className="space-y-1.5"
                >
                  {['A', 'B', 'C', 'D'].map((option, idx) => {
                    const isSelected = answers[currentQuestion.question_id] === option;
                    const optionText = currentQuestion.questions[`option_${option.toLowerCase()}` as keyof Question] as string;
                    return (
                      <motion.div
                        key={option}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setAnswers({ ...answers, [currentQuestion.question_id]: option })}
                        className={`flex items-center py-2 px-2.5 rounded-lg border cursor-pointer transition-all ${isSelected
                          ? 'bg-indigo-50 border-indigo-500'
                          : 'bg-white border-slate-200 active:border-indigo-300'
                          }`}
                      >
                        <RadioGroupItem value={option} id={`option-${option}`} className="sr-only" />
                        <Label htmlFor={`option-${option}`} className="flex items-center gap-2 cursor-pointer flex-1">
                          <span className={`w-6 h-6 rounded-md font-bold text-[11px] flex items-center justify-center shrink-0 ${isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                            }`}>
                            {option}
                          </span>
                          <span className={`text-[12px] leading-tight ${isSelected ? 'text-indigo-900 font-semibold' : 'text-slate-700'}`}>
                            {optionText}
                          </span>
                        </Label>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-indigo-600 ml-auto shrink-0" />
                        )}
                      </motion.div>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Compact Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 shadow-lg z-20 safe-area-bottom">
        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between gap-1.5">
            {/* Previous */}
            <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="w-full h-10 rounded-lg border border-slate-200 font-semibold text-slate-600 text-sm disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </Button>
            </motion.div>

            {/* Navigator Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNavigator(!showNavigator)}
              className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center relative border border-slate-200"
            >
              <ListChecks className="w-4 h-4 text-slate-600" />
              {markedForReview.size > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {markedForReview.size}
                </span>
              )}
            </motion.button>

            {/* Next or Submit */}
            {currentQuestionIndex === questions.length - 1 ? (
              <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  className="w-full h-10 rounded-lg bg-indigo-600 font-semibold text-sm"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Submit
                </Button>
              </motion.div>
            ) : (
              <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                <Button
                  onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  className="w-full h-10 rounded-lg bg-indigo-600 font-semibold text-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </nav>

      {/* Question Navigator Sheet */}
      <AnimatePresence>
        {showNavigator && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowNavigator(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[28px] z-50 max-h-[60vh] overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-slate-100">
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Questions</h3>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-slate-600">
                    <div className="w-3 h-3 rounded bg-indigo-500" /> {answeredCount} Done
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <div className="w-3 h-3 rounded bg-slate-200" /> {unansweredCount} Left
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Bookmark className="w-3 h-3 fill-amber-500 text-amber-500" /> {markedForReview.size}
                  </span>
                </div>
              </div>
              <div className="p-4 overflow-auto max-h-[45vh]">
                <div className="grid grid-cols-6 gap-2">
                  {questions.map((q, index) => {
                    const isAnswered = !!answers[q.question_id];
                    const isMarked = markedForReview.has(q.question_id);
                    const isCurrent = index === currentQuestionIndex;
                    return (
                      <motion.button
                        key={q.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setCurrentQuestionIndex(index);
                          setShowNavigator(false);
                        }}
                        className={`relative h-10 rounded-lg font-bold text-sm ${isCurrent
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg'
                          : isAnswered
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {index + 1}
                        {isMarked && (
                          <Bookmark className="absolute -top-0.5 -right-0.5 w-3 h-3 fill-amber-500 text-amber-500" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="w-[90vw] max-w-sm mx-auto rounded-[24px] p-5 gap-4 border-0 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-xl">
              <Send className="w-6 h-6 text-white" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-center">Submit Test?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="flex justify-center gap-6 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black text-indigo-600">{answeredCount}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Done</span>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black text-amber-500">{unansweredCount}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Skip</span>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black text-violet-600">{markedForReview.size}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Mark</span>
                  </div>
                </div>
                {unansweredCount > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-center font-medium">
                    ⚠️ {unansweredCount} unanswered
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 pt-1">
            <AlertDialogCancel disabled={submitting} className="flex-1 h-11 rounded-xl text-sm font-bold border-2">
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitTest}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-bold shadow-lg"
            >
              {submitting ? "..." : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TakeTest;
