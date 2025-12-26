import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Search,
  ExternalLink,
  FolderOpen,
  X
} from "lucide-react";
import StudentLayout from "@/components/student/StudentLayout";
import { motion } from "framer-motion";

interface PDF {
  id: string;
  title: string;
  file_path: string;
  file_size: number | null;
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
  const [exams, setExams] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState<string>("all");

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    await loadPDFs();
    setLoading(false);
  };

  const loadPDFs = async () => {
    const { data: examsData } = await supabase
      .from("exams")
      .select("id, name")
      .eq("is_active", true);

    const examsMap: { [key: string]: string } = {};
    examsData?.forEach((exam: Exam) => {
      examsMap[exam.id] = exam.name;
    });
    setExams(examsMap);

    const { data: pdfsData, error } = await supabase
      .from("pdfs")
      .select("id, title, file_path, file_size, exam_id")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load materials", variant: "destructive" });
      return;
    }

    setPdfs(pdfsData || []);
  };

  const filteredPdfs = useMemo(() => {
    let result = pdfs;

    if (selectedExam !== "all") {
      result = result.filter(pdf => pdf.exam_id === selectedExam);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(pdf => pdf.title.toLowerCase().includes(q));
    }

    return result;
  }, [pdfs, searchQuery, selectedExam]);

  const examList = Object.entries(exams);

  return (
    <StudentLayout title="Study PDFs" subtitle="Your materials">
      {/* Mobile: No extra padding (Layout has px-4), Desktop: wider */}
      <div className="w-full md:max-w-4xl md:mx-auto pb-8">

        {/* ═══════════════════════════════════════════════════════════════
            MOBILE STATS - Simple 2-column cards
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-2 mb-4 md:hidden"
        >
          <div className="bg-white rounded-2xl p-3 text-center border border-slate-100">
            <p className="text-lg font-bold text-red-500">{pdfs.length}</p>
            <p className="text-[10px] text-slate-500">Total PDFs</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center border border-slate-100">
            <p className="text-lg font-bold text-slate-900">{examList.length}</p>
            <p className="text-[10px] text-slate-500">Categories</p>
          </div>
        </motion.div>

        {/* Desktop Stats Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:block relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 mb-6"
          style={{ boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' }}
        >
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/30 rounded-full blur-3xl -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl -ml-20 -mb-20" />
          </div>
          <div className="relative z-10 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 backdrop-blur-sm flex items-center justify-center border border-red-500/30">
                <FileText className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-red-400">Study Materials</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-3xl font-black tracking-tight text-red-400 font-mono">{pdfs.length}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total PDFs</p>
              </div>
              <div className="space-y-1 border-l border-white/10 pl-4">
                <p className="text-3xl font-black tracking-tight text-slate-100 font-mono">{examList.length}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Categories</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            SEARCH INPUT
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-3"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center"
            >
              <X className="w-3 h-3 text-slate-500" />
            </button>
          )}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            CATEGORY PILLS - Horizontal scroll with edge-to-edge
            ═══════════════════════════════════════════════════════════════ */}
        {examList.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-4 -mx-4 px-4 md:mx-0 md:px-0"
          >
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => setSelectedExam("all")}
                className={`shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${selectedExam === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
                  }`}
              >
                All
              </button>
              {examList.map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => setSelectedExam(id)}
                  className={`shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${selectedExam === id
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                    }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PDF LIST
            ═══════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm md:text-lg font-bold text-slate-900">Documents</h3>
            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-semibold">
              {filteredPdfs.length}
            </span>
          </div>

          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {loading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white h-14 rounded-2xl border border-slate-100" />
                ))}
              </>
            ) : filteredPdfs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 bg-white rounded-2xl border border-slate-100 md:col-span-2"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FolderOpen className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-slate-900 font-semibold text-sm">No materials found</p>
                <p className="text-slate-500 text-xs mt-1">Try a different search</p>
              </motion.div>
            ) : (
              filteredPdfs.map((pdf, index) => (
                <motion.button
                  key={pdf.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.open(supabase.storage.from('pdfs').getPublicUrl(pdf.file_path).data.publicUrl, '_blank')}
                  className="w-full bg-white rounded-2xl p-3 md:p-5 border border-slate-100 text-left active:bg-slate-50 transition-colors hover:shadow-lg hover:border-indigo-200"
                >
                  <div className="flex items-center gap-2">
                    {/* File Icon */}
                    <div className="shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-red-100 md:bg-gradient-to-br md:from-red-500 md:to-rose-600 flex items-center justify-center">
                      <FileText className="w-4 h-4 md:w-6 md:h-6 text-red-500 md:text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-[13px] md:text-[15px] leading-snug truncate">
                        {pdf.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500">
                          {pdf.file_size ? `${(pdf.file_size / (1024 * 1024)).toFixed(1)} MB` : 'PDF'}
                        </span>
                        {exams[pdf.exam_id] && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                              {exams[pdf.exam_id]}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Icon */}
                    <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentPDFs;
