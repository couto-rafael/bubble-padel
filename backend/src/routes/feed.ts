import { Router } from "express";
import { z } from "zod";
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
          _count: { select: { likes: true } },
        },
      });

      const hasMore = posts.length > limit;
      const items = hasMore ? posts.slice(0, limit) : posts;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      const myLikes = await prisma.postLike.findMany({
        where: {
          athleteId,
          postId: { in: items.map((p) => p.id) },
        },
        select: { postId: true },
      });
      const likedSet = new Set(myLikes.map((l) => l.postId));

      const enriched = items.map(({ _count, ...p }) => ({
        ...p,
        likeCount: _count?.likes ?? 0,
        likedByMe: likedSet.has(p.id),
      }));

      return res.json({ data: { posts: enriched, nextCursor } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/athlete/posts ──────────────────────────────────────────────────

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
});

feedRoutes.post(
  "/posts",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const body = createPostSchema.safeParse(req.body);
      if (!body.success)
        return res.status(400).json({ error: body.error.flatten() });

      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId! },
        select: { id: true },
      });
      if (!athlete)
        return res.status(404).json({ error: "Atleta não encontrado" });

      const post = await prisma.athletePost.create({
        data: {
          athleteId: athlete.id,
          type: "MANUAL",
          content: body.data.content.trim(),
        },
        include: {
          athlete: {
            select: { id: true, fullName: true, nickname: true, avatarUrl: true },
          },
        },
      });

      return res.status(201).json({ data: post });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/athlete/posts/:postId/like ─────────────────────────────────────

feedRoutes.post(
  "/posts/:postId/like",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId! },
        select: { id: true },
      });
      if (!athlete) return res.status(404).json({ error: "Atleta não encontrado" });

      const post = await prisma.athletePost.findUnique({
        where: { id: req.params.postId },
        select: { id: true },
      });
      if (!post) return res.status(404).json({ error: "Post não encontrado" });

      await prisma.postLike.upsert({
        where: {
          postId_athleteId: {
            postId: post.id,
            athleteId: athlete.id,
          },
        },
        create: { postId: post.id, athleteId: athlete.id },
        update: {},
      });

      const likeCount = await prisma.postLike.count({ where: { postId: post.id } });
      return res.json({ data: { liked: true, likeCount } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /api/athlete/posts/:postId/like ───────────────────────────────────

feedRoutes.delete(
  "/posts/:postId/like",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const athlete = await prisma.athlete.findUnique({
        where: { userId: req.userId! },
        select: { id: true },
      });
      if (!athlete) return res.status(404).json({ error: "Atleta não encontrado" });

      await prisma.postLike.deleteMany({
        where: { postId: req.params.postId, athleteId: athlete.id },
      });

      const likeCount = await prisma.postLike.count({ where: { postId: req.params.postId } });
      return res.json({ data: { liked: false, likeCount } });
    } catch (err) {
      next(err);
    }
  },
);
