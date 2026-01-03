import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
    const [phase, setPhase] = useState<"logo" | "exit">("logo");

    useEffect(() => {
        // Logo animation duration
        const timer1 = setTimeout(() => {
            setPhase("exit");
        }, 1800);

        // Complete splash screen
        const timer2 = setTimeout(() => {
            onComplete();
        }, 2200);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {phase !== "exit" ? (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-blue-600 to-indigo-700"
                >
                    {/* Background Circles */}
                    <div className="absolute inset-0 overflow-hidden">
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.1 }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border-2 border-white"
                        />
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.08 }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white"
                        />
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.05 }}
                            transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-white"
                        />
                    </div>

                    {/* Logo Container */}
                    <div className="relative text-center">
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                                delay: 0.2
                            }}
                            className="mx-auto mb-6"
                        >
                            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-white flex items-center justify-center" style={{ boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)' }}>
                                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
                            </div>
                        </motion.div>

                        {/* Brand Name */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="text-2xl sm:text-4xl font-bold text-white tracking-tight"
                        >
                            Practice Koro
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            className="text-white/80 text-sm sm:text-base mt-2 font-medium tracking-wide"
                        >
                            #1 Mock Test Platform
                        </motion.p>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
};

export default SplashScreen;
