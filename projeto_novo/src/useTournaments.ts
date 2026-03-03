// ─────────────────────────────────────────────────────────────────────────────
// COMPATIBILIDADE — useTournaments
//
// Mantém a interface antiga para não quebrar componentes que ainda importam
// deste arquivo. Internamente usa o TournamentService de services/api.ts.
//
// MIGRAÇÃO: substituir importações de "./useTournaments" por "@/hooks" aos poucos.
// ─────────────────────────────────────────────────────────────────────────────

export type { Tournament } from "./types";
export { useTournaments } from "./hooks";
