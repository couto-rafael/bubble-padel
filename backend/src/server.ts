import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import { authRoutes } from "./routes/auth";
import { tournamentRoutes, publicTournamentRoutes } from "./routes/tournaments";
import { teamRoutes } from "./routes/teams";
import { groupRoutes } from "./routes/groups";
import { matchRoutes } from "./routes/matches";
import { scheduleRoutes, scheduleTournamentRoutes } from "./routes/schedules";
import { playoffTournamentRoutes, playoffRoutes } from "./routes/playoffs";
import { clubRoutes, publicClubRoutes } from "./routes/club";
import { athleteRoutes, publicAthleteRoutes } from "./routes/athlete";
import { errorHandler } from "./middlewares/errorHandler";
import { generalLimiter, registerLimiter } from "./middlewares/rateLimiter";
import { startStatusSyncJob } from "./jobs/statusSync";
import { startReminderJob } from "./jobs/reminderJob";
import { prisma } from "./lib/prisma";
import { paymentRoutes, webhookRoutes } from "./routes/payments";
import { leagueRoutes, publicLeagueRoutes } from "./routes/leagues";
import { uploadRoutes } from "./routes/upload";

// ─── Sentry (task 2.4) ────────────────────────────────────────────────────────
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 0.1,
  });
  console.log("🔍 Sentry inicializado");
} else {
  console.log("⚠️  SENTRY_DSN não configurado — monitoramento desativado");
}

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(generalLimiter);

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/public/tournaments/:id/register", registerLimiter);
app.use("/api/public/tournaments", publicTournamentRoutes);
app.use("/api/public/leagues", publicLeagueRoutes);
app.use("/api/tournaments", teamRoutes);
app.use("/api/tournaments", groupRoutes);
app.use("/api/tournaments", scheduleTournamentRoutes);
app.use("/api/tournaments", playoffTournamentRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/matches", scheduleRoutes);
app.use("/api/playoffs", playoffRoutes);
app.use("/api/club", clubRoutes);
app.use("/api/public/clubs", publicClubRoutes);
app.use("/api/athlete", athleteRoutes);
app.use("/api/public/athletes", publicAthleteRoutes);

// ─── Pagamentos (task 3.1) ───────────────────────────────────────────────────
app.use("/api/payments", paymentRoutes);
app.use("/api/pay", paymentRoutes);
app.use("/api/leagues", leagueRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/upload", uploadRoutes);

// ─── Health check (task 2.4) ──────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "error",
      db: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── SEO — OG tags dinâmicas (task 4.5) ──────────────────────────────────────
// Bots de redes sociais recebem HTML com meta tags dinâmicas
// Usuários normais são redirecionados para o React app

const BOT_AGENTS = [
  "whatsapp",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "telegrambot",
  "slackbot",
  "discordbot",
  "googlebot",
  "bingbot",
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_AGENTS.some((bot) => ua.includes(bot));
}

function normalizeSport(s: string): string {
  switch (s?.toUpperCase()) {
    case "PADEL":
      return "Padel";
    case "BEACH_TENNIS":
      return "Beach Tennis";
    case "TENIS":
      return "Tênis";
    default:
      return s ?? "";
  }
}

// GET /og/tournaments/:id — serve HTML com OG tags para bots
app.get("/og/tournaments/:id", async (req, res) => {
  try {
    const tournament = await prisma.tournament.findFirst({
      where: {
        id: req.params.id,
        status: { in: ["PUBLISHED", "OPEN", "CLOSED", "ONGOING", "COMPLETED"] },
      },
      include: {
        club: { select: { name: true, city: true, state: true } },
        _count: { select: { teams: true } },
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const canonicalUrl = `${frontendUrl}/tournaments/${req.params.id}`;
    const ogImage = `${frontendUrl}/og-image.png`;

    if (!tournament) {
      return res.redirect(302, canonicalUrl);
    }

    const sport = normalizeSport(tournament.sport as string);
    const city = tournament.club?.city ?? "";
    const startDate = new Date(tournament.startDate).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    );
    const teamsCount = (tournament as any)._count?.teams ?? 0;

    const title = `${tournament.name} — Bubble Padel`;
    const description = `${sport} · ${city} · ${startDate} · ${teamsCount} duplas inscritas. Inscreva-se pelo Bubble Padel!`;

    return res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Bubble Padel">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta http-equiv="refresh" content="0; url=${canonicalUrl}">
</head>
<body>
  <p>Redirecionando para <a href="${canonicalUrl}">${title}</a>...</p>
</body>
</html>`);
  } catch (err) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(302, `${frontendUrl}/tournaments/${req.params.id}`);
  }
});

// Middleware de detecção de bot — intercepta /tournaments/:id ANTES do React
// Redireciona bots para /og/tournaments/:id, usuários seguem normalmente
app.get("/tournaments/:id", (req, res, next) => {
  const ua = req.headers["user-agent"] ?? "";
  if (isBot(ua)) {
    return res.redirect(301, `/og/tournaments/${req.params.id}`);
  }
  next();
});

// ─── Error handler (sempre por último) ───────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  startStatusSyncJob();
  startReminderJob();
});

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL ?? "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS bloqueado: ${origin}`));
      }
    },
    credentials: true,
  }),
);

export default app;
