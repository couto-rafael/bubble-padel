import React from "react";
import { Link } from "react-router-dom";
import { FeedPost } from "../services/api";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

interface Props {
  post: FeedPost;
}

const AthletePostCard: React.FC<Props> = ({ post }) => {
  const author = post.athlete;
  const meta = post.metadata ?? {};

  const initials = author.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      {/* author row */}
      <div className="flex items-center gap-3 mb-3">
        <Link to={`/athletes/${author.id}`} className="shrink-0">
          {author.avatarUrl ? (
            <img
              src={author.avatarUrl}
              alt={author.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {initials}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={`/athletes/${author.id}`}
            className="font-semibold text-gray-900 hover:underline truncate block"
          >
            {author.nickname ?? author.fullName}
          </Link>
          <p className="text-[11px] text-gray-400">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* content by type */}
      {post.type === "TROPHY" && (
        <TrophyCard content={post.content} meta={meta} />
      )}
      {post.type === "MATCH_RESULT" && (
        <MatchResultCard meta={meta} />
      )}
      {post.type === "MANUAL" && (
        <ManualCard content={post.content} imageUrl={post.imageUrl} />
      )}
    </div>
  );
};

// ─── sub-cards ────────────────────────────────────────────────────────────────

const TrophyCard: React.FC<{ content: string | null; meta: Record<string, unknown> }> = ({
  content,
  meta,
}) => {
  const position = meta.position as number | undefined;
  const tournamentName = meta.tournamentName as string | undefined;
  const icon = position === 1 ? "🥇" : "🥈";
  return (
    <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3">
      <span className="text-3xl leading-none">{icon}</span>
      <div>
        <p className="font-semibold text-gray-800 text-sm leading-snug">
          {content ?? "Conquista no torneio"}
        </p>
        {tournamentName && (
          <p className="text-xs text-gray-500 mt-0.5">{tournamentName}</p>
        )}
      </div>
    </div>
  );
};

const MatchResultCard: React.FC<{ meta: Record<string, unknown> }> = ({ meta }) => {
  const won = meta.won as boolean | undefined;
  const score = meta.score as string | undefined;
  const tournament = meta.tournamentName as string | undefined;
  const category = meta.category as string | undefined;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl p-3 ${won ? "bg-green-50" : "bg-red-50"}`}
    >
      <span className="text-2xl leading-none">{won ? "✅" : "❌"}</span>
      <div>
        <p className="font-semibold text-gray-800 text-sm">
          {won ? "Vitória" : "Derrota"}
          {score ? ` ${score}` : ""}
        </p>
        {(tournament || category) && (
          <p className="text-xs text-gray-500 mt-0.5">
            {[category, tournament].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
};

const ManualCard: React.FC<{ content: string | null; imageUrl: string | null }> = ({
  content,
  imageUrl,
}) => (
  <div>
    {content && <p className="text-gray-800 text-sm leading-relaxed">{content}</p>}
    {imageUrl && (
      <img
        src={imageUrl}
        alt="Post"
        className="mt-2 rounded-xl w-full object-cover max-h-64"
      />
    )}
  </div>
);

export default AthletePostCard;
