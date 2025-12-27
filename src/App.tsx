import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentExams from "./pages/student/StudentExams";
import StudentPDFs from "./pages/student/StudentPDFs";
import StudentResults from "./pages/student/StudentResults";
import StudentProfile from "./pages/student/StudentProfile";
import TakeTest from "./pages/student/TakeTest";
import ReviewTest from "./pages/student/ReviewTest";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminIndex from "./pages/admin/AdminIndex";
import StudentManagement from "./pages/admin/StudentManagement";
import ExamManagement from "./pages/admin/ExamManagement";
import QuestionBank from "./pages/admin/QuestionBank";
import MockTestCreation from "./pages/admin/MockTestCreation";
import AIQuestionGenerator from "./pages/admin/AIQuestionGenerator";
import PDFManagement from "./pages/admin/PDFManagement";
import BulkMCQUpload from "./pages/admin/BulkMCQUpload";
import AddQuestion from "./pages/admin/AddQuestion";
import AdminProfile from "./pages/admin/AdminProfile";
import CourseManagement from "./pages/admin/CourseManagement";
import AdminChatInbox from "./pages/admin/AdminChatInbox";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <PWAInstallPrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminIndex />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/exams" element={<StudentExams />} />
          <Route path="/student/take-test/:testId" element={<TakeTest />} />
          <Route path="/student/test-review/:attemptId" element={<ReviewTest />} />
          <Route path="/student/pdfs" element={<StudentPDFs />} />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<StudentManagement />} />
          <Route path="/admin/exams" element={<ExamManagement />} />
          <Route path="/admin/questions" element={<QuestionBank />} />
          <Route path="/admin/tests" element={<MockTestCreation />} />
          <Route path="/admin/ai-generator" element={<AIQuestionGenerator />} />
          <Route path="/admin/pdfs" element={<PDFManagement />} />
          <Route path="/admin/bulk-upload" element={<BulkMCQUpload />} />
          <Route path="/admin/add-question" element={<AddQuestion />} />
          <Route path="/admin/courses" element={<CourseManagement />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/chat" element={<AdminChatInbox />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
