import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const authH = () => ({
  Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
});

interface Thread {
  contactUserId: string;
  contactName: string;
  contactType: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const MessagesPage: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/messages/inbox`, { headers: authH() })
      .then((r) => r.json())
      .then((j) => setThreads(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0);

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-8">
      <AthleteHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">
              Mensagens
            </h1>
            {totalUnread > 0 && (
              <p className="text-[12px] text-gray-400 mt-0.5">
                {totalUnread} não lida{totalUnread > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center pt-16">
            <span className="w-7 h-7 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <span className="text-4xl block mb-3 opacity-30">💬</span>
            <p className="text-[14px] font-bold text-gray-700">Sem mensagens</p>
            <p className="text-[12px] text-gray-400 mt-1">
              Conecte com atletas ou clubes para conversar.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {threads.map((t, i) => (
              <Link
                key={t.contactUserId}
                to={`/athlete/messages/${t.contactUserId}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${i > 0 ? "border-t border-gray-100" : ""}`}
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00e87a] to-[#00b85f] flex items-center justify-center text-[#0a0e1a] text-sm font-extrabold flex-shrink-0 overflow-hidden">
                  {t.avatarUrl ? (
                    <img
                      src={t.avatarUrl}
                      alt={t.contactName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(t.contactName)
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p
                      className={`text-[14px] truncate ${t.unreadCount > 0 ? "font-extrabold text-gray-900" : "font-semibold text-gray-700"}`}
                    >
                      {t.contactName}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                      {timeAgo(t.lastAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-[12px] truncate max-w-[220px] ${t.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400 font-normal"}`}
                    >
                      {t.lastMessage}
                    </p>
                    {t.unreadCount > 0 && (
                      <span className="ml-2 min-w-[18px] h-[18px] px-1 bg-[#00e87a] text-[#0a0e1a] rounded-full text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MessagesPage;
