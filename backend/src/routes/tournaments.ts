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
  description: z.string().default(""),
  maxTeams: z.number().default(32),
  priceFirstCategory: z.number().default(0),
  hasSecondCategoryPrice: z.boolean().default(false),
  priceSecondCategory: z.number().default(0),
  pixKey: z.string().default(""),
  clubSede: z.string().default(""),
  categories: z.array(z.string()).default([]),
  courts: z.array(z.string()).default([]),
  matchDuration: z.number().default(60),
  daySchedules: z
    .array(
      z.object({
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
      }),
    )
    .default([]),
  status: z
    .enum(["DRAFT", "PUBLISHED", "OPEN", "ONGOING", "COMPLETED"])
    .optional(),
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
      const { status, ...rest } = data;
      const tournament = await prisma.tournament.updateMany({
        where: { id: req.params.id, clubId: req.clubId! },
        data: {
          ...rest,
          ...(status && { status }),
          ...(rest.startDate && { startDate: new Date(rest.startDate) }),
          ...(rest.endDate && { endDate: new Date(rest.endDate) }),
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

// ─────────────────────────────────────────────────────────────────────────────
// ROTAS PÚBLICAS (sem autenticação)
// ─────────────────────────────────────────────────────────────────────────────

export const publicTournamentRoutes = Router();

const registerSchema = z.object({
  player1Name: z.string().min(2),
  player1Email: z.string().email(),
  player2Name: z.string().min(2),
  player2Email: z.string().email(),
  category: z.string(),
});

// GET /api/public/tournaments — lista torneios publicados/abertos
publicTournamentRoutes.get("/", async (req, res, next) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { status: { in: ["PUBLISHED", "OPEN", "ONGOING", "COMPLETED"] } },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            logoUrl: true,
          },
        },
        _count: { select: { teams: true } },
      },
      orderBy: { startDate: "asc" },
    });
    return res.json({ data: tournaments });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/tournaments/:id
publicTournamentRoutes.get("/:id", async (req, res, next) => {
  try {
    const tournament = await prisma.tournament.findFirst({
      where: {
        id: req.params.id,
        status: { in: ["PUBLISHED", "OPEN", "ONGOING", "COMPLETED"] },
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            logoUrl: true,
            phone: true,
          },
        },
        _count: { select: { teams: true } },
        teams: {
          where: { status: "CONFIRMED" },
          select: {
            id: true,
            player1Name: true,
            player2Name: true,
            category: true,
            status: true,
          },
          orderBy: { registrationDate: "asc" },
        },
        groups: {
          include: {
            teams: { include: { team: true } },
            matches: {
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });
    if (!tournament)
      return res.status(404).json({ error: "Torneio não encontrado" });

    // Buscar playoff brackets separadamente (nome da relação pode variar no schema)
    const playoffBrackets = await (prisma as any).playoffBracket.findMany({
      where: { tournamentId: req.params.id },
      include: {
        matches: {
          orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }],
        },
      },
    });

    return res.json({ data: { ...tournament, playoffBrackets } });
  } catch (err) {
    next(err);
  }
});

// POST /api/public/tournaments/:id/register — inscrição pública
publicTournamentRoutes.post("/:id/register", async (req, res, next) => {
  try {
    const tournamentId = req.params.id;
    const data = registerSchema.parse(req.body);

    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, status: "OPEN" },
      include: { _count: { select: { teams: true } } },
    });

    if (!tournament)
      return res.status(404).json({
        error: "Torneio não encontrado ou inscrições não estão abertas",
      });

    if (tournament._count.teams >= tournament.maxTeams)
      return res.status(400).json({ error: "Torneio lotado" });

    const amount =
      tournament.priceFirstCategory > 0 ? tournament.priceFirstCategory : 0;

    const team = await prisma.team.create({
      data: {
        tournamentId,
        player1Name: data.player1Name,
        player1Email: data.player1Email,
        player2Name: data.player2Name,
        player2Email: data.player2Email,
        category: data.category,
        amount,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
    });

    return res.status(201).json({ data: team });
  } catch (err) {
    next(err);
  }
});
