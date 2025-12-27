import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { studentNav } from "@/config/studentNav";
import { Home, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarInset,
    useSidebar,
} from "@/components/ui/sidebar";
import { motion, AnimatePresence } from "framer-motion";

interface StudentLayoutProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    headerActions?: ReactNode;
}

// Sidebar Toggle Button Component - Same position as Admin Panel
const SidebarToggleButton = () => {
    const { state, toggleSidebar } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <button
            onClick={toggleSidebar}
            className={`hidden md:flex fixed z-[100] rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 items-center justify-center hover:from-indigo-600 hover:to-violet-700 hover:shadow-xl hover:scale-110 transition-all duration-300 border-2 border-white w-8 h-8 ${isCollapsed
                ? "left-[2.5rem] top-5"
                : "left-[15.5rem] top-5"
                }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
            {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-white" />
            ) : (
                <ChevronLeft className="w-4 h-4 text-white" />
            )}
        </button>
    );
};

// Page transition config
const pageTransition: any = {
    duration: 0.25,
    ease: "easeInOut",
};

// Icon color schemes for nav items
const iconColors = [
    { bg: "from-indigo-100 to-violet-100", icon: "text-indigo-600", activeBg: "from-indigo-500 to-violet-500", glow: "shadow-indigo-500/30" },
    { bg: "from-emerald-100 to-teal-100", icon: "text-emerald-600", activeBg: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/30" },
    { bg: "from-blue-100 to-cyan-100", icon: "text-blue-600", activeBg: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/30" },
    { bg: "from-purple-100 to-pink-100", icon: "text-purple-600", activeBg: "from-purple-500 to-pink-500", glow: "shadow-purple-500/30" },
    { bg: "from-orange-100 to-amber-100", icon: "text-orange-600", activeBg: "from-orange-500 to-amber-500", glow: "shadow-orange-500/30" },
];

const StudentLayout = ({ title, subtitle, children, headerActions }: StudentLayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const goToHome = () => {
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 relative flex flex-col overflow-x-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-indigo-200/40 to-violet-200/40 rounded-full blur-3xl animate-float" />
                <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-40 right-1/4 w-[450px] h-[450px] bg-gradient-to-br from-purple-200/25 to-pink-200/25 rounded-full blur-3xl" style={{ animationDelay: '2s' }} />
                {/* Subtle dot pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.025)_1px,transparent_0)] bg-[size:24px_24px]" />
            </div>

            <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SidebarToggleButton />

                {/* Desktop Sidebar - Fixed */}
                <Sidebar
                    side="left"
                    variant="sidebar"
                    collapsible="icon"
                    className="hidden md:flex bg-white/80 backdrop-blur-2xl border-r border-slate-100/80 transition-all duration-500 h-screen sticky top-0"
                    style={{
                        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.04)'
                    }}
                >
                    <SidebarHeader className="border-b border-slate-100/60 bg-gradient-to-r from-white/90 to-indigo-50/30">
                        <div className="flex items-center gap-3 px-3 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center">
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 3 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0"
                                style={{
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
                                }}
                            >
                                <Zap className="w-5 h-5 text-white" />
                            </motion.div>
                            <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                                <h1 className="text-base font-bold text-slate-900 whitespace-nowrap tracking-tight">Student Panel</h1>
                                <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">Practice Koro</p>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="py-4 px-2 flex flex-col h-full group-data-[collapsible=icon]:px-2">
                        <div className="flex-1">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3 group-data-[collapsible=icon]:hidden">Menu</p>
                            <SidebarMenu className="space-y-1">
                                {studentNav.map((item, index) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    const colorSet = iconColors[index % iconColors.length];

                                    return (
                                        <SidebarMenuItem key={item.path}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                className={`rounded-xl transition-all duration-200 group/item h-auto ${isActive
                                                    ? `bg-gradient-to-r ${colorSet.activeBg} text-white shadow-lg ${colorSet.glow}`
                                                    : "text-slate-600 hover:bg-slate-50"
                                                    } group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2`}
                                            >
                                                <Link
                                                    to={item.path}
                                                    title={item.name}
                                                    className="flex items-center gap-3 px-3 py-2.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                                                >
                                                    <motion.div
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${isActive
                                                            ? "bg-white/25"
                                                            : `bg-gradient-to-br ${colorSet.bg}`
                                                            }`}
                                                    >
                                                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : colorSet.icon}`} />
                                                    </motion.div>
                                                    <span className="font-medium text-sm group-data-[collapsible=icon]:hidden whitespace-nowrap">{item.name}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100/60 space-y-1">
                            <SidebarMenuButton
                                asChild
                                className="w-full rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group/btn group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 h-auto"
                            >
                                <button
                                    onClick={goToHome}
                                    title="Home"
                                    className="flex items-center gap-3 px-3 py-2.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0"
                                    >
                                        <Home className="w-4 h-4 text-blue-500" />
                                    </motion.div>
                                    <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">Home</span>
                                </button>
                            </SidebarMenuButton>
                        </div>
                    </SidebarContent>
                </Sidebar>

                <SidebarInset className="bg-transparent flex-1 md:h-screen md:overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.main
                            key={location.pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={pageTransition}
                            className="flex-1 px-3 py-3 md:p-6 pb-24 md:pb-6 relative z-10 w-full max-w-7xl mx-auto"
                        >
                            <div className="w-full">
                                {children}
                            </div>
                        </motion.main>
                    </AnimatePresence>
                </SidebarInset>
            </SidebarProvider>

            {/* ═══════════════════════════════════════════════════════════════
                        PREMIUM MOBILE BOTTOM NAVIGATION - Native App Style
                        ═══════════════════════════════════════════════════════════════ */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-3 pb-4 pointer-events-none w-full max-w-full overflow-x-hidden">
                <div className="bottom-nav-container pointer-events-auto w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-[20px]">
                    <div className="flex items-center justify-around py-1.5 px-1">
                        {studentNav.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            const colorSet = iconColors[index % iconColors.length];

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-0.5"
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className="relative flex flex-col items-center justify-center w-full h-full"
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="navActiveBackground"
                                                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colorSet.activeBg} opacity-100`}
                                                style={{
                                                    boxShadow: `0 8px 16px ${colorSet.glow.replace('shadow-', '').replace('/30', '').replace('indigo-500', 'rgba(99, 102, 241, 0.3)')}`
                                                }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 30
                                                }}
                                            />
                                        )}

                                        <Icon
                                            className={`w-4 h-4 relative z-10 transition-all duration-200 ${isActive ? "text-white" : "text-slate-400"}`}
                                        />
                                        <span
                                            className={`relative z-10 text-[9px] font-bold mt-1 transition-all duration-200 ${isActive ? "text-white" : "text-slate-400"}`}
                                        >
                                            {item.name}
                                        </span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default StudentLayout;
