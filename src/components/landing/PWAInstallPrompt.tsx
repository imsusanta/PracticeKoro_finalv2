import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone, Zap, CheckCircle, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed before (within 7 days)
        const dismissedTime = localStorage.getItem("pwa-prompt-dismissed");
        if (dismissedTime) {
            const dismissedDate = new Date(parseInt(dismissedTime));
            const now = new Date();
            const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff < 7) {
                // Don't auto-show, but still allow manual trigger
            } else {
                // Auto show after timeout
                setTimeout(() => setShowPrompt(true), 3000);
            }
        }

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        if (isIOSDevice && !dismissedTime) {
            // Show prompt after 3 seconds for iOS
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
            return () => clearTimeout(timer);
        }

        // Handle beforeinstallprompt event for Android/Chrome
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show prompt after 3 seconds if not dismissed
            if (!dismissedTime) {
                setTimeout(() => {
                    setShowPrompt(true);
                }, 3000);
            }
        };

        // Listen for manual trigger from App Download section
        const handleManualTrigger = () => {
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("show-pwa-prompt", handleManualTrigger);

        // Check if app was installed
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("show-pwa-prompt", handleManualTrigger);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
    };

    const handleIOSInstall = () => {
        setShowIOSGuide(true);
    };

    if (isInstalled || (!deferredPrompt && !isIOS)) {
        return null;
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        onClick={handleDismiss}
                    />

                    {/* Main Prompt - Bottom Sheet Style */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[101] p-4 pb-safe"
                    >
                        <div className="bg-white rounded-t-[28px] overflow-hidden shadow-2xl max-w-lg mx-auto">
                            {/* Drag Handle */}
                            <div className="flex justify-center py-3">
                                <div className="w-10 h-1 bg-gray-300 rounded-full" />
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>

                            {showIOSGuide ? (
                                /* iOS Installation Guide */
                                <div className="px-6 pb-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                            <Zap className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Install on iPhone</h3>
                                            <p className="text-sm text-gray-500">Follow these steps</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                <Share className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">Step 1: Tap Share</p>
                                                <p className="text-xs text-gray-500">Tap the share button at the bottom of Safari</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                                <Plus className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">Step 2: Add to Home Screen</p>
                                                <p className="text-xs text-gray-500">Scroll down and tap "Add to Home Screen"</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                                <CheckCircle className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">Step 3: Tap Add</p>
                                                <p className="text-xs text-gray-500">Confirm by tapping "Add" in the top right corner</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleDismiss}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-2xl py-4 text-base shadow-lg shadow-emerald-500/20"
                                    >
                                        Got it!
                                    </Button>
                                </div>
                            ) : (
                                /* Main Install Prompt */
                                <div className="px-6 pb-8">
                                    {/* App Icon & Info */}
                                    <div className="flex items-center gap-4 mb-5">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", delay: 0.1 }}
                                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                                        >
                                            <Zap className="w-8 h-8 text-white" />
                                        </motion.div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900">Practice Koro</h3>
                                            <p className="text-sm text-gray-500">Install our app for better experience</p>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {[
                                            { icon: Smartphone, text: "Works offline", color: "from-blue-500 to-blue-600" },
                                            { icon: Zap, text: "Faster loading", color: "from-amber-500 to-orange-500" },
                                            { icon: Download, text: "No app store", color: "from-purple-500 to-pink-500" },
                                            { icon: CheckCircle, text: "Push notifications", color: "from-emerald-500 to-teal-500" },
                                        ].map((feature, index) => (
                                            <motion.div
                                                key={feature.text}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 + index * 0.05 }}
                                                className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl"
                                            >
                                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0`}>
                                                    <feature.icon className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-xs font-medium text-gray-700">{feature.text}</span>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        <Button
                                            onClick={isIOS ? handleIOSInstall : handleInstall}
                                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl py-5 text-base shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all"
                                        >
                                            <Download className="w-5 h-5 mr-2" />
                                            {isIOS ? "Show How to Install" : "Install App"}
                                        </Button>

                                        <button
                                            onClick={handleDismiss}
                                            className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            Maybe later
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
