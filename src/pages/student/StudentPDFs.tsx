import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import {
  FileText,
  Search,
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
        <div className="w-full flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center animate-pulse">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Study Center" subtitle="Learning materials">
      <PullIndicator />
      <div className="w-full space-y-3 pb-24" {...containerProps}>

        {/* Compact Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Study Materials</span>
            </div>
            
            <h1 className="text-lg font-bold text-white mb-3">PDF Vault</h1>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
                <span className="text-xl font-bold text-white block">{pdfs.length}</span>
                <span className="text-[9px] font-medium text-indigo-100 uppercase">PDFs</span>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
                <span className="text-xl font-bold text-white block">{exams.length}</span>
                <span className="text-[9px] font-medium text-indigo-100 uppercase">Categories</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <div className="space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search PDFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            <button
              onClick={() => setSelectedExam("all")}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                selectedExam === "all" 
                  ? "bg-slate-900 text-white" 
                  : "bg-white text-slate-600 border border-slate-100"
              }`}
            >
              All
            </button>
            {exams.map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedExam(e.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                  selectedExam === e.id 
                    ? "bg-slate-900 text-white" 
                    : "bg-white text-slate-600 border border-slate-100"
                }`}
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>

        {/* PDF List */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredPdfs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900">No PDFs found</h3>
                <p className="text-slate-500 text-xs">Try refining your search</p>
              </motion.div>
            ) : (
              filteredPdfs.map((pdf, idx) => (
                <motion.div
                  key={pdf.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-white rounded-xl border border-slate-100 p-3 active:scale-[0.98] transition-transform"
                  onClick={() => handleDownload(pdf)}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm truncate">
                        {pdf.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-indigo-600 font-medium truncate">
                          {exams.find(e => e.id === pdf.exam_id)?.name || 'General'}
                        </span>
                        <span className="text-[9px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-400">{formatFileSize(pdf.file_size)}</span>
                      </div>
                    </div>

                    {/* Download Icon */}
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                      <Download className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentPDFs;