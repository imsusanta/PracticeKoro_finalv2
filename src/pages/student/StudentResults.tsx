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
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-32 pt-2 px-4 overflow-x-hidden">

        {/* ═══════════════════════════════════════════════════════════════
            PREMIUM ACHIEVEMENT HERO
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] p-6 md:p-10 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 shadow-2xl shadow-emerald-200"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:20px_20px]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl -ml-24 -mb-24" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">Performance Summary</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                Your <span className="text-emerald-300">Success</span> Journey
              </h1>
              <p className="text-emerald-50/70 max-w-md text-sm md:text-base leading-relaxed">
                Track your mock test history, analyze scores, and keep improving your weak areas.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-[28px] border border-white/20 p-6 flex gap-8 items-center shrink-0">
              <div className="text-center">
                <p className="text-3xl font-black text-white">{attempts.length}</p>
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mt-1">Attempts</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-300">{stats.passed}</p>
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mt-1">Passes</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-black text-white">{stats.avg}%</p>
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mt-1">Average</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            DETAILED RESULTS LIST
            ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Recent Attempts
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {attempts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card-premium p-12 text-center"
                >
                  <Award className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h4 className="font-bold text-slate-900">No attempts yet</h4>
                  <p className="text-sm text-slate-500 mt-1">Start your first test to see your performance here.</p>
                </motion.div>
              ) : (
                attempts.map((attempt, idx) => (
                  <motion.div
                    key={attempt.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="card-premium p-5 md:p-6 group hover:translate-x-1 transition-all cursor-pointer"
                    onClick={() => navigate(`/student/test-review/${attempt.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${attempt.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                          <Award className="w-7 h-7" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-base md:text-lg truncate group-hover:text-indigo-600 transition-colors">
                            {attempt.test_title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {formatDate(attempt.completed_at)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${attempt.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {attempt.passed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                        <div className="text-right">
                          <p className="text-2xl font-black text-slate-900 tracking-tight">{attempt.percentage}%</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{attempt.score}/{attempt.total_marks} Marks</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </motion.button>
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