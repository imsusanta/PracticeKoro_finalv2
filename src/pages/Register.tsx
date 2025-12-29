import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Phone, Sparkles } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [registerMethod, setRegisterMethod] = useState<"email" | "whatsapp">("email");

  const [emailFormData, setEmailFormData] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [whatsappFormData, setWhatsappFormData] = useState({ fullName: "", whatsappNumber: "", password: "", confirmPassword: "" });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailFormData.password !== emailFormData.confirmPassword) { toast({ title: "Error", description: "Passwords do not match", variant: "destructive" }); return; }
    if (emailFormData.password.length < 6) { toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: emailFormData.email, password: emailFormData.password, options: { data: { full_name: emailFormData.fullName } } });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Success", description: "Account created!" }); navigate("/login"); }
  };

  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(whatsappFormData.whatsappNumber)) { toast({ title: "Error", description: "Enter valid 10-digit number", variant: "destructive" }); return; }
    if (whatsappFormData.password !== whatsappFormData.confirmPassword) { toast({ title: "Error", description: "Passwords do not match", variant: "destructive" }); return; }
    if (whatsappFormData.password.length < 6) { toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" }); return; }
    setLoading(true);
    const { data: existing } = await supabase.from("profiles").select("id, user_roles!inner(role)").eq("whatsapp_number", whatsappFormData.whatsappNumber).maybeSingle();
    if (existing) { setLoading(false); toast({ title: "Error", description: "WhatsApp already registered", variant: "destructive" }); return; }
    const { error } = await supabase.auth.signUp({ email: `${whatsappFormData.whatsappNumber}@whatsapp.practicekoro.local`, password: whatsappFormData.password, options: { data: { full_name: whatsappFormData.fullName, whatsapp_number: whatsappFormData.whatsappNumber } } });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Success", description: "Account created!" }); navigate("/login"); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-indigo-50/50 flex items-center justify-center p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-gray-200/50 shadow-sm text-xs font-medium text-gray-600 hover:bg-white transition-colors z-10"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      {/* Compact Centered Card */}
      <div className="w-full max-w-xs">
        {/* Logo & Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-200/50 mb-3">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Create Account</h1>
          <p className="text-xs text-gray-500 mt-0.5">Register for mock tests</p>
        </div>

        {/* Register Form */}
        <Tabs value={registerMethod} onValueChange={(v) => setRegisterMethod(v as "email" | "whatsapp")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9 bg-gray-100/80 rounded-full p-1">
            <TabsTrigger value="email" className="flex items-center justify-center gap-1.5 text-xs rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">
              <Mail className="w-3.5 h-3.5" /> Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center justify-center gap-1.5 text-xs rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">
              <Phone className="w-3.5 h-3.5" /> WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-4">
            <form onSubmit={handleEmailSubmit} className="space-y-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Full Name</Label>
                <Input type="text" required placeholder="John Doe" className="h-9 text-sm bg-white border-gray-200 rounded-lg" value={emailFormData.fullName} onChange={(e) => setEmailFormData({ ...emailFormData, fullName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Email</Label>
                <Input type="email" required placeholder="you@example.com" className="h-9 text-sm bg-white border-gray-200 rounded-lg" value={emailFormData.email} onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Password</Label>
                <Input type="password" required placeholder="Min 6 characters" className="h-9 text-sm bg-white border-gray-200 rounded-lg" value={emailFormData.password} onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Confirm Password</Label>
                <Input type="password" required placeholder="Re-enter password" className="h-9 text-sm bg-white border-gray-200 rounded-lg" value={emailFormData.confirmPassword} onChange={(e) => setEmailFormData({ ...emailFormData, confirmPassword: e.target.value })} />
              </div>
              <Button type="submit" className="w-full h-9 text-sm rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 font-semibold shadow-md shadow-violet-200/50" disabled={loading}>
                {loading ? "..." : "Register"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-4">
            <form onSubmit={handleWhatsAppSubmit} className="space-y-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Full Name</Label>
                <Input type="text" required placeholder="John Doe" className="h-9 text-sm bg-white border-gray-200 rounded-lg" value={whatsappFormData.fullName} onChange={(e) => setWhatsappFormData({ ...whatsappFormData, fullName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">WhatsApp</Label>
                <Input type="tel" required placeholder="10-digit number" maxLength={10} className="h-9 text-sm bg-white border-gray-200 rounded-lg" value={whatsappFormData.whatsappNumber} onChange={(e) => setWhatsappFormData({ ...whatsappFormData, whatsappNumber: e.target.value.replace(/\D/g, '') })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Password</Label>
                <Input type="password" required placeholder="Min 6 characters" className="h-9 text-sm bg-white border-gray-200 rounded-lg" value={whatsappFormData.password} onChange={(e) => setWhatsappFormData({ ...whatsappFormData, password: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Confirm Password</Label>
                <Input type="password" required placeholder="Re-enter password" className="h-9 text-sm bg-white border-gray-200 rounded-lg" value={whatsappFormData.confirmPassword} onChange={(e) => setWhatsappFormData({ ...whatsappFormData, confirmPassword: e.target.value })} />
              </div>
              <Button type="submit" className="w-full h-9 text-sm rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 font-semibold shadow-md shadow-violet-200/50" disabled={loading}>
                {loading ? "..." : "Register"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Login Link */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Have an account?{" "}
          <button type="button" className="text-violet-600 font-semibold hover:underline" onClick={() => navigate("/login")}>Login</button>
        </p>
      </div>
    </div>
  );
};

export default Register;
