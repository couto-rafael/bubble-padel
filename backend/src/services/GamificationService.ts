import { prisma } from "../lib/prisma";

/**
 * Sprint 5 — GamificationService
 *
 * Responsável por:
 *   1. Troféus  — campeão/vice-campeão automático via playoffs
 *   2. Pontos   — LeaguePoints (só se torneio vinculado a uma liga)
 *   3. Achievements — catálogo completo, avaliado por atleta
 *
 * Chamado pelo statusSync quando torneio → COMPLETED.
 * Todas as escritas são idempotentes (upsert / @@unique protege contra duplicata).
 */

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

type Placement = "champion" | "runner_up" | "semi" | "quarter" | "group";

interface PlayerPlacement {
  email: string;
  teamId: string;
  category: string;
  placement: Placement;
}

interface AchievementDef {
  key: string;
  // Função que retorna o valor numérico de progresso atual do atleta
  getValue: (athleteId: string, email: string) => Promise<number>;
  // Tiers: [threshold, tier] ordenado crescente
  tiers: Array<[number, "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" | "LEGEND"]>;
  // true = mostra barra de progresso no frontend
  hasProgress: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dado um email, retorna o athleteId correspondente (se existir conta).
 */
async function getAthleteIdByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { athlete: { select: { id: true } } },
  });
  return user?.athlete?.id ?? null;
}

/**
 * Dado um teamId, retorna [player1Email, player2Email].
 */
async function getTeamEmails(teamId: string): Promise<[string, string] | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { player1Email: true, player2Email: true },
  });
  if (!team) return null;
  return [team.player1Email, team.player2Email];
}

/**
 * Resolve os pontos efetivos de uma posição num torneio de liga.
 * Override do torneio tem prioridade; fallback para os pontos da liga.
 */
function resolvePoints(
  placement: Placement,
  link: {
    pointsChampion: number | null;
    pointsRunnerUp: number | null;
    pointsSemi: number | null;
    pointsQuarter: number | null;
    pointsGroup: number | null;
    league: {
      pointsChampion: number;
      pointsRunnerUp: number;
      pointsSemi: number;
      pointsQuarter: number;
      pointsGroup: number;
    };
  },
): number {
  switch (placement) {
    case "champion":
      return link.pointsChampion ?? link.league.pointsChampion;
    case "runner_up":
      return link.pointsRunnerUp ?? link.league.pointsRunnerUp;
    case "semi":
      return link.pointsSemi ?? link.league.pointsSemi;
    case "quarter":
      return link.pointsQuarter ?? link.league.pointsQuarter;
    case "group":
      return link.pointsGroup ?? link.league.pointsGroup;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TROFÉUS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lê os playoffs do torneio e persiste AthleteTrophy para
 * campeão e vice-campeão de cada categoria.
 * Retorna a lista de placements de todos os participantes (para pontos de liga).
 */
async function awardTrophies(
  tournamentId: string,
  tournamentName: string,
  sport: string,
): Promise<PlayerPlacement[]> {
  const brackets = await prisma.playoffBracket.findMany({
    where: { tournamentId },
    include: { matches: true },
  });

  const allPlacements: PlayerPlacement[] = [];

  for (const bracket of brackets) {
    const { category, matches } = bracket;

    // ── Campeão / Vice (final: roundSize = 1) ────────────────────────────────
    const final = matches.find((m) => m.roundSize === 1 && m.played);
    if (final && final.winnerId && final.team1Id && final.team2Id) {
      const championTeamId = final.winnerId;
      const runnerUpTeamId =
        final.team1Id === final.winnerId ? final.team2Id : final.team1Id;

      // Persiste troféus
      for (const [teamId, placement] of [
        [championTeamId, "CHAMPION"],
        [runnerUpTeamId, "RUNNER_UP"],
      ] as [string, "CHAMPION" | "RUNNER_UP"][]) {
        const emails = await getTeamEmails(teamId);
        if (!emails) continue;

        for (const email of emails) {
          const athleteId = await getAthleteIdByEmail(email);
          if (!athleteId) continue;

          await prisma.athleteTrophy.upsert({
            where: {
              athleteId_tournamentId_category: {
                athleteId,
                tournamentId,
                category,
              },
            },
            create: {
              athleteId,
              tournamentId,
              tournamentName,
              category,
              placement,
              sport: sport as any,
            },
            update: { placement }, // se rodou 2x, mantém o mais recente
          });
        }

        // Registra placement para uso nos pontos de liga
        const emails2 = await getTeamEmails(teamId);
        if (emails2) {
          for (const email of emails2) {
            allPlacements.push({
              email,
              teamId,
              category,
              placement: placement === "CHAMPION" ? "champion" : "runner_up",
            });
          }
        }
      }
    }

    // ── Semi-finalistas (roundSize = 2) ──────────────────────────────────────
    const semis = matches.filter(
      (m) => m.roundSize === 2 && m.played && !m.isBye,
    );
    for (const semi of semis) {
      // O perdedor da semi vai para "semi" placement
      if (!semi.winnerId || !semi.team1Id || !semi.team2Id) continue;
      const loserTeamId =
        semi.team1Id === semi.winnerId ? semi.team2Id : semi.team1Id;

      const emails = await getTeamEmails(loserTeamId);
      if (emails) {
        for (const email of emails) {
          allPlacements.push({
            email,
            teamId: loserTeamId,
            category,
            placement: "semi",
          });
        }
      }
    }

    // ── Quartas-de-finalistas (roundSize = 4) ────────────────────────────────
    const quarters = matches.filter(
      (m) => m.roundSize === 4 && m.played && !m.isBye,
    );
    for (const quarter of quarters) {
      if (!quarter.winnerId || !quarter.team1Id || !quarter.team2Id) continue;
      const loserTeamId =
        quarter.team1Id === quarter.winnerId
          ? quarter.team2Id
          : quarter.team1Id;

      const emails = await getTeamEmails(loserTeamId);
      if (emails) {
        for (const email of emails) {
          allPlacements.push({
            email,
            teamId: loserTeamId,
            category,
            placement: "quarter",
          });
        }
      }
    }
  }

  // ── Fase de grupos (todos os confirmados sem placement melhor) ────────────
  const confirmedTeams = await prisma.team.findMany({
    where: { tournamentId, status: "CONFIRMED" },
    select: {
      id: true,
      player1Email: true,
      player2Email: true,
      category: true,
    },
  });

  const emailsWithBetterPlacement = new Set(allPlacements.map((p) => p.email));

  for (const team of confirmedTeams) {
    for (const email of [team.player1Email, team.player2Email]) {
      if (!emailsWithBetterPlacement.has(email)) {
        allPlacements.push({
          email,
          teamId: team.id,
          category: team.category,
          placement: "group",
        });
      }
    }
  }

  return allPlacements;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PONTOS DE LIGA
// ─────────────────────────────────────────────────────────────────────────────

async function awardLeaguePoints(
  tournamentId: string,
  placements: PlayerPlacement[],
): Promise<void> {
  // Verifica se o torneio está vinculado a uma liga
  const link = await prisma.leagueTournament.findUnique({
    where: { tournamentId },
    include: {
      league: {
        select: {
          id: true,
          pointsChampion: true,
          pointsRunnerUp: true,
          pointsSemi: true,
          pointsQuarter: true,
          pointsGroup: true,
        },
      },
    },
  });

  if (!link) return; // torneio avulso — sem pontos de liga

  for (const p of placements) {
    const athleteId = await getAthleteIdByEmail(p.email);
    if (!athleteId) continue; // atleta sem conta na plataforma

    const points = resolvePoints(p.placement, {
      pointsChampion: link.pointsChampion,
      pointsRunnerUp: link.pointsRunnerUp,
      pointsSemi: link.pointsSemi,
      pointsQuarter: link.pointsQuarter,
      pointsGroup: link.pointsGroup,
      league: link.league,
    });

    if (points <= 0) continue;

    await prisma.leaguePoints.upsert({
      where: {
        leagueId_athleteId_tournamentId_category: {
          leagueId: link.league.id,
          athleteId,
          tournamentId,
          category: p.category,
        },
      },
      create: {
        leagueId: link.league.id,
        athleteId,
        tournamentId,
        category: p.category,
        placement: p.placement,
        points,
      },
      update: { points, placement: p.placement },
    });
  }

  console.log(
    `✅ [GAMIFICATION] Pontos de liga distribuídos — torneio ${tournamentId}, liga ${link.league.id}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ACHIEVEMENTS — catálogo e avaliação
// ─────────────────────────────────────────────────────────────────────────────

function getTierForValue(
  value: number,
  tiers: Array<[number, "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" | "LEGEND"]>,
): "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" | "LEGEND" | null {
  let currentTier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" | "LEGEND" | null =
    null;
  for (const [threshold, tier] of tiers) {
    if (value >= threshold) currentTier = tier;
  }
  return currentTier;
}

/**
 * Catálogo completo de achievements.
 * getValue retorna o progresso numérico atual do atleta.
 * tiers define em que threshold cada tier é desbloqueado.
 */
function buildAchievementCatalog(): AchievementDef[] {
  return [
    // ── PARTICIPAÇÃO ─────────────────────────────────────────────────────────

    {
      key: "first_tournament",
      hasProgress: false,
      tiers: [[1, "BRONZE"]],
      getValue: async (_id, email) => {
        const count = await prisma.team.count({
          where: {
            OR: [{ player1Email: email }, { player2Email: email }],
            status: "CONFIRMED",
          },
        });
        return count >= 1 ? 1 : 0;
      },
    },
    {
      key: "regular_player",
      hasProgress: true,
      tiers: [
        [3, "BRONZE"],
        [5, "SILVER"],
        [10, "GOLD"],
        [25, "DIAMOND"],
        [50, "LEGEND"],
      ],
      getValue: async (_id, email) => {
        const count = await prisma.team.count({
          where: {
            OR: [{ player1Email: email }, { player2Email: email }],
            status: "CONFIRMED",
            tournament: { status: "COMPLETED" },
          },
        });
        return count;
      },
    },
    {
      key: "monthly_player",
      hasProgress: true,
      tiers: [
        [3, "BRONZE"],
        [6, "SILVER"],
        [12, "GOLD"],
      ],
      getValue: async (_id, email) => {
        const teams = await prisma.team.findMany({
          where: {
            OR: [{ player1Email: email }, { player2Email: email }],
            status: "CONFIRMED",
            tournament: { status: "COMPLETED" },
          },
          include: {
            tournament: { select: { startDate: true } },
          },
        });
        // Meses únicos (YYYY-MM)
        const months = new Set(
          teams.map((t) => {
            const d = new Date(t.tournament.startDate);
            return `${d.getFullYear()}-${d.getMonth()}`;
          }),
        );
        return months.size;
      },
    },

    // ── PERFORMANCE ──────────────────────────────────────────────────────────

    {
      key: "first_title",
      hasProgress: false,
      tiers: [[1, "BRONZE"]],
      getValue: async (athleteId) => {
        const count = await prisma.athleteTrophy.count({
          where: { athleteId, placement: "CHAMPION" },
        });
        return count >= 1 ? 1 : 0;
      },
    },
    {
      key: "champion",
      hasProgress: true,
      tiers: [
        [1, "BRONZE"],
        [3, "SILVER"],
        [5, "GOLD"],
        [10, "DIAMOND"],
      ],
      getValue: async (athleteId) => {
        return prisma.athleteTrophy.count({
          where: { athleteId, placement: "CHAMPION" },
        });
      },
    },
    {
      key: "finalist",
      hasProgress: true,
      tiers: [
        [1, "BRONZE"],
        [3, "SILVER"],
        [5, "GOLD"],
      ],
      getValue: async (athleteId) => {
        return prisma.athleteTrophy.count({
          where: { athleteId }, // CHAMPION + RUNNER_UP = finalista
        });
      },
    },
    {
      key: "podium_streak",
      hasProgress: true,
      tiers: [
        [2, "BRONZE"],
        [3, "SILVER"],
        [5, "GOLD"],
      ],
      getValue: async (athleteId) => {
        // Ordena troféus por earnedAt e calcula maior sequência
        const trophies = await prisma.athleteTrophy.findMany({
          where: { athleteId },
          orderBy: { earnedAt: "asc" },
        });
        // Agrupa por tournamentId (cada torneio conta 1 vez para streak)
        const uniqueTournaments = [
          ...new Map(trophies.map((t) => [t.tournamentId, t])).values(),
        ].sort((a, b) => a.earnedAt.getTime() - b.earnedAt.getTime());

        let maxStreak = 0;
        let streak = uniqueTournaments.length > 0 ? 1 : 0;
        for (let i = 1; i < uniqueTournaments.length; i++) {
          streak++;
          if (streak > maxStreak) maxStreak = streak;
        }
        if (uniqueTournaments.length === 1) maxStreak = 1;
        return maxStreak;
      },
    },
    {
      key: "undefeated_group",
      hasProgress: false,
      tiers: [[1, "BRONZE"]],
      getValue: async (_id, email) => {
        // Busca torneios onde o atleta passou de grupos sem perder
        const teams = await prisma.team.findMany({
          where: {
            OR: [{ player1Email: email }, { player2Email: email }],
            status: "CONFIRMED",
            tournament: { status: "COMPLETED" },
          },
          select: { id: true },
        });

        for (const team of teams) {
          const groupTeam = await prisma.groupTeam.findFirst({
            where: { teamId: team.id, qualified: true, losses: 0 },
          });
          if (groupTeam) return 1;
        }
        return 0;
      },
    },

    // ── SOCIAL ───────────────────────────────────────────────────────────────

    {
      key: "loyal_partner",
      hasProgress: true,
      tiers: [
        [3, "BRONZE"],
        [5, "SILVER"],
        [10, "GOLD"],
      ],
      getValue: async (_id, email) => {
        // Conta quantas vezes jogou com o mesmo parceiro (máximo de repetições)
        const teams = await prisma.team.findMany({
          where: {
            OR: [{ player1Email: email }, { player2Email: email }],
            status: "CONFIRMED",
          },
          select: { player1Email: true, player2Email: true },
        });

        const partnerCount = new Map<string, number>();
        for (const t of teams) {
          const partner =
            t.player1Email === email ? t.player2Email : t.player1Email;
          partnerCount.set(partner, (partnerCount.get(partner) ?? 0) + 1);
        }
        return Math.max(0, ...partnerCount.values());
      },
    },
    {
      key: "explorer",
      hasProgress: true,
      tiers: [
        [2, "BRONZE"],
        [3, "SILVER"],
        [5, "GOLD"],
      ],
      getValue: async (_id, email) => {
        const teams = await prisma.team.findMany({
          where: {
            OR: [{ player1Email: email }, { player2Email: email }],
            status: "CONFIRMED",
          },
          include: {
            tournament: {
              include: { club: { select: { city: true } } },
            },
          },
        });
        const cities = new Set(
          teams
            .map((t) => t.tournament.club.city?.toLowerCase().trim())
            .filter(Boolean),
        );
        return cities.size;
      },
    },
    {
      key: "versatile",
      hasProgress: true,
      tiers: [
        [2, "BRONZE"],
        [3, "SILVER"],
      ],
      getValue: async (_id, email) => {
        const teams = await prisma.team.findMany({
          where: {
            OR: [{ player1Email: email }, { player2Email: email }],
            status: "CONFIRMED",
          },
          select: { category: true },
        });
        const categories = new Set(teams.map((t) => t.category.toLowerCase()));
        return categories.size;
      },
    },
    {
      key: "road_warrior",
      hasProgress: true,
      tiers: [
        [3, "BRONZE"],
        [5, "SILVER"],
      ],
      getValue: async (_id, email) => {
        const teams = await prisma.team.findMany({
          where: {
            OR: [{ player1Email: email }, { player2Email: email }],
            status: "CONFIRMED",
          },
          include: {
            tournament: { select: { clubId: true } },
          },
        });
        const clubs = new Set(teams.map((t) => t.tournament.clubId));
        return clubs.size;
      },
    },

    // ── PLATAFORMA ───────────────────────────────────────────────────────────

    {
      key: "profile_complete",
      hasProgress: false,
      tiers: [[1, "BRONZE"]],
      getValue: async (athleteId) => {
        const athlete = await prisma.athlete.findUnique({
          where: { id: athleteId },
          select: { avatarUrl: true, city: true, phone: true },
        });
        if (!athlete) return 0;
        const complete =
          !!athlete.avatarUrl && !!athlete.city && !!athlete.phone;
        return complete ? 1 : 0;
      },
    },
    {
      key: "early_adopter",
      hasProgress: false,
      tiers: [[1, "BRONZE"]],
      getValue: async (athleteId) => {
        // Conta quantos atletas foram criados antes deste
        const athlete = await prisma.athlete.findUnique({
          where: { id: athleteId },
          select: { createdAt: true },
        });
        if (!athlete) return 0;
        const countBefore = await prisma.athlete.count({
          where: { createdAt: { lte: athlete.createdAt } },
        });
        return countBefore <= 500 ? 1 : 0;
      },
    },
    {
      key: "league_debut",
      hasProgress: false,
      tiers: [[1, "BRONZE"]],
      getValue: async (_id, email) => {
        // Participou de pelo menos 1 torneio de liga
        const team = await prisma.team.findFirst({
          where: {
            OR: [{ player1Email: email }, { player2Email: email }],
            status: "CONFIRMED",
            tournament: {
              league: { isNot: null },
            },
          },
        });
        return team ? 1 : 0;
      },
    },
  ];
}

/**
 * Avalia e persiste achievements para uma lista de athleteIds.
 */
async function evaluateAchievements(
  athletes: Array<{ id: string; email: string }>,
): Promise<void> {
  const catalog = buildAchievementCatalog();

  for (const { id: athleteId, email } of athletes) {
    for (const def of catalog) {
      try {
        const value = await def.getValue(athleteId, email);
        const tier = getTierForValue(value, def.tiers);

        if (tier === null) {
          // Progresso ainda não atingiu nem o tier mínimo — só atualiza progresso
          await prisma.athleteAchievement.upsert({
            where: { athleteId_key: { athleteId, key: def.key } },
            create: {
              athleteId,
              key: def.key,
              tier: "BRONZE", // tier mínimo como placeholder
              progress: value,
              unlockedAt: null,
            },
            update: { progress: value },
          });
          continue;
        }

        // Verifica se já tem esse achievement e em qual tier
        const existing = await prisma.athleteAchievement.findUnique({
          where: { athleteId_key: { athleteId, key: def.key } },
        });

        const tierOrder = ["BRONZE", "SILVER", "GOLD", "DIAMOND", "LEGEND"];
        const currentTierIndex = existing
          ? tierOrder.indexOf(existing.tier)
          : -1;
        const newTierIndex = tierOrder.indexOf(tier);

        // Só atualiza se tier novo é maior (nunca retroage)
        if (newTierIndex > currentTierIndex || !existing?.unlockedAt) {
          await prisma.athleteAchievement.upsert({
            where: { athleteId_key: { athleteId, key: def.key } },
            create: {
              athleteId,
              key: def.key,
              tier,
              progress: value,
              unlockedAt: new Date(),
            },
            update: {
              tier,
              progress: value,
              ...(newTierIndex > currentTierIndex
                ? { unlockedAt: new Date() }
                : {}),
            },
          });
        } else {
          // Só atualiza o progresso
          await prisma.athleteAchievement.update({
            where: { athleteId_key: { athleteId, key: def.key } },
            data: { progress: value },
          });
        }
      } catch (err) {
        console.error(
          `[GAMIFICATION] Erro ao avaliar achievement "${def.key}" para atleta ${athleteId}:`,
          err,
        );
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT — chamado pelo statusSync
// ─────────────────────────────────────────────────────────────────────────────

export async function processCompletedTournament(
  tournamentId: string,
): Promise<void> {
  console.log(`🎮 [GAMIFICATION] Processando torneio ${tournamentId}...`);

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, name: true, sport: true, status: true },
    });

    if (!tournament || tournament.status !== "COMPLETED") {
      console.warn(
        `[GAMIFICATION] Torneio ${tournamentId} não encontrado ou não COMPLETED — abortando.`,
      );
      return;
    }

    // 1. Troféus + coleta de placements para pontos
    const placements = await awardTrophies(
      tournamentId,
      tournament.name,
      tournament.sport,
    );
    console.log(
      `✅ [GAMIFICATION] Troféus processados — ${placements.length} placements encontrados.`,
    );

    // 2. Pontos de liga (no-op se torneio avulso)
    await awardLeaguePoints(tournamentId, placements);

    // 3. Achievements — avalia todos os atletas com conta na plataforma
    const emailsUniq = [...new Set(placements.map((p) => p.email))];
    const athleteList: Array<{ id: string; email: string }> = [];

    for (const email of emailsUniq) {
      const athleteId = await getAthleteIdByEmail(email);
      if (athleteId) athleteList.push({ id: athleteId, email });
    }

    await evaluateAchievements(athleteList);
    console.log(
      `✅ [GAMIFICATION] Achievements avaliados — ${athleteList.length} atleta(s) processado(s).`,
    );

    console.log(
      `🏆 [GAMIFICATION] Torneio "${tournament.name}" processado com sucesso.`,
    );
  } catch (err) {
    console.error(
      `❌ [GAMIFICATION] Erro ao processar torneio ${tournamentId}:`,
      err,
    );
  }
}
