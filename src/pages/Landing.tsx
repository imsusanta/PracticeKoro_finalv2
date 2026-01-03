import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  BookOpen, Brain, FileText, TrendingUp, Sparkles, LogOut, User, Clock, Award, PlayCircle, ChevronRight, CheckCircle, UserPlus, Library, LineChart, Target, FileQuestion, Zap, ArrowRight, Trophy, Download, Smartphone, Send, Mail, MapPin, Phone as PhoneIcon, Heart
} from "lucide-react";
import HowItWorks from "@/components/landing/HowItWorks";
import Footer from "@/components/landing/Footer";
import SplashScreen from "../components/landing/SplashScreen";
// import PWAInstallPrompt removed to avoid conflict with global App.tsx version
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";


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
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.clear();
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
            className="min-h-screen bg-[#FAFAFA] relative"
          >
            {/* Desktop Header - Premium Floating Style (Non-Sticky) */}
            <header className="hidden md:block absolute top-0 left-0 right-0 z-50">
              <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-200/50" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)' }}>
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform" style={{ filter: 'drop-shadow(0 3px 8px rgba(16, 185, 129, 0.3))' }}>
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
                      <Button variant="default" size="sm" onClick={() => navigate("/register")} className="rounded-xl active:scale-95 transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
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


              {/* Mobile App Header - Enhanced Native Style */}
              <div className="md:hidden">
                <div className="px-5 pt-4 pb-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center"
                      style={{ filter: 'drop-shadow(0 6px 16px rgba(16, 185, 129, 0.4))' }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-2xl bg-emerald-400"
                      />
                      <Zap className="w-6 h-6 text-white relative z-10" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <span className="text-xl font-bold text-gray-900 tracking-tight block leading-tight">Practice Koro</span>
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
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
                      className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-emerald-50 border border-emerald-100 min-w-[56px] min-h-[56px]"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700">Sign In</span>
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg cursor-pointer ring-2 ring-white"
                      style={{ filter: 'drop-shadow(0 4px 10px rgba(16, 185, 129, 0.3))' }}
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
                  className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-[28px] p-6 mb-6 relative overflow-hidden"
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
                        className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl px-6 py-3 active:scale-95 transition-all text-sm"
                      >
                        Get Started Free
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate(userRole === "admin" ? "/admin/dashboard" : "/student/dashboard")}
                        className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl px-6 py-3 active:scale-95 transition-all text-sm"
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
                    <span className="text-xs text-gray-500 font-medium">Tap to explore</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: BookOpen, label: "Exams", color: "from-blue-500 to-indigo-600", bgLight: "bg-blue-50", path: "/student/exams" },
                      { icon: FileText, label: "Notes", color: "from-orange-500 to-red-500", bgLight: "bg-orange-50", path: "/student/notes" },
                      { icon: Trophy, label: "Results", color: "from-purple-500 to-pink-600", bgLight: "bg-purple-50", path: "/student/results" },
                    ].map((item, index) => (
                      <motion.button
                        key={item.label}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 + index * 0.08, type: "spring", bounce: 0.3 }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => isLoggedIn ? navigate(item.path) : navigate("/login")}
                        className={`flex flex-col items-center gap-3 p-5 rounded-3xl ${item.bgLight} border border-gray-100/50 transition-colors`}
                      >
                        <motion.div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
                          style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))' }}
                        >
                          <item.icon className="w-6 h-6 text-white" />
                        </motion.div>
                        <span className="text-sm font-bold text-gray-700">{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Stats Row - Premium Style */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="grid grid-cols-2 gap-3 mb-6"
                >
                  <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100/50">
                    <div
                      className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center"
                      style={{ filter: 'drop-shadow(0 4px 10px rgba(59, 130, 246, 0.3))' }}
                    >
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{featuredTests.length}+</p>
                    <p className="text-[11px] text-gray-600 font-bold uppercase mt-0.5">Tests</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 via-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100/50">
                    <div
                      className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center"
                      style={{ filter: 'drop-shadow(0 4px 10px rgba(168, 85, 247, 0.3))' }}
                    >
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{exams.length}+</p>
                    <p className="text-[11px] text-gray-600 font-bold uppercase mt-0.5">Exams</p>
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
                    <button onClick={() => isLoggedIn ? navigate("/student/exams") : navigate("/login")} className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:text-emerald-800">
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
                        className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-gray-200 transition-colors"
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${test.test_type === "full_mock"
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
                    <Badge className="bg-emerald-100/80 text-emerald-700 border-emerald-200/50 backdrop-blur-sm py-1.5 px-4 text-xs font-semibold uppercase tracking-wider">
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
                          className="text-base font-semibold py-6 px-8 rounded-2xl active:scale-95 transition-all duration-200 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
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
                          className="text-base font-semibold py-6 px-8 rounded-2xl active:scale-95 transition-all duration-200 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        >
                          {userRole === "admin" ? "Go to Admin Panel" : "Go to Dashboard"}
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </section >

            {/* Exams Section - Mobile Friendly */}
            < section className="py-8 md:py-16 lg:py-24 bg-white" >
              <div className="container mx-auto">
                {/* Section Header */}
                <div className="text-center mb-6 md:mb-10 px-4">
                  <Badge className="mb-3 bg-emerald-100/80 text-emerald-700 border-emerald-200/50 py-1 px-3 text-[10px] font-semibold uppercase tracking-wider">
                    Exam Categories
                  </Badge>
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2">
                    Available <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Exams</span>
                  </h3>
                  <p className="text-gray-600 text-sm md:text-base font-medium max-w-xl mx-auto">
                    Choose from our exam categories
                  </p>
                </div>

                {exams.length === 0 ? (
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  /* Horizontal Scroll Cards - All Screen Sizes - Centered */
                  <div className="w-full flex justify-center">
                    <div className="overflow-x-auto pb-4 scrollbar-hide max-w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <div className="flex gap-4 px-4 md:px-8 justify-start md:justify-center" style={{ minWidth: 'min-content' }}>
                        {exams.map((exam, index) => (
                          <motion.div
                            key={exam.id}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            viewport={{ once: true }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => isLoggedIn ? navigate("/student/exams") : navigate("/login")}
                            className="min-w-[180px] w-[180px] md:min-w-[220px] md:w-[220px] shrink-0 bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-3xl p-5 cursor-pointer hover:border-emerald-200 transition-all"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3" style={{ filter: 'drop-shadow(0 3px 10px rgba(16, 185, 129, 0.25))' }}>
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-base md:text-lg font-bold text-gray-900 mb-2 leading-tight">
                              {exam.name}
                            </h4>
                            <div className="flex items-center text-emerald-600 text-sm font-semibold">
                              <span>Explore Now</span>
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section >

            {/* Featured Tests Section - Premium Redesign */}
            <section className="py-14 sm:py-20 md:py-28 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
              {/* Decorative Background Elements */}
              < div className="absolute inset-0 overflow-hidden pointer-events-none" >
                <div className="absolute -top-10 -left-10 w-52 sm:w-80 h-52 sm:h-80 bg-gradient-to-br from-emerald-200/40 to-teal-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -right-10 w-60 sm:w-96 h-60 sm:h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-blue-100/30 to-cyan-100/20 rounded-full blur-3xl" />
              </div >

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
                  <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200">
                    {[
                      { key: "all", label: "All", icon: Target },
                      { key: "full_mock", label: "Full", icon: Award },
                      { key: "topic_wise", label: "Topic", icon: BookOpen },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setFilterType(tab.key as any)}
                        className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${filterType === tab.key
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
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
                        <div className="group relative bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:border-emerald-300 transition-all duration-200 overflow-hidden sm:hover:-translate-y-1 active:scale-[0.98] sm:active:scale-100">
                          {/* Glow Effect on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/30 transition-all duration-200" />

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
                              <p className="text-gray-600 text-xs sm:text-sm font-medium line-clamp-2 mb-3">
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
                              <div className="flex items-center gap-1.5 text-gray-600 text-xs font-semibold mb-3">
                                <FileText className="w-3 h-3" />
                                <span>{test.exams.name}</span>
                              </div>
                            )}

                            {/* CTA Button */}
                            <Button
                              onClick={() => handleStartTest(test.id)}
                              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl py-6 text-base transition-all duration-150"
                            >
                              <PlayCircle className="w-5 h-5 mr-2" />
                              Start Test
                              <ChevronRight className="w-5 h-5 ml-1" />
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
            </section >

            {/* Features Section - Modern Bento Grid Design */}
            <section id="features" className="py-20 sm:py-28 bg-slate-50">
              <div className="container mx-auto px-5">
                {/* Section Header - Clean & Minimal */}
                <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                      Why Choose Us
                    </span>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                      Everything You Need to{' '}
                      <span className="text-emerald-600">Succeed</span>
                    </h3>
                    <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
                      A complete learning ecosystem designed to help you crack your dream exam
                    </p>
                  </motion.div>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
                  {/* Card 1 - Large */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    viewport={{ once: true }}
                    className="col-span-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                    <div className="relative z-10">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-bold mb-2">Instant Results</h4>
                      <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                        Get detailed scorecards and explanations immediately after every test
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 2 - Small */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="col-span-1 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1">Updated Content</h4>
                    <p className="text-slate-500 text-[11px] sm:text-xs">Latest exam patterns</p>
                  </motion.div>

                  {/* Card 3 - Small */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    viewport={{ once: true }}
                    className="col-span-1 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                      <Library className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1">Study Vault</h4>
                    <p className="text-slate-500 text-[11px] sm:text-xs">Curated PDFs & notes</p>
                  </motion.div>

                  {/* Card 4 - Small */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="col-span-1 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                      <LineChart className="w-5 h-5 text-orange-600" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1">AI Analytics</h4>
                    <p className="text-slate-500 text-[11px] sm:text-xs">Track your progress</p>
                  </motion.div>

                  {/* Card 5 - Small */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    viewport={{ once: true }}
                    className="col-span-1 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center mb-3">
                      <Target className="w-5 h-5 text-rose-600" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1">Topic-wise</h4>
                    <p className="text-slate-500 text-[11px] sm:text-xs">Focused practice</p>
                  </motion.div>

                  {/* Card 6 - Large Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="col-span-2 bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-6 sm:gap-8">
                        <div>
                          <p className="text-3xl sm:text-4xl font-bold text-emerald-400">1000+</p>
                          <p className="text-white/60 text-xs sm:text-sm">Mock Tests</p>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div>
                          <p className="text-3xl sm:text-4xl font-bold text-emerald-400">50K+</p>
                          <p className="text-white/60 text-xs sm:text-sm">Students</p>
                        </div>
                        <div className="w-px h-10 bg-white/20 hidden sm:block" />
                        <div className="hidden sm:block">
                          <p className="text-3xl sm:text-4xl font-bold text-emerald-400">95%</p>
                          <p className="text-white/60 text-xs sm:text-sm">Success Rate</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <HowItWorks />


            {/* App Download Section - Green & White Theme with Phone Mockup */}
            <section className="py-16 sm:py-24 bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative">
              {/* Subtle Background Decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-100 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-60" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-100 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 opacity-60" />
              </div>

              <div className="container mx-auto px-5 relative z-10">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 lg:gap-14">

                  {/* Left - Phone Mockup */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="flex-1 relative order-2 md:order-1 mt-12 md:mt-0 pl-6 pr-14 sm:pl-10 sm:pr-20 py-12"
                  >
                    <div className="relative mx-auto w-52 sm:w-56 lg:w-60 overflow-visible">
                      {/* Outer Glow */}
                      <div className="absolute inset-0 bg-emerald-200/30 rounded-[2.5rem] blur-2xl scale-110" />

                      {/* Phone Container */}
                      <div className="relative bg-slate-800 rounded-[2.5rem] p-2 ring-1 ring-slate-700 z-10">
                        {/* Speaker/Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-xl z-30 flex items-center justify-center">
                          <div className="w-8 h-1 bg-slate-700 rounded-full" />
                        </div>

                        {/* Screen Content */}
                        <div className="bg-white rounded-[2rem] overflow-hidden aspect-[9/18] relative select-none touch-none">
                          {/* App Preview */}
                          <div className="p-3 pt-7 space-y-2.5 pointer-events-none">
                            {/* App Header */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-white" />
                              </div>
                              <div className="space-y-1">
                                <div className="h-3 bg-slate-800 rounded w-16" />
                                <div className="h-1.5 bg-emerald-400/50 rounded w-10" />
                              </div>
                            </div>

                            {/* Hero Card */}
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-3">
                              <div className="h-1 bg-white/30 rounded w-1/4 mb-1.5" />
                              <div className="h-6 bg-white/20 rounded-lg w-full" />
                            </div>

                            {/* Mini Cards */}
                            <div className="grid grid-cols-2 gap-1.5">
                              {[1, 2].map((i) => (
                                <div key={i} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                  <div className="w-6 h-6 rounded bg-blue-100 mb-1.5" />
                                  <div className="h-1 bg-slate-200 rounded w-full" />
                                </div>
                              ))}
                            </div>

                            {/* List Item */}
                            <div className="bg-white rounded-xl p-2.5 border border-slate-100 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-purple-100" />
                              <div className="flex-1 space-y-1">
                                <div className="h-1.5 bg-slate-700 rounded w-full" />
                                <div className="h-1 bg-slate-200 rounded w-1/2" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Install Badge */}
                      <motion.div
                        animate={{
                          y: [0, -5, 0],
                          scale: [1, 1.02, 1]
                        }}
                        transition={{
                          y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                          scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="absolute top-4 right-2 z-20 bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border-2 border-white flex items-center gap-1 shadow-md shadow-emerald-500/20"
                      >
                        <Download className="w-3 h-3" />
                        <span>Install</span>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Right - Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="flex-1 text-center md:text-left order-1 md:order-2"
                  >
                    <span className="inline-block mb-3 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                      📱 Install App
                    </span>

                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 leading-tight">
                      Get Practice Koro{' '}
                      <span className="text-emerald-600">On Your Phone</span>
                    </h3>

                    <p className="text-slate-500 text-sm sm:text-base mb-6 max-w-md mx-auto md:mx-0">
                      Install directly from your browser. No app store needed, works on all devices.
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2 mb-6 max-w-sm mx-auto md:mx-0">
                      {[
                        { icon: Zap, text: "Instant Launch", color: "text-amber-600" },
                        { icon: Download, text: "No Storage", color: "text-blue-600" },
                        { icon: Smartphone, text: "Native Feel", color: "text-purple-600" },
                        { icon: CheckCircle, text: "One Click", color: "text-emerald-600" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-100"
                        >
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                          <span className="font-medium text-slate-700 text-xs">{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Install Button */}
                    <Button
                      size="lg"
                      onClick={() => {
                        const event = new CustomEvent('show-pwa-prompt');
                        window.dispatchEvent(event);
                      }}
                      className="text-sm sm:text-base font-bold py-5 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Install Free App
                    </Button>
                    <p className="mt-2 text-slate-400 text-[11px]">
                      Works on all devices • No download required
                    </p>
                  </motion.div>

                </div>
              </div>
            </section>

            {/* CTA Section */}
            {
              !isLoggedIn && (
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
                        className="text-base font-semibold py-6 px-8 rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all duration-200"
                      >
                        Register Now - It's Free
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </motion.div>
                  </div>
                </section>
              )
            }

            <Footer />
          </motion.div >
        )}
      </AnimatePresence >

      {/* PWA Install Prompt handled globally in App.tsx */}
    </>
  );
};
export default Landing;