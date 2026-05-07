import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { maybeCreatePlayoffMatchResultPost } from "../services/PostService";

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
        include: {
          matches: { orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }] },
        },
      });
      return res.json({ data: brackets });
    } catch (err) {
      next(err);
    }
  },
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
        await prisma.playoffMatch.deleteMany({
          where: { bracketId: existing.id },
        });
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
        include: {
          matches: { orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }] },
        },
      });

      return res.status(201).json({ data: bracket });
    } catch (err) {
      next(err);
    }
  },
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
        await prisma.playoffMatch.deleteMany({
          where: { bracketId: existing.id },
        });
        await prisma.playoffBracket.delete({ where: { id: existing.id } });
      }
      return res.json({ data: { ok: true } });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tournaments/:tournamentId/playoffs/:category/seed
// Resolve labels "1° Grupo A" para teamIds reais com base nas standings
// ─────────────────────────────────────────────────────────────────────────────
playoffTournamentRoutes.post(
  "/:tournamentId/playoffs/:category/seed",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { tournamentId } = req.params;
      const category = decodeURIComponent(req.params.category);

      const bracket = await prisma.playoffBracket.findUnique({
        where: { tournamentId_category: { tournamentId, category } },
        include: { matches: true },
      });
      if (!bracket)
        return res.status(404).json({ error: "Bracket não encontrado" });

      const groups = await prisma.group.findMany({
        where: { tournamentId, category },
        include: {
          teams: { include: { team: true }, orderBy: { position: "asc" } },
          matches: true,
        },
      });

      // Seed parcial: resolve apenas grupos cujos jogos já terminaram todos

      function getStandings(group: any) {
        const stats: Record<
          string,
          { wins: number; saldo: number; gamesFor: number }
        > = {};
        for (const gt of group.teams) {
          stats[gt.teamId] = { wins: 0, saldo: 0, gamesFor: 0 };
        }
        for (const m of group.matches as any[]) {
          if (!m.played || m.score1 == null || m.score2 == null) continue;
          const s1 = m.score1,
            s2 = m.score2;
          if (s1 > s2) {
            if (stats[m.team1Id]) {
              stats[m.team1Id].wins++;
              stats[m.team1Id].saldo += s1 - s2;
              stats[m.team1Id].gamesFor += s1;
            }
            if (stats[m.team2Id]) {
              stats[m.team2Id].saldo -= s1 - s2;
              stats[m.team2Id].gamesFor += s2;
            }
          } else {
            if (stats[m.team2Id]) {
              stats[m.team2Id].wins++;
              stats[m.team2Id].saldo += s2 - s1;
              stats[m.team2Id].gamesFor += s2;
            }
            if (stats[m.team1Id]) {
              stats[m.team1Id].saldo -= s2 - s1;
              stats[m.team1Id].gamesFor += s1;
            }
          }
        }
        return (group.teams as any[])
          .map((gt: any) => ({
            teamId: gt.teamId,
            team: gt.team,
            ...stats[gt.teamId],
          }))
          .sort(
            (a: any, b: any) =>
              b.wins - a.wins || b.saldo - a.saldo || b.gamesFor - a.gamesFor,
          );
      }

      const labelMap: Record<string, { teamId: string; label: string }> = {};
      for (const group of groups as any[]) {
        // Só resolve grupos onde todos os jogos já foram jogados
        const groupDone = (group.matches as any[]).every((m: any) => m.played);
        if (!groupDone) continue;
        const standings = getStandings(group);
        standings.forEach((entry: any, idx: number) => {
          const key = `${idx + 1}° ${group.name}`;
          labelMap[key] = {
            teamId: entry.teamId,
            label: `${entry.team.player1Name} / ${entry.team.player2Name}`,
          };
        });
      }

      const updates: Promise<any>[] = [];
      for (const match of bracket.matches) {
        const data: any = {};
        if (!match.team1Id && match.team1Label && labelMap[match.team1Label]) {
          data.team1Id = labelMap[match.team1Label].teamId;
          data.team1Label = labelMap[match.team1Label].label;
        }
        if (!match.team2Id && match.team2Label && labelMap[match.team2Label]) {
          data.team2Id = labelMap[match.team2Label].teamId;
          data.team2Label = labelMap[match.team2Label].label;
        }
        if (Object.keys(data).length > 0) {
          updates.push(
            prisma.playoffMatch.update({ where: { id: match.id }, data }),
          );
        }
      }
      await Promise.all(updates);

      // Propaga vencedores de partidas BYE para a próxima fase
      const refreshed = await prisma.playoffBracket.findUnique({
        where: { id: bracket.id },
        include: { matches: true },
      });
      if (refreshed) {
        const byePropUpdates: Promise<any>[] = [];
        for (const m of refreshed.matches) {
          if (!m.isBye || m.played === false) continue;
          // Determina o vencedor: quem não é BYE
          const t1IsBye = m.team1Label === null && m.team2Label !== null;
          const t2IsBye = m.team2Label === null && m.team1Label !== null;
          const winnerId = t1IsBye ? m.team2Id : t2IsBye ? m.team1Id : null;
          if (!winnerId) continue;
          if (m.winnerId === winnerId) continue; // já propagado

          // Atualiza winnerId no match BYE
          byePropUpdates.push(
            prisma.playoffMatch.update({
              where: { id: m.id },
              data: { winnerId },
            }),
          );

          // Propaga para próxima fase
          const nextRoundSize = m.roundSize / 2;
          if (nextRoundSize < 1) continue;
          const nextMatchIndex = Math.floor(m.matchIndex / 2);
          const isSlot1 = m.matchIndex % 2 === 0;
          const nextMatch = await prisma.playoffMatch.findFirst({
            where: {
              bracketId: bracket.id,
              roundSize: nextRoundSize,
              matchIndex: nextMatchIndex,
            },
          });
          if (!nextMatch) continue;
          const winnerTeam = await prisma.team.findUnique({
            where: { id: winnerId },
          });
          const winnerLabel = winnerTeam
            ? `${winnerTeam.player1Name} / ${winnerTeam.player2Name}`
            : "Vencedor";
          byePropUpdates.push(
            prisma.playoffMatch.update({
              where: { id: nextMatch.id },
              data: isSlot1
                ? { team1Id: winnerId, team1Label: winnerLabel }
                : { team2Id: winnerId, team2Label: winnerLabel },
            }),
          );
        }
        await Promise.all(byePropUpdates);
      }

      const updated = await prisma.playoffBracket.findUnique({
        where: { id: bracket.id },
        include: {
          matches: { orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }] },
        },
      });
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
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

      // Auto-post (fire-and-forget)
      if (winnerId) {
        maybeCreatePlayoffMatchResultPost(matchId).catch((e) =>
          console.error("[feed] maybeCreatePlayoffMatchResultPost failed:", e),
        );
      }

      // Retorna o bracket completo atualizado
      const bracketUpdated = await prisma.playoffBracket.findUnique({
        where: { id: updated.bracketId },
        include: {
          matches: { orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }] },
        },
      });

      return res.json({ data: bracketUpdated });
    } catch (err) {
      next(err);
    }
  },
);
