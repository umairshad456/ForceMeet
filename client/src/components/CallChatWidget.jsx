import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import clsx from "clsx";
import axiosInstance from "../apis/axiosInstance";

const CallChatWidget = ({ call }) => {

    const callId = call?.id
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    // Send chat message
    const sendMessage = async () => {
        try {

            if (!input.trim()) return;

            const localUser = call?.state?.localParticipant;

            const newMessage = {
                type: "chat.message",
                message: input,
                senderId: localUser?.userId || "me",
                senderName: localUser?.name || "Guest",
                senderEmail: localUser?.userId || "unknown@user",
                createdAt: new Date().toISOString(),
            };

            const response = await axiosInstance.post(`/api/chats/sendMessage/${callId}`, newMessage)
            if (response.status === 200) {
                setMessages((prev) => [...prev, response.data.data]);
            }
            setInput("");
        } catch (error) {
            console.log(error)
            console.log(error?.response?.data?.messages)
        }
    };

    const getMessage = async () => {
        try {
            const response = await axiosInstance.get(`/api/chats/getMessage/${callId}`)
            if (response.status === 200) {
                setMessages(response.data.messages || []);
            }
        } catch (error) {
            console.log(error)
            console.log(error?.response?.data?.message)
        }
    }

    useEffect(() => {
        if (!callId) return
        getMessage()
    }, [callId, sendMessage])


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    return (
        <div className="flex flex-col h-full bg-gray-900 overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-gray-700 text-white font-semibold">
                Call Chat
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                    <p className="text-gray-500 text-center mt-10">No messages yet</p>
                )}
                {messages.map((msg, i) => {
                    const isMe = msg.senderId === call?.state?.localParticipant?.userId;
                    return (
                        <div
                            key={i}
                            className={clsx("flex flex-col max-w-[75%]", {
                                "ml-auto items-end": isMe,
                                "items-start": !isMe,
                            })}
                        >
                            {/* Sender Info */}
                            <span className="text-xs text-gray-400 mb-1">
                                {msg.senderName || msg.senderEmail}
                            </span>

                            {/* Bubble */}
                            <div
                                className={clsx(
                                    "px-4 py-2 rounded-2xl text-sm shadow break-all",
                                    isMe ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"
                                )}
                            >
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-700 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg text-white transition-colors"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default CallChatWidget;
