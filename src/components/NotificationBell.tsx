import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, Clock, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getReadNotificationIds,
    Notification,
} from "@/config/notifications";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [readIds, setReadIds] = useState<string[]>([]);
    const [open, setOpen] = useState(false);

    const loadNotifications = () => {
        const notifs = getNotifications();
        const reads = getReadNotificationIds();
        setNotifications(notifs);
        setReadIds(reads);
        setUnreadCount(notifs.filter(n => !reads.includes(n.id)).length);
    };

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = (id: string) => {
        markNotificationAsRead(id);
        loadNotifications();
    };

    const handleMarkAllRead = () => {
        markAllNotificationsAsRead();
        loadNotifications();
    };

    const handleNotificationClick = (notification: Notification) => {
        handleMarkAsRead(notification.id);
        if (notification.testId) {
            navigate(`/student/take-test/${notification.testId}`);
            setOpen(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    const getTypeIcon = (type: Notification["type"]) => {
        switch (type) {
            case "new_test":
                return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case "reminder":
                return <Clock className="w-4 h-4 text-amber-500" />;
            case "announcement":
                return <Megaphone className="w-4 h-4 text-blue-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative w-10 h-10 rounded-xl hover:bg-emerald-50"
                >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] p-0">
                <SheetHeader className="p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <Bell className="w-4 h-4 text-white" />
                            </div>
                            Notifications
                        </SheetTitle>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllRead}
                                className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                                Mark all read
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-100px)]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                <Bell className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No notifications yet</p>
                            <p className="text-gray-400 text-sm text-center mt-1">
                                You'll see new test alerts and announcements here
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => {
                                const isRead = readIds.includes(notification.id);
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${!isRead ? "bg-emerald-50/50" : ""
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notification.type === "new_test"
                                                    ? "bg-emerald-100"
                                                    : notification.type === "reminder"
                                                        ? "bg-amber-100"
                                                        : "bg-blue-100"
                                                }`}>
                                                {getTypeIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm font-medium ${!isRead ? "text-gray-900" : "text-gray-600"}`}>
                                                        {notification.title}
                                                    </p>
                                                    {!isRead && (
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                {notification.testTitle && (
                                                    <Badge className="mt-2 text-[10px] bg-emerald-100 text-emerald-700 border-0">
                                                        {notification.testTitle}
                                                    </Badge>
                                                )}
                                                <p className="text-[10px] text-gray-400 mt-2">
                                                    {formatTime(notification.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default NotificationBell;
