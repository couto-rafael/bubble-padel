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

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(generalLimiter);

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/public/tournaments/:id/register", registerLimiter);
app.use("/api/public/tournaments", publicTournamentRoutes);
app.use("/api/tournaments", teamRoutes);
app.use("/api/tournaments", groupRoutes);
app.use("/api/tournaments", scheduleTournamentRoutes); // GET /:id/schedule
app.use("/api/tournaments", playoffTournamentRoutes); // GET/POST/DELETE /:id/playoffs
app.use("/api/matches", matchRoutes);
app.use("/api/matches", scheduleRoutes); // PATCH /:id/schedule
app.use("/api/playoffs", playoffRoutes); // PATCH /matches/:id
app.use("/api/club", clubRoutes);
app.use("/api/public/clubs", publicClubRoutes);
app.use("/api/athlete", athleteRoutes);
app.use("/api/public/athletes", publicAthleteRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler (sempre por último)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  startStatusSyncJob();
});

export default app;
