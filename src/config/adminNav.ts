import {
  Users,
  BookOpen,
  FileQuestion,
  FileText,
  TestTube2,
  Sparkles,
  Upload,
  GraduationCap,
  MessageCircle
} from "lucide-react";

export const managementTools = [
  { name: "Student Management", path: "/admin/students", icon: Users },
  { name: "Exam Management", path: "/admin/exams", icon: BookOpen },
  { name: "Question Bank", path: "/admin/questions", icon: FileQuestion },
  { name: "Mock Test Creation", path: "/admin/tests", icon: TestTube2 },
  { name: "AI Question Generator", path: "/admin/ai-generator", icon: Sparkles },
  { name: "PDF Management", path: "/admin/pdfs", icon: FileText },
  { name: "Bulk MCQ Upload", path: "/admin/bulk-upload", icon: Upload },
  { name: "Chat Inbox", path: "/admin/chat", icon: MessageCircle },
];
