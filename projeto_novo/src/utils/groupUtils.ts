// ─── TIPOS ────────────────────────────────────────────────────────────────────
// Re-exportados de types/index.ts — não duplicar aqui

import type { Team, GroupTeam, Match, Group, Set } from "../types";
export type { Team, GroupTeam, Match, Group, Set } from "../types";

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const GROUP_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ─── GERAÇÃO DE GRUPOS ────────────────────────────────────────────────────────

/**
 * Distribui N duplas em grupos seguindo a regra:
 * - N % 3 == 0 → todos com 3
 * - N % 3 == 1 → 2 grupos com 2, resto com 3
 * - N % 3 == 2 → 1 grupo com 2, resto com 3
 * - Caso especial: N == 4 → 1 único grupo com 4
 */
export function distributeTeamsIntoGroups(teams: Team[]): { sizes: number[] } {
  const n = teams.length;

  if (n === 0) return { sizes: [] };
  if (n <= 2) return { sizes: [n] };
  if (n === 4) return { sizes: [4] }; // caso especial: 1 grupo de 4

  const sizes: number[] = [];

  if (n % 3 === 0) {
    // todos grupos com 3
    for (let i = 0; i < n / 3; i++) sizes.push(3);
  } else if (n % 3 === 1) {
    // 2 grupos com 2, resto com 3
    sizes.push(2, 2);
    const remaining = n - 4;
    for (let i = 0; i < remaining / 3; i++) sizes.push(3);
  } else {
    // n % 3 === 2 → 1 grupo com 2, resto com 3
    sizes.push(2);
    const remaining = n - 2;
    for (let i = 0; i < remaining / 3; i++) sizes.push(3);
  }

  return { sizes };
}

/**
 * Gera os jogos dentro de um grupo (todos contra todos)
 * Com 4 duplas usa ordem específica para evitar sequências óbvias
 */
export function generateGroupMatches(
  groupId: string,
  teams: GroupTeam[],
): Match[] {
  const matches: Match[] = [];
  const t = teams;

  if (t.length === 2) {
    matches.push(createMatch(groupId, 0, t[0].team.id, t[1].team.id));
  } else if (t.length === 3) {
    // A×B, B×C, C×A
    matches.push(createMatch(groupId, 0, t[0].team.id, t[1].team.id));
    matches.push(createMatch(groupId, 1, t[1].team.id, t[2].team.id));
    matches.push(createMatch(groupId, 2, t[2].team.id, t[0].team.id));
  } else if (t.length === 4) {
    // A×B, C×D, B×C, D×A, C×A, B×D
    matches.push(createMatch(groupId, 0, t[0].team.id, t[1].team.id));
    matches.push(createMatch(groupId, 1, t[2].team.id, t[3].team.id));
    matches.push(createMatch(groupId, 2, t[1].team.id, t[2].team.id));
    matches.push(createMatch(groupId, 3, t[3].team.id, t[0].team.id));
    matches.push(createMatch(groupId, 4, t[2].team.id, t[0].team.id));
    matches.push(createMatch(groupId, 5, t[1].team.id, t[3].team.id));
  }

  return matches;
}

function createMatch(
  groupId: string,
  index: number,
  team1Id: string,
  team2Id: string,
): Match {
  return {
    id: `${groupId}_m${index}`,
    groupId,
    team1Id,
    team2Id,
    score1: null,
    score2: null,
    played: false,
  };
}

/**
 * Gera os grupos completos para uma categoria a partir de uma lista de duplas.
 * Embaralha as duplas antes de distribuir (sorteio aleatório).
 */
export function generateGroupsForCategory(
  category: string,
  teams: Team[],
  categoryIndex: number, // para letras únicas entre categorias
): Group[] {
  if (teams.length === 0) return [];

  // embaralha (sorteio)
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const { sizes } = distributeTeamsIntoGroups(shuffled);

  const groups: Group[] = [];
  let teamOffset = 0;
  let letterOffset = categoryIndex * 26; // cada categoria começa com letras diferentes se precisar

  sizes.forEach((size, i) => {
    const groupLetter = GROUP_LETTERS[(i + letterOffset) % 26];
    const groupId = `${category.replace(/\s+/g, "_")}_G${groupLetter}`;
    const groupTeams: GroupTeam[] = shuffled
      .slice(teamOffset, teamOffset + size)
      .map((t) => ({
        team: t,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        saldo: 0,
        gamesPlayed: 0,
        qualified: false,
      }));
    teamOffset += size;

    const matches = generateGroupMatches(groupId, groupTeams);

    groups.push({
      id: groupId,
      name: `Grupo ${groupLetter}`,
      category,
      tournamentId: "",
      teams: groupTeams,
      matches,
    });
  });

  return groups;
}

// ─── CÁLCULO DE CLASSIFICAÇÃO ──────────────────────────────────────────────────

/**
 * Recalcula standings de um grupo com base nos resultados das partidas.
 * Critérios de desempate: vitórias → saldo de games → games pró
 */
export function recalculateStandings(group: Group): Group {
  const updatedTeams: GroupTeam[] = group.teams.map((gt) => ({
    ...gt,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    saldo: 0,
    gamesPlayed: 0,
    qualified: false,
  }));

  const teamMap = new Map(updatedTeams.map((gt) => [gt.team.id, gt]));

  for (const match of group.matches) {
    if (!match.played || match.score1 === null || match.score2 === null)
      continue;

    const t1 = teamMap.get(match.team1Id);
    const t2 = teamMap.get(match.team2Id);
    if (!t1 || !t2) continue;

    t1.gamesPlayed++;
    t2.gamesPlayed++;
    t1.pointsFor += match.score1;
    t1.pointsAgainst += match.score2;
    t2.pointsFor += match.score2;
    t2.pointsAgainst += match.score1;
    t1.saldo = t1.pointsFor - t1.pointsAgainst;
    t2.saldo = t2.pointsFor - t2.pointsAgainst;

    if (match.score1 > match.score2) {
      t1.wins++;
      t2.losses++;
    } else if (match.score2 > match.score1) {
      t2.wins++;
      t1.losses++;
    }
  }

  // ordena: vitórias desc → saldo desc → games pró desc
  const sorted = [...updatedTeams].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.saldo !== a.saldo) return b.saldo - a.saldo;
    return b.pointsFor - a.pointsFor;
  });

  // marca classificados
  // - grupos de 4 com apenas 1 grupo na categoria: top 3 classificam
  // - todos os outros: top 2 classificam
  const qualifyCount = group.teams.length === 4 ? 3 : 2;
  sorted.forEach((gt, i) => {
    gt.qualified = i < qualifyCount;
  });

  return { ...group, teams: sorted };
}

/**
 * Calcula a próxima potência de 2 maior ou igual a n
 */
export function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Retorna o nome de uma rodada pelo número total de times no bracket
 */
export function getRoundName(totalInBracket: number, round: number): string {
  const totalRounds = Math.log2(totalInBracket);
  const roundsLeft = totalRounds - round + 1;
  if (roundsLeft === 1) return "Final";
  if (roundsLeft === 2) return "Semifinal";
  if (roundsLeft === 3) return "Quartas de Final";
  if (roundsLeft === 4) return "Oitavas de Final";
  if (roundsLeft === 5) return "16 avos de Final";
  if (roundsLeft === 6) return "32 avos de Final";
  return `Rodada ${round}`;
}

/**
 * Verifica se o torneio já começou (algum jogo de grupo foi jogado)
 */
export function tournamentHasStarted(groups: Group[]): boolean {
  return groups.some((g) => g.matches.some((m) => m.played));
}

// ─── CÁLCULO DE CAPACIDADE ────────────────────────────────────────────────────

/**
 * Calcula jogos necessários para N duplas usando a lógica real de distribuição.
 */
export function calcSlotsNeeded(numTeams: number): number {
  if (numTeams < 2) return 0;

  // Replica a lógica de distributeTeamsIntoGroups sem precisar do tipo Team
  const n = numTeams;
  const sizes: number[] = [];

  if (n <= 2) {
    sizes.push(n);
  } else if (n === 4) {
    sizes.push(4);
  } else if (n % 3 === 0) {
    for (let i = 0; i < n / 3; i++) sizes.push(3);
  } else if (n % 3 === 1) {
    sizes.push(2, 2);
    const remaining = n - 4;
    for (let i = 0; i < remaining / 3; i++) sizes.push(3);
  } else {
    sizes.push(2);
    const remaining = n - 2;
    for (let i = 0; i < remaining / 3; i++) sizes.push(3);
  }

  const matchesPerGroup = (size: number) => (size * (size - 1)) / 2;
  const groupMatches = sizes.reduce((acc, s) => acc + matchesPerGroup(s), 0);
  const classified = sizes.length * 2;
  const bracket = nextPowerOf2(classified);
  const playoffMatches = bracket - 1;

  return groupMatches + playoffMatches;
}

export interface CapacityResult {
  slotsAvailable: number;
  maxTeams: number;
  slotsNeeded: number;
  breakdown: {
    courts: number;
    days: number;
    hoursPerDay: number;
    durationHours: number;
  };
}

/**
 * Calcula capacidade máxima de duplas dado:
 * - courts: número de quadras
 * - daySchedules: array de { startTime, endTime } por dia
 * - matchDurationMinutes: duração de cada jogo em minutos
 */
export function calculateCapacity(
  courts: string[],
  daySchedules: Array<{ startTime: string; endTime: string }>,
  matchDurationMinutes: number,
): CapacityResult | null {
  if (
    courts.length === 0 ||
    daySchedules.length === 0 ||
    matchDurationMinutes <= 0
  ) {
    return null;
  }

  // Calcula horas médias por dia
  const parseHours = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h + (m || 0) / 60;
  };

  const validDays = daySchedules.filter((s) => s.startTime && s.endTime);
  if (validDays.length === 0) return null;

  const totalHours = validDays.reduce((acc, s) => {
    const hours = parseHours(s.endTime) - parseHours(s.startTime);
    return acc + (hours > 0 ? hours : 0);
  }, 0);

  const durationHours = matchDurationMinutes / 60;
  const slotsAvailable = Math.floor(
    (totalHours / durationHours) * courts.length,
  );

  if (slotsAvailable < 1) return null;

  // Itera de 2 até 200 duplas e encontra o máximo que cabe
  let maxTeams = 0;
  let slotsNeeded = 0;
  for (let n = 2; n <= 200; n++) {
    const needed = calcSlotsNeeded(n);
    if (needed > slotsAvailable) break;
    maxTeams = n;
    slotsNeeded = needed;
  }

  return {
    slotsAvailable,
    maxTeams,
    slotsNeeded,
    breakdown: {
      courts: courts.length,
      days: validDays.length,
      hoursPerDay: totalHours / validDays.length,
      durationHours,
    },
  };
}
