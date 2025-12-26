// In-App Notification System using localStorage
// This provides a simple notification system without needing database changes

const NOTIFICATIONS_KEY = "practicekoro_notifications";
const NOTIFICATION_READ_KEY = "practicekoro_notifications_read";

export interface Notification {
    id: string;
    title: string;
    message: string;
    testId?: string;
    testTitle?: string;
    type: "new_test" | "reminder" | "announcement";
    createdAt: string;
    expiresAt?: string;
}

// Get all notifications
export const getNotifications = (): Notification[] => {
    try {
        const stored = localStorage.getItem(NOTIFICATIONS_KEY);
        if (stored) {
            const notifications = JSON.parse(stored) as Notification[];
            // Filter out expired notifications
            const now = new Date().toISOString();
            return notifications.filter(n => !n.expiresAt || n.expiresAt > now);
        }
    } catch (e) {
        console.error("Error reading notifications:", e);
    }
    return [];
};

// Add a new notification (called by admin)
export const addNotification = (notification: Omit<Notification, "id" | "createdAt">): Notification => {
    const notifications = getNotifications();
    const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotification);
    // Keep only last 50 notifications
    const trimmed = notifications.slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
    return newNotification;
};

// Get read notification IDs for current user
export const getReadNotificationIds = (): string[] => {
    try {
        const stored = localStorage.getItem(NOTIFICATION_READ_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error reading notification read status:", e);
    }
    return [];
};

// Mark notification as read
export const markNotificationAsRead = (notificationId: string): void => {
    const readIds = getReadNotificationIds();
    if (!readIds.includes(notificationId)) {
        readIds.push(notificationId);
        localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(readIds));
    }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = (): void => {
    const notifications = getNotifications();
    const allIds = notifications.map(n => n.id);
    localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(allIds));
};

// Get unread count
export const getUnreadCount = (): number => {
    const notifications = getNotifications();
    const readIds = getReadNotificationIds();
    return notifications.filter(n => !readIds.includes(n.id)).length;
};

// Delete a notification (admin only)
export const deleteNotification = (notificationId: string): void => {
    const notifications = getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
};

// Clear all notifications (admin only)
export const clearAllNotifications = (): void => {
    localStorage.removeItem(NOTIFICATIONS_KEY);
    localStorage.removeItem(NOTIFICATION_READ_KEY);
};

// Send browser notification if permitted
export const sendBrowserNotification = async (title: string, body: string): Promise<boolean> => {
    if (!("Notification" in window)) {
        console.log("Browser doesn't support notifications");
        return false;
    }

    if (Notification.permission === "granted") {
        new Notification(title, {
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: "practicekoro-notification"
        });
        return true;
    } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            new Notification(title, {
                body,
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                tag: "practicekoro-notification"
            });
            return true;
        }
    }
    return false;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
        return false;
    }
    if (Notification.permission === "granted") {
        return true;
    }
    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }
    return false;
};
