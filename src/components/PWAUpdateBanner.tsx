import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';

export const PWAUpdateBanner = () => {
    const { updateAvailable, isUpdating, applyUpdate } = usePWAUpdate();

    if (!updateAvailable) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[9999] px-4 pt-safe-area-top"
            >
                <div className="mt-2 mx-auto max-w-md bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl shadow-2xl shadow-indigo-500/30 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">Update Available!</p>
                        <p className="text-indigo-200 text-xs">Tap to get the latest version</p>
                    </div>
                    <button
                        onClick={applyUpdate}
                        disabled={isUpdating}
                        className="px-4 py-2 rounded-xl bg-white text-indigo-600 font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
                    >
                        {isUpdating ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Update
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
