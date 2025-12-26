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
  Award
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

  // Loading State - Inside Layout for smooth transitions (both mobile and desktop)
  if (loading) {
    return (
      <StudentLayout title="Mock Tests" subtitle="Practice & improve">
        <div className="w-full md:max-w-4xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </motion.div>
        </div>
      </StudentLayout>
    );
  }

  // Payment Locked State - Inside Layout for smooth transitions (both mobile and desktop)
  if (approvalStatus === "payment_locked") {
    return (
      <StudentLayout title="Mock Tests" subtitle="Practice & improve">
        <div className="w-full md:max-w-4xl md:mx-auto flex items-center justify-center min-h-[50vh]">
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
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold active:scale-[0.98] transition-transform"
            >
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </StudentLayout>
    );
  }

  // Test List Content - Used in both Mobile and Desktop
  const TestListContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-premium p-1.5 flex mb-4"
      >
        {[
          { key: "all", label: "All", icon: BookOpen },
          { key: "full_mock", label: "Full Mock", icon: Award },
          { key: "topic_wise", label: "Topic", icon: Target }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilterType(tab.key as typeof filterType);
              setSelectedExam("all");
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${filterType === tab.key
              ? "bg-indigo-600 text-white"
              : "text-slate-500"
              }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Exam Category Chips */}
      {exams.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className={`mb-4 ${isMobile ? '-mx-4 px-4' : ''}`}
        >
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedExam("all")}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedExam === "all"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 border border-slate-200"
                }`}
            >
              <Sparkles className="w-3 h-3" />
              All
            </button>
            {exams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => setSelectedExam(exam.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${selectedExam === exam.id
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
                  }`}
              >
                {exam.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">
          {filterType === "all" ? "All Tests" : filterType === "full_mock" ? "Full Mock Tests" : "Topic-wise Tests"}
        </h3>
        <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold">
          {filteredTests.length} tests
        </span>
      </div>

      {/* Test Cards */}
      <div className="space-y-3 pb-6">
        <AnimatePresence mode="popLayout">
          {filteredTests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 card-premium"
            >
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-900 font-bold text-base mb-1">No tests found</p>
              <p className="text-slate-500 text-sm">Try selecting a different category</p>
            </motion.div>
          ) : (
            filteredTests.map((test, index) => {
              const attempt = testAttempts[test.id];
              const isPassed = attempt?.passed;
              const hasAttempted = !!attempt;
              const examName = exams.find(e => e.id === test.exam_id)?.name;

              return (
                <motion.button
                  key={test.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/student/take-test/${test.id}`)}
                  className="w-full card-premium p-4 text-left"
                >
                  {/* Top Row - Type Badge & Score */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide ${test.test_type === "full_mock"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-amber-100 text-amber-700"
                        }`}>
                        {test.test_type === "full_mock" ? "Full Mock" : "Topic"}
                      </span>
                      {isPassed && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3" />
                          Passed
                        </span>
                      )}
                    </div>
                    {attempt && (
                      <div className={`px-2.5 py-1 rounded-lg ${isPassed ? "bg-emerald-50" : "bg-amber-50"}`}>
                        <p className={`text-sm font-bold ${isPassed ? "text-emerald-600" : "text-amber-600"}`}>
                          {attempt.best_percentage}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-slate-900 text-[15px] leading-snug mb-2 line-clamp-2">
                    {test.title}
                  </h4>

                  {/* Meta Info Row */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {test.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Target className="w-3.5 h-3.5 text-slate-400" />
                      {test.total_marks} marks
                    </span>
                    {examName && (
                      <span className="flex items-center gap-1 text-xs text-slate-400 truncate">
                        {examName}
                      </span>
                    )}
                  </div>

                  {/* Action Button - More subtle */}
                  <div className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${hasAttempted
                    ? "bg-slate-100 text-slate-700"
                    : "bg-indigo-600 text-white"
                    }`}>
                    {hasAttempted ? (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Retry Test
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start Test
                      </>
                    )}
                  </div>
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </>
  );

  return (
    <StudentLayout title="Mock Tests" subtitle="Practice & improve">
      <div className="w-full md:max-w-4xl md:mx-auto pb-8 overflow-x-hidden">

        {/* ═══════════════════════════════════════════════════════════════
            MOBILE STATS - Clean card-premium style matching Profile page
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3 mb-4 md:hidden"
        >
          {[
            { value: totalPublishedTests, label: "Total Tests", color: "text-indigo-600", bgColor: "bg-indigo-100", icon: "📝" },
            { value: completedTests, label: "Completed", color: "text-emerald-600", bgColor: "bg-emerald-100", icon: "✅" },
            { value: passedTests, label: "Passed", color: "text-amber-600", bgColor: "bg-amber-100", icon: "🏆" },
            { value: `${avgScore}%`, label: "Avg Score", color: "text-blue-600", bgColor: "bg-blue-100", icon: "📊" }
          ].map((stat) => (
            <div key={stat.label} className="card-premium p-3 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            DESKTOP STATS HERO - Premium gradient card
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:block relative overflow-hidden rounded-[32px] mb-6"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            boxShadow: '0 20px 40px rgba(99, 102, 241, 0.25)'
          }}
        >
          <div className="absolute inset-0 opacity-50">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-400/30 rounded-full blur-2xl -ml-20 -mb-20" />
          </div>
          <div className="relative z-10 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/80">Your Progress</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-3xl font-black tracking-tight text-white font-mono">{totalPublishedTests}</p>
                <p className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">Total Tests</p>
              </div>
              <div className="space-y-1 border-l border-white/20 pl-4">
                <p className="text-3xl font-black tracking-tight text-emerald-300 font-mono">{completedTests}</p>
                <p className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">Completed</p>
              </div>
              <div className="space-y-1 border-l border-white/20 pl-4">
                <p className="text-3xl font-black tracking-tight text-amber-300 font-mono">{passedTests}</p>
                <p className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">Passed</p>
              </div>
              <div className="space-y-1 border-l border-white/20 pl-4">
                <p className="text-3xl font-black tracking-tight text-white/90 font-mono">{avgScore}%</p>
                <p className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">Avg Score</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Test List Content - Same for both mobile and desktop */}
        <TestListContent isMobile={false} />
      </div>
    </StudentLayout>
  );
};

export default StudentExams;
