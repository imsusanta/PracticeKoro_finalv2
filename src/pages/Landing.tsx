import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, FileText, TrendingUp, Sparkles, LogOut, User, Clock, Award, PlayCircle, ChevronRight, CheckCircle, UserPlus, Library, LineChart, Target, FileQuestion, Zap, ArrowRight, Trophy, Download, Smartphone } from "lucide-react";
import HowItWorks from "@/components/landing/HowItWorks";
import Footer from "@/components/landing/Footer";
import SplashScreen from "@/components/landing/SplashScreen";
import PWAInstallPrompt from "@/components/landing/PWAInstallPrompt";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";

interface Exam {
  id: string;
  name: string;
  description: string | null;
}
interface MockTest {
  id: string;
  title: string;
  description: string | null;
  test_type: "full_mock" | "topic_wise";
  duration_minutes: number;
  total_marks: number;
  exams?: {
    name: string;
  };
}

// Demo data for landing page (shown when database is not accessible)
const demoExams: Exam[] = [
  { id: "demo-1", name: "WBCS", description: "West Bengal Civil Service Examination" },
  { id: "demo-2", name: "SSC CGL", description: "Staff Selection Commission Combined Graduate Level" },
  { id: "demo-3", name: "Banking PO", description: "Probationary Officer Examination" },
  { id: "demo-4", name: "Railway RRB", description: "Railway Recruitment Board Exams" },
  { id: "demo-5", name: "UPSC", description: "Union Public Service Commission" },
  { id: "demo-6", name: "State PSC", description: "State Public Service Commission Exams" },
];

const demoTests: MockTest[] = [
  { id: "demo-t1", title: "WBCS Prelims Full Mock Test 1", description: "Complete practice test covering all subjects", test_type: "full_mock", duration_minutes: 120, total_marks: 200, exams: { name: "WBCS" } },
  { id: "demo-t2", title: "General Knowledge Practice", description: "Topic-wise GK questions", test_type: "topic_wise", duration_minutes: 30, total_marks: 50, exams: { name: "WBCS" } },
  { id: "demo-t3", title: "SSC CGL Tier 1 Mock", description: "Full length mock test for SSC CGL", test_type: "full_mock", duration_minutes: 60, total_marks: 200, exams: { name: "SSC CGL" } },
  { id: "demo-t4", title: "Reasoning Ability Test", description: "Practice logical reasoning questions", test_type: "topic_wise", duration_minutes: 45, total_marks: 75, exams: { name: "Banking" } },
  { id: "demo-t5", title: "English Language Practice", description: "Grammar and comprehension test", test_type: "topic_wise", duration_minutes: 30, total_marks: 50, exams: { name: "SSC CGL" } },
  { id: "demo-t6", title: "Quantitative Aptitude Mock", description: "Mathematics practice test", test_type: "topic_wise", duration_minutes: 45, total_marks: 75, exams: { name: "Banking" } },
];

const Landing = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<"student" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [featuredTests, setFeaturedTests] = useState<MockTest[]>([]);
  const [filterType, setFilterType] = useState<"all" | "full_mock" | "topic_wise">("all");
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    checkAuth();
    loadExams();
    loadFeaturedTests();
  }, []);
  const checkAuth = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (session) {
      // Check for student role first
      const { data: studentRole } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "student").maybeSingle();

      if (studentRole) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUserProfile(profileData);
        setUserRole("student");
        setIsLoggedIn(true);
      } else {
        // Check for admin role
        const { data: adminRole } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();

        if (adminRole) {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
          setUserProfile(profileData);
          setUserRole("admin");
          setIsLoggedIn(true);
        }
      }
    }
    setLoading(false);
  };
  const loadExams = async () => {
    const {
      data
    } = await supabase.from("exams").select("id, name, description").eq("is_active", true).order("name");
    if (data && data.length > 0) {
      // Filter to show only exams marked for landing page visibility
      const { getVisibleExamIds } = await import("@/config/landingVisibility");
      const visibleIds = getVisibleExamIds();
      if (visibleIds.length > 0) {
        const visibleExams = data.filter(exam => visibleIds.includes(exam.id));
        setExams(visibleExams.length > 0 ? visibleExams : data);
      } else {
        setExams(data);
      }
    } else {
      // Show demo exams for non-logged-in users
      setExams(demoExams);
    }
  };
  const loadFeaturedTests = async () => {
    const {
      data
    } = await supabase.from("mock_tests").select("id, title, description, test_type, duration_minutes, total_marks, exams(name)").eq("is_published", true).order("created_at", {
      ascending: false
    }).limit(8);
    if (data && data.length > 0) {
      // Filter to show only tests marked for landing page visibility
      const { getVisibleTestIds } = await import("@/config/landingVisibility");
      const visibleIds = getVisibleTestIds();
      if (visibleIds.length > 0) {
        const visibleTests = data.filter(test => visibleIds.includes(test.id));
        setFeaturedTests(visibleTests.length > 0 ? visibleTests : data);
      } else {
        setFeaturedTests(data);
      }
    } else {
      // Show demo tests for non-logged-in users
      setFeaturedTests(demoTests);
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserProfile(null);
    setUserRole(null);
  };
  const handleStartTest = (testId: string) => {
    if (isLoggedIn) {
      navigate(`/student/take-test/${testId}`);
    } else {
      navigate("/login");
    }
  };
  const filteredTests = filterType === "all" ? featuredTests : featuredTests.filter(test => test.test_type === filterType);

  return (
    <>
      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Main Content */}
      <AnimatePresence>
        {!showSplash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-[#FAFAFA]"
          >
            {/* Desktop Header - Premium Floating Style (Non-Sticky) */}
            <header className="hidden md:block absolute top-0 left-0 right-0 z-50">
              <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl rounded-2xl px-6 py-3 border border-gray-200/50 shadow-lg shadow-gray-200/30">
                  {/* Logo */}
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">Practice Koro</h1>
                  </div>

                  {/* Right Side */}
                  {!loading && <div className="flex items-center gap-3">
                    {isLoggedIn && userProfile ? <>
                      <span className="text-gray-600 font-medium text-sm">
                        Hi, <span className="text-emerald-600">{userProfile.full_name?.split(' ')[0]}</span>
                      </span>
                      <Button variant="outline" size="sm" onClick={() => navigate(userRole === "admin" ? "/admin/dashboard" : "/student/dashboard")} className="rounded-xl text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                        <User className="w-4 h-4 mr-2" />
                        {userRole === "admin" ? "Admin Panel" : "Dashboard"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50">
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </> : <>
                      <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="rounded-xl text-gray-600 hover:text-emerald-700 font-medium">
                        Log In
                      </Button>
                      <Button variant="default" size="sm" onClick={() => navigate("/register")} className="rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-95 transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                        Get Started
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </>}
                  </div>}
                </div>
              </div>
            </header>

            {/* Hero Section with Integrated Header (Mobile only) */}
            <section className="relative min-h-[100dvh] flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-8 overflow-hidden">
              {/* Floating Decorative Icons - Desktop Only */}
              <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden">
                {/* Top Left */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="absolute top-[15%] left-[5%] md:left-[10%]"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center shadow-lg shadow-purple-200/50 rotate-12">
                    <Brain className="w-7 h-7 md:w-8 md:h-8 text-purple-500" />
                  </div>
                </motion.div>

                {/* Top Right */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="absolute top-[20%] right-[5%] md:right-[12%]"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-lg shadow-blue-200/50 -rotate-12">
                    <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-blue-500" />
                  </div>
                </motion.div>

                {/* Middle Left */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="absolute top-[45%] left-[3%] md:left-[8%]"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shadow-lg shadow-orange-200/50 rotate-6">
                    <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                  </div>
                </motion.div>

                {/* Middle Right */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                  className="absolute top-[50%] right-[3%] md:right-[8%]"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shadow-lg shadow-emerald-200/50 -rotate-6">
                    <Award className="w-6 h-6 md:w-7 md:h-7 text-emerald-500" />
                  </div>
                </motion.div>

                {/* Bottom Left */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.3 }}
                  className="absolute bottom-[25%] left-[8%] md:left-[15%]"
                >
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center shadow-lg shadow-pink-200/50 rotate-12">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />
                  </div>
                </motion.div>

                {/* Bottom Right */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.5 }}
                  className="absolute bottom-[20%] right-[10%] md:right-[18%]"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center shadow-lg shadow-teal-200/50 -rotate-12">
                    <FileText className="w-5 h-5 md:w-6 md:h-6 text-teal-500" />
                  </div>
                </motion.div>
              </div>

              {/* Mobile App Header - Enhanced Native Style */}
              <div className="md:hidden">
                <div className="px-5 pt-4 pb-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/40"
                    >
                      <Zap className="w-6 h-6 text-white" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <span className="text-xl font-bold text-gray-900 tracking-tight block leading-tight">Practice Koro</span>
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> #1 Mock Test Platform
                      </span>
                    </motion.div>
                  </div>
                  {!isLoggedIn ? (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => navigate("/login")}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[9px] font-medium text-gray-500">Sign In</span>
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base cursor-pointer shadow-lg shadow-emerald-500/30 ring-2 ring-white"
                      onClick={() => navigate(userRole === "admin" ? "/admin/dashboard" : "/student/dashboard")}
                    >
                      {userProfile?.full_name?.[0]?.toUpperCase() || "U"}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Mobile App Content */}
              <div className="md:hidden flex-1 px-5 pb-8 flex flex-col overflow-y-auto">
                {/* Welcome Card - 3D Style */}
                <motion.div
                  initial={{ opacity: 0, y: 30, rotateX: 10 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-[28px] p-6 mb-6 relative overflow-hidden shadow-2xl shadow-emerald-500/30"
                >
                  {/* Animated decorative elements */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                    className="absolute -bottom-12 -left-12 w-36 h-36 bg-white rounded-full"
                  />
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-4 right-6"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                          {new Date().getHours() < 12 ? "🌅 Good Morning" : new Date().getHours() < 17 ? "☀️ Good Afternoon" : "🌙 Good Evening"}
                        </span>
                      </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white mb-2 leading-tight">Ready to Ace Your Exams?</h2>
                    <p className="text-emerald-100 text-sm mb-5 leading-relaxed max-w-[260px]">
                      Start practicing with our curated mock tests and study materials.
                    </p>
                    {!isLoggedIn ? (
                      <Button
                        onClick={() => navigate("/register")}
                        className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl px-6 py-3 shadow-xl active:scale-95 transition-all text-sm"
                      >
                        Get Started Free
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate(userRole === "admin" ? "/admin/dashboard" : "/student/dashboard")}
                        className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl px-6 py-3 shadow-xl active:scale-95 transition-all text-sm"
                      >
                        Continue Practice
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </motion.div>

                {/* Quick Actions - Enhanced */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
                    <span className="text-xs text-gray-400">Tap to explore</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: BookOpen, label: "Exams", color: "from-blue-500 to-indigo-600", bgLight: "bg-blue-50", path: "/student/exams" },
                      { icon: FileText, label: "PDFs", color: "from-orange-500 to-red-500", bgLight: "bg-orange-50", path: "/student/pdfs" },
                      { icon: Trophy, label: "Results", color: "from-purple-500 to-pink-600", bgLight: "bg-purple-50", path: "/student/results" },
                    ].map((item, index) => (
                      <motion.button
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => isLoggedIn ? navigate(item.path) : navigate("/login")}
                        className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl ${item.bgLight} border border-gray-100/50 shadow-sm`}
                      >
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Stats Row - Premium Style */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="grid grid-cols-3 gap-3 mb-6"
                >
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-2 shadow-md">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{featuredTests.length}+</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase">Tests</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2 shadow-md">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{exams.length}+</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase">Exams</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-2 shadow-md">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">50+</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase">PDFs</p>
                  </div>
                </motion.div>

                {/* Featured Tests - Enhanced Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="flex-1"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-gray-900">Featured Tests</h3>
                    <button onClick={() => isLoggedIn ? navigate("/student/exams") : navigate("/login")} className="text-xs font-semibold text-emerald-600 flex items-center gap-1 hover:text-emerald-700">
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {featuredTests.slice(0, 4).map((test, index) => (
                      <motion.div
                        key={test.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 + index * 0.08 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStartTest(test.id)}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-md flex items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${test.test_type === "full_mock"
                          ? "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600"
                          : "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
                          }`}>
                          {test.test_type === "full_mock" ? <Award className="w-7 h-7 text-white" /> : <BookOpen className="w-7 h-7 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${test.test_type === "full_mock"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-orange-100 text-orange-700"
                              }`}>
                              {test.test_type === "full_mock" ? "Full Mock" : "Topic-wise"}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm truncate">{test.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" />{test.duration_minutes} min</span>
                            <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5 text-emerald-500" />{test.total_marks} marks</span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                          <PlayCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Desktop Hero Content - Unchanged */}
              <div className="hidden md:flex flex-1 container mx-auto px-4 flex-col items-center justify-center relative z-10">
                {/* Centered Hero Content */}
                <div className="text-center max-w-2xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-6"
                  >
                    <Badge className="bg-emerald-100/80 text-emerald-700 border-emerald-200/50 backdrop-blur-sm shadow-sm py-1.5 px-4 text-xs font-semibold uppercase tracking-wider">
                      #1 Mock Test Platform
                    </Badge>

                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                      Master Your Exams
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                        Simply & Effectively
                      </span>
                    </h2>

                    <p className="text-lg sm:text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
                      Top-quality mock tests and AI-powered practice to boost your scores.
                    </p>

                    {!isLoggedIn ? (
                      <div className="flex flex-col gap-3 items-center pt-4">
                        <Button
                          size="lg"
                          variant="default"
                          onClick={() => navigate("/register")}
                          className="text-base font-semibold py-6 px-8 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition-all duration-200 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        >
                          Get Started Free
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                        <p className="text-xs text-gray-400 font-medium">
                          No credit card required
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-center pt-4">
                        <Button
                          size="lg"
                          variant="default"
                          onClick={() => navigate(userRole === "admin" ? "/admin/dashboard" : "/student/dashboard")}
                          className="text-base font-semibold py-6 px-8 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition-all duration-200 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        >
                          {userRole === "admin" ? "Go to Admin Panel" : "Go to Dashboard"}
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Exams Section - Mobile Friendly */}
            <section className="py-8 md:py-16 lg:py-24 bg-white">
              <div className="container mx-auto">
                {/* Section Header */}
                <div className="text-center mb-6 md:mb-10 px-4">
                  <Badge className="mb-3 bg-emerald-100/80 text-emerald-700 border-emerald-200/50 py-1 px-3 text-[10px] font-semibold uppercase tracking-wider">
                    Exam Categories
                  </Badge>
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2">
                    Available <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Exams</span>
                  </h3>
                  <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
                    Choose from our exam categories
                  </p>
                </div>

                {exams.length === 0 ? (
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Mobile: Horizontal Scroll Cards */}
                    <div className="md:hidden overflow-x-auto pb-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <div className="flex gap-3" style={{ width: 'max-content' }}>
                        {exams.map((exam, index) => (
                          <motion.div
                            key={exam.id}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            viewport={{ once: true }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => isLoggedIn ? navigate("/student/exams") : navigate("/login")}
                            className="w-[160px] shrink-0 bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-4 cursor-pointer shadow-sm active:shadow-md transition-all"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">
                              {exam.name}
                            </h4>
                            <div className="flex items-center text-emerald-600 text-xs font-medium">
                              <span>View</span>
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Desktop: Grid Layout */}
                    <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
                      {exams.map((exam, index) => (
                        <motion.div
                          key={exam.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <div
                            onClick={() => isLoggedIn ? navigate("/student/exams") : navigate("/login")}
                            className="group h-full bg-white border-2 border-emerald-100 hover:border-emerald-300 rounded-3xl p-6 cursor-pointer hover:shadow-xl hover:shadow-emerald-100/50 hover:-translate-y-1 transition-all duration-300"
                          >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:from-emerald-200 group-hover:to-teal-200 transition-all">
                              <BookOpen className="w-7 h-7 text-emerald-600" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                              {exam.name}
                            </h4>
                            {exam.description && (
                              <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                {exam.description}
                              </p>
                            )}
                            <div className="flex items-center text-emerald-600 font-medium text-sm group-hover:text-emerald-700">
                              <span>Explore</span>
                              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Featured Tests Section - Premium Redesign */}
            <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-10 -left-10 w-52 sm:w-80 h-52 sm:h-80 bg-gradient-to-br from-emerald-200/40 to-teal-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -right-10 w-60 sm:w-96 h-60 sm:h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-blue-100/30 to-cyan-100/20 rounded-full blur-3xl" />
              </div>

              <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-6 sm:mb-10">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200 rounded-full px-3 py-1.5 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 text-xs font-medium">Practice Tests</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                      Featured <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Mock Tests</span>
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto px-2">
                      Handpicked tests to boost your preparation
                    </p>
                  </motion.div>
                </div>

                {/* Filter Tabs - Compact Mobile Style */}
                <div className="flex justify-center mb-6 sm:mb-8 overflow-x-auto pb-1 -mx-2 px-2">
                  <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200 shadow-sm">
                    {[
                      { key: "all", label: "All", icon: Target },
                      { key: "full_mock", label: "Full", icon: Award },
                      { key: "topic_wise", label: "Topic", icon: BookOpen },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setFilterType(tab.key as any)}
                        className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${filterType === tab.key
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tests Grid */}
                {filteredTests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <FileQuestion className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No tests available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
                    {filteredTests.map((test, index) => (
                      <motion.div
                        key={test.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <div className="group relative bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg shadow-gray-100/50 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-500 overflow-hidden sm:hover:-translate-y-2 active:scale-[0.98] sm:active:scale-100">
                          {/* Glow Effect on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/30 transition-all duration-500" />

                          {/* Top Gradient Bar */}
                          <div className={`h-1.5 w-full ${test.test_type === "full_mock"
                            ? "bg-gradient-to-r from-purple-500 via-violet-500 to-purple-400"
                            : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"
                            }`} />

                          <div className="p-4 sm:p-5 relative">
                            {/* Header Row */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${test.test_type === "full_mock"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                                }`}>
                                {test.test_type === "full_mock" ? (
                                  <><Award className="w-3.5 h-3.5" /> Full Mock</>
                                ) : (
                                  <><BookOpen className="w-3.5 h-3.5" /> Topic-wise</>
                                )}
                              </span>
                              <div className="flex items-center gap-1 text-emerald-600 text-xs">
                                <Zap className="w-3.5 h-3.5" />
                                <span>Quick Start</span>
                              </div>
                            </div>

                            {/* Title & Description */}
                            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                              {test.title}
                            </h4>
                            {test.description && (
                              <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 mb-3">
                                {test.description}
                              </p>
                            )}

                            {/* Stats Row */}
                            <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                              <div className="inline-flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-gray-700 text-xs font-medium">{test.duration_minutes} min</span>
                              </div>
                              <div className="inline-flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5">
                                <Target className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-gray-700 text-xs font-medium">{test.total_marks} marks</span>
                              </div>
                            </div>

                            {/* Exam Badge */}
                            {test.exams?.name && (
                              <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
                                <FileText className="w-3 h-3" />
                                <span>{test.exams.name}</span>
                              </div>
                            )}

                            {/* CTA Button */}
                            <Button
                              onClick={() => handleStartTest(test.id)}
                              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl py-3 sm:py-4 text-sm shadow-lg shadow-emerald-500/20 transition-all duration-300"
                            >
                              <PlayCircle className="w-4 h-4 mr-1.5" />
                              Start Test
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* View All Button */}
                {filteredTests.length > 0 && (
                  <div className="text-center mt-6 sm:mt-8">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/login")}
                      className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-8 py-5"
                    >
                      View All Tests
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </section>

            {/* Features Section */}
            <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200/30 to-teal-200/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-purple-200/25 to-pink-200/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-100/20 to-cyan-100/15 rounded-full blur-3xl" />
              </div>

              <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <Badge className="mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 py-1.5 px-4 text-xs font-semibold uppercase tracking-wider shadow-lg shadow-emerald-500/25">
                      ✨ Features
                    </Badge>
                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                      Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500">Practice Koro?</span>
                    </h3>
                    <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto">
                      A complete exam preparation toolkit designed to help you learn smarter, practice better, and track every improvement.
                    </p>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {/* Feature 1 - AI - Purple Theme */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0 }}
                    viewport={{ once: true }}
                    className="group relative bg-white/80 backdrop-blur-sm border border-purple-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-purple-200/40 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                  >
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Floating Decoration */}
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-200/40 to-pink-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/30">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">
                        Instant Results & Explanations
                      </h4>
                      <p className="text-gray-500 leading-relaxed">
                        Get detailed results immediately after each test with question-wise explanations to learn from mistakes.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-purple-600 font-medium text-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <Sparkles className="w-4 h-4" />
                        <span>Learn Faster</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature 2 - Mock Tests - Blue Theme */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="group relative bg-white/80 backdrop-blur-sm border border-blue-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-blue-200/40 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-cyan-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-200/40 to-cyan-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-blue-500/30">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                        Real Exam-like Mock Tests
                      </h4>
                      <p className="text-gray-500 leading-relaxed">
                        Practice with full-length and topic-wise mocks that mirror real exam patterns, timing, and difficulty.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <Clock className="w-4 h-4" />
                        <span>Timed Practice</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature 3 - Study Materials - Orange Theme */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="group relative bg-white/80 backdrop-blur-sm border border-orange-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-orange-200/40 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-transparent to-amber-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-orange-200/40 to-amber-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-orange-500/30">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-700 transition-colors">
                        Curated Study Materials
                      </h4>
                      <p className="text-gray-500 leading-relaxed">
                        Organized PDFs and notes by exam and topic so you can revise fast without wasting time searching.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-orange-600 font-medium text-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <Library className="w-4 h-4" />
                        <span>Organized Library</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature 4 - Progress - Emerald Theme */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="group relative bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-emerald-200/40 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-teal-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-200/40 to-teal-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-emerald-500/30">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                        Smart Progress Tracking
                      </h4>
                      <p className="text-gray-500 leading-relaxed">
                        See your scores, strengths, and weak areas clearly so you always know what to improve next.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-emerald-600 font-medium text-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <LineChart className="w-4 h-4" />
                        <span>Visual Analytics</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <HowItWorks />

            {/* CTA Section */}
            {!isLoggedIn && (
              <section className="relative py-16 sm:py-20 md:py-24 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 overflow-hidden">
                {/* Floating Icons */}
                <div className="absolute inset-0 pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="absolute top-[20%] left-[8%] md:left-[15%]"
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center rotate-12">
                      <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-white/80" />
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="absolute bottom-[20%] right-[8%] md:right-[15%]"
                  >
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center -rotate-12">
                      <Award className="w-6 h-6 md:w-7 md:h-7 text-white/80" />
                    </div>
                  </motion.div>
                </div>

                <div className="container mx-auto px-4 text-center relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto"
                  >
                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white leading-tight">
                      Ready to Start Your Journey?
                    </h3>
                    <p className="text-lg sm:text-xl mb-8 text-white/90 max-w-xl mx-auto">
                      Join thousands of students who are already improving their exam performance with Practice Koro.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => navigate("/register")}
                      className="text-base font-semibold py-6 px-8 rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg shadow-black/10 hover:shadow-xl active:scale-95 transition-all duration-200"
                    >
                      Register Now - It's Free
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </div>
              </section>
            )}

            {/* App Download Section - PWA Promotion */}
            <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
              {/* Decorative Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-60 sm:w-96 h-60 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl" />
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-5" style={{
                  backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />
              </div>

              <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto">
                  {/* Mobile Layout */}
                  <div className="md:hidden text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      viewport={{ once: true }}
                      className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 ring-4 ring-white/10"
                    >
                      <Zap className="w-10 h-10 text-white" />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 py-1.5 px-4 text-xs font-semibold uppercase tracking-wider">
                        📱 Install Our App
                      </Badge>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
                        Get the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Practice Koro</span> App
                      </h3>
                      <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                        Install our app for faster access, offline support, and a native app experience!
                      </p>
                    </motion.div>

                    {/* Feature Pills - Mobile */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      viewport={{ once: true }}
                      className="flex flex-wrap justify-center gap-2 mb-6"
                    >
                      {[
                        { icon: "⚡", text: "Instant Load" },
                        { icon: "🌐", text: "Works Online" },
                        { icon: "🔔", text: "Notifications" },
                        { icon: "🚀", text: "No App Store" },
                      ].map((feature) => (
                        <div key={feature.text} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                          <span className="text-sm">{feature.icon}</span>
                          <span className="text-xs font-medium text-gray-300">{feature.text}</span>
                        </div>
                      ))}
                    </motion.div>

                    {/* Install Button - Mobile */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      viewport={{ once: true }}
                    >
                      <Button
                        size="lg"
                        onClick={() => {
                          // Trigger PWA install or show popup
                          const event = new CustomEvent('show-pwa-prompt');
                          window.dispatchEvent(event);
                        }}
                        className="w-full sm:w-auto text-base font-bold py-5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl shadow-emerald-500/25 active:scale-95 transition-all"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Install App
                      </Button>
                      <p className="text-xs text-gray-500 mt-3">
                        Works on Android & iOS
                      </p>
                    </motion.div>
                  </div>

                  {/* Desktop Layout - Side by Side */}
                  <div className="hidden md:flex items-center gap-12 lg:gap-16">
                    {/* Left - App Preview Mock */}
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6 }}
                      viewport={{ once: true }}
                      className="flex-1 relative"
                    >
                      <div className="relative mx-auto w-64">
                        {/* Phone Frame */}
                        <div className="bg-gray-800 rounded-[40px] p-3 shadow-2xl ring-1 ring-white/10">
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[28px] overflow-hidden aspect-[9/16] relative">
                            {/* Status Bar */}
                            <div className="h-6 bg-white/90 flex items-center justify-center">
                              <div className="w-16 h-4 bg-black rounded-full" />
                            </div>
                            {/* App Content Preview */}
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                  <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <div className="h-4 bg-gray-900 rounded w-24 mb-1" />
                                  <div className="h-3 bg-emerald-500 rounded w-32" />
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-lg">
                                <div className="h-3 bg-white/30 rounded w-2/3 mb-2" />
                                <div className="h-4 bg-white rounded w-full mb-1" />
                                <div className="h-4 bg-white/80 rounded w-3/4" />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 mb-2" />
                                    <div className="h-2 bg-gray-200 rounded w-full" />
                                  </div>
                                ))}
                              </div>
                              <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500" />
                                  <div className="flex-1">
                                    <div className="h-3 bg-gray-800 rounded w-full mb-1" />
                                    <div className="h-2 bg-gray-300 rounded w-2/3" />
                                  </div>
                                  <div className="w-8 h-8 rounded-full bg-emerald-100" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Floating Badge */}
                        <div className="absolute -top-4 -right-4 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                          FREE
                        </div>
                      </div>
                    </motion.div>

                    {/* Right - Content */}
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6 }}
                      viewport={{ once: true }}
                      className="flex-1 text-left"
                    >
                      <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 py-1.5 px-4 text-xs font-semibold uppercase tracking-wider">
                        📱 Progressive Web App
                      </Badge>
                      <h3 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                        Install <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Practice Koro</span> App
                      </h3>
                      <p className="text-gray-400 text-base lg:text-lg mb-6 max-w-md">
                        Get instant access from your home screen. No app store required - install directly from your browser!
                      </p>

                      {/* Features Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-8">
                        {[
                          { icon: Zap, text: "Lightning Fast", desc: "Instant page loads" },
                          { icon: Download, text: "Works Online", desc: "Internet required" },
                          { icon: Smartphone, text: "Native Feel", desc: "Full-screen experience" },
                          { icon: CheckCircle, text: "Auto Updates", desc: "Always latest version" },
                        ].map((feature) => (
                          <div key={feature.text} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0">
                              <feature.icon className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{feature.text}</p>
                              <p className="text-xs text-gray-500">{feature.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        size="lg"
                        onClick={() => {
                          const event = new CustomEvent('show-pwa-prompt');
                          window.dispatchEvent(event);
                        }}
                        className="text-base font-bold py-5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35 active:scale-95 transition-all"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Install App
                        <ChevronRight className="w-5 h-5 ml-1" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </section>

            <Footer />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install Prompt */}
      {!showSplash && <PWAInstallPrompt />}
    </>
  );
};
export default Landing;