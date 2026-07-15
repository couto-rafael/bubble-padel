/**
 * Seed script: Regular tournament + team registrations for Sprint 8.5 smoke test
 * Usage:
 *   npm run seed:tournament:dry   (dry-run — reads CLUB_PASSWORD from backend/.env)
 *   npm run seed:tournament       (real run — reads CLUB_PASSWORD from backend/.env)
 *
 * Requires backend running at BASE_URL (default: http://localhost:3001)
 */

import { PrismaClient, UserType } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient({ log: [] });

const DRY_RUN =
  process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3001";
const CLUB_EMAIL = "rafaelcouto.ca@gmail.com";

// Read CLUB_PASSWORD from backend/.env (never from argv to avoid shell history leaks)
function readClubPassword(): string {
  // Prefer explicit env var (CI / shell export)
  if (process.env.CLUB_PASSWORD) return process.env.CLUB_PASSWORD;

  // Fall back to .env file two directories up from scripts/
  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return "";
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/^CLUB_PASSWORD=(.*)$/m);
  return match ? match[1].trim() : "";
}

const CLUB_PASSWORD = readClubPassword();

// ── Tournament definition ─────────────────────────────────────────────────────
const TODAY = new Date();
const IN_7_DAYS = new Date(TODAY.getTime() + 7 * 24 * 60 * 60 * 1000);

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0] + "T12:00:00";
}

const TOURNAMENT_DEF = {
  name: process.env.TOURNAMENT_NAME ?? "Smoke Test Regular — Sprint 8.5",
  sport: "PADEL",
  startDate: fmtDate(TODAY),
  endDate: fmtDate(IN_7_DAYS),
  categories: ["Open Masculino", "Open Feminino", "Mista"],
  courts: ["Quadra 1", "Quadra 2", "Quadra 3"],
  maxTeams: 64,
  matchDuration: 60,
  description: "Torneio gerado automaticamente para smoke test Sprint 8.5",
  pixKey: "",
  clubSede: "",
};

// ── Real athlete emails ───────────────────────────────────────────────────────
const EMAIL_A = "couto.rafael@gmail.com";
const EMAIL_D = "seed.d@bubble.test";
const EMAIL_E = "seed.e@bubble.test";

// ── Registration plan ─────────────────────────────────────────────────────────
// Build team pairs per category. A, D, E appear in every category.
// Athletes can repeat across categories. Each pair is [player1Email, player2Email].
function buildRegistrationPlan(
  allEmails: string[]
): Record<string, [string, string][]> {
  // Named slots — A, D, E at predictable positions
  const rest = allEmails.filter(
    (e) => e !== EMAIL_A && e !== EMAIL_D && e !== EMAIL_E
  );

  // Helper: take N emails from rest array (cycling if needed)
  let restIdx = 0;
  function take(n: number): string[] {
    const result: string[] = [];
    for (let i = 0; i < n; i++) {
      result.push(rest[restIdx % rest.length]);
      restIdx++;
    }
    return result;
  }

  // Open Masculino — 14 duplas
  const om = take(11 * 2); // 22 filler athletes
  const openMasc: [string, string][] = [
    [EMAIL_A, om[0]],       // A + filler (A's partner)
    [EMAIL_D, om[1]],       // D in same category as A
    [EMAIL_E, om[2]],       // E in same category as A
    [om[3],  om[4]],
    [om[5],  om[6]],
    [om[7],  om[8]],
    [om[9],  om[10]],
    [om[11], om[12]],
    [om[13], om[14]],
    [om[15], om[16]],
    [om[17], om[18]],
    [om[19], om[20]],
    [om[21], rest[restIdx % rest.length]],
    [rest[(restIdx + 1) % rest.length], rest[(restIdx + 2) % rest.length]],
  ];
  restIdx += 3;

  // Open Feminino — 13 duplas
  const of_ = take(10 * 2);
  const openFem: [string, string][] = [
    [EMAIL_A, of_[0]],
    [EMAIL_D, of_[1]],
    [EMAIL_E, of_[2]],
    [of_[3],  of_[4]],
    [of_[5],  of_[6]],
    [of_[7],  of_[8]],
    [of_[9],  of_[10]],
    [of_[11], of_[12]],
    [of_[13], of_[14]],
    [of_[15], of_[16]],
    [of_[17], of_[18]],
    [of_[19], rest[restIdx % rest.length]],
    [rest[(restIdx + 1) % rest.length], rest[(restIdx + 2) % rest.length]],
  ];
  restIdx += 3;

  // Mista — 15 duplas
  const mi = take(12 * 2);
  const mista: [string, string][] = [
    [EMAIL_A, mi[0]],
    [EMAIL_D, mi[1]],
    [EMAIL_E, mi[2]],
    [mi[3],  mi[4]],
    [mi[5],  mi[6]],
    [mi[7],  mi[8]],
    [mi[9],  mi[10]],
    [mi[11], mi[12]],
    [mi[13], mi[14]],
    [mi[15], mi[16]],
    [mi[17], mi[18]],
    [mi[19], mi[20]],
    [mi[21], mi[22]],
    [mi[23], rest[restIdx % rest.length]],
    [rest[(restIdx + 1) % rest.length], rest[(restIdx + 2) % rest.length]],
  ];

  return {
    "Open Masculino": openMasc,
    "Open Feminino": openFem,
    Mista: mista,
  };
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiPost(
  path: string,
  body: unknown,
  token?: string
): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `POST ${path} → ${res.status}: ${JSON.stringify(json)}`
    );
  }
  return json;
}

async function apiPatch(
  path: string,
  body: unknown,
  token?: string
): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `PATCH ${path} → ${res.status}: ${JSON.stringify(json)}`
    );
  }
  return json;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(60));
  console.log(DRY_RUN ? "MODE: DRY-RUN (no API calls)" : "MODE: REAL RUN");
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log("=".repeat(60));

  if (!DRY_RUN && !CLUB_PASSWORD) {
    console.error("[ERROR] CLUB_PASSWORD not found.");
    console.error("  Add  CLUB_PASSWORD=<senha>  to backend/.env and retry.");
    process.exit(1);
  }

  // ── Step 1: Verify club exists ──────────────────────────────────────────────
  console.log(`\n[CLUB] Looking up ${CLUB_EMAIL}...`);
  const clubUser = await prisma.user.findUnique({
    where: { email: CLUB_EMAIL },
    select: { id: true, type: true, club: { select: { id: true, name: true } } },
  });
  if (!clubUser || !clubUser.club) {
    console.error(`  ✗ Club not found for ${CLUB_EMAIL}. Aborting.`);
    process.exit(1);
  }
  const clubId = clubUser.club.id;
  console.log(`  ✓ clubId=${clubId}  name="${clubUser.club.name}"`);

  // ── Step 2: Check if smoke test tournament already exists ───────────────────
  console.log("\n[TOURNAMENT] Checking for existing smoke test tournament...");
  const existing = await prisma.tournament.findFirst({
    where: { clubId, name: TOURNAMENT_DEF.name },
    select: { id: true, status: true },
  });
  if (existing) {
    console.log(
      `  FOUND  id=${existing.id}  status=${existing.status} — will use existing`
    );
  } else {
    console.log(`  NOT FOUND — will create: "${TOURNAMENT_DEF.name}"`);
  }

  // ── Step 3: Build athlete pool ──────────────────────────────────────────────
  console.log("\n[ATHLETES] Loading pool from DB...");
  const athletes = await prisma.user.findMany({
    where: { type: UserType.ATHLETE },
    select: { email: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  const allEmails = athletes.map((a) => a.email);
  const nameByEmail: Record<string, string> = {};
  athletes.forEach((a) => { nameByEmail[a.email] = a.name; });
  console.log(`  Found ${allEmails.length} athletes in DB`);

  // Verify A, D, E exist in pool
  for (const email of [EMAIL_A, EMAIL_D, EMAIL_E]) {
    if (!allEmails.includes(email)) {
      console.error(`  ✗ Required athlete ${email} not in pool. Aborting.`);
      console.error("    Run npm run seed:smoke first.");
      process.exit(1);
    }
  }
  console.log(`  ✓ A (${EMAIL_A}), D (${EMAIL_D}), E (${EMAIL_E}) confirmed in pool`);

  // ── Step 4: Build registration plan ────────────────────────────────────────
  const plan = buildRegistrationPlan(allEmails);
  console.log("\n[REGISTRATION PLAN]");
  for (const [cat, pairs] of Object.entries(plan)) {
    console.log(`  ${cat}: ${pairs.length} duplas`);
    const aEntry = pairs.find(([p1, p2]) => p1 === EMAIL_A || p2 === EMAIL_A);
    const dEntry = pairs.find(([p1, p2]) => p1 === EMAIL_D || p2 === EMAIL_D);
    const eEntry = pairs.find(([p1, p2]) => p1 === EMAIL_E || p2 === EMAIL_E);
    if (aEntry) console.log(`    A paired with: ${aEntry.find((e) => e !== EMAIL_A)}`);
    if (dEntry) console.log(`    D paired with: ${dEntry.find((e) => e !== EMAIL_D)}`);
    if (eEntry) console.log(`    E paired with: ${eEntry.find((e) => e !== EMAIL_E)}`);
  }

  if (DRY_RUN) {
    console.log("\n[DRY-RUN SUMMARY]");

    // Routes
    console.log("\n  Routes to be called:");
    console.log(`    POST   ${BASE_URL}/api/auth/login`);
    if (!existing) {
      console.log(`    POST   ${BASE_URL}/api/tournaments`);
    } else {
      console.log(`    POST   ${BASE_URL}/api/tournaments  → SKIP (tournament exists)`);
    }
    const currentStatus = existing?.status ?? "DRAFT";
    if (currentStatus !== "OPEN") {
      console.log(`    PATCH  ${BASE_URL}/api/tournaments/<id>  { status: "OPEN" }`);
    } else {
      console.log(`    PATCH  ${BASE_URL}/api/tournaments/<id>  → SKIP (already OPEN)`);
    }
    console.log(`    POST   ${BASE_URL}/api/public/tournaments/<id>/register  (public, per dupla)`);

    // Tournament
    console.log("\n  Tournament:");
    console.log(`    name:       "${TOURNAMENT_DEF.name}"`);
    console.log(`    status flow: ${currentStatus} → OPEN`);
    console.log(`    categories: ${TOURNAMENT_DEF.categories.join(", ")}`);

    // Per-category detail
    console.log("\n  Registration plan:");
    for (const [cat, pairs] of Object.entries(plan)) {
      const aEntry = pairs.find(([p1, p2]) => p1 === EMAIL_A || p2 === EMAIL_A);
      const dEntry = pairs.find(([p1, p2]) => p1 === EMAIL_D || p2 === EMAIL_D);
      const eEntry = pairs.find(([p1, p2]) => p1 === EMAIL_E || p2 === EMAIL_E);

      const aPartner = aEntry?.find((e) => e !== EMAIL_A) ?? "—";
      const dPartner = dEntry?.find((e) => e !== EMAIL_D) ?? "—";
      const ePartner = eEntry?.find((e) => e !== EMAIL_E) ?? "—";

      // Verify A, D, E are in separate duplas (different partners, different rows)
      const aIdx  = pairs.findIndex(([p1, p2]) => p1 === EMAIL_A || p2 === EMAIL_A);
      const dIdx  = pairs.findIndex(([p1, p2]) => p1 === EMAIL_D || p2 === EMAIL_D);
      const eIdx  = pairs.findIndex(([p1, p2]) => p1 === EMAIL_E || p2 === EMAIL_E);
      const separated = aIdx !== dIdx && aIdx !== eIdx && dIdx !== eIdx
        && aPartner !== EMAIL_D && aPartner !== EMAIL_E
        && dPartner !== EMAIL_A && ePartner !== EMAIL_A;

      console.log(`\n    ── ${cat} (${pairs.length} duplas) ──`);
      console.log(`    dupla A  [${aIdx}]: ${EMAIL_A} ↔ ${aPartner}`);
      console.log(`    dupla D  [${dIdx}]: ${EMAIL_D} ↔ ${dPartner}`);
      console.log(`    dupla E  [${eIdx}]: ${EMAIL_E} ↔ ${ePartner}`);
      console.log(`    A, D, E em duplas separadas: ${separated ? "✓ SIM" : "✗ NÃO — REVISAR"}`);
      console.log(`    Amostra (primeiras 3 + última):`);
      pairs.slice(0, 3).forEach(([p1, p2], i) =>
        console.log(`      [${i}] ${p1} ↔ ${p2}`)
      );
      if (pairs.length > 3) {
        const last = pairs.length - 1;
        console.log(`      ... (${pairs.length - 4} omitidas)`);
        console.log(`      [${last}] ${pairs[last][0]} ↔ ${pairs[last][1]}`);
      }
    }

    const total = Object.values(plan).reduce((s, p) => s + p.length, 0);
    console.log(`\n  Total registrations: ${total} duplas (${total * 2} atleta-slots)`);
    console.log("\n[DRY-RUN] No API calls made. Set CLUB_PASSWORD and run without --dry-run.");
    return;
  }

  // ── Step 5: Login as club ───────────────────────────────────────────────────
  console.log("\n[AUTH] Logging in as club...");
  const loginRes = await apiPost("/api/auth/login", {
    email: CLUB_EMAIL,
    password: CLUB_PASSWORD,
  }) as { data: { token: string } };
  const token = loginRes.data.token;
  if (!token) throw new Error("Login succeeded but token missing in response.data.token");
  console.log(`  ✓ JWT obtained`);

  // ── Step 6: Create or reuse tournament ─────────────────────────────────────
  let tournamentId: string;
  if (existing) {
    tournamentId = existing.id;
    console.log(`\n[TOURNAMENT] Reusing existing id=${tournamentId}`);
  } else {
    console.log("\n[TOURNAMENT] Creating...");
    const created = await apiPost("/api/tournaments", TOURNAMENT_DEF, token) as {
      data: { id: string };
    };
    tournamentId = created.data.id;
    console.log(`  ✓ Created  id=${tournamentId}`);
  }

  // ── Step 7: Flip to OPEN if not already ────────────────────────────────────
  const currentStatus = existing?.status ?? "DRAFT";
  if (currentStatus !== "OPEN") {
    console.log(`\n[STATUS] Changing ${currentStatus} → OPEN...`);
    await apiPatch(`/api/tournaments/${tournamentId}`, { status: "OPEN" }, token);
    console.log("  ✓ Status = OPEN");
  } else {
    console.log("\n[STATUS] Already OPEN — skipping");
  }

  // ── Step 8: Register teams ──────────────────────────────────────────────────
  console.log("\n[REGISTRATIONS] Starting...");
  const counts: Record<string, { created: number; skipped: number }> = {};

  for (const [category, pairs] of Object.entries(plan)) {
    counts[category] = { created: 0, skipped: 0 };

    // Load existing teams for this category to enable idempotency
    const existingTeams = await prisma.team.findMany({
      where: { tournamentId, category },
      select: { player1Email: true, player2Email: true },
    });
    const existingSet = new Set(
      existingTeams.map((t) =>
        [t.player1Email, t.player2Email].sort().join("|")
      )
    );

    // Use Prisma directly — public register endpoint has a 5 req/hr rate limiter
    // which makes it unusable for bulk seeding from the same IP.
    const teamsToCreate = pairs.filter(([p1Email, p2Email]) => {
      const key = [p1Email, p2Email].sort().join("|");
      return !existingSet.has(key);
    });

    if (teamsToCreate.length > 0) {
      await prisma.$transaction(
        teamsToCreate.map(([p1Email, p2Email]) =>
          prisma.team.create({
            data: {
              tournamentId,
              category,
              player1Name: nameByEmail[p1Email] ?? p1Email.split("@")[0],
              player1Email: p1Email,
              player2Name: nameByEmail[p2Email] ?? p2Email.split("@")[0],
              player2Email: p2Email,
            },
          })
        ),
        { timeout: 30000 }
      );
      counts[category].created = teamsToCreate.length;
    }
    counts[category].skipped = pairs.length - teamsToCreate.length;

    console.log(
      `  ${category}: ${counts[category].created} created, ${counts[category].skipped} skipped`
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n[DONE]");
  console.log(`  Tournament id: ${tournamentId}`);
  const total = Object.values(counts).reduce((s, c) => s + c.created + c.skipped, 0);
  console.log(`  Total registrations: ${total} (${Object.values(counts).reduce((s, c) => s + c.created, 0)} new)`);
}

main()
  .catch((err) => {
    console.error("\n[ERROR]", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
