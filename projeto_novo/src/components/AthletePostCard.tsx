import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./Toast";
import { FeedPost, PostComment, MentionedAthlete, FeedService } from "../services/api";
import MentionTextarea from "./MentionTextarea";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function renderMentions(
  content: string,
  mentionedAthletes: MentionedAthlete[],
): React.ReactNode {
  if (!mentionedAthletes.length) return content;

  const tokenMap = new Map<string, MentionedAthlete>();
  for (const a of mentionedAthletes) {
    tokenMap.set(a.nickname ?? a.fullName.split(" ")[0], a);
  }

  const parts = content.split(/(@\w+)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const token = part.slice(1);
          const athlete = tokenMap.get(token);
          if (athlete) {
            return (
              <Link
                key={i}
                to={`/athletes/${athlete.id}`}
                className="text-[#00ff88] font-semibold hover:underline"
              >
                {part}
              </Link>
            );
          }
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

function getShareText(post: FeedPost): string {
  const meta = (post.metadata ?? {}) as Record<string, unknown>;
  switch (post.type) {
    case "MANUAL":
      return post.content ? post.content.slice(0, 100) : "Post no Bubble Padel";
    case "MATCH_RESULT": {
      const tournament = meta.tournamentName as string | undefined;
      const category = meta.category as string | undefined;
      return `Resultado de ${[category, tournament].filter(Boolean).join(" — ")}`;
    }
    case "TROPHY":
      return post.content ?? "Conquista no Bubble Padel";
    default:
      return post.content ?? "Post no Bubble Padel";
  }
}

interface Props {
  post: FeedPost;
}

const AthletePostCard: React.FC<Props> = ({ post }) => {
  const author = post.athlete;
  const meta = post.metadata ?? {};

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
              {getInitials(author.fullName)}
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
      {post.type === "TROPHY" && <TrophyCard meta={meta} />}
      {post.type === "MATCH_RESULT" && (
        <MatchResultCard meta={meta} />
      )}
      {post.type === "MANUAL" && (
        <ManualCard
          content={post.content}
          imageUrl={post.imageUrl}
          mentionedAthletes={post.mentionedAthletes}
        />
      )}

      <PostFooter post={post} />
    </div>
  );
};

// ─── sub-cards ────────────────────────────────────────────────────────────────

const TrophyCard: React.FC<{ meta: Record<string, unknown> }> = ({ meta }) => {
  const position = meta.position as number | undefined;
  const category = meta.category as string | undefined;
  const tournamentName = meta.tournamentName as string | undefined;
  const tournamentId = meta.tournamentId as string | undefined;

  const isChampion = position === 1;
  const label = isChampion ? "CAMPEÃO" : "VICE-CAMPEÃO";
  const bg = isChampion ? "from-amber-50 to-yellow-100" : "from-gray-50 to-slate-100";
  const iconColor = isChampion ? "text-amber-400" : "text-gray-400";
  const badgeBg = isChampion ? "bg-amber-400" : "bg-gray-400";

  return (
    <div className={`rounded-xl p-5 bg-gradient-to-br ${bg} text-center`}>
      <div className={`mx-auto mb-3 ${iconColor} flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="72" height="72" aria-hidden="true">
          <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm7 6c-1.65 0-3-1.35-3-3V5h6v6c0 1.65-1.35 3-3 3zm7-6c0 1.3-.84 2.4-2 2.82V7h2v1z" />
        </svg>
      </div>
      <span
        className={`inline-block ${badgeBg} text-white text-[11px] font-extrabold tracking-widest px-3 py-1 rounded-full mb-3`}
      >
        {label}
      </span>
      {category && (
        <p className="font-extrabold text-gray-900 text-[17px] leading-tight mb-1">
          {category}
        </p>
      )}
      {tournamentName && (
        tournamentId ? (
          <Link
            to={`/tournaments/${tournamentId}`}
            className="text-[13px] text-gray-500 hover:underline"
          >
            {tournamentName}
          </Link>
        ) : (
          <p className="text-[13px] text-gray-500">{tournamentName}</p>
        )
      )}
    </div>
  );
};

const MatchResultCard: React.FC<{ meta: Record<string, unknown> }> = ({ meta }) => {
  const won = meta.won as boolean | undefined;
  const score = meta.score as string | undefined;
  const tournament = meta.tournamentName as string | undefined;
  const tournamentId = meta.tournamentId as string | undefined;
  const category = meta.category as string | undefined;
  const phase = meta.phase as string | undefined;
  const partnerAthleteId = meta.partnerAthleteId as string | null | undefined;
  const partnerName = meta.partnerName as string | undefined;
  const opponentAthleteIds = (meta.opponentAthleteIds as string[] | undefined) ?? [];
  const opponentNames = (meta.opponentNames as string[] | undefined) ?? [];

  const hasEnriched = !!partnerName || opponentNames.length > 0;

  return (
    <div className={`rounded-xl p-3 ${won ? "bg-green-50" : "bg-red-50"}`}>
      {/* result + score */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl leading-none">{won ? "✅" : "❌"}</span>
        <span className="font-semibold text-gray-800 text-sm">
          {won ? "Vitória" : "Derrota"}
        </span>
        {score && (
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-[12px] font-bold ${
              won ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
            }`}
          >
            {score}
          </span>
        )}
      </div>

      {/* partner + opponents (only for enriched posts) */}
      {hasEnriched && (
        <div className="text-[12px] text-gray-600 space-y-0.5 mb-2 ml-1">
          {partnerName && (
            <p>
              {"Ao lado de "}
              {partnerAthleteId ? (
                <Link
                  to={`/athletes/${partnerAthleteId}`}
                  className="font-semibold text-gray-800 hover:underline"
                >
                  {partnerName}
                </Link>
              ) : (
                <span className="font-semibold text-gray-800">{partnerName}</span>
              )}
            </p>
          )}
          {opponentNames.length > 0 && (
            <p>
              {"vs "}
              {opponentNames.map((name, i) => {
                const id = opponentAthleteIds[i];
                return (
                  <React.Fragment key={i}>
                    {i > 0 && " / "}
                    {id ? (
                      <Link
                        to={`/athletes/${id}`}
                        className="font-semibold text-gray-800 hover:underline"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-800">{name}</span>
                    )}
                  </React.Fragment>
                );
              })}
            </p>
          )}
        </div>
      )}

      {/* phase · category · tournament */}
      {(phase || category || tournament) && (
        <p className="text-[11px] text-gray-500 ml-1">
          {[phase, category].filter(Boolean).join(" · ")}
          {tournament && (
            <>
              {(phase || category) ? " · " : ""}
              {tournamentId ? (
                <Link to={`/tournaments/${tournamentId}`} className="hover:underline">
                  {tournament}
                </Link>
              ) : (
                tournament
              )}
            </>
          )}
        </p>
      )}
    </div>
  );
};

const ManualCard: React.FC<{
  content: string | null;
  imageUrl: string | null;
  mentionedAthletes: MentionedAthlete[];
}> = ({ content, imageUrl, mentionedAthletes }) => (
  <div>
    {content && (
      <p className="text-gray-800 text-sm leading-relaxed">
        {renderMentions(content, mentionedAthletes)}
      </p>
    )}
    {imageUrl && (
      <img
        src={imageUrl}
        alt="Post"
        className="mt-2 rounded-xl w-full object-cover max-h-64"
      />
    )}
  </div>
);

// ─── footer com like + comments ───────────────────────────────────────────────

const PostFooter: React.FC<{ post: FeedPost }> = ({ post }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAthlete = user && (user.type as string) === "ATHLETE";
  const currentAthleteId = user?.athleteId;

  // like state
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likePending, setLikePending] = useState(false);

  // comments state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentMentionedIds, setCommentMentionedIds] = useState<string[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);

  useEffect(() => {
    if (!commentsOpen || comments.length > 0) return;
    setLoadingComments(true);
    FeedService.listComments(post.id)
      .then((data) => setComments(data.comments))
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  }, [commentsOpen, post.id, comments.length]);

  const handleShare = async () => {
    const url = `${window.location.origin}/athlete/feed?post=${post.id}`;
    const text = getShareText(post);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Bubble Padel", text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success("Link copiado!");
      } else {
        prompt("Copie o link:", url);
      }
    } catch {
      // usuário cancelou o share sheet — ignora
    }
  };

  const handleToggleLike = async () => {
    if (likePending) return;
    setLikePending(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(wasLiked ? likeCount - 1 : likeCount + 1);
    try {
      const data = wasLiked
        ? await FeedService.unlike(post.id)
        : await FeedService.like(post.id);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked(wasLiked);
      setLikeCount(likeCount);
    } finally {
      setLikePending(false);
    }
  };

  const handleSubmitComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || submittingComment) return;
    setSubmittingComment(true);
    try {
      const created = await FeedService.createComment(post.id, trimmed, commentMentionedIds);
      setComments((prev) => [...prev, created]);
      setCommentCount((c) => c + 1);
      setNewComment("");
      setCommentMentionedIds([]);
    } catch {
      // silently fail — user can retry
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await FeedService.deleteComment(post.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((c) => c - 1);
    } catch {
      // 403 or network error — ignore silently
    }
  };

  return (
    <>
      {/* action row */}
      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100">
        {isAthlete && (
          <>
            {/* like button */}
            <button
              onClick={handleToggleLike}
              disabled={likePending}
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
              <span>{likeCount}</span>
            </button>

            {/* comment toggle */}
            <button
              onClick={() => setCommentsOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Comentários"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9C3.47 14.94 3 13.52 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{commentCount}</span>
            </button>
          </>
        )}

        {/* share button — sempre visível */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] font-bold text-gray-500 hover:bg-gray-50 transition-colors ml-auto"
          aria-label="Compartilhar"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
            />
          </svg>
        </button>
      </div>

      {/* expandable comments section */}
      {commentsOpen && (
        <div className="pt-3 mt-1">
          {loadingComments ? (
            <p className="text-[12px] text-gray-400 text-center py-2">Carregando...</p>
          ) : comments.length === 0 ? (
            <p className="text-[12px] text-gray-400 text-center py-2">
              Seja o primeiro a comentar.
            </p>
          ) : (
            <div className="space-y-3 mb-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  {c.athlete.avatarUrl ? (
                    <img
                      src={c.athlete.avatarUrl}
                      alt={c.athlete.fullName}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0">
                      {getInitials(c.athlete.fullName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-2xl px-3 py-2">
                      <p className="text-[12px] font-bold text-gray-900">
                        {c.athlete.nickname ?? c.athlete.fullName}
                      </p>
                      <p className="text-[13px] text-gray-700 whitespace-pre-wrap break-words">
                        {renderMentions(c.content, c.mentionedAthletes ?? [])}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-3">
                      <span className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                      {currentAthleteId && c.athleteId === currentAthleteId && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* comment input — só atleta */}
          {isAthlete && <div className="flex items-center gap-2">
            <MentionTextarea
              value={newComment}
              onChange={(val, ids) => {
                setNewComment(val.slice(0, 1000));
                setCommentMentionedIds(ids);
              }}
              placeholder="Escreva um comentário..."
              maxLength={1000}
              disabled={submittingComment}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-2xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00ff88]/30"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submittingComment}
              className="px-3 py-2 bg-[#00ff88] text-[#0a0e1a] rounded-2xl text-[12px] font-extrabold disabled:opacity-40 flex-shrink-0"
            >
              {submittingComment ? "..." : "Enviar"}
            </button>
          </div>}
        </div>
      )}
    </>
  );
};

export default AthletePostCard;
