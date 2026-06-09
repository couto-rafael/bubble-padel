/**
 * Seed script: fill group + playoff scores for a Regular tournament (Sprint 8.5)
 * Run AFTER groups have been drawn in the UI.
 *
 * Usage:
 *   CLUB_PASSWORD=<pwd> npm run seed:scores -- --tournament-id <id> --dry-run
 *   CLUB_PASSWORD=<pwd> npm run seed:scores -- --tournament-id <id>
 *
 * Requires backend running at BASE_URL (default: http://localhost:3001)
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3001";
const CLUB_EMAIL = "rafaelcouto.ca@gmail.com";
const CLUB_PASSWORD = process.env.CLUB_PASSWORD ?? "";

const DRY_RUN =
  process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

// Parse --tournament-id <id> from argv
function getTournamentId(): string {
  const idx = process.argv.indexOf("--tournament-id");
  if (idx === -1 || !process.argv[idx + 1]) {
    console.error("[ERROR] Pass --tournament-id <id>");
    process.exit(1);
  }
  return process.argv[idx + 1];
}

// ── Random valid scores ───────────────────────────────────────────────────────
const SCORE_PAIRS: [number, number][] = [
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4],
  [7, 5], [7, 6],
];

function randomScore(): { score1: number; score2: number } {
  const pair = SCORE_PAIRS[Math.floor(Math.random() * SCORE_PAIRS.length)];
  // Randomly swap winner side
  return Math.random() < 0.5
    ? { score1: pair[0], score2: pair[1] }
    : { score1: pair[1], score2: pair[0] };
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiGet(path: string, token: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(`GET ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function apiPost(path: string, body: unknown, token: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(`POST ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function apiPatch(path: string, body: unknown, token: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(`PATCH ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

// ── Types (minimal subset from API responses) ─────────────────────────────────
interface ApiMatch {
  id: string;
  team1Id: string;
  team2Id: string;
  played: boolean;
  score1: number | null;
  score2: number | null;
}

interface ApiGroup {
  id: string;
  name: string;
  category: string;
  matches: ApiMatch[];
}

interface ApiPlayoffMatch {
  id: string;
  roundSize: number;
  matchIndex: number;
  team1Id: string | null;
  team2Id: string | null;
  winnerId: string | null;
  played: boolean;
  isBye: boolean;
}

interface ApiPlayoffBracket {
  id: string;
  category: string;
  matches: ApiPlayoffMatch[];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const tournamentId = getTournamentId();

  console.log("=".repeat(60));
  console.log(DRY_RUN ? "MODE: DRY-RUN (no writes)" : "MODE: REAL RUN");
  console.log(`Tournament: ${tournamentId}`);
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log("=".repeat(60));

  if (!DRY_RUN && !CLUB_PASSWORD) {
    console.error("[ERROR] Set CLUB_PASSWORD env var before running.");
    process.exit(1);
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  let token = "";
  if (!DRY_RUN) {
    console.log("\n[AUTH] Logging in as club...");
    const loginRes = await apiPost("/api/auth/login", {
      email: CLUB_EMAIL,
      password: CLUB_PASSWORD,
    }, "") as { data: { token: string } };
    token = loginRes.data.token;
    if (!token) throw new Error("Login succeeded but token missing in response.data.token");
    console.log("  ✓ JWT obtained");
  }

  // ── Fetch groups ────────────────────────────────────────────────────────────
  console.log("\n[GROUPS] Fetching...");
  let groups: ApiGroup[] = [];
  if (!DRY_RUN) {
    const res = await apiGet(
      `/api/tournaments/${tournamentId}/groups`,
      token
    ) as { data: ApiGroup[] };
    groups = res.data ?? [];
  }
  console.log(`  Found ${groups.length} groups`);

  if (DRY_RUN) {
    console.log("\n[DRY-RUN] Would fill scores for all group matches.");
    console.log("[DRY-RUN] Would then fill all playoff bracket matches.");
    console.log("[DRY-RUN] No writes made. Run without --dry-run to execute.");
    return;
  }

  // ── Fill group match scores ─────────────────────────────────────────────────
  console.log("\n[GROUP SCORES] Filling...");
  let groupMatchCount = 0;
  let groupMatchSkipped = 0;

  for (const group of groups) {
    for (const match of group.matches) {
      if (match.played) {
        groupMatchSkipped++;
        continue;
      }
      if (!match.team1Id || !match.team2Id) {
        console.log(`  SKIP  match=${match.id} (missing team)`);
        continue;
      }
      const score = randomScore();
      await apiPatch(`/api/matches/${match.id}/score`, score, token);
      console.log(
        `  ✓ group="${group.name}" match=${match.id}  ${score.score1}-${score.score2}`
      );
      groupMatchCount++;
    }
  }
  console.log(
    `  Group matches: ${groupMatchCount} filled, ${groupMatchSkipped} already played`
  );

  // ── Fetch playoff brackets ──────────────────────────────────────────────────
  console.log("\n[PLAYOFFS] Fetching brackets...");
  const bracketsRes = (await apiGet(
    `/api/tournaments/${tournamentId}/playoffs`,
    token
  )) as { data: ApiPlayoffBracket[] };
  const brackets = bracketsRes.data ?? [];
  console.log(`  Found ${brackets.length} brackets`);

  // ── Fill playoff match scores ───────────────────────────────────────────────
  console.log("\n[PLAYOFF SCORES] Filling...");
  let playoffCount = 0;
  let playoffSkipped = 0;

  for (const bracket of brackets) {
    // Sort matches: largest roundSize first (outer rounds before final)
    const sorted = [...bracket.matches].sort(
      (a, b) => b.roundSize - a.roundSize || a.matchIndex - b.matchIndex
    );

    for (const match of sorted) {
      if (match.played || match.isBye) {
        playoffSkipped++;
        continue;
      }
      if (!match.team1Id || !match.team2Id) {
        // Teams not seeded yet (waiting for previous round) — skip for now
        console.log(
          `  SKIP  bracket="${bracket.category}" round=${match.roundSize} match=${match.matchIndex} (teams not ready)`
        );
        continue;
      }
      const score = randomScore();
      const winnerId =
        score.score1 > score.score2 ? match.team1Id : match.team2Id;
      await apiPatch(`/api/playoffs/matches/${match.id}`, {
        score1: score.score1,
        score2: score.score2,
        winnerId,
      }, token);
      console.log(
        `  ✓ bracket="${bracket.category}" round=${match.roundSize} idx=${match.matchIndex}  ${score.score1}-${score.score2}`
      );
      playoffCount++;
    }
  }
  console.log(
    `  Playoff matches: ${playoffCount} filled, ${playoffSkipped} skipped`
  );

  console.log("\n[DONE] All scores filled.");
}

main().catch((err) => {
  console.error("\n[ERROR]", err);
  process.exit(1);
});
