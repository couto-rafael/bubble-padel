import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";

export const athleteRoutes = Router();

// ─── Schemas de validação ─────────────────────────────────────────────────────

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  avatarUrl: z.string().optional(),
  birthDate: z.string().optional(),
  // Sprint 7 — perfil Strava
  nickname: z.string().max(30).optional().nullable(),
  sports: z
    .array(z.enum(["PADEL", "BEACH_TENNIS", "TENIS", "PICKLEBALL"]))
    .optional(),
  rackets: z.array(z.string().max(60)).optional(),
  instagramUrl: z.string().max(100).optional().nullable(),
  twitterUrl: z.string().max(100).optional().nullable(),
});

// ─── Catálogo de achievements ─────────────────────────────────────────────────

const ACHIEVEMENT_META: Record<
  string,
  {
    name: string;
    description: string;
    icon: string;
    category: "participacao" | "performance" | "social" | "plataforma";
    hasProgress: boolean;
    tiers: Array<{
      tier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" | "LEGEND";
      threshold: number;
      label: string;
    }>;
  }
> = {
  first_tournament: {
    name: "Primeira Bola",
    description: "Inscreveu-se no primeiro torneio",
    icon: "🎾",
    category: "participacao",
    hasProgress: false,
    tiers: [{ tier: "BRONZE", threshold: 1, label: "Desbloqueado" }],
  },
  regular_player: {
    name: "Frequentador",
    description: "Torneios concluídos",
    icon: "📅",
    category: "participacao",
    hasProgress: true,
    tiers: [
      { tier: "BRONZE", threshold: 3, label: "3 torneios" },
      { tier: "SILVER", threshold: 5, label: "5 torneios" },
      { tier: "GOLD", threshold: 10, label: "10 torneios" },
      { tier: "DIAMOND", threshold: 25, label: "25 torneios" },
      { tier: "LEGEND", threshold: 50, label: "50 torneios" },
    ],
  },
  monthly_player: {
    name: "Presença Mensal",
    description: "Meses distintos com torneio disputado",
    icon: "🗓️",
    category: "participacao",
    hasProgress: true,
    tiers: [
      { tier: "BRONZE", threshold: 3, label: "3 meses" },
      { tier: "SILVER", threshold: 6, label: "6 meses" },
      { tier: "GOLD", threshold: 12, label: "12 meses" },
    ],
  },
  first_title: {
    name: "Primeiro Título",
    description: "Venceu o primeiro torneio",
    icon: "🥇",
    category: "performance",
    hasProgress: false,
    tiers: [{ tier: "BRONZE", threshold: 1, label: "Desbloqueado" }],
  },
  champion: {
    name: "Campeão",
    description: "Títulos conquistados",
    icon: "👑",
    category: "performance",
    hasProgress: true,
    tiers: [
      { tier: "BRONZE", threshold: 1, label: "1 título" },
      { tier: "SILVER", threshold: 3, label: "3 títulos" },
      { tier: "GOLD", threshold: 5, label: "5 títulos" },
      { tier: "DIAMOND", threshold: 10, label: "10 títulos" },
    ],
  },
  finalist: {
    name: "Finalista",
    description: "Finais disputadas",
    icon: "🥈",
    category: "performance",
    hasProgress: true,
    tiers: [
      { tier: "BRONZE", threshold: 1, label: "1 final" },
      { tier: "SILVER", threshold: 3, label: "3 finais" },
      { tier: "GOLD", threshold: 5, label: "5 finais" },
    ],
  },
  podium_streak: {
    name: "Pódio em Série",
    description: "Maior sequência consecutiva de pódios",
    icon: "🔥",
    category: "performance",
    hasProgress: true,
    tiers: [
      { tier: "BRONZE", threshold: 2, label: "2 seguidos" },
      { tier: "SILVER", threshold: 3, label: "3 seguidos" },
      { tier: "GOLD", threshold: 5, label: "5 seguidos" },
    ],
  },
  undefeated_group: {
    name: "Fase Perfeita",
    description: "Passou da fase de grupos sem perder uma partida",
    icon: "⚡",
    category: "performance",
    hasProgress: false,
    tiers: [{ tier: "BRONZE", threshold: 1, label: "Desbloqueado" }],
  },
  loyal_partner: {
    name: "Parceiro Fiel",
    description: "Torneios com o mesmo parceiro",
    icon: "🤝",
    category: "social",
    hasProgress: true,
    tiers: [
      { tier: "BRONZE", threshold: 3, label: "3 torneios" },
      { tier: "SILVER", threshold: 5, label: "5 torneios" },
      { tier: "GOLD", threshold: 10, label: "10 torneios" },
    ],
  },
  explorer: {
    name: "Explorador",
    description: "Cidades diferentes com torneio disputado",
    icon: "🗺️",
    category: "social",
    hasProgress: true,
    tiers: [
      { tier: "BRONZE", threshold: 2, label: "2 cidades" },
      { tier: "SILVER", threshold: 3, label: "3 cidades" },
      { tier: "GOLD", threshold: 5, label: "5 cidades" },
    ],
  },
  versatile: {
    name: "Versátil",
    description: "Categorias diferentes disputadas",
    icon: "🎭",
    category: "social",
    hasProgress: true,
    tiers: [
      { tier: "BRONZE", threshold: 2, label: "2 categorias" },
      { tier: "SILVER", threshold: 3, label: "3 categorias" },
    ],
  },
  road_warrior: {
    name: "Nômade",
    description: "Clubes diferentes com torneio disputado",
    icon: "🚀",
    category: "social",
    hasProgress: true,
    tiers: [
      { tier: "BRONZE", threshold: 3, label: "3 clubes" },
      { tier: "SILVER", threshold: 5, label: "5 clubes" },
    ],
  },
  profile_complete: {
    name: "Perfil Completo",
    description: "Preencheu foto, cidade e telefone",
    icon: "✅",
    category: "plataforma",
    hasProgress: false,
    tiers: [{ tier: "BRONZE", threshold: 1, label: "Desbloqueado" }],
  },
  early_adopter: {
    name: "Pioneiro",
    description: "Um dos primeiros 500 atletas da plataforma",
    icon: "🌱",
    category: "plataforma",
    hasProgress: false,
    tiers: [{ tier: "BRONZE", threshold: 1, label: "Desbloqueado" }],
  },
  league_debut: {
    name: "Liga Estreante",
    description: "Participou do primeiro torneio de uma liga",
    icon: "🏅",
    category: "plataforma",
    hasProgress: false,
    tiers: [{ tier: "BRONZE", threshold: 1, label: "Desbloqueado" }],
  },
};

const tierOrder = ["BRONZE", "SILVER", "GOLD", "DIAMOND", "LEGEND"] as const;

// ─── GET /api/athlete/profile ─────────────────────────────────────────────────

athleteRoutes.get(
  "/profile",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId },
        include: { user: { select: { email: true } } },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });
      return res.json({ data: athlete });
    } catch (err) {
      next(err);
    }
  },
);

// ─── PATCH /api/athlete/profile ───────────────────────────────────────────────

athleteRoutes.patch(
  "/profile",
  requireAuth,
  async (req: AuthRequest, res, next) => {
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
  },
);

// ─── GET /api/athlete/tournaments ────────────────────────────────────────────

athleteRoutes.get(
  "/tournaments",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId },
        select: { id: true },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { email: true },
      });

      const teams = await prisma.team.findMany({
        where: {
          OR: [{ player1Email: user?.email }, { player2Email: user?.email }],
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
  },
);

// ─── GET /api/athlete/stats ───────────────────────────────────────────────────

athleteRoutes.get(
  "/stats",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId },
        select: { id: true },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });

      const { id: athleteId } = athlete;

      const trophies = await prisma.athleteTrophy.findMany({
        where: { athleteId },
        orderBy: { earnedAt: "desc" },
      });

      const rawAchievements = await prisma.athleteAchievement.findMany({
        where: { athleteId },
      });

      const achievementsAll = Object.entries(ACHIEVEMENT_META).map(
        ([key, meta]) => {
          const saved = rawAchievements.find((a) => a.key === key);
          const progress = saved?.progress ?? 0;
          const unlockedAt = saved?.unlockedAt ?? null;
          const currentTier = saved?.unlockedAt ? saved.tier : null;
          const nextTier = meta.tiers.find(
            (t) =>
              !currentTier ||
              tierOrder.indexOf(t.tier) > tierOrder.indexOf(currentTier),
          );
          return {
            key,
            name: meta.name,
            description: meta.description,
            icon: meta.icon,
            category: meta.category,
            hasProgress: meta.hasProgress,
            tiers: meta.tiers,
            currentTier,
            progress,
            unlockedAt,
            isUnlocked: !!unlockedAt,
            nextThreshold: nextTier?.threshold ?? null,
            nextTierLabel: nextTier?.label ?? null,
          };
        },
      );

      const achievements = {
        unlocked: achievementsAll.filter((a) => a.isUnlocked),
        inProgress: achievementsAll.filter(
          (a) => !a.isUnlocked && a.progress > 0,
        ),
        locked: achievementsAll.filter(
          (a) => !a.isUnlocked && a.progress === 0,
        ),
      };

      const leaguePointsRaw = await prisma.leaguePoints.findMany({
        where: { athleteId },
        include: { league: { select: { id: true, name: true, sport: true } } },
        orderBy: { earnedAt: "desc" },
      });

      const leagueMap = new Map<
        string,
        {
          league: { id: string; name: string; sport: string | null };
          totalPoints: number;
          entries: Array<{
            tournamentId: string;
            category: string;
            placement: string;
            points: number;
            earnedAt: Date;
          }>;
          rankPosition: number | null;
        }
      >();

      for (const lp of leaguePointsRaw) {
        const entry = {
          tournamentId: lp.tournamentId,
          category: lp.category,
          placement: lp.placement,
          points: lp.points,
          earnedAt: lp.earnedAt,
        };
        const existing = leagueMap.get(lp.leagueId);
        if (existing) {
          existing.totalPoints += lp.points;
          existing.entries.push(entry);
        } else {
          leagueMap.set(lp.leagueId, {
            league: lp.league as {
              id: string;
              name: string;
              sport: string | null;
            },
            totalPoints: lp.points,
            entries: [entry],
            rankPosition: null,
          });
        }
      }

      for (const [leagueId, data] of leagueMap.entries()) {
        const allAthletePoints = await prisma.leaguePoints.groupBy({
          by: ["athleteId"],
          where: { leagueId },
          _sum: { points: true },
        });
        data.rankPosition =
          allAthletePoints.filter(
            (row) => (row._sum.points ?? 0) > data.totalPoints,
          ).length + 1;
      }

      const leagueStandings = Array.from(leagueMap.values()).sort(
        (a, b) => (a.rankPosition ?? 999) - (b.rankPosition ?? 999),
      );

      return res.json({
        data: {
          trophies,
          achievements,
          leagueStandings,
          summary: {
            totalTrophies: trophies.length,
            totalTitles: trophies.filter((t) => t.placement === "CHAMPION")
              .length,
            totalAchievementsUnlocked: achievements.unlocked.length,
            totalAchievementsAvailable: Object.keys(ACHIEVEMENT_META).length,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Rotas públicas ───────────────────────────────────────────────────────────

export const publicAthleteRoutes = Router();

publicAthleteRoutes.get("/:id", async (req, res, next) => {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        fullName: true,
        nickname: true,
        city: true,
        state: true,
        avatarUrl: true,
        sports: true,
        racket: true,
        instagramUrl: true,
        twitterUrl: true,
        createdAt: true,
      },
    });
    if (!athlete)
      return res.status(404).json({ error: "Atleta não encontrado" });
    return res.json({ data: athlete });
  } catch (err) {
    next(err);
  }
});
