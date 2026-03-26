import { useState, useEffect, useCallback } from "react";
import { TournamentService } from "../services/api";
import type { Tournament } from "../types";

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
    await TournamentService.update(id, data);
    const fresh = await TournamentService.get(id);
    if (fresh) {
      setTournaments((prev) => prev.map((t) => (t.id === id ? fresh : t)));
      return fresh;
    }
    return data as Tournament;
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
