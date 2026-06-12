import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FeedPost, FeedService } from "../services/api";

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

      <PostFooter post={post} />
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

// ─── footer com like ──────────────────────────────────────────────────────────

const PostFooter: React.FC<{ post: FeedPost }> = ({ post }) => {
  const { user } = useAuth();
  const canLike = user && (user.type as string) === "ATHLETE";
  const [liked, setLiked] = useState(post.likedByMe);
  const [count, setCount] = useState(post.likeCount);
  const [pending, setPending] = useState(false);

  if (!canLike) return null;

  const handleToggleLike = async () => {
    if (pending) return;
    setPending(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount(wasLiked ? count - 1 : count + 1);
    try {
      const data = wasLiked
        ? await FeedService.unlike(post.id)
        : await FeedService.like(post.id);
      setLiked(data.liked);
      setCount(data.likeCount);
    } catch {
      setLiked(wasLiked);
      setCount(count);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100">
      <button
        onClick={handleToggleLike}
        disabled={pending}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] font-bold transition-colors ${
          liked
            ? "text-[#00ff88] hover:bg-[#00ff88]/10"
            : "text-gray-500 hover:bg-gray-50"
        }`}
        aria-label={liked ? "Descurtir" : "Curtir"}
      >
        <svg
          className="w-4 h-4"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
        <span>{count}</span>
      </button>
    </div>
  );
};

export default AthletePostCard;
