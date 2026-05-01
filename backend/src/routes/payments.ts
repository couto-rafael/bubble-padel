import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { prisma } from "../lib/prisma";
import {
  createPixCharge,
  checkPixStatus,
  processWebhook,
  simulatePayment,
} from "../services/PaymentService";

export const paymentRoutes = Router();
export const webhookRoutes = Router();

// ─── POST /api/payments/pix/create ───────────────────────────────────────────
// Cria cobrança PIX para um jogador de uma dupla inscrita
// Chamado pelo atleta logado após se inscrever num torneio pago
paymentRoutes.post(
  "/pix/create",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { teamId, playerNumber } = req.body as {
        teamId: string;
        playerNumber: 1 | 2;
      };

      if (!teamId || ![1, 2].includes(playerNumber)) {
        return res
          .status(400)
          .json({ error: "teamId e playerNumber (1 ou 2) são obrigatórios" });
      }

      // Busca a dupla com dados do torneio
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              priceFirstCategory: true,
              tournamentType: true,
            },
          },
        },
      });

      if (!team) return res.status(404).json({ error: "Dupla não encontrada" });

      const playerName =
        playerNumber === 1 ? team.player1Name : team.player2Name;
      const playerEmail =
        playerNumber === 1 ? team.player1Email : team.player2Email;

      // Super 8: valor integral por atleta; duplas: metade (em centavos)
      const isSuper8 = team.tournament.tournamentType === "Super 8";
      const amountCents = Math.round((isSuper8 ? team.amount : team.amount / 2) * 100);

      if (amountCents <= 0) {
        return res
          .status(400)
          .json({ error: "Valor da inscrição deve ser maior que zero" });
      }

      const result = await createPixCharge({
        teamId,
        tournamentId: team.tournament.id,
        playerNumber,
        playerName,
        playerEmail,
        amountCents,
        tournamentName: team.tournament.name,
        category: team.category,
      });

      return res.json({ data: result });
    } catch (err: any) {
      next(err);
    }
  },
);

// ─── GET /api/payments/pix/status/:billingId ──────────────────────────────────
// Verifica status de uma cobrança (polling do frontend)
paymentRoutes.get("/pix/status/:billingId", async (req, res, next) => {
  try {
    const { billingId } = req.params;
    const status = await checkPixStatus(billingId);
    return res.json({ data: { status } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/payments/pix/simulate/:billingId ───────────────────────────────
// Simula pagamento em dev mode (sem AbacatePay real)
paymentRoutes.post("/pix/simulate/:billingId", async (req, res, next) => {
  try {
    await simulatePayment(req.params.billingId);
    return res.json({ data: { ok: true } });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/payments/team/:teamId ───────────────────────────────────────────
// Retorna status de pagamento dos dois jogadores de uma dupla
// Usado pelo dashboard do clube — mantém verificação de ownership
paymentRoutes.get(
  "/team/:teamId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const team = await prisma.team.findUnique({
        where: { id: req.params.teamId },
        include: {
          payments: true,
          tournament: { select: { clubId: true } },
        },
      });

      if (!team) return res.status(404).json({ error: "Dupla não encontrada" });
      if (team.tournament.clubId !== req.clubId) {
        return res.status(403).json({ error: "Sem permissão" });
      }

      return res.json({
        data: {
          teamId: team.id,
          status: team.status,
          player1: {
            name: team.player1Name,
            email: team.player1Email,
            paymentStatus: team.player1PaymentStatus,
            chargeId: team.player1ChargeId,
          },
          player2: {
            name: team.player2Name,
            email: team.player2Email,
            paymentStatus: team.player2PaymentStatus,
            chargeId: team.player2ChargeId,
          },
          payments: team.payments,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/webhooks/abacatepay ────────────────────────────────────────────
// Recebe notificação do AbacatePay quando pagamento é confirmado
webhookRoutes.post("/abacatepay", async (req, res, next) => {
  try {
    // Responde imediatamente para não dar timeout no AbacatePay
    res.status(200).json({ ok: true });

    // Processa de forma assíncrona
    processWebhook(req.body).catch((err) =>
      console.error("[webhook] Erro no processamento:", err),
    );
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/pay/:token — rota pública para o Jogador 2 ─────────────────────
paymentRoutes.get("/pay/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { paymentToken: token },
      include: {
        team: {
          include: {
            tournament: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Link inválido ou expirado." });
    }

    // Gera cobrança no AbacatePay se ainda não tem billingId
    let billingUrl = "";
    let billingId = payment.externalId ?? "";

    if (!payment.externalId && payment.status === "PENDING") {
      const { createPixCharge } = await import("../services/PaymentService");
      const result = await createPixCharge({
        teamId: payment.teamId,
        tournamentId: payment.tournamentId,
        playerNumber: payment.playerNumber as 1 | 2,
        playerName: payment.team.player2Name,
        playerEmail: payment.playerEmail,
        amountCents: Math.round(payment.amount * 100),
        tournamentName: payment.team.tournament.name,
        category: payment.team.category,
      });
      billingUrl = result.billingUrl;
      billingId = result.billingId;
    } else {
      billingUrl = `https://abacatepay.com/pay/${billingId}`;
    }

    return res.json({
      data: {
        playerName:
          payment.playerNumber === 2
            ? payment.team.player2Name
            : payment.team.player1Name,
        playerEmail: payment.playerEmail,
        tournamentName: payment.team.tournament.name,
        category: payment.team.category,
        amount: payment.amount,
        status: payment.status,
        billingUrl,
        billingId,
        teamId: payment.teamId,
        tournamentId: payment.tournamentId,
      },
    });
  } catch (err) {
    next(err);
  }
});
