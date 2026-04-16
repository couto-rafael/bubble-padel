import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const token = () => localStorage.getItem("auth_token") ?? "";
const authH = () => ({
  Authorization: `Bearer ${token()}`,
  "Content-Type": "application/json",
});

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

interface ContactInfo {
  id: string;
  name: string;
  type: string;
  athlete?: { avatarUrl?: string | null };
  club?: { logoUrl?: string | null };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(date: string) {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Hoje";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const MessageThreadPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const myUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") ?? "{}").id ?? "";
    } catch {
      return "";
    }
  })();

  const [messages, setMessages] = useState<Message[]>([]);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;

    // Fetch messages
    fetch(`${API_URL}/messages/thread/${userId}`, { headers: authH() })
      .then((r) => r.json())
      .then((j) => setMessages(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch contact info
    fetch(`${API_URL}/auth/user/${userId}`, { headers: authH() })
      .then((r) => r.json())
      .then((j) => setContact(j.data ?? null))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !userId) return;
    setSending(true);
    try {
      const receiverType = contact?.type === "CLUB" ? "CLUB" : "ATHLETE";
      // receiverId for messages is the entity id (club.id or athlete.id), not userId
      // We send to userId and let backend resolve
      const r = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: authH(),
        body: JSON.stringify({
          receiverId: userId,
          receiverType,
          content: input.trim(),
        }),
      });
      const j = await r.json();
      if (r.ok) {
        setMessages((prev) => [...prev, j.data]);
        setInput("");
      }
    } catch {
      /* ignora */
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Group messages by day
  const grouped: { day: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const day = formatDay(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last?.day === day) last.msgs.push(msg);
    else grouped.push({ day, msgs: [msg] });
  }

  const avatarUrl =
    contact?.athlete?.avatarUrl ?? contact?.club?.logoUrl ?? null;

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
      <AthleteHeader />

      {/* Thread header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-16 z-10">
        <button
          onClick={() => navigate("/athlete/messages")}
          className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00e87a] to-[#00b85f] flex items-center justify-center text-[#0a0e1a] text-xs font-extrabold overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(contact?.name ?? "?")
          )}
        </div>
        <div>
          <p className="text-[14px] font-extrabold text-gray-900 leading-tight">
            {contact?.name ?? "..."}
          </p>
          <p className="text-[11px] text-gray-400">
            {contact?.type === "CLUB" ? "Clube" : "Atleta"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 max-w-2xl w-full mx-auto">
        {loading ? (
          <div className="flex justify-center pt-12">
            <span className="w-7 h-7 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-3xl block mb-2 opacity-30">💬</span>
            <p className="text-[13px] text-gray-400">
              Nenhuma mensagem ainda. Diga olá!
            </p>
          </div>
        ) : (
          grouped.map(({ day, msgs }) => (
            <div key={day}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-semibold px-2">
                  {day}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              {msgs.map((msg) => {
                const isMine = msg.senderId === myUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                        isMine
                          ? "bg-[#00e87a] text-[#0a0e1a] rounded-br-sm font-medium"
                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 text-right ${isMine ? "text-[#0a0e1a]/50" : "text-gray-400"}`}
                      >
                        {formatTime(msg.createdAt)}
                        {isMine && msg.readAt && " · lida"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escreva uma mensagem..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00e87a] transition-colors bg-gray-50 leading-relaxed"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-[#00e87a] text-[#0a0e1a] flex items-center justify-center flex-shrink-0 hover:bg-[#00d470] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageThreadPage;
