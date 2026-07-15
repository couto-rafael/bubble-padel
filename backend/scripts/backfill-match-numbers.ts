/**
 * Backfill: atribui number a todos os Match e PlayoffMatch existentes.
 * Também recalcula team1Label/team2Label de quartas/semis/final com "Vencedor #N".
 *
 * Idempotente: se number já está definido, mantém o existente.
 * Roda por torneio, em transação com timeout 30s.
 *
 * Usage:
 *   npm run tsx scripts/backfill-match-numbers.ts --dry-run
 *   npm run tsx scripts/backfill-match-numbers.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log("=".repeat(60));
  console.log(DRY_RUN ? "MODE: DRY-RUN (nenhuma escrita)" : "MODE: REAL RUN");
  console.log("=".repeat(60));

  const tournaments = await prisma.tournament.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\nTorneios encontrados: ${tournaments.length}\n`);

  for (const t of tournaments) {
    await backfillTournament(t.id, t.name);
  }

  console.log("\n[DONE] Backfill concluído.");
}

async function backfillTournament(tournamentId: string, name: string) {
  console.log(`\n── Torneio: "${name}" (${tournamentId})`);

  // ── Grupo matches ────────────────────────────────────────────────────────────
  const groups = await prisma.group.findMany({
    where: { tournamentId },
    include: { matches: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  let nextNumber = 1;

  // Plano: lista de { matchId, number } a aplicar
  const groupPlan: { id: string; number: number }[] = [];
  for (const g of groups) {
    for (const m of g.matches) {
      if (m.number != null) {
        // Já numerado — respeita o número existente e avança o contador
        nextNumber = Math.max(nextNumber, m.number + 1);
      } else {
        groupPlan.push({ id: m.id, number: nextNumber++ });
      }
    }
  }

  console.log(
    `  Grupos: ${groups.length} | Matches de grupo: ${groups.flatMap((g) => g.matches).length} | A numerar: ${groupPlan.length}`,
  );
  if (DRY_RUN) {
    groupPlan.forEach((p) => console.log(`    [DRY] Match ${p.id} → #${p.number}`));
  }

  // ── Playoff brackets ─────────────────────────────────────────────────────────
  const brackets = await prisma.playoffBracket.findMany({
    where: { tournamentId },
    include: {
      matches: { orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }] },
    },
    orderBy: { category: "asc" },
  });

  type BracketMatch = (typeof brackets)[0]["matches"][0];
  const playoffPlan: { id: string; number: number }[] = [];

  // Tabela número para lookup de labels
  const numberByKey = new Map<string, number>(); // "bracketId:roundSize:matchIndex" → number

  // Primeiro passo: atribuir números
  for (const b of brackets) {
    for (const m of b.matches) {
      let num: number;
      if (m.number != null) {
        num = m.number;
        nextNumber = Math.max(nextNumber, m.number + 1);
      } else {
        num = nextNumber++;
        playoffPlan.push({ id: m.id, number: num });
      }
      numberByKey.set(`${b.id}:${m.roundSize}:${m.matchIndex}`, num);
    }
  }

  console.log(
    `  Brackets: ${brackets.length} | Playoff matches: ${brackets.flatMap((b) => b.matches).length} | A numerar: ${playoffPlan.length}`,
  );

  // Segundo passo: recalcular labels de rounds subsequentes
  const labelPlan: { id: string; team1Label: string | null; team2Label: string | null }[] =
    [];

  for (const b of brackets) {
    const firstRoundSize = Math.max(...b.matches.map((m) => m.roundSize));
    const matchByKey = new Map<string, BracketMatch>();
    for (const m of b.matches) matchByKey.set(`${m.roundSize}:${m.matchIndex}`, m);

    for (const m of b.matches) {
      if (m.roundSize === firstRoundSize) continue; // oitavas: labels do frontend

      const leftKey = `${m.roundSize * 2}:${m.matchIndex * 2}`;
      const rightKey = `${m.roundSize * 2}:${m.matchIndex * 2 + 1}`;
      const leftFeeder = matchByKey.get(leftKey);
      const rightFeeder = matchByKey.get(rightKey);

      const newT1 = leftFeeder
        ? leftFeeder.isBye
          ? (leftFeeder.team1Label ?? leftFeeder.team2Label ?? null)
          : `Vencedor #${numberByKey.get(`${b.id}:${leftKey}`)}`
        : null;

      const newT2 = rightFeeder
        ? rightFeeder.isBye
          ? (rightFeeder.team1Label ?? rightFeeder.team2Label ?? null)
          : `Vencedor #${numberByKey.get(`${b.id}:${rightKey}`)}`
        : null;

      if (newT1 !== m.team1Label || newT2 !== m.team2Label) {
        labelPlan.push({ id: m.id, team1Label: newT1, team2Label: newT2 });
        console.log(
          `  [LABEL] ${b.category} round=${m.roundSize} idx=${m.matchIndex}: "${m.team1Label}" → "${newT1}" | "${m.team2Label}" → "${newT2}"`,
        );
      }
    }
  }

  if (DRY_RUN) {
    console.log(
      `  [DRY] Skipping ${groupPlan.length + playoffPlan.length} number updates + ${labelPlan.length} label updates`,
    );
    return;
  }

  // ── Aplica no banco ───────────────────────────────────────────────────────────
  await prisma.$transaction(
    async (tx) => {
      for (const p of groupPlan) {
        await tx.match.update({ where: { id: p.id }, data: { number: p.number } });
      }
      for (const p of playoffPlan) {
        await tx.playoffMatch.update({
          where: { id: p.id },
          data: { number: p.number },
        });
      }
      for (const p of labelPlan) {
        await tx.playoffMatch.update({
          where: { id: p.id },
          data: { team1Label: p.team1Label, team2Label: p.team2Label },
        });
      }
    },
    { timeout: 30000 },
  );

  console.log(
    `  ✓ ${groupPlan.length} group matches + ${playoffPlan.length} playoff matches numerados | ${labelPlan.length} labels atualizados`,
  );
}

main()
  .catch((err) => {
    console.error("\n[ERROR]", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
