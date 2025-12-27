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
      <div className="w-full max-w-2xl mx-auto space-y-3 pb-20 overflow-x-hidden">

        {/* ═══════════════════════════════════════════════════════════════
            PREMIUM HERO GREETING (REDESIGNED)
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-[28px] p-3 sm:p-4 md:p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 shadow-xl shadow-indigo-200/50"
        >
          {/* Decorative Animated Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 bg-white/20 rounded-full blur-[60px] -mr-20 -mt-20 sm:-mr-32 sm:-mt-32"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-0 left-0 w-48 h-48 bg-violet-400/30 rounded-full blur-[60px] -ml-24 -mb-24"
          />

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center border border-white/25 shadow-lg shrink-0"
                >
                  <div className="text-lg md:text-2xl font-black text-white">
                    {firstName[0]}
                  </div>
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg md:text-2xl font-black text-white tracking-tight leading-tight truncate">
                    {greeting.text}, {firstName}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest leading-none">
                      Student Active
                    </p>
                  </div>
                </div>
              </div>

              {/* Goal Progress Ring (SVG) */}
              <div className="relative w-11 h-11 sm:w-14 sm:h-14 md:w-20 md:h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <motion.circle
                    initial={{ strokeDasharray: "100 100", strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - (100 * Math.min(statistics.totalTestsTaken, 5) / 5) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="50%"
                    cy="50%"
                    r="40%"
                    fill="none"
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    style={{ strokeDasharray: "100" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] md:text-xs font-black text-white leading-none">{Math.min(statistics.totalTestsTaken, 5)}/5</span>
                  <span className="text-[6px] md:text-[7px] font-bold text-indigo-100 uppercase mt-0.5">Tests</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-1">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-5 h-5 rounded-full border-2 border-indigo-700 bg-indigo-500 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover opacity-80" />
                    </div>
                  ))}
                </div>
                <p className="text-[9px] font-bold text-indigo-100 leading-tight">
                  <span className="text-white">1.2k+</span> practicing
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/student/profile")}
                className="bg-white px-2.5 py-1.5 rounded-lg text-indigo-600 font-bold text-[9px] shadow-md whitespace-nowrap"
              >
                Profile
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            PREMIUM STATS (COMPACT GRID)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {[
            { label: "Tests", value: statistics.totalTestsTaken, icon: FileText, color: "indigo", gradient: "from-indigo-600 to-indigo-500", glow: "shadow-indigo-200" },
            { label: "Score", value: `${statistics.averageScore}%`, icon: Target, color: "violet", gradient: "from-violet-600 to-violet-500", glow: "shadow-violet-200" },
            { label: "Passed", value: statistics.testsPassed, icon: Award, color: "emerald", gradient: "from-emerald-600 to-emerald-500", glow: "shadow-emerald-200" },
            { label: "Exams", value: statistics.availableExams, icon: Sparkles, color: "amber", gradient: "from-amber-600 to-amber-500", glow: "shadow-amber-200" }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="relative group p-3 md:p-4 rounded-xl md:rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.gradient} opacity-[0.03] group-hover:opacity-[0.07] transition-opacity`} />

              <div className="relative z-10 flex items-center gap-2 md:flex-col md:items-start md:gap-3">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md ${stat.glow}`}>
                  <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 leading-none">{stat.label}</p>
                  <p className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            PREMIUM QUICK ACTION TILES
            ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-xl font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-amber-500 fill-amber-500" />
              Practice Now
            </h3>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/student/exams?type=full_mock")}
              className="relative overflow-hidden p-4 md:p-6 rounded-2xl md:rounded-[32px] bg-indigo-600 text-left group shadow-lg shadow-indigo-100 flex-1"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-12 -mt-12" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <GraduationCap className="w-5 h-5 md:w-8 md:h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm md:text-xl font-bold text-white">Full Mock Tests</h4>
                    <p className="text-[10px] md:text-xs text-indigo-100 font-medium">Complete simulation</p>
                  </div>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              </div>
            </motion.button>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/student/results")}
                className="p-3 md:p-5 rounded-xl md:rounded-[32px] bg-white border border-slate-100 shadow-sm text-left group"
              >
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-[20px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 md:mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <TrendingUp className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs md:text-sm">Analytics</h4>
                <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">Progress</p>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/student/pdfs")}
                className="p-3 md:p-5 rounded-xl md:rounded-[32px] bg-white border border-slate-100 shadow-sm text-left group"
              >
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-[20px] bg-orange-50 text-orange-600 flex items-center justify-center mb-2 md:mb-4 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                  <BookOpen className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs md:text-sm">Materials</h4>
                <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">Study Hub</p>
              </motion.button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            DAILY MOTIVATION (NEW)
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative p-6 rounded-[32px] bg-slate-900 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h4 className="text-white font-bold mb-1">Today's Motivation</h4>
              <p className="text-slate-400 text-xs leading-relaxed italic">
                Small efforts every day lead to big results. You are {statistics.totalTestsTaken > 0 ? 'doing great' : 'ready to start'}!
              </p>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            EXAM CATEGORIES (REFINED SCROLL)
            ═══════════════════════════════════════════════════════════════ */}
        {isApproved && exams.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-black text-slate-900">Explore Subjects</h3>
              <button
                onClick={() => navigate("/student/exams")}
                className="text-indigo-600 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                All Exams
              </button>
            </div>

            <div className="horizontal-scroll gap-3 pb-4 -mx-3 px-3" style={{ touchAction: 'pan-x' }}>
              {exams.map((exam, idx) => (
                <motion.button
                  key={exam.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/student/exams?exam=${exam.id}`)}
                  className="shrink-0 w-36 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm mb-1">{exam.name}</h4>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">Explore</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Support Chat Fast Action */}
        {isApproved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4"
          >
            <button
              onClick={() => setShowChat(true)}
              className="w-full h-16 rounded-[24px] bg-white border-2 border-slate-100 p-2 pr-5 flex items-center gap-4 group active:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-[18px] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-slate-900 text-sm">Student Support</p>
                <p className="text-[10px] text-slate-500 font-medium">Online & ready to help</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
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