import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";

export const super8Routes = Router();

// Algoritmo Super 8 — índices 0-7 (hardcoded, garante parceiros únicos)
const ROUNDS: Array<[number, number, number, number][]> = [
  // Round 1
  [[0, 1, 2, 3], [4, 5, 6, 7]],
  // Round 2
  [[0, 2, 1, 3], [4, 6, 5, 7]],
  // Round 3
  [[0, 3, 1, 2], [4, 7, 5, 6]],
  // Round 4
  [[0, 4, 1, 5], [2, 6, 3, 7]],
  // Round 5
  [[0, 5, 1, 4], [2, 7, 3, 6]],
  // Round 6
  [[0, 6, 1, 7], [2, 4, 3, 5]],
  // Round 7
  [[0, 7, 1, 6], [2, 5, 3, 4]],
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/super8/:tournamentId/generate
// Body: { players: string[] } — 8 nomes
// ─────────────────────────────────────────────────────────────────────────────
super8Routes.post(
  "/:tournamentId/generate",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { tournamentId } = req.params;
      const { players } = req.body as { players: string[] };

      if (!Array.isArray(players) || players.length !== 8) {
        return res
          .status(400)
          .json({ error: "Exatamente 8 jogadores são necessários" });
      }

      // Deleta dados existentes
      await prisma.super8Match.deleteMany({ where: { tournamentId } });
      await prisma.super8Player.deleteMany({ where: { tournamentId } });

      // Cria players
      await prisma.super8Player.createMany({
        data: players.map((name, order) => ({ tournamentId, name, order })),
      });

      // Cria 14 partidas (7 rodadas × 2)
      const matchData = ROUNDS.flatMap((round, roundIdx) =>
        round.map(([p1, p2, p3, p4], matchIdx) => ({
          tournamentId,
          round: roundIdx + 1,
          matchIndex: matchIdx,
          team1p1: p1,
          team1p2: p2,
          team2p1: p3,
          team2p2: p4,
        })),
      );

      await prisma.super8Match.createMany({ data: matchData });

      const result = await fetchSuper8Data(tournamentId);
      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/super8/:tournamentId
// ─────────────────────────────────────────────────────────────────────────────
super8Routes.get(
  "/:tournamentId",
  async (req, res, next) => {
    try {
      const { tournamentId } = req.params;
      const result = await fetchSuper8Data(tournamentId);
      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/super8/:tournamentId/matches/:matchId
// Body: { score1: number, score2: number }
// ─────────────────────────────────────────────────────────────────────────────
super8Routes.put(
  "/:tournamentId/matches/:matchId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { tournamentId, matchId } = req.params;
      const { score1, score2 } = req.body as { score1: number; score2: number };

      const match = await prisma.super8Match.findFirst({
        where: { id: matchId, tournamentId },
      });
      if (!match) return res.status(404).json({ error: "Partida não encontrada" });

      // Atualiza partida
      await prisma.super8Match.update({
        where: { id: matchId },
        data: { score1, score2, played: true },
      });

      // Primeiro placar salvo → torneio vai para ONGOING
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { status: true },
      });
      if (tournament && ["OPEN", "CLOSED", "PUBLISHED"].includes(tournament.status)) {
        const playedCount = await prisma.super8Match.count({
          where: { tournamentId, played: true },
        });
        if (playedCount === 1) {
          await prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: "ONGOING" },
          });
        }
      }

      // Recalcula ranking — zera todos e recalcula do zero
      await recalcRanking(tournamentId);

      const result = await fetchSuper8Data(tournamentId);
      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function fetchSuper8Data(tournamentId: string) {
  const [players, matches] = await Promise.all([
    prisma.super8Player.findMany({
      where: { tournamentId },
      orderBy: [
        { wins: "desc" },
        { gamesFor: "desc" },
      ],
    }),
    prisma.super8Match.findMany({
      where: { tournamentId },
      orderBy: [{ round: "asc" }, { matchIndex: "asc" }],
    }),
  ]);
  return { players, matches };
}

async function recalcRanking(tournamentId: string) {
  // Zera stats
  await prisma.super8Player.updateMany({
    where: { tournamentId },
    data: { wins: 0, losses: 0, gamesFor: 0, gamesAgainst: 0 },
  });

  const matches = await prisma.super8Match.findMany({
    where: { tournamentId, played: true },
  });

  const players = await prisma.super8Player.findMany({
    where: { tournamentId },
    orderBy: { order: "asc" },
  });

  // Mapa order → player id
  const byOrder = new Map(players.map((p) => [p.order, p]));

  for (const m of matches) {
    if (m.score1 == null || m.score2 == null) continue;
    const s1 = m.score1;
    const s2 = m.score2;
    const team1Won = s1 > s2;

    // Time 1: players team1p1 + team1p2
    for (const idx of [m.team1p1, m.team1p2]) {
      const p = byOrder.get(idx);
      if (!p) continue;
      await prisma.super8Player.update({
        where: { id: p.id },
        data: {
          wins: { increment: team1Won ? 1 : 0 },
          losses: { increment: team1Won ? 0 : 1 },
          gamesFor: { increment: s1 },
          gamesAgainst: { increment: s2 },
        },
      });
    }

    // Time 2: players team2p1 + team2p2
    for (const idx of [m.team2p1, m.team2p2]) {
      const p = byOrder.get(idx);
      if (!p) continue;
      await prisma.super8Player.update({
        where: { id: p.id },
        data: {
          wins: { increment: team1Won ? 0 : 1 },
          losses: { increment: team1Won ? 1 : 0 },
          gamesFor: { increment: s2 },
          gamesAgainst: { increment: s1 },
        },
      });
    }
  }
}
