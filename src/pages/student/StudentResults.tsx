import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy,
  ChevronRight,
  Clock,
  BarChart2,
  Award,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StudentLayout from "@/components/student/StudentLayout";
import { format } from "date-fns";

interface TestAttempt {
  id: string;
  test_id: string;
  test_title: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
}

const StudentResults = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [stats, setStats] = useState({ passed: 0, avg: 0 });

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const { data, error } = await supabase
      .from("test_attempts")
      .select(`
        id,
        test_id,
        score,
        total_marks,
        percentage,
        passed,
        completed_at,
        mock_tests (title)
      `)
      .eq("user_id", session.user.id)
      .eq("is_active", false)
      .order("completed_at", { ascending: false });

    if (data) {
      const formattedAttempts = data.map((a: any) => ({
        id: a.id,
        test_id: a.test_id,
        test_title: a.mock_tests?.title || "Unknown Test",
        score: a.score,
        total_marks: a.total_marks,
        percentage: a.percentage,
        passed: a.passed,
        completed_at: a.completed_at
      }));
      setAttempts(formattedAttempts);

      if (formattedAttempts.length > 0) {
        const passed = formattedAttempts.filter(a => a.passed).length;
        const avg = Math.round(formattedAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / formattedAttempts.length);
        setStats({ passed, avg });
      }
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy • h:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <StudentLayout title="Results" subtitle="Your performance">
        <div className="w-full md:max-w-5xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Results" subtitle="Your performance">
      <div className="w-full max-w-3xl mx-auto space-y-4 pb-32 pt-2 overflow-x-hidden">

        {/* ═══════════════════════════════════════════════════════════════
            PREMIUM ACHIEVEMENT HERO - Mobile Optimized
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-[28px] p-4 sm:p-6 md:p-8 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 shadow-xl shadow-emerald-200/50"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:20px_20px]" />
          <div className="absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 sm:-mr-32 sm:-mt-32" />
          <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-emerald-400/20 rounded-full blur-2xl -ml-16 -mb-16 sm:-ml-24 sm:-mb-24" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-[0.2em] text-emerald-100">Performance</span>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
              Your <span className="text-emerald-300">Success</span> Journey
            </h1>
            <p className="text-emerald-50/70 max-w-md text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
              Track your test history and improve weak areas.
            </p>

            {/* Stats Row - Inline on Mobile */}
            <div className="flex gap-4 sm:gap-6 pt-2 sm:pt-4">
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-black text-white">{attempts.length}</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Tests</span>
              </div>
              <div className="w-px h-8 sm:h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-black text-emerald-300">{stats.passed}</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Passed</span>
              </div>
              <div className="w-px h-8 sm:h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-black text-white">{stats.avg}%</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Avg</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            DETAILED RESULTS LIST - Mobile Optimized
            ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              Recent Attempts
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {attempts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card-premium p-8 sm:p-12 text-center"
                >
                  <Award className="w-10 h-10 sm:w-12 sm:h-12 text-slate-200 mx-auto mb-3 sm:mb-4" />
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">No attempts yet</h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Start your first test to see results here.</p>
                </motion.div>
              ) : (
                attempts.map((attempt, idx) => (
                  <motion.div
                    key={attempt.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    className="card-premium p-3 sm:p-4 md:p-5 group active:scale-[0.99] transition-all cursor-pointer"
                    onClick={() => navigate(`/student/test-review/${attempt.id}`)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Score Circle */}
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${attempt.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                        <span className="text-base sm:text-lg font-black">{attempt.percentage}%</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate group-hover:text-indigo-600 transition-colors">
                          {attempt.test_title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] sm:text-xs text-slate-400">{formatDate(attempt.completed_at)}</span>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold uppercase ${attempt.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {attempt.passed ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentResults;