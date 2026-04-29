import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";

export const teamRoutes = Router();

const teamSchema = z.object({
  player1Name: z.string().min(2),
  player1Email: z.string().email(),
  player2Name: z.string().default(""),
  player2Email: z.union([z.string().email(), z.literal("")]).default(""),
  category: z.string(),
  status: z.enum(["CONFIRMED", "PENDING"]).default("PENDING"),
  amount: z.number().default(0),
  hasRestriction: z.boolean().default(false),
});

// GET /api/tournaments/:tournamentId/teams
teamRoutes.get(
  "/:tournamentId/teams",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const teams = await prisma.team.findMany({
        where: { tournamentId: req.params.tournamentId },
        orderBy: { registrationDate: "desc" },
      });
      return res.json({ data: teams });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/tournaments/:tournamentId/teams
teamRoutes.post(
  "/:tournamentId/teams",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const parsed = teamSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validação falhou", details: parsed.error.flatten() });
      }
      const team = await prisma.team.create({
        data: { ...parsed.data, tournamentId: req.params.tournamentId },
      });
      await prisma.tournament.update({
        where: { id: req.params.tournamentId },
        data: { updatedAt: new Date() },
      });
      return res.status(201).json({ data: team });
    } catch (err: any) {
      console.error("POST /teams error:", err?.message ?? err);
      next(err);
    }
  },
);

// PATCH /api/tournaments/:tournamentId/teams/:id
teamRoutes.patch(
  "/:tournamentId/teams/:id",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const data = teamSchema.partial().parse(req.body);
      const team = await prisma.team.update({
        where: { id: req.params.id },
        data,
      });
      return res.json({ data: team });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/tournaments/:tournamentId/teams/:id
teamRoutes.delete(
  "/:tournamentId/teams/:id",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      await prisma.team.delete({ where: { id: req.params.id } });
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
