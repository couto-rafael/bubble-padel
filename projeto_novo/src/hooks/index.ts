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
} from "../services/api";
import type { Tournament, Team, Group, Schedule, Set } from "../types";
import { recalculateStandings } from "../utils/groupUtils";

// ─── useTournaments ───────────────────────────────────────────────────────────
// Lista todos os torneios do clube logado.

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
// Torneio individual por ID.

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
// Duplas inscritas num torneio.

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
// Grupos e partidas de um torneio.

export function useGroups(tournamentId: string | undefined) {
  const [groups, setGroupsRaw] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref para debounce — cancela saves duplicados causados pelo React StrictMode
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setLoading(true);
      const data = await GroupService.list(tournamentId);
      // Recalcula qualified no frontend após carregar do banco,
      // pois o backend não define quem classifica
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

  // Usado apenas ao gerar/reorganizar grupos — NÃO usar para salvar resultados.
  // Debounce de 300ms evita duplo disparo do React StrictMode.
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

  // Salva resultado de uma partida via PATCH /matches/:id/score
  // e recarrega os grupos do backend — NÃO usa setGroups para evitar
  // que o GroupService.save apague e recrie os grupos perdendo resultados.
  const saveScore = async (
    groupId: string,
    matchId: string,
    payload: { score1: number; score2: number; wo?: 1 | 2; sets?: Set[] },
  ) => {
    if (!tournamentId) return;
    try {
      await GroupService.saveScore(tournamentId, groupId, matchId, payload);
      // Recarrega os grupos do backend para refletir standings atualizados
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
// Agendamento de jogos (quadra, data, horário).

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
