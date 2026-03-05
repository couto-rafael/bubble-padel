// ─────────────────────────────────────────────────────────────────────────────
// HOOKS DE DADOS
//
// Cada hook encapsula uma entidade e usa os services de api.ts.
// Quando React Query for instalado, substituir useState+useEffect
// por useQuery+useMutation — a interface externa dos hooks não muda.
//
// Importar sempre de "@/hooks"
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TournamentService,
  TeamService,
  GroupService,
  ScheduleService,
  PlayoffService,
  type PlayoffBracketData,
} from "../services/api";
import type { Tournament, Team, Group, Schedule, Set } from "../types";
import { recalculateStandings } from "../utils/groupUtils";

// ─── useTournaments ───────────────────────────────────────────────────────────

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TournamentService.list();
      setTournaments(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTournament = async (data: Partial<Tournament>) => {
    const created = await TournamentService.create(data);
    setTournaments((prev) => [...prev, created]);
    return created;
  };

  const updateTournament = async (id: string, data: Partial<Tournament>) => {
    const updated = await TournamentService.update(id, data);
    setTournaments((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTournament = async (id: string) => {
    await TournamentService.delete(id);
    setTournaments((prev) => prev.filter((t) => t.id !== id));
  };

  const getTournamentById = (id: string) =>
    tournaments.find((t) => t.id === id);

  return {
    tournaments,
    loading,
    error,
    reload: load,
    createTournament,
    updateTournament,
    deleteTournament,
    getTournamentById,
  };
}

// ─── useTournament ────────────────────────────────────────────────────────────

export function useTournament(id: string | undefined) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await TournamentService.get(id);
      setTournament(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (data: Partial<Tournament>) => {
    if (!id) return;
    const updated = await TournamentService.update(id, data);
    setTournament(updated);
    return updated;
  };

  return { tournament, loading, error, reload: load, updateTournament: update };
}

// ─── useTeams ─────────────────────────────────────────────────────────────────

export function useTeams(tournamentId: string | undefined) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setLoading(true);
      const data = await TeamService.list(tournamentId);
      setTeams(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const addTeam = async (data: Partial<Team>) => {
    if (!tournamentId) return;
    const created = await TeamService.create(tournamentId, data);
    setTeams((prev) => [...prev, created]);
    return created;
  };

  const updateTeam = async (id: string, data: Partial<Team>) => {
    if (!tournamentId) return;
    const updated = await TeamService.update(tournamentId, id, data);
    setTeams((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTeam = async (id: string) => {
    if (!tournamentId) return;
    await TeamService.delete(tournamentId, id);
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    teams,
    setTeams,
    loading,
    error,
    reload: load,
    addTeam,
    updateTeam,
    deleteTeam,
  };
}

// ─── useGroups ────────────────────────────────────────────────────────────────

export function useGroups(tournamentId: string | undefined) {
  const [groups, setGroupsRaw] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setLoading(true);
      const data = await GroupService.list(tournamentId);
      const withQualified = data.map((g: Group) => recalculateStandings(g));
      setGroupsRaw(withQualified);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const setGroups = useCallback(
    (val: Group[] | ((prev: Group[]) => Group[])) => {
      setGroupsRaw((prev) => {
        const next = typeof val === "function" ? val(prev) : val;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          if (tournamentId) {
            GroupService.save(tournamentId, next).catch(console.error);
          }
        }, 300);
        return next;
      });
    },
    [tournamentId],
  );

  const saveScore = async (
    groupId: string,
    matchId: string,
    payload: { score1: number; score2: number; wo?: 1 | 2; sets?: Set[] },
  ) => {
    if (!tournamentId) return;
    try {
      await GroupService.saveScore(tournamentId, groupId, matchId, payload);
      await load();
    } catch (e: any) {
      throw e;
    }
  };

  const resetGroups = async () => {
    if (!tournamentId) return;
    await GroupService.reset(tournamentId);
    setGroupsRaw([]);
  };

  const reorderTeams = async (newGroups: Group[]) => {
    if (!tournamentId) return;
    await GroupService.reorderTeams(tournamentId, newGroups);
    setGroupsRaw(newGroups);
  };

  return {
    groups,
    setGroups,
    loading,
    error,
    reload: load,
    saveScore,
    resetGroups,
    reorderTeams,
  };
}

// ─── useSchedule ──────────────────────────────────────────────────────────────

export function useSchedule(tournamentId: string | undefined) {
  const [schedule, setScheduleRaw] = useState<Record<string, Schedule>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    try {
      const data = await ScheduleService.get(tournamentId);
      setScheduleRaw(data);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateSchedule = async (
    matchId: string,
    data: { court: string; date: string; time: string },
  ) => {
    if (!tournamentId) return;
    await ScheduleService.update(tournamentId, matchId, data);
    setScheduleRaw((prev) => ({ ...prev, [matchId]: { matchId, ...data } }));
  };

  return { schedule, loading, reload: load, updateSchedule };
}

// ─── usePlayoffs ──────────────────────────────────────────────────────────────
// Brackets de playoff de um torneio.

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

  // Gera e salva o bracket de uma categoria no backend
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

  // Registra resultado de uma partida e atualiza o bracket
  const saveMatchResult = async (
    matchId: string,
    score1: number,
    score2: number,
    winnerId: string,
  ) => {
    if (!tournamentId) return;
    const updated = await PlayoffService.updateMatch(matchId, {
      score1,
      score2,
      winnerId,
    });
    // Substitui o bracket atualizado
    setBrackets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    return updated;
  };

  // Remove bracket de uma categoria
  const resetBracket = async (category: string) => {
    if (!tournamentId) return;
    await PlayoffService.reset(tournamentId, category);
    setBrackets((prev) => prev.filter((b) => b.category !== category));
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
    getBracketByCategory,
  };
}
