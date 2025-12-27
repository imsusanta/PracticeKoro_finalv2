import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import {
  BookOpen,
  Lock,
  MessageSquare,
  ArrowRight,
  GraduationCap,
  TrendingUp,
  Zap,
  Star
} from "lucide-react";
import StudentLayout from "@/components/student/StudentLayout";
import { motion } from "framer-motion";

interface Statistics {
  totalTestsTaken: number;
  averageScore: number;
  testsPassed: number;
  availableExams: number;
}

interface Exam {
  id: string;
  name: string;
}

// Get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return { text: "Good Night", emoji: "🌙" };
  if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  if (hour < 21) return { text: "Good Evening", emoji: "🌅" };
  return { text: "Good Night", emoji: "🌙" };
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalTestsTaken: 0,
    averageScore: 0,
    testsPassed: 0,
    availableExams: 0
  });
  

  const loadDashboardData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const [roleResult, profileResult, approvalResult, examsResult, attemptsResult] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "student").maybeSingle(),
      supabase.from("profiles").select("*").eq("id", session.user.id).single(),
      supabase.from("approval_status").select("status").eq("user_id", session.user.id).single(),
      supabase.from("exams").select("id, name").eq("is_active", true).order("name"),
      supabase.from("test_attempts").select("percentage, passed").eq("user_id", session.user.id)
    ]);

    if (!roleResult.data) {
      await supabase.auth.signOut();
      navigate("/login");
      return;
    }

    setProfile(profileResult.data);
    setApprovalStatus(approvalResult.data?.status || "pending");
    setExams(examsResult.data || []);

    const attempts = attemptsResult.data || [];
    setStatistics({
      totalTestsTaken: attempts.length,
      averageScore: attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0,
      testsPassed: attempts.filter(a => a.passed).length,
      availableExams: examsResult.data?.length || 0
    });

    setAuthChecked(true);
  }, [navigate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const { containerProps, PullIndicator } = usePullToRefresh({
    onRefresh: loadDashboardData
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.clear();
    navigate("/");
  };

  // Loading State - Inside Layout for smooth transitions
  if (!authChecked) {
    return (
      <StudentLayout title="Dashboard" subtitle="Your learning hub">
        <div className="w-full md:max-w-4xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
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
      <StudentLayout title="Dashboard" subtitle="Your learning hub">
        <div className="w-full md:max-w-4xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center w-full max-w-sm"
          >
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Required</h1>
            <p className="text-slate-500 text-sm mb-8">Unlock all features with a one-time payment</p>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
              <img src="/payment-qr.jpg" alt="QR" className="w-36 h-36 rounded-xl mx-auto" />
              <p className="text-3xl font-bold text-indigo-600 mt-4">₹99</p>
              <p className="text-xs text-slate-400 mt-1">One-time payment</p>
            </div>
            <button
              onClick={() => window.open("https://wa.me/918927093059", "_blank")}
              className="w-full bg-green-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <MessageSquare className="w-5 h-5" />
              WhatsApp Payment
            </button>
            <button onClick={handleLogout} className="text-slate-400 text-sm mt-6 py-2">
              Logout
            </button>
          </motion.div>
        </div>
      </StudentLayout>
    );
  }

  const isApproved = approvalStatus === 'approved';
  const firstName = profile?.full_name?.split(' ')[0] || "Student";
  const greeting = getGreeting();
  const currentStreak = statistics.totalTestsTaken > 0 ? Math.min(statistics.totalTestsTaken, 7) : 0;

  return (
    <StudentLayout title="Dashboard" subtitle="Your learning hub">
      <PullIndicator />
      <div className="w-full max-w-2xl mx-auto space-y-4 pb-24 overflow-x-hidden" {...containerProps}>

        {/* ═══════════════════════════════════════════════════════════════
            COMPACT MOBILE HERO - Clean & Fast
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 shadow-lg"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0">
                <span className="text-base font-bold text-white">{firstName[0]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-white truncate">
                  {greeting.text}, {firstName} {greeting.emoji}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-indigo-200 text-[10px] font-semibold">Active Student</p>
                </div>
              </div>
            </div>

            {/* Compact Progress Ring */}
            <div className="relative w-12 h-12 shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="40%" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                <motion.circle
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 100 - (100 * Math.min(statistics.totalTestsTaken, 5) / 5) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  cx="50%" cy="50%" r="40%" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"
                  style={{ strokeDasharray: "100" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{Math.min(statistics.totalTestsTaken, 5)}/5</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            COMPACT STATS GRID - 4 Columns on Mobile
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Tests", value: statistics.totalTestsTaken, color: "from-indigo-500 to-indigo-600" },
            { label: "Avg", value: `${statistics.averageScore}%`, color: "from-violet-500 to-violet-600" },
            { label: "Pass", value: statistics.testsPassed, color: "from-emerald-500 to-emerald-600" },
            { label: "Exams", value: statistics.availableExams, color: "from-amber-500 to-amber-600" }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.03 }}
              className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm text-center"
            >
              <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            QUICK ACTIONS - Full Width Buttons for Mobile
            ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-2">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/student/exams?type=full_mock")}
            className="w-full p-3.5 rounded-xl bg-indigo-600 text-left flex items-center gap-3 shadow-md tap-highlight"
          >
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white">Full Mock Tests</h4>
              <p className="text-[10px] text-indigo-200">Complete exam simulation</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white/70 shrink-0" />
          </motion.button>

          <div className="grid grid-cols-2 gap-2">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/student/results")}
              className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-left tap-highlight"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Analytics</h4>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">View progress</p>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/student/pdfs")}
              className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-left tap-highlight"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-2">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Materials</h4>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">Study PDFs</p>
            </motion.button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            COMPACT MOTIVATION CARD
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative p-4 rounded-xl bg-slate-900 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm">Daily Motivation</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed truncate">
                {statistics.totalTestsTaken > 0 ? 'You\'re doing great! Keep practicing.' : 'Ready to start your journey!'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            EXAM CATEGORIES - Horizontal Scroll (Compact)
            ═══════════════════════════════════════════════════════════════ */}
        {isApproved && exams.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Subjects</h3>
              <button
                onClick={() => navigate("/student/exams")}
                className="text-indigo-600 text-[11px] font-bold px-2 py-1 rounded-lg tap-highlight"
              >
                View All
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3">
              {exams.map((exam, idx) => (
                <motion.button
                  key={exam.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/student/exams?exam=${exam.id}`)}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-2 tap-highlight"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-900 text-xs whitespace-nowrap">{exam.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;