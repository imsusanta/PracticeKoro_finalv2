import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import StudentChat from "@/components/StudentChat";
import {
  BookOpen,
  Lock,
  MessageSquare,
  ArrowRight,
  GraduationCap,
  TrendingUp,
  Zap,
  Star,
  Trophy,
  Target,
  FileText,
  ChevronRight,
  Flame,
  Clock,
  CheckCircle2,
  BarChart3,
  Sparkles
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
  if (hour < 5) return { text: "Good Night", emoji: "🌙", color: "from-indigo-600 to-purple-700" };
  if (hour < 12) return { text: "Good Morning", emoji: "☀️", color: "from-amber-500 to-orange-600" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️", color: "from-blue-500 to-cyan-600" };
  if (hour < 21) return { text: "Good Evening", emoji: "🌅", color: "from-orange-500 to-rose-600" };
  return { text: "Good Night", emoji: "🌙", color: "from-indigo-600 to-purple-700" };
};

// Motivational quotes
const quotes = [
  "Success is not final, failure is not fatal.",
  "The secret of getting ahead is getting started.",
  "Believe you can and you're halfway there.",
  "Every expert was once a beginner.",
  "Your only limit is your mind."
];

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
  const [dailyQuote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

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

  // Loading State
  if (!authChecked) {
    return (
      <StudentLayout title="Dashboard" subtitle="Your learning hub">
        <div className="w-full md:max-w-4xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </motion.div>
        </div>
      </StudentLayout>
    );
  }

  // Payment Locked State
  if (approvalStatus === "payment_locked") {
    return (
      <StudentLayout title="Dashboard" subtitle="Your learning hub">
        <div className="w-full md:max-w-4xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center w-full max-w-sm"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Lock className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Required</h1>
            <p className="text-slate-500 text-sm mb-8">Unlock all features with a one-time payment</p>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-6">
              <img src="/payment-qr.jpg" alt="QR" className="w-36 h-36 rounded-xl mx-auto" />
              <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mt-4">₹99</p>
              <p className="text-xs text-slate-400 mt-1">One-time payment</p>
            </div>
            <button
              onClick={() => window.open("https://wa.me/918927093059", "_blank")}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-green-500/25"
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
  const passRate = statistics.totalTestsTaken > 0 ? Math.round((statistics.testsPassed / statistics.totalTestsTaken) * 100) : 0;

  return (
    <StudentLayout title="Dashboard" subtitle="Your learning hub" hideNavbar={showChat}>
      <PullIndicator />
      <div className="w-full max-w-2xl mx-auto space-y-5 pb-28 overflow-x-hidden" {...containerProps}>

        {/* ═══════════════════════════════════════════════════════════════
            PREMIUM HERO CARD - Standardized Size
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br ${greeting.color} shadow-xl`}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20" />
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full blur-2xl" />

          <div className="relative z-10">
            {/* User Info */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg shrink-0"
                >
                  <span className="text-2xl sm:text-3xl font-bold text-white">{firstName[0]}</span>
                </motion.div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/70 text-xs sm:text-sm font-medium mb-1">{greeting.text} {greeting.emoji}</p>
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{firstName}</h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                    <p className="text-white/80 text-xs font-semibold">Active Student</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
                <p className="text-2xl sm:text-3xl font-bold text-white">{statistics.totalTestsTaken}</p>
                <p className="text-white/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mt-1">Tests Taken</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
                <p className="text-2xl sm:text-3xl font-bold text-white">{statistics.averageScore}%</p>
                <p className="text-white/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mt-1">Avg Score</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
                <p className="text-2xl sm:text-3xl font-bold text-white">{passRate}%</p>
                <p className="text-white/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mt-1">Pass Rate</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            QUICK ACTIONS - Native App Style Cards
            ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">Quick Actions</h3>

          {/* Primary CTA */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/student/exams?type=full_mock")}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-left flex items-center gap-4 shadow-lg shadow-indigo-500/25 active:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-white">Start Mock Test</h4>
              <p className="text-sm text-indigo-200">Full exam simulation with timer</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70 shrink-0" />
          </motion.button>

          {/* Secondary Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                title: "Results",
                subtitle: "View analytics",
                icon: BarChart3,
                path: "/student/results",
                gradient: "from-emerald-500 to-teal-600",
                bg: "bg-emerald-50",
                iconColor: "text-emerald-600"
              },
              {
                title: "Topic Tests",
                subtitle: "Practice by topic",
                icon: Target,
                path: "/student/exams?type=topic_wise",
                gradient: "from-blue-500 to-cyan-600",
                bg: "bg-blue-50",
                iconColor: "text-blue-600"
              },
              {
                title: "Study Notes",
                subtitle: "Read materials",
                icon: FileText,
                path: "/student/notes",
                gradient: "from-amber-500 to-orange-600",
                bg: "bg-amber-50",
                iconColor: "text-amber-600"
              },
              {
                title: "All Exams",
                subtitle: `${statistics.availableExams} available`,
                icon: BookOpen,
                path: "/student/exams",
                gradient: "from-purple-500 to-pink-600",
                bg: "bg-purple-50",
                iconColor: "text-purple-600"
              }
            ].map((action, idx) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + idx * 0.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(action.path)}
                className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md text-left transition-all active:bg-slate-50"
              >
                <div className={`w-11 h-11 rounded-xl ${action.bg} flex items-center justify-center mb-3`}>
                  <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{action.title}</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{action.subtitle}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            PROGRESS OVERVIEW - Detailed Stats
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Your Progress</h3>
              <p className="text-xs text-slate-500">Keep up the great work!</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Tests Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-600">Tests Completed</span>
                <span className="font-bold text-slate-900">{Math.min(statistics.totalTestsTaken, 10)}/10</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(statistics.totalTestsTaken * 10, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                />
              </div>
            </div>

            {/* Pass Rate Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-600">Pass Rate</span>
                <span className="font-bold text-slate-900">{passRate}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${passRate}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className={`h-full rounded-full ${passRate >= 60 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
                />
              </div>
            </div>

            {/* Average Score */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-600">Average Score</span>
                <span className="font-bold text-slate-900">{statistics.averageScore}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${statistics.averageScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            DAILY MOTIVATION
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-base mb-1">Daily Inspiration</h4>
              <p className="text-slate-300 text-sm leading-relaxed italic">"{dailyQuote}"</p>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            EXAM CATEGORIES - Horizontal Scroll
            ═══════════════════════════════════════════════════════════════ */}
        {isApproved && exams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Exam</h3>
              <button
                onClick={() => navigate("/student/exams")}
                className="text-indigo-600 text-xs font-bold flex items-center gap-1"
              >
                See All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {exams.map((exam, idx) => (
                <motion.button
                  key={exam.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/student/exams?exam=${exam.id}`)}
                  className="shrink-0 px-5 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3 active:bg-slate-50 transition-all min-w-[160px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm whitespace-nowrap">{exam.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SUPPORT CHAT SECTION - Inline Card
            ═══════════════════════════════════════════════════════════════ */}
        {isApproved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Support</h3>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowChat(true)}
              className="w-full p-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-left flex items-center gap-4 shadow-lg shadow-indigo-500/25 active:shadow-md transition-all relative overflow-hidden"
            >
              {/* Background decorations */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-1/2 w-20 h-20 bg-white/5 rounded-full blur-xl" />

              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 relative z-10">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <h4 className="text-base font-bold text-white">Chat with Support</h4>
                <p className="text-sm text-indigo-200">Get help from our team</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70 shrink-0 relative z-10" />
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Chat Component */}
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