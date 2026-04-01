import cron from "node-cron";
import { prisma } from "../lib/prisma";

/**
 * Task 1.5 — ONGOING automático por data/hora
 * Task 4.6 — COMPLETED automático quando todos os playoffs foram jogados
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

  // ── Task 1.5: CLOSED/PUBLISHED → ONGOING ─────────────────────────────────

  const ongoingCandidates = await prisma.tournament.findMany({
    where: { status: { in: ["CLOSED", "PUBLISHED"] } },
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
    } catch (err) {
      console.error(`[cron] Erro ao completar torneio ${tournament.id}:`, err);
    }
  }
}
