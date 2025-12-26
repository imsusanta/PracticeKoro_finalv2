import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Download, Trash2, MoreVertical, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminLayout from "@/components/admin/AdminLayout";

interface PDF {
  id: string;
  title: string;
  file_path: string;
  file_size: number | null;
  exam_id: string;
  exams?: { name: string };
  created_at: string;
}

interface Exam {
  id: string;
  name: string;
}

const PDFManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [filteredPdfs, setFilteredPdfs] = useState<PDF[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterExam, setFilterExam] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    exam_id: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterExam, pdfs]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/admin/login");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      toast({
        title: "Access Denied",
        description: "You do not have admin privileges",
        variant: "destructive",
      });
      navigate("/admin/login");
      return;
    }

    await loadExams();
    await loadPDFs();
    setLoading(false);
  };

  const loadExams = async () => {
    const { data } = await supabase
      .from("exams")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setExams(data);
    }
  };

  const loadPDFs = async () => {
    const { data, error } = await supabase
      .from("pdfs")
      .select("*, exams(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load PDFs",
        variant: "destructive",
      });
      return;
    }

    setPdfs(data || []);
  };

  const applyFilters = () => {
    let filtered = [...pdfs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pdf =>
        pdf.title.toLowerCase().includes(query) ||
        (pdf.exams?.name?.toLowerCase() || "").includes(query)
      );
    }

    if (filterExam !== "all") {
      filtered = filtered.filter(pdf => pdf.exam_id === filterExam);
    }

    setFilteredPdfs(filtered);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Error",
          description: "Only PDF files are allowed",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.title || !formData.exam_id) {
      toast({
        title: "Error",
        description: "Please fill all fields and select a file",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setUploading(true);

    const fileExt = selectedFile.name.split('.').pop();
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}.${fileExt}`;
    const filePath = `pdfs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('study-materials')
      .upload(filePath, selectedFile);

    if (uploadError) {
      setUploading(false);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      return;
    }

    const { error: dbError } = await supabase.from("pdfs").insert({
      title: formData.title,
      exam_id: formData.exam_id,
      file_path: filePath,
      file_size: selectedFile.size,
      uploaded_by: session.user.id,
    });

    setUploading(false);

    if (dbError) {
      await supabase.storage.from('study-materials').remove([filePath]);

      toast({
        title: "Error",
        description: "Failed to save PDF metadata",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "PDF uploaded successfully",
    });

    setDialogOpen(false);
    setSelectedFile(null);
    setFormData({ title: "", exam_id: "" });
    await loadPDFs();
  };

  const handleDownload = async (pdf: PDF) => {
    const { data } = await supabase.storage
      .from('study-materials')
      .createSignedUrl(pdf.file_path, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      toast({
        title: "Error",
        description: "Failed to generate download link",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (pdf: PDF) => {
    if (!confirm("Are you sure you want to delete this PDF?")) {
      return;
    }

    await supabase.storage.from('study-materials').remove([pdf.file_path]);

    const { error } = await supabase.from("pdfs").delete().eq("id", pdf.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete PDF",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "PDF deleted successfully",
    });

    await loadPDFs();
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const CreateButton = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Upload New PDF</DialogTitle>
          <DialogDescription>Upload a study material PDF</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., UPSC History Notes"
              className="h-12 rounded-xl mt-1"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Exam Category *</Label>
            <Select value={formData.exam_id} onValueChange={(value) => setFormData({ ...formData, exam_id: value })}>
              <SelectTrigger className="h-12 rounded-xl mt-1">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">PDF File *</Label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="h-12 rounded-xl mt-1 pt-2"
            />
            {selectedFile && (
              <p className="text-sm text-emerald-600 mt-2">
                Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-12 flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading} className="rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-teal-600 flex-1 sm:flex-none">
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <AdminLayout title="PDF Management" subtitle="Study materials">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-emerald-600 text-sm">Loading PDFs...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="PDF Management" subtitle={`${pdfs.length} PDFs`} headerActions={CreateButton}>
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:gap-4">
          <div className="flex-1 min-w-[140px] bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{pdfs.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total PDFs</p>
          </div>
          <div className="flex-1 min-w-[140px] bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{exams.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Categories</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3">
          <div className="relative flex-1 lg:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search PDFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-white border-gray-200"
            />
          </div>
          <Select value={filterExam} onValueChange={setFilterExam}>
            <SelectTrigger className="h-12 rounded-xl lg:w-[180px]">
              <SelectValue placeholder="Filter by exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* PDFs List - Row Based */}
        {filteredPdfs.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No PDFs Found</h3>
              <p className="text-gray-500 text-sm mb-4">
                {searchQuery || filterExam !== "all" ? "Try different filters" : "Upload your first study material"}
              </p>
              <Button onClick={() => setDialogOpen(true)} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
                <Plus className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>PDF Title</span>
              <span>Exam</span>
              <span>Size</span>
              <span>Uploaded</span>
              <span className="text-center">Actions</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredPdfs.map(pdf => (
                <div key={pdf.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Desktop Row */}
                  <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-3 items-center">
                    {/* PDF Title & Icon */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-red-500" />
                      </div>
                      <p className="font-medium text-gray-900 truncate">{pdf.title}</p>
                    </div>

                    {/* Exam */}
                    <div>
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700">
                        {pdf.exams?.name || "—"}
                      </Badge>
                    </div>

                    {/* Size */}
                    <div className="text-sm text-gray-600">
                      {formatFileSize(pdf.file_size)}
                    </div>

                    {/* Uploaded Date */}
                    <div className="text-sm text-gray-600">
                      {new Date(pdf.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-emerald-50">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl min-w-[160px]">
                          <DropdownMenuItem onClick={() => handleDownload(pdf)} className="gap-2">
                            <Download className="w-4 h-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(pdf)} className="gap-2 text-red-600 focus:text-red-600">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Mobile Row */}
                  <div className="md:hidden p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-red-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">{pdf.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700">
                            {pdf.exams?.name}
                          </Badge>
                          <span className="text-xs text-gray-500">{formatFileSize(pdf.file_size)}</span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-emerald-50 shrink-0">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl min-w-[160px]">
                          <DropdownMenuItem onClick={() => handleDownload(pdf)} className="gap-2">
                            <Download className="w-4 h-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(pdf)} className="gap-2 text-red-600 focus:text-red-600">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default PDFManagement;
