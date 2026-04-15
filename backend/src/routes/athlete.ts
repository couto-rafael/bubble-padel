import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";

export const athleteRoutes = Router();

// ─── Schemas de validação ─────────────────────────────────────────────────────

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  firstName: z.string().min(1).max(80).optional().nullable(),
  lastName: z.string().min(1).max(80).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  city: z.string().optional(),
  state: z.string().optional(),
  avatarUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  bio: z.string().max(300).optional().nullable(),
  gender: z
    .enum(["MASCULINO", "FEMININO", "NAO_INFORMAR"])
    .optional()
    .nullable(),
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
      // Deriva fullName automaticamente se firstName/lastName foram enviados
      const derivedFullName =
        data.firstName !== undefined || data.lastName !== undefined
          ? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || undefined
          : undefined;
      const athlete = await prisma.athlete.update({
        where: { userId: req.userId },
        data: {
          ...data,
          ...(derivedFullName && { fullName: derivedFullName }),
          ...(data.birthDate
            ? { birthDate: new Date(data.birthDate) }
            : data.birthDate === null
              ? { birthDate: null }
              : {}),
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

      // ── Match stats (vitórias/derrotas/parceiros/adversários) ──────────────
      const userRecord = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { email: true },
      });
      const userEmail = userRecord?.email ?? "";

      const myTeams = await prisma.team.findMany({
        where: {
          OR: [{ player1Email: userEmail }, { player2Email: userEmail }],
        },
        select: {
          id: true,
          category: true,
          tournamentId: true,
          player1Name: true,
          player1Email: true,
          player2Name: true,
          player2Email: true,
        },
      });

      const myTeamIds = myTeams.map((t) => t.id);

      // Group matches
      const groupMatches = await prisma.match.findMany({
        where: {
          OR: [{ team1Id: { in: myTeamIds } }, { team2Id: { in: myTeamIds } }],
          played: true,
        },
        select: { team1Id: true, team2Id: true, score1: true, score2: true },
      });

      // Playoff matches
      const playoffMatches = await prisma.playoffMatch.findMany({
        where: {
          OR: [{ team1Id: { in: myTeamIds } }, { team2Id: { in: myTeamIds } }],
          played: true,
        },
        select: {
          team1Id: true,
          team2Id: true,
          score1: true,
          score2: true,
          winnerId: true,
          isBye: true,
        },
      });

      // Build team map: id → partner name
      const teamMap = new Map(
        myTeams.map((t) => [
          t.id,
          {
            partner:
              t.player1Email === userEmail ? t.player2Name : t.player1Name,
            partnerEmail:
              t.player1Email === userEmail ? t.player2Email : t.player1Email,
            category: t.category,
          },
        ]),
      );

      // Count wins/losses per match type
      let wins = 0;
      let losses = 0;
      const partnerStats = new Map<
        string,
        { name: string; wins: number; losses: number }
      >();
      const opponentStats = new Map<
        string,
        { name: string; matches: number }
      >();
      const categoryStats = new Map<string, { wins: number; losses: number }>();

      const processMatch = (
        team1Id: string | null,
        team2Id: string | null,
        score1: number | null,
        score2: number | null,
        winnerId?: string | null,
      ) => {
        const isTeam1 = team1Id ? myTeamIds.includes(team1Id) : false;
        const isTeam2 = team2Id ? myTeamIds.includes(team2Id) : false;
        if (!isTeam1 && !isTeam2) return;

        const myTeamId = isTeam1 ? team1Id! : team2Id!;
        const oppTeamId = isTeam1 ? team2Id : team1Id;
        const myScore = isTeam1 ? (score1 ?? 0) : (score2 ?? 0);
        const oppScore = isTeam1 ? (score2 ?? 0) : (score1 ?? 0);

        const won = winnerId ? winnerId === myTeamId : myScore > oppScore;

        if (won) wins++;
        else losses++;

        // Partner stats
        const info = teamMap.get(myTeamId);
        if (info) {
          const p = partnerStats.get(info.partnerEmail) ?? {
            name: info.partner,
            wins: 0,
            losses: 0,
          };
          if (won) p.wins++;
          else p.losses++;
          partnerStats.set(info.partnerEmail, p);

          const cat = categoryStats.get(info.category) ?? {
            wins: 0,
            losses: 0,
          };
          if (won) cat.wins++;
          else cat.losses++;
          categoryStats.set(info.category, cat);
        }

        // Opponent stats
        if (oppTeamId) {
          const key = oppTeamId;
          const opp = opponentStats.get(key) ?? { name: oppTeamId, matches: 0 };
          opp.matches++;
          opponentStats.set(key, opp);
        }
      };

      for (const m of groupMatches) {
        processMatch(m.team1Id, m.team2Id, m.score1, m.score2);
      }
      for (const m of playoffMatches) {
        if ((m as any).isBye) continue;
        processMatch(m.team1Id, m.team2Id, m.score1, m.score2, m.winnerId);
      }

      const topPartners = Array.from(partnerStats.entries())
        .map(([email, s]) => ({
          name: s.name,
          wins: s.wins,
          losses: s.losses,
          total: s.wins + s.losses,
          winRate:
            s.wins + s.losses > 0
              ? Math.round((s.wins / (s.wins + s.losses)) * 100)
              : 0,
        }))
        .sort((a, b) => b.winRate - a.winRate || b.total - a.total)
        .slice(0, 5);

      const byCategory = Array.from(categoryStats.entries())
        .map(([cat, s]) => ({
          category: cat,
          wins: s.wins,
          losses: s.losses,
          total: s.wins + s.losses,
          winRate:
            s.wins + s.losses > 0
              ? Math.round((s.wins / (s.wins + s.losses)) * 100)
              : 0,
        }))
        .sort((a, b) => b.total - a.total);

      const totalMatches = wins + losses;
      const winRate =
        totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      const matchStats = {
        wins,
        losses,
        totalMatches,
        winRate,
        topPartners,
        byCategory,
      };

      return res.json({
        data: {
          trophies,
          achievements,
          leagueStandings,
          matchStats,
          summary: {
            totalTrophies: trophies.length,
            totalTitles: trophies.filter((t) => t.placement === "CHAMPION")
              .length,
            totalAchievementsUnlocked: achievements.unlocked.length,
            totalAchievementsAvailable: Object.keys(ACHIEVEMENT_META).length,
            wins,
            losses,
            winRate,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Ver perfil de outro atleta (autenticado) ────────────────────────────────

athleteRoutes.get(
  "/view/:id",
  requireAuth,
  async (req: AuthRequest, res, next) => {
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
          bannerUrl: true,
          bio: true,
          sports: true,
          rackets: true,
          instagramUrl: true,
          twitterUrl: true,
          createdAt: true,
          userId: true,
        },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });

      const user = await prisma.user.findUnique({
        where: { id: athlete.userId },
        select: { email: true },
      });
      if (!user)
        return res.status(404).json({ error: "Atleta não encontrado" });

      const athleteId = athlete.id;
      const userEmail = user.email;

      // ── Tournaments ──────────────────────────────────────────────────────────
      const teams = await prisma.team.findMany({
        where: {
          OR: [{ player1Email: userEmail }, { player2Email: userEmail }],
          status: "CONFIRMED",
        },
        select: {
          id: true,
          player1Name: true,
          player2Name: true,
          category: true,
          status: true,
          registrationDate: true,
          tournament: {
            select: {
              id: true,
              name: true,
              sport: true,
              status: true,
              startDate: true,
              endDate: true,
              club: { select: { name: true, city: true } },
            },
          },
        },
        orderBy: { registrationDate: "desc" },
        take: 50,
      });

      // ── Trophies ─────────────────────────────────────────────────────────────
      const trophies = await prisma.athleteTrophy.findMany({
        where: { athleteId },
        orderBy: { earnedAt: "desc" },
      });

      // ── Achievements ─────────────────────────────────────────────────────────
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

      // ── League standings ─────────────────────────────────────────────────────
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

      // ── Match stats ──────────────────────────────────────────────────────────
      const myTeams = await prisma.team.findMany({
        where: {
          OR: [{ player1Email: userEmail }, { player2Email: userEmail }],
        },
        select: {
          id: true,
          category: true,
          tournamentId: true,
          player1Name: true,
          player1Email: true,
          player2Name: true,
          player2Email: true,
        },
      });

      const myTeamIds = myTeams.map((t) => t.id);

      const groupMatches = await prisma.match.findMany({
        where: {
          OR: [{ team1Id: { in: myTeamIds } }, { team2Id: { in: myTeamIds } }],
          played: true,
        },
        select: { team1Id: true, team2Id: true, score1: true, score2: true },
      });

      const playoffMatches = await prisma.playoffMatch.findMany({
        where: {
          OR: [{ team1Id: { in: myTeamIds } }, { team2Id: { in: myTeamIds } }],
          played: true,
        },
        select: {
          team1Id: true,
          team2Id: true,
          score1: true,
          score2: true,
          winnerId: true,
          isBye: true,
        },
      });

      const teamMap = new Map(
        myTeams.map((t) => [
          t.id,
          {
            partner:
              t.player1Email === userEmail ? t.player2Name : t.player1Name,
            partnerEmail:
              t.player1Email === userEmail ? t.player2Email : t.player1Email,
            category: t.category,
          },
        ]),
      );

      let wins = 0;
      let losses = 0;
      const partnerStats = new Map<
        string,
        { name: string; wins: number; losses: number }
      >();
      const categoryStats = new Map<string, { wins: number; losses: number }>();

      const processMatch = (
        team1Id: string | null,
        team2Id: string | null,
        score1: number | null,
        score2: number | null,
        winnerId?: string | null,
      ) => {
        const isTeam1 = team1Id ? myTeamIds.includes(team1Id) : false;
        const isTeam2 = team2Id ? myTeamIds.includes(team2Id) : false;
        if (!isTeam1 && !isTeam2) return;
        const myTeamId = isTeam1 ? team1Id! : team2Id!;
        const myScore = isTeam1 ? (score1 ?? 0) : (score2 ?? 0);
        const oppScore = isTeam1 ? (score2 ?? 0) : (score1 ?? 0);
        const won = winnerId ? winnerId === myTeamId : myScore > oppScore;
        if (won) wins++;
        else losses++;
        const info = teamMap.get(myTeamId);
        if (info) {
          const p = partnerStats.get(info.partnerEmail) ?? {
            name: info.partner,
            wins: 0,
            losses: 0,
          };
          if (won) p.wins++;
          else p.losses++;
          partnerStats.set(info.partnerEmail, p);
          const cat = categoryStats.get(info.category) ?? {
            wins: 0,
            losses: 0,
          };
          if (won) cat.wins++;
          else cat.losses++;
          categoryStats.set(info.category, cat);
        }
      };

      for (const m of groupMatches) {
        processMatch(m.team1Id, m.team2Id, m.score1, m.score2);
      }
      for (const m of playoffMatches) {
        if ((m as any).isBye) continue;
        processMatch(m.team1Id, m.team2Id, m.score1, m.score2, m.winnerId);
      }

      const topPartners = Array.from(partnerStats.entries())
        .map(([, s]) => ({
          name: s.name,
          wins: s.wins,
          losses: s.losses,
          total: s.wins + s.losses,
          winRate:
            s.wins + s.losses > 0
              ? Math.round((s.wins / (s.wins + s.losses)) * 100)
              : 0,
        }))
        .sort((a, b) => b.winRate - a.winRate || b.total - a.total)
        .slice(0, 5);

      const byCategory = Array.from(categoryStats.entries())
        .map(([cat, s]) => ({
          category: cat,
          wins: s.wins,
          losses: s.losses,
          total: s.wins + s.losses,
          winRate:
            s.wins + s.losses > 0
              ? Math.round((s.wins / (s.wins + s.losses)) * 100)
              : 0,
        }))
        .sort((a, b) => b.total - a.total);

      const totalMatches = wins + losses;
      const winRate =
        totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
      const matchStats = {
        wins,
        losses,
        totalMatches,
        winRate,
        topPartners,
        byCategory,
      };

      return res.json({
        data: {
          id: athlete.id,
          fullName: athlete.fullName,
          nickname: athlete.nickname,
          city: athlete.city,
          state: athlete.state,
          avatarUrl: athlete.avatarUrl,
          bannerUrl: athlete.bannerUrl,
          sports: athlete.sports,
          rackets: athlete.rackets,
          instagramUrl: athlete.instagramUrl,
          twitterUrl: athlete.twitterUrl,
          createdAt: athlete.createdAt,
          tournaments: teams,
          trophies,
          achievements,
          leagueStandings,
          matchStats,
          sponsors: await prisma.athleteSponsor.findMany({
            where: { athleteId },
            select: { id: true, name: true, logoUrl: true, websiteUrl: true },
            orderBy: { createdAt: "asc" },
          }),
          summary: {
            totalTrophies: trophies.length,
            totalTitles: trophies.filter((t) => t.placement === "CHAMPION")
              .length,
            totalAchievementsUnlocked: achievements.unlocked.length,
            totalAchievementsAvailable: Object.keys(ACHIEVEMENT_META).length,
            wins,
            losses,
            winRate,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Sponsors ────────────────────────────────────────────────────────────────

const sponsorSchema = z.object({
  name: z.string().min(1).max(80),
  logoUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
});

athleteRoutes.get(
  "/sponsors",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId! },
        select: { id: true },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });

      const sponsors = await prisma.athleteSponsor.findMany({
        where: { athleteId: athlete.id },
        orderBy: { createdAt: "asc" },
      });
      return res.json({ data: sponsors });
    } catch (err) {
      next(err);
    }
  },
);

athleteRoutes.post(
  "/sponsors",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const body = sponsorSchema.safeParse(req.body);
      if (!body.success)
        return res.status(400).json({ error: body.error.flatten() });

      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId! },
        select: { id: true },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });

      const count = await prisma.athleteSponsor.count({
        where: { athleteId: athlete.id },
      });
      if (count >= 10)
        return res.status(400).json({ error: "Máximo de 10 patrocinadores." });

      const sponsor = await prisma.athleteSponsor.create({
        data: {
          athleteId: athlete.id,
          name: body.data.name,
          logoUrl: body.data.logoUrl ?? null,
          websiteUrl: body.data.websiteUrl ?? null,
        },
      });
      return res.status(201).json({ data: sponsor });
    } catch (err) {
      next(err);
    }
  },
);

athleteRoutes.delete(
  "/sponsors/:id",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId! },
        select: { id: true },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });

      const sponsor = await prisma.athleteSponsor.findFirst({
        where: { id: req.params.id, athleteId: athlete.id },
      });
      if (!sponsor)
        return res.status(404).json({ error: "Patrocinador não encontrado" });

      await prisma.athleteSponsor.delete({ where: { id: sponsor.id } });
      return res.status(204).send();
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
        rackets: true,
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
