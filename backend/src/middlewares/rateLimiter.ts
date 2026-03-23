import rateLimit from "express-rate-limit";

// ─── Rate limiter geral — todas as rotas públicas ─────────────────────────────
// 100 requisições por minuto por IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas requisições. Tente novamente em alguns minutos.",
  },
  skip: (req) => {
    // Não aplica nas rotas autenticadas (clube) — só nas públicas
    return (
      req.path.startsWith("/api/auth") ||
      (req.path.startsWith("/api/tournaments") && !req.path.includes("public"))
    );
  },
});

// ─── Rate limiter específico — inscrições ────────────────────────────────────
// 5 inscrições por hora por IP (evita spam de inscrições)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas de inscrição. Tente novamente em 1 hora.",
  },
});
