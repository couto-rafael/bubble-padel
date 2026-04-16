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

// ─── GET /api/tournaments/:id/results — dados para PDF de resultados ──────────
// Público: acessível sem auth para facilitar geração do PDF no frontend

tournamentRoutes.get(
  "/:id/results",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const tournament = await prisma.tournament.findFirst({
        where: { id: req.params.id, clubId: req.clubId! },
        include: {
          club: { select: { name: true, city: true } },
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

      // Busca todos os times confirmados com nomes
      const teams = await prisma.team.findMany({
        where: { tournamentId: req.params.id, status: "CONFIRMED" },
        select: {
          id: true,
          player1Name: true,
          player2Name: true,
          category: true,
        },
      });

      const teamsById = Object.fromEntries(teams.map((t) => [t.id, t]));

      // Para cada categoria com playoff, determina classificação final
      const results = tournament.playoffs.map((bracket) => {
        const { category, matches } = bracket;

        const finalMatch = matches.find(
          (m) => m.roundSize === 1 && m.matchIndex === 0,
        );

        const champion = finalMatch?.winnerId
          ? teamsById[finalMatch.winnerId]
          : null;

        const viceId = finalMatch
          ? finalMatch.team1Id === finalMatch.winnerId
            ? finalMatch.team2Id
            : finalMatch.team1Id
          : null;
        const vice = viceId ? teamsById[viceId] : null;

        // Semi-finalistas (roundSize === 2)
        const semiFinals = matches.filter(
          (m) => m.roundSize === 2 && !m.isBye && m.played,
        );
        const semiFinalistIds = new Set<string>();
        semiFinals.forEach((m) => {
          // Quem perdeu na semi é o semi-finalista (não chegou à final)
          const loserId = m.winnerId === m.team1Id ? m.team2Id : m.team1Id;
          if (loserId) semiFinalistIds.add(loserId);
        });
        const semiFinalists = [...semiFinalistIds]
          .map((id) => teamsById[id])
          .filter(Boolean);

        return {
          category,
          champion: champion
            ? {
                player1Name: champion.player1Name,
                player2Name: champion.player2Name,
              }
            : null,
          vice: vice
            ? { player1Name: vice.player1Name, player2Name: vice.player2Name }
            : null,
          semiFinalists: semiFinalists.map((t) => ({
            player1Name: t!.player1Name,
            player2Name: t!.player2Name,
          })),
        };
      });

      return res.json({
        data: {
          tournament: {
            name: tournament.name,
            sport: tournament.sport,
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            clubSede: tournament.clubSede,
            club: tournament.club,
          },
          results,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tournaments/:id/seed
// Gera bracket de Eliminatórias Diretas a partir de lista de seeds
// Body: { category: string, teamIds: string[] } — ordem = seed 1..N
// ─────────────────────────────────────────────────────────────────────────────
tournamentRoutes.post(
  "/:id/seed",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const tournamentId = req.params.id;
      const { category, teamIds } = req.body as {
        category: string;
        teamIds: string[];
      };

      if (!category || !Array.isArray(teamIds) || teamIds.length < 2) {
        return res.status(400).json({ error: "category e teamIds[] (mín. 2) obrigatórios" });
      }

      // Próxima potência de 2
      const n = teamIds.length;
      let nextPow2 = 1;
      while (nextPow2 < n) nextPow2 *= 2;
      const byes = nextPow2 - n;

      // Slots ATP: seed1→slot0, seed2→slot(last), seed3→slot(mid), seed4→slot(mid-1)...
      // Algoritmo: distribui seeds nos slots de cima para baixo, intercalando
      const slots: Array<string | null> = new Array(nextPow2).fill(null);
      const seedOrder = buildSeedOrder(nextPow2);
      for (let i = 0; i < seedOrder.length; i++) {
        const slot = seedOrder[i];
        slots[slot] = teamIds[i] ?? null; // null = bye
      }

      // Deleta bracket existente para a categoria
      const existing = await prisma.playoffBracket.findUnique({
        where: { tournamentId_category: { tournamentId, category } },
      });
      if (existing) {
        await prisma.playoffMatch.deleteMany({ where: { bracketId: existing.id } });
        await prisma.playoffBracket.delete({ where: { id: existing.id } });
      }

      // Busca nomes dos times para labels
      const teamsData = await prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, player1Name: true, player2Name: true },
      });
      const teamLabel = new Map(
        teamsData.map((t) => [t.id, `${t.player1Name} / ${t.player2Name}`]),
      );

      // Monta matches da primeira rodada (roundSize = nextPow2)
      const matches: Array<{
        roundSize: number;
        matchIndex: number;
        team1Id: string | null;
        team2Id: string | null;
        team1Label: string | null;
        team2Label: string | null;
        isBye: boolean;
        played: boolean;
        winnerId: string | null;
      }> = [];

      for (let i = 0; i < nextPow2 / 2; i++) {
        const t1 = slots[i * 2];
        const t2 = slots[i * 2 + 1];
        const isByeMatch = !t1 || !t2;
        const winnerId = isByeMatch ? (t1 ?? t2) : null;
        matches.push({
          roundSize: nextPow2,
          matchIndex: i,
          team1Id: t1 ?? null,
          team2Id: t2 ?? null,
          team1Label: t1 ? (teamLabel.get(t1) ?? null) : "BYE",
          team2Label: t2 ? (teamLabel.get(t2) ?? null) : "BYE",
          isBye: isByeMatch,
          played: isByeMatch,
          winnerId,
        });
      }

      // Rounds subsequentes vazios (nextPow2/2 → 1)
      for (let rSize = nextPow2 / 2; rSize >= 2; rSize /= 2) {
        for (let i = 0; i < rSize / 2; i++) {
          matches.push({
            roundSize: rSize,
            matchIndex: i,
            team1Id: null,
            team2Id: null,
            team1Label: null,
            team2Label: null,
            isBye: false,
            played: false,
            winnerId: null,
          });
        }
      }

      const bracket = await prisma.playoffBracket.create({
        data: {
          tournamentId,
          category,
          matches: { create: matches },
        },
        include: {
          matches: { orderBy: [{ roundSize: "desc" }, { matchIndex: "asc" }] },
        },
      });

      return res.json({ data: bracket });
    } catch (err) {
      next(err);
    }
  },
);

// Helper: ordem dos slots ATP para N seeds em nextPow2 slots
function buildSeedOrder(size: number): number[] {
  // Retorna array de posições de slot para seed 1, 2, 3, ...
  // seed1 → slot 0, seed2 → slot size-1, seed3/4 → quartos, etc.
  if (size === 1) return [0];
  const slots: number[] = [];
  function fill(lo: number, hi: number, depth: number) {
    if (lo > hi) return;
    const mid = Math.floor((lo + hi) / 2);
    slots.push(lo);
    if (lo !== hi) slots.push(hi);
    fill(lo + 1, mid, depth + 1);
    fill(mid + 1, hi - 1, depth + 1);
  }
  fill(0, size - 1, 0);
  // Reorganiza: alternando top/bottom como bracket ATP
  const result: number[] = new Array(size).fill(0);
  // Distribuição padrão: pares de match por rodada
  // Abordagem simples: seed 1 → slot 0, seed 2 → slot size-1,
  // seed 3 → slot size/2, seed 4 → slot size/2 - 1, etc.
  const positions: number[] = [];
  function distribute(lo: number, hi: number) {
    if (lo > hi) return;
    positions.push(lo);
    if (lo !== hi) positions.push(hi);
    if (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      distribute(lo + 1, mid);
      distribute(mid, hi - 1);
    }
  }
  distribute(0, size - 1);
  // Retorna os primeiros `size` posições únicas na ordem
  const seen = new Set<number>();
  const unique: number[] = [];
  for (const p of positions) {
    if (!seen.has(p)) { seen.add(p); unique.push(p); }
    if (unique.length === size) break;
  }
  // Preenche qualquer slot restante
  for (let i = 0; i < size && unique.length < size; i++) {
    if (!seen.has(i)) { seen.add(i); unique.push(i); }
  }
  return unique;
}

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
            player1Email: true,
            player2Name: true,
            player2Email: true,
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

    // Resolve athlete IDs (email → athleteId) para links públicos
    const allEmails = new Set<string>();
    (tournament.teams as any[]).forEach((t) => {
      if (t.player1Email) allEmails.add(t.player1Email);
      if (t.player2Email) allEmails.add(t.player2Email);
    });
    (tournament.groups as any[]).forEach((g) =>
      (g.teams as any[]).forEach((gt) => {
        if (gt.team.player1Email) allEmails.add(gt.team.player1Email);
        if (gt.team.player2Email) allEmails.add(gt.team.player2Email);
      }),
    );
    const emailToAthleteId: Record<string, string | null> = {};
    if (allEmails.size > 0) {
      const users = await prisma.user.findMany({
        where: { email: { in: [...allEmails] } },
        select: { email: true, athlete: { select: { id: true } } },
      });
      (users as any[]).forEach((u) => {
        emailToAthleteId[u.email] = u.athlete?.id ?? null;
      });
    }

    const teamsClean = (tournament.teams as any[]).map((t) => {
      const p1Id = emailToAthleteId[t.player1Email] ?? null;
      const p2Id = emailToAthleteId[t.player2Email] ?? null;
      return {
        id: t.id,
        player1Name: t.player1Name,
        player2Name: t.player2Name,
        category: t.category,
        status: t.status,
        player1AthleteId: p1Id,
        // Null quando o mesmo email foi usado nos dois slots (registro solo)
        player2AthleteId: p2Id && p2Id !== p1Id ? p2Id : null,
      };
    });

    const groupsClean = groupsWithSchedule.map((g: any) => ({
      ...g,
      teams: (g.teams as any[]).map((gt) => {
        const p1Id = emailToAthleteId[gt.team.player1Email] ?? null;
        const p2Id = emailToAthleteId[gt.team.player2Email] ?? null;
        return {
          ...gt,
          team: {
            id: gt.team.id,
            player1Name: gt.team.player1Name,
            player2Name: gt.team.player2Name,
            player1AthleteId: p1Id,
            player2AthleteId: p2Id && p2Id !== p1Id ? p2Id : null,
          },
        };
      }),
    }));

    return res.json({
      data: {
        ...tournament,
        teams: teamsClean,
        groups: groupsClean,
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
