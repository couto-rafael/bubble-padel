import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";

export const tournamentRoutes = Router();

const tournamentSchema = z.object({
  name: z.string().min(2),
  sport: z
    .enum(["PADEL", "BEACH_TENNIS", "TENIS", "PICKLEBALL"])
    .default("PADEL"),
  tournamentType: z.string().default("Grupos + Playoffs"),
  startDate: z.string(),
  endDate: z.string(),
  registrationStartDate: z.string(),
  registrationEndDate: z.string(),
  description: z.string().default(""),
  maxTeams: z.number().default(32),
  priceFirstCategory: z.number().default(0),
  hasSecondCategoryPrice: z.boolean().default(false),
  priceSecondCategory: z.number().default(0),
  pixKey: z.string().default(""),
  clubSede: z.string().default(""),
  categories: z.array(z.string()).default([]),
  courts: z.array(z.string()).default([]),
});

// GET /api/tournaments — lista torneios do clube logado
tournamentRoutes.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { clubId: req.clubId! },
      include: { _count: { select: { teams: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ data: tournaments });
  } catch (err) {
    next(err);
  }
});

// GET /api/tournaments/:id
tournamentRoutes.get(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const tournament = await prisma.tournament.findFirst({
        where: { id: req.params.id, clubId: req.clubId! },
        include: { _count: { select: { teams: true } } },
      });
      if (!tournament)
        return res.status(404).json({ error: "Torneio não encontrado" });
      return res.json({ data: tournament });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/tournaments
tournamentRoutes.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = tournamentSchema.parse(req.body);
    const tournament = await prisma.tournament.create({
      data: {
        ...data,
        clubId: req.clubId!,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        registrationStartDate: new Date(data.registrationStartDate),
        registrationEndDate: new Date(data.registrationEndDate),
      },
    });
    return res.status(201).json({ data: tournament });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tournaments/:id
tournamentRoutes.patch(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const data = tournamentSchema.partial().parse(req.body);
      const tournament = await prisma.tournament.updateMany({
        where: { id: req.params.id, clubId: req.clubId! },
        data: {
          ...data,
          ...(data.startDate && { startDate: new Date(data.startDate) }),
          ...(data.endDate && { endDate: new Date(data.endDate) }),
          ...(data.registrationStartDate && {
            registrationStartDate: new Date(data.registrationStartDate),
          }),
          ...(data.registrationEndDate && {
            registrationEndDate: new Date(data.registrationEndDate),
          }),
        },
      });
      return res.json({ data: tournament });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/tournaments/:id
tournamentRoutes.delete(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      await prisma.tournament.deleteMany({
        where: { id: req.params.id, clubId: req.clubId! },
      });
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/tournaments/:id/schedule/bulk — salva schedule de múltiplos jogos de uma vez
tournamentRoutes.post(
  "/:id/schedule/bulk",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { schedules } = req.body as {
        schedules: Array<{
          matchId: string;
          court: string;
          date: string;
          time: string;
        }>;
      };

      if (!Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({ error: "schedules array é obrigatório" });
      }

      // Upsert em paralelo (cria ou atualiza cada schedule de jogo)
      await Promise.all(
        schedules.map((s) =>
          prisma.schedule.upsert({
            where: { matchId: s.matchId },
            create: {
              matchId: s.matchId,
              court: s.court,
              date: new Date(s.date), // ← era: date: s.date
              time: s.time,
            },
            update: {
              court: s.court,
              date: new Date(s.date), // ← era: date: s.date
              time: s.time,
            },
          }),
        ),
      );

      return res.json({ data: { count: schedules.length } });
    } catch (err) {
      next(err);
    }
  },
);
