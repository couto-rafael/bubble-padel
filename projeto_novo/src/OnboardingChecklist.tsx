import { Link } from "react-router-dom";
import type { Tournament } from "./types";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface OnboardingChecklistProps {
  tournaments: Tournament[];
  clubName?: string;
}

interface Step {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
  icon: string;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

const OnboardingChecklist = ({
  tournaments,
  clubName,
}: OnboardingChecklistProps) => {
  // Só mostra para clubes com menos de 3 torneios
  if (tournaments.length >= 3) return null;

  const hasTournament = tournaments.length > 0;
  const hasPublishedTournament = tournaments.some((t) =>
    ["published", "open", "ongoing", "completed"].includes(
      t.status?.toLowerCase() ?? "",
    ),
  );
  const hasConfirmedTeams = tournaments.some((t) => (t.totalTeams ?? 0) > 0);
  const hasCompletedTournament = tournaments.some(
    (t) => t.status?.toLowerCase() === "completed",
  );
  const hasGeneratedGroups = tournaments.some(
    (t) => t.status?.toLowerCase() === "ongoing" || hasCompletedTournament,
  );

  const steps: Step[] = [
    {
      id: "profile",
      label: "Complete o perfil do clube",
      description: "Adicione nome, cidade e quadras disponíveis",
      done: !!clubName,
      href: "/dashboard/settungs",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
      id: "tournament",
      label: "Crie seu primeiro torneio",
      description: "Configure categorias, datas e estrutura",
      done: hasTournament,
      href: "/dashboard/tournaments/create",
      icon: "M12 4v16m8-8H4",
    },
    {
      id: "publish",
      label: "Publique e abra as inscrições",
      description: "Compartilhe o link com os atletas",
      done: hasPublishedTournament,
      href: "/dashboard/tournaments",
      icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
    },
    {
      id: "teams",
      label: "Confirme as primeiras duplas",
      description: "Revise e confirme os atletas inscritos",
      done: hasConfirmedTeams,
      href: "/dashboard/tournaments",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      id: "groups",
      label: "Gere grupos e schedule",
      description: "O sistema organiza tudo automaticamente",
      done: hasGeneratedGroups,
      href: "/dashboard/tournaments",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  // Se tudo concluído, mostra parabéns por 1 torneio e some após 2
  if (allDone) {
    return (
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🎉</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">
              Parabéns! Você completou todos os primeiros passos.
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Seu torneio está pronto. Continue organizando mais torneios e
              ajudando a comunidade do padel a crescer!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              🚀 Primeiros passos
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {completedCount} de {steps.length} concluídos
            </p>
          </div>
          <span className="text-sm font-bold text-blue-600">
            {progressPct}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-50">
        {steps.map((step) => (
          <Link
            key={step.id}
            to={step.done ? "#" : step.href}
            onClick={(e) => step.done && e.preventDefault()}
            className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
              step.done ? "cursor-default" : "hover:bg-gray-50 cursor-pointer"
            }`}
          >
            {/* Check circle */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.done ? "bg-emerald-100" : "bg-gray-100"
              }`}
            >
              {step.done ? (
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={step.icon}
                  />
                </svg>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-semibold ${step.done ? "text-gray-400 line-through" : "text-gray-900"}`}
              >
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {step.description}
                </p>
              )}
            </div>

            {/* Arrow */}
            {!step.done && (
              <svg
                className="w-4 h-4 text-gray-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
