/**
 * KPI Baseline Snapshot — Bubble Padel
 * Coleta 7 métricas do banco (somente leitura) e salva em docs/kpis_snapshot_YYYY-MM-DD.json
 *
 * Usage:
 *   npm run kpi:snapshot
 */

import {
  PrismaClient,
  TournamentStatus,
  ChargeStatus,
  PostType,
} from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient({ log: [] });

async function main() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  console.log(
    `\nBubble KPI Snapshot — ${now.toISOString()}\n${"─".repeat(56)}`,
  );

  // ── 1 & 5: Torneios + Clubes com torneio ────────────────────────────────
  const [totalTournaments, completedCount, distinctClubs] = await Promise.all([
    prisma.tournament.count(),
    prisma.tournament.count({ where: { status: TournamentStatus.COMPLETED } }),
    prisma.tournament.findMany({
      select: { clubId: true },
      distinct: ["clubId"],
    }),
  ]);
  const completionRate =
    totalTournaments > 0 ? completedCount / totalTournaments : 0;

  // ── 4: Atletas únicos (player1Email ∪ player2Email, case-insensitive) ───
  const allTeams = await prisma.team.findMany({
    select: { player1Email: true, player2Email: true },
  });
  const emailSet = new Set<string>();
  for (const t of allTeams) {
    emailSet.add(t.player1Email.toLowerCase().trim());
    emailSet.add(t.player2Email.toLowerCase().trim());
  }

  // ── 6: Posts por tipo ───────────────────────────────────────────────────
  const postGroups = await prisma.athletePost.groupBy({
    by: ["type"],
    _count: { id: true },
  });
  const byType: Record<string, number> = {
    [PostType.MANUAL]: 0,
    [PostType.TROPHY]: 0,
    [PostType.TOURNAMENT_JOIN]: 0,
    [PostType.MATCH_RESULT]: 0,
  };
  for (const g of postGroups) {
    if (g.type in byType) byType[g.type] = g._count.id;
  }
  const totalPosts = Object.values(byType).reduce((a, b) => a + b, 0);

  // ── 7: NSM — torneios COMPLETED com ≥1 Payment PAID (updatedAt proxy) ──
  const completedThisMonth = await prisma.tournament.findMany({
    where: {
      status: TournamentStatus.COMPLETED,
      updatedAt: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { id: true },
  });
  const completedIds = completedThisMonth.map((t) => t.id);
  let nsmValue = 0;
  if (completedIds.length > 0) {
    const paidRows = await prisma.payment.findMany({
      where: {
        tournamentId: { in: completedIds },
        status: ChargeStatus.PAID,
      },
      select: { tournamentId: true },
      distinct: ["tournamentId"],
    });
    nsmValue = paidRows.length;
  }

  // ── Snapshot object ──────────────────────────────────────────────────────
  const snapshot = {
    generatedAt: now.toISOString(),
    tournaments: {
      total: totalTournaments,
      completed: completedCount,
      completionRate: Math.round(completionRate * 10000) / 10000,
    },
    athletes: { unique: emailSet.size },
    clubs: { withAtLeastOneTournament: distinctClubs.length },
    posts: { total: totalPosts, byType },
    nsm: {
      value: nsmValue,
      month: monthLabel,
      note: "based on updatedAt proxy — consider adding completedAt field in a future sprint for precision",
    },
  };

  // ── Console ──────────────────────────────────────────────────────────────
  const pct = (completionRate * 100).toFixed(1);
  console.log("\nTOURNAMENTS");
  console.log(`  total            ${totalTournaments}`);
  console.log(`  completed        ${completedCount}`);
  console.log(`  completionRate   ${pct}%`);

  console.log("\nATHLETES");
  console.log(`  unique           ${emailSet.size}`);

  console.log("\nCLUBS");
  console.log(`  withTournament   ${distinctClubs.length}`);

  console.log("\nFEED POSTS");
  console.log(`  total            ${totalPosts}`);
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type.padEnd(17)}${count}`);
  }

  console.log(`\nNSM (${monthLabel})`);
  console.log(`  value            ${nsmValue}`);
  console.log(`  note: ${snapshot.nsm.note}`);

  // ── Save JSON ────────────────────────────────────────────────────────────
  const docsDir = resolve(__dirname, "../../docs");
  mkdirSync(docsDir, { recursive: true });
  const dateStr = now.toISOString().slice(0, 10);
  const outPath = resolve(docsDir, `kpis_snapshot_${dateStr}.json`);
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2), "utf-8");
  console.log(`\n✓ saved → docs/kpis_snapshot_${dateStr}.json\n`);
}

main()
  .catch((err) => {
    console.error("[ERROR]", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
