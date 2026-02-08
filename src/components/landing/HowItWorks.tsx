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
        title: "Select Exam Target",
        desc: "Choose from WBP, SSC, Railway or WBSSC mock tests",
        color: "bg-blue-500",
        lightBg: "bg-blue-50",
        step: "1"
    },
    {
        icon: Gamepad2,
        title: "Attempt Mock Test",
        desc: "Experience real exam interface with timer & negative marking",
        color: "bg-emerald-500",
        lightBg: "bg-emerald-50",
        step: "2"
    },
    {
        icon: LineChart,
        title: "Check Score & Rank",
        desc: "Get instant results, detailed solutions & All-India Rank",
        color: "bg-purple-500",
        lightBg: "bg-purple-50",
        step: "3"
    },
    {
        icon: Trophy,
        title: "Achieve Selection",
        desc: "Improve consistently and secure your government job",
        color: "bg-amber-500",
        lightBg: "bg-amber-50",
        step: "4"
    }
];

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-12 sm:py-16 bg-white">
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
                    {/* Desktop View - Premium Interactive Cards */}
                    <div className="hidden md:block">
                        <div className="flex items-start justify-between relative gap-6">
                            {/* Connecting Line (Desktop) */}
                            <div className="absolute top-12 left-[10%] right-[10%] h-[3px] bg-slate-100 rounded-full pointer-events-none overflow-hidden z-0">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    whileInView={{ width: "100%" }}
                                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                                    viewport={{ once: true }}
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 opacity-30"
                                />
                                {/* Moving Glow Pulse */}
                                <motion.div
                                    animate={{ x: ["-100%", "500%"] }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "linear",
                                        repeatDelay: 0.5
                                    }}
                                    className="absolute top-0 left-0 w-32 h-full bg-slate-300 blur-sm"
                                />
                            </div>

                            {steps.map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.15 }}
                                    viewport={{ once: true }}
                                    className="flex flex-col items-center text-center relative z-10 w-1/4 group"
                                >
                                    {/* Card Container */}
                                    <div className="w-full bg-white rounded-2xl p-6 border border-slate-100/60 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-100 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group-hover:bg-slate-50/30">
                                        {/* Step Number Badge */}
                                        <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-300 group-hover:text-emerald-500 transition-colors">
                                            0{step.step}
                                        </div>

                                        {/* Icon */}
                                        <div className={`w-20 h-20 mx-auto rounded-2xl ${step.color} flex items-center justify-center mb-6 shadow-lg shadow-${step.color.split('-')[1]}-500/30 group-hover:scale-110 transition-transform duration-300 ring-4 ring-white`}>
                                            <step.icon className="w-9 h-9 text-white group-hover:rotate-6 transition-transform duration-300" />
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                                            {step.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>

                                    {/* Connecting Dot */}
                                    <div className={`w-4 h-4 rounded-full border-4 border-white ${step.color} shadow-sm mt-8 relative z-20 group-hover:scale-125 transition-transform duration-300`} />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile View - Premium Vertical Timeline */}
                    <div className="md:hidden relative px-2 overflow-hidden">
                        {/* Continuous Vertical Background Line */}
                        <div className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-slate-100" />

                        <div className="space-y-8">
                            {steps.map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    className="flex items-start gap-4 relative"
                                >
                                    {/* Left Side Icon & Progress Line */}
                                    <div className="flex flex-col items-center shrink-0 relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center shadow-lg shadow-${step.color.split('-')[1]}-500/20 ring-4 ring-white`}>
                                            <step.icon className="w-7 h-7 text-white" />
                                        </div>

                                        {/* Animated Overlay Line */}
                                        {idx < steps.length - 1 && (
                                            <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[2px] h-8 overflow-hidden">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    whileInView={{ height: "100%" }}
                                                    transition={{ duration: 0.8, delay: idx * 0.2 }}
                                                    viewport={{ once: true }}
                                                    className="w-full bg-gradient-to-b from-emerald-500 to-teal-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Side - Content Card */}
                                    <div className="flex-1 pt-0.5 min-w-0 overflow-hidden">
                                        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/80 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${step.lightBg} ${step.color.replace('bg-', 'text-')}`}>
                                                    Step {step.step}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 mb-1">
                                                {step.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm leading-relaxed">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
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
