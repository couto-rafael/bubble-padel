import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { prisma } from "../lib/prisma";
import { createNotification } from "./notifications";

export const socialRoutes = Router();

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getAthleteId(userId: string): Promise<string | null> {
  const a = await prisma.athlete.findUnique({
    where: { userId },
    select: { id: true },
  });
  return a?.id ?? null;
}

// ─── POST /api/social/connect/:athleteId — enviar convite de conexão ─────────

socialRoutes.post(
  "/connect/:athleteId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const senderId = await getAthleteId(req.userId!);
      if (!senderId)
        return res
          .status(403)
          .json({ error: "Apenas atletas podem conectar." });

      const receiverId = req.params.athleteId;
      if (senderId === receiverId)
        return res
          .status(400)
          .json({ error: "Não pode conectar consigo mesmo." });

      const receiver = await prisma.athlete.findUnique({
        where: { id: receiverId },
        select: { id: true, fullName: true, userId: true },
      });
      if (!receiver)
        return res.status(404).json({ error: "Atleta não encontrado." });

      const existing = await prisma.athleteFriendship.findFirst({
        where: {
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
      });
      if (existing)
        return res
          .status(400)
          .json({ error: "Convite já existe ou já são conectados." });

      const friendship = await prisma.athleteFriendship.create({
        data: { senderId, receiverId, status: "PENDING" },
      });

      // Notificar o receptor
      const senderAthlete = await prisma.athlete.findUnique({
        where: { id: senderId },
        select: { fullName: true },
      });
      await createNotification({
        userId: receiver.userId,
        type: "CONNECTION_REQUEST",
        title: "Novo pedido de conexão",
        body: `${senderAthlete?.fullName ?? "Um atleta"} quer se conectar com você.`,
        payload: { friendshipId: friendship.id, senderId },
      });

      return res.status(201).json({ data: friendship });
    } catch (err) {
      next(err);
    }
  },
);

// ─── PATCH /api/social/connect/:friendshipId — aceitar ou rejeitar ───────────

socialRoutes.patch(
  "/connect/:friendshipId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athleteId = await getAthleteId(req.userId!);
      if (!athleteId) return res.status(403).json({ error: "Apenas atletas." });

      const { action } = req.body as { action: "accept" | "reject" };
      if (!["accept", "reject"].includes(action))
        return res
          .status(400)
          .json({ error: "action deve ser accept ou reject." });

      const friendship = await prisma.athleteFriendship.findUnique({
        where: { id: req.params.friendshipId },
      });
      if (!friendship)
        return res.status(404).json({ error: "Convite não encontrado." });
      if (friendship.receiverId !== athleteId)
        return res.status(403).json({ error: "Sem permissão." });
      if (friendship.status !== "PENDING")
        return res.status(400).json({ error: "Convite já processado." });

      const updated = await prisma.athleteFriendship.update({
        where: { id: friendship.id },
        data: {
          status: action === "accept" ? "ACCEPTED" : "REJECTED",
          ...(action === "accept" ? { acceptedAt: new Date() } : {}),
        },
      });

      if (action === "accept") {
        const sender = await prisma.athlete.findUnique({
          where: { id: friendship.senderId },
          select: { userId: true },
        });
        const receiverAthlete = await prisma.athlete.findUnique({
          where: { id: athleteId },
          select: { fullName: true },
        });
        if (sender) {
          await createNotification({
            userId: sender.userId,
            type: "CONNECTION_ACCEPTED",
            title: "Conexão aceita!",
            body: `${receiverAthlete?.fullName ?? "Um atleta"} aceitou sua conexão.`,
            payload: { athleteId },
          });
        }
      }

      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /api/social/connect/:athleteId — desfazer conexão ────────────────

socialRoutes.delete(
  "/connect/:athleteId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const myId = await getAthleteId(req.userId!);
      if (!myId) return res.status(403).json({ error: "Apenas atletas." });

      const otherId = req.params.athleteId;
      await prisma.athleteFriendship.deleteMany({
        where: {
          OR: [
            { senderId: myId, receiverId: otherId },
            { senderId: otherId, receiverId: myId },
          ],
        },
      });

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/social/connections — listar conexões aceitas ───────────────────

socialRoutes.get(
  "/connections",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const myId = await getAthleteId(req.userId!);
      if (!myId) return res.status(403).json({ error: "Apenas atletas." });

      const friendships = await prisma.athleteFriendship.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: myId }, { receiverId: myId }],
        },
        include: {
          sender: {
            select: { id: true, fullName: true, avatarUrl: true, city: true },
          },
          receiver: {
            select: { id: true, fullName: true, avatarUrl: true, city: true },
          },
        },
      });

      const connections = friendships.map((f: (typeof friendships)[0]) => ({
        friendshipId: f.id,
        athlete: f.senderId === myId ? f.receiver : f.sender,
      }));

      return res.json({ data: connections });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/social/pending — convites pendentes recebidos ──────────────────

socialRoutes.get(
  "/pending",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const myId = await getAthleteId(req.userId!);
      if (!myId) return res.status(403).json({ error: "Apenas atletas." });

      const pending = await prisma.athleteFriendship.findMany({
        where: { receiverId: myId, status: "PENDING" },
        include: {
          sender: {
            select: { id: true, fullName: true, avatarUrl: true, city: true },
          },
        },
      });

      return res.json({ data: pending });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/social/status/:athleteId — status da relação com atleta ────────

socialRoutes.get(
  "/status/:athleteId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const myId = await getAthleteId(req.userId!);
      if (!myId) return res.json({ data: { status: "none" } });

      const otherId = req.params.athleteId;
      const friendship = await prisma.athleteFriendship.findFirst({
        where: {
          OR: [
            { senderId: myId, receiverId: otherId },
            { senderId: otherId, receiverId: myId },
          ],
        },
      });

      if (!friendship) return res.json({ data: { status: "none" } });

      return res.json({
        data: {
          status: friendship.status.toLowerCase(), // pending | accepted | rejected
          friendshipId: friendship.id,
          isSender: friendship.senderId === myId,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/social/connections/count — total de conexões aceitas ───────────

socialRoutes.get(
  "/connections/count",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const myId = await getAthleteId(req.userId!);
      if (!myId) return res.json({ data: { count: 0 } });

      const count = await prisma.athleteFriendship.count({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: myId }, { receiverId: myId }],
        },
      });

      return res.json({ data: { count } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/social/follow/club/:clubId — seguir clube ─────────────────────

socialRoutes.post(
  "/follow/club/:clubId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athleteId = await getAthleteId(req.userId!);
      if (!athleteId)
        return res
          .status(403)
          .json({ error: "Apenas atletas podem seguir clubes." });

      const clubId = req.params.clubId;
      const club = await prisma.club.findUnique({
        where: { id: clubId },
        select: { id: true },
      });
      if (!club)
        return res.status(404).json({ error: "Clube não encontrado." });

      const follow = await prisma.athleteFollowsClub.upsert({
        where: { athleteId_clubId: { athleteId, clubId } },
        create: { athleteId, clubId },
        update: {},
      });

      return res.status(201).json({ data: follow });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /api/social/follow/club/:clubId — deixar de seguir clube ─────────

socialRoutes.delete(
  "/follow/club/:clubId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athleteId = await getAthleteId(req.userId!);
      if (!athleteId) return res.status(403).json({ error: "Apenas atletas." });

      await prisma.athleteFollowsClub.deleteMany({
        where: { athleteId, clubId: req.params.clubId },
      });

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/social/following/clubs — clubes que o atleta segue ─────────────

socialRoutes.get(
  "/following/clubs",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athleteId = await getAthleteId(req.userId!);
      if (!athleteId) return res.status(403).json({ error: "Apenas atletas." });

      const following = await prisma.athleteFollowsClub.findMany({
        where: { athleteId },
        include: {
          club: { select: { id: true, name: true, logoUrl: true, city: true } },
        },
      });

      return res.json({
        data: following.map((f: (typeof following)[0]) => f.club),
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/social/follow/club/:clubId/status — está seguindo? ─────────────

socialRoutes.get(
  "/follow/club/:clubId/status",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athleteId = await getAthleteId(req.userId!);
      if (!athleteId) return res.json({ data: { following: false } });

      const follow = await prisma.athleteFollowsClub.findUnique({
        where: { athleteId_clubId: { athleteId, clubId: req.params.clubId } },
      });

      return res.json({ data: { following: !!follow } });
    } catch (err) {
      next(err);
    }
  },
);
