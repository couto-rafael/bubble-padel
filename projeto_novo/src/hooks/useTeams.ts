import { useState, useEffect, useCallback } from "react";
import { TeamService } from "../services/api";
import type { Team } from "../types";

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
