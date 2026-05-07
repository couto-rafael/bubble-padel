import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { prisma } from "../lib/prisma";

export const feedRoutes = Router();

// ─── GET /api/athlete/feed?cursor=<id>&limit=20 ───────────────────────────────

feedRoutes.get(
  "/feed",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athleteRow = await prisma.athlete.findUnique({
        where: { userId: req.userId! },
        select: { id: true },
      });
      if (!athleteRow)
        return res.status(403).json({ error: "Apenas atletas." });

      const athleteId = athleteRow.id;
      const limit = Math.min(Number(req.query.limit ?? 20), 50);
      const cursor = req.query.cursor as string | undefined;

      // Amigos aceitos nos dois sentidos
      const friendships = await prisma.athleteFriendship.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: athleteId }, { receiverId: athleteId }],
        },
        select: { senderId: true, receiverId: true },
      });

      const friendIds = friendships.map((f) =>
        f.senderId === athleteId ? f.receiverId : f.senderId,
      );

      const ids = [...new Set([...friendIds, athleteId])];

      const posts = await prisma.athletePost.findMany({
        where: { athleteId: { in: ids } },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          athlete: {
            select: {
              id: true,
              fullName: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      });

      const hasMore = posts.length > limit;
      const items = hasMore ? posts.slice(0, limit) : posts;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      return res.json({ data: { posts: items, nextCursor } });
    } catch (err) {
      next(err);
    }
  },
);
