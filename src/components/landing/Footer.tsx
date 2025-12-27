import { Send, Phone, Mail, MapPin, Sparkles, CheckCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="relative overflow-hidden">
            {/* Gradient Top Border */}
            <div className="h-1 w-full bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

            {/* Main Footer */}
            <div className="bg-gradient-to-br from-primary/5 via-white to-blue-50/50 border-t border-primary/10">
                <div className="container mx-auto px-4 py-10 md:py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">

                        {/* Brand Column */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/25">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Practice Koro</h3>
                                    <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Exam Prep Simplified</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                                Your ultimate platform for exam preparation. Smart mock tests, detailed analytics, and study materials to help you succeed.
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary">
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-gray-500 ml-1">50K+ students</span>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-gray-900 font-semibold mb-5 flex items-center gap-2">
                                <span className="w-8 h-0.5 bg-primary rounded-full"></span>
                                Quick Links
                            </h4>
                            <ul className="space-y-3 text-sm">
                                {[
                                    { label: "Register", to: "/register" },
                                    { label: "Login", to: "/login" },
                                    { label: "Dashboard", to: "/student/dashboard" },
                                    { label: "Browse Exams", to: "/student/exams" },
                                ].map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.to}
                                            className="text-gray-600 hover:text-primary transition-colors flex items-center gap-1.5 group"
                                        >
                                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                            <span>{link.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h4 className="text-gray-900 font-semibold mb-5 flex items-center gap-2">
                                <span className="w-8 h-0.5 bg-primary rounded-full"></span>
                                Contact Us
                            </h4>
                            <ul className="space-y-4 text-sm">
                                <li className="flex items-start gap-3 group">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-400 uppercase tracking-wide">Phone</p>
                                        <p className="text-gray-700 font-medium">+91 95477 71118</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 group">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <Mail className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-400 uppercase tracking-wide">Email</p>
                                        <p className="text-gray-700 font-medium">contact@practicekoro.online</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 group">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <MapPin className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-400 uppercase tracking-wide">Location</p>
                                        <p className="text-gray-700 font-medium">Sarenga, Bankura, West Bengal</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Telegram CTA */}
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                            <div className="relative bg-white rounded-2xl p-6 border border-primary/20 shadow-xl shadow-primary/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#0088cc] flex items-center justify-center shadow-lg shadow-[#0088cc]/30">
                                        <Send className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Join Our Community</h4>
                                        <p className="text-[10px] text-gray-500">Free notes & daily updates</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                    Get free study notes, daily quizzes, and exam updates on our official Telegram channel.
                                </p>
                                <Button
                                    className="w-full bg-gradient-to-r from-[#0088cc] to-[#00a8e8] hover:from-[#0077b5] hover:to-[#0088cc] text-white border-none shadow-lg shadow-[#0088cc]/20 rounded-xl"
                                    onClick={() => window.open('https://t.me/parikshanotespdf', '_blank')}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    @parikshanotespdf
                                </Button>
                                <div className="flex items-center justify-center gap-2 mt-3">
                                    <div className="flex -space-x-1">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/30 to-blue-400/30 border border-white" />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-500">Join 50K+ students</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Copyright Bar */}
            <div className="bg-gradient-to-r from-primary to-blue-600 text-white">
                <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] sm:text-xs">
                    <p className="font-medium text-center">© 2025 Practice Koro. All rights reserved.</p>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                        <a href="#" className="hover:underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity">Privacy Policy</a>
                        <a href="#" className="hover:underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity">Terms of Service</a>
                        <a href="#" className="hover:underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
