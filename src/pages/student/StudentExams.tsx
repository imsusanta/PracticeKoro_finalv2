import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  ChevronRight,
  Play,
  Lock,
  RotateCcw,
  Clock,
  BookOpen,
  Target,
  CheckCircle,
  Sparkles,
  Award,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StudentLayout from "@/components/student/StudentLayout";

interface Exam {
  id: string;
  name: string;
}

interface MockTest {
  id: string;
  title: string;
  test_type: string;
  duration_minutes: number;
  total_marks: number;
  exam_id: string;
}

interface TestAttemptInfo {
  test_id: string;
  best_percentage: number;
  passed: boolean;
  attempt_count: number;
}

const StudentExams = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [mockTests, setMockTests] = useState<{ [key: string]: MockTest[] }>({});
  const [testAttempts, setTestAttempts] = useState<{ [key: string]: TestAttemptInfo }>({});
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string>("all");

  const urlType = searchParams.get("type");
  const [filterType, setFilterType] = useState<"all" | "full_mock" | "topic_wise">(
    urlType === "full_mock" || urlType === "topic_wise" ? urlType : "all"
  );

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const approvalResult = await supabase.from("approval_status").select("status").eq("user_id", session.user.id).single();
    setApprovalStatus(approvalResult.data?.status || "pending");
    await Promise.all([loadExamsAndTests(), loadTestAttempts(session.user.id)]);
    setLoading(false);
  };

  const loadExamsAndTests = async () => {
    const { data: examsData } = await supabase.from("exams").select("id, name").eq("is_active", true).order("name");
    setExams(examsData || []);

    const { data: testsData } = await supabase.from("mock_tests").select("id, title, test_type, duration_minutes, total_marks, exam_id").eq("is_published", true).order("title");
    const testsByExam: { [key: string]: MockTest[] } = {};
    testsData?.forEach((test) => {
      if (!testsByExam[test.exam_id]) testsByExam[test.exam_id] = [];
      testsByExam[test.exam_id].push(test);
    });
    setMockTests(testsByExam);
  };

  const loadTestAttempts = async (userId: string) => {
    const { data } = await supabase.from("test_attempts").select("test_id, percentage, passed").eq("user_id", userId).eq("is_active", false);
    if (data) {
      const attemptsByTest: { [key: string]: TestAttemptInfo } = {};
      data.forEach((a) => {
        if (!attemptsByTest[a.test_id]) {
          attemptsByTest[a.test_id] = { test_id: a.test_id, best_percentage: a.percentage, passed: a.passed, attempt_count: 1 };
        } else {
          attemptsByTest[a.test_id].attempt_count++;
          if (a.percentage > attemptsByTest[a.test_id].best_percentage) {
            attemptsByTest[a.test_id].best_percentage = a.percentage;
          }
        }
        if (a.passed) attemptsByTest[a.test_id].passed = true;
      });
      setTestAttempts(attemptsByTest);
    }
  };

  const getAllTests = () => {
    let allTests: MockTest[] = [];
    Object.entries(mockTests).forEach(([examId, tests]) => {
      if (selectedExam === "all" || selectedExam === examId) allTests = [...allTests, ...tests];
    });

    if (filterType !== "all") {
      allTests = allTests.filter(t => t.test_type === filterType);
    }

    return allTests;
  };

  const filteredTests = getAllTests();
  const totalPublishedTests = Object.values(mockTests).flat().length;
  const completedTests = Object.keys(testAttempts).length;
  const avgScore = completedTests > 0
    ? Math.round(Object.values(testAttempts).reduce((acc, curr) => acc + curr.best_percentage, 0) / completedTests)
    : 0;
  const passedTests = Object.values(testAttempts).filter(t => t.passed).length;

  if (loading) {
    return (
      <StudentLayout title="Mock Tests" subtitle="Practice & improve">
        <div className="w-full md:max-w-5xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (approvalStatus === "payment_locked") {
    return (
      <StudentLayout title="Mock Tests" subtitle="Practice & improve">
        <div className="w-full md:max-w-5xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm w-full"
          >
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Locked</h2>
            <p className="text-slate-500 mb-8">Complete payment to unlock all tests</p>
            <button
              onClick={() => navigate("/student/dashboard")}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold shadow-lg active:scale-[0.98] transition-all"
            >
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Mock Tests" subtitle="Practice & improve">
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-32 pt-2 px-4 overflow-x-hidden">

        {/* ═══════════════════════════════════════════════════════════════
            PREMIUM HERO SECTION
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] p-6 md:p-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 shadow-2xl shadow-indigo-200"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:20px_20px]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl -ml-24 -mb-24" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                <Trophy className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Test Repository</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
              Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Exams</span>
            </h1>
            <p className="text-slate-400 max-w-lg text-sm md:text-base leading-relaxed">
              Choose from over {totalPublishedTests} full-length mock tests and topic-wise practices designed by experts.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">{completedTests}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completed</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-emerald-400">{avgScore}%</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Score</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-indigo-400">{passedTests}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Passed</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            FILTER & TAB NAVIGATION
            ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {[
                { key: "all", label: "All Tests", icon: BookOpen },
                { key: "full_mock", label: "Full Mocks", icon: Award },
                { key: "topic_wise", label: "Topic Tests", icon: Target }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setFilterType(tab.key as any);
                    setSelectedExam("all");
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${filterType === tab.key
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white text-slate-600 border border-slate-100 hover:border-indigo-200"
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {exams.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => setSelectedExam("all")}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${selectedExam === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  All Exams
                </button>
                {exams.map(e => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedExam(e.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${selectedExam === e.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              TEST GRID
              ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTests.map((test, idx) => {
                const attempt = testAttempts[test.id];

                return (
                  <motion.div
                    layout
                    key={test.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                  >
                    <div className="card-premium h-full flex flex-col group relative overflow-hidden">
                      {/* Top Accent line */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${test.test_type === 'full_mock' ? 'from-indigo-500 to-violet-500' : 'from-emerald-500 to-teal-500'
                        }`} />

                      <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${test.test_type === 'full_mock' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                            {test.test_type === 'full_mock' ? 'Full Mock' : 'Topic Test'}
                          </span>
                          {attempt?.passed && (
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <CheckCircle className="w-3 h-3" />
                              <span className="text-[9px] font-bold">Passed</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {test.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 py-3 border-y border-slate-50">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-600">{test.duration_minutes}m</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-600">{test.total_marks} Marks</span>
                          </div>
                        </div>

                        {attempt && (
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Best Score</span>
                              <span className="text-sm font-black text-slate-800">{attempt.best_percentage}%</span>
                            </div>
                            <div className="w-8 h-8 rounded-full border-2 border-slate-100 flex items-center justify-center">
                              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/student/take-test/${test.id}`)}
                          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${attempt ? 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                            }`}
                        >
                          {attempt ? (
                            <>
                              <RotateCcw className="w-4 h-4" />
                              Retake Test
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-current" />
                              Start Now
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredTests.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No tests found</h3>
                <p className="text-slate-500 text-sm">Try changing your filters or choosing another category</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentExams;
