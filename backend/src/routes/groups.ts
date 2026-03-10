import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";

export const groupRoutes = Router();

const saveGroupsSchema = z.object({
  groups: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      teams: z.array(
        z.object({
          teamId: z.string(),
          position: z.number().default(0),
        }),
      ),
    }),
  ),
});

// GET /api/tournaments/:tournamentId/groups
groupRoutes.get(
  "/:tournamentId/groups",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const groups = await prisma.group.findMany({
        where: { tournamentId: req.params.tournamentId },
        include: {
          teams: { include: { team: true }, orderBy: { wins: "desc" } },
          matches: true,
        },
      });
      return res.json({ data: groups });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/tournaments/:tournamentId/groups — salva sorteio gerado no frontend
groupRoutes.post(
  "/:tournamentId/groups",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { groups } = saveGroupsSchema.parse(req.body);
      const tournamentId = req.params.tournamentId;

      // Remove grupos anteriores
      await prisma.group.deleteMany({ where: { tournamentId } });

      // Busca as duplas do torneio para gerar as partidas
      const teams = await prisma.team.findMany({ where: { tournamentId } });

      // Cria os grupos com duplas e partidas
      const created = await Promise.all(
        groups.map(async (g) => {
          const groupTeamIds = g.teams.map((t) => t.teamId);

          // Gera todas as combinações de partidas (round-robin)
          const matches: { team1Id: string; team2Id: string }[] = [];
          for (let i = 0; i < groupTeamIds.length; i++) {
            for (let j = i + 1; j < groupTeamIds.length; j++) {
              matches.push({
                team1Id: groupTeamIds[i],
                team2Id: groupTeamIds[j],
              });
            }
          }

          return prisma.group.create({
            data: {
              tournamentId,
              name: g.name,
              category: g.category,
              teams: {
                create: g.teams.map((t) => ({
                  teamId: t.teamId,
                  position: t.position,
                })),
              },
              matches: {
                create: matches,
              },
            },
            include: {
              teams: { include: { team: true } },
              matches: true,
            },
          });
        }),
      );

      return res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/tournaments/:tournamentId/groups — reseta todos os grupos
groupRoutes.delete(
  "/:tournamentId/groups",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      await prisma.group.deleteMany({
        where: { tournamentId: req.params.tournamentId },
      });
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
