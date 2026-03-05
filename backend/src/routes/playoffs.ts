import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";

// ─── Router montado em /api/tournaments ──────────────────────────────────────
export const playoffTournamentRoutes = Router();

// ─── Router montado em /api/playoffs ─────────────────────────────────────────
export const playoffRoutes = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tournaments/:tournamentId/playoffs
// Retorna todos os brackets do torneio
// ─────────────────────────────────────────────────────────────────────────────
playoffTournamentRoutes.get(
  "/:tournamentId/playoffs",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const brackets = await prisma.playoffBracket.findMany({
        where: { tournamentId: req.params.tournamentId },
        include: { matches: { orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }] } },
      });
      return res.json({ data: brackets });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tournaments/:tournamentId/playoffs
// Cria ou substitui o bracket de uma categoria
// Body: { category, matches: PlayoffMatch[] }
// ─────────────────────────────────────────────────────────────────────────────
playoffTournamentRoutes.post(
  "/:tournamentId/playoffs",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { tournamentId } = req.params;
      const { category, matches } = req.body as {
        category: string;
        matches: Array<{
          roundSize: number;
          matchIndex: number;
          team1Id?: string | null;
          team2Id?: string | null;
          team1Label?: string | null;
          team2Label?: string | null;
          score1?: number | null;
          score2?: number | null;
          winnerId?: string | null;
          isBye?: boolean;
          played?: boolean;
        }>;
      };

      // Deleta bracket antigo se existir
      const existing = await prisma.playoffBracket.findUnique({
        where: { tournamentId_category: { tournamentId, category } },
      });
      if (existing) {
        await prisma.playoffMatch.deleteMany({ where: { bracketId: existing.id } });
        await prisma.playoffBracket.delete({ where: { id: existing.id } });
      }

      // Cria novo bracket com matches
      const bracket = await prisma.playoffBracket.create({
        data: {
          tournamentId,
          category,
          matches: {
            create: matches.map((m) => ({
              roundSize: m.roundSize,
              matchIndex: m.matchIndex,
              team1Id: m.team1Id ?? null,
              team2Id: m.team2Id ?? null,
              team1Label: m.team1Label ?? null,
              team2Label: m.team2Label ?? null,
              score1: m.score1 ?? null,
              score2: m.score2 ?? null,
              winnerId: m.winnerId ?? null,
              isBye: m.isBye ?? false,
              played: m.played ?? false,
            })),
          },
        },
        include: { matches: { orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }] } },
      });

      return res.status(201).json({ data: bracket });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tournaments/:tournamentId/playoffs/:category
// Remove bracket de uma categoria
// ─────────────────────────────────────────────────────────────────────────────
playoffTournamentRoutes.delete(
  "/:tournamentId/playoffs/:category",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { tournamentId, category } = req.params;
      const decoded = decodeURIComponent(category);
      const existing = await prisma.playoffBracket.findUnique({
        where: { tournamentId_category: { tournamentId, category: decoded } },
      });
      if (existing) {
        await prisma.playoffMatch.deleteMany({ where: { bracketId: existing.id } });
        await prisma.playoffBracket.delete({ where: { id: existing.id } });
      }
      return res.json({ data: { ok: true } });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/playoffs/matches/:matchId
// Registra resultado de uma partida de playoff
// Body: { score1, score2, winnerId }
// ─────────────────────────────────────────────────────────────────────────────
playoffRoutes.patch(
  "/matches/:matchId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { matchId } = req.params;
      const { score1, score2, winnerId } = req.body;

      const updated = await prisma.playoffMatch.update({
        where: { id: matchId },
        data: {
          score1: score1 ?? null,
          score2: score2 ?? null,
          winnerId: winnerId ?? null,
          played: winnerId != null,
        },
      });

      // Propaga o vencedor para o próximo jogo
      const nextRoundSize = updated.roundSize / 2;
      if (nextRoundSize >= 1 && winnerId) {
        const nextMatchIndex = Math.floor(updated.matchIndex / 2);
        const isTeam1Slot = updated.matchIndex % 2 === 0;

        const bracket = await prisma.playoffBracket.findUnique({
          where: { id: updated.bracketId },
        });
        if (bracket) {
          const nextMatch = await prisma.playoffMatch.findFirst({
            where: {
              bracketId: bracket.id,
              roundSize: nextRoundSize,
              matchIndex: nextMatchIndex,
            },
          });
          if (nextMatch) {
            // Busca o label da dupla vencedora
            const winnerTeam = await prisma.team.findUnique({
              where: { id: winnerId },
            });
            const winnerLabel = winnerTeam
              ? `${winnerTeam.player1Name} / ${winnerTeam.player2Name}`
              : "Vencedor";

            await prisma.playoffMatch.update({
              where: { id: nextMatch.id },
              data: isTeam1Slot
                ? { team1Id: winnerId, team1Label: winnerLabel }
                : { team2Id: winnerId, team2Label: winnerLabel },
            });
          }
        }
      }

      // Retorna o bracket completo atualizado
      const bracketUpdated = await prisma.playoffBracket.findUnique({
        where: { id: updated.bracketId },
        include: { matches: { orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }] } },
      });

      return res.json({ data: bracketUpdated });
    } catch (err) {
      next(err);
    }
  }
);
