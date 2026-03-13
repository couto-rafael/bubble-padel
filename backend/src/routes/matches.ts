import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";

export const matchRoutes = Router();

const scoreSchema = z.object({
  score1: z.number(),
  score2: z.number(),
  wo: z.number().optional(),
  sets: z
    .array(
      z.object({
        s1: z.number(),
        s2: z.number(),
      }),
    )
    .optional(),
});

// PATCH /api/matches/:id/score
matchRoutes.patch(
  "/:id/score",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const data = scoreSchema.parse(req.body);

      // Salva o resultado
      const match = await prisma.match.update({
        where: { id: req.params.id },
        data: {
          score1: data.score1,
          score2: data.score2,
          wo: data.wo,
          sets: data.sets ?? undefined,
          played: true,
        },
        include: { group: true },
      });

      // Recalcula standings de todas as duplas do grupo
      const allMatches = await prisma.match.findMany({
        where: { groupId: match.groupId, played: true },
      });

      const groupTeams = await prisma.groupTeam.findMany({
        where: { groupId: match.groupId },
      });

      // Zera e recalcula
      const stats: Record<
        string,
        {
          wins: number;
          losses: number;
          pointsFor: number;
          pointsAgainst: number;
          saldo: number;
          gamesPlayed: number;
        }
      > = {};

      for (const gt of groupTeams) {
        stats[gt.teamId] = {
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          saldo: 0,
          gamesPlayed: 0,
        };
      }

      for (const m of allMatches) {
        if (!stats[m.team1Id] || !stats[m.team2Id]) continue;

        const sets = m.sets as Array<{ s1: number; s2: number }> | null;
        let wins1 = 0,
          wins2 = 0;

        if (sets && sets.length > 0) {
          wins1 = sets.filter((s) => s.s1 > s.s2).length;
          wins2 = sets.filter((s) => s.s2 > s.s1).length;
        } else {
          wins1 = (m.score1 ?? 0) > (m.score2 ?? 0) ? 1 : 0;
          wins2 = (m.score2 ?? 0) > (m.score1 ?? 0) ? 1 : 0;
        }

        const pf1 = m.score1 ?? 0,
          pa1 = m.score2 ?? 0;
        const pf2 = m.score2 ?? 0,
          pa2 = m.score1 ?? 0;

        stats[m.team1Id].gamesPlayed++;
        stats[m.team1Id].pointsFor += pf1;
        stats[m.team1Id].pointsAgainst += pa1;
        stats[m.team1Id].saldo += pf1 - pa1;
        if (wins1 > wins2) stats[m.team1Id].wins++;
        else stats[m.team1Id].losses++;

        stats[m.team2Id].gamesPlayed++;
        stats[m.team2Id].pointsFor += pf2;
        stats[m.team2Id].pointsAgainst += pa2;
        stats[m.team2Id].saldo += pf2 - pa2;
        if (wins2 > wins1) stats[m.team2Id].wins++;
        else stats[m.team2Id].losses++;
      }

      // Persiste standings atualizados
      await Promise.all(
        groupTeams.map((gt) =>
          prisma.groupTeam.update({
            where: { id: gt.id },
            data: stats[gt.teamId] ?? {},
          }),
        ),
      );

      // Se o torneio ainda não está ONGOING, passa automaticamente ao 1º placar
      const group = await prisma.group.findUnique({
        where: { id: match.groupId },
        select: { tournamentId: true },
      });
      if (group) {
        await prisma.tournament.updateMany({
          where: {
            id: group.tournamentId,
            status: { notIn: ["ONGOING", "COMPLETED"] },
          },
          data: { status: "ONGOING" },
        });
      }

      // Retorna o grupo completo atualizado
      const updatedGroup = await prisma.group.findUnique({
        where: { id: match.groupId },
        include: {
          teams: { include: { team: true }, orderBy: { wins: "desc" } },
          matches: true,
        },
      });

      return res.json({ data: updatedGroup });
    } catch (err) {
      next(err);
    }
  },
);
