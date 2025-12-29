import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotebookPen, Search, BookOpen, FolderOpen, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StudentLayout from "@/components/student/StudentLayout";

interface Note {
  id: string;
  title: string;
  content: string;
  subject_id: string | null;
  topic_id: string | null;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  subject_id: string;
  name: string;
}

// Category color palette
const categoryColors = [
  { bg: "from-indigo-500 via-violet-500 to-purple-500", light: "bg-gradient-to-br from-indigo-50 to-violet-50", text: "text-indigo-600", glow: "shadow-indigo-500/25" },
  { bg: "from-emerald-500 via-teal-500 to-cyan-500", light: "bg-gradient-to-br from-emerald-50 to-teal-50", text: "text-emerald-600", glow: "shadow-emerald-500/25" },
  { bg: "from-blue-500 via-sky-500 to-cyan-500", light: "bg-gradient-to-br from-blue-50 to-sky-50", text: "text-blue-600", glow: "shadow-blue-500/25" },
  { bg: "from-orange-500 via-amber-500 to-yellow-500", light: "bg-gradient-to-br from-orange-50 to-amber-50", text: "text-orange-600", glow: "shadow-orange-500/25" },
  { bg: "from-pink-500 via-rose-500 to-red-500", light: "bg-gradient-to-br from-pink-50 to-rose-50", text: "text-pink-600", glow: "shadow-pink-500/25" },
  { bg: "from-purple-500 via-fuchsia-500 to-pink-500", light: "bg-gradient-to-br from-purple-50 to-fuchsia-50", text: "text-purple-600", glow: "shadow-purple-500/25" },
];

const StudentNotes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const [notesRes, subjectsRes, topicsRes] = await Promise.all([
      supabase.from("pdfs").select("id, title, content, subject_id, topic_id, created_at").order("created_at", { ascending: false }),
      supabase.from("subjects").select("id, name").eq("is_active", true).order("name"),
      supabase.from("topics").select("id, subject_id, name").eq("is_active", true).order("name")
    ]);

    if (notesRes.data) setNotes(notesRes.data as Note[]);
    if (subjectsRes.data) setSubjects(subjectsRes.data);
    if (topicsRes.data) setTopics(topicsRes.data);
    setLoading(false);
  };

  const toggleExpand = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) newExpanded.delete(noteId);
    else newExpanded.add(noteId);
    setExpandedNotes(newExpanded);
  };

  const getCategoryColor = (subjectId: string | null) => {
    const index = subjects.findIndex(s => s.id === subjectId);
    return categoryColors[index % categoryColors.length] || categoryColors[0];
  };

  const getSubjectName = (id: string | null) => subjects.find(s => s.id === id)?.name || "General";
  const getTopicName = (id: string | null) => topics.find(t => t.id === id)?.name || "-";

  const filteredTopics = selectedSubject === "all" ? topics : topics.filter(t => t.subject_id === selectedSubject);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = selectedSubject === "all" || note.subject_id === selectedSubject;
    const matchesTopic = selectedTopic === "all" || note.topic_id === selectedTopic;
    return matchesSearch && matchesSubject && matchesTopic;
  });

  if (loading) {
    return (
      <StudentLayout title="Notes" subtitle="Study notes">
        <div className="w-full max-w-3xl md:max-w-6xl mx-auto space-y-5 pb-4 pt-2 px-4">
          <div className="skeleton-premium h-32 rounded-2xl" />
          <div className="skeleton-premium h-14 rounded-xl" />
          {[1, 2, 3].map(i => <div key={i} className="skeleton-premium h-24 rounded-2xl" />)}
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Notes" subtitle="Study materials">
      <div className="w-full max-w-3xl md:max-w-6xl mx-auto space-y-5 pb-4 pt-2 px-4">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-5 text-white shadow-xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              <NotebookPen className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold">Study Notes</h2>
            <p className="text-sm text-white/80 mt-1">Browse notes by subject & topic</p>
            <div className="flex gap-3 mt-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm">
                <span className="font-bold">{notes.length}</span> Notes
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm">
                <span className="font-bold">{subjects.length}</span> Subjects
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => { setSelectedSubject("all"); setSelectedTopic("all"); }}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedSubject === "all" ? "bg-violet-500 text-white shadow-lg" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              All Subjects
            </button>
            {subjects.map(subject => (
              <button
                key={subject.id}
                onClick={() => { setSelectedSubject(subject.id); setSelectedTopic("all"); }}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedSubject === subject.id ? "bg-violet-500 text-white shadow-lg" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {subject.name}
              </button>
            ))}
          </div>

          {selectedSubject !== "all" && filteredTopics.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedTopic("all")}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedTopic === "all" ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
              >
                All Topics
              </button>
              {filteredTopics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedTopic === topic.id ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100"
          >
            <NotebookPen className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800">No Notes Found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotes.map((note, idx) => {
                const colors = getCategoryColor(note.subject_id);
                const isExpanded = expandedNotes.has(note.id);
                const contentPreview = note.content?.substring(0, 150) + (note.content?.length > 150 ? "..." : "");

                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`${colors.light} rounded-2xl p-4 shadow-lg border border-white/50`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/80 ${colors.text}`}>
                            <FolderOpen className="w-3 h-3" />
                            {getSubjectName(note.subject_id)}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/60 text-gray-600">
                            <BookOpen className="w-3 h-3" />
                            {getTopicName(note.topic_id)}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">{note.title}</h3>

                        {note.content && (
                          <div className="mt-3 bg-white/80 rounded-xl p-3 border border-gray-100">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap select-none">
                              {isExpanded ? note.content : contentPreview}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {note.content && note.content.length > 150 && (
                      <button
                        onClick={() => toggleExpand(note.id)}
                        className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${colors.text} bg-white/80 hover:bg-white`}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isExpanded ? "Show Less" : "Read More"}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentNotes;
