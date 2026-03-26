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
import { prisma } from "./lib/prisma";
import { paymentRoutes, webhookRoutes } from "./routes/payments";

// ─── Sentry (task 2.4) ────────────────────────────────────────────────────────
// Inicializar ANTES de qualquer outro middleware
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 0.1, // 10% das transações
  });
  console.log("🔍 Sentry inicializado");
} else {
  console.log("⚠️  SENTRY_DSN não configurado — monitoramento desativado");
}

const app = express();
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
app.use("/api/pay", paymentRoutes); // rota pública: GET /api/pay/:token
app.use("/api/webhooks", webhookRoutes);

// ─── Health check (task 2.4) ──────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    // Verifica conexão com o banco
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

// ─── Error handler (sempre por último) ───────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  startStatusSyncJob();
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
