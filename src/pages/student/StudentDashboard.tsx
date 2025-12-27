import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import StudentChat from "@/components/StudentChat";
import {
  BookOpen,
  FileText,
  Lock,
  MessageSquare,
  ChevronRight,
  Trophy,
  Play,
  Award,
  BarChart2,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Flame,
  Target,
  Sparkles,
  TrendingUp,
  Zap,
  Clock,
  Star,
  User
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
  const [showChat, setShowChat] = useState(false);

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
            MOBILE-FIRST GREETING CARD
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
              <span className="text-lg font-bold text-white">{firstName[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-900">
                {greeting.text} {greeting.emoji}
              </h1>
              <p className="text-sm text-slate-500">{firstName}</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-700">Active</span>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            STATS ROW - Horizontal Scroll
            ═══════════════════════════════════════════════════════════════ */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {[
            { label: "Tests Taken", value: statistics.totalTestsTaken, icon: FileText, color: "bg-indigo-500" },
            { label: "Avg Score", value: `${statistics.averageScore}%`, icon: Target, color: "bg-violet-500" },
            { label: "Passed", value: statistics.testsPassed, icon: Award, color: "bg-emerald-500" },
            { label: "Exams", value: statistics.availableExams, icon: Sparkles, color: "bg-amber-500" }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="shrink-0 bg-white rounded-xl p-3 border border-slate-100 shadow-sm min-w-[100px]"
            >
              <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-[10px] font-medium text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            QUICK ACTIONS - Clean Card Style
            ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 px-1">Quick Actions</h3>
          
          {/* Primary Action - Full Mock */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/student/exams?type=full_mock")}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-indigo-100 tap-highlight"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-base font-bold text-white">Start Mock Test</h4>
              <p className="text-xs text-indigo-100 mt-0.5">Full exam simulation</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </motion.button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/student/results")}
              className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm tap-highlight"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm text-left">Analytics</h4>
              <p className="text-[11px] text-slate-400 text-left mt-0.5">Track progress</p>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/student/pdfs")}
              className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm tap-highlight"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-orange-600" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm text-left">Materials</h4>
              <p className="text-[11px] text-slate-400 text-left mt-0.5">Study PDFs</p>
            </motion.button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MOTIVATION BANNER - Minimal & Clean
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              {statistics.totalTestsTaken > 0 ? "You're on fire! 🔥" : "Ready to begin?"}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              {statistics.totalTestsTaken > 0 
                ? `${statistics.testsPassed} tests passed so far` 
                : "Take your first test today"}
            </p>
          </div>
          {statistics.totalTestsTaken > 0 && (
            <div className="text-2xl font-bold text-amber-400">
              {currentStreak}🔥
            </div>
          )}
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

        {/* ═══════════════════════════════════════════════════════════════
            FLOATING CHAT BUTTON - Bottom Right
            ═══════════════════════════════════════════════════════════════ */}
        {isApproved && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChat(true)}
            className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 z-50 tap-highlight md:hidden"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </motion.button>
        )}

        {/* Desktop Support Link */}
        {isApproved && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowChat(true)}
            className="hidden md:flex w-full p-4 rounded-xl bg-white border border-slate-100 shadow-sm items-center gap-3 tap-highlight"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-slate-900 text-sm">Student Support</p>
              <p className="text-[10px] text-slate-500">Chat with us</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </motion.button>
        )}
      </div>
      {isApproved && profile?.id && (
        <StudentChat
          studentId={profile.id}
          studentName={profile.full_name || "Student"}
          isOpen={showChat}
          onOpenChange={setShowChat}
        />
      )}
    </StudentLayout>
  );
};

export default StudentDashboard;