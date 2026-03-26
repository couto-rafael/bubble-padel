import { useState, useEffect, useCallback } from "react";
import { ScheduleService } from "../services/api";
import type { Schedule } from "../types";

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

  const bulkUpdateSchedule = async (
    entries: Array<{ matchId: string; court: string; date: string; time: string }>,
  ) => {
    if (!tournamentId || entries.length === 0) return;
    setScheduleRaw((prev) => {
      const next = { ...prev };
      for (const e of entries) {
        next[e.matchId] = { matchId: e.matchId, court: e.court, date: e.date, time: e.time };
      }
      return next;
    });
    await ScheduleService.bulkUpdate(tournamentId, entries);
  };

  return {
    schedule,
    loading,
    reload: load,
    updateSchedule,
    bulkUpdateSchedule,
  };
}
