import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";

export const scheduleRoutes = Router();
export const scheduleTournamentRoutes = Router({ mergeParams: true });

const scheduleSchema = z.object({
  court: z.string(),
  date: z.string().optional(),
  time: z.string().optional(),
});

// GET /api/tournaments/:tournamentId/schedule
// Retorna { [matchId]: { matchId, court, date, time } }
scheduleTournamentRoutes.get(
  "/:tournamentId/schedule",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const schedules = await prisma.schedule.findMany({
        where: {
          match: {
            group: { tournamentId: req.params.tournamentId },
          },
        },
      });

      const result: Record<string, any> = {};
      for (const s of schedules) {
        result[s.matchId] = {
          matchId: s.matchId,
          court: s.court,
          date: s.date ? s.date.toISOString().split("T")[0] : null,
          time: s.time ?? null,
        };
      }

      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/matches/:id/schedule
scheduleRoutes.patch(
  "/:id/schedule",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const data = scheduleSchema.parse(req.body);

      const schedule = await prisma.schedule.upsert({
        where: { matchId: req.params.id },
        create: {
          matchId: req.params.id,
          court: data.court,
          date: data.date ? new Date(data.date) : null,
          time: data.time,
        },
        update: {
          court: data.court,
          date: data.date ? new Date(data.date) : null,
          time: data.time,
        },
      });

      return res.json({ data: schedule });
    } catch (err) {
      next(err);
    }
  },
);
