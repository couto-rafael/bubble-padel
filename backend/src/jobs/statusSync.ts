import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { processCompletedTournament } from "../services/GamificationService";
import { createTrophyPost } from "../services/PostService";

/**
 * Task 1.5 — ONGOING automático por data/hora
 * Task 4.6 — COMPLETED automático quando todos os playoffs foram jogados
 * Sprint 5 — Gamificação processada automaticamente ao COMPLETED
 *
 * Roda a cada 15 minutos.
 */
export function startStatusSyncJob(): void {
  cron.schedule("*/15 * * * *", async () => {
    try {
      await syncTournamentStatuses();
    } catch (err) {
      console.error("[cron] Erro no statusSync:", err);
    }
  });

  console.log("⏰ [cron] statusSync iniciado — roda a cada 15 minutos");
}

export async function syncTournamentStatuses(): Promise<void> {
  const now = new Date();

  // ── Task 1.5: OPEN/CLOSED/PUBLISHED → ONGOING (Grupo+Playoffs) ──────────

  const ongoingCandidates = await prisma.tournament.findMany({
    where: {
      status: { in: ["OPEN", "CLOSED", "PUBLISHED"] },
      tournamentType: { not: "Super 8" },
    },
    select: { id: true, name: true, status: true },
  });

  for (const tournament of ongoingCandidates) {
    try {
      const groups = await prisma.group.findMany({
        where: { tournamentId: tournament.id },
        include: { matches: { select: { id: true } } },
      });
      const matchIds = groups.flatMap((g) => g.matches.map((m) => m.id));
      if (matchIds.length === 0) continue;

      const earliestSchedule = await prisma.schedule.findFirst({
        where: { matchId: { in: matchIds } },
        orderBy: [{ date: "asc" }, { time: "asc" }],
        select: { date: true, time: true },
      });

      if (!earliestSchedule) continue;

      const dateStr =
        earliestSchedule.date instanceof Date
          ? earliestSchedule.date.toISOString().slice(0, 10)
          : String(earliestSchedule.date).slice(0, 10);

      const firstMatchDateTime = new Date(
        `${dateStr}T${earliestSchedule.time}:00`,
      );

      if (now >= firstMatchDateTime) {
        await prisma.tournament.update({
          where: { id: tournament.id },
          data: { status: "ONGOING" },
        });
        console.log(
          `[cron] Torneio "${tournament.name}" → ONGOING (primeiro jogo: ${dateStr} ${earliestSchedule.time})`,
        );
      }
    } catch (err) {
      console.error(`[cron] Erro ao processar torneio ${tournament.id}:`, err);
    }
  }

  // ── Super 8: ONGOING → COMPLETED quando todas partidas jogadas ───────────
  const super8Ongoing = await prisma.tournament.findMany({
    where: { status: "ONGOING", tournamentType: "Super 8" },
    include: { super8Matches: true },
  });

  for (const t of super8Ongoing) {
    try {
      if (t.super8Matches.length === 0) continue;
      if (!t.super8Matches.every((m) => m.played)) continue;
      await prisma.tournament.update({
        where: { id: t.id },
        data: { status: "COMPLETED" },
      });
      console.log(`[cron] Super 8 "${t.name}" → COMPLETED`);
    } catch (err) {
      console.error(`[cron] Erro Super 8 COMPLETED ${t.id}:`, err);
    }
  }

  // ── Task 4.6: ONGOING → COMPLETED automático ─────────────────────────────
  // Condição: todos os playoffs não-bye foram jogados E
  // o último jogo foi há mais de 6 horas (evita completar antes de encerrar)

  const completedCandidates = await prisma.tournament.findMany({
    where: { status: "ONGOING" },
    include: {
      playoffs: {
        include: { matches: true },
      },
    },
  });

  for (const tournament of completedCandidates) {
    try {
      // Sem playoffs — não auto-completa (clube finaliza manualmente)
      if (tournament.playoffs.length === 0) continue;

      const allMatches = tournament.playoffs.flatMap((b) =>
        b.matches.filter((m) => !m.isBye),
      );

      // Sem jogos não-bye — skip
      if (allMatches.length === 0) continue;

      // Todos os jogos precisam estar played
      const allPlayed = allMatches.every((m) => m.played);
      if (!allPlayed) continue;

      // Verifica quando foi o último jogo atualizado
      const lastUpdatedAt = allMatches.reduce((latest, m) => {
        return m.updatedAt > latest ? m.updatedAt : latest;
      }, new Date(0));

      const hoursElapsed =
        (now.getTime() - lastUpdatedAt.getTime()) / (1000 * 60 * 60);

      // Só auto-completa se o último jogo foi há mais de 6 horas
      if (hoursElapsed < 6) continue;

      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: "COMPLETED" },
      });

      console.log(
        `[cron] Torneio "${tournament.name}" → COMPLETED automático (último jogo: ${lastUpdatedAt.toISOString()})`,
      );

      // ── Sprint 5: dispara gamificação em background ───────────────────────
      processCompletedTournament(tournament.id).catch((err) =>
        console.error(
          `❌ [GAMIFICATION] Falha ao processar torneio ${tournament.id}:`,
          err,
        ),
      );

      // ── Sprint 8: gera TROPHY posts para campeão/vice de cada categoria ───
      generateTrophyPosts(tournament.id).catch((err) =>
        console.error(`❌ [FEED] Falha ao gerar trophy posts ${tournament.id}:`, err),
      );
    } catch (err) {
      console.error(`[cron] Erro ao completar torneio ${tournament.id}:`, err);
    }
  }
}

// ─── TROPHY posts — chamado após COMPLETED ────────────────────────────────────

export async function generateTrophyPosts(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true },
  });
  if (!tournament) return;

  const brackets = await prisma.playoffBracket.findMany({
    where: { tournamentId },
    include: { matches: true },
  });

  for (const bracket of brackets) {
    const final = bracket.matches.find((m) => m.roundSize === 1 && m.played);
    if (!final || !final.winnerId || !final.team1Id || !final.team2Id) continue;

    const championTeamId = final.winnerId;
    const runnerUpTeamId =
      final.team1Id === final.winnerId ? final.team2Id : final.team1Id;

    for (const [teamId, position] of [
      [championTeamId, 1],
      [runnerUpTeamId, 2],
    ] as [string, 1 | 2][]) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { player1Email: true, player2Email: true },
      });
      if (!team) continue;

      for (const email of [team.player1Email, team.player2Email]) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { athlete: { select: { id: true } } },
        });
        if (!user?.athlete?.id) continue;

        await createTrophyPost({
          athleteId: user.athlete.id,
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          category: bracket.category,
          position,
        });
      }
    }
  }
}
