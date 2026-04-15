import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { prisma } from "../lib/prisma";

type NotificationType =
  | "CONNECTION_REQUEST"
  | "CONNECTION_ACCEPTED"
  | "NEW_MESSAGE"
  | "TOURNAMENT_INVITE"
  | "CLUB_NEW_TOURNAMENT"
  | "BADGE_UNLOCKED"
  | "RANKING_CHANGE";

export const notificationRoutes = Router();

// ─── helper público — usado por outras rotas para criar notificações ──────────

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  payload?: object;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        payload: params.payload ?? undefined,
      },
    });
  } catch (err) {
    console.error("[notification] Erro ao criar notificação:", err);
  }
}

// ─── GET /api/notifications — listar notificações do usuário ─────────────────

notificationRoutes.get(
  "/",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return res.json({ data: notifications });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/notifications/unread-count — contador para badge ───────────────

notificationRoutes.get(
  "/unread-count",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const count = await prisma.notification.count({
        where: { userId: req.userId!, readAt: null },
      });
      return res.json({ data: { count } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── PATCH /api/notifications/:id/read — marcar uma como lida ────────────────

notificationRoutes.patch(
  "/:id/read",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
      });
      if (!notification || notification.userId !== req.userId) {
        return res.status(404).json({ error: "Notificação não encontrada." });
      }

      await prisma.notification.update({
        where: { id: req.params.id },
        data: { readAt: new Date() },
      });

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ─── PATCH /api/notifications/read-all — marcar todas como lidas ─────────────

notificationRoutes.patch(
  "/read-all",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.userId!, readAt: null },
        data: { readAt: new Date() },
      });
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
