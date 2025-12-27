import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
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

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const [pdfsRes, examsRes] = await Promise.all([
      supabase.from("pdfs").select("*").order("created_at", { ascending: false }),
      supabase.from("exams").select("id, name").eq("is_active", true).order("name")
    ]);

    if (pdfsRes.data) setPdfs(pdfsRes.data);
    if (examsRes.data) setExams(examsRes.data);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { containerProps, PullIndicator } = usePullToRefresh({
    onRefresh: loadData
  });

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
      <PullIndicator />
      <div className="w-full max-w-3xl mx-auto space-y-4 pb-32 pt-2 overflow-x-hidden" {...containerProps}>

        {/* ═══════════════════════════════════════════════════════════════
            PREMIUM STUDY HERO - Mobile Optimized
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-[28px] p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 shadow-xl shadow-indigo-200/50"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:20px_20px]" />
          <div className="absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 sm:-mr-32 sm:-mt-32" />
          <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-indigo-500/20 rounded-full blur-2xl -ml-16 -mb-16 sm:-ml-24 sm:-mb-24" />

          <div className="relative z-10 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-200" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-[0.2em] text-indigo-200">Study Materials</span>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
              Study <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">Vault</span>
            </h1>
            <p className="text-indigo-100/70 max-w-lg text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
              Access curated PDFs, notes, and previous papers.
            </p>

            <div className="flex items-center gap-4 sm:gap-6 pt-2">
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-black text-white">{pdfs.length}</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-indigo-300 uppercase tracking-wider">PDFs</span>
              </div>
              <div className="w-px h-8 sm:h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-black text-white">{exams.length}</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Categories</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            SEARCH & FILTERS - Mobile Optimized
            ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-3 sm:space-y-4">
          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search PDFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-11 pr-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm text-slate-700 placeholder:text-slate-400 shadow-sm"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            <button
              onClick={() => setSelectedExam("all")}
              className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all ${selectedExam === "all" ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-100"
                }`}
            >
              All
            </button>
            {exams.map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedExam(e.id)}
                className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${selectedExam === e.id ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-100"
                  }`}
              >
                {e.name}
              </button>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              PDF GRID - Mobile Optimized
              ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {filteredPdfs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-12 sm:py-20 text-center"
                >
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-slate-200 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">No PDFs found</h3>
                  <p className="text-slate-500 text-xs sm:text-sm">Try refining your search</p>
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
                    <div 
                      className="card-premium h-full flex items-center gap-3 p-3 sm:p-4 group cursor-pointer active:scale-[0.99] transition-all"
                      onClick={() => handleDownload(pdf)}
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {pdf.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] sm:text-xs text-indigo-600 font-medium truncate">
                            {exams.find(e => e.id === pdf.exam_id)?.name || 'General'}
                          </span>
                          <span className="text-[9px] text-slate-400">•</span>
                          <span className="text-[10px] text-slate-400">{formatFileSize(pdf.file_size)}</span>
                        </div>
                      </div>

                      {/* Download Icon */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all shrink-0 text-slate-400">
                        <Download className="w-4 h-4" />
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
