import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const AIConfigSettings = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [settings, setSettings] = useState({
        openrouter_api_key: "",
        openrouter_model: "meta-llama/llama-3.3-70b-instruct:free",
    });

    const fetchUserRole = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id)
                .maybeSingle();
            setUserRole(data?.role || null);
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("site_settings")
                .select("key, value");

            if (error) throw error;

            if (data) {
                setSettings(prev => {
                    const newSettings = { ...prev };
                    data.forEach((item) => {
                        if (item.key === "openrouter_api_key") newSettings.openrouter_api_key = item.value || "";
                        if (item.key === "openrouter_model") newSettings.openrouter_model = item.value || "";
                    });
                    return newSettings;
                });
            }
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error("Error fetching settings:", error);
            // Don't show toast on load failure if it's just missing table (first run)
            if (err.code !== '42P01') {
                toast({
                    title: "Error",
                    description: err.message || "Failed to load settings",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const init = async () => {
            await fetchUserRole();
            fetchSettings();
        };
        init();
    }, [fetchUserRole, fetchSettings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = [
                { key: "openrouter_api_key", value: settings.openrouter_api_key, updated_at: new Date().toISOString() },
                { key: "openrouter_model", value: settings.openrouter_model, updated_at: new Date().toISOString() },
            ];

            // Use upsert with onConflict to properly handle existing keys
            for (const update of updates) {
                const { error } = await supabase
                    .from("site_settings")
                    .upsert(update, { onConflict: 'key' });

                if (error) {
                    console.error(`Error saving ${update.key}:`, error);
                    throw error;
                }
            }

            toast({
                title: "Success",
                description: "AI settings saved successfully",
            });
        } catch (error: unknown) {
            const err = error as { message?: string; code?: string };
            console.error("Error saving settings:", error);

            // Check for RLS policy violation
            if (err.code === '42501' || err.message?.includes('policy')) {
                toast({
                    title: "Permission Denied",
                    description: "You need admin or super_admin role to save settings. Please run the latest SQL migration in your Supabase dashboard.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: err.message || "Failed to save settings",
                    variant: "destructive",
                });
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="AI Settings">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="AI Settings" subtitle="Configure OpenRouter and AI models">
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-emerald-600" />
                            OpenRouter Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="api_key">OpenRouter API Key</Label>
                            <Input
                                id="api_key"
                                type="password"
                                value={settings.openrouter_api_key}
                                onChange={(e) => setSettings({ ...settings, openrouter_api_key: e.target.value })}
                                placeholder="sk-or-v1-..."
                                className="rounded-xl"
                            />
                            <p className="text-xs text-gray-500">
                                Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">OpenRouter</a>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="model">AI Model</Label>
                            <Input
                                id="model"
                                value={settings.openrouter_model}
                                onChange={(e) => setSettings({ ...settings, openrouter_model: e.target.value })}
                                placeholder="meta-llama/llama-3.3-70b-instruct:free"
                                className="rounded-xl"
                            />
                            <p className="text-xs text-gray-500">
                                Model ID from OpenRouter (e.g., meta-llama/llama-3.3-70b-instruct:free)
                            </p>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-semibold shadow-lg shadow-emerald-200/50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </Button>

                        {/* Diagnostic Help */}
                        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Troubleshooting</p>
                                <div className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-medium text-slate-600">
                                    Role: {userRole || 'Loading...'}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">
                                If saving fails consistently, please ensure you have applied the latest SQL migration in your Supabase SQL Editor:
                            </p>
                            <code className="block p-2 text-[10px] bg-slate-200 rounded-md text-slate-700 break-all select-all">
                                supabase/migrations/20260121_ai_settings_and_library.sql
                            </code>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default AIConfigSettings;
