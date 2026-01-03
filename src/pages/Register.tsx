import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Lock, User, Loader2, Zap, Trophy, BookOpen, Target, Sparkles, Shield } from "lucide-react";
import { motion } from "framer-motion";

const Register = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [registerMethod, setRegisterMethod] = useState<"email" | "whatsapp">("whatsapp");

    const [emailFormData, setEmailFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [whatsappFormData, setWhatsappFormData] = useState({
        fullName: "",
        whatsappNumber: "",
        password: "",
        confirmPassword: "",
    });

    const validateWhatsAppNumber = (number: string): boolean => {
        return /^\d{10}$/.test(number);
    };

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (emailFormData.password !== emailFormData.confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
            return;
        }

        if (emailFormData.password.length < 6) {
            toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email: emailFormData.email,
            password: emailFormData.password,
            options: {
                data: { full_name: emailFormData.fullName },
            },
        });

        setLoading(false);

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
            return;
        }

        toast({ title: "Success", description: "Account created successfully!" });
        navigate("/login");
    };

    const handleWhatsAppRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateWhatsAppNumber(whatsappFormData.whatsappNumber)) {
            toast({ title: "Error", description: "Please enter a valid 10-digit WhatsApp number", variant: "destructive" });
            return;
        }

        if (whatsappFormData.password !== whatsappFormData.confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
            return;
        }

        if (whatsappFormData.password.length < 6) {
            toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
            return;
        }

        setLoading(true);

        // Check if WhatsApp number already exists
        const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("whatsapp_number", whatsappFormData.whatsappNumber)
            .maybeSingle();

        if (existing) {
            setLoading(false);
            toast({ title: "Error", description: "This WhatsApp number is already registered", variant: "destructive" });
            return;
        }

        const pseudoEmail = `${whatsappFormData.whatsappNumber}@whatsapp.practicekoro.local`;

        const { error } = await supabase.auth.signUp({
            email: pseudoEmail,
            password: whatsappFormData.password,
            options: {
                data: {
                    full_name: whatsappFormData.fullName,
                    whatsapp_number: whatsappFormData.whatsappNumber,
                },
            },
        });

        setLoading(false);

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
            return;
        }

        toast({ title: "Success", description: "Account created successfully!" });
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Left Side - Premium Branding (Fixed position - doesn't scroll) */}
            <div
                className="hidden lg:flex flex-col items-center justify-center p-8 xl:p-12 overflow-hidden"
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: '50%',
                    height: '100vh',
                    background: 'linear-gradient(135deg, #10b981 0%, #0f766e 100%)',
                    zIndex: 10
                }}
            >
                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-teal-400/20 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-20 w-full max-w-lg flex flex-col items-center text-center">
                    {/* Logo Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <div className="flex items-center gap-4 mb-6 justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-2xl flex items-center justify-center">
                                <Zap className="w-10 h-10 text-emerald-600" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-4xl font-extrabold text-white tracking-tight">Practice Koro</h2>
                                <div className="flex items-center gap-1.5 text-emerald-100/80 text-sm font-medium">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>#1 Mock Test Platform</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-emerald-50 text-lg font-medium opacity-90 max-w-sm mx-auto">
                            Join thousands of students and start your journey towards success today.
                        </p>
                    </motion.div>

                    {/* Branding Note */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 flex items-center gap-2 text-emerald-100/40 text-sm font-medium"
                    >
                        <Shield className="w-4 h-4" />
                        <span>Secure Learning Environment v2.0</span>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Register Form (offset from fixed left panel) */}
            <div className="min-h-screen flex flex-col lg:ml-[50%] xl:ml-[55%]">
                {/* Header with Login button */}
                <div className="flex justify-end p-4 sm:p-6 lg:p-8">
                    <Button
                        variant="outline"
                        onClick={() => navigate("/login")}
                        className="rounded-full px-6 border-border/60 hover:bg-accent/50 transition-all"
                    >
                        Login
                    </Button>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pb-8 lg:pb-0">
                    <div className="w-full max-w-md space-y-6">
                        {/* Mobile Branding */}
                        <div className="lg:hidden flex flex-col items-center mb-4">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg mb-2"
                            >
                                <Zap className="w-8 h-8 text-white" />
                            </motion.div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">Practice Koro</h1>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Join our community</p>
                        </div>

                        {/* Welcome Text */}
                        <div className="space-y-0.5">
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                                Create Account
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Register to access mock tests
                            </p>
                        </div>

                        {/* Register Method Tabs */}
                        <Tabs value={registerMethod} onValueChange={(v) => setRegisterMethod(v as "email" | "whatsapp")} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/60 rounded-xl p-1 mb-4">
                                <TabsTrigger
                                    value="whatsapp"
                                    className="flex items-center gap-2 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    WhatsApp
                                </TabsTrigger>
                                <TabsTrigger
                                    value="email"
                                    className="flex items-center gap-2 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    Email
                                </TabsTrigger>
                            </TabsList>

                            {/* Email Register Form */}
                            <TabsContent value="email" className="mt-0">
                                <form onSubmit={handleEmailRegister} className="space-y-4">
                                    {/* Full Name Field */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="fullName" className="text-[11px] font-medium text-muted-foreground">
                                            Full Name
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="fullName"
                                                type="text"
                                                required
                                                placeholder="John Doe"
                                                className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                                                value={emailFormData.fullName}
                                                onChange={(e) => setEmailFormData({ ...emailFormData, fullName: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Email Field */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-[11px] font-medium text-muted-foreground">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                placeholder="you@example.com"
                                                className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                                                value={emailFormData.email}
                                                onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-[11px] font-medium text-muted-foreground">
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                required
                                                placeholder="Min 6 characters"
                                                className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                                                value={emailFormData.password}
                                                onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Confirm Password Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">
                                            Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                required
                                                placeholder="Re-enter password"
                                                className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                                                value={emailFormData.confirmPassword}
                                                onChange={(e) => setEmailFormData({ ...emailFormData, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Register Button */}
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 transition-all"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Creating account...
                                            </>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* WhatsApp Register Form */}
                            <TabsContent value="whatsapp" className="mt-0">
                                <form onSubmit={handleWhatsAppRegister} className="space-y-4">
                                    {/* Full Name Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsappFullName" className="text-sm font-medium text-muted-foreground">
                                            Full Name
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="whatsappFullName"
                                                type="text"
                                                required
                                                placeholder="John Doe"
                                                className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                                                value={whatsappFormData.fullName}
                                                onChange={(e) => setWhatsappFormData({ ...whatsappFormData, fullName: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* WhatsApp Number Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsappNumber" className="text-sm font-medium text-muted-foreground">
                                            WhatsApp Number
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="whatsappNumber"
                                                type="tel"
                                                required
                                                placeholder="10-digit number"
                                                maxLength={10}
                                                className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                                                value={whatsappFormData.whatsappNumber}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    setWhatsappFormData({ ...whatsappFormData, whatsappNumber: value });
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Enter without country code</p>
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsappPassword" className="text-sm font-medium text-muted-foreground">
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="whatsappPassword"
                                                type="password"
                                                required
                                                placeholder="Min 6 characters"
                                                className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                                                value={whatsappFormData.password}
                                                onChange={(e) => setWhatsappFormData({ ...whatsappFormData, password: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Confirm Password Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsappConfirmPassword" className="text-sm font-medium text-muted-foreground">
                                            Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="whatsappConfirmPassword"
                                                type="password"
                                                required
                                                placeholder="Re-enter password"
                                                className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                                                value={whatsappFormData.confirmPassword}
                                                onChange={(e) => setWhatsappFormData({ ...whatsappFormData, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Register Button */}
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 transition-all"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Creating account...
                                            </>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>

                        {/* Login Link (Mobile) */}
                        <p className="text-center text-sm text-muted-foreground lg:hidden">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                            >
                                Login
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
