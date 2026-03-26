import { useState, useEffect, useCallback } from "react";
import { PlayoffService, type PlayoffBracketData } from "../services/api";

export function usePlayoffs(tournamentId: string | undefined) {
  const [brackets, setBrackets] = useState<PlayoffBracketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setLoading(true);
      const data = await PlayoffService.list(tournamentId);
      setBrackets(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const generateBracket = async (
    category: string,
    matches: Omit<PlayoffBracketData["matches"][number], "id" | "bracketId">[],
  ) => {
    if (!tournamentId) return;
    const saved = await PlayoffService.save(tournamentId, category, matches);
    setBrackets((prev) => {
      const filtered = prev.filter((b) => b.category !== category);
      return [...filtered, saved];
    });
    return saved;
  };

  const saveMatchResult = async (
    matchId: string,
    score1: number,
    score2: number,
    winnerId: string,
  ) => {
    if (!tournamentId) return;
    const updated = await PlayoffService.updateMatch(matchId, { score1, score2, winnerId });
    setBrackets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    return updated;
  };

  const resetBracket = async (category: string) => {
    if (!tournamentId) return;
    await PlayoffService.reset(tournamentId, category);
    setBrackets((prev) => prev.filter((b) => b.category !== category));
  };

  const seedBracket = async (category: string) => {
    if (!tournamentId) return null;
    try {
      const updated = await PlayoffService.seed(tournamentId, category);
      setBrackets((prev) => prev.map((b) => (b.category === category ? updated : b)));
      return updated;
    } catch {
      return null;
    }
  };

  const getBracketByCategory = (category: string) =>
    brackets.find((b) => b.category === category) ?? null;

  return {
    brackets,
    loading,
    error,
    reload: load,
    generateBracket,
    saveMatchResult,
    resetBracket,
    seedBracket,
    getBracketByCategory,
  };
}
