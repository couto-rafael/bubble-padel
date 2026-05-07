import { prisma } from "../lib/prisma";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getAthleteIdByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { athlete: { select: { id: true } } },
  });
  return user?.athlete?.id ?? null;
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

async function areFriendsMulti(
  ids: string[],
): Promise<Set<string>> {
  if (ids.length < 2) return new Set();
  const friendships = await prisma.athleteFriendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: ids.map((id) => [
        ...ids
          .filter((other) => other !== id)
          .map((other) => ({ senderId: id, receiverId: other })),
      ]).flat(),
    },
    select: { senderId: true, receiverId: true },
  });
  const pairs = new Set<string>();
  for (const f of friendships) {
    pairs.add(`${f.senderId}:${f.receiverId}`);
    pairs.add(`${f.receiverId}:${f.senderId}`);
  }
  return pairs;
}

function formatScore(
  score1: number | null | undefined,
  score2: number | null | undefined,
): string {
  if (score1 == null || score2 == null) return "";
  return `${score1}×${score2}`;
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
        select: { player1Email: true, player2Email: true },
      }),
      prisma.team.findUnique({
        where: { id: match.team2Id },
        select: { player1Email: true, player2Email: true },
      }),
    ]);

    if (!team1 || !team2) return;

    const emails = [
      team1.player1Email,
      team1.player2Email,
      team2.player1Email,
      team2.player2Email,
    ];

    const athleteByEmail: Record<string, string | null> = {};
    await Promise.all(
      emails.map(async (email) => {
        athleteByEmail[email] = await getAthleteIdByEmail(email);
      }),
    );

    const team1AthIds = [
      athleteByEmail[team1.player1Email],
      athleteByEmail[team1.player2Email],
    ].filter(Boolean) as string[];

    const team2AthIds = [
      athleteByEmail[team2.player1Email],
      athleteByEmail[team2.player2Email],
    ].filter(Boolean) as string[];

    const allIds = [...team1AthIds, ...team2AthIds];
    if (allIds.length < 2) return;

    const friendPairs = await areFriendsMulti(allIds);

    const tournament = match.group.tournament;
    const category = match.group.category;
    const score = formatScore(match.score1, match.score2);
    const team1Won = match.score1 > match.score2;

    for (const [teamIds, opponentIds, won] of [
      [team1AthIds, team2AthIds, team1Won],
      [team2AthIds, team1AthIds, !team1Won],
    ] as [string[], string[], boolean][]) {
      for (const athleteId of teamIds) {
        const hasFriendInMatch = opponentIds.some((opId) =>
          friendPairs.has(`${athleteId}:${opId}`),
        );
        if (!hasFriendInMatch) continue;

        const athlete = await prisma.athlete.findUnique({
          where: { id: athleteId },
          select: { settings: true },
        });
        if (!athlete) continue;

        const priv = getPrivacy(athlete.settings);
        if (priv.matches === "PRIVATE") continue;

        const existing = await prisma.athletePost.findFirst({
          where: {
            athleteId,
            type: "MATCH_RESULT",
            metadata: {
              path: ["matchId"],
              equals: matchId,
            },
          },
        });
        if (existing) continue;

        await prisma.athletePost.create({
          data: {
            athleteId,
            type: "MATCH_RESULT",
            metadata: {
              matchId,
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              category,
              won,
              score,
            },
          },
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
        select: { player1Email: true, player2Email: true },
      }),
      prisma.team.findUnique({
        where: { id: match.team2Id },
        select: { player1Email: true, player2Email: true },
      }),
    ]);

    if (!team1 || !team2) return;

    const emails = [
      team1.player1Email,
      team1.player2Email,
      team2.player1Email,
      team2.player2Email,
    ];

    const athleteByEmail: Record<string, string | null> = {};
    await Promise.all(
      emails.map(async (email) => {
        athleteByEmail[email] = await getAthleteIdByEmail(email);
      }),
    );

    const team1AthIds = [
      athleteByEmail[team1.player1Email],
      athleteByEmail[team1.player2Email],
    ].filter(Boolean) as string[];

    const team2AthIds = [
      athleteByEmail[team2.player1Email],
      athleteByEmail[team2.player2Email],
    ].filter(Boolean) as string[];

    const allIds = [...team1AthIds, ...team2AthIds];
    if (allIds.length < 2) return;

    const friendPairs = await areFriendsMulti(allIds);

    const tournament = match.bracket.tournament;
    const category = match.bracket.category;
    const score = formatScore(match.score1, match.score2);
    const team1Won = match.team1Id === match.winnerId;

    for (const [teamIds, opponentIds, won] of [
      [team1AthIds, team2AthIds, team1Won],
      [team2AthIds, team1AthIds, !team1Won],
    ] as [string[], string[], boolean][]) {
      for (const athleteId of teamIds) {
        const hasFriendInMatch = opponentIds.some((opId) =>
          friendPairs.has(`${athleteId}:${opId}`),
        );
        if (!hasFriendInMatch) continue;

        const athlete = await prisma.athlete.findUnique({
          where: { id: athleteId },
          select: { settings: true },
        });
        if (!athlete) continue;

        const priv = getPrivacy(athlete.settings);
        if (priv.matches === "PRIVATE") continue;

        const existing = await prisma.athletePost.findFirst({
          where: {
            athleteId,
            type: "MATCH_RESULT",
            metadata: {
              path: ["matchId"],
              equals: playoffMatchId,
            },
          },
        });
        if (existing) continue;

        await prisma.athletePost.create({
          data: {
            athleteId,
            type: "MATCH_RESULT",
            metadata: {
              matchId: playoffMatchId,
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              category,
              won,
              score,
            },
          },
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
