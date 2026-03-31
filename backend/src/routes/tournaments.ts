import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";
import {
  sendInscricaoConfirmada,
  sendNovaInscricaoParaClube,
  sendEmailCampeao,
  sendEmailVice,
  sendEmailEliminadoPlayoffs,
  sendEmailEliminadoGrupos,
  sendRelatorioRepasse,
  COMMISSION_PER_ATHLETE,
} from "../services/EmailService";

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
    .enum(["DRAFT", "PUBLISHED", "OPEN", "CLOSED", "ONGOING", "COMPLETED"])
    .optional(),
});

// ─── HELPER: Emails de resultado ao completar torneio ─────────────────────────

async function dispatchResultadoFinalEmails(
  tournamentId: string,
): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: {
        where: { status: "CONFIRMED" },
        select: {
          id: true,
          player1Name: true,
          player1Email: true,
          player2Name: true,
          player2Email: true,
          category: true,
        },
      },
      playoffs: {
        include: {
          matches: { orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }] },
        },
      },
    },
  });
  if (!tournament) return;

  const teamsById = Object.fromEntries(tournament.teams.map((t) => [t.id, t]));
  const base = { tournamentName: tournament.name, tournamentId: tournament.id };

  for (const bracket of tournament.playoffs) {
    const { category, matches } = bracket;
    const finalMatch = matches.find(
      (m) => m.roundSize === 1 && m.matchIndex === 0,
    );
    const championId = finalMatch?.winnerId ?? null;
    const viceId = finalMatch
      ? finalMatch.team1Id === championId
        ? finalMatch.team2Id
        : finalMatch.team1Id
      : null;

    const playoffTeamIds = new Set<string>();
    for (const m of matches) {
      if (m.isBye) continue;
      if (m.team1Id) playoffTeamIds.add(m.team1Id);
      if (m.team2Id) playoffTeamIds.add(m.team2Id);
    }

    const playoffEliminatedIds = [...playoffTeamIds].filter(
      (id) => id !== championId && id !== viceId,
    );
    const groupEliminatedIds = tournament.teams
      .filter((t) => t.category === category && !playoffTeamIds.has(t.id))
      .map((t) => t.id);

    if (championId && teamsById[championId]) {
      const t = teamsById[championId];
      sendEmailCampeao({ ...base, ...t, category }).catch((err: unknown) =>
        console.error("[email] campeão falhou:", err),
      );
    }
    if (viceId && teamsById[viceId]) {
      const t = teamsById[viceId];
      sendEmailVice({ ...base, ...t, category }).catch((err: unknown) =>
        console.error("[email] vice falhou:", err),
      );
    }
    for (const id of playoffEliminatedIds) {
      const t = teamsById[id];
      if (t)
        sendEmailEliminadoPlayoffs({ ...base, ...t, category }).catch(
          (err: unknown) =>
            console.error("[email] elim. playoffs falhou:", err),
        );
    }
    for (const id of groupEliminatedIds) {
      const t = teamsById[id];
      if (t)
        sendEmailEliminadoGrupos({ ...base, ...t, category }).catch(
          (err: unknown) => console.error("[email] elim. grupos falhou:", err),
        );
    }
  }

  const categoriesWithPlayoff = new Set(
    tournament.playoffs.map((b) => b.category),
  );
  const categoriesWithoutPlayoff = [
    ...new Set(tournament.teams.map((t) => t.category)),
  ].filter((c) => !categoriesWithPlayoff.has(c));
  for (const category of categoriesWithoutPlayoff) {
    for (const t of tournament.teams.filter((t) => t.category === category)) {
      sendEmailEliminadoGrupos({ ...base, ...t, category }).catch(
        (err: unknown) => console.error("[email] sem playoff falhou:", err),
      );
    }
  }

  console.log(
    `✅ [EMAIL RESULTADO] Emails disparados para "${tournament.name}"`,
  );
}

// ─── HELPER: Reconciliação financeira ao completar torneio ────────────────────

async function dispatchReconciliacao(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      club: { include: { user: { select: { email: true } } } },
      teams: { where: { status: "CONFIRMED" } },
    },
  });
  if (!tournament) return;

  // Verifica se já existe reconciliação para não duplicar
  const existing = await prisma.reconciliation.findUnique({
    where: { tournamentId },
  });
  if (existing) {
    console.log(
      `⚠️ [RECONCILIACAO] Torneio "${tournament.name}" já reconciliado.`,
    );
    return;
  }

  const totalAtletas = tournament.teams.length * 2;
  const totalBruto = tournament.teams.reduce((acc, t) => acc + t.amount, 0);
  const comissao = COMMISSION_PER_ATHLETE * totalAtletas;
  const valorRepasse = totalBruto - comissao;

  await prisma.reconciliation.create({
    data: {
      tournamentId,
      totalBruto,
      comissao,
      valorRepasse,
      totalAtletas,
      status: "PENDENTE",
    },
  });

  const clubEmail = tournament.club?.user?.email;
  const clubName = tournament.club?.name ?? "Clube";

  if (clubEmail) {
    sendRelatorioRepasse({
      clubEmail,
      clubName,
      tournamentName: tournament.name,
      tournamentId,
      totalBruto,
      comissao,
      valorRepasse,
      totalAtletas,
    }).catch((err: unknown) =>
      console.error("[email] relatório repasse falhou:", err),
    );
  }

  console.log(
    `✅ [RECONCILIACAO] "${tournament.name}" — bruto: R$${totalBruto.toFixed(2)}, repasse: R$${valorRepasse.toFixed(2)}`,
  );
}

// ─── GET /api/tournaments ─────────────────────────────────────────────────────

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

// ─── GET /api/tournaments/:id ─────────────────────────────────────────────────

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

// ─── POST /api/tournaments ────────────────────────────────────────────────────

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

// ─── PATCH /api/tournaments/:id ───────────────────────────────────────────────

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

// ─── DELETE /api/tournaments/:id ──────────────────────────────────────────────

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

// ─── POST /api/tournaments/:id/schedule/bulk ──────────────────────────────────

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
      if (!Array.isArray(schedules) || schedules.length === 0)
        return res.status(400).json({ error: "schedules array é obrigatório" });

      await Promise.all(
        schedules.map((s) =>
          prisma.schedule.upsert({
            where: { matchId: s.matchId },
            create: {
              matchId: s.matchId,
              court: s.court,
              date: new Date(s.date),
              time: s.time,
            },
            update: { court: s.court, date: new Date(s.date), time: s.time },
          }),
        ),
      );
      return res.json({ data: { count: schedules.length } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/tournaments/:id/sync-status ────────────────────────────────────

tournamentRoutes.post(
  "/:id/sync-status",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const tournament = await prisma.tournament.findFirst({
        where: { id: req.params.id, clubId: req.clubId! },
        include: {
          groups: { include: { matches: true } },
          playoffs: { include: { matches: true } },
        },
      });
      if (!tournament)
        return res.status(404).json({ error: "Torneio não encontrado" });

      const currentStatus = tournament.status as string;
      if (currentStatus === "COMPLETED")
        return res.json({ data: { status: currentStatus } });

      const anyGroupPlayed = (tournament as any).groups.some((g: any) =>
        g.matches.some((m: any) => m.played),
      );
      const allPlayoffMatches = (tournament as any).playoffs.flatMap((b: any) =>
        b.matches.filter((m: any) => !m.isBye),
      );
      const allPlayoffPlayed =
        allPlayoffMatches.length > 0 &&
        allPlayoffMatches.every((m: any) => m.played);

      let newStatus: any = currentStatus;
      if (allPlayoffPlayed) {
        newStatus = "COMPLETED";
      } else if (
        anyGroupPlayed &&
        currentStatus !== "ONGOING" &&
        currentStatus !== "COMPLETED"
      ) {
        newStatus = "ONGOING";
      }

      if (newStatus !== currentStatus) {
        await prisma.tournament.update({
          where: { id: req.params.id },
          data: { status: newStatus as any },
        });

        if (newStatus === "COMPLETED") {
          // Dispara emails de resultado e reconciliação — assíncronos
          dispatchResultadoFinalEmails(req.params.id).catch((err: unknown) =>
            console.error("[email] resultado final falhou:", err),
          );
          dispatchReconciliacao(req.params.id).catch((err: unknown) =>
            console.error("[reconciliacao] falhou:", err),
          );
        }
      }

      return res.json({ data: { status: newStatus } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/tournaments/:id/financial ───────────────────────────────────────

tournamentRoutes.get(
  "/:id/financial",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const tournament = await prisma.tournament.findFirst({
        where: { id: req.params.id, clubId: req.clubId! },
      });
      if (!tournament)
        return res.status(404).json({ error: "Torneio não encontrado" });

      const teams = await prisma.team.findMany({
        where: { tournamentId: req.params.id },
        orderBy: { registrationDate: "asc" },
      });

      const payments = teams.map((t) => ({
        teamId: t.id,
        player1Name: t.player1Name,
        player2Name: t.player2Name,
        category: t.category,
        amount: t.amount,
        player1Status: t.player1PaymentStatus as string,
        player2Status: t.player2PaymentStatus as string,
        registrationDate: t.registrationDate,
      }));

      const grossRevenue = teams.reduce((acc, t) => {
        const p1 = t.player1PaymentStatus === "PAID" ? t.amount / 2 : 0;
        const p2 = t.player2PaymentStatus === "PAID" ? t.amount / 2 : 0;
        return acc + p1 + p2;
      }, 0);

      const expectedRevenue = teams.reduce((acc, t) => acc + t.amount, 0);
      const paidTeams = teams.filter(
        (t) =>
          t.player1PaymentStatus === "PAID" &&
          t.player2PaymentStatus === "PAID",
      ).length;

      return res.json({
        data: {
          totalTeams: teams.length,
          paidTeams,
          pendingTeams: teams.length - paidTeams,
          grossRevenue,
          expectedRevenue,
          payments,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// ROTAS PÚBLICAS
// ─────────────────────────────────────────────────────────────────────────────

export const publicTournamentRoutes = Router();

const registerSchema = z.object({
  player1Name: z.string().min(2),
  player1Email: z.string().email(),
  player2Name: z.string().min(2),
  player2Email: z.string().email(),
  category: z.string(),
});

publicTournamentRoutes.get("/", async (req, res, next) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: { in: ["PUBLISHED", "OPEN", "CLOSED", "ONGOING", "COMPLETED"] },
      },
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

publicTournamentRoutes.get("/:id", async (req, res, next) => {
  try {
    const tournament = await prisma.tournament.findFirst({
      where: {
        id: req.params.id,
        status: { in: ["PUBLISHED", "OPEN", "CLOSED", "ONGOING", "COMPLETED"] },
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
            matches: { orderBy: { createdAt: "asc" } },
          },
          orderBy: [{ category: "asc" }, { name: "asc" }],
        },
        playoffs: {
          include: {
            matches: {
              orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }],
            },
          },
        },
      },
    });
    if (!tournament)
      return res.status(404).json({ error: "Torneio não encontrado" });

    const allMatchIds = tournament.groups.flatMap((g: any) =>
      g.matches.map((m: any) => m.id),
    );
    const schedules =
      allMatchIds.length > 0
        ? await prisma.schedule.findMany({
            where: { matchId: { in: allMatchIds } },
          })
        : [];
    const scheduleByMatchId = Object.fromEntries(
      schedules.map((s: any) => [s.matchId, s]),
    );
    const groupsWithSchedule = tournament.groups.map((g: any) => ({
      ...g,
      matches: g.matches.map((m: any) => ({
        ...m,
        schedule: scheduleByMatchId[m.id] ?? null,
      })),
    }));

    return res.json({
      data: {
        ...tournament,
        groups: groupsWithSchedule,
        playoffBrackets: tournament.playoffs,
      },
    });
  } catch (err) {
    next(err);
  }
});

publicTournamentRoutes.post("/:id/register", async (req, res, next) => {
  try {
    const tournamentId = req.params.id;
    const data = registerSchema.parse(req.body);

    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, status: "OPEN" },
      include: { _count: { select: { teams: true } } },
    });
    if (!tournament)
      return res
        .status(404)
        .json({
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
      },
    });

    const tournamentDate = new Date(tournament.startDate).toLocaleDateString(
      "pt-BR",
      { day: "2-digit", month: "long", year: "numeric" },
    );

    sendInscricaoConfirmada({
      player1Name: data.player1Name,
      player2Name: data.player2Name,
      player1Email: data.player1Email,
      player2Email: data.player2Email,
      tournamentName: tournament.name,
      tournamentDate,
      category: data.category,
      tournamentId,
    }).catch((err: unknown) => console.error("[email] atleta falhou:", err));

    prisma.club
      .findFirst({
        where: { tournaments: { some: { id: tournamentId } } },
        include: { user: { select: { email: true } } },
      })
      .then((club) => {
        if (club?.user?.email) {
          sendNovaInscricaoParaClube({
            clubEmail: club.user.email,
            player1Name: data.player1Name,
            player2Name: data.player2Name,
            category: data.category,
            tournamentName: tournament.name,
            tournamentId,
          }).catch((err: unknown) =>
            console.error("[email] clube falhou:", err),
          );
        }
      })
      .catch((err: unknown) =>
        console.error("[email] busca clube falhou:", err),
      );

    return res.status(201).json({ data: team });
  } catch (err) {
    next(err);
  }
});
