import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

  useEffect(() => {
    const init = async () => {
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
    };
    init();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
      <div className="w-full md:max-w-4xl md:mx-auto space-y-5 pb-8 overflow-x-hidden">

        {/* ═══════════════════════════════════════════════════════════════
            GREETING HEADER - Clean Native Style
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between pt-2"
        >
          <div>
            <p className="text-slate-500 text-sm">{greeting.text} {greeting.emoji}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{firstName}</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/student/profile")}
            className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center"
          >
            <User className="w-6 h-6 text-indigo-600" />
          </motion.button>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            MAIN CTA CARD - Gradient Banner
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 rounded-3xl p-5 relative overflow-hidden"
        >
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              {currentStreak > 0 && (
                <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span className="text-sm font-bold text-white">{currentStreak} Day Streak</span>
                </div>
              )}
            </div>

            <h2 className="text-white text-xl font-bold mb-2">
              {isApproved ? "Ready to Practice?" : "Waiting for Approval"}
            </h2>
            <p className="text-white/70 text-sm mb-5">
              {isApproved
                ? "Take mock tests and improve your scores"
                : "Your account is pending approval"}
            </p>

            {isApproved ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/student/exams")}
                className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Test
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <div className="bg-amber-500/20 text-amber-200 py-4 rounded-2xl text-center font-semibold flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" />
                Approval Pending
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            STATS GRID - 2x2 Clean Cards
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Trophy, label: "Tests Passed", value: statistics.testsPassed, color: "bg-amber-500", bgColor: "bg-amber-50" },
            { icon: BarChart2, label: "Avg Score", value: `${statistics.averageScore}%`, color: "bg-indigo-500", bgColor: "bg-indigo-50" },
            { icon: CheckCircle, label: "Tests Taken", value: statistics.totalTestsTaken, color: "bg-emerald-500", bgColor: "bg-emerald-50" },
            { icon: BookOpen, label: "Exams", value: statistics.availableExams, color: "bg-blue-500", bgColor: "bg-blue-50" }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="bg-white rounded-2xl p-4 border border-slate-100"
            >
              <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            QUICK ACTIONS - Horizontal Scroll
            ═══════════════════════════════════════════════════════════════ */}
        {isApproved && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">Quick Actions</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              {[
                { icon: Play, label: "Full Mock", path: "/student/exams?type=full_mock", color: "bg-indigo-600" },
                { icon: BookOpen, label: "Topic Test", path: "/student/exams?type=topic_wise", color: "bg-emerald-600" },
                { icon: FileText, label: "PDFs", path: "/student/pdfs", color: "bg-orange-500" },
                { icon: TrendingUp, label: "Results", path: "/student/results", color: "bg-violet-600" }
              ].map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.path)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 min-w-[80px]"
                >
                  <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            EXAM CATEGORIES - List Style
            ═══════════════════════════════════════════════════════════════ */}
        {isApproved && exams.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Exam Categories</h3>
              <button
                onClick={() => navigate("/student/exams")}
                className="text-indigo-600 text-xs font-semibold flex items-center gap-0.5"
              >
                See All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {exams.slice(0, 4).map((exam, i) => (
                <motion.button
                  key={exam.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/student/exams")}
                  className="w-full bg-white rounded-2xl p-3 border border-slate-100 flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-[13px] truncate">{exam.name}</p>
                    <p className="text-[10px] text-slate-500">Tap to view tests</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            HELP CARD - Bottom Fixed Style
            ═══════════════════════════════════════════════════════════════ */}
        {isApproved && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowChat(true)}
            className="w-full bg-slate-900 rounded-2xl p-3 flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-[13px]">Need Help?</p>
              <p className="text-[10px] text-slate-400">Chat with support</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
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