import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";

export const athleteRoutes = Router();

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  avatarUrl: z.string().optional(),
  birthDate: z.string().optional(),
});

// GET /api/athlete/profile
athleteRoutes.get("/profile", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { userId: req.userId },
      include: {
        user: { select: { email: true } },
      },
    });

    if (!athlete) return res.status(404).json({ error: "Atleta não encontrado" });
    return res.json({ data: athlete });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/athlete/profile
athleteRoutes.patch("/profile", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const athlete = await prisma.athlete.update({
      where: { userId: req.userId },
      data: {
        ...data,
        ...(data.birthDate && { birthDate: new Date(data.birthDate) }),
      },
    });
    return res.json({ data: athlete });
  } catch (err) {
    next(err);
  }
});

// GET /api/athlete/tournaments — histórico de torneios do atleta logado
athleteRoutes.get("/tournaments", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });
    if (!athlete) return res.status(404).json({ error: "Atleta não encontrado" });

    // Busca inscrições pelo email do atleta
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true },
    });

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { player1Email: user?.email },
          { player2Email: user?.email },
        ],
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            sport: true,
            status: true,
            startDate: true,
            endDate: true,
            categories: true,
            club: { select: { id: true, name: true, city: true } },
          },
        },
      },
      orderBy: { registrationDate: "desc" },
    });

    return res.json({ data: teams });
  } catch (err) {
    next(err);
  }
});

// ─── Rotas públicas ───────────────────────────────────────────────────────────

export const publicAthleteRoutes = Router();

// GET /api/public/athletes/:id
publicAthleteRoutes.get("/:id", async (req, res, next) => {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        fullName: true,
        city: true,
        state: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    if (!athlete) return res.status(404).json({ error: "Atleta não encontrado" });
    return res.json({ data: athlete });
  } catch (err) {
    next(err);
  }
});
