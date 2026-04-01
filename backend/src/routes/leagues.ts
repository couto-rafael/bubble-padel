import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";

export const leagueRoutes = Router();

// ─── Schemas de validação ────────────────────────────────────────────────────

const createLeagueSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  description: z.string().optional().default(""),
  sport: z
    .enum(["PADEL", "BEACH_TENNIS", "TENIS", "PICKLEBALL"])
    .optional()
    .nullable(),
  pointsChampion: z.number().int().min(0).default(100),
  pointsRunnerUp: z.number().int().min(0).default(70),
  pointsSemi: z.number().int().min(0).default(45),
  pointsQuarter: z.number().int().min(0).default(25),
  pointsGroup: z.number().int().min(0).default(10),
});

const updateLeagueSchema = createLeagueSchema.partial();

const linkTournamentSchema = z.object({
  tournamentId: z.string().min(1),
  // Overrides opcionais — null = usa padrão da liga
  pointsChampion: z.number().int().min(0).nullable().optional(),
  pointsRunnerUp: z.number().int().min(0).nullable().optional(),
  pointsSemi: z.number().int().min(0).nullable().optional(),
  pointsQuarter: z.number().int().min(0).nullable().optional(),
  pointsGroup: z.number().int().min(0).nullable().optional(),
});

const updateLinkSchema = z.object({
  pointsChampion: z.number().int().min(0).nullable().optional(),
  pointsRunnerUp: z.number().int().min(0).nullable().optional(),
  pointsSemi: z.number().int().min(0).nullable().optional(),
  pointsQuarter: z.number().int().min(0).nullable().optional(),
  pointsGroup: z.number().int().min(0).nullable().optional(),
});

// ─── Helper: resolve o clubId a partir do userId logado ──────────────────────

async function getClubId(userId: string): Promise<string | null> {
  const club = await prisma.club.findUnique({
    where: { userId },
    select: { id: true },
  });
  return club?.id ?? null;
}

// ─── Helper: verifica se clube é membro ativo da liga ────────────────────────

async function isActiveMember(
  leagueId: string,
  clubId: string,
): Promise<boolean> {
  // O criador também é membro implícito — checar na tabela League
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: { createdByClubId: true },
  });
  if (league?.createdByClubId === clubId) return true;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_clubId: { leagueId, clubId } },
    select: { status: true },
  });
  return member?.status === "ACTIVE";
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/leagues — criar liga
// ─────────────────────────────────────────────────────────────────────────────

leagueRoutes.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const clubId = await getClubId(req.userId!);
    if (!clubId)
      return res
        .status(403)
        .json({ error: "Apenas clubes podem criar ligas." });

    const data = createLeagueSchema.parse(req.body);

    const league = await prisma.league.create({
      data: {
        ...data,
        sport: data.sport ?? null,
        createdByClubId: clubId,
      },
    });

    return res.status(201).json({ data: league });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leagues — ligar ligas do clube logado (criadas + membro)
// ─────────────────────────────────────────────────────────────────────────────

leagueRoutes.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const clubId = await getClubId(req.userId!);
    if (!clubId)
      return res.status(403).json({ error: "Apenas clubes podem ver ligas." });

    const [created, memberships] = await Promise.all([
      // Ligas criadas pelo clube
      prisma.league.findMany({
        where: { createdByClubId: clubId },
        include: {
          _count: { select: { members: true, tournaments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Ligas onde é membro ativo (mas não criador)
      prisma.leagueMember.findMany({
        where: { clubId, status: "ACTIVE" },
        include: {
          league: {
            include: {
              _count: { select: { members: true, tournaments: true } },
            },
          },
        },
      }),
    ]);

    // Ligas com convites pendentes
    const invites = await prisma.leagueMember.findMany({
      where: { clubId, status: "INVITED" },
      include: {
        league: {
          include: {
            createdByClub: { select: { name: true } },
            _count: { select: { members: true, tournaments: true } },
          },
        },
      },
    });

    return res.json({
      data: {
        created,
        member: memberships.map((m) => m.league),
        invites: invites.map((i) => ({
          memberId: i.id,
          ...i.league,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leagues/:id — detalhe da liga
// ─────────────────────────────────────────────────────────────────────────────

leagueRoutes.get("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const clubId = await getClubId(req.userId!);
    if (!clubId)
      return res.status(403).json({ error: "Apenas clubes podem ver ligas." });

    const league = await prisma.league.findUnique({
      where: { id: req.params.id },
      include: {
        createdByClub: { select: { id: true, name: true, city: true } },
        members: {
          include: {
            club: { select: { id: true, name: true, city: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        tournaments: {
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
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!league) return res.status(404).json({ error: "Liga não encontrada." });

    // Verifica acesso: só membros ativos ou criador podem ver
    const hasAccess =
      league.createdByClubId === clubId ||
      league.members.some(
        (m) => m.clubId === clubId && m.status === "ACTIVE",
      ) ||
      league.members.some((m) => m.clubId === clubId && m.status === "INVITED");

    if (!hasAccess)
      return res.status(403).json({ error: "Acesso negado a esta liga." });

    return res.json({ data: league });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/leagues/:id — atualizar liga (só criador)
// ─────────────────────────────────────────────────────────────────────────────

leagueRoutes.patch("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const clubId = await getClubId(req.userId!);
    if (!clubId)
      return res
        .status(403)
        .json({ error: "Apenas clubes podem editar ligas." });

    const league = await prisma.league.findUnique({
      where: { id: req.params.id },
      select: { createdByClubId: true },
    });
    if (!league) return res.status(404).json({ error: "Liga não encontrada." });
    if (league.createdByClubId !== clubId)
      return res
        .status(403)
        .json({ error: "Apenas o criador pode editar a liga." });

    const data = updateLeagueSchema.parse(req.body);
    const updated = await prisma.league.update({
      where: { id: req.params.id },
      data,
    });
    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/leagues/:id/invite — convidar clube por email ou clubId
// ─────────────────────────────────────────────────────────────────────────────

leagueRoutes.post(
  "/:id/invite",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const creatorClubId = await getClubId(req.userId!);
      if (!creatorClubId)
        return res.status(403).json({ error: "Apenas clubes podem convidar." });

      const league = await prisma.league.findUnique({
        where: { id: req.params.id },
        select: { id: true, createdByClubId: true, name: true },
      });
      if (!league)
        return res.status(404).json({ error: "Liga não encontrada." });
      if (league.createdByClubId !== creatorClubId)
        return res
          .status(403)
          .json({ error: "Apenas o criador pode convidar clubes." });

      // Aceita clubId direto ou email do clube
      const { clubId, email } = req.body as {
        clubId?: string;
        email?: string;
      };

      let targetClubId = clubId;

      if (!targetClubId && email) {
        const user = await prisma.user.findUnique({
          where: { email },
          include: { club: { select: { id: true } } },
        });
        if (!user?.club)
          return res
            .status(404)
            .json({ error: "Clube com esse email não encontrado." });
        targetClubId = user.club.id;
      }

      if (!targetClubId)
        return res
          .status(400)
          .json({ error: "Informe clubId ou email do clube." });

      if (targetClubId === creatorClubId)
        return res.status(400).json({ error: "Você já é membro desta liga." });

      // Upsert — se já foi convidado, não duplica
      const member = await prisma.leagueMember.upsert({
        where: {
          leagueId_clubId: { leagueId: league.id, clubId: targetClubId },
        },
        create: {
          leagueId: league.id,
          clubId: targetClubId,
          status: "INVITED",
        },
        update: {}, // não sobrescreve se já ACTIVE
      });

      return res.status(201).json({ data: member });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/leagues/:id/members/:clubId — aceitar ou recusar convite
// ─────────────────────────────────────────────────────────────────────────────

leagueRoutes.patch(
  "/:id/members/:clubId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const myClubId = await getClubId(req.userId!);
      if (!myClubId)
        return res
          .status(403)
          .json({ error: "Apenas clubes podem aceitar convites." });

      if (myClubId !== req.params.clubId)
        return res
          .status(403)
          .json({ error: "Você só pode responder seus próprios convites." });

      const { action } = req.body as { action: "accept" | "decline" };
      if (!["accept", "decline"].includes(action))
        return res
          .status(400)
          .json({ error: "action deve ser 'accept' ou 'decline'." });

      const member = await prisma.leagueMember.findUnique({
        where: {
          leagueId_clubId: {
            leagueId: req.params.id,
            clubId: myClubId,
          },
        },
      });

      if (!member)
        return res.status(404).json({ error: "Convite não encontrado." });
      if (member.status === "ACTIVE")
        return res.status(400).json({ error: "Você já é membro desta liga." });

      if (action === "decline") {
        await prisma.leagueMember.delete({
          where: { id: member.id },
        });
        return res.json({ data: { accepted: false } });
      }

      const updated = await prisma.leagueMember.update({
        where: { id: member.id },
        data: { status: "ACTIVE", joinedAt: new Date() },
      });

      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/leagues/:id/tournaments — vincular torneio à liga
// ─────────────────────────────────────────────────────────────────────────────

leagueRoutes.post(
  "/:id/tournaments",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const clubId = await getClubId(req.userId!);
      if (!clubId)
        return res
          .status(403)
          .json({ error: "Apenas clubes podem vincular torneios." });

      // Só membros ativos da liga podem vincular torneios
      const active = await isActiveMember(req.params.id, clubId);
      if (!active)
        return res
          .status(403)
          .json({
            error: "Apenas membros ativos da liga podem vincular torneios.",
          });

      const { tournamentId, ...pointsOverride } = linkTournamentSchema.parse(
        req.body,
      );

      // Torneio deve pertencer ao clube logado
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { clubId: true, status: true },
      });
      if (!tournament)
        return res.status(404).json({ error: "Torneio não encontrado." });
      if (tournament.clubId !== clubId)
        return res
          .status(403)
          .json({ error: "Este torneio não pertence ao seu clube." });
      if (
        ["OPEN", "CLOSED", "ONGOING", "COMPLETED"].includes(tournament.status)
      )
        return res
          .status(400)
          .json({
            error:
              "Torneio já está aberto — não é possível vincular a uma liga.",
          });

      // Torneio já vinculado?
      const existing = await prisma.leagueTournament.findUnique({
        where: { tournamentId },
      });
      if (existing)
        return res
          .status(400)
          .json({ error: "Este torneio já está vinculado a uma liga." });

      const link = await prisma.leagueTournament.create({
        data: {
          leagueId: req.params.id,
          tournamentId,
          pointsChampion: pointsOverride.pointsChampion ?? null,
          pointsRunnerUp: pointsOverride.pointsRunnerUp ?? null,
          pointsSemi: pointsOverride.pointsSemi ?? null,
          pointsQuarter: pointsOverride.pointsQuarter ?? null,
          pointsGroup: pointsOverride.pointsGroup ?? null,
        },
        include: {
          league: { select: { name: true } },
          tournament: { select: { name: true, status: true } },
        },
      });

      return res.status(201).json({ data: link });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/leagues/:id/tournaments/:tournamentId — atualizar override de pontos
// ─────────────────────────────────────────────────────────────────────────────

leagueRoutes.patch(
  "/:id/tournaments/:tournamentId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const clubId = await getClubId(req.userId!);
      if (!clubId)
        return res
          .status(403)
          .json({ error: "Apenas clubes podem editar vínculos." });

      // Só o dono do torneio pode editar o override
      const tournament = await prisma.tournament.findUnique({
        where: { id: req.params.tournamentId },
        select: { clubId: true, status: true },
      });
      if (!tournament)
        return res.status(404).json({ error: "Torneio não encontrado." });
      if (tournament.clubId !== clubId)
        return res.status(403).json({ error: "Sem permissão." });
      if (
        ["OPEN", "CLOSED", "ONGOING", "COMPLETED"].includes(tournament.status)
      )
        return res
          .status(400)
          .json({
            error: "Torneio já está aberto — pontos não podem ser alterados.",
          });

      const data = updateLinkSchema.parse(req.body);
      const link = await prisma.leagueTournament.update({
        where: { tournamentId: req.params.tournamentId },
        data,
      });
      return res.json({ data: link });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/leagues/:id/tournaments/:tournamentId — desvincular torneio
// ─────────────────────────────────────────────────────────────────────────────

leagueRoutes.delete(
  "/:id/tournaments/:tournamentId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const clubId = await getClubId(req.userId!);
      if (!clubId)
        return res
          .status(403)
          .json({ error: "Apenas clubes podem desvincular torneios." });

      const tournament = await prisma.tournament.findUnique({
        where: { id: req.params.tournamentId },
        select: { clubId: true, status: true },
      });
      if (!tournament)
        return res.status(404).json({ error: "Torneio não encontrado." });
      if (tournament.clubId !== clubId)
        return res.status(403).json({ error: "Sem permissão." });
      if (
        ["OPEN", "CLOSED", "ONGOING", "COMPLETED"].includes(tournament.status)
      )
        return res
          .status(400)
          .json({ error: "Torneio já aberto — não pode ser desvinculado." });

      await prisma.leagueTournament.delete({
        where: { tournamentId: req.params.tournamentId },
      });
      return res.json({ data: { unlinked: true } });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leagues/:id/ranking — ranking de atletas por liga
// ─────────────────────────────────────────────────────────────────────────────

leagueRoutes.get(
  "/:id/ranking",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      // Ranking é público para membros da liga — verificar acesso
      const clubId = await getClubId(req.userId!);
      if (!clubId)
        return res
          .status(403)
          .json({ error: "Apenas clubes podem ver rankings." });

      const league = await prisma.league.findUnique({
        where: { id: req.params.id },
        select: { id: true, name: true, createdByClubId: true },
      });
      if (!league)
        return res.status(404).json({ error: "Liga não encontrada." });

      const active = await isActiveMember(req.params.id, clubId);
      if (!active)
        return res
          .status(403)
          .json({ error: "Acesso restrito a membros da liga." });

      // Filtro opcional por categoria
      const { category } = req.query as { category?: string };

      // Agrega pontos por atleta (e categoria se filtrado)
      const grouped = await prisma.leaguePoints.groupBy({
        by: category ? ["athleteId", "category"] : ["athleteId"],
        where: {
          leagueId: req.params.id,
          ...(category ? { category } : {}),
        },
        _sum: { points: true },
        orderBy: { _sum: { points: "desc" } },
      });

      // Carrega os dados dos atletas
      const athleteIds = grouped.map((g) => g.athleteId);
      const athletes = await prisma.athlete.findMany({
        where: { id: { in: athleteIds } },
        select: {
          id: true,
          fullName: true,
          city: true,
          state: true,
          avatarUrl: true,
        },
      });
      const athleteMap = new Map(athletes.map((a) => [a.id, a]));

      const ranking = grouped.map((g, index) => ({
        position: index + 1,
        athlete: athleteMap.get(g.athleteId) ?? { id: g.athleteId },
        points: g._sum.points ?? 0,
        ...(category ? { category: (g as any).category } : {}),
      }));

      return res.json({
        data: {
          league: { id: league.id, name: league.name },
          category: category ?? null,
          ranking,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
