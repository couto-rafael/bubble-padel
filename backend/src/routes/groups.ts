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

      const created = await prisma.$transaction(async (tx) => {
        // 1. Remove grupos anteriores (cascata apaga Match records)
        await tx.group.deleteMany({ where: { tournamentId } });

        // 2. MAX(number) restante no torneio (só playoff matches sobrevivem à deleção acima)
        const [gAgg, pAgg] = await Promise.all([
          tx.match.aggregate({
            where: { group: { tournamentId } },
            _max: { number: true },
          }),
          tx.playoffMatch.aggregate({
            where: { bracket: { tournamentId } },
            _max: { number: true },
          }),
        ]);
        let nextNumber =
          Math.max(gAgg._max.number ?? 0, pAgg._max.number ?? 0) + 1;

        // 3. Ordena grupos (categoria ASC → nome ASC) para numeração determinística
        const sorted = [...groups].sort((a, b) =>
          a.category !== b.category
            ? a.category.localeCompare(b.category)
            : a.name.localeCompare(b.name),
        );

        // 4. Pré-atribui números a todos os matches antes de criar
        const numberMap = new Map<string, number[]>();
        for (const g of sorted) {
          const n = g.teams.length;
          const nums: number[] = [];
          for (let i = 0; i < n; i++)
            for (let j = i + 1; j < n; j++) nums.push(nextNumber++);
          numberMap.set(`${g.category}|${g.name}`, nums);
        }

        // 5. Cria grupos com matches numerados (pode ser paralelo — números já definidos)
        return Promise.all(
          groups.map(async (g) => {
            const teamIds = g.teams.map((t) => t.teamId);
            const nums = numberMap.get(`${g.category}|${g.name}`) ?? [];
            const matches: { team1Id: string; team2Id: string; number: number }[] =
              [];
            let idx = 0;
            for (let i = 0; i < teamIds.length; i++)
              for (let j = i + 1; j < teamIds.length; j++)
                matches.push({
                  team1Id: teamIds[i],
                  team2Id: teamIds[j],
                  number: nums[idx++],
                });

            return tx.group.create({
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
                matches: { create: matches },
              },
              include: { teams: { include: { team: true } }, matches: true },
            });
          }),
        );
      }, { timeout: 30000 });

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
