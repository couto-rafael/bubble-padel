// ─── scheduleUtils.ts ─────────────────────────────────────────────────────────
// Utilitários para seeding de playoffs e geração automática de schedule

import type { Group } from "../types";
import type { PlayoffMatchData } from "../services/api";

// ─── TIPOS PÚBLICOS ───────────────────────────────────────────────────────────

export interface DaySchedule {
  date: string; // "2025-03-15"
  startTime: string; // "08:00"
  endTime: string; // "20:00"
}

export interface SeedEntry {
  teamId: string | null;
  label: string;
  isBye: boolean;
}

export interface ScheduleEntry {
  matchId: string;
  court: string;
  date: string;
  time: string;
}

// ─── SEEDS & BRACKET ─────────────────────────────────────────────────────────

/** Constrói a lista ordenada de seeds a partir dos grupos de uma categoria */
export function buildSeeds(catGroups: Group[]): SeedEntry[] {
  const smallGroups = catGroups.filter((g) => g.teams.length <= 2);
  const normalGroups = catGroups.filter((g) => g.teams.length > 2);
  const seeds: SeedEntry[] = [];

  // 1° lugares dos grupos pequenos (top seeds, ganham BYE)
  for (const g of smallGroups) {
    seeds.push({ teamId: null, label: `1° ${g.name}`, isBye: false });
  }
  // 2° lugares dos grupos pequenos
  for (const g of smallGroups) {
    seeds.push({ teamId: null, label: `2° ${g.name}`, isBye: false });
  }
  // 1° lugares dos grupos normais
  for (const g of normalGroups) {
    seeds.push({ teamId: null, label: `1° ${g.name}`, isBye: false });
  }
  // 2° lugares dos grupos normais (invertidos e embaralhados em pares)
  const seconds = normalGroups.map((g) => ({
    teamId: null,
    label: `2° ${g.name}`,
    isBye: false,
  }));
  seconds.reverse();
  for (let i = 0; i + 1 < seconds.length; i += 2) {
    [seconds[i], seconds[i + 1]] = [seconds[i + 1], seconds[i]];
  }
  seeds.push(...seconds);

  return seeds;
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function bracketPositions(size: number): number[] {
  if (size === 1) return [1];
  const prev = bracketPositions(size / 2);
  return prev.flatMap((s) => [s, size + 1 - s]);
}

/** Gera todas as partidas do bracket a partir dos seeds */
export function generateBracketMatches(
  seeds: SeedEntry[],
): Omit<PlayoffMatchData, "id" | "bracketId">[] {
  const n = seeds.length;
  if (n < 2) return [];

  const totalSlots = nextPow2(n);
  const positions = bracketPositions(totalSlots);
  const allSeeds: SeedEntry[] = [
    ...seeds,
    ...Array(totalSlots - n).fill({ teamId: null, label: "BYE", isBye: true }),
  ];
  const seedMap: Record<number, SeedEntry> = {};
  positions.forEach((seedNum, posIdx) => {
    seedMap[posIdx] = allSeeds[seedNum - 1];
  });

  const matches: Omit<PlayoffMatchData, "id" | "bracketId">[] = [];
  const firstRoundSize = totalSlots / 2;

  // Primeira rodada
  for (let i = 0; i < firstRoundSize; i++) {
    const s1 = seedMap[i * 2];
    const s2 = seedMap[i * 2 + 1];
    const isByeMatch = s1.isBye || s2.isBye;
    matches.push({
      roundSize: firstRoundSize,
      matchIndex: i,
      team1Id: null,
      team2Id: null,
      team1Label: s1.isBye ? null : s1.label,
      team2Label: s2.isBye ? null : s2.label,
      score1: null,
      score2: null,
      winnerId: null,
      isBye: isByeMatch,
      played: isByeMatch,
    });
  }

  // Rodadas seguintes (SF, F)
  for (let roundSize = firstRoundSize / 2; roundSize >= 1; roundSize /= 2) {
    for (let i = 0; i < roundSize; i++) {
      matches.push({
        roundSize,
        matchIndex: i,
        team1Id: null,
        team2Id: null,
        team1Label: null,
        team2Label: null,
        score1: null,
        score2: null,
        winnerId: null,
        isBye: false,
        played: false,
      });
    }
  }

  return matches;
}

// ─── AUTO SCHEDULE ────────────────────────────────────────────────────────────

interface GroupMatchInput {
  id: string;
  team1Id: string;
  team2Id: string;
  category: string;
}

interface PlayoffMatchInput {
  id: string;
  roundSize: number;
  isBye: boolean;
}

interface PlayoffBracketInput {
  category: string;
  matches: PlayoffMatchInput[];
}

/** Embaralha array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Gera a lista de datas entre startDate e endDate (inclusive).
 * Formato esperado: "YYYY-MM-DD"
 */
export function buildDaySchedules(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
): DaySchedule[] {
  const days: DaySchedule[] = [];
  const start = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  const cur = new Date(start);

  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    days.push({
      date: `${y}-${m}-${d}`,
      startTime,
      endTime,
    });
    cur.setDate(cur.getDate() + 1);
  }

  return days;
}

/** Gera slots { date, time, court } em ordem cronológica */
function generateSlots(
  courts: string[],
  daySchedules: DaySchedule[],
  durationMin: number,
): Array<{ date: string; time: string; court: string }> {
  const slots: Array<{ date: string; time: string; court: string }> = [];
  for (const day of daySchedules) {
    const startMin = timeToMinutes(day.startTime);
    const endMin = timeToMinutes(day.endTime);
    for (let t = startMin; t + durationMin <= endMin; t += durationMin) {
      for (const court of courts) {
        slots.push({ date: day.date, time: minutesToTime(t), court });
      }
    }
  }
  return slots;
}

/**
 * Gera schedule automático para todos os jogos do torneio.
 *
 * Regras:
 * - Jogos de grupos: embaralhados aleatoriamente entre todas as categorias
 * - Jogos de playoffs: sempre após os jogos de grupo, ordenados por rodada (R1 → F)
 * - Conflito de atletas: mesmo atleta não joga em dois slots simultâneos
 */
export function generateAutoSchedule(
  groupMatches: GroupMatchInput[],
  playoffBrackets: PlayoffBracketInput[],
  courts: string[],
  daySchedules: DaySchedule[],
  durationMin: number,
): ScheduleEntry[] {
  if (courts.length === 0 || daySchedules.length === 0 || durationMin <= 0) {
    return [];
  }

  // 1. Gera todos os slots disponíveis
  const slots = generateSlots(courts, daySchedules, durationMin);
  if (slots.length === 0) return [];

  // 2. Ordem dos jogos:
  //    a) Grupos: embaralhados aleatoriamente
  //    b) Playoffs: por categoria, depois por rodada (maior roundSize primeiro = R1 vem antes de F)
  const shuffledGroup = shuffle(groupMatches);

  const playoffOrder: Array<{ id: string }> = [];
  for (const bracket of playoffBrackets) {
    const nonBye = bracket.matches
      .filter((m) => !m.isBye)
      .sort((a, b) => b.roundSize - a.roundSize); // R1 (8) antes de F (1)
    for (const m of nonBye) {
      playoffOrder.push({ id: m.id });
    }
  }

  const orderedMatches: Array<{
    id: string;
    team1Id?: string;
    team2Id?: string;
  }> = [
    ...shuffledGroup.map((m) => ({
      id: m.id,
      team1Id: m.team1Id,
      team2Id: m.team2Id,
    })),
    ...playoffOrder,
  ];

  // 3. Atribuição gulosa de slots com verificação de conflito de atletas
  //    playerSlots[`date|time`] = Set de teamIds naquele horário
  const playerSlots: Record<string, Set<string>> = {};
  const usedSlots = new Set<string>(); // `date|time|court`

  const result: ScheduleEntry[] = [];

  for (const match of orderedMatches) {
    let assigned = false;

    for (let si = 0; si < slots.length; si++) {
      const slot = slots[si];
      const slotKey = `${slot.date}|${slot.time}|${slot.court}`;
      const timeKey = `${slot.date}|${slot.time}`;

      if (usedSlots.has(slotKey)) continue;

      // Verificar conflito de atletas
      if (match.team1Id || match.team2Id) {
        const existing = playerSlots[timeKey] ?? new Set<string>();
        if (
          (match.team1Id && existing.has(match.team1Id)) ||
          (match.team2Id && existing.has(match.team2Id))
        ) {
          continue;
        }
      }

      // Atribuir slot
      usedSlots.add(slotKey);
      if (!playerSlots[timeKey]) playerSlots[timeKey] = new Set();
      if (match.team1Id) playerSlots[timeKey].add(match.team1Id);
      if (match.team2Id) playerSlots[timeKey].add(match.team2Id);

      result.push({
        matchId: match.id,
        court: slot.court,
        date: slot.date,
        time: slot.time,
      });
      assigned = true;
      break;
    }

    if (!assigned) {
      console.warn(`[schedule] Sem slot disponível para jogo ${match.id}`);
    }
  }

  return result;
}

// ─── AUTO SCHEDULE — APENAS PLAYOFFS ─────────────────────────────────────────

export interface ExistingSchedule {
  [matchId: string]: { court: string; date: string; time: string };
}

export interface PlayoffBracketFull {
  category: string;
  matches: Array<{
    id: string;
    roundSize: number;
    isBye: boolean;
    played: boolean;
    team1Id: string | null;
    team2Id: string | null;
  }>;
}

/**
 * Atribui slots automaticamente apenas aos jogos de playoff que ainda não têm
 * agendamento. Respeita os slots já ocupados (grupos + playoffs já agendados).
 *
 * Ordem: categorias na ordem que aparecem, dentro de cada categoria por rodada
 * (R1 → Quartas → Semis → Final). Jogos de fases anteriores são agendados
 * antes dos seguintes para garantir sequência lógica do campeonato.
 */
export function autoSchedulePlayoffMatches(
  brackets: PlayoffBracketFull[],
  existingSchedule: ExistingSchedule,
  courts: string[],
  daySchedules: DaySchedule[],
  durationMin: number,
): ScheduleEntry[] {
  if (courts.length === 0 || daySchedules.length === 0 || durationMin <= 0) {
    return [];
  }

  // 1. Gera todos os slots possíveis
  const allSlots = generateSlots(courts, daySchedules, durationMin);
  if (allSlots.length === 0) return [];

  // 2. Marca slots já ocupados pelo schedule existente
  const usedSlots = new Set<string>();
  for (const s of Object.values(existingSchedule)) {
    if (s.court && s.date && s.time) {
      usedSlots.add(`${s.date}|${s.time}|${s.court}`);
    }
  }

  // 3. Encontra a última data/hora ocupada para saber a partir de onde
  //    colocar os playoffs (após os grupos)
  let lastOccupiedIdx = -1;
  for (let i = 0; i < allSlots.length; i++) {
    const key = `${allSlots[i].date}|${allSlots[i].time}|${allSlots[i].court}`;
    if (usedSlots.has(key)) lastOccupiedIdx = i;
  }

  // Playoffs começam no próximo slot após o último ocupado
  // (ou do início se não há nada agendado)
  const startIdx = lastOccupiedIdx + 1;

  // 4. Filtra jogos de playoff que precisam de agendamento
  //    Ordena: por categoria → por roundSize desc (R1 antes de Final)
  const toSchedule: Array<{
    id: string;
    team1Id: string | null;
    team2Id: string | null;
    roundSize: number;
    category: string;
  }> = [];

  for (const bracket of brackets) {
    const nonByeUnscheduled = bracket.matches
      .filter((m) => !m.isBye && !existingSchedule[m.id])
      .sort((a, b) => b.roundSize - a.roundSize); // R1 → SF → F

    for (const m of nonByeUnscheduled) {
      toSchedule.push({
        id: m.id,
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        roundSize: m.roundSize,
        category: bracket.category,
      });
    }
  }

  if (toSchedule.length === 0) return [];

  // 5. Atribuição gulosa a partir de startIdx
  //    Jogos da mesma fase podem ser paralelos (quadras diferentes)
  //    Jogos de fases seguintes só depois de todos da fase anterior agendados
  const result: ScheduleEntry[] = [];
  const playerSlots: Record<string, Set<string>> = {};

  // Agrupa por fase para garantir sequência: todos os jogos de R1 antes de SF
  const byRound = toSchedule.reduce<Record<number, typeof toSchedule>>(
    (acc, m) => {
      if (!acc[m.roundSize]) acc[m.roundSize] = [];
      acc[m.roundSize].push(m);
      return acc;
    },
    {},
  );

  // Ordena fases: maior roundSize primeiro (R1=8 → QF=4 → SF=2 → F=1)
  const sortedRounds = Object.keys(byRound)
    .map(Number)
    .sort((a, b) => b - a);

  // Índice de slot corrente — avança por fase para garantir sequência
  let slotCursor = startIdx;

  for (const roundSize of sortedRounds) {
    const roundMatches = byRound[roundSize];
    const roundStartCursor = slotCursor;

    for (const match of roundMatches) {
      let assigned = false;

      for (let si = roundStartCursor; si < allSlots.length; si++) {
        const slot = allSlots[si];
        const slotKey = `${slot.date}|${slot.time}|${slot.court}`;
        const timeKey = `${slot.date}|${slot.time}`;

        if (usedSlots.has(slotKey)) continue;

        // Conflito de atletas (apenas se já sabemos os teams)
        if (match.team1Id || match.team2Id) {
          const existing = playerSlots[timeKey] ?? new Set<string>();
          if (
            (match.team1Id && existing.has(match.team1Id)) ||
            (match.team2Id && existing.has(match.team2Id))
          ) {
            continue;
          }
        }

        // Atribuir
        usedSlots.add(slotKey);
        if (!playerSlots[timeKey]) playerSlots[timeKey] = new Set();
        if (match.team1Id) playerSlots[timeKey].add(match.team1Id);
        if (match.team2Id) playerSlots[timeKey].add(match.team2Id);

        result.push({
          matchId: match.id,
          court: slot.court,
          date: slot.date,
          time: slot.time,
        });
        // Avança o cursor geral para além do último slot usado
        if (si >= slotCursor) slotCursor = si + 1;
        assigned = true;
        break;
      }

      if (!assigned) {
        console.warn(
          `[schedule] Sem slot disponível para playoff ${match.id} (${match.category} R${roundSize})`,
        );
      }
    }
  }

  return result;
}
