import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  MessageCircle,
  Heart,
  Apple,
  Activity,
  Pill,
} from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  { icon: Heart, text: "How is my HbA1c level?", color: "text-pink-500" },
  { icon: Apple, text: "What should I eat today?", color: "text-green-500" },
  { icon: Activity, text: "Summarize my health status", color: "text-purple-500" },
  { icon: Pill, text: "What medications am I on?", color: "text-blue-500" },
];

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await api.post("/chat/message", { message: messageText });
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: res.data.reply,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Sorry, I couldn't process your request right now. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Navbar title="AI Health" subtitle="Assistant" subtitleHighlight="Chat" steps={0} />

      <div className="flex-1 flex flex-col px-8 pb-6 overflow-hidden">
        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
              {/* Bot Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-200">
                  <Bot size={36} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-[3px] border-white flex items-center justify-center">
                  <Sparkles size={12} className="text-white" />
                </div>
              </div>

              <div className="text-center max-w-md">
                <h2 className="text-2xl font-black text-gray-900 mb-2">
                  Hi! I'm your GlucoGuide AI
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  I have access to your clinical reports, daily logs, medications,
                  and lifestyle plans. Ask me anything about your health!
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg mt-2">
                {SUGGESTED_QUESTIONS.map((q, i) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => sendMessage(q.text)}
                      className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md hover:shadow-purple-50 transition-all text-left group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gray-50 group-hover:bg-purple-50 flex items-center justify-center transition-colors">
                        <Icon size={16} className={q.color} />
                      </div>
                      <span className="text-xs font-bold text-gray-600 group-hover:text-gray-800 transition-colors">
                        {q.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 mb-5 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-tr-md shadow-md shadow-purple-100"
                    : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-md"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={16} className="text-purple-600" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl rounded-tl-md">
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-purple-600" />
                  <span className="text-xs font-bold text-gray-400">
                    Analyzing your health data...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
            <MessageCircle size={18} className="text-gray-300 ml-3" />
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your health, diet, medications..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50 py-2"
            />
            <button
              id="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-30 disabled:hover:bg-purple-600 transition-all shadow-sm hover:shadow-md"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              Powered by GlucoGuide AI • Not medical advice
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
