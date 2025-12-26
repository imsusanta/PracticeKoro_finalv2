// Chat System using Supabase Database
// Provides real-time chat between students and admin

import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
    id: string;
    student_id: string;
    sender_id: string;
    sender_role: "student" | "admin";
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface ChatConversation {
    studentId: string;
    studentName: string;
    messages: ChatMessage[];
    lastMessageAt: string;
    unreadByAdmin: number;
    unreadByStudent: number;
}

// Get all conversations (for admin)
export const getAllConversations = async (): Promise<{ [studentId: string]: ChatConversation }> => {
    try {
        // First get all messages
        const { data: messages, error } = await supabase
            .from("chat_messages")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching conversations:", error);
            return {};
        }

        if (!messages || messages.length === 0) {
            return {};
        }

        // Get unique student IDs
        const studentIds = [...new Set(messages.map(m => m.student_id))];

        // Fetch student profiles
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", studentIds);

        const profileMap: { [id: string]: string } = {};
        profiles?.forEach(p => {
            profileMap[p.id] = p.full_name || "Unknown Student";
        });

        // Group messages by student
        const conversations: { [studentId: string]: ChatConversation } = {};

        messages.forEach((msg: any) => {
            const studentId = msg.student_id;
            const studentName = profileMap[studentId] || "Unknown Student";

            if (!conversations[studentId]) {
                conversations[studentId] = {
                    studentId,
                    studentName,
                    messages: [],
                    lastMessageAt: msg.created_at,
                    unreadByAdmin: 0,
                    unreadByStudent: 0,
                };
            }

            conversations[studentId].messages.push({
                id: msg.id,
                student_id: msg.student_id,
                sender_id: msg.sender_id,
                sender_role: msg.sender_role,
                message: msg.message,
                is_read: msg.is_read,
                created_at: msg.created_at,
            });

            conversations[studentId].lastMessageAt = msg.created_at;

            // Count unread messages
            if (!msg.is_read) {
                if (msg.sender_role === "student") {
                    conversations[studentId].unreadByAdmin += 1;
                } else {
                    conversations[studentId].unreadByStudent += 1;
                }
            }
        });

        return conversations;
    } catch (e) {
        console.error("Error in getAllConversations:", e);
        return {};
    }
};

// Get conversation for a specific student
export const getConversation = async (studentId: string): Promise<ChatConversation | null> => {
    try {
        const { data: messages, error } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("student_id", studentId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching conversation:", error);
            return null;
        }

        if (!messages || messages.length === 0) return null;

        // Get student name
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", studentId)
            .single();

        const studentName = profile?.full_name || "Unknown Student";

        const conversation: ChatConversation = {
            studentId,
            studentName,
            messages: [],
            lastMessageAt: "",
            unreadByAdmin: 0,
            unreadByStudent: 0,
        };

        messages.forEach((msg: any) => {
            conversation.messages.push({
                id: msg.id,
                student_id: msg.student_id,
                sender_id: msg.sender_id,
                sender_role: msg.sender_role,
                message: msg.message,
                is_read: msg.is_read,
                created_at: msg.created_at,
            });

            conversation.lastMessageAt = msg.created_at;

            if (!msg.is_read) {
                if (msg.sender_role === "student") {
                    conversation.unreadByAdmin += 1;
                } else {
                    conversation.unreadByStudent += 1;
                }
            }
        });

        return conversation;
    } catch (e) {
        console.error("Error in getConversation:", e);
        return null;
    }
};

// Send a message
export const sendMessage = async (
    studentId: string,
    senderId: string,
    senderRole: "student" | "admin",
    message: string
): Promise<ChatMessage | null> => {
    try {
        const { data, error } = await supabase
            .from("chat_messages")
            .insert({
                student_id: studentId,
                sender_id: senderId,
                sender_role: senderRole,
                message,
                is_read: false,
            })
            .select()
            .single();

        if (error) {
            console.error("Error sending message:", error);
            return null;
        }

        return data as ChatMessage;
    } catch (e) {
        console.error("Error in sendMessage:", e);
        return null;
    }
};

// Mark messages as read
export const markMessagesAsRead = async (studentId: string, byRole: "student" | "admin"): Promise<void> => {
    try {
        // Mark messages sent by the OTHER party as read
        const targetRole = byRole === "admin" ? "student" : "admin";

        const { error } = await supabase
            .from("chat_messages")
            .update({ is_read: true })
            .eq("student_id", studentId)
            .eq("sender_role", targetRole)
            .eq("is_read", false);

        if (error) {
            console.error("Error marking messages as read:", error);
        }
    } catch (e) {
        console.error("Error in markMessagesAsRead:", e);
    }
};

// Get total unread count for admin
export const getAdminUnreadCount = async (): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("sender_role", "student")
            .eq("is_read", false);

        if (error) {
            console.error("Error getting unread count:", error);
            return 0;
        }

        return count || 0;
    } catch (e) {
        console.error("Error in getAdminUnreadCount:", e);
        return 0;
    }
};

// Get unread count for a student
export const getStudentUnreadCount = async (studentId: string): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("student_id", studentId)
            .eq("sender_role", "admin")
            .eq("is_read", false);

        if (error) {
            console.error("Error getting student unread count:", error);
            return 0;
        }

        return count || 0;
    } catch (e) {
        console.error("Error in getStudentUnreadCount:", e);
        return 0;
    }
};

// Delete a conversation (admin only)
export const deleteConversation = async (studentId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from("chat_messages")
            .delete()
            .eq("student_id", studentId);

        if (error) {
            console.error("Error deleting conversation:", error);
        }
    } catch (e) {
        console.error("Error in deleteConversation:", e);
    }
};

// Subscribe to real-time chat updates for a specific student
export const subscribeToChat = (
    studentId: string,
    onNewMessage: (message: ChatMessage) => void
): RealtimeChannel => {
    const channel = supabase
        .channel(`chat-${studentId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "chat_messages",
                filter: `student_id=eq.${studentId}`,
            },
            (payload) => {
                onNewMessage(payload.new as ChatMessage);
            }
        )
        .subscribe();

    return channel;
};

// Subscribe to all chat updates (for admin)
export const subscribeToAllChats = (
    onNewMessage: (message: ChatMessage) => void
): RealtimeChannel => {
    const channel = supabase
        .channel("all-chats")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "chat_messages",
            },
            (payload) => {
                onNewMessage(payload.new as ChatMessage);
            }
        )
        .subscribe();

    return channel;
};

// Unsubscribe from a channel
export const unsubscribeFromChat = (channel: RealtimeChannel): void => {
    supabase.removeChannel(channel);
};
