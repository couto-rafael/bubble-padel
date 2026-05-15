import SEOHead from "./SEOHead";

interface Props {
  fullName: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  variant: "anonymous" | "non_friend";
  onConnect?: () => void;
  onLogin?: () => void;
}

export function RestrictedProfileCard({
  fullName,
  nickname,
  avatarUrl,
  variant,
  onConnect,
  onLogin,
}: Props) {
  const displayName = nickname ?? fullName;
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <SEOHead title={`${fullName} — Bubble Padel`} />
      <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-full bg-[#00e87a]/10 border border-[#00e87a]/20 flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-extrabold text-[#00e87a]">{initials}</span>
          )}
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-extrabold mb-1">{fullName}</h1>
          {nickname && <p className="text-[#00ccff] font-bold">@{nickname}</p>}
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 text-center max-w-sm w-full">
          <svg
            className="mx-auto mb-3 w-7 h-7 text-[#00ccff]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="font-extrabold text-white mb-1">Perfil restrito a conexões</p>
          <p className="text-gray-400 text-sm">
            {variant === "anonymous"
              ? `${displayName} compartilha o perfil apenas com suas conexões.`
              : `Conecte-se com ${displayName} para ver o perfil completo.`}
          </p>
        </div>

        {variant === "anonymous" && onLogin && (
          <button
            onClick={onLogin}
            className="bg-[#00e87a] hover:bg-[#00e87a]/90 text-[#0a0e1a] font-extrabold px-6 py-3 rounded-2xl transition"
          >
            Entrar para conectar
          </button>
        )}
        {variant === "non_friend" && onConnect && (
          <button
            onClick={onConnect}
            className="bg-[#00e87a] hover:bg-[#00e87a]/90 text-[#0a0e1a] font-extrabold px-6 py-3 rounded-2xl transition"
          >
            Conectar com {displayName}
          </button>
        )}
      </div>
    </>
  );
}
