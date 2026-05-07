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

      // Group matches — apenas torneios COMPLETED
      const groupMatches = await prisma.match.findMany({
        where: {
          OR: [{ team1Id: { in: myTeamIds } }, { team2Id: { in: myTeamIds } }],
          played: true,
          group: { tournament: { status: "COMPLETED" } },
        },
        select: { team1Id: true, team2Id: true, score1: true, score2: true },
      });

      // Playoff matches — apenas torneios COMPLETED
      const playoffMatches = await prisma.playoffMatch.findMany({
        where: {
          OR: [{ team1Id: { in: myTeamIds } }, { team2Id: { in: myTeamIds } }],
          played: true,
          bracket: { tournament: { status: "COMPLETED" } },
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
      let setsWon = 0;
      let setsLost = 0;
      const partnerStats = new Map<
        string,
        { name: string; wins: number; losses: number }
      >();
      const opponentStats = new Map<
        string,
        { wins: number; losses: number }
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

        setsWon += myScore;
        setsLost += oppScore;

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
          const opp = opponentStats.get(oppTeamId) ?? { wins: 0, losses: 0 };
          if (won) opp.wins++;
          else opp.losses++;
          opponentStats.set(oppTeamId, opp);
        }
      };

      for (const m of groupMatches) {
        processMatch(m.team1Id, m.team2Id, m.score1, m.score2);
      }
      for (const m of playoffMatches) {
        if ((m as any).isBye) continue;
        processMatch(m.team1Id, m.team2Id, m.score1, m.score2, m.winnerId);
      }

      const totalMatches = wins + losses;
      const winRate =
        totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      // ── Legacy matchStats (backward compat) ─────────────────────────────────
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

      const byCategoryArray = Array.from(categoryStats.entries())
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

      const matchStats = {
        wins,
        losses,
        totalMatches,
        winRate,
        topPartners,
        byCategory: byCategoryArray,
      };

      // ── Enriched stats (8.S1) ────────────────────────────────────────────────
      // Batch-resolve partner and opponent emails → athlete records
      const partnerEmails = Array.from(partnerStats.keys());
      const oppTeamIds = Array.from(opponentStats.keys());

      const [partnerAthleteRecords, oppTeamRecords] = await Promise.all([
        partnerEmails.length > 0
          ? prisma.athlete.findMany({
              where: { user: { email: { in: partnerEmails } } },
              select: { id: true, avatarUrl: true, user: { select: { email: true } } },
            })
          : [],
        oppTeamIds.length > 0
          ? prisma.team.findMany({
              where: { id: { in: oppTeamIds } },
              select: {
                id: true,
                player1Name: true,
                player1Email: true,
                player2Name: true,
                player2Email: true,
              },
            })
          : [],
      ]);

      const emailToAthlete = new Map(
        (partnerAthleteRecords as any[]).map((a: any) => [
          a.user.email,
          { id: a.id, avatarUrl: a.avatarUrl as string | null },
        ]),
      );

      // Resolve opponent player1 email → athlete
      const oppPlayer1Emails = (oppTeamRecords as any[]).map(
        (t: any) => t.player1Email as string,
      );
      const oppAthleteRecords =
        oppPlayer1Emails.length > 0
          ? await prisma.athlete.findMany({
              where: { user: { email: { in: oppPlayer1Emails } } },
              select: { id: true, avatarUrl: true, user: { select: { email: true } } },
            })
          : [];
      const oppEmailToAthlete = new Map(
        (oppAthleteRecords as any[]).map((a: any) => [
          a.user.email,
          { id: a.id, avatarUrl: a.avatarUrl as string | null },
        ]),
      );

      const bestPartners = Array.from(partnerStats.entries())
        .map(([email, s]) => {
          const matchesTogether = s.wins + s.losses;
          const athleteInfo = emailToAthlete.get(email);
          return {
            athleteId: athleteInfo?.id ?? null,
            name: s.name,
            avatar: athleteInfo?.avatarUrl ?? null,
            matchesTogether,
            winRate:
              matchesTogether > 0
                ? Math.round((s.wins / matchesTogether) * 1000) / 10
                : 0,
          };
        })
        .filter((p) => p.matchesTogether >= 3)
        .sort((a, b) => b.winRate - a.winRate || b.matchesTogether - a.matchesTogether)
        .slice(0, 5);

      const frequentOpponents = (oppTeamRecords as any[])
        .map((team: any) => {
          const h = opponentStats.get(team.id)!;
          const total = h.wins + h.losses;
          const athleteInfo = oppEmailToAthlete.get(team.player1Email);
          return {
            athleteId: athleteInfo?.id ?? null,
            name: `${team.player1Name} / ${team.player2Name}`,
            avatar: athleteInfo?.avatarUrl ?? null,
            headToHead: {
              wins: h.wins,
              losses: h.losses,
              totalMatches: total,
            },
          };
        })
        .sort((a, b) => b.headToHead.totalMatches - a.headToHead.totalMatches)
        .slice(0, 5);

      const byCategoryRecord: Record<
        string,
        { matches: number; wins: number; winRate: number }
      > = {};
      for (const [cat, s] of categoryStats.entries()) {
        const total = s.wins + s.losses;
        byCategoryRecord[cat] = {
          matches: total,
          wins: s.wins,
          winRate:
            total > 0 ? Math.round((s.wins / total) * 1000) / 10 : 0,
        };
      }

      const enrichedStats = {
        totalMatches,
        wins,
        losses,
        winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 1000) / 10 : null,
        setsWon,
        setsLost,
        bestPartners,
        frequentOpponents,
        byCategory: byCategoryRecord,
      };

      return res.json({
        data: {
          trophies,
          achievements,
          leagueStandings,
          matchStats,
          enrichedStats,
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
          connectionCount: await prisma.athleteFriendship.count({
            where: {
              status: "ACCEPTED",
              OR: [{ senderId: athleteId }, { receiverId: athleteId }],
            },
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

import { signParams, destroyAsset } from "../lib/cloudinary";

const SPONSOR_LIMIT = 6;

const sponsorSchema = z.object({
  name: z.string().min(1).max(80),
  logoUrl: z.string().url().optional().nullable(),
  publicId: z.string().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
});

const reorderSchema = z.object({
  ids: z.array(z.string()),
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
        orderBy: { order: "asc" },
        select: { id: true, name: true, logoUrl: true, publicId: true, websiteUrl: true, order: true },
      });
      return res.json({ data: sponsors });
    } catch (err) {
      next(err);
    }
  },
);

// Assinar upload para o Cloudinary — validar limite ANTES de assinar
athleteRoutes.post(
  "/sponsors/sign",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId! },
        select: { id: true },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });

      const count = await prisma.athleteSponsor.count({
        where: { athleteId: athlete.id },
      });
      if (count >= SPONSOR_LIMIT)
        return res.status(400).json({ error: `Limite de ${SPONSOR_LIMIT} patrocinadores atingido.` });

      const folder = `bubble/sponsors/${athlete.id}`;
      const params = signParams(folder);
      return res.json({ data: params });
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
      if (count >= SPONSOR_LIMIT)
        return res.status(400).json({ error: `Limite de ${SPONSOR_LIMIT} patrocinadores atingido.` });

      const sponsor = await prisma.athleteSponsor.create({
        data: {
          athleteId: athlete.id,
          name: body.data.name,
          logoUrl: body.data.logoUrl ?? null,
          publicId: body.data.publicId ?? null,
          websiteUrl: body.data.websiteUrl ?? null,
          order: count,
        },
      });
      return res.status(201).json({ data: sponsor });
    } catch (err) {
      next(err);
    }
  },
);

athleteRoutes.patch(
  "/sponsors/reorder",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const body = reorderSchema.safeParse(req.body);
      if (!body.success)
        return res.status(400).json({ error: body.error.flatten() });

      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId! },
        select: { id: true },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });

      await Promise.all(
        body.data.ids.map((id, index) =>
          prisma.athleteSponsor.updateMany({
            where: { id, athleteId: athlete.id },
            data: { order: index },
          }),
        ),
      );

      return res.json({ data: { ok: true } });
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

      if (sponsor.publicId) {
        destroyAsset(sponsor.publicId).catch((e) =>
          console.error("[Cloudinary] destroy failed:", e),
        );
      }

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ─── Settings defaults ───────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  profileVisibility: "PUBLIC",
  matchHistoryVisibility: "PUBLIC",
  statsVisibility: "PUBLIC",
  searchable: true,
  email_registrationConfirmed: true,
  email_tournamentReminder: true,
  email_resultsPublished: true,
  email_newFollower: false,
  email_newMessage: false,
  email_nearbyTournaments: false,
  email_weeklySummary: false,
  app_registrationConfirmed: true,
  app_tournamentReminder: true,
  app_resultsPublished: true,
  app_newFollower: true,
  app_newMessage: true,
  app_nearbyTournaments: false,
  app_weeklySummary: false,
};

const settingsSchema = z.object({
  profileVisibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).optional(),
  matchHistoryVisibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).optional(),
  statsVisibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).optional(),
  searchable: z.boolean().optional(),
  email_registrationConfirmed: z.boolean().optional(),
  email_tournamentReminder: z.boolean().optional(),
  email_resultsPublished: z.boolean().optional(),
  email_newFollower: z.boolean().optional(),
  email_newMessage: z.boolean().optional(),
  email_nearbyTournaments: z.boolean().optional(),
  email_weeklySummary: z.boolean().optional(),
  app_registrationConfirmed: z.boolean().optional(),
  app_tournamentReminder: z.boolean().optional(),
  app_resultsPublished: z.boolean().optional(),
  app_newFollower: z.boolean().optional(),
  app_newMessage: z.boolean().optional(),
  app_nearbyTournaments: z.boolean().optional(),
  app_weeklySummary: z.boolean().optional(),
});

// ─── GET /api/athlete/settings ────────────────────────────────────────────────

athleteRoutes.get(
  "/settings",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId },
        select: { settings: true },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });

      const merged = { ...DEFAULT_SETTINGS, ...(athlete.settings as object ?? {}) };
      return res.json({ data: merged });
    } catch (err) {
      next(err);
    }
  },
);

// ─── PATCH /api/athlete/settings ─────────────────────────────────────────────

athleteRoutes.patch(
  "/settings",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const parsed = settingsSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });

      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId },
        select: { settings: true },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });

      const current = { ...DEFAULT_SETTINGS, ...(athlete.settings as object ?? {}) };
      const updated = { ...current, ...parsed.data };

      await (prisma.athlete as any).update({
        where: { userId: req.userId },
        data: { settings: updated },
      });

      return res.json({ data: updated });
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
        bannerUrl: true,
        bio: true,
        sports: true,
        rackets: true,
        instagramUrl: true,
        twitterUrl: true,
        createdAt: true,
        settings: true,
        trophies: {
          where: { placement: { in: ["CHAMPION", "RUNNER_UP"] } },
          orderBy: { earnedAt: "desc" },
          select: {
            tournamentId: true,
            tournamentName: true,
            category: true,
            placement: true,
            earnedAt: true,
          },
        },
        user: { select: { email: true } },
        sponsors: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, logoUrl: true, websiteUrl: true },
        },
      },
    });

    if (!athlete)
      return res.status(404).json({ error: "Atleta não encontrado" });

    const settings = {
      ...DEFAULT_SETTINGS,
      ...((athlete.settings as object) ?? {}),
    } as typeof DEFAULT_SETTINGS;

    // Privacy gate
    if (settings.profileVisibility === "PRIVATE")
      return res.status(404).json({ error: "Atleta não encontrado" });

    if (settings.profileVisibility === "FOLLOWERS") {
      return res.json({
        data: {
          id: athlete.id,
          fullName: athlete.fullName,
          nickname: athlete.nickname,
          avatarUrl: athlete.avatarUrl,
          sports: athlete.sports,
          isFollowersOnly: true,
        },
      });
    }

    // Stats summary (PUBLIC only)
    let stats: { totalMatches: number; wins: number; winRate: number | null } | null = null;
    if (settings.statsVisibility === "PUBLIC") {
      const userEmail = athlete.user.email;
      const myTeams = await prisma.team.findMany({
        where: { OR: [{ player1Email: userEmail }, { player2Email: userEmail }] },
        select: { id: true },
      });
      const myTeamIds = myTeams.map((t) => t.id);

      if (myTeamIds.length > 0) {
        const [gMatches, pMatches] = await Promise.all([
          prisma.match.findMany({
            where: {
              OR: [{ team1Id: { in: myTeamIds } }, { team2Id: { in: myTeamIds } }],
              played: true,
              group: { tournament: { status: "COMPLETED" } },
            },
            select: { team1Id: true, team2Id: true, score1: true, score2: true },
          }),
          prisma.playoffMatch.findMany({
            where: {
              OR: [{ team1Id: { in: myTeamIds } }, { team2Id: { in: myTeamIds } }],
              played: true,
              isBye: false,
              bracket: { tournament: { status: "COMPLETED" } },
            },
            select: { team1Id: true, team2Id: true, score1: true, score2: true, winnerId: true },
          }),
        ]);

        let wins = 0;
        let losses = 0;
        const countMatch = (
          t1: string | null,
          t2: string | null,
          s1: number | null,
          s2: number | null,
          winnerId?: string | null,
        ) => {
          const isT1 = t1 ? myTeamIds.includes(t1) : false;
          const isT2 = t2 ? myTeamIds.includes(t2) : false;
          if (!isT1 && !isT2) return;
          const myId = isT1 ? t1! : t2!;
          const myScore = isT1 ? (s1 ?? 0) : (s2 ?? 0);
          const oppScore = isT1 ? (s2 ?? 0) : (s1 ?? 0);
          const won = winnerId ? winnerId === myId : myScore > oppScore;
          if (won) wins++;
          else losses++;
        };
        for (const m of gMatches) countMatch(m.team1Id, m.team2Id, m.score1, m.score2);
        for (const m of pMatches) countMatch(m.team1Id, m.team2Id, m.score1, m.score2, m.winnerId);

        const total = wins + losses;
        stats = {
          totalMatches: total,
          wins,
          winRate: total > 0 ? Math.round((wins / total) * 1000) / 10 : null,
        };
      }
    }

    const trophies =
      settings.matchHistoryVisibility === "PUBLIC"
        ? athlete.trophies.map((t) => ({
            tournamentId: t.tournamentId,
            tournamentName: t.tournamentName,
            category: t.category,
            position: t.placement === "CHAMPION" ? 1 : 2,
            date: t.earnedAt.toISOString(),
          }))
        : [];

    return res.json({
      data: {
        id: athlete.id,
        fullName: athlete.fullName,
        nickname: athlete.nickname,
        city: athlete.city,
        state: athlete.state,
        avatarUrl: athlete.avatarUrl,
        bannerUrl: athlete.bannerUrl,
        bio: athlete.bio,
        sports: athlete.sports,
        rackets: athlete.rackets,
        instagramUrl: athlete.instagramUrl,
        twitterUrl: athlete.twitterUrl,
        createdAt: athlete.createdAt.toISOString(),
        trophies,
        stats,
        sponsors: athlete.sponsors.map((s) => ({
          id: s.id,
          name: s.name,
          logoUrl: s.logoUrl,
          websiteUrl: s.websiteUrl,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});
