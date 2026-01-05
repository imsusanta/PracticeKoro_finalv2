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
  Bell
} from "lucide-react";

export const managementTools = [
  { name: "Student Management", path: "/admin/students", icon: Users },
  { name: "Exam Management", path: "/admin/exams", icon: BookOpen },
  { name: "Subject & Topics", path: "/admin/subjects", icon: FolderOpen },
  { name: "Question Bank", path: "/admin/questions", icon: FileQuestion },
  { name: "Question Subjects", path: "/admin/question-subjects", icon: FolderOpen },
  { name: "Mock Test Creation", path: "/admin/tests", icon: TestTube2 },
  { name: "AI Question Generator", path: "/admin/ai-generator", icon: Sparkles },

  { name: "Notes Management", path: "/admin/notes", icon: NotebookPen },
  { name: "Bulk MCQ Upload", path: "/admin/bulk-upload", icon: Upload },
  { name: "Send Notifications", path: "/admin/notifications", icon: Bell },
  { name: "Chat Inbox", path: "/admin/chat", icon: MessageCircle },
];


