import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            // Get the hash fragment from the URL
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (accessToken && refreshToken) {
                // Set the session manually
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    console.error("Error setting session:", error);
                    navigate("/login?error=auth_failed");
                    return;
                }
            }

            // Check where to redirect based on the original page
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // Check referrer or default redirect
                const intendedPath = sessionStorage.getItem("authRedirect") || "/student/dashboard";
                sessionStorage.removeItem("authRedirect");
                navigate(intendedPath, { replace: true });
            } else {
                navigate("/login", { replace: true });
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-slate-600 font-medium">Completing sign in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
