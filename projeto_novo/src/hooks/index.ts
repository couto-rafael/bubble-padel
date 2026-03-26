// Barrel — re-exporta todos os hooks para imports de compatibilidade
// Componentes podem importar de "../hooks" (barrel) ou direto "../hooks/useGroups" (preferido)

export { useClub } from "./useClub";
export { useTournaments, useTournament } from "./useTournaments";
export { useTeams } from "./useTeams";
export { useGroups } from "./useGroups";
export { useSchedule } from "./useSchedule";
export { usePlayoffs } from "./usePlayoffs";
