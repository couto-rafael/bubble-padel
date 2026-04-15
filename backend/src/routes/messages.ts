import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { prisma } from "../lib/prisma";
import { createNotification } from "./notifications";

export const messageRoutes = Router();

// ─── POST /api/messages — enviar mensagem ────────────────────────────────────

messageRoutes.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { receiverId, receiverType, content } = req.body as {
      receiverId: string;
      receiverType: "ATHLETE" | "CLUB";
      content: string;
    };

    if (!receiverId || !receiverType || !content?.trim()) {
      return res
        .status(400)
        .json({
          error: "receiverId, receiverType e content são obrigatórios.",
        });
    }

    // Verificar que o destinatário existe
    if (receiverType === "ATHLETE") {
      const athlete = await prisma.athlete.findUnique({
        where: { id: receiverId },
        select: { id: true, userId: true, fullName: true },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado." });

      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        select: { type: true, name: true },
      });
      const senderType = user?.type ?? "ATHLETE";

      const message = await prisma.message.create({
        data: {
          senderId: req.userId!,
          senderType: senderType as any,
          receiverId: athlete.userId,
          receiverType: "ATHLETE",
          content: content.trim(),
        },
      });

      // Notificar receptor
      await createNotification({
        userId: athlete.userId,
        type: "NEW_MESSAGE",
        title: "Nova mensagem",
        body: `${user?.name ?? "Alguém"} te enviou uma mensagem.`,
        payload: { senderId: req.userId, messageId: message.id },
      });

      return res.status(201).json({ data: message });
    }

    if (receiverType === "CLUB") {
      const club = await prisma.club.findUnique({
        where: { id: receiverId },
        select: { id: true, userId: true, name: true },
      });
      if (!club)
        return res.status(404).json({ error: "Clube não encontrado." });

      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        select: { type: true, name: true },
      });
      const senderType = user?.type ?? "ATHLETE";

      const message = await prisma.message.create({
        data: {
          senderId: req.userId!,
          senderType: senderType as any,
          receiverId: club.userId,
          receiverType: "CLUB",
          content: content.trim(),
        },
      });

      await createNotification({
        userId: club.userId,
        type: "NEW_MESSAGE",
        title: "Nova mensagem",
        body: `${user?.name ?? "Alguém"} te enviou uma mensagem.`,
        payload: { senderId: req.userId, messageId: message.id },
      });

      return res.status(201).json({ data: message });
    }

    return res.status(400).json({ error: "receiverType inválido." });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/messages/inbox — inbox do usuário ──────────────────────────────

messageRoutes.get(
  "/inbox",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      // Agrupa por thread (senderId + receiverId)
      const messages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: req.userId! }, { receiverId: req.userId! }],
        },
        orderBy: { createdAt: "desc" },
      });

      // Agrupar por contato
      const threadMap = new Map<string, (typeof messages)[0]>();
      for (const msg of messages) {
        const contactId =
          msg.senderId === req.userId ? msg.receiverId : msg.senderId;
        if (!threadMap.has(contactId)) threadMap.set(contactId, msg);
      }

      // Enriquecer com nome do contato
      const threads = await Promise.all(
        Array.from(threadMap.entries()).map(
          async ([contactUserId, lastMsg]) => {
            const contactUser = await prisma.user.findUnique({
              where: { id: contactUserId },
              select: {
                id: true,
                name: true,
                type: true,
                athlete: { select: { avatarUrl: true } },
                club: { select: { logoUrl: true } },
              },
            });
            const unread = await prisma.message.count({
              where: {
                senderId: contactUserId,
                receiverId: req.userId!,
                readAt: null,
              },
            });
            return {
              contactUserId,
              contactName: contactUser?.name ?? "—",
              contactType: contactUser?.type,
              avatarUrl:
                contactUser?.athlete?.avatarUrl ??
                contactUser?.club?.logoUrl ??
                null,
              lastMessage: lastMsg.content,
              lastAt: lastMsg.createdAt,
              unreadCount: unread,
            };
          },
        ),
      );

      return res.json({
        data: threads.sort(
          (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
        ),
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/messages/thread/:userId — conversa com usuário ─────────────────

messageRoutes.get(
  "/thread/:userId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: req.userId!, receiverId: req.params.userId },
            { senderId: req.params.userId, receiverId: req.userId! },
          ],
        },
        orderBy: { createdAt: "asc" },
      });

      // Marcar como lidas
      await prisma.message.updateMany({
        where: {
          senderId: req.params.userId,
          receiverId: req.userId!,
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      return res.json({ data: messages });
    } catch (err) {
      next(err);
    }
  },
);

// ─── PATCH /api/messages/:id/read — marcar uma mensagem como lida ────────────

messageRoutes.patch(
  "/:id/read",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const msg = await prisma.message.findUnique({
        where: { id: req.params.id },
      });
      if (!msg || msg.receiverId !== req.userId)
        return res.status(404).json({ error: "Mensagem não encontrada." });

      await prisma.message.update({
        where: { id: req.params.id },
        data: { readAt: new Date() },
      });
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
