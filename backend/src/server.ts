import express from "express";
import cors from "cors";
import { authRoutes } from "./routes/auth";
import { tournamentRoutes } from "./routes/tournaments";
import { teamRoutes } from "./routes/teams";
import { groupRoutes } from "./routes/groups";
import { matchRoutes } from "./routes/matches";
import { scheduleRoutes } from "./routes/schedules";
import { errorHandler } from "./middlewares/errorHandler";

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

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/tournaments", teamRoutes);
app.use("/api/tournaments", groupRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/matches", scheduleRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler (sempre por último)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

export default app;
