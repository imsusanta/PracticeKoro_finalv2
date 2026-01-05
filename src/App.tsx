import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import OfflineIndicator from "@/components/OfflineIndicator";

// Critical pages - load immediately
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// Lazy load other pages for faster initial load
// const AdminLogin = lazy(() => import("./pages/AdminLogin")); // Commented out for debugging
import AdminLoginPage from "./pages/AdminLoginPage";
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Install = lazy(() => import("./pages/Install"));

// Student pages - lazy loaded
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentExams = lazy(() => import("./pages/student/StudentExams"));
const StudentNotes = lazy(() => import("./pages/student/StudentNotes"));
const StudentResults = lazy(() => import("./pages/student/StudentResults"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const TakeTest = lazy(() => import("./pages/student/TakeTest"));
const ReviewTest = lazy(() => import("./pages/student/ReviewTest"));
const StudentNotifications = lazy(() => import("./pages/student/StudentNotifications"));

// Admin pages - lazy loaded
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminIndex = lazy(() => import("./pages/admin/AdminIndex"));
const StudentManagement = lazy(() => import("./pages/admin/StudentManagement"));
const ExamManagement = lazy(() => import("./pages/admin/ExamManagement"));
const QuestionBank = lazy(() => import("./pages/admin/QuestionBank"));
const MockTestCreation = lazy(() => import("./pages/admin/MockTestCreation"));
const AIQuestionGenerator = lazy(() => import("./pages/admin/AIQuestionGenerator"));
const NotesManagement = lazy(() => import("./pages/admin/NotesManagement"));
const SubjectManagement = lazy(() => import("./pages/admin/SubjectManagement"));
const QuestionSubjectManagement = lazy(() => import("./pages/admin/QuestionSubjectManagement"));
const BulkMCQUpload = lazy(() => import("./pages/admin/BulkMCQUpload"));
const AddQuestion = lazy(() => import("./pages/admin/AddQuestion"));
const AddNote = lazy(() => import("./pages/admin/AddNote"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const CourseManagement = lazy(() => import("./pages/admin/CourseManagement"));
const AdminChatInbox = lazy(() => import("./pages/admin/AdminChatInbox"));
const SendNotifications = lazy(() => import("./pages/admin/SendNotifications"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500 font-medium">Loading...</p>
    </div>
  </div>
);

const App = () => {
  // Silent PWA update check
  const { } = usePWAUpdate();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineIndicator />
        <BrowserRouter>
          <PWAInstallPrompt />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/" element={<Landing />} />
              <Route path="/install" element={<Install />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin" element={<AdminIndex />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/exams" element={<StudentExams />} />
              <Route path="/student/take-test/:testId" element={<TakeTest />} />
              <Route path="/student/test-review/:attemptId" element={<ReviewTest />} />
              <Route path="/student/notes" element={<StudentNotes />} />
              <Route path="/student/results" element={<StudentResults />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/student/notifications" element={<StudentNotifications />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<StudentManagement />} />
              <Route path="/admin/exams" element={<ExamManagement />} />
              <Route path="/admin/subjects" element={<SubjectManagement />} />
              <Route path="/admin/questions" element={<QuestionBank />} />
              <Route path="/admin/question-subjects" element={<QuestionSubjectManagement />} />
              <Route path="/admin/tests" element={<MockTestCreation />} />
              <Route path="/admin/ai-generator" element={<AIQuestionGenerator />} />
              <Route path="/admin/notes" element={<NotesManagement />} />
              <Route path="/admin/bulk-upload" element={<BulkMCQUpload />} />
              <Route path="/admin/add-question" element={<AddQuestion />} />
              <Route path="/admin/add-note" element={<AddNote />} />
              <Route path="/admin/courses" element={<CourseManagement />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="/admin/chat" element={<AdminChatInbox />} />
              <Route path="/admin/notifications" element={<SendNotifications />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
