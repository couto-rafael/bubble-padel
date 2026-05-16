/**
 * Seed script: smoke test athletes for Sprint 8.5
 * Usage:
 *   npm run seed:smoke:dry   (dry-run, no writes)
 *   npm run seed:smoke       (real run, transactional)
 */

import { PrismaClient, FriendshipStatus, UserType } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient({ log: [] });

const DRY_RUN =
  process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

// ── Real athletes to verify ──────────────────────────────────────────────────
const REAL_EMAILS = {
  A: "couto.rafael@gmail.com",
  B: "saradesouzaad@gmail.com",
  C: "vovosilviacouto1111@gmail.com",
};

// ── Seed athletes to create ──────────────────────────────────────────────────
const SEED_DEFS = [
  { email: "seed.d@bubble.test",     firstName: "Atleta D", lastName: "Seed"  },
  { email: "seed.e@bubble.test",     firstName: "Atleta E", lastName: "Seed"  },
  { email: "seed.f@bubble.test",     firstName: "Atleta F", lastName: "Seed"  },
  { email: "seed.g@bubble.test",     firstName: "Atleta G", lastName: "Seed"  },
  { email: "seed.joana@bubble.test", firstName: "Joana",    lastName: "Silva" },
  { email: "seed.maria@bubble.test", firstName: "Maria",    lastName: "Souza" },
];

// Friendships to ensure: A↔D, A↔E
const FRIENDSHIP_PAIRS = ["seed.d@bubble.test", "seed.e@bubble.test"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function randomHash(): string {
  const random = crypto.randomBytes(32).toString("hex");
  return bcrypt.hashSync(random, 10);
}

async function findAthleteByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, athlete: { select: { id: true } } },
  });
  return user;
}

async function findFriendship(aId: string, bId: string) {
  return prisma.athleteFriendship.findFirst({
    where: {
      OR: [
        { senderId: aId, receiverId: bId },
        { senderId: bId, receiverId: aId },
      ],
    },
    select: { id: true, status: true },
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(60));
  console.log(DRY_RUN ? "MODE: DRY-RUN (no writes)" : "MODE: REAL RUN");
  console.log("=".repeat(60));

  // ── Step 1: Schema findings report ─────────────────────────────────────────
  console.log("\n[SCHEMA] Required fields found:");
  console.log("  User:             email, passwordHash, name, type (UserType)");
  console.log("  Athlete:          userId, fullName");
  console.log("  AthleteFriendship: senderId, receiverId");
  console.log("  Defaults used for seed athletes:");
  console.log("    fullName  → '<firstName> <lastName>'");
  console.log("    settings  → {} (schema default, not passed)");
  console.log("    all other Athlete fields → null/optional (schema allows)");

  // ── Step 2: Verify real athletes ────────────────────────────────────────────
  console.log("\n[REAL ATHLETES] Verifying existence...");
  const realUsers: Record<string, { userId: string; athleteId: string }> = {};

  for (const [label, email] of Object.entries(REAL_EMAILS)) {
    const user = await findAthleteByEmail(email);
    if (!user || !user.athlete) {
      console.error(`  ✗ ${label} (${email}) — NOT FOUND. Aborting.`);
      process.exit(1);
    }
    realUsers[label] = { userId: user.id, athleteId: user.athlete.id };
    console.log(`  ✓ ${label}  userId=${user.id}  athleteId=${user.athlete.id}  (${email})`);
  }

  // ── Step 3: Check A↔B friendship ───────────────────────────────────────────
  console.log("\n[FRIENDSHIP A↔B] Checking status...");
  const abFriendship = await findFriendship(
    realUsers.A.athleteId,
    realUsers.B.athleteId
  );
  if (!abFriendship) {
    console.log("  status: NOT FOUND (expected ACCEPTED — investigate before proceeding)");
  } else {
    const expected = abFriendship.status === "ACCEPTED" ? "✓" : "⚠";
    console.log(`  ${expected} id=${abFriendship.id}  status=${abFriendship.status}  (expected: ACCEPTED)`);
  }

  // ── Step 4: Check which seed athletes already exist ─────────────────────────
  console.log("\n[SEED ATHLETES] Checking existence...");
  const toCreate: typeof SEED_DEFS = [];
  const alreadyExist: Array<{ email: string; athleteId: string }> = [];

  for (const def of SEED_DEFS) {
    const user = await findAthleteByEmail(def.email);
    if (user?.athlete) {
      alreadyExist.push({ email: def.email, athleteId: user.athlete.id });
      console.log(`  SKIP  ${def.email}  (already exists, athleteId=${user.athlete.id})`);
    } else {
      toCreate.push(def);
      console.log(`  CREATE ${def.email}  → '${def.firstName} ${def.lastName}'`);
    }
  }

  // ── Step 5: Check which friendships already exist ───────────────────────────
  console.log("\n[FRIENDSHIPS A↔D, A↔E] Checking existence...");

  // Build a map of email → athleteId for all seed athletes (existing + would-be-created)
  const seedEmailToAthleteId: Record<string, string | null> = {};
  for (const e of alreadyExist) {
    seedEmailToAthleteId[e.email] = e.athleteId;
  }
  for (const def of toCreate) {
    seedEmailToAthleteId[def.email] = null; // will be created
  }

  const friendshipsToCreate: string[] = [];
  const friendshipsExisting: string[] = [];

  for (const seedEmail of FRIENDSHIP_PAIRS) {
    const existingAthleteId = seedEmailToAthleteId[seedEmail];
    if (existingAthleteId) {
      const existing = await findFriendship(realUsers.A.athleteId, existingAthleteId);
      if (existing) {
        friendshipsExisting.push(`A ↔ ${seedEmail}  (status=${existing.status})`);
        console.log(`  SKIP  A ↔ ${seedEmail}  (already exists, status=${existing.status})`);
      } else {
        friendshipsToCreate.push(seedEmail);
        console.log(`  CREATE  A ↔ ${seedEmail}`);
      }
    } else {
      friendshipsToCreate.push(seedEmail);
      console.log(`  CREATE  A ↔ ${seedEmail}  (athlete will be created)`);
    }
  }

  // ── Dry-run: stop here ──────────────────────────────────────────────────────
  if (DRY_RUN) {
    console.log("\n[DRY-RUN SUMMARY]");
    console.log(`  Athletes to create: ${toCreate.length}`);
    toCreate.forEach((d) => console.log(`    - ${d.email}`));
    console.log(`  Athletes to skip (already exist): ${alreadyExist.length}`);
    alreadyExist.forEach((e) => console.log(`    - ${e.email}`));
    console.log(`  Friendships to create: ${friendshipsToCreate.length}`);
    friendshipsToCreate.forEach((e) => console.log(`    - A ↔ ${e}`));
    console.log(`  Friendships to skip: ${friendshipsExisting.length}`);
    friendshipsExisting.forEach((s) => console.log(`    - ${s}`));
    console.log("\n[DRY-RUN] No writes performed. Run without --dry-run to execute.");
    return;
  }

  // ── Real run: transactional ─────────────────────────────────────────────────
  if (toCreate.length === 0 && friendshipsToCreate.length === 0) {
    console.log("\n[RUN] Nothing to create. All records already exist.");
    return;
  }

  // Pre-compute all bcrypt hashes BEFORE opening the transaction.
  // bcrypt.hashSync is CPU-blocking and would cause a transaction timeout on Neon/pgBouncer.
  console.log("\n[RUN] Pre-computing password hashes...");
  const hashMap: Record<string, string> = {};
  for (const def of toCreate) {
    hashMap[def.email] = randomHash();
    console.log(`  hashed  ${def.email}`);
  }

  console.log("\n[RUN] Executing transaction...");

  const createdAthletes: Array<{ email: string; userId: string; athleteId: string }> = [];

  await prisma.$transaction(async (tx) => {
    // Create missing seed athletes
    for (const def of toCreate) {
      const fullName = `${def.firstName} ${def.lastName}`;
      const user = await tx.user.create({
        data: {
          email: def.email,
          passwordHash: hashMap[def.email],
          name: fullName,
          type: UserType.ATHLETE,
          athlete: {
            create: {
              fullName,
              firstName: def.firstName,
              lastName: def.lastName,
            },
          },
        },
        select: {
          id: true,
          email: true,
          athlete: { select: { id: true } },
        },
      });
      createdAthletes.push({
        email: user.email,
        userId: user.id,
        athleteId: user.athlete!.id,
      });
      console.log(
        `  ✓ Created  ${user.email}  userId=${user.id}  athleteId=${user.athlete!.id}`
      );
    }

    // Build final email→athleteId map (existing + newly created)
    const finalMap: Record<string, string> = {};
    for (const e of alreadyExist) {
      finalMap[e.email] = e.athleteId;
    }
    for (const c of createdAthletes) {
      finalMap[c.email] = c.athleteId;
    }

    // Create missing friendships
    for (const seedEmail of friendshipsToCreate) {
      const seedAthleteId = finalMap[seedEmail];
      if (!seedAthleteId) {
        throw new Error(`Could not resolve athleteId for ${seedEmail}`);
      }
      const friendship = await tx.athleteFriendship.create({
        data: {
          senderId: realUsers.A.athleteId,
          receiverId: seedAthleteId,
          status: FriendshipStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
        select: { id: true },
      });
      console.log(
        `  ✓ Friendship  A ↔ ${seedEmail}  id=${friendship.id}  status=ACCEPTED`
      );
    }
  }, { timeout: 30000 });

  console.log("\n[RUN] Transaction committed successfully.");
  console.log(`  Athletes created: ${createdAthletes.length}`);
  console.log(`  Friendships created: ${friendshipsToCreate.length}`);
}

main()
  .catch((err) => {
    console.error("\n[ERROR]", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
