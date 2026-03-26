import { useState, useEffect, useCallback } from "react";
import { ClubService, type ClubProfile } from "../services/api";

export function useClub() {
  const [club, setClub] = useState<ClubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ClubService.getProfile();
      setClub(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateClub = async (data: Partial<ClubProfile>) => {
    setSaving(true);
    try {
      const updated = await ClubService.updateProfile(data);
      setClub(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  };

  const isProfileComplete = Boolean(
    club && club.name?.trim() && club.courts?.length > 0,
  );

  return {
    club,
    loading,
    error,
    saving,
    reload: load,
    updateClub,
    isProfileComplete,
  };
}
