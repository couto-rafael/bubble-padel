import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";

export const scheduleRoutes = Router();

const scheduleSchema = z.object({
  court: z.string(),
  date: z.string().optional(),
  time: z.string().optional(),
});

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
