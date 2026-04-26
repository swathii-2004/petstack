import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { ArrowLeft, Send } from "lucide-react";

interface ChatMessage {
  _id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  text: string;
  created_at: string;
}

export default function ChatPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!appointmentId || !token) return;

    const wsUrl = `ws://localhost:8000/ws/chat/${appointmentId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "history") {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === "ready") {
        setReady(true);
      } else if (data.type === "message") {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
      // Do not setError here, as React Strict Mode closing the first socket triggers this and poisons the state
    };
    ws.onclose = () => setConnected(false);

    return () => ws.close();
  }, [appointmentId, token]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text }));
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-bold text-gray-800 mb-2">Chat Unavailable</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">Appointment Chat</p>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-gray-300"}`}></span>
            {connected ? "Connected" : "Connecting..."}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 space-y-3">
        {!ready && (
          <div className="text-center text-gray-400 text-sm py-8">Loading chat history...</div>
        )}

        {ready && messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            No messages yet. Say hello! 👋
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {!isMine && (
                  <span className="text-xs text-gray-500 font-medium px-1">{msg.sender_name}</span>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isMine
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 border rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-white flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={!connected}
          className="flex-1 border rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50"
        />
        <button
          onClick={sendMessage}
          disabled={!connected || !input.trim()}
          className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 transition shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
