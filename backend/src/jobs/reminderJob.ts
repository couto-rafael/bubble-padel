import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendLembreteTorneio } from "../services/EmailService";

// ─── HELPER ───────────────────────────────────────────────────────────────────

function getTomorrowRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// ─── JOB PRINCIPAL ────────────────────────────────────────────────────────────

export async function runReminderJob(): Promise<void> {
  console.log("⏰ [REMINDER] Iniciando job de lembrete D-1...");

  const { start, end } = getTomorrowRange();

  const tournaments = await prisma.tournament.findMany({
    where: {
      startDate: { gte: start, lte: end },
      status: { in: ["CLOSED", "ONGOING"] },
      reminderSentAt: null,
    },
    include: {
      teams: {
        where: { status: "CONFIRMED" },
        select: {
          id: true,
          player1Name: true,
          player1Email: true,
          player2Name: true,
          player2Email: true,
          category: true,
        },
      },
    },
  });

  if (tournaments.length === 0) {
    console.log("⏰ [REMINDER] Nenhum torneio encontrado para amanhã.");
    return;
  }

  console.log(`⏰ [REMINDER] ${tournaments.length} torneio(s) encontrado(s).`);

  for (const tournament of tournaments) {
    if (tournament.teams.length === 0) {
      console.log(
        `⏰ [REMINDER] "${tournament.name}" sem duplas confirmadas. Pulando.`,
      );
      continue;
    }

    const matches = await prisma.match.findMany({
      where: { group: { tournamentId: tournament.id } },
      select: { id: true, team1Id: true, team2Id: true },
    });

    const matchIds = matches.map((m) => m.id);

    const schedules =
      matchIds.length > 0
        ? await prisma.schedule.findMany({
            where: { matchId: { in: matchIds } },
            orderBy: [{ date: "asc" }, { time: "asc" }],
          })
        : [];

    const teamFirstGame: Record<string, { time: string; court: string }> = {};
    for (const match of matches) {
      const schedule = schedules.find((s) => s.matchId === match.id);
      if (!schedule?.time) continue;
      const entry = { time: schedule.time, court: schedule.court };
      if (match.team1Id && !teamFirstGame[match.team1Id])
        teamFirstGame[match.team1Id] = entry;
      if (match.team2Id && !teamFirstGame[match.team2Id])
        teamFirstGame[match.team2Id] = entry;
    }

    const tournamentDate = new Date(tournament.startDate).toLocaleDateString(
      "pt-BR",
      { weekday: "long", day: "2-digit", month: "long" },
    );

    let sent = 0;
    for (const team of tournament.teams) {
      const firstGame = teamFirstGame[team.id] ?? null;
      sendLembreteTorneio({
        player1Name: team.player1Name,
        player1Email: team.player1Email,
        player2Name: team.player2Name,
        player2Email: team.player2Email,
        tournamentName: tournament.name,
        tournamentDate,
        category: team.category,
        tournamentId: tournament.id,
        firstGameTime: firstGame?.time ?? null,
        firstGameCourt: firstGame?.court ?? null,
        clubSede: tournament.clubSede || null,
      }).catch((err: unknown) =>
        console.error(
          `❌ [REMINDER] Erro ao enviar para ${team.player1Email}:`,
          err,
        ),
      );
      sent++;
    }

    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { reminderSentAt: new Date() },
    });

    console.log(
      `✅ [REMINDER] "${tournament.name}" — ${sent} dupla(s) notificada(s).`,
    );
  }

  console.log("✅ [REMINDER] Job concluído.");
}

// ─── CRON: todo dia às 09:00 BRT (12:00 UTC) ─────────────────────────────────

export function startReminderJob(): void {
  cron.schedule("0 12 * * *", async () => {
    try {
      await runReminderJob();
    } catch (err) {
      console.error("❌ [REMINDER] Erro no job:", err);
    }
  });
  console.log("⏰ [REMINDER] Cron D-1 registrado (09:00 BRT / 12:00 UTC).");
}
