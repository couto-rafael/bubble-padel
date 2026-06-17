import { prisma } from "../lib/prisma";

// ─── helpers ─────────────────────────────────────────────────────────────────

interface PlayerInfo {
  id: string | null;
  name: string;
}

async function resolvePlayerInfo(
  email: string,
  teamPlayerName: string,
): Promise<PlayerInfo> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      athlete: { select: { id: true, fullName: true, nickname: true } },
    },
  });
  if (user?.athlete) {
    return {
      id: user.athlete.id,
      name: user.athlete.nickname ?? user.athlete.fullName,
    };
  }
  return { id: null, name: teamPlayerName };
}

function getPrivacy(settings: unknown): {
  profile: string;
  stats: string;
  matches: string;
} {
  const s = (settings as Record<string, unknown>) ?? {};
  const privacy = (s.privacy as Record<string, string>) ?? {};
  return {
    profile: privacy.profile ?? "PUBLIC",
    stats: privacy.stats ?? "PUBLIC",
    matches: privacy.matches ?? "PUBLIC",
  };
}

function formatScore(
  score1: number | null | undefined,
  score2: number | null | undefined,
): string {
  if (score1 == null || score2 == null) return "";
  return `${score1}×${score2}`;
}

function playoffPhase(roundSize: number): string {
  switch (roundSize) {
    case 2:  return "Final";
    case 4:  return "Semifinal";
    case 8:  return "Quartas";
    case 16: return "Oitavas";
    case 32: return "16-avos";
    default: return `Top ${roundSize}`;
  }
}

async function writeMatchPost(args: {
  athleteId: string;
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  category: string;
  won: boolean;
  score: string;
  phase: string;
  partnerPlayer: PlayerInfo | undefined;
  opponentPlayers: PlayerInfo[];
}): Promise<void> {
  const athlete = await prisma.athlete.findUnique({
    where: { id: args.athleteId },
    select: { settings: true },
  });
  if (!athlete) return;

  const priv = getPrivacy(athlete.settings);
  if (priv.matches === "PRIVATE") return;

  const existing = await prisma.athletePost.findFirst({
    where: {
      athleteId: args.athleteId,
      type: "MATCH_RESULT",
      metadata: { path: ["matchId"], equals: args.matchId },
    },
  });
  if (existing) return;

  await prisma.athletePost.create({
    data: {
      athleteId: args.athleteId,
      type: "MATCH_RESULT",
      metadata: {
        matchId: args.matchId,
        tournamentId: args.tournamentId,
        tournamentName: args.tournamentName,
        category: args.category,
        won: args.won,
        score: args.score,
        phase: args.phase,
        partnerAthleteId: args.partnerPlayer?.id ?? null,
        partnerName: args.partnerPlayer?.name ?? "",
        opponentAthleteIds: args.opponentPlayers
          .map((p) => p.id)
          .filter(Boolean),
        opponentNames: args.opponentPlayers.map((p) => p.name),
      },
    },
  });
}

// ─── createTrophyPost ─────────────────────────────────────────────────────────

export async function createTrophyPost(args: {
  athleteId: string;
  tournamentId: string;
  tournamentName: string;
  category: string;
  position: 1 | 2;
}): Promise<void> {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { id: args.athleteId },
      select: { settings: true },
    });
    if (!athlete) return;

    const priv = getPrivacy(athlete.settings);
    if (priv.matches === "PRIVATE") return;

    const label = args.position === 1 ? "campeão" : "vice-campeão";
    const content = `🏆 ${label} da categoria ${args.category} no ${args.tournamentName}`;

    const existing = await prisma.athletePost.findFirst({
      where: {
        athleteId: args.athleteId,
        type: "TROPHY",
        metadata: {
          path: ["tournamentId"],
          equals: args.tournamentId,
        },
      },
    });
    if (existing) return;

    await prisma.athletePost.create({
      data: {
        athleteId: args.athleteId,
        type: "TROPHY",
        content,
        metadata: {
          tournamentId: args.tournamentId,
          category: args.category,
          position: args.position,
        },
      },
    });
  } catch (err) {
    console.error("[PostService] createTrophyPost error:", err);
  }
}

// ─── maybeCreateMatchResultPost (group matches) ───────────────────────────────

export async function maybeCreateMatchResultPost(
  matchId: string,
): Promise<void> {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        group: {
          select: {
            name: true,
            category: true,
            tournament: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!match || !match.played || match.score1 == null || match.score2 == null)
      return;

    const [team1, team2] = await Promise.all([
      prisma.team.findUnique({
        where: { id: match.team1Id },
        select: {
          player1Email: true,
          player1Name: true,
          player2Email: true,
          player2Name: true,
        },
      }),
      prisma.team.findUnique({
        where: { id: match.team2Id },
        select: {
          player1Email: true,
          player1Name: true,
          player2Email: true,
          player2Name: true,
        },
      }),
    ]);

    if (!team1 || !team2) return;

    const [t1p1, t1p2, t2p1, t2p2] = await Promise.all([
      resolvePlayerInfo(team1.player1Email, team1.player1Name),
      resolvePlayerInfo(team1.player2Email, team1.player2Name),
      resolvePlayerInfo(team2.player1Email, team2.player1Name),
      resolvePlayerInfo(team2.player2Email, team2.player2Name),
    ]);

    const team1Players: PlayerInfo[] = [t1p1, t1p2];
    const team2Players: PlayerInfo[] = [t2p1, t2p2];

    const tournament = match.group.tournament;
    const category = match.group.category;
    const score = formatScore(match.score1, match.score2);
    const team1Won = match.score1 > match.score2;
    const phase = `Grupo ${match.group.name}`;

    for (const [myPlayers, opponentPlayers, won] of [
      [team1Players, team2Players, team1Won],
      [team2Players, team1Players, !team1Won],
    ] as [PlayerInfo[], PlayerInfo[], boolean][]) {
      for (const player of myPlayers) {
        if (!player.id) continue;

        const partnerPlayer = myPlayers.find((p) => p !== player);

        await writeMatchPost({
          athleteId: player.id,
          matchId,
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          category,
          won,
          score,
          phase,
          partnerPlayer,
          opponentPlayers,
        });
      }
    }
  } catch (err) {
    console.error("[PostService] maybeCreateMatchResultPost error:", err);
  }
}

// ─── maybeCreatePlayoffMatchResultPost ───────────────────────────────────────

export async function maybeCreatePlayoffMatchResultPost(
  playoffMatchId: string,
): Promise<void> {
  try {
    const match = await prisma.playoffMatch.findUnique({
      where: { id: playoffMatchId },
      include: {
        bracket: {
          select: {
            category: true,
            tournament: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (
      !match ||
      !match.played ||
      !match.winnerId ||
      !match.team1Id ||
      !match.team2Id
    )
      return;

    const [team1, team2] = await Promise.all([
      prisma.team.findUnique({
        where: { id: match.team1Id },
        select: {
          player1Email: true,
          player1Name: true,
          player2Email: true,
          player2Name: true,
        },
      }),
      prisma.team.findUnique({
        where: { id: match.team2Id },
        select: {
          player1Email: true,
          player1Name: true,
          player2Email: true,
          player2Name: true,
        },
      }),
    ]);

    if (!team1 || !team2) return;

    const [t1p1, t1p2, t2p1, t2p2] = await Promise.all([
      resolvePlayerInfo(team1.player1Email, team1.player1Name),
      resolvePlayerInfo(team1.player2Email, team1.player2Name),
      resolvePlayerInfo(team2.player1Email, team2.player1Name),
      resolvePlayerInfo(team2.player2Email, team2.player2Name),
    ]);

    const team1Players: PlayerInfo[] = [t1p1, t1p2];
    const team2Players: PlayerInfo[] = [t2p1, t2p2];

    const tournament = match.bracket.tournament;
    const category = match.bracket.category;
    const score = formatScore(match.score1, match.score2);
    const team1Won = match.team1Id === match.winnerId;
    const phase = playoffPhase(match.roundSize);

    for (const [myPlayers, opponentPlayers, won] of [
      [team1Players, team2Players, team1Won],
      [team2Players, team1Players, !team1Won],
    ] as [PlayerInfo[], PlayerInfo[], boolean][]) {
      for (const player of myPlayers) {
        if (!player.id) continue;

        const partnerPlayer = myPlayers.find((p) => p !== player);

        await writeMatchPost({
          athleteId: player.id,
          matchId: playoffMatchId,
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          category,
          won,
          score,
          phase,
          partnerPlayer,
          opponentPlayers,
        });
      }
    }
  } catch (err) {
    console.error(
      "[PostService] maybeCreatePlayoffMatchResultPost error:",
      err,
    );
  }
}
