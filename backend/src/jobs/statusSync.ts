import cron from "node-cron";
import { prisma } from "../lib/prisma";

/**
 * Task 1.5 — ONGOING automático por data/hora
 *
 * Roda a cada 15 minutos.
 * Se a hora do primeiro jogo agendado chegou e o torneio ainda está
 * CLOSED ou PUBLISHED, muda para ONGOING automaticamente.
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

  // Busca torneios que podem virar ONGOING
  const candidates = await prisma.tournament.findMany({
    where: {
      status: { in: ["CLOSED", "PUBLISHED"] },
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (candidates.length === 0) return;

  for (const tournament of candidates) {
    try {
      // Busca os matchIds dos grupos do torneio
      const groups = await prisma.group.findMany({
        where: { tournamentId: tournament.id },
        include: { matches: { select: { id: true } } },
      });
      const matchIds = groups.flatMap((g) => g.matches.map((m) => m.id));
      if (matchIds.length === 0) continue;

      // Busca o schedule mais antigo deste torneio
      const earliestSchedule = await prisma.schedule.findFirst({
        where: { matchId: { in: matchIds } },
        orderBy: [{ date: "asc" }, { time: "asc" }],
        select: { date: true, time: true },
      });

      if (!earliestSchedule) continue;

      // Combina data + hora do primeiro jogo
      const dateStr =
        earliestSchedule.date instanceof Date
          ? earliestSchedule.date.toISOString().slice(0, 10)
          : String(earliestSchedule.date).slice(0, 10);

      const firstMatchDateTime = new Date(
        `${dateStr}T${earliestSchedule.time}:00`,
      );

      // Se a hora do primeiro jogo já passou → ONGOING
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
}
