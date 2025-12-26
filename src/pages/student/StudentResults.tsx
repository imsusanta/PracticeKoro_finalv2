import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  ChevronRight,
  XCircle,
  BookOpen,
  Zap,
  Lock,
  BarChart2,
  Target,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import StudentLayout from "@/components/student/StudentLayout";

interface TestAttempt {
  id: string;
  test_id: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
  test_title?: string;
}

const StudentResults = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const approvalResult = await supabase
      .from("approval_status")
      .select("status")
      .eq("user_id", session.user.id)
      .single();

    setApprovalStatus(approvalResult.data?.status || "pending");
    await loadTestAttempts(session.user.id);
    setLoading(false);
  };

  const loadTestAttempts = async (userId: string) => {
    const { data, error } = await supabase
      .from("test_attempts")
      .select(`*, mock_tests:test_id (title)`)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    if (!error && data) {
      setAttempts(data.map((a: any) => ({
        id: a.id,
        test_id: a.test_id,
        score: a.score,
        total_marks: a.total_marks,
        percentage: a.percentage,
        passed: a.passed,
        completed_at: a.completed_at,
        test_title: a.mock_tests?.title || "Test",
      })));
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Loading State - Inside Layout for smooth transitions
  if (loading) {
    return (
      <StudentLayout title="Results" subtitle="Your performance">
        <div className="w-full md:max-w-4xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </motion.div>
        </div>
      </StudentLayout>
    );
  }

  // Payment Locked State - Inside Layout for smooth transitions
  if (approvalStatus === "payment_locked") {
    return (
      <StudentLayout title="Results" subtitle="Your performance">
        <div className="w-full md:max-w-4xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm w-full"
          >
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Locked</h2>
            <p className="text-slate-500 mb-8">Complete payment to view results</p>
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

  const passed = attempts.filter(a => a.passed).length;
  const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0;

  return (
    <StudentLayout title="Results" subtitle="Your performance">
      {/* Mobile: No extra padding (Layout has px-4), Desktop: wider */}
      <div className="w-full md:max-w-4xl md:mx-auto pb-8">

        {/* ═══════════════════════════════════════════════════════════════
            MOBILE STATS - Simple 3-column cards
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-2 mb-4 md:hidden"
        >
          <div className="bg-white rounded-2xl p-3 text-center border border-slate-100">
            <p className="text-lg font-bold text-emerald-600">{passed}</p>
            <p className="text-[10px] text-slate-500">Passed</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center border border-slate-100">
            <p className="text-lg font-bold text-indigo-600">{avg}%</p>
            <p className="text-[10px] text-slate-500">Avg</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center border border-slate-100">
            <p className="text-lg font-bold text-slate-900">{attempts.length}</p>
            <p className="text-[10px] text-slate-500">Total</p>
          </div>
        </motion.div>

        {/* Desktop Stats Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:block relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 mb-6"
          style={{ boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' }}
        >
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl -ml-20 -mb-20" />
          </div>
          <div className="relative z-10 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center border border-emerald-500/30">
                <Trophy className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-400">Overall Achievement</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-3xl font-black tracking-tight text-emerald-400 font-mono">{passed}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Passed</p>
              </div>
              <div className="space-y-1 border-l border-white/10 pl-4">
                <p className="text-3xl font-black tracking-tight text-blue-400 font-mono">{avg}%</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Average</p>
              </div>
              <div className="space-y-1 border-l border-white/10 pl-4">
                <p className="text-3xl font-black tracking-tight text-slate-100 font-mono">{attempts.length}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Attempts</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            RESULTS LIST
            ═══════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm md:text-lg font-bold text-slate-900">Recent Attempts</h3>
            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-semibold">
              {attempts.length}
            </span>
          </div>

          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {attempts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 bg-white rounded-2xl border border-slate-100 md:col-span-2"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-slate-900 font-semibold text-sm">No results yet</p>
                <p className="text-slate-500 text-xs mt-1">Take a test to see your results</p>
                <button
                  onClick={() => navigate("/student/exams")}
                  className="mt-3 bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform"
                >
                  Start a Test
                </button>
              </motion.div>
            ) : (
              <>
                {attempts.map((attempt, index) => (
                  <motion.button
                    key={attempt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/student/test-review/${attempt.id}`)}
                    className="w-full bg-white rounded-2xl p-3 md:p-5 border border-slate-100 text-left active:bg-slate-50 transition-colors hover:shadow-lg hover:border-indigo-200"
                  >
                    <div className="flex items-center gap-2">
                      {/* Status Icon */}
                      <div className={`shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center ${attempt.passed
                        ? "bg-emerald-100 md:bg-gradient-to-br md:from-emerald-500 md:to-teal-500"
                        : "bg-red-100 md:bg-gradient-to-br md:from-red-500 md:to-rose-500"
                        }`}>
                        {attempt.passed ? (
                          <Trophy className="w-4 h-4 md:w-6 md:h-6 text-emerald-600 md:text-white" />
                        ) : (
                          <XCircle className="w-4 h-4 md:w-6 md:h-6 text-red-500 md:text-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-[13px] md:text-[15px] leading-snug truncate">
                          {attempt.test_title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500">
                            {attempt.score}/{attempt.total_marks}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] text-slate-500">
                            {formatDate(attempt.completed_at)}
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className={`shrink-0 px-2 py-1 rounded-lg ${attempt.passed ? "bg-emerald-50" : "bg-red-50"
                        }`}>
                        <span className={`text-sm font-bold ${attempt.passed ? "text-emerald-600" : "text-red-500"
                          }`}>
                          {attempt.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}

                {/* Practice More CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: attempts.length * 0.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/student/exams")}
                  className="w-full bg-slate-900 rounded-2xl p-3 md:p-5 flex items-center gap-2 text-left md:col-span-2 hover:bg-slate-800 transition-colors"
                >
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-[13px] md:text-base">Practice More</p>
                    <p className="text-slate-400 text-[10px] md:text-sm">Keep improving!</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentResults;