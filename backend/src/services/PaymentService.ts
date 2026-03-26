import { prisma } from "../lib/prisma";
import { randomBytes } from "crypto";
import { sendInscricaoConfirmada, sendPixParaParceiro } from "./EmailService";

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY ?? "";
const ABACATEPAY_BASE_URL = "https://api.abacatepay.com/v1";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const DEV_MODE = !ABACATEPAY_API_KEY;

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface AbacatePayBilling {
  id: string;
  url: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "REFUNDED";
  amount: number;
  devMode: boolean;
}

interface CreatePixParams {
  teamId: string;
  tournamentId: string;
  playerNumber: 1 | 2;
  playerName: string;
  playerEmail: string;
  amountCents: number; // valor em centavos
  tournamentName: string;
  category: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function abacateRequest(
  method: "GET" | "POST",
  path: string,
  body?: object,
): Promise<any> {
  const res = await fetch(`${ABACATEPAY_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(
      `AbacatePay error: ${json.error ?? res.statusText} (${res.status})`,
    );
  }

  return json.data;
}

// ─── FUNÇÕES PÚBLICAS ─────────────────────────────────────────────────────────

/**
 * Cria uma cobrança PIX no AbacatePay para um atleta.
 * Salva no banco e retorna o ID e URL de pagamento.
 */
export async function createPixCharge(params: CreatePixParams): Promise<{
  paymentId: string;
  billingUrl: string;
  billingId: string;
}> {
  const {
    teamId,
    tournamentId,
    playerNumber,
    playerName,
    playerEmail,
    amountCents,
    tournamentName,
    category,
  } = params;

  // Verifica se já existe cobrança ativa para esse jogador
  const existing = await prisma.payment.findUnique({
    where: { teamId_playerNumber: { teamId, playerNumber } },
  });

  if (existing?.status === "PAID") {
    throw new Error("Este jogador já realizou o pagamento.");
  }

  let billingId: string;
  let billingUrl: string;
  let expiresAt: Date;

  if (DEV_MODE) {
    // Modo desenvolvimento — simula cobrança sem chamar API
    billingId = `dev_bill_${Date.now()}_p${playerNumber}`;
    billingUrl = `${FRONTEND_URL}/tournaments/${tournamentId}?payment=simulated`;
    expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    console.log(
      `[PIX DEV] Cobrança simulada para ${playerEmail}: R$ ${(amountCents / 100).toFixed(2)}`,
    );
  } else {
    // Produção — chama AbacatePay
    const completionUrl = `${FRONTEND_URL}/tournaments/${tournamentId}?payment=success&player=${playerNumber}`;
    const returnUrl = `${FRONTEND_URL}/tournaments/${tournamentId}`;

    const billing: AbacatePayBilling = await abacateRequest(
      "POST",
      "/billing/create",
      {
        frequency: "ONE_TIME",
        methods: ["PIX"],
        products: [
          {
            externalId: `${teamId}_p${playerNumber}`,
            name: `Inscrição ${tournamentName} — ${category}`,
            description: `Atleta: ${playerName}`,
            quantity: 1,
            price: amountCents,
          },
        ],
        returnUrl,
        completionUrl,
        customer: {
          name: playerName,
          email: playerEmail,
        },
        externalId: `${teamId}_p${playerNumber}`,
        metadata: {
          teamId,
          tournamentId,
          playerNumber: String(playerNumber),
        },
      },
    );

    billingId = billing.id;
    billingUrl = billing.url;
    expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  }

  // Upsert no banco
  const payment = await prisma.payment.upsert({
    where: { teamId_playerNumber: { teamId, playerNumber } },
    create: {
      teamId,
      tournamentId,
      playerNumber,
      playerEmail,
      amount: amountCents / 100,
      status: "PENDING",
      externalId: billingId,
      expiresAt,
    },
    update: {
      status: "PENDING",
      externalId: billingId,
      expiresAt,
    },
  });

  // Atualiza chargeId no Team
  await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(playerNumber === 1
        ? { player1ChargeId: billingId }
        : { player2ChargeId: billingId }),
    },
  });

  // Se é o Jogador 1 que acabou de pagar → gera token e envia email para o Jogador 2
  if (playerNumber === 1) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (team) {
      const token = randomBytes(32).toString("hex");
      // Cria (ou upsert) cobrança para o Jogador 2 com token
      const p2Amount = amountCents / 100;
      await prisma.payment.upsert({
        where: { teamId_playerNumber: { teamId, playerNumber: 2 } },
        create: {
          teamId,
          tournamentId,
          playerNumber: 2,
          playerEmail: team.player2Email,
          amount: p2Amount,
          status: "PENDING",
          paymentToken: token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        },
        update: {
          paymentToken: token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Envia email para o Jogador 2 com link de pagamento
      const payLink = `${FRONTEND_URL}/pay/${token}`;
      sendPixParaParceiro({
        player2Email: team.player2Email,
        player2Name: team.player2Name,
        player1Name: team.player1Name,
        tournamentName: params.tournamentName,
        category: params.category,
        amount: p2Amount,
        payLink,
      }).catch((err) => console.error("[email] email parceiro falhou:", err));
    }
  }

  return {
    paymentId: payment.id,
    billingUrl,
    billingId,
  };
}

/**
 * Verifica o status de uma cobrança no AbacatePay.
 */
export async function checkPixStatus(billingId: string): Promise<string> {
  if (DEV_MODE) {
    const payment = await prisma.payment.findFirst({
      where: { externalId: billingId },
    });
    return payment?.status ?? "PENDING";
  }

  const billing: AbacatePayBilling = await abacateRequest(
    "GET",
    `/billing/check?id=${billingId}`,
  );
  return billing.status;
}

/**
 * Processa o webhook do AbacatePay quando um pagamento é confirmado.
 * Idempotente — pode ser chamado múltiplas vezes sem efeito colateral.
 */
export async function processWebhook(payload: any): Promise<void> {
  const billingId: string = payload?.data?.billing?.id ?? payload?.data?.id;
  const status: string =
    payload?.data?.billing?.status ?? payload?.data?.status;

  if (!billingId || !status) {
    console.error("[webhook] Payload inválido:", JSON.stringify(payload));
    return;
  }

  // Busca o payment pelo externalId
  const payment = await prisma.payment.findFirst({
    where: { externalId: billingId },
    include: {
      team: {
        include: {
          tournament: { select: { name: true, startDate: true, id: true } },
        },
      },
    },
  });

  if (!payment) {
    console.error(
      "[webhook] Payment não encontrado para billingId:",
      billingId,
    );
    return;
  }

  // Já processado — idempotência
  if (payment.status === "PAID" && status === "PAID") {
    console.log("[webhook] Já processado:", billingId);
    return;
  }

  const newStatus =
    status === "PAID"
      ? "PAID"
      : status === "EXPIRED" || status === "CANCELLED"
        ? "EXPIRED"
        : "PENDING";

  // Atualiza payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus as any,
      paidAt: newStatus === "PAID" ? new Date() : undefined,
    },
  });

  // Atualiza playerPaymentStatus no Team
  const playerField =
    payment.playerNumber === 1
      ? "player1PaymentStatus"
      : "player2PaymentStatus";

  await prisma.team.update({
    where: { id: payment.teamId },
    data: { [playerField]: newStatus as any },
  });

  // Se ambos pagaram → CONFIRMED
  if (newStatus === "PAID") {
    const team = await prisma.team.findUnique({
      where: { id: payment.teamId },
    });

    if (
      team?.player1PaymentStatus === "PAID" &&
      team?.player2PaymentStatus === "PAID"
    ) {
      await prisma.team.update({
        where: { id: payment.teamId },
        data: { status: "CONFIRMED" },
      });

      // Email de confirmação para os dois atletas
      const tournament = payment.team.tournament;
      const tournamentDate = new Date(tournament.startDate).toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "long", year: "numeric" },
      );

      sendInscricaoConfirmada({
        player1Name: payment.team.player1Name,
        player2Name: payment.team.player2Name,
        player1Email: payment.team.player1Email,
        player2Email: payment.team.player2Email,
        tournamentName: tournament.name,
        tournamentDate,
        category: payment.team.category,
        tournamentId: tournament.id,
      }).catch((err) => console.error("[webhook] Email falhou:", err));

      console.log(
        `[webhook] Dupla ${payment.teamId} CONFIRMADA — ambos pagaram`,
      );
    }
  }

  console.log(
    `[webhook] Payment ${billingId} → ${newStatus} (jogador ${payment.playerNumber})`,
  );
}

/**
 * Simula pagamento em modo dev (sem AbacatePay real).
 * Chama processWebhook internamente.
 */
export async function simulatePayment(billingId: string): Promise<void> {
  if (!DEV_MODE) throw new Error("simulatePayment só disponível em dev mode");

  await processWebhook({
    data: { id: billingId, status: "PAID" },
  });
  console.log(`[PIX DEV] Pagamento simulado para: ${billingId}`);
}
