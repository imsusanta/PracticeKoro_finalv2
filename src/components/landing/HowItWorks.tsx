import React from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Gamepad2,
    LineChart,
    Trophy,
    ArrowRight
} from 'lucide-react';

const steps = [
    {
        icon: Search,
        title: "Find Your Exam",
        desc: "Browse 1,000+ mock tests for SSC, Railways, Banking & more",
        color: "bg-blue-500",
        lightBg: "bg-blue-50",
        step: "1"
    },
    {
        icon: Gamepad2,
        title: "Start Practicing",
        desc: "Take timed tests with real exam interface",
        color: "bg-emerald-500",
        lightBg: "bg-emerald-50",
        step: "2"
    },
    {
        icon: LineChart,
        title: "Analyze Results",
        desc: "Get detailed explanations and track progress",
        color: "bg-purple-500",
        lightBg: "bg-purple-50",
        step: "3"
    },
    {
        icon: Trophy,
        title: "Crack Your Goal",
        desc: "Achieve your dream rank with confidence",
        color: "bg-amber-500",
        lightBg: "bg-amber-50",
        step: "4"
    }
];

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-20 sm:py-24 bg-white">
            <div className="container mx-auto px-5">
                {/* Header */}
                <div className="text-center mb-12 max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                    >
                        <span className="inline-block mb-3 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                            How It Works
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                            Your Path to{' '}
                            <span className="text-emerald-600">Success</span>
                        </h2>
                        <p className="text-slate-500 text-sm sm:text-base">
                            Simple 4-step process to ace your exams
                        </p>
                    </motion.div>
                </div>

                {/* Steps - Horizontal Timeline */}
                <div className="max-w-4xl mx-auto">
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <div className="flex items-start justify-between relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-[2px] bg-slate-100/50 rounded-full pointer-events-none overflow-hidden">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    whileInView={{ width: "100%" }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                    viewport={{ once: true }}
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500"
                                >
                                    {/* Moving Glow Pulse */}
                                    <motion.div
                                        animate={{ x: ["-100%", "500%"] }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "linear",
                                            repeatDelay: 0.5
                                        }}
                                        className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                                    />
                                </motion.div>
                            </div>

                            {steps.map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    className="flex flex-col items-center text-center relative z-10 w-1/4"
                                >
                                    {/* Step Number Circle */}
                                    <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center mb-4`}>
                                        <step.icon className="w-7 h-7 text-white" />
                                    </div>

                                    {/* Step Number */}
                                    <span className="text-xs font-bold text-slate-400 mb-2">Step {step.step}</span>

                                    {/* Title */}
                                    <h3 className="text-base font-bold text-slate-900 mb-1">
                                        {step.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-slate-500 text-xs leading-relaxed px-2">
                                        {step.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile View - Vertical */}
                    <div className="md:hidden space-y-4">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="flex items-start gap-4"
                            >
                                {/* Left Side - Icon & Line */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center shrink-0`}>
                                        <step.icon className="w-6 h-6 text-white" />
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className="w-px h-10 bg-slate-100 mt-2 relative overflow-hidden">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                whileInView={{ height: "100%" }}
                                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                                viewport={{ once: true }}
                                                className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-500 via-emerald-500 to-amber-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Right Side - Content */}
                                <div className="pt-1 pb-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Step {step.step}</span>
                                    <h3 className="text-base font-bold text-slate-900 mb-1">
                                        {step.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm">
                                        {step.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="mt-12 text-center"
                >
                    <a
                        href="/register"
                        className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors"
                    >
                        Get Started Now
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </motion.div>
            </div>
        </section>
    );
};

export default HowItWorks;
