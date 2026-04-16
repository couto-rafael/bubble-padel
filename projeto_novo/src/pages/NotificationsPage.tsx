import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const authH = () => ({
  Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
  "Content-Type": "application/json",
});

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  payload?: any;
  readAt: string | null;
  createdAt: string;
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const TYPE_ICON: Record<string, string> = {
  CONNECTION_REQUEST: "🤝",
  CONNECTION_ACCEPTED: "✅",
  NEW_MESSAGE: "💬",
  TOURNAMENT_INVITE: "🎾",
  CLUB_NEW_TOURNAMENT: "🏆",
  BADGE_UNLOCKED: "🥇",
  RANKING_CHANGE: "📈",
};

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [processed, setProcessed] = useState<
    Record<string, "accepted" | "rejected">
  >({});

  useEffect(() => {
    fetch(`${API_URL}/notifications`, { headers: authH() })
      .then((r) => r.json())
      .then((j) => setNotifications(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await fetch(`${API_URL}/notifications/read-all`, {
      method: "PATCH",
      headers: authH(),
    });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
    );
  };

  const markRead = async (id: string) => {
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: "PATCH",
      headers: authH(),
    });
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
  };

  const handleAccept = async (n: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!n.payload?.friendshipId) return;
    setActionLoading(n.id);
    // Optimistic UI — muda imediatamente
    setProcessed((prev) => ({ ...prev, [n.id]: "accepted" }));
    try {
      await fetch(`${API_URL}/social/connect/${n.payload.friendshipId}`, {
        method: "PATCH",
        headers: authH(),
        body: JSON.stringify({ action: "accept" }),
      });
      markRead(n.id);
    } catch {
      /* ignora */
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (n: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!n.payload?.friendshipId) return;
    setActionLoading(n.id + "_reject");
    // Optimistic UI — muda imediatamente
    setProcessed((prev) => ({ ...prev, [n.id]: "rejected" }));
    try {
      await fetch(`${API_URL}/social/connect/${n.payload.friendshipId}`, {
        method: "PATCH",
        headers: authH(),
        body: JSON.stringify({ action: "reject" }),
      });
      markRead(n.id);
    } catch {
      /* ignora */
    } finally {
      setActionLoading(null);
    }
  };

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.type === "CONNECTION_REQUEST" && n.payload?.senderId)
      navigate(`/athlete/${n.payload.senderId}`);
    else if (n.type === "NEW_MESSAGE" && n.payload?.senderId)
      navigate(`/athlete/messages/${n.payload.senderId}`);
    else if (n.type === "CONNECTION_ACCEPTED" && n.payload?.athleteId)
      navigate(`/athlete/${n.payload.athleteId}`);
  };

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-8">
      <AthleteHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">
              Notificações
            </h1>
            {unread > 0 && (
              <p className="text-[12px] text-gray-400 mt-0.5">
                {unread} não lida{unread > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-[12px] font-bold text-[#00b85f] hover:text-[#009a4f] transition-colors"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center pt-16">
            <span className="w-7 h-7 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <span className="text-4xl block mb-3 opacity-30">🔔</span>
            <p className="text-[14px] font-bold text-gray-700">
              Sem notificações
            </p>
            <p className="text-[12px] text-gray-400 mt-1">
              Quando houver novidades, aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {notifications.map((n, i) => (
              <div
                key={n.id}
                className={`${i > 0 ? "border-t border-gray-100" : ""} ${!n.readAt ? "bg-[#f0fdf6]" : ""}`}
              >
                <button
                  onClick={() => handleClick(n)}
                  className="w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[13px] ${!n.readAt ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}
                    >
                      {n.title}
                    </p>
                    <p className="text-[12px] text-gray-500 mt-0.5 font-normal leading-relaxed">
                      {n.body}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-gray-400">
                      {timeAgo(n.createdAt)}
                    </span>
                    {!n.readAt && (
                      <span className="w-2 h-2 rounded-full bg-[#00e87a]" />
                    )}
                  </div>
                </button>

                {/* Aceitar / Recusar — só para CONNECTION_REQUEST não processado */}
                {n.type === "CONNECTION_REQUEST" && n.payload?.friendshipId && (
                  <div className="flex gap-2 px-5 pb-4 -mt-1">
                    {processed[n.id] === "accepted" ? (
                      <p className="text-[12px] text-[#00b85f] font-bold px-1 py-2">
                        ✓ Conexão aceita
                      </p>
                    ) : processed[n.id] === "rejected" ? (
                      <p className="text-[12px] text-gray-400 font-bold px-1 py-2">
                        ✗ Convite recusado
                      </p>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleAccept(n, e)}
                          disabled={!!actionLoading}
                          className="flex-1 py-2 rounded-xl bg-[#00e87a] text-[#0a0e1a] text-[12px] font-extrabold hover:bg-[#00d470] transition-colors disabled:opacity-50"
                        >
                          {actionLoading === n.id ? "..." : "Aceitar"}
                        </button>
                        <button
                          onClick={(e) => handleReject(n, e)}
                          disabled={!!actionLoading}
                          className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-[12px] font-extrabold hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === n.id + "_reject"
                            ? "..."
                            : "Recusar"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;
