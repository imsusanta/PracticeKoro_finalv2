import {
  Users,
  BookOpen,
  FileQuestion,
  NotebookPen,
  TestTube2,
  Sparkles,
  Upload,
  MessageCircle,
  FolderOpen,
  Bell,
  Settings,
  LayoutDashboard,
  Newspaper
} from "lucide-react";

export const managementTools = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Student Management", path: "/admin/students", icon: Users },
  { name: "Exam Management", path: "/admin/exams", icon: BookOpen },
  { name: "Subject Management", path: "/admin/question-subjects", icon: FolderOpen },
  { name: "Notes Subjects & Topics", path: "/admin/subjects", icon: FolderOpen },
  { name: "Question Bank", path: "/admin/questions", icon: FileQuestion },
  { name: "Mock Test Creation", path: "/admin/tests", icon: TestTube2 },
  { name: "AI Question Generator", path: "/admin/ai-generator", icon: Sparkles },
  { name: "Notes Management", path: "/admin/notes", icon: NotebookPen },
  { name: "Blog Management", path: "/admin/blogs", icon: Newspaper },
  { name: "Bulk MCQ Upload", path: "/admin/bulk-upload", icon: Upload },
  { name: "Send Notifications", path: "/admin/notifications", icon: Bell },
  { name: "Chat Inbox", path: "/admin/chat", icon: MessageCircle },
  { name: "Admin Settings", path: "/admin/settings", icon: Settings },
  { name: "AI Settings", path: "/admin/ai-settings", icon: Settings },
];


