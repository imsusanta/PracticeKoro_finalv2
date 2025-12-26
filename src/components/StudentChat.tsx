import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    getConversation,
    sendMessage,
    markMessagesAsRead,
    getStudentUnreadCount,
    subscribeToChat,
    unsubscribeFromChat,
    ChatMessage,
} from "@/config/chat";

interface StudentChatProps {
    studentId: string;
    studentName: string;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const StudentChat = ({ studentId, studentName, isOpen: controlledOpen, onOpenChange }: StudentChatProps) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen = (open: boolean) => {
        if (onOpenChange) {
            onOpenChange(open);
        }
        setInternalOpen(open);
    };
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadMessages = async () => {
        try {
            const conv = await getConversation(studentId);
            if (conv) {
                setMessages(conv.messages);
            } else {
                setMessages([]);
            }
            const count = await getStudentUnreadCount(studentId);
            setUnreadCount(count);
        } catch (e) {
            console.error("Error loading messages:", e);
        }
    };

    // Initial load and polling for new messages
    useEffect(() => {
        loadMessages();

        // Poll for new messages every 3 seconds (fallback for realtime)
        const pollInterval = setInterval(() => {
            loadMessages();
        }, 3000);

        // Also try real-time subscription
        let channel: ReturnType<typeof subscribeToChat> | null = null;
        try {
            channel = subscribeToChat(studentId, (newMsg) => {
                setMessages((prev) => {
                    // Avoid duplicates
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                if (isOpen && newMsg.sender_role === "admin") {
                    markMessagesAsRead(studentId, "student");
                } else if (newMsg.sender_role === "admin") {
                    setUnreadCount((prev) => prev + 1);
                }
            });
        } catch (e) {
            console.error("Error subscribing to chat:", e);
        }

        return () => {
            clearInterval(pollInterval);
            if (channel) {
                unsubscribeFromChat(channel);
            }
        };
    }, [studentId]);

    // When chat opens, load fresh messages and mark as read
    useEffect(() => {
        if (isOpen) {
            loadMessages();
            markMessagesAsRead(studentId, "student");
            setUnreadCount(0);
        }
    }, [isOpen]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async () => {
        if (!newMessage.trim() || loading) return;

        setLoading(true);
        try {
            const result = await sendMessage(
                studentId,
                studentId,
                "student",
                newMessage.trim()
            );
            if (result) {
                setNewMessage("");
                // Add message immediately to UI
                setMessages(prev => [...prev, result]);
            }
        } catch (e) {
            console.error("Error sending message:", e);
        }
        setLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    };

    return (
        <>
            {/* Chat Window */}

            {isOpen && (
                <div className="fixed inset-0 z-[100] md:inset-auto md:bottom-4 md:right-4 md:w-96 md:h-[500px] flex flex-col bg-white md:rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 flex items-center justify-between shrink-0 safe-area-inset-top">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Chat with Admin</h3>
                                <p className="text-white/70 text-xs">We typically reply in a few hours</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                    <MessageCircle className="w-8 h-8 text-emerald-600" />
                                </div>
                                <p className="text-gray-600 font-medium">Start a conversation</p>
                                <p className="text-gray-400 text-sm mt-1">Ask any question or share feedback</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, index) => {
                                    const showDate = index === 0 ||
                                        formatDate(msg.created_at) !== formatDate(messages[index - 1].created_at);
                                    const isStudent = msg.sender_role === "student";

                                    return (
                                        <div key={msg.id}>
                                            {showDate && (
                                                <div className="text-center my-4">
                                                    <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full">
                                                        {formatDate(msg.created_at)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${isStudent
                                                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-md"
                                                        : "bg-white text-gray-800 shadow-sm rounded-bl-md"
                                                        }`}
                                                >
                                                    {!isStudent && (
                                                        <p className="text-xs text-emerald-600 font-semibold mb-1">Admin</p>
                                                    )}
                                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                    <p className={`text-[10px] mt-1 ${isStudent ? "text-white/70" : "text-gray-400"}`}>
                                                        {formatTime(msg.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input - With safe area for mobile */}
                    <div
                        className="p-3 bg-white border-t border-gray-100 shrink-0"
                        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!newMessage.trim() || loading}
                                className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentChat;
