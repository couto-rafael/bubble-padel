// fix-imports.mjs
// Roda na raiz do projeto: node fix-imports.mjs
// Corrige todos os imports após mover arquivos para pages/ e components/

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const SRC = "./projeto_novo/src";

const COMPONENTS = [
  "Toast", "ErrorBoundary", "ScoreModal", "PaymentModal", "MobileMenu",
  "Footer", "DashboardHeader", "AthleteHeader", "OnboardingChecklist",
  "AuthModal", "TabGrupos", "TabInscricoes", "TabJogos", "TabPlayoffs",
];

const PAGES = [
  "Home", "Tournaments", "TournamentProfile", "Contact", "ClubDashboard",
  "ClubProfile", "ClubDashboardProfile", "ClubSettings", "MyTournaments",
  "CreateTournament", "EditTournament", "AthleteDashboard", "AthleteProfile",
  "TermsPage", "PaymentPage",
];

// Gera replacements para ambos os prefixos: ./ e ../
const REPLACEMENTS = [];

for (const name of COMPONENTS) {
  REPLACEMENTS.push(
    [new RegExp(`from ["']\\.\\/${name}["']`, "g"), `from "../components/${name}"`],
    [new RegExp(`from ["']\\.\\.\\/${name}["']`, "g"), `from "../components/${name}"`],
  );
}

for (const name of PAGES) {
  REPLACEMENTS.push(
    [new RegExp(`from ["']\\.\\/${name}["']`, "g"), `from "../pages/${name}"`],
    [new RegExp(`from ["']\\.\\.\\/${name}["']`, "g"), `from "../pages/${name}"`],
  );
}

// Shared
REPLACEMENTS.push(
  [/from ["']\.\.?\/hooks["']/g,                 `from "../hooks"`],
  [/from ["']\.\.?\/types["']/g,                 `from "../types"`],
  [/from ["']\.\.?\/services\/api["']/g,         `from "../services/api"`],
  [/from ["']\.\.?\/contexts\/AuthContext["']/g, `from "../contexts/AuthContext"`],
  [/from ["']\.\.?\/utils\/groupUtils["']/g,     `from "../utils/groupUtils"`],
  [/from ["']\.\.?\/utils\/scheduleUtils["']/g,  `from "../utils/scheduleUtils"`],
);

const TARGET_DIRS = [
  join(SRC, "pages"),
  join(SRC, "components"),
];

function getAllFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...getAllFiles(full));
    } else if ([".ts", ".tsx"].includes(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

let totalFixed = 0;

for (const dir of TARGET_DIRS) {
  let files;
  try {
    files = getAllFiles(dir);
  } catch {
    console.log(`⚠️  Pasta não encontrada: ${dir} — pulando`);
    continue;
  }

  for (const file of files) {
    let content = readFileSync(file, "utf-8");
    let changed = false;

    for (const [pattern, replacement] of REPLACEMENTS) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }

    if (changed) {
      writeFileSync(file, content, "utf-8");
      console.log(`✅ ${file.replace(SRC, "src")}`);
      totalFixed++;
    }
  }
}

console.log(`\n🎉 ${totalFixed} arquivo(s) corrigido(s).`);
console.log(`   Rode: cd projeto_novo && npm run dev`);
