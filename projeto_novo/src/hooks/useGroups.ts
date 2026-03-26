import { useState, useEffect, useCallback, useRef } from "react";
import { GroupService } from "../services/api";
import type { Group, Set } from "../types";
import { recalculateStandings } from "../utils/groupUtils";

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

  const saveGroupsImmediate = async (newGroups: Group[]): Promise<Group[]> => {
    if (!tournamentId) return newGroups;
    const saved = await GroupService.save(tournamentId, newGroups);
    const withStandings = saved.map((g: Group) => recalculateStandings(g));
    setGroupsRaw(withStandings);
    return withStandings;
  };

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
    saveGroupsImmediate,
    loading,
    error,
    reload: load,
    saveScore,
    resetGroups,
    reorderTeams,
  };
}
