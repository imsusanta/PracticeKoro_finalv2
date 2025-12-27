import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import {
  Trophy,
  ChevronRight,
  BarChart2,
  Award
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

  const loadResults = useCallback(async () => {
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
  }, [navigate]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const { containerProps, PullIndicator } = usePullToRefresh({
    onRefresh: loadResults
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, h:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <StudentLayout title="Results" subtitle="Your performance">
        <div className="w-full flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center animate-pulse">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Results" subtitle="Your performance">
      <PullIndicator />
      <div className="w-full space-y-3 pb-24" {...containerProps}>

        {/* Compact Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Performance</span>
            </div>
            
            <h1 className="text-lg font-bold text-white mb-3">Your Results</h1>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
                <span className="text-xl font-bold text-white block">{attempts.length}</span>
                <span className="text-[9px] font-medium text-emerald-100 uppercase">Tests</span>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
                <span className="text-xl font-bold text-emerald-200 block">{stats.passed}</span>
                <span className="text-[9px] font-medium text-emerald-100 uppercase">Passed</span>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
                <span className="text-xl font-bold text-white block">{stats.avg}%</span>
                <span className="text-[9px] font-medium text-emerald-100 uppercase">Average</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results List */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Attempts</h3>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {attempts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl border border-slate-100 p-8 text-center"
                >
                  <Award className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-900 text-sm">No attempts yet</h4>
                  <p className="text-xs text-slate-500 mt-1">Start your first test to see results.</p>
                </motion.div>
              ) : (
                attempts.map((attempt, idx) => (
                  <motion.div
                    key={attempt.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="bg-white rounded-xl border border-slate-100 p-3 active:scale-[0.98] transition-transform"
                    onClick={() => navigate(`/student/test-review/${attempt.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Score Badge */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        attempt.passed 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-red-50 text-red-600'
                      }`}>
                        <span className="text-base font-bold">{attempt.percentage}%</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">
                          {attempt.test_title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400">{formatDate(attempt.completed_at)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            attempt.passed 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {attempt.passed ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
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