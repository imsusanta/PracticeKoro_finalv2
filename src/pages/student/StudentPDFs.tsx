import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Search,
  ExternalLink,
  BookOpen,
  X,
  TrendingUp,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StudentLayout from "@/components/student/StudentLayout";

interface PDF {
  id: string;
  title: string;
  file_path: string;
  file_size: number;
  exam_id: string;
}

interface Exam {
  id: string;
  name: string;
}

const StudentPDFs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const [pdfsRes, examsRes] = await Promise.all([
      supabase.from("pdfs").select("*").order("created_at", { ascending: false }),
      supabase.from("exams").select("id, name").eq("is_active", true).order("name")
    ]);

    if (pdfsRes.data) setPdfs(pdfsRes.data);
    if (examsRes.data) setExams(examsRes.data);
    setLoading(false);
  };

  const handleDownload = async (pdf: PDF) => {
    const { data, error } = await supabase.storage
      .from('study-materials')
      .createSignedUrl(pdf.file_path, 3600);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load PDF link",
        variant: "destructive",
      });
      return;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "PDF";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredPdfs = pdfs.filter(pdf => {
    const matchesSearch = pdf.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExam = selectedExam === "all" || pdf.exam_id === selectedExam;
    return matchesSearch && matchesExam;
  });

  if (loading) {
    return (
      <StudentLayout title="PDF Hub" subtitle="Study materials">
        <div className="w-full max-w-3xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Study Center" subtitle="Learning materials">
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-32 pt-2 px-4 overflow-x-hidden">

        {/* ═══════════════════════════════════════════════════════════════
            PREMIUM STUDY HERO
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 shadow-2xl shadow-indigo-200"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:20px_20px]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl -ml-24 -mb-24" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <FileText className="w-5 h-5 text-indigo-200" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Study Materials</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
              Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">Study Vault</span>
            </h1>
            <p className="text-indigo-100/70 max-w-lg text-sm leading-relaxed">
              Access curated PDFs, notes, and previous year papers to boost your preparation.
            </p>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">{pdfs.length}</span>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Total PDFs</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">{exams.length}</span>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Categories</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            SEARCH & FILTERS
            ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search PDFs by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 placeholder:text-slate-400 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => setSelectedExam("all")}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedExam === "all" ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-100 hover:border-indigo-200"
                  }`}
              >
                All Hubs
              </button>
              {exams.map(e => (
                <button
                  key={e.id}
                  onClick={() => setSelectedExam(e.id)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedExam === e.id ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-100 hover:border-indigo-200"
                    }`}
                >
                  {e.name}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              PDF GRID
              ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredPdfs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center"
                >
                  <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900">No PDFs found</h3>
                  <p className="text-slate-500 text-sm">Try refining your search or filter</p>
                </motion.div>
              ) : (
                filteredPdfs.map((pdf, idx) => (
                  <motion.div
                    layout
                    key={pdf.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <div className="card-premium h-full flex flex-col group overflow-hidden">
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>
                          <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                            {formatFileSize(pdf.file_size)}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {pdf.title}
                        </h4>

                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</span>
                          <span className="text-xs font-bold text-indigo-600 truncate">{exams.find(e => e.id === pdf.exam_id)?.name || 'General'}</span>
                        </div>
                      </div>

                      <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDownload(pdf)}
                          className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-indigo-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-white hover:border-indigo-600 hover:shadow-lg transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          View/Download
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentPDFs;
