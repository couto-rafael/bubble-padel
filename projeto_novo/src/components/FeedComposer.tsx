import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FeedService } from "../services/api";
import MentionTextarea from "./MentionTextarea";

interface FeedComposerProps {
  onPostCreated: () => void;
}

const FeedComposer: React.FC<FeedComposerProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || (user.type as string) !== "ATHLETE") return null;

  const handleChange = (val: string, ids: string[]) => {
    setContent(val.slice(0, 2000));
    setMentionedIds(ids);
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await FeedService.create(trimmed, mentionedIds);
      setContent("");
      setMentionedIds([]);
      onPostCreated();
    } catch {
      setError("Não foi possível publicar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = 2000 - content.length;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-4">
      <MentionTextarea
        value={content}
        onChange={handleChange}
        placeholder="O que está rolando na sua quadra?"
        maxLength={2000}
        multiline
        rows={3}
        disabled={submitting}
        className="w-full resize-none border-0 focus:ring-0 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none"
      />
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span
          className={`text-[12px] ${remaining < 100 ? "text-amber-600" : "text-gray-400"}`}
        >
          {remaining} caracteres restantes
        </span>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="px-4 py-2 bg-[#00ff88] text-[#0a0e1a] rounded-xl text-[13px] font-extrabold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {submitting ? "Publicando..." : "Publicar"}
        </button>
      </div>
      {error && <p className="text-[12px] text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default FeedComposer;
